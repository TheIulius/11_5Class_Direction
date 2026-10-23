import React, { useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { soundEffects } from '../utils/soundEffects';

interface IOSSegmentedToggleProps {
  value: 'card' | 'list';
  onChange: (val: 'card' | 'list') => void;
  className?: string;
}

export const IOSSegmentedToggle: React.FC<IOSSegmentedToggleProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // iOS Spring Physics from ios-fluid-gestures skill
  const springTransition = {
    type: 'spring' as const,
    stiffness: 450,
    damping: 36,
    mass: 0.8
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If dragged right past threshold or flicked right
    if (value === 'card') {
      if (info.offset.x > 12 || info.velocity.x > 100) {
        soundEffects.click();
        onChange('list');
      }
    } else {
      // If dragged left past threshold or flicked left
      if (info.offset.x < -12 || info.velocity.x < -100) {
        soundEffects.click();
        onChange('card');
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center p-1 rounded-2xl bg-[#12131d]/90 border border-[#f5f2eb]/15 shadow-inner touch-none select-none ${className}`}
      title={value === 'card' ? '1-ბარათის ხედვა (სათითაოდ)' : 'სრული სიის ხედვა (ერთად)'}
    >
      {/* Sliding Active Pill (Draggable & Click-responsive with GPU transform) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 38 }}
        dragElastic={0.18}
        onDragEnd={handleDragEnd}
        animate={{ x: value === 'card' ? 0 : 38 }}
        transition={springTransition}
        className="absolute left-1 top-1 w-9 h-7.5 rounded-xl bg-gradient-to-b from-white/20 to-white/10 dark:from-red-500 dark:to-red-600 shadow-md border border-white/25 cursor-grab active:cursor-grabbing will-change-transform z-10"
        style={{ willChange: 'transform' }}
      />

      {/* Button 1: Card View Icon */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          if (value !== 'card') {
            soundEffects.click();
            onChange('card');
          }
        }}
        className={`relative z-20 w-9 h-7.5 flex items-center justify-center rounded-xl transition-colors duration-200 cursor-pointer ${
          value === 'card'
            ? 'text-white drop-shadow-sm font-bold'
            : 'text-[#8c887b] hover:text-[#d4d1c5]'
        }`}
        title="1 კითხვა ბარათად"
        aria-label="1-ბარათის ხედვა"
      >
        {/* Single Card / Slide SVG icon */}
        <svg
          className="w-4 h-4 transition-transform duration-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="4" />
          <line x1="7" y1="9" x2="17" y2="9" />
          <line x1="7" y1="13" x2="13" y2="13" />
        </svg>
      </motion.button>

      {/* Button 2: List View Icon */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          if (value !== 'list') {
            soundEffects.click();
            onChange('list');
          }
        }}
        className={`relative z-20 w-9 h-7.5 flex items-center justify-center rounded-xl transition-colors duration-200 cursor-pointer ${
          value === 'list'
            ? 'text-white drop-shadow-sm font-bold'
            : 'text-[#8c887b] hover:text-[#d4d1c5]'
        }`}
        title="ყველა კითხვა სიად"
        aria-label="სიის ხედვა"
      >
        {/* List SVG icon with 3 horizontal rows and bullets */}
        <svg
          className="w-4 h-4 transition-transform duration-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="8" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="20" y2="12" />
          <line x1="8" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </motion.button>
    </div>
  );
};
