'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  Input,
} from '@repo/ui';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Send,
  User,
  Building2,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Conversation {
  id: string;
  propertyId: string;
  lastMessageAt: string;
  property: {
    id: string;
    title: string;
    images: { url: string }[];
  };
  otherParticipant: {
    id: string;
    firstName: string;
    lastName: string;
  };
  unreadCount: number;
  messages: { content: string; createdAt: string }[];
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
  const conversationId = searchParams.get('conversationId');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize Socket.IO connection to /messages namespace
    const socket = io(`${wsUrl}/messages`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Connected
    });

    socket.on('disconnect', () => {
      // Disconnected
    });

    // Listen for new messages
    socket.on('new_message', (message: Message) => {

      // Add message to the list if we're viewing this conversation
      if (selectedConversation && message.conversationId === selectedConversation.id) {
        setMessages((prev) => [...prev, message]);
      }

      // Update last message in conversations list and re-sort
      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === message.conversationId
            ? {
                ...conv,
                messages: [{ content: message.content, createdAt: message.createdAt }],
                lastMessageAt: message.createdAt,
                // Increment unread count if message is from other user
                unreadCount: message.senderId !== user.id ? conv.unreadCount + 1 : conv.unreadCount,
              }
            : conv
        );
        // Sort by lastMessageAt to move updated conversation to top
        return updated.sort((a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      });
    });

    // Listen for new conversations
    socket.on('new_conversation', (conversation: Conversation) => {
      setConversations((prev) => [conversation, ...prev]);
    });

    // Listen for typing indicators
    socket.on('user_typing', (data: { userId: string; conversationId: string }) => {
      if (selectedConversation && data.conversationId === selectedConversation.id) {
        setIsTyping(true);
      }
    });

    socket.on('user_stopped_typing', (data: { userId: string; conversationId: string }) => {
      if (selectedConversation && data.conversationId === selectedConversation.id) {
        setIsTyping(false);
      }
    });

    // Listen for read receipts
    socket.on('messages_read', (data: { conversationId: string; userId: string; messageIds: string[]; readAt: string }) => {

      // Update message read status in the list
      if (selectedConversation && data.conversationId === selectedConversation.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            data.messageIds.includes(msg.id)
              ? { ...msg, read: true, readAt: data.readAt }
              : msg
          )
        );
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user, wsUrl, selectedConversation]);

  // Auto-select conversation from URL parameter
  useEffect(() => {
    if (conversationId && conversations.length > 0 && !selectedConversation) {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setSelectedConversation(conv);
        fetchMessages(conv.id);

        // Join conversation room
        if (socketRef.current) {
          socketRef.current.emit('join_conversation', conv.id);
        }

        // Update unread count locally
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conv.id ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, conversations.length, selectedConversation]);

  // If conversation not found but we have conversationId, refetch after delay
  useEffect(() => {
    if (conversationId && !loading && !selectedConversation) {
      // Wait a bit for the conversation to be created on backend
      const timer = setTimeout(() => {
        const conv = conversations.find(c => c.id === conversationId);
        if (!conv) {
          // Conversation not in list yet, refetch
          fetchConversations();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, loading, selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      // Silently fail - will retry on refresh
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${apiUrl}/messages/conversations/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.items);
      }
    } catch (error) {
      // Silently fail - user can retry
    } finally {
      setMessagesLoading(false);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    // Leave previous conversation room
    if (selectedConversation && socketRef.current) {
      socketRef.current.emit('leave_conversation', selectedConversation.id);
    }

    setSelectedConversation(conversation);
    setIsTyping(false); // Reset typing indicator
    fetchMessages(conversation.id);

    // Join new conversation room
    if (socketRef.current) {
      socketRef.current.emit('join_conversation', conversation.id);
    }

    // Update unread count locally and mark as read
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      )
    );

    // Mark conversation messages as read via WebSocket
    if (socketRef.current) {
      socketRef.current.emit('mark_as_read', { conversationId: conversation.id });
    }
  };

  const handleTyping = () => {
    if (!selectedConversation || !socketRef.current) return;

    // Emit typing_start event
    socketRef.current.emit('typing_start', {
      conversationId: selectedConversation.id,
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit typing_stop after 2 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && selectedConversation) {
        socketRef.current.emit('typing_stop', {
          conversationId: selectedConversation.id,
        });
      }
    }, 2000);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);

    // Stop typing indicator when sending
    if (socketRef.current && typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socketRef.current.emit('typing_stop', {
        conversationId: selectedConversation.id,
      });
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${apiUrl}/messages/conversations/${selectedConversation.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newMessage }),
        }
      );

      if (response.ok) {
        const message = await response.json();
        setMessages((prev) => [...prev, message]);
        setNewMessage('');
        // Update last message in conversations list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation.id
              ? {
                  ...c,
                  messages: [{ content: message.content, createdAt: message.createdAt }],
                  lastMessageAt: message.createdAt,
                }
              : c
          )
        );
      }
    } catch (error) {
      // Show error to user - message failed
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Сообщения</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Диалоги</h2>
              </div>
              <div className="overflow-y-auto h-[calc(100vh-300px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Нет сообщений</p>
                    <p className="text-sm mt-1">
                      Начните общение с продавцом на странице объявления
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                        selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          {conv.property.images[0]?.url ? (
                            <img
                              src={conv.property.images[0].url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                              {conv.otherParticipant.firstName}{' '}
                              {conv.otherParticipant.lastName}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {conv.property.title}
                          </p>
                          {conv.messages[0] && (
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {conv.messages[0].content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedConversation.otherParticipant.firstName}{' '}
                      {selectedConversation.otherParticipant.lastName}
                    </p>
                    <Link
                      href={`/properties/${selectedConversation.property.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {selectedConversation.property.title}
                    </Link>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderId === user?.id
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.senderId === user?.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p>{message.content}</p>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <p
                                className={`text-xs ${
                                  message.senderId === user?.id
                                    ? 'text-blue-100'
                                    : 'text-gray-500'
                                }`}
                              >
                                {new Date(message.createdAt).toLocaleTimeString(
                                  'ru-RU',
                                  { hour: '2-digit', minute: '2-digit' }
                                )}
                              </p>
                              {message.senderId === user?.id && (
                                <span
                                  className={`text-xs ${
                                    message.read ? 'text-blue-200' : 'text-blue-300'
                                  }`}
                                >
                                  {message.read ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-lg px-4 py-2">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form
                  onSubmit={sendMessage}
                  className="p-4 border-t flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Введите сообщение..."
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Выберите диалог для просмотра сообщений</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
