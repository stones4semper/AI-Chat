import React, { useState } from 'react';
import { Download, FileText, FileCode, Printer, Check, Copy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Chat } from '@/types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat?: Chat;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, chat }) => {
  const [copied, setCopied] = useState(false);

  if (!chat) return null;

  const generateMarkdown = () => {
    let md = `# ${chat.title}\n\n`;
    md += `- **Date**: ${new Date(chat.createdAt).toLocaleString()}\n`;
    md += `- **Model**: ${chat.model}\n`;
    if (chat.tone) md += `- **Persona / Tone**: ${chat.tone}\n`;
    if (chat.systemPrompt) md += `- **System Prompt**: ${chat.systemPrompt}\n`;
    md += `\n---\n\n`;

    chat.messages.forEach((msg) => {
      const role = msg.role === 'user' ? '👤 User' : `🤖 Assistant (${chat.model})`;
      const time = new Date(msg.timestamp).toLocaleTimeString();
      md += `### ${role}  *${time}*\n\n`;
      if (msg.reasoning) {
        md += `> **Reasoning**:\n> ${msg.reasoning.replace(/\n/g, '\n> ')}\n\n`;
      }
      md += `${msg.content}\n\n---\n\n`;
    });

    return md;
  };

  const generateText = () => {
    let txt = `${chat.title.toUpperCase()}\n`;
    txt += `Model: ${chat.model} | Date: ${new Date(chat.createdAt).toLocaleString()}\n\n`;
    txt += `==============================================\n\n`;

    chat.messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
      const time = new Date(msg.timestamp).toLocaleTimeString();
      txt += `[${time}] ${role}:\n${msg.content}\n\n`;
    });

    return txt;
  };

  const generateJSON = () => {
    return JSON.stringify(chat, null, 2);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Export Conversation</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[260px]">{chat.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Export Options */}
            <div className="p-5 space-y-3">
              {/* Markdown */}
              <button
                onClick={() => downloadFile(generateMarkdown(), `${chat.title.replace(/\s+/g, '_')}.md`, 'text/markdown')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Markdown (.md)</p>
                    <p className="text-xs text-slate-500">Formatted with headers, timestamps & code blocks</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </button>

              {/* JSON */}
              <button
                onClick={() => downloadFile(generateJSON(), `${chat.title.replace(/\s+/g, '_')}.json`, 'application/json')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">JSON Data (.json)</p>
                    <p className="text-xs text-slate-500">Raw messages, reasoning, reactions & metadata</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </button>

              {/* Plain Text */}
              <button
                onClick={() => downloadFile(generateText(), `${chat.title.replace(/\s+/g, '_')}.txt`, 'text/plain')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-500/10 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Plain Text (.txt)</p>
                    <p className="text-xs text-slate-500">Simple transcript without markdown tags</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
              </button>
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Markdown' : 'Copy to Clipboard'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExportModal;
