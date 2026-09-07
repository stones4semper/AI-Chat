import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Cpu, Sparkles, Zap, Brain, Database } from 'lucide-react';
import { ollamaService } from '@/services/ollama';
import type { OllamaModel } from '@/types';

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  className?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,
  onModelChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get model icon
  const getModelIcon = (modelName: string) => {
    const name = modelName.toLowerCase();
    if (name.includes('qwen')) return <Sparkles size={14} />;
    if (name.includes('llama')) return <Brain size={14} />;
    if (name.includes('mistral')) return <Zap size={14} />;
    if (name.includes('gemma')) return <Database size={14} />;
    return <Cpu size={14} />;
  };

  // Get model display name
  const getModelDisplayName = (modelName: string) => {
    const name = modelName.toLowerCase();
    if (name.includes('qwen')) return 'Qwen';
    if (name.includes('llama')) return 'Llama';
    if (name.includes('mistral')) return 'Mistral';
    if (name.includes('gemma')) return 'Gemma';
    return modelName.split(':')[0].charAt(0).toUpperCase() + 
           modelName.split(':')[0].slice(1);
  };

  // Get model color
  const getModelColor = (modelName: string) => {
    const name = modelName.toLowerCase();
    if (name.includes('qwen')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (name.includes('llama')) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (name.includes('mistral')) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (name.includes('gemma')) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  // Load available models
  const loadModels = async () => {
    setIsLoading(true);
    try {
      const availableModels = await ollamaService.getModels();
      setModels(availableModels);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => {
          if (models.length === 0) loadModels();
          setIsOpen(!isOpen);
        }}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-xl
          border transition-all duration-200
          ${getModelColor(currentModel)}
          hover:shadow-premium-sm
          ${isOpen ? 'ring-2 ring-offset-2 ring-[#006633]/20' : ''}
        `}
        disabled={isLoading}
      >
        {getModelIcon(currentModel)}
        <span className="text-xs font-medium">
          {getModelDisplayName(currentModel)}
        </span>
        <ChevronDown 
          size={12} 
          className={`
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
        {isLoading && (
          <div className="w-3 h-3 border-2 border-[#006633]/30 border-t-[#006633] rounded-full animate-spin" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-premium-lg border border-[#006633]/10 overflow-hidden z-50 animate-slide-up">
          <div className="p-2 border-b border-[#006633]/10 bg-[#006633]/5">
            <p className="text-[10px] font-medium text-[#006633]/60 uppercase tracking-wider px-2">
              Available Models
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {models.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No models found. Pull one first.
              </div>
            ) : (
              models.map((model) => {
                const isActive = model.name === currentModel;
                const modelColor = getModelColor(model.name);
                
                return (
                  <button
                    key={model.name}
                    onClick={() => {
                      onModelChange(model.name);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5
                      hover:bg-[#006633]/5 transition-colors duration-150
                      ${isActive ? 'bg-[#006633]/10' : ''}
                    `}
                  >
                    <div className={`
                      p-1.5 rounded-lg border
                      ${isActive ? modelColor : 'bg-gray-50 border-gray-200'}
                    `}>
                      {getModelIcon(model.name)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {getModelDisplayName(model.name)}
                        </span>
                        {isActive && (
                          <Check size={12} className="text-[#006633]" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span>{model.details?.parameter_size || 'Unknown size'}</span>
                        <span>·</span>
                        <span>{model.details?.quantization_level || 'Default'}</span>
                      </div>
                    </div>
                    {model.details?.family && (
                      <span className="text-[8px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {model.details.family}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
          <div className="p-2 border-t border-[#006633]/10 bg-[#006633]/5">
            <button
              onClick={() => {
                loadModels();
                setIsOpen(false);
              }}
              className="w-full text-xs text-[#006633]/60 hover:text-[#006633] text-center py-1"
            >
              Refresh Models
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;