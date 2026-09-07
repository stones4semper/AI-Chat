import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, User, Copy, Check, RefreshCw, Pin, PinOff, Cpu,
  Edit2, X, Terminal, FileText,
  ArrowDown, RotateCcw, Loader2, Reply, Quote, Eye, EyeOff,
  CheckCheck, Square
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '@/types';
import { useChat } from '@/context/ChatContext';
import remarkGfm from 'remark-gfm';

// UPDATE: Add onStopGeneration to the interface
interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string, messageId?: string, replyToId?: string) => Promise<void>;
  onRegenerateMessage: (messageId: string) => Promise<void>;
  onStopGeneration?: () => void; // Added this
  isLoading: boolean;
  chatId: string | null;
}

// Detect if content contains HTML code
const detectHtml = (content: string): { isHtml: boolean; htmlContent: string } => {
  const htmlPattern = /<!DOCTYPE\s+html|<html[\s>]|<\w+[^>]*>[\s\S]*<\/\w+>/i;
  const match = content.match(htmlPattern);
  
  if (match) {
    const startIndex = content.indexOf(match[0]);
    let endIndex = content.lastIndexOf('</html>');
    if (endIndex === -1) {
      endIndex = content.lastIndexOf('</body>');
    }
    if (endIndex === -1) {
      endIndex = content.length;
    } else {
      endIndex += 7;
    }
    
    const htmlContent = content.substring(startIndex, endIndex).trim();
    return { isHtml: true, htmlContent };
  }
  
  return { isHtml: false, htmlContent: '' };
};

// Code Block Component
const CodeBlock: React.FC<{ 
  language: string; 
  value: string; 
  onCopy: (code: string) => void; 
  copiedCode: string | null;
  isHtml?: boolean;
}> = ({ language, value, onCopy, copiedCode, isHtml = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const isCopied = copiedCode === value;

  return (
    <div 
      className="relative group my-3 rounded-lg overflow-hidden border border-gray-200/50 shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between bg-[#1e1e1e] text-gray-300 px-4 py-2">
        <div className="flex items-center gap-2.5">
          <Terminal size={14} className="text-gray-400" />
          <span className="text-xs font-mono font-medium text-gray-300 uppercase tracking-wider">
            {language || 'html'}
          </span>
          <span className="text-[10px] text-gray-500">
            {value.split('\n').length} lines
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isHtml && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-gray-700 transition-colors text-gray-400 hover:text-white text-xs"
            >
              {showPreview ? (
                <>
                  <EyeOff size={14} />
                  Code
                </>
              ) : (
                <>
                  <Eye size={14} />
                  Preview
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => onCopy(value)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-200
              ${isCopied 
                ? 'text-green-400 bg-green-400/10' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }
              ${isHovered || isCopied ? 'opacity-100' : 'opacity-0'}
            `}
          >
            {isCopied ? (
              <>
                <CheckCheck size={14} />
                <span className="text-xs">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span className="text-xs">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isHtml && showPreview ? (
        <div className="bg-white p-4">
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
            <FileText size={12} />
            <span>HTML Preview</span>
          </div>
          <div 
            className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg border border-gray-200"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      ) : (
        <SyntaxHighlighter
          language={language || 'html'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '16px',
            fontSize: '13px',
            lineHeight: '1.7',
            background: '#0d1117',
            borderRadius: 0,
          }}
          showLineNumbers={value.split('\n').length > 2}
          wrapLines={true}
          wrapLongLines={true}
          lineNumberStyle={{
            color: '#4a4a4a',
            fontSize: '12px',
            minWidth: '2.5em',
            paddingRight: '1em',
            userSelect: 'none',
          }}
        >
          {value}
        </SyntaxHighlighter>
      )}
    </div>
  );
};

// Main Chat Interface Component - UPDATE: Add onStopGeneration to destructuring
const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onRegenerateMessage,
  onStopGeneration, // Added this
  isLoading,
  chatId,
}) => {
  const [input, setInput] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  
  const { togglePinChat, chats } = useChat();
  const currentChat = chats.find(c => c.id === chatId);

  // Smart scrolling logic
  const isUserScrolling = useRef(false);
  const previousMessageCount = useRef(messages.length);

  const scrollToBottom = useCallback((smooth: boolean = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    });
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const bottomThreshold = 100;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < bottomThreshold;
    const isScrolledUp = scrollTop < scrollHeight - clientHeight - 200;

    setIsAtBottom(isNearBottom);
    setShowScrollButton(isScrolledUp);
    
    if (isNearBottom) {
      setNewMessagesCount(0);
      isUserScrolling.current = false;
    } else {
      isUserScrolling.current = true;
    }
  }, []);

  // Handle new messages for smart scrolling
  useEffect(() => {
    const currentMessageCount = messages.length;
    const hasNewMessages = currentMessageCount > previousMessageCount.current;
    
    if (hasNewMessages) {
      if (isUserScrolling.current || !isAtBottom) {
        setNewMessagesCount(prev => prev + (currentMessageCount - previousMessageCount.current));
      } else {
        scrollToBottom(true);
      }
    }
    
    previousMessageCount.current = currentMessageCount;
  }, [messages, scrollToBottom, isAtBottom]);

  // Set up scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Focus input on load
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingMessageId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingMessageId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    
    if (replyToId) {
      await onSendMessage(message, undefined, replyToId);
      setReplyToId(null);
    } else {
      await onSendMessage(message);
    }
    
    isUserScrolling.current = false;
    setNewMessagesCount(0);
    setIsAtBottom(true);
    setTimeout(() => scrollToBottom(true), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingContent.trim()) return;
    
    const messageId = editingMessageId;
    const newContent = editingContent.trim();
    
    setEditingMessageId(null);
    setEditingContent('');
    
    await onSendMessage(newContent, messageId);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleRegenerate = async (messageId: string) => {
    setRegeneratingId(messageId);
    await onRegenerateMessage(messageId);
    setRegeneratingId(null);
  };

  const handleReply = (message: Message) => {
    setReplyToId(message.id);
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyToId(null);
  };

  const handleJumpToLatest = () => {
    isUserScrolling.current = false;
    setNewMessagesCount(0);
    setIsAtBottom(true);
    scrollToBottom(true);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getModelDisplayName = (modelName: string) => {
    if (!modelName) return 'Qwen';
    const name = modelName.toLowerCase();
    if (name.includes('qwen')) return 'Qwen';
    if (name.includes('llama')) return 'Llama';
    if (name.includes('mistral')) return 'Mistral';
    if (name.includes('gemma')) return 'Gemma';
    if (name.includes('phi')) return 'Phi';
    if (name.includes('codellama')) return 'CodeLlama';
    return modelName.split(':')[0].charAt(0).toUpperCase() + 
           modelName.split(':')[0].slice(1);
  };

  const getModelColor = (modelName: string) => {
    if (!modelName) return 'text-blue-600 bg-blue-50 border-blue-200';
    const name = modelName.toLowerCase();
    if (name.includes('qwen')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (name.includes('llama')) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (name.includes('mistral')) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (name.includes('gemma')) return 'text-green-600 bg-green-50 border-green-200';
    if (name.includes('phi')) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (name.includes('codellama')) return 'text-cyan-600 bg-cyan-50 border-cyan-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getReplyPreview = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return '';
    const preview = message.content.slice(0, 60) + (message.content.length > 60 ? '...' : '');
    return `Replying to: "${preview}"`;
  };

  // Process message content to detect and highlight HTML
  const renderMessageContent = (content: string, isUser: boolean) => {
    const { isHtml, htmlContent } = detectHtml(content);
    
    if (isHtml) {
      const beforeHtml = content.substring(0, content.indexOf(htmlContent));
      const afterHtml = content.substring(content.indexOf(htmlContent) + htmlContent.length);
      
      return (
        <>
          {beforeHtml && (
            <div className="prose prose-sm max-w-none prose-gray">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {beforeHtml}
              </ReactMarkdown>
            </div>
          )}
          <CodeBlock
            language="html"
            value={htmlContent}
            onCopy={copyCodeToClipboard}
            copiedCode={copiedCode}
            isHtml={true}
          />
          {afterHtml && (
            <div className="prose prose-sm max-w-none prose-gray">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {afterHtml}
              </ReactMarkdown>
            </div>
          )}
        </>
      );
    }
    
    return (
      <div
        className={`
          prose prose-sm max-w-none
          ${isUser ? 'prose-invert' : 'prose-gray'}
          prose-pre:bg-transparent prose-pre:p-0
          prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:code:bg-transparent prose-pre:code:text-inherit
          prose-headings:font-semibold
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
          prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2
          prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2
          prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:text-gray-600
          prose-code:before:content-none prose-code:after:content-none
        `}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const inline = !className || !className.includes('language-');
              const codeString = String(children).replace(/\n$/, '');
              
              if (!inline && language) {
                return (
                  <CodeBlock
                    language={language}
                    value={codeString}
                    onCopy={copyCodeToClipboard}
                    copiedCode={copiedCode}
                    isHtml={language === 'html' || language === 'htm'}
                  />
                );
              }
              
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            table: ({ children }) => (
              <div className="overflow-x-auto my-2">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  {children}
                </table>
              </div>
            ),
            a: ({ href, children }) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline decoration-2 decoration-blue-300 hover:decoration-blue-500 transition-colors"
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f0]">
      {/* Chat Header */}
      <div className="border-b border-[#006633]/10 bg-white/80 backdrop-blur-sm px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[#006633]">
            {messages.length > 0 ? `${messages.length} messages` : 'New conversation'}
          </span>
          {currentChat && currentChat.model && (
            <div className={`
              flex items-center gap-1.5 text-[10px] font-medium
              px-2 py-0.5 rounded-full border
              ${getModelColor(currentChat.model)}
            `}>
              <Cpu size={10} />
              <span>{getModelDisplayName(currentChat.model)}</span>
            </div>
          )}
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
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-premium-sm border-2 border-[#006633]/20 p-2">
                <img src="/logo.png" alt="NCS Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-[#006633] mb-2">
                Nigeria Customs AI
              </h2>
              <p className="text-[#006633]/70 max-w-md mb-4">
                Ask anything about customs, trade, or general inquiries. Justice & Honesty in every response.
              </p>
              {currentChat && currentChat.model && (
                <div className="flex items-center gap-2 text-xs text-[#006633]/50 bg-white px-3 py-1.5 rounded-full border border-[#006633]/10">
                  <Cpu size={12} />
                  <span>Using <strong>{getModelDisplayName(currentChat.model)}</strong></span>
                </div>
              )}
            </div>
          ) : (
            messages.map((message, index) => {
              const isUser = message.role === 'user';
              const isEditing = editingMessageId === message.id;
              const isRegenerating = regeneratingId === message.id;
              const isReplying = replyToId === message.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 animate-fade-in ${
                    isUser ? 'flex-row-reverse' : ''
                  } ${isReplying ? 'opacity-70' : ''}`}
                >
                  <div
                    className={`
                      flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
                      ${isUser
                        ? 'bg-[#006633] shadow-premium-sm'
                        : 'bg-[#006633]/10 shadow-premium-sm'
                      }
                    `}
                  >
                    {isUser ? (
                      <User size={16} className="text-white" />
                    ) : (
                      <img src="/logo.png" alt="NCS" className="w-5 h-5 object-contain" />
                    )}
                  </div>

                  <div
                    className={`
                      flex-1 max-w-[85%] ${isUser ? 'flex justify-end' : ''}
                    `}
                  >
                    <div
                      className={`
                        relative px-4 py-3 rounded-2xl
                        ${isUser
                          ? 'bg-[#006633] text-white shadow-premium-sm'
                          : 'bg-white border border-[#006633]/10 text-gray-900 shadow-premium-sm'
                        }
                        ${isEditing ? 'min-w-[300px]' : ''}
                        ${isReplying ? 'border-2 border-[#006633]' : ''}
                        group
                      `}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            ref={editInputRef}
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            className="w-full min-h-[80px] p-2 bg-[#f5f5f0] border border-[#006633]/30 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] resize-y"
                            placeholder="Edit your message..."
                            rows={3}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={!editingContent.trim() || isLoading}
                              className="px-3 py-1 text-xs bg-[#006633] text-white hover:bg-[#004422] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                'Save & Regenerate'
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {message.replyToId && (
                            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] opacity-60 border-l-2 border-[#006633] pl-2">
                              <Quote size={10} />
                              <span>Replying to {message.replyToId === messages[index - 1]?.id ? 'previous' : 'a'} message</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium opacity-70">
                                {isUser ? 'You' : getModelDisplayName(currentChat?.model || '')}
                              </span>
                              {message.edited && (
                                <span className="text-[8px] opacity-50">(edited)</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!isUser && (
                                <button
                                  onClick={() => handleReply(message)}
                                  className={`p-1 rounded transition-colors ${
                                    isUser 
                                      ? 'hover:bg-white/20 text-white/60 hover:text-white'
                                      : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                                  }`}
                                  title="Reply to this message"
                                >
                                  <Reply size={12} />
                                </button>
                              )}
                              
                              {isUser && (
                                <button
                                  onClick={() => handleEditMessage(message)}
                                  className={`p-1 rounded transition-colors ${
                                    isUser 
                                      ? 'hover:bg-white/20 text-white/60 hover:text-white'
                                      : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                                  }`}
                                  title="Edit message"
                                >
                                  <Edit2 size={12} />
                                </button>
                              )}
                              
                              <button
                                onClick={() => copyToClipboard(message.content, message.id)}
                                className={`p-1 rounded transition-colors ${
                                  isUser 
                                    ? 'hover:bg-white/20 text-white/60 hover:text-white'
                                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                                }`}
                                title="Copy message"
                              >
                                {copiedMessageId === message.id ? (
                                  <Check size={12} className="text-green-500" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                              
                              {!isUser && (
                                <button
                                  onClick={() => handleRegenerate(message.id)}
                                  disabled={isRegenerating || isLoading}
                                  className={`p-1 rounded transition-colors ${
                                    isRegenerating
                                      ? 'text-blue-500 animate-spin'
                                      : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                                  }`}
                                  title="Regenerate response"
                                >
                                  <RotateCcw size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {renderMessageContent(message.content, isUser)}

                          <div
                            className={`
                              text-[10px] mt-1.5
                              ${isUser ? 'text-white/80 text-right' : 'text-gray-400'}
                            `}
                          >
                            {formatTime(message.timestamp)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
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
                {currentChat?.model && (
                  <div className="text-[8px] text-gray-400 mt-2 flex items-center gap-1 justify-center">
                    <Cpu size={8} />
                    <span>{getModelDisplayName(currentChat.model)} is thinking...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Jump to Latest Button */}
      {showScrollButton && newMessagesCount > 0 && (
        <button
          onClick={handleJumpToLatest}
          className="fixed bottom-28 right-8 z-10 flex items-center gap-2 px-4 py-2.5 bg-[#006633] text-white rounded-full shadow-premium-lg hover:bg-[#004422] transition-all duration-200 hover:scale-105 animate-slide-up group"
        >
          <ArrowDown size={16} className="group-hover:animate-bounce" />
          <span className="text-sm font-medium">{newMessagesCount} new</span>
        </button>
      )}

      {/* Input Area */}
      <div className="border-t border-[#006633]/10 bg-white/80 backdrop-blur-sm flex-shrink-0">
        {replyToId && (
          <div className="max-w-4xl mx-auto px-4 pt-3">
            <div className="flex items-center justify-between bg-[#006633]/5 border border-[#006633]/20 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-[#006633]">
                <Reply size={14} />
                <span className="font-medium">Replying to:</span>
                <span className="text-[#006633]/70 truncate max-w-md">
                  {getReplyPreview(replyToId)}
                </span>
              </div>
              <button
                onClick={handleCancelReply}
                className="p-1 hover:bg-[#006633]/10 rounded-lg transition-colors"
              >
                <X size={14} className="text-[#006633]/60" />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  replyToId 
                    ? "Reply to selected message..." 
                    : isLoading 
                      ? `Waiting for ${currentChat?.model ? getModelDisplayName(currentChat.model) : 'AI'}...` 
                      : "Type your message..."
                }
                disabled={isLoading}
                className={`w-full px-4 py-3 bg-[#f5f5f0] border rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] transition-all duration-200 text-gray-900 placeholder-[#006633]/40 disabled:opacity-50 disabled:cursor-not-allowed ${
                  replyToId ? 'border-[#006633] border-2' : 'border-[#006633]/20'
                }`}
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
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {/* Stop Button */}
                  {onStopGeneration && (
                    <button
                      type="button"
                      onClick={onStopGeneration}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-md"
                      title="Stop generating"
                    >
                      <Square size={16} />
                    </button>
                  )}
                  <RefreshCw size={18} className="text-[#006633]/40 animate-spin" />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`px-6 py-3 bg-[#006633] hover:bg-[#004422] text-white font-medium rounded-xl transition-all duration-200 shadow-premium-sm hover:shadow-premium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-premium-sm disabled:hover:bg-[#006633] ${
                replyToId ? 'ring-2 ring-[#006633]/30' : ''
              }`}
            >
              {isLoading ? 'Sending...' : replyToId ? 'Reply' : 'Send'}
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[#006633]/40">
              Press Enter to send · Shift + Enter for new line
            </span>
            <div className="flex items-center gap-3">
              {replyToId && (
                <span className="text-[10px] text-[#006633]/50 flex items-center gap-1">
                  <Reply size={10} />
                  Reply mode
                </span>
              )}
              {currentChat?.model && (
                <span className="text-[10px] text-[#006633]/30 flex items-center gap-1">
                  <Cpu size={10} />
                  {getModelDisplayName(currentChat.model)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;