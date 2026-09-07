import axios from 'axios';
import type { OllamaResponse, OllamaModel, ResponseTone, ResponseVerbosity } from '@/types';

const API_BASE_URL = typeof window !== 'undefined' ? '/api' : 'http://127.0.0.1:11434/api';

export const buildSystemPrompt = (
  customSystemPrompt?: string,
  tone?: ResponseTone,
  verbosity?: ResponseVerbosity
): string => {
  const parts: string[] = [];

  // Base identity / custom prompt
  if (customSystemPrompt?.trim()) {
    parts.push(customSystemPrompt.trim());
  } else {
    parts.push('You are an expert, highly intelligent AI assistant dedicated to accuracy, honesty, and helpfulness.');
  }

  // Tone instruction
  if (tone && tone !== 'default') {
    switch (tone) {
      case 'professional':
        parts.push('Adopt a formal, authoritative, and polite professional tone. Ensure answers are well-structured and business-appropriate.');
        break;
      case 'casual':
        parts.push('Adopt a friendly, conversational, and approachable tone. Speak like a helpful and relaxed teammate.');
        break;
      case 'academic':
        parts.push('Adopt an academic and scholarly tone. Provide thorough explanations, cite fundamental concepts, and use precise analytical language.');
        break;
      case 'technical':
        parts.push('Adopt a technical, developer-centric tone. Emphasize architecture, implementation details, code correctness, and practical technical steps.');
        break;
      case 'customs':
        parts.push('Adopt the persona of a senior Nigeria Customs Service intelligence & trade specialist. Emphasize justice, honesty, trade compliance, tariff classification, and border regulatory accuracy.');
        break;
    }
  }

  // Verbosity instruction
  if (verbosity) {
    switch (verbosity) {
      case 'concise':
        parts.push('Keep responses brief, direct, and to the point. Omit filler and conversational pleasantries.');
        break;
      case 'detailed':
        parts.push('Provide comprehensive, deep explanations with examples, edge cases, and step-by-step guidance.');
        break;
      case 'balanced':
        parts.push('Provide balanced answers that are thorough yet clear, structured, and easy to read.');
        break;
    }
  }

  return parts.join(' ');
};

export const ollamaService = {
  async getModels(): Promise<OllamaModel[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/tags`, {
        timeout: 5000
      });
      return response.data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  },

  async generateResponse(
    promptOrMessages: string | Array<{ role: string; content: string; images?: string[] }>, 
    model: string = 'qwen:latest',
    systemPrompt?: string,
    options?: Record<string, any>
  ): Promise<string> {
    try {
      let messages: Array<{ role: string; content: string; images?: string[] }> = typeof promptOrMessages === 'string'
        ? [{ role: 'user', content: promptOrMessages }]
        : [...promptOrMessages];

      if (systemPrompt && !messages.some(m => m.role === 'system')) {
        messages = [{ role: 'system', content: systemPrompt }, ...messages];
      }

      const response = await axios.post<OllamaResponse>(
        `${API_BASE_URL}/chat`,
        {
          model: model,
          messages: messages,
          stream: false,
          options: options
        },
        {
          timeout: 60000
        }
      );
      
      return response.data.message.content;
    } catch (error) {
      console.error('Error calling Ollama:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to Ollama. Please make sure Ollama is running.');
        }
        if (error.response?.status === 404) {
          throw new Error(`Model "${model}" not found. Please pull it first: ollama pull ${model}`);
        }
      }
      throw new Error('Failed to get response from Ollama.');
    }
  },

  async streamResponse(
    promptOrMessages: string | Array<{ role: string; content: string; images?: string[] }>, 
    model: string = 'qwen:latest',
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
    systemPrompt?: string,
    options?: Record<string, any>
  ): Promise<void> {
    try {
      let messages: Array<{ role: string; content: string; images?: string[] }> = typeof promptOrMessages === 'string'
        ? [{ role: 'user', content: promptOrMessages }]
        : [...promptOrMessages];

      if (systemPrompt && !messages.some(m => m.role === 'system')) {
        messages = [{ role: 'system', content: systemPrompt }, ...messages];
      }

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          stream: true,
          options: options
        }),
        signal: signal
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Model "${model}" not found. Please pull it first: ollama pull ${model}`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';

      while (true) {
        // Check if aborted
        if (signal?.aborted) {
          console.log('🛑 Stream aborted by user');
          await reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              onChunk(data.message.content);
            }
            if (data.done) {
              console.log('Stream complete');
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🛑 Fetch aborted by user');
        return;
      }
      console.error('Error streaming from Ollama:', error);
      throw error;
    }
  },

  async checkConnection(): Promise<boolean> {
    try {
      await axios.get(`${API_BASE_URL}/tags`, {
        timeout: 3000
      });
      return true;
    } catch (error) {
      console.error('Ollama connection failed:', error);
      return false;
    }
  },

  async pullModel(model: string = 'qwen:latest'): Promise<void> {
    try {
      console.log(`📥 Pulling model: ${model}...`);
      
      const response = await fetch(`${API_BASE_URL}/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: model,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let lastStatus = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status) {
              if (data.status !== lastStatus) {
                console.log(`📦 ${data.status}${data.progress ? `: ${data.progress}` : ''}`);
                lastStatus = data.status;
              }
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
      
      console.log('✅ Model pulled successfully!');
    } catch (error) {
      console.error('❌ Error pulling model:', error);
      throw error;
    }
  }
};