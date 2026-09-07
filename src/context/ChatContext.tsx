import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Chat, Message, ResponseTone, ResponseVerbosity } from '@/types';

interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | undefined;
  isLoading: boolean;
  createNewChat: (model?: string) => void;
  deleteChat: (id: string) => void;
  renameChat: (id: string, newTitle: string) => void;
  togglePinChat: (id: string) => void;
  selectChat: (id: string) => void;
  changeModel: (chatId: string, model: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  toggleStarMessage: (chatId: string, messageId: string) => void;
  addReaction: (chatId: string, messageId: string, emoji: string) => void;
  setFeedback: (chatId: string, messageId: string, feedback: 'like' | 'dislike' | null) => void;
  setChatTone: (chatId: string, tone: ResponseTone) => void;
  setChatVerbosity: (chatId: string, verbosity: ResponseVerbosity) => void;
  setChatSystemPrompt: (chatId: string, prompt: string) => void;
  updateMessageReasoning: (chatId: string, messageId: string, reasoning: string, duration?: number) => void;
  getMessages: (chatId: string) => Message[];
  truncateMessages: (chatId: string, index: number) => void;
  setLoading: (loading: boolean) => void;
  clearAllChats: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('chats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [currentChatId, setCurrentChatId] = useState<string | null>(() => {
    if (chats.length > 0) {
      return chats[0].id;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  const createNewChat = useCallback((model: string = 'qwen:latest') => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      pinned: false,
      model: model,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  }, []);

  const deleteChat = useCallback((id: string) => {
    setChats(prev => prev.filter(chat => chat.id !== id));
    if (currentChatId === id) {
      const remaining = chats.filter(chat => chat.id !== id);
      setCurrentChatId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [currentChatId, chats]);

  const renameChat = useCallback((id: string, newTitle: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === id) {
        return {
          ...chat,
          title: newTitle.trim() || 'Untitled',
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const togglePinChat = useCallback((id: string) => {
    setChats(prev => {
      const updatedChats = prev.map(chat => {
        if (chat.id === id) {
          return {
            ...chat,
            pinned: !chat.pinned,
            updatedAt: new Date()
          };
        }
        return chat;
      });
      
      return updatedChats.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
    });
  }, []);

  const selectChat = useCallback((id: string) => {
    setCurrentChatId(id);
  }, []);

  const changeModel = useCallback((chatId: string, model: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          model: model,
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const addMessage = useCallback((chatId: string, message: Message) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        // Auto-generate title from first user message
        let newTitle = chat.title;
        if (chat.messages.length === 0 && message.role === 'user') {
          newTitle = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
        }
        return {
          ...chat,
          messages: [...chat.messages, message],
          title: newTitle,
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const updateMessage = useCallback((chatId: string, messageId: string, content: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const messages = chat.messages.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, content };
          }
          return msg;
        });
        return {
          ...chat,
          messages,
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const deleteMessage = useCallback((chatId: string, messageId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.filter(m => m.id !== messageId),
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const getMessages = useCallback((chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    return chat ? chat.messages : [];
  }, [chats]);

  const toggleStarMessage = useCallback((chatId: string, messageId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(m => m.id === messageId ? { ...m, starred: !m.starred } : m),
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const addReaction = useCallback((chatId: string, messageId: string, emoji: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(m => {
            if (m.id !== messageId) return m;
            const currentReactions = { ...(m.reactions || {}) };
            const userReactions = [...(m.userReactions || [])];
            
            if (userReactions.includes(emoji)) {
              // Toggle off
              currentReactions[emoji] = Math.max(0, (currentReactions[emoji] || 1) - 1);
              if (currentReactions[emoji] === 0) delete currentReactions[emoji];
              return {
                ...m,
                reactions: currentReactions,
                userReactions: userReactions.filter(r => r !== emoji)
              };
            } else {
              // Add reaction
              currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
              return {
                ...m,
                reactions: currentReactions,
                userReactions: [...userReactions, emoji]
              };
            }
          }),
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const setFeedback = useCallback((chatId: string, messageId: string, feedback: 'like' | 'dislike' | null) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(m => m.id === messageId ? { ...m, userFeedback: feedback } : m),
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const setChatTone = useCallback((chatId: string, tone: ResponseTone) => {
    setChats(prev => prev.map(chat => chat.id === chatId ? { ...chat, tone, updatedAt: new Date() } : chat));
  }, []);

  const setChatVerbosity = useCallback((chatId: string, verbosity: ResponseVerbosity) => {
    setChats(prev => prev.map(chat => chat.id === chatId ? { ...chat, verbosity, updatedAt: new Date() } : chat));
  }, []);

  const setChatSystemPrompt = useCallback((chatId: string, prompt: string) => {
    setChats(prev => prev.map(chat => chat.id === chatId ? { ...chat, systemPrompt: prompt, updatedAt: new Date() } : chat));
  }, []);

  const updateMessageReasoning = useCallback((chatId: string, messageId: string, reasoning: string, duration?: number) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(m => m.id === messageId ? { ...m, reasoning, reasoningDuration: duration } : m),
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const truncateMessages = useCallback((chatId: string, index: number) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.slice(0, index),
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const clearAllChats = useCallback(() => {
    if (window.confirm('Delete all chats?')) {
      setChats([]);
      setCurrentChatId(null);
    }
  }, []);

  const value = {
    chats,
    currentChatId,
    currentChat,
    isLoading,
    createNewChat,
    deleteChat,
    renameChat,
    togglePinChat,
    selectChat,
    changeModel,
    addMessage,
    updateMessage,
    deleteMessage,
    toggleStarMessage,
    addReaction,
    setFeedback,
    setChatTone,
    setChatVerbosity,
    setChatSystemPrompt,
    updateMessageReasoning,
    getMessages,
    truncateMessages,
    setLoading,
    clearAllChats
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};