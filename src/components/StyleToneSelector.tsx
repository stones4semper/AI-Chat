import React, { useState, useRef, useEffect } from 'react';
import { Sliders, Sparkles, Check, ChevronDown, BookOpen, Briefcase, Coffee, Code2, MessageSquare, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResponseTone, ResponseVerbosity } from '@/types';

interface StyleToneSelectorProps {
  currentTone?: ResponseTone;
  currentVerbosity?: ResponseVerbosity;
  customSystemPrompt?: string;
  onSelectTone: (tone: ResponseTone) => void;
  onSelectVerbosity: (verbosity: ResponseVerbosity) => void;
  onSaveSystemPrompt: (prompt: string) => void;
}

const TONES: { id: ResponseTone; label: string; description: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'default', label: 'Default', description: 'Standard helpful assistant style', icon: Sparkles },
  { id: 'professional', label: 'Professional', description: 'Polished, structured, corporate clarity', icon: Briefcase },
  { id: 'casual', label: 'Casual', description: 'Friendly, warm, conversational tone', icon: Coffee },
  { id: 'academic', label: 'Academic', description: 'Rigorous analysis, nuanced theory', icon: BookOpen },
  { id: 'technical', label: 'Technical', description: 'Code-first, direct & architectural focus', icon: Code2 },
  { id: 'customs', label: 'Custom Persona', description: 'User-defined instruction prompt', icon: Edit3 },
];

const VERBOSITIES: { id: ResponseVerbosity; label: string; desc: string }[] = [
  { id: 'concise', label: 'Concise', desc: 'Direct answers, bullet points' },
  { id: 'balanced', label: 'Balanced', desc: 'Natural standard depth' },
  { id: 'detailed', label: 'Detailed', desc: 'Comprehensive step-by-step' },
];

export const StyleToneSelector: React.FC<StyleToneSelectorProps> = ({
  currentTone = 'default',
  currentVerbosity = 'balanced',
  customSystemPrompt = '',
  onSelectTone,
  onSelectVerbosity,
  onSaveSystemPrompt,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customPromptDraft, setCustomPromptDraft] = useState(customSystemPrompt);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomPromptDraft(customSystemPrompt);
  }, [customSystemPrompt]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeToneObj = TONES.find(t => t.id === currentTone) || TONES[0];
  const IconComponent = activeToneObj.icon;

  const handleSavePrompt = () => {
    onSaveSystemPrompt(customPromptDraft);
    setShowPromptEditor(false);
    onSelectTone('customs');
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-200 text-xs font-medium transition-all shadow-sm group"
        title="Adjust tone and response verbosity"
      >
        <IconComponent className="w-3.5 h-3.5 text-blue-400 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline capitalize">{activeToneObj.label}</span>
        <span className="text-slate-500 hidden md:inline">|</span>
        <span className="text-slate-400 hidden md:inline capitalize">{currentVerbosity}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-[85vh] overflow-y-auto z-50 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-slate-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Tone & Verbosity</span>
              </div>
              <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                Preset
              </span>
            </div>

            {/* Verbosity Pills */}
            <div className="mt-3">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                Length & Depth
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                {VERBOSITIES.map((verb) => {
                  const isSelected = currentVerbosity === verb.id;
                  return (
                    <button
                      key={verb.id}
                      onClick={() => onSelectVerbosity(verb.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                      title={verb.desc}
                    >
                      {verb.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tone List */}
            <div className="mt-4">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                Response Persona
              </label>
              <div className="space-y-1.5">
                {TONES.map((tone) => {
                  const isSelected = currentTone === tone.id;
                  const ToneIcon = tone.icon;
                  return (
                    <button
                      key={tone.id}
                      onClick={() => {
                        onSelectTone(tone.id);
                        if (tone.id === 'customs') {
                          setShowPromptEditor(true);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-blue-500/10 border-blue-500/50 text-white'
                          : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          <ToneIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-medium leading-tight">{tone.label}</div>
                          <div className="text-[11px] text-slate-400">{tone.description}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Prompt Toggle / Editor */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowPromptEditor(!showPromptEditor)}
                className="w-full flex items-center justify-between text-xs text-blue-400 hover:text-blue-300 py-1 font-medium"
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {showPromptEditor ? 'Hide Custom Prompt' : 'Edit Custom System Prompt'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPromptEditor ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showPromptEditor && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2"
                  >
                    <textarea
                      value={customPromptDraft}
                      onChange={(e) => setCustomPromptDraft(e.target.value)}
                      placeholder="e.g. You are a senior software architect. Explain concepts using real-world analogies..."
                      rows={3}
                      className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={handleSavePrompt}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                      >
                        Apply System Prompt
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
