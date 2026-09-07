import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, User, Copy, Check, RefreshCw, Pin, PinOff, Cpu,
  Edit2, X, Terminal, FileText, Code,
  ArrowDown, RotateCcw, Loader2, Reply, Quote, Eye, EyeOff,
  CheckCheck, Square, Paperclip
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message, ResponseTone, ResponseVerbosity, Attachment } from '@/types';
import { useChat } from '@/context/ChatContext';
import remarkGfm from 'remark-gfm';
import { ReasoningAccordion, extractReasoning } from '@/components/ReasoningAccordion';
import { MessageReactions } from '@/components/MessageReactions';
import { MarkdownToolbar } from '@/components/MarkdownToolbar';
import { FileAttachmentPreview } from '@/components/FileAttachmentPreview';
import { PromptSuggestions } from '@/components/PromptSuggestions';

// UPDATE: Add onStopGeneration and attachments/images to interface
interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string, messageId?: string, replyToId?: string, attachments?: Attachment[], images?: string[]) => Promise<void>;
  onRegenerateMessage: (messageId: string) => Promise<void>;
  onStopGeneration?: () => void;
  isLoading: boolean;
  chatId: string | null;
}

// Detect if code is CLI / Shell command
const isShellCommand = (codeText: string, lang?: string): boolean => {
  if (lang) {
    const l = lang.toLowerCase().trim();
    if (['bash', 'sh', 'shell', 'zsh', 'terminal', 'console', 'cmd', 'batch', 'bat', 'powershell', 'ps1'].includes(l)) {
      return true;
    }
  }
  const trimmed = codeText.trim();
  if (/^[$#>]\s+/m.test(trimmed)) return true;
  return /^(ollama|npm|npx|pnpm|yarn|git|docker|curl|node|python|python3|pip|pip3|brew|apt|cd|ls|cat|mkdir|touch|export|sudo|echo|chmod|systemctl)\b/m.test(trimmed);
};

// Normalize language for Prism syntax highlighter
const normalizeLanguage = (lang?: string, codeText: string = ''): string => {
  if (!lang) {
    const trimmed = codeText.trim();
    if (/^<\?php/i.test(trimmed)) return 'php';
    if (/<[a-z][\s\S]*>/i.test(trimmed)) return 'markup';
    if (/^(def\s+|import\s+[\w.]+|from\s+[\w.]+\s+import)/m.test(trimmed)) return 'python';
    if (isShellCommand(codeText)) return 'bash';
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
    return 'bash';
  }

  const l = lang.toLowerCase().trim();
  const map: Record<string, string> = {
    js: 'javascript',
    javascript: 'javascript',
    ts: 'typescript',
    typescript: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    py: 'python',
    python: 'python',
    linux: 'bash',
    sh: 'bash',
    bash: 'bash',
    shell: 'bash',
    zsh: 'bash',
    terminal: 'bash',
    console: 'bash',
    cli: 'bash',
    cmd: 'batch',
    bat: 'batch',
    batch: 'batch',
    powershell: 'powershell',
    ps: 'powershell',
    ps1: 'powershell',
    html: 'markup',
    htm: 'markup',
    markup: 'markup',
    xml: 'markup',
    svg: 'markup',
    css: 'css',
    scss: 'scss',
    json: 'json',
    sql: 'sql',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    markdown: 'markdown',
    c: 'c',
    cpp: 'cpp',
    'c++': 'cpp',
    cs: 'csharp',
    csharp: 'csharp',
    go: 'go',
    golang: 'go',
    rs: 'rust',
    rust: 'rust',
    java: 'java',
    php: 'php',
    docker: 'docker',
    dockerfile: 'docker',
  };

  return map[l] || l;
};

// Get rich display information: specific file type label, command status, and accent color
interface LanguageInfo {
  normalizedLang: string;
  label: string;
  isCommand: boolean;
  colorClass: string;
}

const getLanguageInfo = (rawLang?: string, codeText: string = ''): LanguageInfo => {
  const trimmed = codeText.trim();
  const l = rawLang ? rawLang.toLowerCase().trim() : '';

  // 1. Explicit raw language given
  if (l) {
    if (l === 'html' || l === 'htm') {
      return { normalizedLang: 'markup', label: 'HTML', isCommand: false, colorClass: 'text-orange-400' };
    }
    if (l === 'php') {
      return { normalizedLang: 'php', label: 'PHP', isCommand: false, colorClass: 'text-indigo-400' };
    }
    if (l === 'jsx') {
      return { normalizedLang: 'jsx', label: 'JSX', isCommand: false, colorClass: 'text-cyan-400' };
    }
    if (l === 'tsx') {
      return { normalizedLang: 'tsx', label: 'TSX', isCommand: false, colorClass: 'text-blue-400' };
    }
    if (l === 'ts' || l === 'typescript') {
      return { normalizedLang: 'typescript', label: 'TSX', isCommand: false, colorClass: 'text-blue-400' };
    }
    if (l === 'js' || l === 'javascript') {
      return { normalizedLang: 'javascript', label: 'JAVASCRIPT', isCommand: false, colorClass: 'text-yellow-400' };
    }
    if (l === 'py' || l === 'python') {
      return { normalizedLang: 'python', label: 'PYTHON', isCommand: false, colorClass: 'text-amber-400' };
    }
    if (l === 'linux') {
      return { normalizedLang: 'bash', label: 'LINUX', isCommand: true, colorClass: 'text-emerald-400' };
    }
    if (l === 'bash') {
      return { normalizedLang: 'bash', label: 'BASH', isCommand: true, colorClass: 'text-emerald-400' };
    }
    if (l === 'sh' || l === 'shell' || l === 'zsh') {
      return { normalizedLang: 'bash', label: 'SHELL', isCommand: true, colorClass: 'text-emerald-400' };
    }
    if (l === 'powershell' || l === 'ps' || l === 'ps1') {
      return { normalizedLang: 'powershell', label: 'POWERSHELL', isCommand: true, colorClass: 'text-sky-400' };
    }
    if (l === 'cmd' || l === 'batch' || l === 'bat') {
      return { normalizedLang: 'batch', label: 'BATCH', isCommand: true, colorClass: 'text-emerald-400' };
    }
    if (l === 'sql') {
      return { normalizedLang: 'sql', label: 'SQL', isCommand: false, colorClass: 'text-purple-400' };
    }
    if (l === 'json') {
      return { normalizedLang: 'json', label: 'JSON', isCommand: false, colorClass: 'text-teal-400' };
    }
    if (l === 'css') {
      return { normalizedLang: 'css', label: 'CSS', isCommand: false, colorClass: 'text-pink-400' };
    }
    if (l === 'scss' || l === 'sass') {
      return { normalizedLang: 'scss', label: 'SCSS', isCommand: false, colorClass: 'text-pink-400' };
    }
    if (l === 'yaml' || l === 'yml') {
      return { normalizedLang: 'yaml', label: 'YAML', isCommand: false, colorClass: 'text-red-400' };
    }
    if (l === 'docker' || l === 'dockerfile') {
      return { normalizedLang: 'docker', label: 'DOCKER', isCommand: false, colorClass: 'text-sky-400' };
    }
    if (l === 'c') {
      return { normalizedLang: 'c', label: 'C', isCommand: false, colorClass: 'text-blue-300' };
    }
    if (l === 'cpp' || l === 'c++') {
      return { normalizedLang: 'cpp', label: 'C++', isCommand: false, colorClass: 'text-blue-400' };
    }
    if (l === 'cs' || l === 'csharp') {
      return { normalizedLang: 'csharp', label: 'C#', isCommand: false, colorClass: 'text-purple-400' };
    }
    if (l === 'go' || l === 'golang') {
      return { normalizedLang: 'go', label: 'GO', isCommand: false, colorClass: 'text-cyan-400' };
    }
    if (l === 'rs' || l === 'rust') {
      return { normalizedLang: 'rust', label: 'RUST', isCommand: false, colorClass: 'text-orange-500' };
    }
    if (l === 'java') {
      return { normalizedLang: 'java', label: 'JAVA', isCommand: false, colorClass: 'text-red-400' };
    }
    if (l === 'rb' || l === 'ruby') {
      return { normalizedLang: 'ruby', label: 'RUBY', isCommand: false, colorClass: 'text-red-500' };
    }

    const norm = normalizeLanguage(l, codeText);
    return {
      normalizedLang: norm,
      label: l.toUpperCase(),
      isCommand: norm === 'bash' || norm === 'batch' || norm === 'powershell',
      colorClass: 'text-gray-300'
    };
  }

  // 2. No language specified - auto-detect by content patterns
  if (/^<\?php/i.test(trimmed)) {
    return { normalizedLang: 'php', label: 'PHP', isCommand: false, colorClass: 'text-indigo-400' };
  }
  if (/<!DOCTYPE\s+html|<html[\s>]|<\w+[^>]*>[\s\S]*<\/\w+>/i.test(trimmed)) {
    return { normalizedLang: 'markup', label: 'HTML', isCommand: false, colorClass: 'text-orange-400' };
  }
  if (/(import\s+React|\bexport\s+default\b|\bconst\s+[A-Z]\w+\s*=\s*\([^)]*\)\s*=>)/.test(trimmed) && /<[A-Za-z]/.test(trimmed)) {
    return { normalizedLang: 'tsx', label: 'TSX', isCommand: false, colorClass: 'text-blue-400' };
  }
  if (/^(def\s+|elif\s+|import\s+[\w.]+|from\s+[\w.]+\s+import)/m.test(trimmed)) {
    return { normalizedLang: 'python', label: 'PYTHON', isCommand: false, colorClass: 'text-amber-400' };
  }
  if (/^(sudo|apt|apt-get|systemctl|yum|pacman|chmod|chown|service)\b/m.test(trimmed)) {
    return { normalizedLang: 'bash', label: 'LINUX', isCommand: true, colorClass: 'text-emerald-400' };
  }
  if (/^(ollama|npm|npx|pnpm|yarn|git|docker|curl|node|cd|ls|cat|mkdir|touch|export|echo)\b/m.test(trimmed) || /^[$#>]\s+/m.test(trimmed)) {
    return { normalizedLang: 'bash', label: 'SHELL', isCommand: true, colorClass: 'text-emerald-400' };
  }
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE)\b/i.test(trimmed)) {
    return { normalizedLang: 'sql', label: 'SQL', isCommand: false, colorClass: 'text-purple-400' };
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return { normalizedLang: 'json', label: 'JSON', isCommand: false, colorClass: 'text-teal-400' };
  }

  return { normalizedLang: 'text', label: 'CODE', isCommand: false, colorClass: 'text-gray-300' };
};

// Inline Code & Command Component
const InlineCode: React.FC<{
  children: React.ReactNode;
  isUser?: boolean;
}> = ({ children, isUser = false }) => {
  const [copied, setCopied] = useState(false);
  const text = String(children).trim();

  // Detect CLI command like: ollama run qwen:latest or npm run dev or $ git status
  const isCommand = 
    /^[$#>]\s+\w+/.test(text) ||
    /^(ollama|npm|npx|pnpm|yarn|git|docker|curl|node|python|pip|brew|apt|cd|ls|cat|mkdir|touch|export|sudo|echo|chmod)\b/.test(text);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanCmd = text.replace(/^[$#>]\s+/, '');
    navigator.clipboard.writeText(cleanCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isCommand) {
    return (
      <span
        onClick={handleCopy}
        title="Click to copy command"
        className="inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 mx-0.5 rounded-md bg-[#0f172a] text-emerald-400 font-mono text-xs border border-emerald-500/30 hover:border-emerald-500/60 shadow-xs cursor-pointer transition-all group/cmd select-all"
      >
        <Terminal size={11} className="text-emerald-500/70 group-hover/cmd:text-emerald-400 flex-shrink-0" />
        <span className="font-semibold">{text}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="ml-0.5 text-emerald-500/60 hover:text-emerald-300 opacity-75 group-hover/cmd:opacity-100 transition-opacity"
          aria-label="Copy command"
        >
          {copied ? <Check size={11} className="text-emerald-300" /> : <Copy size={11} />}
        </button>
      </span>
    );
  }

  return (
    <code
      className={`
        font-mono text-xs px-1.5 py-0.5 rounded
        ${isUser
          ? 'bg-white/20 text-white font-medium border border-white/20'
          : 'bg-gray-100 text-pink-600 font-normal border border-gray-200/80'
        }
      `}
    >
      {children}
    </code>
  );
};

// Code Block Component with syntax highlighting, command styling, line numbers & copy
const CodeBlock: React.FC<{ 
  language?: string; 
  value: string; 
}> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { normalizedLang, label, isCommand, colorClass } = getLanguageInfo(language, value);
  const isHtml = normalizedLang === 'markup' || /<!DOCTYPE\s+html|<html[\s>]|<\w+[^>]*>[\s\S]*<\/\w+>/i.test(value);

  const handleCopy = () => {
    // When copying commands, strip leading prompt symbols '$ ' or '> ' if present
    const textToCopy = isCommand
      ? value.split('\n').map(l => l.replace(/^[$#>]\s+/, '')).join('\n')
      : value;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = value.split('\n').length;

  return (
    <div className="not-prose relative my-3.5 rounded-xl overflow-hidden border border-gray-800 shadow-md bg-[#0d1117]">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-[#161b22] px-4 py-2 border-b border-gray-800 text-gray-300">
        <div className="flex items-center gap-2.5">
          {isCommand ? (
            <Terminal size={14} className={colorClass} />
          ) : (
            <Code size={14} className={colorClass} />
          )}
          <span className={`text-xs font-mono font-bold tracking-wider ${colorClass}`}>
            {label}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isHtml && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300 hover:text-white text-xs font-medium border border-gray-700"
            >
              {showPreview ? (
                <>
                  <EyeOff size={13} />
                  <span>Code</span>
                </>
              ) : (
                <>
                  <Eye size={13} />
                  <span>Preview</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-200 text-xs font-medium border
              ${copied 
                ? 'text-emerald-300 bg-emerald-950/40 border-emerald-500/40' 
                : 'text-gray-300 bg-gray-800/80 border-gray-700 hover:text-white hover:bg-gray-700'
              }
            `}
          >
            {copied ? (
              <>
                <CheckCheck size={13} className="text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code / Preview Body */}
      {isHtml && showPreview ? (
        <div className="bg-white p-4">
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
            <FileText size={12} />
            <span>HTML Live Preview</span>
          </div>
          <div 
            className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg border border-gray-200"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      ) : (
        <SyntaxHighlighter
          language={normalizedLang}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '16px',
            fontSize: '13px',
            lineHeight: '1.65',
            background: '#0d1117',
            borderRadius: 0,
          }}
          showLineNumbers={lineCount > 1}
          wrapLines={true}
          wrapLongLines={true}
          lineNumberStyle={{
            color: '#4a5568',
            fontSize: '11px',
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

interface SlashCommand {
  command: string;
  syntax: string;
  description: string;
  icon: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { command: '/model', syntax: '/model <name>', description: 'Switch Ollama model for this chat', icon: '🤖' },
  { command: '/tone', syntax: '/tone <persona>', description: 'Set tone (professional, casual, academic, technical, customs)', icon: '🎭' },
  { command: '/verbosity', syntax: '/verbosity <level>', description: 'Set response depth (concise, balanced, detailed)', icon: '📏' },
  { command: '/system', syntax: '/system <prompt>', description: 'Set custom system prompt instructions', icon: '⚙️' },
  { command: '/clear', syntax: '/clear', description: 'Clear messages in this conversation', icon: '🧹' },
  { command: '/help', syntax: '/help', description: 'Show all available slash commands', icon: '💡' },
];

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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    togglePinChat,
    chats,
    toggleStarMessage,
    addReaction,
    setFeedback,
    setChatTone,
    setChatVerbosity,
    setChatSystemPrompt,
    changeModel,
    truncateMessages,
    addMessage,
  } = useChat();
  const currentChat = chats.find(c => c.id === chatId);

  const matchingSlashCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.command.toLowerCase().startsWith(input.trim().toLowerCase())
  );

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const fullDataUrl = event.target?.result as string;
          const base64Raw = fullDataUrl.includes(',') ? fullDataUrl.split(',')[1] : fullDataUrl;
          const newAttachment: Attachment = {
            id: `${Date.now()}_${Math.random()}`,
            name: file.name,
            type: 'image',
            mimeType: file.type,
            size: file.size,
            data: base64Raw,
            previewUrl: fullDataUrl,
          };
          setPendingAttachments((prev) => [...prev, newAttachment]);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const textContent = event.target?.result as string;
          const newAttachment: Attachment = {
            id: `${Date.now()}_${Math.random()}`,
            name: file.name,
            type: 'text',
            mimeType: file.type || 'text/plain',
            size: file.size,
            data: textContent,
          };
          setPendingAttachments((prev) => [...prev, newAttachment]);
        };
        reader.readAsText(file);
      }
    });

    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleInsertMarkdown = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const inputEl = inputRef.current;
    if (!inputEl) {
      setInput((prev) => prev + prefix + defaultText + suffix);
      return;
    }

    const start = inputEl.selectionStart ?? input.length;
    const end = inputEl.selectionEnd ?? input.length;
    const selectedText = input.substring(start, end) || defaultText;

    const newText = input.substring(0, start) + prefix + selectedText + suffix + input.substring(end);
    setInput(newText);

    setTimeout(() => {
      inputEl.focus();
      inputEl.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.startsWith('/') && !val.includes(' ') && val.length < 15) {
      setShowSlashMenu(true);
      setSelectedSlashIndex(0);
    } else {
      setShowSlashMenu(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && pendingAttachments.length === 0) || isLoading) return;

    const message = input.trim();
    setInput('');
    setShowSlashMenu(false);

    // Handle Slash Commands (only if no attachments)
    if (message.startsWith('/') && pendingAttachments.length === 0) {
      const [cmd, ...argsArr] = message.split(' ');
      const arg = argsArr.join(' ').trim();
      const lowerCmd = cmd.toLowerCase();

      if (lowerCmd === '/clear') {
        if (chatId) {
          truncateMessages(chatId, 0);
        }
        return;
      }

      if (lowerCmd === '/model') {
        if (arg && chatId) {
          changeModel(chatId, arg);
          addMessage(chatId, {
            id: `sys_${Date.now()}`,
            role: 'assistant',
            content: `🤖 Model switched to **${arg}**.`,
            timestamp: new Date()
          });
        } else {
          addMessage(chatId || '', {
            id: `sys_${Date.now()}`,
            role: 'assistant',
            content: `Current model is **${currentChat?.model || 'qwen:latest'}**.\nUsage: \`/model <model_name>\``,
            timestamp: new Date()
          });
        }
        return;
      }

      if (lowerCmd === '/tone') {
        const validTones = ['default', 'professional', 'casual', 'academic', 'technical', 'customs'];
        if (validTones.includes(arg.toLowerCase()) && chatId) {
          setChatTone(chatId, arg.toLowerCase() as ResponseTone);
          addMessage(chatId, {
            id: `sys_${Date.now()}`,
            role: 'assistant',
            content: `🎭 Response tone set to **${arg.toLowerCase()}**.`,
            timestamp: new Date()
          });
        } else {
          addMessage(chatId || '', {
            id: `sys_${Date.now()}`,
            role: 'assistant',
            content: `Current tone: **${currentChat?.tone || 'default'}**.\nOptions: \`${validTones.join(', ')}\`\nUsage: \`/tone <persona>\``,
            timestamp: new Date()
          });
        }
        return;
      }

      if (lowerCmd === '/verbosity') {
        const validVerbosity = ['concise', 'balanced', 'detailed'];
        if (validVerbosity.includes(arg.toLowerCase()) && chatId) {
          setChatVerbosity(chatId, arg.toLowerCase() as ResponseVerbosity);
          addMessage(chatId, {
            id: `sys_${Date.now()}`,
            role: 'assistant',
            content: `📏 Response verbosity set to **${arg.toLowerCase()}**.`,
            timestamp: new Date()
          });
        } else {
          addMessage(chatId || '', {
            id: `sys_${Date.now()}`,
            role: 'assistant',
            content: `Current verbosity: **${currentChat?.verbosity || 'balanced'}**.\nOptions: \`${validVerbosity.join(', ')}\`\nUsage: \`/verbosity <concise|balanced|detailed>\``,
            timestamp: new Date()
          });
        }
        return;
      }

      if (lowerCmd === '/system') {
        if (arg && chatId) {
          setChatSystemPrompt(chatId, arg);
          addMessage(chatId, {
            id: `sys_${Date.now()}`,
            role: 'assistant',
            content: `⚙️ Custom system instructions updated:\n> "${arg}"`,
            timestamp: new Date()
          });
        } else {
          addMessage(chatId || '', {
            id: `sys_${Date.now()}`,
            role: 'assistant',
            content: `Usage: \`/system <your custom prompt instructions>\`\nCurrent prompt: ${currentChat?.systemPrompt || '(none)'}`,
            timestamp: new Date()
          });
        }
        return;
      }

      if (lowerCmd === '/help') {
        addMessage(chatId || '', {
          id: `sys_${Date.now()}`,
          role: 'assistant',
          content: `### 🛠️ Available Slash Commands\n\n` +
            `• **/model <name>** - Switch Ollama model (e.g. \`/model llama3.2:latest\`)\n` +
            `• **/tone <persona>** - Change persona (\`default\`, \`professional\`, \`casual\`, \`academic\`, \`technical\`, \`customs\`)\n` +
            `• **/verbosity <level>** - Set response depth (\`concise\`, \`balanced\`, \`detailed\`)\n` +
            `• **/system <prompt>** - Set custom system instructions\n` +
            `• **/clear** - Clear all messages in this conversation\n` +
            `• **/help** - Display this guide`,
          timestamp: new Date()
        });
        return;
      }
    }
    
    // Process attachments
    const currentAttachments = [...pendingAttachments];
    setPendingAttachments([]);

    let finalContent = message;
    const textAttachments = currentAttachments.filter(a => a.type === 'text');
    if (textAttachments.length > 0) {
      const docSnippets = textAttachments
        .map(t => `\n\n[Attached Document: ${t.name}]\n\`\`\`\n${t.data}\n\`\`\``)
        .join('');
      finalContent = finalContent ? `${finalContent}${docSnippets}` : docSnippets.trim();
    }

    const imageAttachments = currentAttachments.filter(a => a.type === 'image');
    const imagesBase64 = imageAttachments.length > 0 ? imageAttachments.map(a => a.data) : undefined;

    if (replyToId) {
      await onSendMessage(finalContent, undefined, replyToId, currentAttachments, imagesBase64);
      setReplyToId(null);
    } else {
      await onSendMessage(finalContent, undefined, undefined, currentAttachments, imagesBase64);
    }
    
    isUserScrolling.current = false;
    setNewMessagesCount(0);
    setIsAtBottom(true);
    setTimeout(() => scrollToBottom(true), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashMenu && matchingSlashCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIndex(prev => (prev + 1) % matchingSlashCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIndex(prev => (prev - 1 + matchingSlashCommands.length) % matchingSlashCommands.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !input.includes(' '))) {
        e.preventDefault();
        const selected = matchingSlashCommands[selectedSlashIndex];
        if (selected) {
          if (selected.command === '/clear' || selected.command === '/help') {
            setInput(selected.command);
          } else {
            setInput(selected.command + ' ');
          }
          setShowSlashMenu(false);
          return;
        }
      }
      if (e.key === 'Escape') {
        setShowSlashMenu(false);
        return;
      }
    }

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

  // Process message content with full syntax highlighting & command detection
  const renderMessageContent = (content: string, isUser: boolean) => {
    return (
      <div
        className={`
          prose prose-sm max-w-none
          ${isUser ? 'prose-invert' : 'prose-gray'}
          prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0
          prose-headings:font-semibold
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
          prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2
          prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2
          prose-blockquote:border-l-4 prose-blockquote:border-[#006633]/30 prose-blockquote:pl-4 prose-blockquote:text-gray-600
        `}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            pre({ children }) {
              return <>{children}</>;
            },
            code({ className, children }) {
              const match = /language-(\w+)/.exec(className || '');
              const rawLanguage = match ? match[1] : undefined;
              const rawString = String(children);
              const isBlock = Boolean(className || rawString.includes('\n'));

              if (isBlock) {
                const codeString = rawString.replace(/\n$/, '');
                return (
                  <CodeBlock
                    language={rawLanguage}
                    value={codeString}
                  />
                );
              }

              return (
                <InlineCode isUser={isUser}>
                  {children}
                </InlineCode>
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center py-6">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-premium-sm border-2 border-[#006633]/20 p-2">
                <img src="/logo.png" alt="NCS Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-[#006633] mb-2">
                Nigeria Customs AI
              </h2>
              <p className="text-[#006633]/70 max-w-md mb-4 text-sm">
                Ask anything about customs, trade, or general inquiries. Justice & Honesty in every response.
              </p>
              {currentChat && currentChat.model && (
                <div className="flex items-center gap-2 text-xs text-[#006633]/50 bg-white px-3 py-1.5 rounded-full border border-[#006633]/10 mb-2">
                  <Cpu size={12} />
                  <span>Using <strong>{getModelDisplayName(currentChat.model)}</strong></span>
                </div>
              )}
              {/* Empty state starter cards */}
              <PromptSuggestions onSelectPrompt={(p) => onSendMessage(p)} mode="empty_state" />
            </div>
          ) : (
            messages.map((message, index) => {
              const isUser = message.role === 'user';
              const isEditing = editingMessageId === message.id;
              const isRegenerating = regeneratingId === message.id;
              const isReplying = replyToId === message.id;

              const extracted = !isUser
                ? extractReasoning(message.content)
                : { reasoning: message.reasoning || null, response: message.content, isThinking: false };
              const displayReasoning = message.reasoning || extracted.reasoning;
              const displayContent = extracted.response || (displayReasoning ? '' : message.content);
              
              return (
                <div
                  key={message.id}
                  id={`message-${message.id}`}
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
                                onClick={() => copyToClipboard(displayContent || message.content, message.id)}
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

                          {/* Attachments preview on message */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mb-2">
                              <FileAttachmentPreview attachments={message.attachments} readOnly={true} />
                            </div>
                          )}

                          {/* Reasoning / Thinking Accordion */}
                          {!isUser && displayReasoning && (
                            <div className="mb-2">
                              <ReasoningAccordion
                                reasoning={displayReasoning}
                                isStreaming={isLoading && index === messages.length - 1 && !displayContent}
                                duration={message.reasoningDuration}
                              />
                            </div>
                          )}

                          {displayContent ? renderMessageContent(displayContent, isUser) : null}

                          <div
                            className={`
                              text-[10px] mt-1.5 flex items-center justify-between
                              ${isUser ? 'text-white/80 text-right justify-end' : 'text-gray-400'}
                            `}
                          >
                            <span>{formatTime(message.timestamp)}</span>
                          </div>

                          {!isUser && chatId && (
                            <MessageReactions
                              message={message}
                              chatId={chatId}
                              onFeedback={(feedback) => setFeedback(chatId, message.id, feedback)}
                              onToggleStar={() => toggleStarMessage(chatId, message.id)}
                              onAddReaction={(emoji) => addReaction(chatId, message.id, emoji)}
                              onCopy={() => copyToClipboard(displayContent || message.content, message.id)}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* Dynamic Follow-up Suggestions on latest assistant message */}
                    {!isUser && index === messages.length - 1 && !isLoading && (
                      <div className="mt-2 pl-1">
                        <PromptSuggestions onSelectPrompt={(p) => onSendMessage(p)} mode="follow_ups" />
                      </div>
                    )}
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

        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Pending Attachments Preview */}
          {pendingAttachments.length > 0 && (
            <div className="mb-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-[#006633]/20 shadow-xs">
              <FileAttachmentPreview attachments={pendingAttachments} onRemove={handleRemoveAttachment} />
              {pendingAttachments.some(a => a.type === 'image') && !currentChat?.model?.includes('vision') && !currentChat?.model?.includes('llava') && (
                <div className="text-[10px] text-amber-600 font-medium px-2 py-0.5">
                  💡 Tip: Analyzing images works best with a vision model (e.g. llama3.2-vision, llava).
                </div>
              )}
            </div>
          )}

          {/* Markdown Formatting Toolbar */}
          <div className="mb-1 rounded-t-xl overflow-hidden border-t border-l border-r border-[#006633]/15">
            <MarkdownToolbar onInsert={handleInsertMarkdown} disabled={isLoading} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            {/* Attach File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-3 bg-white hover:bg-[#006633]/10 border border-[#006633]/20 rounded-xl text-slate-500 hover:text-[#006633] transition-colors shadow-xs shrink-0 flex items-center justify-center disabled:opacity-50"
              title="Attach images or documents"
            >
              <Paperclip size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.txt,.md,.json,.js,.ts,.tsx,.jsx,.py,.html,.css,.csv,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex-1 relative">
              {/* Slash Command Autocomplete Popover */}
              {showSlashMenu && matchingSlashCommands.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-white rounded-2xl border border-[#006633]/20 shadow-2xl overflow-hidden z-40 animate-slide-up">
                  <div className="px-3.5 py-2 bg-[#006633]/5 border-b border-[#006633]/10 text-[11px] font-semibold text-[#006633] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>⚡ Slash Commands</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">↑↓ to navigate · Enter to select</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                    {matchingSlashCommands.map((cmd, idx) => {
                      const isSelected = idx === selectedSlashIndex;
                      return (
                        <button
                          key={cmd.command}
                          type="button"
                          onClick={() => {
                            setInput(cmd.command === '/clear' || cmd.command === '/help' ? cmd.command : cmd.command + ' ');
                            setShowSlashMenu(false);
                            inputRef.current?.focus();
                          }}
                          onMouseEnter={() => setSelectedSlashIndex(idx)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#006633]/10 text-[#006633] font-medium'
                              : 'hover:bg-gray-100/80 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{cmd.icon}</span>
                            <span className="font-mono text-xs font-semibold text-gray-900">{cmd.syntax}</span>
                          </div>
                          <span className="text-[11px] text-gray-500 truncate max-w-[170px]">{cmd.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  replyToId 
                    ? "Reply to selected message..." 
                    : isLoading 
                      ? `Waiting for ${currentChat?.model ? getModelDisplayName(currentChat.model) : 'AI'}...` 
                      : "Type your message, / for commands, or drop files..."
                }
                disabled={isLoading}
                className={`w-full px-4 py-3 bg-[#f5f5f0] border rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] transition-all duration-200 text-gray-900 placeholder-[#006633]/40 disabled:opacity-50 disabled:cursor-not-allowed ${
                  replyToId ? 'border-[#006633] border-2' : 'border-[#006633]/20'
                }`}
              />
              {!isLoading && (input || pendingAttachments.length > 0) && (
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
              disabled={isLoading || (!input.trim() && pendingAttachments.length === 0)}
              className={`px-5 py-3 bg-[#006633] hover:bg-[#004422] text-white font-medium rounded-xl transition-all duration-200 shadow-premium-sm hover:shadow-premium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-premium-sm disabled:hover:bg-[#006633] shrink-0 ${
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