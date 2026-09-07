import React from 'react';
import { Bold, Italic, Code, Terminal, Quote, List, ListOrdered, Link, Table } from 'lucide-react';
import { motion } from 'framer-motion';

interface MarkdownToolbarProps {
  onInsert: (prefix: string, suffix?: string, defaultText?: string) => void;
  disabled?: boolean;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ onInsert, disabled = false }) => {
  const tools = [
    { label: 'Bold', icon: Bold, prefix: '**', suffix: '**', defaultText: 'bold text' },
    { label: 'Italic', icon: Italic, prefix: '*', suffix: '*', defaultText: 'italic text' },
    { label: 'Inline Code', icon: Code, prefix: '`', suffix: '`', defaultText: 'code' },
    { label: 'Code Block', icon: Terminal, prefix: '```bash\n', suffix: '\n```', defaultText: 'command or code' },
    { label: 'Quote', icon: Quote, prefix: '> ', suffix: '', defaultText: 'quote' },
    { label: 'Bullet List', icon: List, prefix: '- ', suffix: '', defaultText: 'list item' },
    { label: 'Numbered List', icon: ListOrdered, prefix: '1. ', suffix: '', defaultText: 'first item' },
    { label: 'Link', icon: Link, prefix: '[', suffix: '](https://example.com)', defaultText: 'link text' },
    { label: 'Table', icon: Table, prefix: '| Header 1 | Header 2 |\n|---|---|\n| Cell 1 | Cell 2 |', suffix: '', defaultText: '' },
  ];

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 bg-white/70 backdrop-blur-sm border-t border-[#006633]/10 overflow-x-auto select-none">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <motion.button
            key={tool.label}
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            disabled={disabled}
            onClick={() => onInsert(tool.prefix, tool.suffix, tool.defaultText)}
            title={tool.label}
            className="p-1.5 rounded-lg text-slate-500 hover:text-[#006633] hover:bg-[#006633]/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Icon className="w-3.5 h-3.5" />
          </motion.button>
        );
      })}
    </div>
  );
};

export default MarkdownToolbar;
