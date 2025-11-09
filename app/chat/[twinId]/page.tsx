'use client';

import React, { useState, useRef, useEffect, use } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { 
  ChevronLeft, ChevronRight, Plus, Send, Settings, Clock, 
  Layers, Copy, RefreshCw, User, Check 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { twinChat } from '@/lib/groq';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  seen?: boolean;
}

interface AITwin {
  id: string;
  name: string;
  personality?: string;
  character?: string;
  tone?: string;
  bio?: string;
}

export default function ChatPage({ params }: { params: Promise<{ twinId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [twin, setTwin] = useState<AITwin | null>(null);
  const [allTwins, setAllTwins] = useState<AITwin[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load twin data from localStorage
  useEffect(() => {
    // Load current twin
    const currentTwinData = localStorage.getItem('currentTwin');
    if (currentTwinData) {
      setTwin(JSON.parse(currentTwinData));
    }
    
    // Load all twins (owned + purchased)
    const savedTwins = localStorage.getItem('aiTwins');
    const accessibleTwins = localStorage.getItem('accessibleTwins');
    
    let allAvailableTwins: AITwin[] = [];
    
    if (savedTwins) {
      allAvailableTwins = [...JSON.parse(savedTwins)];
    }
    
    if (accessibleTwins) {
      const purchased = JSON.parse(accessibleTwins);
      allAvailableTwins = [...allAvailableTwins, ...purchased];
    }
    
    setAllTwins(allAvailableTwins);
    
    // If no current twin, find by ID
    if (!currentTwinData && allAvailableTwins.length > 0) {
      const foundTwin = allAvailableTwins.find((t: AITwin) => t.id === resolvedParams.twinId);
      if (foundTwin) {
        setTwin(foundTwin);
      } else {
        // Twin not found, redirect back
        router.push('/create-twin');
      }
    } else if (allAvailableTwins.length === 0) {
      // No twins found, redirect back
      router.push('/create-twin');
    }
    
    // Load chat history for this twin
    const chatKey = `chat_${resolvedParams.twinId}`;
    const savedChat = localStorage.getItem(chatKey);
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    }
  }, [resolvedParams.twinId, router]);
  
  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const chatKey = `chat_${resolvedParams.twinId}`;
      localStorage.setItem(chatKey, JSON.stringify(messages));
    }
  }, [messages, resolvedParams.twinId]);
  
  const suggestedQuestions = [
    'What are my core values?',
    'How do I handle stress?',
    'What are my long-term goals?',
    'What makes me unique?'
  ];
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !twin) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      seen: true
    };
    
    setMessages([...messages, newMessage]);
    setInputValue('');
    setIsTyping(true);
    
    try {
      // Use actual AI twin chat with personality
      const personality = twin.personality || `You are ${twin.name}, a friendly AI assistant with a ${twin.tone || 'casual'} conversation style.`;
      
      // Convert messages to conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));
      
      const aiResponse = await twinChat(personality, inputValue, conversationHistory);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };
  
  return (
    <div className="h-screen bg-[#0A0A0A] flex flex-col">
      <Navigation />
      
      <div className="flex flex-1 pt-16 overflow-hidden">
        {/* Twins Sidebar */}
        <div
          className={`bg-[#141414] border-r border-[#262626] transition-all duration-300 flex flex-col ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-[#262626] flex items-center justify-between flex-shrink-0">
            {!isSidebarCollapsed && (
              <h3 className="text-lg font-semibold text-[#F5F5F5]">Your AI Twins</h3>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors rounded-lg hover:bg-[#1E1E1E]"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Twins List */}
          <div className="p-2 space-y-2 flex-1 overflow-y-auto">
            {allTwins.map((t) => (
              <div 
                key={t.id}
                onClick={() => router.push(`/chat/${t.id}`)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  t.id === twin?.id 
                    ? 'bg-[#D97706]/10 border border-[#D97706]' 
                    : 'hover:bg-[#1E1E1E] border border-transparent'
                }`}
              >
                {isSidebarCollapsed ? (
                  <div className="w-10 h-10 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-white font-bold">{t.name.charAt(0).toUpperCase()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">{t.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-[#F5F5F5] truncate block">
                        {t.name}
                      </span>
                      {t.tone && (
                        <span className="text-xs text-[#737373] capitalize">{t.tone}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Bottom Actions */}
          <div className="p-4 border-t border-[#262626] flex-shrink-0">
            {isSidebarCollapsed ? (
              <button className="w-full p-3 bg-[#1E1E1E] border border-[#262626] rounded-lg hover:border-[#404040] transition-colors flex items-center justify-center">
                <Plus className="w-5 h-5 text-[#A3A3A3]" />
              </button>
            ) : (
              <Button variant="secondary" size="small" icon={Plus} iconPosition="left" className="w-full">
                Create New Twin
              </Button>
            )}
          </div>
        </div>
        
        {/* Chat Container */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#262626] bg-[#0A0A0A]/95 backdrop-blur flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">{twin?.name.charAt(0).toUpperCase() || 'A'}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#F5F5F5]">{twin?.name || 'AI Twin'}</h3>
                <p className="text-xs text-[#059669] flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#059669] rounded-full"></span>
                  Online • Ready to chat
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="p-2 bg-[#1E1E1E] border border-[#262626] rounded-lg text-[#A3A3A3] hover:bg-[#252525] hover:text-[#D97706] transition-colors">
                <Layers className="w-5 h-5" />
              </button>
              <button className="p-2 bg-[#1E1E1E] border border-[#262626] rounded-lg text-[#A3A3A3] hover:bg-[#252525] hover:text-[#D97706] transition-colors">
                <Clock className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsInfoSidebarOpen(!isInfoSidebarOpen)}
                className="p-2 bg-[#1E1E1E] border border-[#262626] rounded-lg text-[#A3A3A3] hover:bg-[#252525] hover:text-[#D97706] transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-4xl text-white font-bold">P</span>
                </div>
                <h3 className="text-xl text-center text-[#A3A3A3] mb-8">
                  Hi! I&apos;m your digital twin. Ask me anything!
                </h3>
                
                <div className="grid grid-cols-2 gap-3 max-w-2xl">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="bg-[#1E1E1E] border border-[#262626] p-3 rounded-lg text-sm text-[#F5F5F5] hover:border-[#D97706] transition-colors text-left"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
                  >
                    {message.type === 'ai' && (
                      <div className="w-10 h-10 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-lg flex items-center justify-center flex-shrink-0 mr-3 self-start">
                        <span className="text-white font-bold text-sm">P</span>
                      </div>
                    )}
                    
                    <div className={`max-w-[70%] ${message.type === 'user' ? 'text-right' : ''}`}>
                      <div
                        className={`p-4 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-gradient-to-br from-[#D97706] to-[#B45309] text-white rounded-tr-sm shadow-lg'
                            : 'bg-[#1E1E1E] border border-[#262626] text-[#F5F5F5] rounded-tl-sm'
                        }`}
                      >
                        <p className="text-base leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                      
                      <div className={`flex items-center gap-2 mt-1 text-xs text-[#525252] ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span>{message.timestamp}</span>
                        {message.type === 'user' && message.seen && (
                          <Check className="w-3 h-3 text-[#059669]" />
                        )}
                        {message.type === 'ai' && (
                          <>
                            <button className="hover:text-[#D97706] transition-colors">
                              <Copy className="w-3 h-3" />
                            </button>
                            <button className="hover:text-[#D97706] transition-colors">
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {message.type === 'user' && (
                      <div className="w-10 h-10 bg-[#252525] rounded-lg flex items-center justify-center flex-shrink-0 ml-3 self-start">
                        <User className="w-5 h-5 text-[#A3A3A3]" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                      <span className="text-white font-bold text-sm">P</span>
                    </div>
                    <div className="bg-[#1E1E1E] border border-[#262626] p-4 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#D97706] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-[#D97706] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-[#D97706] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-[#262626] bg-[#0A0A0A]">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 flex items-end gap-3 focus-within:border-[#D97706] focus-within:ring-2 focus-within:ring-[#D97706]/20 transition-all">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message your AI twin..."
                className="flex-1 bg-transparent border-none outline-none text-[#F5F5F5] placeholder:text-[#525252] resize-none min-h-[24px] max-h-[150px]"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-[#D97706] p-2.5 rounded-lg hover:bg-[#B45309] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Info Sidebar */}
        {isInfoSidebarOpen && (
          <div className="w-80 bg-[#141414] border-l border-[#262626] p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#F5F5F5]">Twin Info</h3>
              <button
                onClick={() => setIsInfoSidebarOpen(false)}
                className="text-[#525252] hover:text-[#F5F5F5] transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-xl flex items-center justify-center mb-3">
                  <span className="text-3xl text-white font-bold">{twin?.name.charAt(0).toUpperCase() || 'A'}</span>
                </div>
                <h4 className="text-xl font-semibold text-[#F5F5F5] text-center">{twin?.name || 'AI Twin'}</h4>
                <p className="text-sm text-[#525252] text-center capitalize">{twin?.character} • {twin?.tone}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-[#F5F5F5] mb-3">Training Data</h4>
                <div className="space-y-2 text-sm text-[#A3A3A3]">
                  <p>Files uploaded: 12</p>
                  <p>Total size: 2.4 MB</p>
                  <p>Last updated: Today</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-[#F5F5F5] mb-3">Usage</h4>
                <div className="space-y-2 text-sm text-[#A3A3A3]">
                  <p>Total conversations: 47</p>
                  <p>Messages sent: 234</p>
                  <p>Created: 2 days ago</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button variant="secondary" size="small" icon={Plus} iconPosition="left" className="w-full">
                  Add Training Data
                </Button>
                <Button variant="secondary" size="small" className="w-full">
                  Edit Twin
                </Button>
                <Button variant="secondary" size="small" className="w-full">
                  View Analytics
                </Button>
                <Button variant="ghost" size="small" className="w-full text-[#DC2626] hover:text-[#DC2626]">
                  Delete Twin
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
