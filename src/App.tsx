import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, Wifi, WifiOff, Shield, Scale } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import LoadingScreen from '@/components/LoadingScreen';
import Logo from '@/components/Logo';
import ModelSelector from '@/components/ModelSelector';
import { ChatProvider, useChat } from '@/context/ChatContext';
import { useOllama } from '@/hooks/useOllama';
import type { Message } from '@/types';

const ChatApp: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { 
    currentChat, 
    currentChatId,
    addMessage, 
    updateMessage,
    changeModel,
    setLoading,
    isLoading 
  } = useChat();
  
  const { isLoading: ollamaLoading, error, isConnected, sendMessage } = useOllama();

  useEffect(() => {
    const checkConnection = async () => {
      // Connection check logic
    };
    checkConnection();
  }, []);

  // Sync loading states
  useEffect(() => {
    setLoading(ollamaLoading);
  }, [ollamaLoading, setLoading]);

  const handleModelChange = (model: string) => {
    if (currentChatId) {
      changeModel(currentChatId, model);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentChatId || !currentChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    // Add user message
    addMessage(currentChatId, userMessage);

    try {
      // Stream AI response with current model
      const response = await sendMessage(
        [...currentChat.messages, userMessage],
        currentChat.model || 'qwen:latest',
        (chunk) => {
          // Check if we already have an assistant message
          const messages = currentChat.messages;
          const lastMessage = messages[messages.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            // Update existing assistant message
            updateMessage(currentChatId, lastMessage.id, lastMessage.content + chunk);
          } else {
            // Create new assistant message
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: chunk,
              timestamp: new Date()
            };
            addMessage(currentChatId, assistantMessage);
          }
        }
      );

      // If no streaming, add full response
      if (response) {
        const messages = currentChat.messages;
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role !== 'assistant') {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date()
          };
          addMessage(currentChatId, assistantMessage);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5f0]">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-[#006633]/10 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="lg:hidden">
              <Logo size="sm" variant="icon" />
            </div>
            <div className="hidden lg:block">
              <Logo size="sm" />
            </div>
            <div className="hidden lg:block h-6 w-px bg-[#006633]/20" />
            <h1 className="text-sm font-medium text-[#006633] truncate max-w-xs">
              {currentChat?.title || 'New Conversation'}
            </h1>
            {currentChat && (
              <span className="hidden sm:inline-block text-xs text-[#006633]/60 bg-[#006633]/5 px-2 py-0.5 rounded-full border border-[#006633]/10">
                {currentChat.messages.length} messages
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Model Selector */}
            {currentChat && (
              <ModelSelector
                currentModel={currentChat.model || 'qwen:latest'}
                onModelChange={handleModelChange}
              />
            )}
            
            <div className="flex items-center gap-2 text-xs">
              <div className={`
                w-1.5 h-1.5 rounded-full transition-colors duration-300
                ${isConnected ? 'bg-[#006633] animate-pulse' : 'bg-red-400'}
              `} />
              <span className={`font-medium ${isConnected ? 'text-[#006633]' : 'text-red-600'}`}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#006633]/40">
              <Scale size={12} />
              <Shield size={12} />
            </div>
            {error && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                <AlertCircle size={12} />
                <span className="truncate max-w-[120px]">{error}</span>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {currentChat ? (
            <ChatInterface
              messages={currentChat.messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              chatId={currentChatId}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="flex justify-center mb-6">
                  <Logo size="xl" animated variant="icon" />
                </div>
                <h2 className="text-2xl font-bold text-[#006633] mb-2">
                  Nigeria Customs AI
                </h2>
                <p className="text-[#006633]/70 mb-6 text-sm">
                  Powered by Qwen AI - Justice & Honesty in every response.
                </p>
                <button
                  onClick={() => {
                    const newChat = useChat().createNewChat;
                    newChat('qwen:latest');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#006633] hover:bg-[#004422] text-white font-medium rounded-xl transition-all duration-200 shadow-premium-sm hover:shadow-premium text-sm"
                >
                  <Sparkles size={16} />
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsAppLoading(false);
    }, 1500);
  }, []);

  if (isAppLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  return (
    <ChatProvider>
      <ChatApp />
    </ChatProvider>
  );
};

export default App;