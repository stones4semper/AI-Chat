import React, { useState } from 'react';
import { Star, X, Search, ExternalLink, Trash2, Copy, Check, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/context/ChatContext';
import type { Message } from '@/types';

interface StarredDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToMessage?: (chatId: string, messageId: string) => void;
}

interface StarredItem {
  chatId: string;
  chatTitle: string;
  model: string;
  message: Message;
}

export const StarredDrawer: React.FC<StarredDrawerProps> = ({
  isOpen,
  onClose,
  onJumpToMessage,
}) => {
  const { chats, toggleStarMessage, selectChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Aggregate all starred messages across all chats
  const starredItems: StarredItem[] = [];
  chats.forEach((chat) => {
    chat.messages.forEach((msg) => {
      if (msg.starred) {
        starredItems.push({
          chatId: chat.id,
          chatTitle: chat.title,
          model: chat.model,
          message: msg,
        });
      }
    });
  });

  const filteredItems = starredItems.filter((item) =>
    item.message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.chatTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleJump = (chatId: string, messageId: string) => {
    selectChat(chatId);
    if (onJumpToMessage) {
      onJumpToMessage(chatId, messageId);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-slate-900/95 border-l border-slate-800 shadow-2xl flex flex-col backdrop-blur-xl text-slate-100"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Star className="w-5 h-5 fill-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Bookmarked Messages</h2>
                    <p className="text-xs text-slate-400">
                      {starredItems.length} saved {starredItems.length === 1 ? 'message' : 'messages'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bookmarks..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="p-4 rounded-full bg-slate-800/50 mb-3 border border-slate-700/50">
                      <Star className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">No bookmarks found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      {searchQuery
                        ? 'Try searching with different keywords.'
                        : 'Click the star icon under any assistant message to save key responses here.'}
                    </p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <motion.div
                      key={item.message.id}
                      layout
                      className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600/80 transition-all flex flex-col gap-2.5 group"
                    >
                      {/* Meta header */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="font-medium text-slate-200 truncate">{item.chatTitle}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {new Date(item.message.timestamp).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Content preview */}
                      <p className="text-xs text-slate-300 line-clamp-4 whitespace-pre-wrap font-mono leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                        {item.message.content}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[11px] text-blue-400/80 font-mono">
                          {item.model}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(item.message.content, item.message.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                            title="Copy message"
                          >
                            {copiedId === item.message.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleJump(item.chatId, item.message.id)}
                            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors"
                            title="Jump to conversation"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleStarMessage(item.chatId, item.message.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                            title="Remove bookmark"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
