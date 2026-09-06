import React from 'react';
import { motion } from 'framer-motion';

const LogoAnimation: React.FC = () => {
  return (
    <div className="relative w-24 h-24">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-2xl"
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 0, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-2xl" />
        <svg
          className="absolute inset-0 w-full h-full p-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3L12 21" />
          <path d="M18 9L12 3L6 9" />
          <path d="M18 15L12 21L6 15" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 9L12 12" />
          <path d="M12 15L12 18" />
        </svg>
      </motion.div>
      <motion.div
        className="absolute -inset-2 rounded-3xl bg-primary-400/20 blur-xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};

export default LogoAnimation;