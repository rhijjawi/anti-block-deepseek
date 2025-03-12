'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Message, Conversation } from '../types';
import Markdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PlusCircleIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThreeDot } from 'react-loading-indicators';

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      setConversations(parsed);
      setCurrentConversation(parsed[0] || null);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('conversations', JSON.stringify(conversations));
    }
  }, [conversations]);
  const checkBalance = async () => {
    setRefreshing(true);
    const response = await fetch('/api/balance', {
      credentials: 'include',
    });
    const data = await response.json();
    toast.success('Balance checked', {richColors : true});
    setTimeout(() => setRefreshing(false), 2500);
    return (Number(data.balance_infos[0].total_balance));
  };
  useEffect(() => {
    if (currentConversation?.messages){
      
    }
  }, [currentConversation?.messages]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          router.push('/');
        }
      } catch (error) {
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (currentConversation?.id === id) {
      setCurrentConversation(conversations[1] || null);
    }
  };

  const updateConversationTitle = (id: string, title: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === id
          ? { ...conv, title, lastUpdated: new Date().toISOString() }
          : conv
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentConversation) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...currentConversation.messages, userMessage];
    const updatedConversation = {
      ...currentConversation,
      messages: updatedMessages,
      lastUpdated: new Date().toISOString(),
      title: currentConversation.messages.length === 0 ? input.slice(0, 30) + '...' : currentConversation.title,
    };

    setConversations(prev =>
      prev.map(conv =>
        conv.id === currentConversation.id ? updatedConversation : conv
      )
    );
    setCurrentConversation(updatedConversation);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(JSON.stringify(data.error));
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      let assistantMessage: Message = { role: 'assistant', content: '' };
      const newMessages = [...updatedMessages, assistantMessage];
      
      const newConversation = {
        ...updatedConversation,
        messages: newMessages,
        lastUpdated: new Date().toISOString(),
      };

      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentConversation.id ? newConversation : conv
        )
      );
      setCurrentConversation(newConversation);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          checkBalance().then((val)=>setBalance(val))
          break
        };

        const text = new TextDecoder().decode(value);
        assistantMessage.content += text;
        
        const updatedNewConversation = {
          ...newConversation,
          messages: newMessages.map((msg, i) =>
            i === newMessages.length - 1 ? { ...assistantMessage } : msg
          ),
        };

        setConversations(prev =>
          prev.map(conv =>
            conv.id === currentConversation.id ? updatedNewConversation : conv
          )
        );
        setCurrentConversation(updatedNewConversation);
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: JSON.parse((error as {message: string}).message).message,
        error: true,
      };
      
      const errorConversation = {
        ...updatedConversation,
        messages: [...updatedMessages, errorMessage],
        lastUpdated: new Date().toISOString(),
      };

      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentConversation.id ? errorConversation : conv
        )
      );
      setCurrentConversation(errorConversation);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).then(() => {
      router.push('/');
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-white border-r transition-all duration-300 ease-in-out overflow-hidden`}>
        <div className="p-4 border-b">
          <button
            onClick={createNewConversation}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            New Chat
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                currentConversation?.id === conv.id ? 'bg-gray-50' : ''
              }`}
              onClick={() => setCurrentConversation(conv)}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium truncate flex-1">{conv.title}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(conv.lastUpdated).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              ☰
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              {currentConversation?.title || 'Chat Interface'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 flex flex-row gap-x-1">
              <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className='cursor-pointer' onClick={()=>checkBalance().then((val)=>setBalance(val))}>
                  {refreshing ? <ThreeDot color="#000000" style={{fontSize : '10px'}} text="Loading..." textColor="" /> : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balance!)} 
                </Button>
              </TooltipTrigger>
                <TooltipContent>
                  Refresh balance
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className='cursor-pointer w-fit'>
                    <PlusCircleIcon className='size-4'/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Top up your balance
                </TooltipContent>
              </Tooltip>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>

        {currentConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentConversation.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : (message.error ? 'bg-red-500 text-white' : 'bg-white text-gray-900')
                    }`}
                  >
                    <Markdown components={{
                      li: ({ children }) => <li className="my-1">{children}</li>,
                      hr: () => <hr className="my-4 border-gray-200" />,
                    }}>{message.content}</Markdown>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-700">No Conversation Selected</h2>
              <p className="text-gray-500 mt-2">Create a new chat or select an existing one</p>
              <button
                onClick={createNewConversation}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 