import { useState, useCallback } from 'react';
import { ollamaService } from '@/services/ollama';
import type { Message } from '@/types';

export const useOllama = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [currentModel, setCurrentModel] = useState('qwen:latest');

  const checkConnection = useCallback(async () => {
    try {
      const connected = await ollamaService.checkConnection();
      setIsConnected(connected);
      return connected;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, []);

  const sendMessage = useCallback(async (
    messages: Message[],
    model: string = 'qwen:latest',
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const lastMessage = messages[messages.length - 1];
      
      if (onChunk) {
        let fullResponse = '';
        await ollamaService.streamResponse(
          lastMessage.content,
          model,
          (chunk) => {
            fullResponse += chunk;
            onChunk(chunk);
          }
        );
        setIsLoading(false);
        return fullResponse;
      } else {
        const response = await ollamaService.generateResponse(
          lastMessage.content,
          model
        );
        setIsLoading(false);
        return response;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, []);

  return {
    isLoading,
    error,
    isConnected,
    currentModel,
    checkConnection,
    sendMessage,
    setCurrentModel
  };
};