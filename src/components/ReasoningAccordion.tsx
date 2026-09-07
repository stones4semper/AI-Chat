import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Sparkles, Clock } from 'lucide-react';

interface ReasoningAccordionProps {
  reasoning: string;
  isStreaming?: boolean;
  duration?: number;
  className?: string;
}

export const extractReasoning = (content: string): { reasoning: string | null; response: string; isThinking: boolean } => {
  // Check for open thinking block
  const thinkStart = content.indexOf('<think>');
  if (thinkStart === -1) {
    return { reasoning: null, response: content, isThinking: false };
  }

  const thinkEnd = content.indexOf('</think>');
  if (thinkEnd === -1) {
    // Actively thinking (not closed yet)
    const reasoning = content.slice(thinkStart + 7).trim();
    const before = content.slice(0, thinkStart);
    return { reasoning, response: before, isThinking: true };
  }

  // Completed thinking
  const reasoning = content.slice(thinkStart + 7, thinkEnd).trim();
  const response = (content.slice(0, thinkStart) + content.slice(thinkEnd + 8)).trim();
  return { reasoning, response, isThinking: false };
};

export const ReasoningAccordion: React.FC<ReasoningAccordionProps> = ({
  reasoning,
  isStreaming = false,
  duration,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(isStreaming);

  if (!reasoning || reasoning.trim() === '') return null;

  return (
    <div className={`my-2 rounded-xl border border-purple-500/20 bg-purple-500/5 overflow-hidden transition-all duration-200 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-purple-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <Sparkles size={14} className="text-purple-600 animate-spin" />
          ) : (
            <Brain size={14} className="text-purple-600" />
          )}
          <span className="text-xs font-medium text-purple-900">
            {isStreaming ? 'Thinking process...' : 'Reasoning Process'}
          </span>
          {duration !== undefined && duration > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-purple-700/60 font-mono bg-purple-500/10 px-1.5 py-0.5 rounded">
              <Clock size={10} />
              {duration.toFixed(1)}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-purple-700/60 text-xs">
          <span className="text-[10px]">{isOpen ? 'Hide' : 'Show'}</span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 py-3 border-t border-purple-500/10 bg-white/40 text-xs text-gray-700 leading-relaxed font-mono whitespace-pre-wrap max-h-80 overflow-y-auto">
          {reasoning}
        </div>
      )}
    </div>
  );
};

export default ReasoningAccordion;
