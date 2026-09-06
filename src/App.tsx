import React, { useState, useEffect, useCallback } from 'react';
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
  
  const { 
    chats,
    currentChat, 
    currentChatId,
    addMessage, 
    updateMessage,
    changeModel,
    setLoading,
    isLoading,
    deleteMessage,
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
    
    // Check connection periodically
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

  const handleSendMessage = useCallback(async (content: string, editMessageId?: string) => {
    if (!currentChatId || !currentChat) {
      console.warn('⚠️ No active chat to send message');
      return;
    }

    console.log(`📤 Sending message: "${content.slice(0, 50)}..."`);

    // If editing, find the message and its position
    let messageIndex = -1;
    let existingMessages = [...currentChat.messages];
    
    if (editMessageId) {
      messageIndex = existingMessages.findIndex(m => m.id === editMessageId);
      if (messageIndex === -1) {
        console.warn('⚠️ Message not found for editing');
        return;
      }
      
      // Remove all messages after the edited message (including the AI response)
      const newMessages = existingMessages.slice(0, messageIndex);
      
      // Update the user message content
      const updatedUserMessage: Message = {
        ...existingMessages[messageIndex],
        content: content,
        edited: true,
        timestamp: new Date()
      };
      
      // Replace the user message
      newMessages.push(updatedUserMessage);
      
      // Truncate messages to this point
      truncateMessages(currentChatId, newMessages.length);
      
      // Add the updated user message
      addMessage(currentChatId, updatedUserMessage);
      
      // Now send the message to get a new response
      console.log('📝 Edited message, regenerating response...');
    } else {
      // Regular new message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date()
      };

      // Add user message
      addMessage(currentChatId, userMessage);
    }

    try {
      // Get the current messages (including the new user message)
      const currentMessages = getMessages(currentChatId);
      const lastUserMessage = currentMessages[currentMessages.length - 1];
      
      if (!lastUserMessage || lastUserMessage.role !== 'user') {
        console.warn('⚠️ No user message found');
        return;
      }

      // Stream AI response with current model
      const model = currentChat.model || 'qwen:latest';
      console.log(`🤖 Generating response with model: ${model}`);
      
      const response = await sendMessage(
        currentMessages,
        model,
        (chunk) => {
          // Check if we already have an assistant message
          const messages = getMessages(currentChatId);
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
        const messages = getMessages(currentChatId);
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
      
      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Show error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: new Date()
      };
      addMessage(currentChatId, errorMessage);
    }
  }, [currentChatId, currentChat, addMessage, updateMessage, getMessages, sendMessage, truncateMessages]);

  const handleRegenerateMessage = useCallback(async (messageId: string) => {
    if (!currentChatId || !currentChat) {
      console.warn('⚠️ No active chat to regenerate');
      return;
    }

    console.log(`🔄 Regenerating message: ${messageId}`);

    // Find the assistant message
    const assistantIndex = currentChat.messages.findIndex(m => m.id === messageId);
    if (assistantIndex === -1) {
      console.warn('⚠️ Message not found for regeneration');
      return;
    }

    // Find the previous user message
    const userMessage = currentChat.messages[assistantIndex - 1];
    if (!userMessage || userMessage.role !== 'user') {
      console.warn('⚠️ No user message found before assistant message');
      return;
    }

    // Remove the assistant message and any messages after it
    truncateMessages(currentChatId, assistantIndex);

    // Regenerate
    try {
      const currentMessages = getMessages(currentChatId);
      const model = currentChat.model || 'qwen:latest';
      console.log(`🤖 Regenerating response with model: ${model}`);
      
      const response = await sendMessage(
        currentMessages,
        model,
        (chunk) => {
          const messages = getMessages(currentChatId);
          const lastMessage = messages[messages.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            updateMessage(currentChatId, lastMessage.id, lastMessage.content + chunk);
          } else {
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

      if (response) {
        const messages = getMessages(currentChatId);
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
      
      console.log('✅ Message regenerated successfully');
    } catch (error) {
      console.error('❌ Error regenerating message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to regenerate response'}`,
        timestamp: new Date()
      };
      addMessage(currentChatId, errorMessage);
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
    // Simulate app loading
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