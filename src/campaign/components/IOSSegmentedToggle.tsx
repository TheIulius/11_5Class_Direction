import React, { useEffect } from 'react';
import { motion, useMotionValue, animate, PanInfo } from 'framer-motion';
import { soundEffects } from '../utils/soundEffects';

interface IOSSegmentedToggleProps {
  value: 'card' | 'list';
  onChange: (val: 'card' | 'list') => void;
  className?: string;
}

// iOS Spring Physics from ios-fluid-gestures skill
const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 450,
  damping: 36,
  mass: 0.8
};

const THUMB_OFFSET = 38; // Distance between card (0) and list (38px)

export const IOSSegmentedToggle: React.FC<IOSSegmentedToggleProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const x = useMotionValue(value === 'card' ? 0 : THUMB_OFFSET);

  // Synchronize motion value when value prop changes (e.g. on click)
  useEffect(() => {
    const target = value === 'card' ? 0 : THUMB_OFFSET;
    animate(x, target, SPRING_CONFIG);
  }, [value, x]);

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (value === 'card') {
      if (info.offset.x > 12 || info.velocity.x > 120) {
        soundEffects.click();
        onChange('list');
      } else {
        animate(x, 0, SPRING_CONFIG);
      }
    } else {
      if (info.offset.x < -12 || info.velocity.x < -120) {
        soundEffects.click();
        onChange('card');
      } else {
        animate(x, THUMB_OFFSET, SPRING_CONFIG);
      }
    }
  };

  const handlePanEnd = (_e: any, info: PanInfo) => {
    if (info.offset.x > 15 || info.velocity.x > 150) {
      if (value !== 'list') {
        soundEffects.click();
        onChange('list');
      }
    } else if (info.offset.x < -15 || info.velocity.x < -150) {
      if (value !== 'card') {
        soundEffects.click();
        onChange('card');
      }
    }
  };

  return (
    <motion.div
      onPanEnd={handlePanEnd}
      className={`relative inline-flex items-center p-1 rounded-2xl bg-stone-300/80 dark:bg-[#12131d] border border-stone-400/60 dark:border-[#f5f2eb]/20 shadow-inner select-none touch-none ${className}`}
      title={value === 'card' ? '1-ბარათის ხედვა (სათითაოდ)' : 'სრული სიის ხედვა (ერთად)'}
    >
      {/* Authentic iOS Draggable Thumb (Solid, Crisp & Highly Visible in both Light & Dark modes) */}
      <motion.div
        style={{ x, willChange: 'transform' }}
        drag="x"
        dragConstraints={{ left: 0, right: THUMB_OFFSET }}
        dragElastic={0.16}
        onDragEnd={handleDragEnd}
        className="absolute left-1 top-1 w-9 h-7.5 rounded-xl bg-white dark:bg-red-500 shadow-[0_2px_6px_rgba(0,0,0,0.22),0_1px_2px_rgba(0,0,0,0.12)] dark:shadow-[0_2px_12px_rgba(239,68,68,0.5)] border border-stone-200 dark:border-red-400/40 cursor-grab active:cursor-grabbing z-10 will-change-transform"
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
            ? 'text-stone-900 dark:text-white font-bold drop-shadow-sm'
            : 'text-stone-600 dark:text-[#8c887b] hover:text-stone-950 dark:hover:text-[#d4d1c5]'
        }`}
        title="1 კითხვა ბარათად"
        aria-label="1-ბარათის ხედვა"
      >
        <svg
          className="w-4 h-4 transition-transform duration-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
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
            ? 'text-stone-900 dark:text-white font-bold drop-shadow-sm'
            : 'text-stone-600 dark:text-[#8c887b] hover:text-stone-950 dark:hover:text-[#d4d1c5]'
        }`}
        title="ყველა კითხვა სიად"
        aria-label="სიის ხედვა"
      >
        <svg
          className="w-4 h-4 transition-transform duration-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
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
    </motion.div>
  );
};
