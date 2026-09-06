import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  className?: string;
  variant?: 'full' | 'icon' | 'text';
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  animated = false,
  className = '',
  variant = 'full'
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const subtitleSizes = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm'
  };

  const renderIcon = () => {
    if (variant === 'text') return null;
    
    return (
      <div className={`
        relative ${sizes[size]} 
        rounded-2xl flex items-center justify-center
        shadow-premium-sm
        ${animated ? 'animate-pulse-subtle' : ''}
        group hover:scale-105 transition-transform duration-300
        bg-white
        border-2 border-[#006633]/20
        overflow-hidden
        p-1
      `}>
        <img 
          src="/logo.png" 
          alt="NCS Logo" 
          className="w-full h-full object-contain rounded-xl"
        />
        {animated && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#006633]/10 via-[#008844]/10 to-[#006633]/10 animate-gradient" />
        )}
      </div>
    );
  };

  const renderText = () => {
    if (variant === 'icon') return null;
    if (!showText) return null;

    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className={`
            font-bold tracking-tight text-[#006633]
            ${textSizes[size]}
          `}>
            NIGERIA
          </span>
          <span className={`
            font-bold tracking-tight text-[#008844]
            ${textSizes[size]}
          `}>
            CUSTOMS
          </span>
        </div>
        <span className={`
          font-medium text-[#004422] tracking-[0.15em]
          ${subtitleSizes[size]}
        `}>
          SERVICE
        </span>
        {/* <span className={`
          font-light text-[#006633] tracking-[0.2em] mt-0.5
          ${subtitleSizes[size]}
        `}>
          JUSTICE & HONESTY
        </span> */}
      </div>
    );
  };

  if (variant === 'icon') {
    return renderIcon();
  }

  if (variant === 'text') {
    return renderText();
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {renderIcon()}
      {renderText()}
    </div>
  );
};

export default Logo;