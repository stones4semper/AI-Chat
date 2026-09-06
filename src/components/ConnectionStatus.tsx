import React, { useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, Loader2, Download } from 'lucide-react';
import { useOllama } from '@/hooks/useOllama';

interface ConnectionStatusProps {
  showDetails?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ showDetails = true }) => {
  const { isConnected, error, availableModels, checkConnection, refreshModels } = useOllama();

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  if (isConnected === null) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Loader2 size={14} className="animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#006633] animate-pulse" />
          <Wifi size={14} className="text-[#006633]" />
          <span className="text-xs font-medium text-[#006633]">Online</span>
        </div>
        {showDetails && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#006633]/60">
            <span>·</span>
            <span>{availableModels.length} model{availableModels.length !== 1 ? 's' : ''}</span>
            {availableModels.length === 0 && (
              <button
                onClick={() => {
                  // Trigger model pull
                  const pullModel = async () => {
                    try {
                      const { ollamaService } = await import('@/services/ollama');
                      await ollamaService.pullModel('qwen:latest');
                      await refreshModels();
                      await checkConnection();
                    } catch (error) {
                      console.error('Failed to pull model:', error);
                    }
                  };
                  pullModel();
                }}
                className="flex items-center gap-1 px-2 py-0.5 bg-[#006633]/10 text-[#006633] rounded-full hover:bg-[#006633]/20 transition-colors"
              >
                <Download size={10} />
                Pull Model
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
        <WifiOff size={14} className="text-red-500" />
        <span className="text-xs font-medium text-red-600">Offline</span>
      </div>
      {error && showDetails && (
        <div className="flex items-center gap-1.5 text-[10px] text-red-500/60">
          <AlertCircle size={12} />
          <span className="max-w-[150px] truncate">{error}</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;