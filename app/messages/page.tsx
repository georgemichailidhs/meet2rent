'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  User,
  Home,
  Calendar,
  MapPin,
  Euro
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'system';
  timestamp: Date;
  isRead: boolean;
  attachmentUrl?: string;
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    avatar?: string;
    userType: 'tenant' | 'landlord';
    verified: boolean;
    lastSeen: Date;
    isOnline: boolean;
  };
  property?: {
    id: number;
    title: string;
    location: string;
    price: number;
    image: string;
  };
  lastMessage: Message;
  unreadCount: number;
  isActive: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    participant: {
      id: 'landlord1',
      name: 'Maria Konstantinou',
      userType: 'landlord',
      verified: true,
      lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      isOnline: true
    },
    property: {
      id: 1,
      title: 'Modern 2BR Apartment',
      location: 'Kolonaki, Athens',
      price: 1000,
      image: '/api/placeholder/300/200'
    },
    lastMessage: {
      id: 'msg1',
      senderId: 'landlord1',
      receiverId: 'current_user',
      content: 'Great! I\'ve confirmed your viewing for tomorrow at 2 PM. Looking forward to meeting you.',
      type: 'text',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      isRead: false
    },
    unreadCount: 2,
    isActive: true
  },
  {
    id: 'conv2',
    participant: {
      id: 'tenant1',
      name: 'Dimitris Papadopoulos',
      userType: 'tenant',
      verified: true,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      isOnline: false
    },
    property: {
      id: 2,
      title: 'Student Studio Near University',
      location: 'Exarchia, Athens',
      price: 450,
      image: '/api/placeholder/300/200'
    },
    lastMessage: {
      id: 'msg2',
      senderId: 'current_user',
      receiverId: 'tenant1',
      content: 'Thank you for your interest. Can you provide your employment letter?',
      type: 'text',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: true
    },
    unreadCount: 0,
    isActive: true
  },
  {
    id: 'conv3',
    participant: {
      id: 'landlord2',
      name: 'John Smith',
      userType: 'landlord',
      verified: true,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isOnline: false
    },
    property: {
      id: 3,
      title: 'Family House with Garden',
      location: 'Kifissia, Athens',
      price: 1500,
      image: '/api/placeholder/300/200'
    },
    lastMessage: {
      id: 'msg3',
      senderId: 'landlord2',
      receiverId: 'current_user',
      content: 'The property is still available. When would you like to schedule a viewing?',
      type: 'text',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      isRead: true
    },
    unreadCount: 0,
    isActive: true
  }
];

const mockMessages: { [conversationId: string]: Message[] } = {
  conv1: [
    {
      id: 'msg1_1',
      senderId: 'current_user',
      receiverId: 'landlord1',
      content: 'Hi Maria! I\'m very interested in your apartment in Kolonaki. Would it be possible to schedule a viewing?',
      type: 'text',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: true
    },
    {
      id: 'msg1_2',
      senderId: 'landlord1',
      receiverId: 'current_user',
      content: 'Hello! Thank you for your interest. I have availability tomorrow afternoon or Friday morning. Which works better for you?',
      type: 'text',
      timestamp: new Date(Date.now() - 90 * 60 * 1000),
      isRead: true
    },
    {
      id: 'msg1_3',
      senderId: 'current_user',
      receiverId: 'landlord1',
      content: 'Tomorrow afternoon would be perfect! What time works best?',
      type: 'text',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      isRead: true
    },
    {
      id: 'msg1_4',
      senderId: 'landlord1',
      receiverId: 'current_user',
      content: 'How about 2 PM? The address is 123 Kolonaki Street. I\'ll send you my phone number in case you need directions.',
      type: 'text',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isRead: true
    },
    {
      id: 'msg1_5',
      senderId: 'landlord1',
      receiverId: 'current_user',
      content: 'Great! I\'ve confirmed your viewing for tomorrow at 2 PM. Looking forward to meeting you.',
      type: 'text',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      isRead: false
    }
  ]
};

export default function MessagesPage() {
  const { data: session } = useSession();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  const currentMessages = selectedConversation ? mockMessages[selectedConversation.id] || [] : [];

  const sendMessage = () => {
    if (!message.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: 'current_user',
      receiverId: selectedConversation.participant.id,
      content: message,
      type: 'text',
      timestamp: new Date(),
      isRead: false
    };

    // TODO: Send message via WebSocket or API
    console.log('Sending message:', newMessage);
    setMessage('');
  };

  const filteredConversations = mockConversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.property?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getMessageStatus = (message: Message) => {
    if (message.senderId === 'current_user') {
      return message.isRead ? (
        <CheckCheck className="h-4 w-4 text-blue-500" />
      ) : (
        <Check className="h-4 w-4 text-gray-400" />
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages
              </CardTitle>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        {conversation.participant.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 truncate flex items-center gap-2">
                            {conversation.participant.name}
                            {conversation.participant.verified && (
                              <Badge variant="secondary" className="text-xs">
                                {conversation.participant.userType}
                              </Badge>
                            )}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>

                        {/* Property Info */}
                        {conversation.property && (
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <Home className="h-3 w-3 mr-1" />
                            <span className="truncate">{conversation.property.title}</span>
                          </div>
                        )}

                        {/* Last Message */}
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.senderId === 'current_user' ? 'You: ' : ''}
                          {conversation.lastMessage.content}
                        </p>

                        {/* Unread Count */}
                        {conversation.unreadCount > 0 && (
                          <div className="flex justify-end mt-1">
                            <Badge className="bg-blue-500 text-white text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        {selectedConversation.participant.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {selectedConversation.participant.name}
                          {selectedConversation.participant.verified && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedConversation.participant.userType}
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedConversation.participant.isOnline
                            ? 'Online now'
                            : `Last seen ${formatTime(selectedConversation.participant.lastSeen)}`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Property Context */}
                  {selectedConversation.property && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-200 w-12 h-12 rounded-lg flex items-center justify-center">
                          <Home className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{selectedConversation.property.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {selectedConversation.property.location}
                            </span>
                            <span className="flex items-center text-green-600">
                              <Euro className="h-3 w-3 mr-1" />
                              {selectedConversation.property.price}/month
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Property
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[50vh]">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === 'current_user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${msg.senderId === 'current_user' ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`p-3 rounded-lg ${
                            msg.senderId === 'current_user'
                              ? 'bg-blue-500 text-white ml-auto'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <div className={`flex items-center mt-1 space-x-1 ${
                          msg.senderId === 'current_user' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="text-xs text-gray-500">
                            {formatTime(msg.timestamp)}
                          </span>
                          {getMessageStatus(msg)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={sendMessage} disabled={!message.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* No Conversation Selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a conversation</h3>
                  <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
