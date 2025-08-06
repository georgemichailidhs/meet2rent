import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { queueEmail, NotificationType } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      type,
      recipientEmail,
      recipientName,
      data
    }: {
      type: NotificationType;
      recipientEmail: string;
      recipientName: string;
      data: Record<string, any>;
    } = body;

    // Validate required fields
    if (!type || !recipientEmail || !recipientName) {
      return NextResponse.json(
        { error: 'Missing required fields: type, recipientEmail, recipientName' },
        { status: 400 }
      );
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Queue the email
    await queueEmail(type, recipientEmail, recipientName, data || {});

    // TODO: Also save notification to database for in-app notifications
    console.log('Notification queued:', {
      type,
      recipientEmail,
      recipientName,
      sentBy: session.user.id,
      data
    });

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Notification sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
