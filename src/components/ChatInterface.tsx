import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Copy, Check, RefreshCw, Pin, PinOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '@/types';
import { useChat } from '@/context/ChatContext';
import remarkGfm from 'remark-gfm';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  chatId: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  chatId,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { togglePinChat, chats, currentChatId } = useChat();
  
  const currentChat = chats.find(c => c.id === chatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await onSendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f0]">
      {/* Chat Header */}
      <div className="border-b border-[#006633]/10 bg-white/80 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#006633]">
            {messages.length > 0 ? `${messages.length} messages` : 'New conversation'}
          </span>
        </div>
        {currentChat && (
          <button
            onClick={() => chatId && togglePinChat(chatId)}
            className="p-1.5 rounded-lg hover:bg-[#006633]/10 text-[#006633]/40 hover:text-[#006633] transition-colors"
            title={currentChat.pinned ? 'Unpin' : 'Pin chat'}
          >
            {currentChat.pinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-premium-sm border-2 border-[#006633]/20 p-2">
                <img src="/logo.png" alt="NCS Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-[#006633] mb-2">
                Nigeria Customs AI
              </h2>
              <p className="text-[#006633]/70 max-w-md">
                Ask anything about customs, trade, or general inquiries. Justice & Honesty in every response.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-fade-in ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`
                    flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
                    ${message.role === 'user'
                      ? 'bg-[#006633] shadow-premium-sm'
                      : 'bg-[#006633]/10 shadow-premium-sm'
                    }
                  `}
                >
                  {message.role === 'user' ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <img src="/logo.png" alt="NCS" className="w-5 h-5 object-contain" />
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={`
                    flex-1 max-w-[80%] ${message.role === 'user' ? 'flex justify-end' : ''}
                  `}
                >
                  <div
                    className={`
                      relative px-4 py-3 rounded-2xl
                      ${message.role === 'user'
                        ? 'bg-[#006633] text-white shadow-premium-sm'
                        : 'bg-white border border-[#006633]/10 text-gray-900 shadow-premium-sm'
                      }
                    `}
                  >
                    {/* Copy Button for Assistant */}
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {copiedId === message.id ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}

                    {/* Message Text */}
                    <div
                      className={`
                        prose prose-sm max-w-none
                        ${message.role === 'user'
                          ? 'prose-invert'
                          : 'prose-gray'
                        }
                      `}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {/* Timestamp */}
                    <div
                      className={`
                        text-[10px] mt-1.5
                        ${message.role === 'user'
                          ? 'text-white/80 text-right'
                          : 'text-gray-400'
                        }
                      `}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 bg-[#006633]/10 rounded-xl flex items-center justify-center shadow-premium-sm">
                <img src="/logo.png" alt="NCS" className="w-5 h-5 object-contain" />
              </div>
              <div className="bg-white border border-[#006633]/10 rounded-2xl rounded-tl-sm px-6 py-4 shadow-premium-sm">
                <div className="flex gap-1.5">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-[#006633]/10 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
                className="w-full px-4 py-3 bg-[#f5f5f0] border border-[#006633]/20 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] transition-all duration-200 text-gray-900 placeholder-[#006633]/40"
              />
              {!isLoading && input && (
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-[#006633] hover:text-[#004422] hover:bg-[#006633]/10 rounded-lg transition-colors"
                >
                  <Send size={18} />
                </button>
              )}
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <RefreshCw size={18} className="text-[#006633]/40 animate-spin" />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-[#006633] hover:bg-[#004422] text-white font-medium rounded-xl transition-all duration-200 shadow-premium-sm hover:shadow-premium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-premium-sm"
            >
              Send
            </button>
          </form>
          <div className="mt-2 text-xs text-[#006633]/40 text-center">
            Press Enter to send · Shift + Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;