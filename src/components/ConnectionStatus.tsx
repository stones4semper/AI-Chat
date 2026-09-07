import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle, Loader2, Download, CheckCircle, XCircle } from 'lucide-react';
import { useOllama } from '@/hooks/useOllama';
import { ollamaService } from '@/services/ollama';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
  isConnected?: boolean | null;
  availableModels?: string[];
  error?: string | null;
  onRefresh?: () => Promise<void>;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  showDetails = true,
  className = '',
  isConnected: isConnectedProp,
  availableModels: availableModelsProp,
  error: errorProp,
  onRefresh: onRefreshProp
}) => {
  const hookData = useOllama();
  const isConnected = isConnectedProp !== undefined ? isConnectedProp : hookData.isConnected;
  const error = errorProp !== undefined ? errorProp : hookData.error;
  const availableModels = availableModelsProp !== undefined ? availableModelsProp : hookData.availableModels;
  const checkConnection = hookData.checkConnection;
  const refreshModels = hookData.refreshModels;

  const [isChecking, setIsChecking] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [pullStatus, setPullStatus] = useState<string>('');

  const handleCheckConnection = async () => {
    setIsChecking(true);
    if (onRefreshProp) {
      await onRefreshProp();
    } else {
      await checkConnection();
      await refreshModels();
    }
    setLastChecked(new Date());
    setIsChecking(false);
  };

  useEffect(() => {
    if (!onRefreshProp) {
      handleCheckConnection();
      const interval = setInterval(handleCheckConnection, 30000);
      return () => clearInterval(interval);
    }
  }, [onRefreshProp]);

  const handlePullModel = async () => {
    if (isPulling) return;
    
    setIsPulling(true);
    setPullStatus('Starting download...');
    
    try {
      await ollamaService.pullModel('qwen:latest');
      setPullStatus('✅ Model pulled successfully!');
      // Refresh models after pull
      await refreshModels();
      await checkConnection();
      setTimeout(() => setPullStatus(''), 3000);
    } catch (error) {
      console.error('Failed to pull model:', error);
      setPullStatus('❌ Failed to pull model');
      setTimeout(() => setPullStatus(''), 3000);
    } finally {
      setIsPulling(false);
    }
  };

  // Connection is still being checked
  if (isConnected === null) {
    return (
      <div className={`flex items-center gap-2 text-xs text-gray-400 ${className}`}>
        <Loader2 size={14} className="animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  // Connection is successful
  if (isConnected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#006633] animate-pulse" />
          <Wifi size={14} className="text-[#006633]" />
          <span className="text-xs font-medium text-[#006633]">Online</span>
        </div>
        
        {showDetails && (
          <div className="flex items-center gap-2 text-[10px] text-[#006633]/60">
            <span>·</span>
            <span className="flex items-center gap-1">
              <CheckCircle size={10} className="text-[#006633]" />
              {availableModels.length} model{availableModels.length !== 1 ? 's' : ''}
            </span>
            
            {availableModels.length === 0 && (
              <button
                onClick={handlePullModel}
                disabled={isPulling}
                className="flex items-center gap-1 px-2 py-0.5 bg-[#006633]/10 text-[#006633] rounded-full hover:bg-[#006633]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPulling ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Download size={10} />
                )}
                {isPulling ? 'Pulling...' : 'Pull Model'}
              </button>
            )}
            
            {pullStatus && (
              <span className={`text-[8px] ${pullStatus.includes('✅') ? 'text-green-600' : pullStatus.includes('❌') ? 'text-red-500' : 'text-[#006633]/60'}`}>
                · {pullStatus}
              </span>
            )}
            
            {lastChecked && !pullStatus && (
              <span className="text-[8px] text-[#006633]/30">
                · {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Connection failed
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
        <WifiOff size={14} className="text-red-500" />
        <span className="text-xs font-medium text-red-600">Offline</span>
      </div>
      
      {showDetails && (
        <div className="flex items-center gap-2 text-[10px]">
          {error && (
            <div className="flex items-center gap-1 text-red-500/60 max-w-[150px]">
              <AlertCircle size={12} />
              <span className="truncate">{error}</span>
            </div>
          )}
          
          <button
            onClick={handleCheckConnection}
            disabled={isChecking}
            className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {isChecking ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <XCircle size={10} />
            )}
            <span>Retry</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;