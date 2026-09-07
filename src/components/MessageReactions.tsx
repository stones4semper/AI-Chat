import React, { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Star, Smile, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '@/types';

interface MessageReactionsProps {
  message: Message;
  chatId: string;
  onFeedback: (feedback: 'like' | 'dislike' | null) => void;
  onToggleStar: () => void;
  onAddReaction: (emoji: string) => void;
  onCopy?: () => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '💡', '🚀', '🎉', '👏', '🧠'];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  message,
  onFeedback,
  onToggleStar,
  onAddReaction,
  onCopy,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else {
      navigator.clipboard.writeText(message.content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reactions = message.reactions || {};
  const userReactions = message.userReactions || [];
  const reactionEntries = Object.entries(reactions).filter(([_, count]) => count > 0);

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs text-slate-400 select-none">
      {/* Existing Reaction Badges */}
      {reactionEntries.map(([emoji, count]) => {
        const isUserReacted = userReactions.includes(emoji);
        return (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddReaction(emoji)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs transition-colors ${
              isUserReacted
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 font-medium'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <span>{emoji}</span>
            <span>{count}</span>
          </motion.button>
        );
      })}

      {/* Add Reaction Button & Popover */}
      <div className="relative" ref={pickerRef}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPicker(!showPicker)}
          title="Add reaction"
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <Smile className="w-3.5 h-3.5" />
        </motion.button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 mb-1 z-30 flex items-center gap-1 p-1.5 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-xl"
            >
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onAddReaction(emoji);
                    setShowPicker(false);
                  }}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-base hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-3 w-px bg-slate-800 mx-0.5" />

      {/* Like / Dislike */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onFeedback(message.userFeedback === 'like' ? null : 'like')}
        title="Helpful response"
        className={`p-1 rounded-md transition-colors ${
          message.userFeedback === 'like'
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
        }`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onFeedback(message.userFeedback === 'dislike' ? null : 'dislike')}
        title="Unhelpful response"
        className={`p-1 rounded-md transition-colors ${
          message.userFeedback === 'dislike'
            ? 'text-rose-400 bg-rose-500/10'
            : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
        }`}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </motion.button>

      {/* Star / Bookmark */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleStar}
        title={message.starred ? 'Remove bookmark' : 'Bookmark message'}
        className={`p-1 rounded-md transition-colors ${
          message.starred
            ? 'text-amber-400 bg-amber-500/10 fill-amber-400'
            : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
        }`}
      >
        <Star className={`w-3.5 h-3.5 ${message.starred ? 'fill-amber-400' : ''}`} />
      </motion.button>

      {/* Copy Content */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy response text'}
        className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </motion.button>
    </div>
  );
};
