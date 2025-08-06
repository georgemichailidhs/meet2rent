import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/database/config';
import { messages, users, properties } from '@/lib/database/schema';
import { eq, and, or, desc } from 'drizzle-orm';

// Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { receiverId, content, propertyId, conversationId } = body;

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }

    // Verify receiver exists
    const receiver = await db
      .select()
      .from(users)
      .where(eq(users.id, receiverId))
      .limit(1);

    if (!receiver[0]) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Create message
    const newMessage = await db.insert(messages).values({
      senderId: session.user.id,
      receiverId: receiverId,
      content: content.trim(),
      propertyId: propertyId || null,
      conversationId: conversationId || `${session.user.id}-${receiverId}`,
      isRead: false,
    }).returning();

    // Get sender info for response
    const sender = await db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        message: {
          ...newMessage[0],
          sender: sender[0],
          receiver: {
            id: receiver[0].id,
            name: receiver[0].name,
            image: receiver[0].image,
          },
        },
      },
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Get conversations for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const propertyId = searchParams.get('propertyId');

    if (conversationId) {
      // Get messages for specific conversation
      const conversationMessages = await db
        .select({
          id: messages.id,
          content: messages.content,
          isRead: messages.isRead,
          createdAt: messages.createdAt,
          senderId: messages.senderId,
          receiverId: messages.receiverId,
          propertyId: messages.propertyId,
          sender: {
            id: users.id,
            name: users.name,
            image: users.image,
          },
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(
          and(
            eq(messages.conversationId, conversationId),
            or(
              eq(messages.senderId, session.user.id),
              eq(messages.receiverId, session.user.id)
            )
          )
        )
        .orderBy(messages.createdAt);

      // Mark messages as read if user is receiver
      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.receiverId, session.user.id),
            eq(messages.isRead, false)
          )
        );

      return NextResponse.json({
        success: true,
        data: {
          messages: conversationMessages,
        },
      });
    } else {
      // Get all conversations for user
      const userConversations = await db
        .select({
          conversationId: messages.conversationId,
          lastMessage: messages.content,
          lastMessageAt: messages.createdAt,
          isRead: messages.isRead,
          otherUserId: messages.senderId,
          propertyId: messages.propertyId,
          otherUser: {
            id: users.id,
            name: users.name,
            image: users.image,
          },
          property: {
            id: properties.id,
            title: properties.title,
            mainImage: properties.mainImage,
          },
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .leftJoin(properties, eq(messages.propertyId, properties.id))
        .where(
          or(
            eq(messages.senderId, session.user.id),
            eq(messages.receiverId, session.user.id)
          )
        )
        .orderBy(desc(messages.createdAt));

      // Group by conversation and get latest message for each
      const conversationsMap = new Map();

      userConversations.forEach((msg) => {
        const otherUserId = msg.otherUserId === session.user.id
          ? msg.receiverId
          : msg.otherUserId;

        const conversationKey = msg.conversationId;

        if (!conversationsMap.has(conversationKey) ||
            conversationsMap.get(conversationKey).lastMessageAt < msg.lastMessageAt) {
          conversationsMap.set(conversationKey, {
            conversationId: msg.conversationId,
            otherUser: msg.otherUser,
            property: msg.property,
            lastMessage: msg.lastMessage,
            lastMessageAt: msg.lastMessageAt,
            isRead: msg.isRead,
            unreadCount: 0, // Will be calculated separately
          });
        }
      });

      // Get unread counts for each conversation
      for (const [conversationId, conversation] of conversationsMap.entries()) {
        const unreadCount = await db
          .select({ count: messages.id })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conversationId),
              eq(messages.receiverId, session.user.id),
              eq(messages.isRead, false)
            )
          );

        conversation.unreadCount = unreadCount.length;
      }

      return NextResponse.json({
        success: true,
        data: {
          conversations: Array.from(conversationsMap.values()),
        },
      });
    }

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
