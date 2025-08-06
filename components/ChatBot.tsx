'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const PREDEFINED_RESPONSES = {
  greeting: "Hello! I'm Meet2Rent AI Assistant. How can I help you today? I can assist with:\n• Property listings and search\n• Rental process questions\n• Certification requirements\n• Booking viewings\n• Contract and payment info\n• Technical support",

  listings: "I can help you with property listings! Are you looking to:\n• Browse available properties\n• Create a new listing (landlords)\n• Search by location or criteria\n• Get help with property photos and descriptions",

  certification: "Our certification process ensures trust and safety:\n\n📋 For Tenants:\n• Identity verification\n• Income verification\n• Previous rental history\n• References check\n\n🏠 For Landlords:\n• Property ownership verification\n• Legal documentation\n• Insurance requirements\n\nWould you like details about any specific step?",

  booking: "Booking a property viewing is easy:\n\n1️⃣ Find a property you like\n2️⃣ Click 'Book Viewing'\n3️⃣ Choose available time slots\n4️⃣ Meet the landlord in person\n5️⃣ After viewings, landlords choose the best tenant\n\nNeed help with any of these steps?",

  payment: "Our secure payment system handles:\n• Rent payments\n• Security deposits\n• Commission fees\n• Insurance payments\n\nAll transactions are encrypted and secure. Landlords receive payments after successful contract signing.",

  contract: "Digital contracts include:\n• Automated lease generation\n• E-signature process\n• Utility transfer guidance\n• Government paperwork assistance\n• Legal compliance checks\n\nEverything is handled online for your convenience!",

  support: "For technical issues:\n• Check our FAQ section\n• Contact live support (9 AM - 6 PM)\n• Report bugs or problems\n• Request new features\n\nIs there a specific issue you're experiencing?"
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message when chat opens
      setMessages([{
        id: '1',
        text: PREDEFINED_RESPONSES.greeting,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    if (message.includes('hello') || message.includes('hi') || message.includes('help')) {
      return PREDEFINED_RESPONSES.greeting;
    }

    if (message.includes('listing') || message.includes('property') || message.includes('apartment') || message.includes('house')) {
      return PREDEFINED_RESPONSES.listings;
    }

    if (message.includes('certif') || message.includes('verify') || message.includes('verification')) {
      return PREDEFINED_RESPONSES.certification;
    }

    if (message.includes('book') || message.includes('viewing') || message.includes('visit') || message.includes('appointment')) {
      return PREDEFINED_RESPONSES.booking;
    }

    if (message.includes('payment') || message.includes('pay') || message.includes('money') || message.includes('fee')) {
      return PREDEFINED_RESPONSES.payment;
    }

    if (message.includes('contract') || message.includes('lease') || message.includes('sign') || message.includes('agreement')) {
      return PREDEFINED_RESPONSES.contract;
    }

    if (message.includes('support') || message.includes('problem') || message.includes('issue') || message.includes('bug')) {
      return PREDEFINED_RESPONSES.support;
    }

    if (message.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with regarding Meet2Rent? 😊";
    }

    // Default response
    return "I'd be happy to help! I can assist with:\n\n🏠 Property listings and search\n📋 Certification process\n📅 Booking viewings\n💳 Payments and contracts\n🛠️ Technical support\n\nWhat would you like to know more about?";
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputText),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50"
        size="lg"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <CardTitle className="text-lg">Meet2Rent Assistant</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-blue-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-blue-100 text-sm">Online • Typically replies instantly</p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%]`}>
                {message.sender === 'bot' && (
                  <div className="bg-blue-100 rounded-full p-1">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                <div
                  className={`rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {message.sender === 'user' && (
                  <div className="bg-gray-100 rounded-full p-1">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-100 rounded-full p-1">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputText.trim() || isTyping}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Powered by Meet2Rent AI • Available 24/7
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
