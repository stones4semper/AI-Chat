import { useState, useCallback, useEffect, useRef } from 'react';
import { ollamaService } from '@/services/ollama';
import type { Message } from '@/types';

export const useOllama = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const connected = await ollamaService.checkConnection();
      setIsConnected(connected);
      
      if (connected) {
        const models = await ollamaService.getModels();
        const modelNames = models.map(m => m.name);
        setAvailableModels(modelNames);
        if (modelNames.length > 0) {
          setError(null);
        } else {
          setError('No models found. Pull one with: ollama pull qwen:latest');
        }
      } else {
        setError('Cannot connect to Ollama. Make sure it is running.');
      }
      return connected;
    } catch (err) {
      console.error('Connection check failed:', err);
      setIsConnected(false);
      setError('Failed to connect to Ollama.');
      return false;
    }
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      console.log('🛑 Stopping generation...');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (
    messages: Message[],
    model: string = 'qwen:latest',
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const userMessages = messages.filter(m => m.role === 'user');
      const lastUserMessage = userMessages[userMessages.length - 1];
      
      if (!lastUserMessage) {
        throw new Error('No user message found');
      }

      const prompt = lastUserMessage.content;
      
      if (!prompt || prompt.trim() === '') {
        throw new Error('Empty message');
      }

      console.log(`Sending to ${model}: "${prompt.slice(0, 50)}..."`);

      const messagesPayload = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      let fullResponse = '';

      if (onChunk) {
        await ollamaService.streamResponse(
          messagesPayload,
          model,
          (chunk) => {
            fullResponse += chunk;
            onChunk(chunk);
          },
          abortControllerRef.current.signal
        );
      } else {
        fullResponse = await ollamaService.generateResponse(messagesPayload, model);
      }
      
      setIsLoading(false);
      abortControllerRef.current = null;
      return fullResponse;
    } catch (err) {
      // Check if it was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🛑 Generation was stopped by user');
        setError('Generation stopped by user');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        console.error('Error in sendMessage:', errorMessage);
        setError(errorMessage);
      }
      setIsLoading(false);
      abortControllerRef.current = null;
      throw err;
    }
  }, []);

  const refreshModels = useCallback(async () => {
    try {
      const models = await ollamaService.getModels();
      setAvailableModels(models.map(m => m.name));
      return models;
    } catch (error) {
      console.error('Failed to refresh models:', error);
      return [];
    }
  }, []);

  return {
    isLoading,
    error,
    isConnected,
    availableModels,
    checkConnection,
    sendMessage,
    stopGeneration,
    refreshModels
  };
};