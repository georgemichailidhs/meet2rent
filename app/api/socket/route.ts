import { NextRequest } from 'next/server';
import { createSocketIOServer, NextApiResponseServerIO } from '@/lib/socket';

export async function GET(req: NextRequest) {
  // This route is handled by the Socket.io server
  return new Response('Socket.io server running', { status: 200 });
}

export async function POST(req: NextRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log('🚀 Starting Socket.io server...');

    const io = createSocketIOServer(res.socket.server);
    res.socket.server.io = io;

    console.log('✅ Socket.io server started successfully');
  } else {
    console.log('🔄 Socket.io server already running');
  }

  return new Response('Socket.io initialized', { status: 200 });
}
