import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, AlertCircle, Scale, Shield, Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import LoadingScreen from '@/components/LoadingScreen';
import Logo from '@/components/Logo';
import ModelSelector from '@/components/ModelSelector';
import ConnectionStatus from '@/components/ConnectionStatus';
import { ChatProvider, useChat } from '@/context/ChatContext';
import { useOllama } from '@/hooks/useOllama';
import type { Message } from '@/types';

const ChatApp: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
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
    getMessages,
    truncateMessages,
    createNewChat
  } = useChat();
  
  const { 
    isLoading: ollamaLoading, 
    error, 
    isConnected, 
    availableModels,
    checkConnection,
    sendMessage,
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
      createNewChat('qwen:latest');
    }
  }, [isInitialized, chats.length, isConnected, createNewChat]);

  const handleModelChange = useCallback((model: string) => {
    if (currentChatId) {
      console.log(`🔄 Changing model to: ${model}`);
      changeModel(currentChatId, model);
    }
  }, [currentChatId, changeModel]);

  const handleSendMessage = useCallback(async (
    content: string, 
    editMessageId?: string,
    replyToId?: string
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

    try {
      // Handle edit mode
      if (editMessageId) {
        const messageIndex = currentChat.messages.findIndex(m => m.id === editMessageId);
        if (messageIndex === -1) {
          isProcessing.current = false;
          return;
        }
        
        // Truncate messages after the edited message
        truncateMessages(currentChatId, messageIndex);
        
        // Update the user message
        const updatedUserMessage: Message = {
          ...currentChat.messages[messageIndex],
          content: content,
          edited: true,
          timestamp: new Date()
        };
        addMessage(currentChatId, updatedUserMessage);
      } else {
        // Regular new message with optional reply
        const userMessage: Message = {
          id: `user_${Date.now()}`,
          role: 'user',
          content: content,
          timestamp: new Date(),
          replyToId: replyToId || undefined
        };
        addMessage(currentChatId, userMessage);
      }

      // Get current messages after adding user message
      const currentMessages = getMessages(currentChatId);
      
      // Find the last user message
      const lastUserMessage = currentMessages.filter(m => m.role === 'user').pop();
      if (!lastUserMessage) {
        console.error('❌ No user message found to send');
        isProcessing.current = false;
        return;
      }

      const model = currentChat.model || 'qwen:latest';
      
      // Create a placeholder for the assistant message
      const assistantMessageId = `assistant_${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      
      // Add empty assistant message first
      addMessage(currentChatId, assistantMessage);

      console.log(`🤖 Generating response with model: ${model}`);
      console.log(`📝 Sending message content: "${lastUserMessage.content}"`);
      
      let fullResponse = '';

      // Send the message and get streaming response
      await sendMessage(
        currentMessages,
        model,
        (chunk) => {
          // This is the streaming callback
          fullResponse += chunk;
          
          // Update the assistant message with the accumulated content
          updateMessage(currentChatId, assistantMessageId, fullResponse);
        }
      );
      
      console.log('✅ Message sent successfully');
      console.log(`📝 Full response length: ${fullResponse.length} characters`);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to get response';
      
      // Find the last assistant message and update with error
      const messages = getMessages(currentChatId);
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === '') {
        updateMessage(currentChatId, lastMessage.id, `❌ Error: ${errorMsg}`);
      } else {
        // Add error message
        const errorMessage: Message = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: `❌ Error: ${errorMsg}`,
          timestamp: new Date()
        };
        addMessage(currentChatId, errorMessage);
      }
    } finally {
      isProcessing.current = false;
    }
  }, [currentChatId, currentChat, addMessage, updateMessage, getMessages, sendMessage, truncateMessages]);

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

    try {
      // Find the assistant message
      const assistantIndex = currentChat.messages.findIndex(m => m.id === messageId);
      if (assistantIndex === -1) {
        isProcessing.current = false;
        return;
      }

      // Find the previous user message
      const userMessage = currentChat.messages[assistantIndex - 1];
      if (!userMessage || userMessage.role !== 'user') {
        console.error('❌ No user message found before assistant message');
        isProcessing.current = false;
        return;
      }

      // Remove the assistant message and any messages after it
      truncateMessages(currentChatId, assistantIndex);

      // Create new assistant message placeholder
      const newAssistantId = `assistant_${Date.now()}`;
      const newAssistant: Message = {
        id: newAssistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      addMessage(currentChatId, newAssistant);

      const currentMessages = getMessages(currentChatId);
      const model = currentChat.model || 'qwen:latest';
      console.log(`🤖 Regenerating response with model: ${model}`);
      
      let fullResponse = '';

      await sendMessage(
        currentMessages,
        model,
        (chunk) => {
          fullResponse += chunk;
          updateMessage(currentChatId, newAssistantId, fullResponse);
        }
      );
      
      console.log('✅ Message regenerated successfully');
    } catch (error) {
      console.error('❌ Error regenerating message:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to regenerate';
      
      // Add error message
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${errorMsg}`,
        timestamp: new Date()
      };
      addMessage(currentChatId, errorMessage);
    } finally {
      isProcessing.current = false;
    }
  }, [currentChatId, currentChat, addMessage, updateMessage, getMessages, sendMessage, truncateMessages]);

  const handleCreateNewChat = useCallback(() => {
    console.log('📝 Creating new chat...');
    createNewChat('qwen:latest');
    setIsMobileOpen(false);
  }, [createNewChat]);

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
          
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Model Selector */}
            {currentChat && (
              <ModelSelector
                currentModel={currentChat.model || 'qwen:latest'}
                onModelChange={handleModelChange}
              />
            )}
            
            {/* Connection Status */}
            <ConnectionStatus showDetails={true} />
            
            {/* NCS Icons */}
            <div className="hidden sm:flex items-center gap-1.5 text-[#006633]/40">
              <Scale size={12} />
              <Shield size={12} />
            </div>
            
            {/* Error Display */}
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