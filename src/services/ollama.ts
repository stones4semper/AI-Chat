import axios from 'axios';
import type { OllamaResponse } from '@/types';

const API_BASE_URL = 'http://localhost:11434/api';

export const ollamaService = {
  async generateResponse(prompt: string, model: string = 'qwen:latest'): Promise<string> {
    try {
      const response = await axios.post<OllamaResponse>(
        `${API_BASE_URL}/chat`,
        {
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: false
        }
      );
      
      return response.data.message.content;
    } catch (error) {
      console.error('Error calling Ollama:', error);
      throw new Error('Failed to get response from Ollama. Make sure Ollama is running.');
    }
  },

  async streamResponse(
    prompt: string, 
    model: string = 'qwen:latest',
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: true
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              onChunk(data.message.content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      console.error('Error streaming from Ollama:', error);
      throw new Error('Failed to stream response from Ollama.');
    }
  },

  async checkConnection(): Promise<boolean> {
    try {
      await axios.get(`${API_BASE_URL}/tags`);
      return true;
    } catch {
      return false;
    }
  }
};