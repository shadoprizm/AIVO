import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlowingCTAButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function GlowingCTAButton({ children, onClick, className = '' }: GlowingCTAButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`relative px-8 py-4 text-lg font-semibold text-white rounded-lg overflow-hidden group ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500" />

      {/* Animated glow ring */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)',
        }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)',
            '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.5)',
            '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-white to-transparent"
          animate={{
            top: ['-10%', '110%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
            ease: 'linear',
          }}
        />
      </motion.div>

      {/* Hover shimmer effect */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
        }}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 0.5,
        }}
      />

      {/* Pulse rings on hover */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(59, 130, 246, 0.4)',
            '0 0 0 10px rgba(59, 130, 246, 0)',
          ],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      />

      {/* Button text */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
        <motion.svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </motion.svg>
      </span>
    </motion.button>
  );
}
