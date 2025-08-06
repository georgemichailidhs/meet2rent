'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/socket';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface Message {
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
}

interface OnlineUser {
  userId: string;
  status: 'online' | 'offline';
}

interface TypingUser {
  userId: string;
  conversationId: string;
}

export function useSocket() {
  const { data: session } = useSession();
  const socketRef = useRef<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user?.id) return;

    const initializeSocket = async () => {
      try {
        // Initialize Socket.io server
        await fetch('/api/socket', { method: 'POST' });

        // Create client connection
        const socket: SocketType = io({
          path: '/api/socket',
          addTrailingSlash: false,
          transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        // Connection event handlers
        socket.on('connect', () => {
          console.log('🔌 Connected to Socket.io server');
          setIsConnected(true);

          // Join user room
          socket.emit('user:join', { userId: session.user.id });
        });

        socket.on('disconnect', (reason) => {
          console.log('🔌 Disconnected from Socket.io server:', reason);
          setIsConnected(false);
        });

        // Message event handlers
        socket.on('message:receive', (message) => {
          console.log('💬 Received message:', message);
          setMessages((prev) => [...prev, message]);
        });

        socket.on('message:read', (data) => {
          console.log('✓ Message read:', data);
          // Update message read status in UI
          setMessages((prev) =>
            prev.map(msg =>
              msg.id === data.messageId
                ? { ...msg, isRead: true }
                : msg
            )
          );
        });

        // User online status handlers
        socket.on('user:online', (data: OnlineUser) => {
          setOnlineUsers((prev) => {
            const updated = new Set(prev);
            if (data.status === 'online') {
              updated.add(data.userId);
            } else {
              updated.delete(data.userId);
            }
            return updated;
          });
        });

        // Typing indicators
        socket.on('typing:start', (data: TypingUser) => {
          setTypingUsers((prev) => {
            const updated = new Map(prev);
            const conversationTypers = updated.get(data.conversationId) || new Set();
            conversationTypers.add(data.userId);
            updated.set(data.conversationId, conversationTypers);
            return updated;
          });
        });

        socket.on('typing:stop', (data: TypingUser) => {
          setTypingUsers((prev) => {
            const updated = new Map(prev);
            const conversationTypers = updated.get(data.conversationId) || new Set();
            conversationTypers.delete(data.userId);
            if (conversationTypers.size === 0) {
              updated.delete(data.conversationId);
            } else {
              updated.set(data.conversationId, conversationTypers);
            }
            return updated;
          });
        });

        // Notification handler
        socket.on('notification', (data) => {
          console.log('🔔 Received notification:', data);
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(data.title, {
              body: data.message,
              icon: '/favicon.ico',
            });
          }
        });

      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('user:leave');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [session?.user?.id]);

  // Socket methods
  const sendMessage = (data: {
    content: string;
    receiverId: string;
    conversationId: string;
    propertyId?: string;
  }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('message:send', data);
    }
  };

  const markMessageAsRead = (messageId: string, conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('message:read', { messageId, conversationId });
    }
  };

  const startTyping = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing:start', { conversationId });
    }
  };

  const stopTyping = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing:stop', { conversationId });
    }
  };

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  const getTypingUsers = (conversationId: string): string[] => {
    return Array.from(typingUsers.get(conversationId) || []);
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  return {
    isConnected,
    onlineUsers: Array.from(onlineUsers),
    messages,
    sendMessage,
    markMessageAsRead,
    startTyping,
    stopTyping,
    isUserOnline,
    getTypingUsers,
    requestNotificationPermission,
    socket: socketRef.current,
  };
}

// Hook for managing typing indicator
export function useTypingIndicator(conversationId: string | null, delay = 1000) {
  const { startTyping, stopTyping } = useSocket();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = () => {
    if (!conversationId) return;

    startTyping(conversationId);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to stop typing
    timeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, delay);
  };

  const handleStopTyping = () => {
    if (!conversationId) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    stopTyping(conversationId);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { handleTyping, handleStopTyping };
}
