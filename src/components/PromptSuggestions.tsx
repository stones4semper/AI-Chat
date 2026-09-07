import React from 'react';
import { Sparkles, Code2, ShieldAlert, Cpu, ArrowUpRight, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
  mode?: 'empty_state' | 'follow_ups';
  customFollowUps?: string[];
}

const STARTER_PROMPTS = [
  {
    icon: Code2,
    title: 'Code Review & Optimization',
    prompt: 'Review and optimize the following code for time and memory complexity, pointing out potential security edge cases.',
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-800 dark:text-blue-300',
    iconColor: 'text-blue-600',
  },
  {
    icon: ShieldAlert,
    title: 'Customs & Trade Regulations',
    prompt: 'Explain the import documentation requirements, Form M processing, and HS code tariff classification under the Nigeria Customs Service.',
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Cpu,
    title: 'System Architecture Design',
    prompt: 'Design a resilient full-stack architecture capable of running local offline models with real-time browser synchronization.',
    color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-800 dark:text-purple-300',
    iconColor: 'text-purple-600',
  },
  {
    icon: Sparkles,
    title: 'Executive Briefing',
    prompt: 'Draft an executive briefing summarizing modern AI integration benefits, potential compliance risks, and strategic next steps.',
    color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300',
    iconColor: 'text-amber-600',
  },
];

const DEFAULT_FOLLOW_UPS = [
  'Can you provide a step-by-step code example?',
  'What are the common pitfalls and edge cases?',
  'Summarize this into 3 concise action items.',
  'How would I deploy and test this locally?',
];

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelectPrompt,
  mode = 'empty_state',
  customFollowUps,
}) => {
  if (mode === 'follow_ups') {
    const questions = customFollowUps && customFollowUps.length > 0 ? customFollowUps : DEFAULT_FOLLOW_UPS;

    return (
      <div className="pt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 select-none">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          <span>Suggested Follow-ups</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((question, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPrompt(question)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/70 text-xs text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
            >
              <span>{question}</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400 shrink-0" />
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#006633]/60 mb-3 text-center">
        Suggested Starters
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STARTER_PROMPTS.map((starter) => {
          const Icon = starter.icon;
          return (
            <motion.button
              key={starter.title}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectPrompt(starter.prompt)}
              className={`p-3.5 rounded-2xl border bg-gradient-to-br ${starter.color} text-left transition-all shadow-xs flex flex-col justify-between group`}
            >
              <div className="flex items-start justify-between w-full mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-white/80 shadow-xs ${starter.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">{starter.title}</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-[11px] opacity-75 line-clamp-2 leading-relaxed">
                {starter.prompt}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default PromptSuggestions;
