import React, { useState, useRef } from 'react';
import { Columns, Play, X, RotateCcw, Copy, Check, Clock, Cpu, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ollamaService } from '@/services/ollama';

interface ModelCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableModels: string[];
}

export const ModelCompareModal: React.FC<ModelCompareModalProps> = ({
  isOpen,
  onClose,
  availableModels,
}) => {
  const [modelA, setModelA] = useState<string>(availableModels[0] || 'qwen:latest');
  const [modelB, setModelB] = useState<string>(availableModels[1] || availableModels[0] || 'qwen:latest');
  const [prompt, setPrompt] = useState('');
  const [responseA, setResponseA] = useState('');
  const [responseB, setResponseB] = useState('');
  const [isGeneratingA, setIsGeneratingA] = useState(false);
  const [isGeneratingB, setIsGeneratingB] = useState(false);
  const [durationA, setDurationA] = useState<number | null>(null);
  const [durationB, setDurationB] = useState<number | null>(null);
  const [copiedPanel, setCopiedPanel] = useState<'A' | 'B' | null>(null);

  const abortA = useRef<AbortController | null>(null);
  const abortB = useRef<AbortController | null>(null);

  if (!isOpen) return null;

  const handleRunComparison = async () => {
    if (!prompt.trim() || isGeneratingA || isGeneratingB) return;

    setResponseA('');
    setResponseB('');
    setDurationA(null);
    setDurationB(null);

    setIsGeneratingA(true);
    setIsGeneratingB(true);

    abortA.current = new AbortController();
    abortB.current = new AbortController();

    const startA = Date.now();
    const startB = Date.now();

    // Model A stream
    const runA = ollamaService.streamResponse(
      prompt,
      modelA,
      (chunk) => {
        setResponseA((prev) => prev + chunk);
      },
      abortA.current.signal
    ).then(() => {
      setDurationA((Date.now() - startA) / 1000);
    }).catch((err) => {
      console.error('Error generating Model A:', err);
    }).finally(() => {
      setIsGeneratingA(false);
    });

    // Model B stream
    const runB = ollamaService.streamResponse(
      prompt,
      modelB,
      (chunk) => {
        setResponseB((prev) => prev + chunk);
      },
      abortB.current.signal
    ).then(() => {
      setDurationB((Date.now() - startB) / 1000);
    }).catch((err) => {
      console.error('Error generating Model B:', err);
    }).finally(() => {
      setIsGeneratingB(false);
    });

    await Promise.allSettled([runA, runB]);
  };

  const handleCopy = (text: string, panel: 'A' | 'B') => {
    navigator.clipboard.writeText(text);
    setCopiedPanel(panel);
    setTimeout(() => setCopiedPanel(null), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Columns className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Side-by-Side Model Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  Compare responses, quality, and generation latency between two local Ollama models.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Model Pickers Bar */}
          <div className="grid grid-cols-2 gap-4 px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            {/* Model A Selector */}
            <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs">A</div>
                <select
                  value={modelA}
                  onChange={(e) => setModelA(e.target.value)}
                  className="text-xs font-semibold bg-transparent text-blue-950 dark:text-blue-200 outline-none cursor-pointer"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              {durationA !== null && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-blue-700 dark:text-blue-300">
                  <Clock className="w-3 h-3" />
                  <span>{durationA.toFixed(2)}s</span>
                </div>
              )}
            </div>

            {/* Model B Selector */}
            <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-900/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs">B</div>
                <select
                  value={modelB}
                  onChange={(e) => setModelB(e.target.value)}
                  className="text-xs font-semibold bg-transparent text-purple-950 dark:text-purple-200 outline-none cursor-pointer"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              {durationB !== null && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-purple-700 dark:text-purple-300">
                  <Clock className="w-3 h-3" />
                  <span>{durationB.toFixed(2)}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Comparison Panels */}
          <div className="flex-1 grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800 overflow-hidden bg-slate-50/30 dark:bg-slate-950/30">
            {/* Panel A */}
            <div className="flex flex-col h-full overflow-hidden p-4">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <span className="font-medium text-slate-700 dark:text-slate-300">{modelA}</span>
                {responseA && (
                  <button
                    onClick={() => handleCopy(responseA, 'A')}
                    className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    {copiedPanel === 'A' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPanel === 'A' ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto text-xs text-slate-800 dark:text-slate-200 prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                {isGeneratingA && !responseA && (
                  <div className="flex items-center gap-2 text-blue-500 py-6">
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Streaming response from {modelA}...</span>
                  </div>
                )}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{responseA}</ReactMarkdown>
              </div>
            </div>

            {/* Panel B */}
            <div className="flex flex-col h-full overflow-hidden p-4">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <span className="font-medium text-slate-700 dark:text-slate-300">{modelB}</span>
                {responseB && (
                  <button
                    onClick={() => handleCopy(responseB, 'B')}
                    className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    {copiedPanel === 'B' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPanel === 'B' ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto text-xs text-slate-800 dark:text-slate-200 prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                {isGeneratingB && !responseB && (
                  <div className="flex items-center gap-2 text-purple-500 py-6">
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Streaming response from {modelB}...</span>
                  </div>
                )}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{responseB}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Prompt Input Footer */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleRunComparison();
                  }
                }}
                placeholder="Type a prompt to run simultaneously across both models..."
                rows={2}
                className="flex-1 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none"
              />
              <button
                onClick={handleRunComparison}
                disabled={!prompt.trim() || isGeneratingA || isGeneratingB}
                className="px-5 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl font-medium text-xs flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none transition-all"
              >
                {isGeneratingA || isGeneratingB ? (
                  <RotateCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>Compare</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ModelCompareModal;
