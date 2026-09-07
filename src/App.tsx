import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, AlertCircle, Scale, Shield, Loader2, Star } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import LoadingScreen from '@/components/LoadingScreen';
import Logo from '@/components/Logo';
import ModelSelector from '@/components/ModelSelector';
import ConnectionStatus from '@/components/ConnectionStatus';
import { StyleToneSelector } from '@/components/StyleToneSelector';
import { StarredDrawer } from '@/components/StarredDrawer';
import { ChatProvider, useChat } from '@/context/ChatContext';
import { useOllama } from '@/hooks/useOllama';
import { buildSystemPrompt } from '@/services/ollama';
import type { Message, Attachment } from '@/types';

const ChatApp: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStarredDrawerOpen, setIsStarredDrawerOpen] = useState(false);
  const isProcessing = useRef(false);
  
  const { 
    chats,
    currentChat, 
    currentChatId,
    addMessage, 
    updateMessage,
    changeModel,
    setLoading,
    isLoading,
    truncateMessages,
    createNewChat,
    selectChat,
    setChatTone,
    setChatVerbosity,
    setChatSystemPrompt
  } = useChat();

  const totalStarredCount = chats.reduce(
    (acc, chat) => acc + chat.messages.filter(m => m.starred).length,
    0
  );
  
  const { 
    isLoading: ollamaLoading, 
    error, 
    isConnected, 
    availableModels,
    checkConnection,
    sendMessage,
    stopGeneration,
    refreshModels
  } = useOllama();

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing app...');
      await checkConnection();
      await refreshModels();
      setIsInitialized(true);
      console.log('✅ App initialized');
    };
    
    initializeApp();
    
    const interval = setInterval(() => {
      checkConnection();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [checkConnection, refreshModels]);

  // Sync loading states
  useEffect(() => {
    setLoading(ollamaLoading);
  }, [ollamaLoading, setLoading]);

  // Auto-create first chat if none exists
  useEffect(() => {
    if (isInitialized && chats.length === 0 && isConnected) {
      console.log('📝 Creating first chat...');
      const defaultModel = availableModels.length > 0
        ? (availableModels.includes('qwen:latest') ? 'qwen:latest' : availableModels[0])
        : 'qwen:latest';
      createNewChat(defaultModel);
    }
  }, [isInitialized, chats.length, isConnected, availableModels, createNewChat]);

  const handleModelChange = useCallback((model: string) => {
    if (currentChatId) {
      console.log(`🔄 Changing model to: ${model}`);
      changeModel(currentChatId, model);
    }
  }, [currentChatId, changeModel]);

  const handleStopGeneration = useCallback(() => {
    console.log('🛑 Stop generation requested');
    stopGeneration();
  }, [stopGeneration]);

  const handleSendMessage = useCallback(async (
    content: string, 
    editMessageId?: string,
    replyToId?: string,
    attachments?: Attachment[],
    images?: string[]
  ) => {
    // Prevent double submission
    if (isProcessing.current) {
      console.log('⏳ Already processing a message, please wait...');
      return;
    }

    if (!currentChatId || !currentChat) {
      console.warn('⚠️ No active chat to send message');
      return;
    }

    if (!content || content.trim() === '') {
      console.warn('⚠️ Empty message');
      return;
    }

    console.log(`📤 Sending message: "${content.slice(0, 50)}..."`);
    isProcessing.current = true;

    const assistantMessageId = `assistant_${Date.now()}`;

    try {
      let messagesToSend: Message[] = [];

      // Handle edit mode
      if (editMessageId) {
        const messageIndex = currentChat.messages.findIndex(m => m.id === editMessageId);
        if (messageIndex === -1) {
          isProcessing.current = false;
          return;
        }
        
        truncateMessages(currentChatId, messageIndex);
        
        const updatedUserMessage: Message = {
          ...currentChat.messages[messageIndex],
          content: content,
          edited: true,
          timestamp: new Date(),
          attachments: attachments && attachments.length > 0 ? attachments : currentChat.messages[messageIndex].attachments,
          images: images && images.length > 0 ? images : currentChat.messages[messageIndex].images
        };
        addMessage(currentChatId, updatedUserMessage);

        messagesToSend = [
          ...currentChat.messages.slice(0, messageIndex),
          updatedUserMessage
        ];
      } else {
        const userMessage: Message = {
          id: `user_${Date.now()}`,
          role: 'user',
          content: content,
          timestamp: new Date(),
          replyToId: replyToId || undefined,
          attachments: attachments && attachments.length > 0 ? attachments : undefined,
          images: images && images.length > 0 ? images : undefined
        };
        addMessage(currentChatId, userMessage);

        messagesToSend = [...currentChat.messages, userMessage];
      }

      const model = currentChat.model || (availableModels.length > 0 ? availableModels[0] : 'qwen:latest');
      
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      
      addMessage(currentChatId, assistantMessage);

      console.log(`🤖 Generating response with model: ${model}`);
      
      let fullResponse = '';
      const systemPrompt = buildSystemPrompt(
        currentChat.systemPrompt,
        currentChat.tone,
        currentChat.verbosity
      );

      await sendMessage(
        messagesToSend,
        model,
        (chunk) => {
          fullResponse += chunk;
          updateMessage(currentChatId, assistantMessageId, fullResponse);
        },
        systemPrompt
      );
      
      console.log('✅ Message sent successfully');
      
    } catch (error) {
      // Check if it was stopped by user
      if (error instanceof Error && error.message === 'Generation stopped by user') {
        console.log('🛑 Generation stopped by user');
        updateMessage(currentChatId, assistantMessageId, '⏹️ Generation stopped by user');
      } else {
        console.error('❌ Error sending message:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to get response';
        updateMessage(currentChatId, assistantMessageId, `❌ Error: ${errorMsg}`);
      }
    } finally {
      isProcessing.current = false;
    }
  }, [currentChatId, currentChat, addMessage, updateMessage, sendMessage, truncateMessages, availableModels]);

  const handleRegenerateMessage = useCallback(async (messageId: string) => {
    if (isProcessing.current) {
      console.log('⏳ Already processing a message, please wait...');
      return;
    }

    if (!currentChatId || !currentChat) {
      console.warn('⚠️ No active chat to regenerate');
      return;
    }

    console.log(`🔄 Regenerating message: ${messageId}`);
    isProcessing.current = true;

    const newAssistantId = `assistant_${Date.now()}`;

    try {
      const assistantIndex = currentChat.messages.findIndex(m => m.id === messageId);
      if (assistantIndex === -1) {
        isProcessing.current = false;
        return;
      }

      const userMessage = currentChat.messages[assistantIndex - 1];
      if (!userMessage || userMessage.role !== 'user') {
        console.error('❌ No user message found before assistant message');
        isProcessing.current = false;
        return;
      }

      truncateMessages(currentChatId, assistantIndex);

      const newAssistant: Message = {
        id: newAssistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      addMessage(currentChatId, newAssistant);

      const messagesToSend = [
        ...currentChat.messages.slice(0, assistantIndex)
      ];

      const model = currentChat.model || (availableModels.length > 0 ? availableModels[0] : 'qwen:latest');
      console.log(`🤖 Regenerating response with model: ${model}`);
      
      let fullResponse = '';
      const systemPrompt = buildSystemPrompt(
        currentChat.systemPrompt,
        currentChat.tone,
        currentChat.verbosity
      );

      await sendMessage(
        messagesToSend,
        model,
        (chunk) => {
          fullResponse += chunk;
          updateMessage(currentChatId, newAssistantId, fullResponse);
        },
        systemPrompt
      );
      
      console.log('✅ Message regenerated successfully');
    } catch (error) {
      if (error instanceof Error && error.message === 'Generation stopped by user') {
        console.log('🛑 Regeneration stopped by user');
      } else {
        console.error('❌ Error regenerating message:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to regenerate';
        updateMessage(currentChatId, newAssistantId, `❌ Error: ${errorMsg}`);
      }
    } finally {
      isProcessing.current = false;
    }
  }, [currentChatId, currentChat, addMessage, updateMessage, sendMessage, truncateMessages, availableModels]);

  const handleCreateNewChat = useCallback(() => {
    console.log('📝 Creating new chat...');
    const defaultModel = availableModels.length > 0
      ? (availableModels.includes('qwen:latest') ? 'qwen:latest' : availableModels[0])
      : 'qwen:latest';
    createNewChat(defaultModel);
    setIsMobileOpen(false);
  }, [availableModels, createNewChat]);

  // Loading state
  if (!isInitialized) {
    return <LoadingScreen isLoading={true} />;
  }

  return (
    <div className="flex h-screen bg-[#f5f5f0]">
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-[#006633]/10 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
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
              <span className="hidden sm:inline-block text-xs text-[#006633]/60 bg-[#006633]/5 px-2 py-0.5 rounded-full border border-[#006633]/10 flex-shrink-0">
                {currentChat.messages.length} messages
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {currentChat && (
              <>
                <ModelSelector
                  currentModel={currentChat.model || 'qwen:latest'}
                  onModelChange={handleModelChange}
                />
                <StyleToneSelector
                  currentTone={currentChat.tone || 'default'}
                  currentVerbosity={currentChat.verbosity || 'balanced'}
                  customSystemPrompt={currentChat.systemPrompt || ''}
                  onSelectTone={(tone) => currentChatId && setChatTone(currentChatId, tone)}
                  onSelectVerbosity={(verb) => currentChatId && setChatVerbosity(currentChatId, verb)}
                  onSaveSystemPrompt={(prompt) => currentChatId && setChatSystemPrompt(currentChatId, prompt)}
                />
              </>
            )}

            {/* Bookmarks / Starred button */}
            <button
              onClick={() => setIsStarredDrawerOpen(true)}
              className="relative p-2 rounded-lg bg-white/80 hover:bg-gray-100 border border-[#006633]/20 text-amber-500 hover:text-amber-600 transition-colors shadow-xs"
              title="View bookmarked messages"
            >
              <Star className={`w-4 h-4 ${totalStarredCount > 0 ? 'fill-amber-400' : ''}`} />
              {totalStarredCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {totalStarredCount}
                </span>
              )}
            </button>
            
            <ConnectionStatus 
              showDetails={true} 
              isConnected={isConnected}
              availableModels={availableModels}
              error={error}
              onRefresh={async () => {
                await checkConnection();
                await refreshModels();
              }}
            />
            
            <div className="hidden sm:flex items-center gap-1.5 text-[#006633]/40">
              <Scale size={12} />
              <Shield size={12} />
            </div>
            
            {error && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full max-w-[200px]">
                <AlertCircle size={12} className="flex-shrink-0" />
                <span className="truncate">{error}</span>
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
              onRegenerateMessage={handleRegenerateMessage}
              onStopGeneration={handleStopGeneration}
              isLoading={isProcessing.current || isLoading}
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
                {isConnected ? (
                  <button
                    onClick={handleCreateNewChat}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#006633] hover:bg-[#004422] text-white font-medium rounded-xl transition-all duration-200 shadow-premium-sm hover:shadow-premium text-sm"
                  >
                    <Sparkles size={16} />
                    Start New Chat
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl">
                      <AlertCircle size={16} />
                      <span className="text-sm">Connecting to Ollama...</span>
                    </div>
                    <button
                      onClick={async () => {
                        await checkConnection();
                        await refreshModels();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 text-sm"
                    >
                      <Loader2 size={14} className={isLoading ? 'animate-spin' : ''} />
                      Retry Connection
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <StarredDrawer
        isOpen={isStarredDrawerOpen}
        onClose={() => setIsStarredDrawerOpen(false)}
        onJumpToMessage={(chatId, messageId) => {
          selectChat(chatId);
          setTimeout(() => {
            const el = document.getElementById(`message-${messageId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2');
              setTimeout(() => {
                el.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2');
              }, 2000);
            }
          }, 300);
        }}
      />
    </div>
  );
};

// Main App Component with Loading Screen
const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
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