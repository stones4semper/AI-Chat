import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Chat, Message } from '@/types';

interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | undefined;
  isLoading: boolean;
  createNewChat: () => void;
  deleteChat: (id: string) => void;
  renameChat: (id: string, newTitle: string) => void;
  togglePinChat: (id: string) => void;
  selectChat: (id: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  setLoading: (loading: boolean) => void;
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

  // Save chats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      pinned: false,
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
      
      // Sort: pinned first, then by updated date
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

  const addMessage = useCallback((chatId: string, message: Message) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, message],
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

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
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
    addMessage,
    updateMessage,
    setLoading
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};