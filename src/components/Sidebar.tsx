import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, MessageSquare, Trash2, Menu, X, Shield, Scale, 
  Pin, PinOff, Pencil, Check, X as XIcon, Star 
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useChat } from '@/context/ChatContext';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { 
    chats, 
    currentChatId, 
    createNewChat, 
    deleteChat, 
    renameChat,
    togglePinChat,
    selectChat 
  } = useChat();

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingChatId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingChatId]);

  const handleRename = (id: string) => {
    if (editingTitle.trim()) {
      renameChat(id, editingTitle);
    }
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleRename(id);
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
      setEditingTitle('');
    }
  };

  const startEditing = (chat: any) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const pinnedChats = chats.filter(chat => chat.pinned);
  const unpinnedChats = chats.filter(chat => !chat.pinned);

  const ChatItem = ({ chat }: { chat: any }) => {
    const isActive = currentChatId === chat.id;
    const isEditing = editingChatId === chat.id;

    return (
      <div
        className={`
          group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
          transition-all duration-200 cursor-pointer
          ${isActive
            ? 'bg-[#006633]/5 border border-[#006633]/20 shadow-premium-sm'
            : 'hover:bg-[#006633]/5 border border-transparent'
          }
        `}
      >
        <div 
          className="flex-1 min-w-0"
          onClick={() => {
            selectChat(chat.id);
            setIsMobileOpen(false);
          }}
        >
          <div className="flex items-center gap-2">
            {chat.pinned && (
              <Pin size={12} className="text-[#006633] flex-shrink-0" />
            )}
            {isEditing ? (
              <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, chat.id)}
                  className="flex-1 text-sm font-medium bg-white border border-[#006633]/30 rounded-lg px-2 py-1 outline-none focus:border-[#006633]"
                  maxLength={50}
                />
                <button
                  onClick={() => handleRename(chat.id)}
                  className="p-1 hover:bg-[#006633]/10 rounded-lg text-[#006633]"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setEditingChatId(null);
                    setEditingTitle('');
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"
                >
                  <XIcon size={14} />
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-[#006633] truncate">
                  {chat.title}
                </p>
                {chat.messages.length === 0 && (
                  <span className="text-[8px] text-[#006633]/40 bg-[#006633]/5 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    empty
                  </span>
                )}
              </>
            )}
          </div>
          {!isEditing && (
            <>
              <p className="text-xs text-[#006633]/60 truncate mt-0.5">
                {chat.messages[chat.messages.length - 1]?.content.slice(0, 35) || 'No messages yet'}
              </p>
              <p className="text-[10px] text-[#006633]/40 mt-0.5">
                {new Date(chat.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePinChat(chat.id);
              }}
              className="p-1.5 rounded-lg hover:bg-[#006633]/10 text-[#006633]/40 hover:text-[#006633] transition-colors"
              title={chat.pinned ? 'Unpin' : 'Pin'}
            >
              {chat.pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEditing(chat);
              }}
              className="p-1.5 rounded-lg hover:bg-[#006633]/10 text-[#006633]/40 hover:text-[#006633] transition-colors"
              title="Rename"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this chat?')) {
                  deleteChat(chat.id);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-[#006633]/40 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-white rounded-xl shadow-premium-sm border border-[#006633]/10 hover:shadow-premium transition-shadow"
      >
        {isMobileOpen ? <X size={18} className="text-[#006633]" /> : <Menu size={18} className="text-[#006633]" />}
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-80 bg-white border-r border-[#006633]/10
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shadow-premium-sm
        `}
      >
        {/* Header with Logo */}
        <div className="p-4 border-b border-[#006633]/10 bg-gradient-to-r from-[#006633]/5 to-white">
          <Logo size="md" />
          <div className="flex items-center gap-2 mt-2 ml-[52px] -mt-1">
            <Scale size={10} className="text-[#006633]" />
            <p className="text-[9px] font-medium text-[#006633]/60 tracking-[0.15em]">
              JUSTICE & HONESTY
            </p>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={createNewChat}
            className="w-full py-2.5 px-4 bg-[#006633] hover:bg-[#004422] text-white font-medium rounded-xl flex items-center justify-center gap-2 text-sm transition-all duration-200 shadow-premium-sm hover:shadow-premium"
          >
            <Plus size={16} />
            New Conversation
          </button>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {chats.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-[#006633]/10 to-[#008844]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield size={24} className="text-[#006633]/40" />
              </div>
              <p className="text-sm font-medium text-[#006633]/80">No conversations</p>
              <p className="text-xs text-[#006633]/50 mt-1">Start a new chat above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pinned Chats */}
              {pinnedChats.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 py-1">
                    <Pin size={12} className="text-[#006633]/40" />
                    <span className="text-[10px] font-medium text-[#006633]/40 uppercase tracking-wider">
                      Pinned
                    </span>
                    <div className="flex-1 h-px bg-[#006633]/10" />
                  </div>
                  <div className="space-y-1 mt-1">
                    {pinnedChats.map((chat) => (
                      <ChatItem key={chat.id} chat={chat} />
                    ))}
                  </div>
                </div>
              )}

              {/* Unpinned Chats */}
              {unpinnedChats.length > 0 && (
                <div>
                  {pinnedChats.length > 0 && (
                    <div className="flex items-center gap-2 px-2 py-1">
                      <span className="text-[10px] font-medium text-[#006633]/40 uppercase tracking-wider">
                        All Chats
                      </span>
                      <div className="flex-1 h-px bg-[#006633]/10" />
                    </div>
                  )}
                  <div className="space-y-1 mt-1">
                    {unpinnedChats.map((chat) => (
                      <ChatItem key={chat.id} chat={chat} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#006633]/10 bg-gradient-to-r from-[#006633]/5 to-white">
          <div className="flex items-center justify-between text-xs text-[#006633]/60">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#006633] animate-pulse" />
              <span>NCS AI Ready</span>
            </div>
            <div className="flex items-center gap-2 text-[#006633]/40">
              <span>{chats.length} chats</span>
              <span>·</span>
              <span>v2.0</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;