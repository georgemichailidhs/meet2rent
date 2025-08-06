import { Server as NetServer } from 'http';
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from './database/config';
import { messages, users } from './database/schema';
import { eq } from 'drizzle-orm';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export interface ServerToClientEvents {
  'message:receive': (message: {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    conversationId: string;
    createdAt: string;
    sender: {
      id: string;
      name: string;
      image?: string;
    };
  }) => void;
  'message:read': (data: { messageId: string; conversationId: string }) => void;
  'user:online': (data: { userId: string; status: 'online' | 'offline' }) => void;
  'typing:start': (data: { userId: string; conversationId: string }) => void;
  'typing:stop': (data: { userId: string; conversationId: string }) => void;
  'notification': (data: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) => void;
}

export interface ClientToServerEvents {
  'message:send': (data: {
    content: string;
    receiverId: string;
    conversationId: string;
    propertyId?: string;
  }) => void;
  'message:read': (data: { messageId: string; conversationId: string }) => void;
  'typing:start': (data: { conversationId: string }) => void;
  'typing:stop': (data: { conversationId: string }) => void;
  'user:join': (data: { userId: string }) => void;
  'user:leave': () => void;
}

export interface InterServerEvents {
  // Add any server-to-server events here if needed
}

export interface SocketData {
  userId?: string;
  userType?: string;
  rooms?: string[];
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export function createSocketIOServer(server: NetServer): SocketIOServer {
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Store online users
  const onlineUsers = new Map<string, string>(); // userId -> socketId

  io.on('connection', async (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Handle user authentication and join
    socket.on('user:join', async (data) => {
      try {
        // TODO: Verify user session/token here if needed
        socket.data.userId = data.userId;
        onlineUsers.set(data.userId, socket.id);

        // Join user-specific room
        await socket.join(`user:${data.userId}`);

        // Get user's conversations to join those rooms
        const userMessages = await db
          .select({ conversationId: messages.conversationId })
          .from(messages)
          .where(eq(messages.senderId, data.userId))
          .groupBy(messages.conversationId);

        const receivedMessages = await db
          .select({ conversationId: messages.conversationId })
          .from(messages)
          .where(eq(messages.receiverId, data.userId))
          .groupBy(messages.conversationId);

        const conversationIds = [
          ...userMessages.map(m => m.conversationId),
          ...receivedMessages.map(m => m.conversationId)
        ];

        // Join conversation rooms
        for (const conversationId of conversationIds) {
          await socket.join(`conversation:${conversationId}`);
        }

        // Notify others that user is online
        socket.broadcast.emit('user:online', {
          userId: data.userId,
          status: 'online'
        });

        console.log(`👤 User ${data.userId} joined with socket ${socket.id}`);
      } catch (error) {
        console.error('Error handling user join:', error);
      }
    });

    // Handle sending messages
    socket.on('message:send', async (data) => {
      try {
        if (!socket.data.userId) {
          console.error('Unauthorized message send attempt');
          return;
        }

        // Save message to database
        const newMessage = await db.insert(messages).values({
          senderId: socket.data.userId,
          receiverId: data.receiverId,
          content: data.content.trim(),
          conversationId: data.conversationId,
          propertyId: data.propertyId || null,
          isRead: false,
        }).returning();

        // Get sender info
        const sender = await db
          .select({
            id: users.id,
            name: users.name,
            image: users.image,
          })
          .from(users)
          .where(eq(users.id, socket.data.userId))
          .limit(1);

        if (newMessage[0] && sender[0]) {
          const messageData = {
            id: newMessage[0].id,
            content: newMessage[0].content,
            senderId: newMessage[0].senderId,
            receiverId: newMessage[0].receiverId,
            conversationId: newMessage[0].conversationId,
            createdAt: newMessage[0].createdAt.toISOString(),
            sender: sender[0],
          };

          // Send to conversation room
          io.to(`conversation:${data.conversationId}`).emit('message:receive', messageData);

          // Send push notification to receiver if offline
          const receiverSocketId = onlineUsers.get(data.receiverId);
          if (!receiverSocketId) {
            // TODO: Send push notification
            console.log(`📱 Should send push notification to user ${data.receiverId}`);
          }

          console.log(`💬 Message sent in conversation ${data.conversationId}`);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Handle message read status
    socket.on('message:read', async (data) => {
      try {
        if (!socket.data.userId) return;

        // Update message as read
        await db
          .update(messages)
          .set({ isRead: true })
          .where(eq(messages.id, data.messageId));

        // Notify conversation participants
        io.to(`conversation:${data.conversationId}`).emit('message:read', data);

        console.log(`✓ Message ${data.messageId} marked as read`);
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing:start', (data) => {
      if (!socket.data.userId) return;

      socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
        userId: socket.data.userId,
        conversationId: data.conversationId
      });
    });

    socket.on('typing:stop', (data) => {
      if (!socket.data.userId) return;

      socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
        userId: socket.data.userId,
        conversationId: data.conversationId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.data.userId) {
        onlineUsers.delete(socket.data.userId);

        // Notify others that user is offline
        socket.broadcast.emit('user:online', {
          userId: socket.data.userId,
          status: 'offline'
        });

        console.log(`👤 User ${socket.data.userId} disconnected`);
      }

      console.log('🔌 Client disconnected:', socket.id);
    });

    // Handle user leaving
    socket.on('user:leave', () => {
      if (socket.data.userId) {
        onlineUsers.delete(socket.data.userId);
        socket.broadcast.emit('user:online', {
          userId: socket.data.userId,
          status: 'offline'
        });
      }
    });
  });

  return io;
}

// Utility function to emit notifications to specific users
export function emitToUser(io: SocketIOServer, userId: string, event: keyof ServerToClientEvents, data: any) {
  io.to(`user:${userId}`).emit(event, data);
}

// Utility function to emit to conversation participants
export function emitToConversation(io: SocketIOServer, conversationId: string, event: keyof ServerToClientEvents, data: any) {
  io.to(`conversation:${conversationId}`).emit(event, data);
}

// Utility function to get online users count
export function getOnlineUsersCount(io: SocketIOServer): number {
  return io.sockets.sockets.size;
}

// Utility function to check if user is online
export function isUserOnline(io: SocketIOServer, userId: string): boolean {
  const rooms = io.sockets.adapter.rooms;
  const userRoom = rooms.get(`user:${userId}`);
  return userRoom && userRoom.size > 0;
}
