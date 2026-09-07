import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  isLoading: boolean;
  onLoadingComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isLoading, 
  onLoadingComplete 
}) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing');

  const loadingPhrases = [
    'Preparing customs clearance',
    'Loading justice systems',
    'Ready for service',
    'Welcome to NCS AI'
  ];

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      setTimeout(() => {
        onLoadingComplete?.();
      }, 600);
      return;
    }

    let interval: ReturnType<typeof setInterval>;
    let textInterval: ReturnType<typeof setInterval>;
    let currentProgress = 0;

    interval = setInterval(() => {
      currentProgress += Math.random() * 3 + 1;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
      }
      setProgress(Math.min(currentProgress, 100));
    }, 200);

    let textIndex = 0;
    textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % loadingPhrases.length;
      setLoadingText(loadingPhrases[textIndex]);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #f5f5f0 0%, #e8e8e0 50%, #d4d4cc 100%)'
          }}
        >
          <div className="relative max-w-md w-full mx-4">
            {/* Background Glow with NCS Green */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#006633]/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#008844]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="relative text-center">
              {/* Logo with Animation */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex justify-center mb-8"
              >
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-premium-lg border-2 border-[#006633]/20 p-3">
                  <img 
                    src="/logo.png" 
                    alt="NCS Logo" 
                    className="w-full h-full object-contain animate-pulse-subtle"
                  />
                </div>
              </motion.div>

              {/* Brand Name */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mb-2"
              >
                <h1 className="text-3xl font-bold text-[#006633]">
                  NIGERIA CUSTOMS
                </h1>
                <p className="text-sm font-medium text-[#008844] mt-1 tracking-widest">
                  JUSTICE & HONESTY
                </p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-[#006633] to-[#008844] mx-auto mt-3 rounded-full" />
              </motion.div>

              {/* Loading Text */}
              <motion.p
                key={loadingText}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm text-[#006633]/70 font-medium mt-6"
              >
                {loadingText}
              </motion.p>

              {/* Progress Bar */}
              <div className="mt-6 relative">
                <div className="h-2 bg-[#006633]/10 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #006633, #008844, #006633)',
                      backgroundSize: '200% 100%'
                    }}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${progress}%`,
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-[#006633]/60 font-medium">
                    NCS AI
                  </span>
                  <span className="text-[10px] text-[#006633] font-bold">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>

              {/* Decorative Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#006633]"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-[#006633]/10">
                <p className="text-[10px] text-[#006633]/40 font-medium tracking-wider">
                  NIGERIA CUSTOMS SERVICE • AI ASSISTANT
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;