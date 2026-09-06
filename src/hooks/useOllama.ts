import { useState, useCallback, useEffect } from 'react';
import { ollamaService } from '@/services/ollama';
import type { Message } from '@/types';

export const useOllama = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      console.log('🔍 Checking Ollama connection...');
      const connected = await ollamaService.checkConnection();
      setIsConnected(connected);
      
      if (connected) {
        // Get available models
        const models = await ollamaService.getModels();
        const modelNames = models.map(m => m.name);
        setAvailableModels(modelNames);
        console.log('📦 Available models:', modelNames);
        
        if (modelNames.length === 0) {
          setError('No models found. Please pull a model: ollama pull qwen:latest');
        } else {
          setError(null);
        }
      } else {
        setError('Cannot connect to Ollama. Please make sure Ollama is running.');
      }
      return connected;
    } catch (err) {
      console.error('❌ Connection check failed:', err);
      setIsConnected(false);
      setError('Failed to connect to Ollama. Please check if Ollama is running.');
      return false;
    }
  }, []);

  // Auto-check connection on mount
  useEffect(() => {
    if (!isInitialized) {
      checkConnection();
      setIsInitialized(true);
    }
  }, [checkConnection, isInitialized]);

  // Retry connection every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected === false || isConnected === null) {
        console.log('🔄 Retrying connection...');
        checkConnection();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [checkConnection, isConnected]);

  const sendMessage = useCallback(async (
    messages: Message[],
    model: string = 'qwen:latest',
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const lastMessage = messages[messages.length - 1];
      
      if (!lastMessage) {
        throw new Error('No message to send');
      }

      // Check if model exists, if not try to pull it
      if (!availableModels.includes(model)) {
        console.log(`📥 Model "${model}" not found, attempting to pull...`);
        try {
          await ollamaService.pullModel(model);
          // Refresh models list
          const models = await ollamaService.getModels();
          setAvailableModels(models.map(m => m.name));
        } catch (pullError) {
          console.error('Failed to pull model:', pullError);
          // Continue anyway, maybe it will work
        }
      }

      console.log(`🔄 Sending message to model: ${model}`);
      
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
      console.error('❌ Error in sendMessage:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, [availableModels]);

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
    refreshModels
  };
};