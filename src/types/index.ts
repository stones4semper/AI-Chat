export type ResponseTone = 'default' | 'professional' | 'casual' | 'academic' | 'technical' | 'customs';
export type ResponseVerbosity = 'concise' | 'balanced' | 'detailed';

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'text' | 'file';
  mimeType: string;
  size: number;
  data: string; // Base64 data for images or string content for text files
  previewUrl?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  edited?: boolean;
  replyToId?: string;
  starred?: boolean;
  userFeedback?: 'like' | 'dislike' | null;
  reactions?: Record<string, number>;
  userReactions?: string[];
  reasoning?: string;
  reasoningDuration?: number;
  attachments?: Attachment[];
  images?: string[]; // Array of base64 strings for Ollama vision models
  followUpQuestions?: string[];
  parentId?: string;
  childrenIds?: string[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  pinned: boolean;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  systemPrompt?: string;
  tone?: ResponseTone;
  verbosity?: ResponseVerbosity;
  folderId?: string;
  archived?: boolean;
  tags?: string[];
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
}

export interface PromptTemplate {
  id: string;
  title: string;
  prompt: string;
  category: 'Coding' | 'Writing' | 'Analysis' | 'Customs' | 'General';
  description?: string;
  icon?: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
    images?: string[];
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}