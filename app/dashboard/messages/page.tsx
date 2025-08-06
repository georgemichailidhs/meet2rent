'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Send,
  User,
  Home,
  Clock,
  Check,
  CheckCheck,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Image as ImageIcon,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  senderId: string;
  receiverId: string;
  propertyId?: string;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
}

interface Conversation {
  conversationId: string;
  otherUser: {
    id: string;
    name: string;
    image?: string;
  };
  property?: {
    id: string;
    title: string;
    mainImage?: string;
  };
  lastMessage: string;
  lastMessageAt: Date;
  isRead: boolean;
  unreadCount: number;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Conversation['otherUser'] | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get initial conversation from URL params
  const initialConversationId = searchParams.get('conversation');
  const initialPropertyId = searchParams.get('property');

  useEffect(() => {
    if (session?.user) {
      fetchConversations();
    }
  }, [session]);

  useEffect(() => {
    if (initialConversationId) {
      setSelectedConversation(initialConversationId);
      fetchMessages(initialConversationId);
    }
  }, [initialConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const result = await response.json();
        setConversations(result.data.conversations.map((conv: any) => ({
          ...conv,
          lastMessageAt: new Date(conv.lastMessageAt),
        })));
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (response.ok) {
        const result = await response.json();
        setMessages(result.data.messages.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
        })));

        // Update conversation as read
        setConversations(prev => prev.map(conv =>
          conv.conversationId === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        ));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !selectedUser) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: newMessage.trim(),
          conversationId: selectedConversation,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const sentMessage = {
          ...result.data.message,
          createdAt: new Date(result.data.message.createdAt),
        };

        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');

        // Update conversation list
        setConversations(prev => prev.map(conv =>
          conv.conversationId === selectedConversation
            ? {
                ...conv,
                lastMessage: sentMessage.content,
                lastMessageAt: sentMessage.createdAt,
              }
            : conv
        ));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation.conversationId);
    setSelectedUser(conversation.otherUser);
    fetchMessages(conversation.conversationId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.property?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">Loading Messages...</h3>
          <p className="text-gray-600">Please wait while we retrieve your conversations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto h-full">
        <div className="grid md:grid-cols-3 lg:grid-cols-4 h-full">
          {/* Conversations List */}
          <div className={`${isMobile && selectedConversation ? 'hidden' : ''} md:block bg-white border-r border-gray-200`}>
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(100%-120px)]">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Conversations</h3>
                  <p className="text-gray-600 text-sm">
                    Start a conversation by contacting a landlord or tenant through property listings.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.conversationId}
                      onClick={() => selectConversation(conversation)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation.conversationId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {conversation.otherUser.image ? (
                            <img
                              src={conversation.otherUser.image}
                              alt={conversation.otherUser.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {conversation.otherUser.name}
                            </h3>
                            <div className="flex items-center gap-1">
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-blue-600 text-xs px-1.5 py-0.5">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessageAt)}
                              </span>
                            </div>
                          </div>

                          {conversation.property && (
                            <div className="flex items-center gap-1 mb-1">
                              <Home className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600 truncate">
                                {conversation.property.title}
                              </span>
                            </div>
                          )}

                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${isMobile && !selectedConversation ? 'hidden' : ''} md:col-span-2 lg:col-span-3 flex flex-col bg-white`}>
            {selectedConversation && selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isMobile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedConversation(null)}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      )}

                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {selectedUser.image ? (
                          <img
                            src={selectedUser.image}
                            alt={selectedUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-gray-400" />
                        )}
                      </div>

                      <div>
                        <h2 className="font-semibold text-gray-900">{selectedUser.name}</h2>
                        <p className="text-sm text-green-600">Online</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.senderId === session?.user?.id;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isOwnMessage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>

                          <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                            isOwnMessage ? 'justify-end' : 'justify-start'
                          }`}>
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(message.createdAt)}</span>
                            {isOwnMessage && (
                              <div className="ml-1">
                                {message.isRead ? (
                                  <CheckCheck className="h-3 w-3 text-blue-500" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {!isOwnMessage && (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3 order-1 overflow-hidden">
                            {message.sender.image ? (
                              <img
                                src={message.sender.image}
                                alt={message.sender.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-end gap-3">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ImageIcon className="h-4 w-4" />
                    </Button>

                    <div className="flex-1">
                      <textarea
                        rows={1}
                        placeholder="Type a message..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                    </div>

                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {sending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // No conversation selected
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Conversation</h3>
                  <p className="text-gray-600 max-w-sm">
                    Choose a conversation from the list to start messaging with landlords or tenants.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
