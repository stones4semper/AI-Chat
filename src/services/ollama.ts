import axios from 'axios';
import type { OllamaResponse, OllamaModel } from '@/types';

const API_BASE_URL = 'http://localhost:11434/api';

export const ollamaService = {
  async getModels(): Promise<OllamaModel[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/tags`, {
        timeout: 5000
      });
      console.log('✅ Models fetched:', response.data);
      return response.data.models || [];
    } catch (error) {
      console.error('❌ Error fetching models:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          console.error('Ollama is not running. Start with: ollama serve');
        }
        if (error.response?.status === 404) {
          console.error('Ollama API endpoint not found');
        }
      }
      return [];
    }
  },

  async generateResponse(prompt: string, model: string = 'qwen:latest'): Promise<string> {
    try {
      console.log(`🔄 Generating response with model: ${model}`);
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
        },
        {
          timeout: 60000 // 60 second timeout
        }
      );
      
      console.log('✅ Response received');
      return response.data.message.content;
    } catch (error) {
      console.error('❌ Error calling Ollama:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to Ollama. Please make sure Ollama is running (ollama serve)');
        }
        if (error.response?.status === 404) {
          throw new Error(`Model "${model}" not found. Please pull it first: ollama pull ${model}`);
        }
        if (error.response?.status === 500) {
          throw new Error('Ollama internal error. Please check Ollama logs.');
        }
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
          throw new Error('Ollama request timed out. The model might be loading or busy.');
        }
      }
      throw new Error('Failed to get response from Ollama. Please check if Ollama is running.');
    }
  },

  async streamResponse(
    prompt: string, 
    model: string = 'qwen:latest',
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      console.log(`🔄 Streaming response with model: ${model}`);
      
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

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Model "${model}" not found. Please pull it first: ollama pull ${model}`);
        }
        if (response.status === 500) {
          throw new Error('Ollama internal error. Please check Ollama logs.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';
      let hasReceivedData = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        buffer += chunk;
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              hasReceivedData = true;
              onChunk(data.message.content);
            }
            if (data.done) {
              console.log('✅ Stream complete');
            }
          } catch (e) {
            console.warn('⚠️ Failed to parse JSON line:', line);
          }
        }
      }

      if (!hasReceivedData) {
        throw new Error('No response received from Ollama. The model might not be responding.');
      }
    } catch (error) {
      console.error('❌ Error streaming from Ollama:', error);
      throw error;
    }
  },

  async checkConnection(): Promise<boolean> {
    try {
      console.log('🔍 Checking Ollama connection...');
      
      // First, check if Ollama is running
      const response = await axios.get(`${API_BASE_URL}/tags`, {
        timeout: 3000
      });
      
      console.log('✅ Ollama connection successful');
      
      // Check if we have any models
      const models = response.data.models || [];
      if (models.length === 0) {
        console.warn('⚠️ No models found in Ollama. Please pull a model: ollama pull qwen:latest');
        // Still return true because Ollama is running, just no models
        return true;
      }
      
      console.log(`📦 Found ${models.length} model(s):`, models.map((m: any) => m.name).join(', '));
      return true;
    } catch (error) {
      console.error('❌ Ollama connection failed:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          console.error('💡 Start Ollama with: ollama serve');
        }
        if (error.response?.status === 404) {
          console.error('💡 Ollama API not found. Make sure Ollama is running correctly.');
        }
        if (error.code === 'ETIMEDOUT') {
          console.error('💡 Connection timeout. Make sure Ollama is running and reachable.');
        }
      }
      return false;
    }
  },

  async pullModel(model: string): Promise<void> {
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status) {
              console.log(`📦 ${data.status}: ${data.progress || ''}`);
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