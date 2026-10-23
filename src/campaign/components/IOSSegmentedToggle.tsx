import React from 'react';
import { motion, PanInfo } from 'framer-motion';
import { soundEffects } from '../utils/soundEffects';

interface IOSSegmentedToggleProps {
  value: 'card' | 'list';
  onChange: (val: 'card' | 'list') => void;
  className?: string;
}

const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 450,
  damping: 36,
  mass: 0.8
};

export const IOSSegmentedToggle: React.FC<IOSSegmentedToggleProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const handlePanEnd = (_e: any, info: PanInfo) => {
    if (info.offset.x > 12 || info.velocity.x > 120) {
      if (value !== 'list') {
        soundEffects.click();
        onChange('list');
      }
    } else if (info.offset.x < -12 || info.velocity.x < -120) {
      if (value !== 'card') {
        soundEffects.click();
        onChange('card');
      }
    }
  };

  return (
    <motion.div
      onPanEnd={handlePanEnd}
      className={`relative inline-flex items-center p-[3px] rounded-full bg-[#EAE6DE] dark:bg-[#141522] border border-[#D6D1C4] dark:border-[#f5f2eb]/20 shadow-inner select-none touch-none ${className}`}
      title={value === 'card' ? '1-ბარათის ხედვა' : 'სიის ხედვა'}
    >
      {/* Slot 1: Card View Button */}
      <button
        type="button"
        onClick={() => {
          if (value !== 'card') {
            soundEffects.click();
            onChange('card');
          }
        }}
        className={`relative z-10 w-[36px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer ${
          value === 'card'
            ? 'text-stone-900 dark:text-white font-bold'
            : 'text-stone-500 dark:text-[#8c887b] hover:text-stone-800 dark:hover:text-[#d4d1c5]'
        }`}
        aria-label="1-ბარათის ხედვა"
        title="1 კითხვა ბარათად"
      >
        {value === 'card' && (
          <motion.div
            layoutId="segmentedActivePill"
            transition={SPRING_TRANSITION}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.35}
            onDragEnd={(_e, info) => {
              if (info.offset.x > 10 || info.velocity.x > 100) {
                soundEffects.click();
                onChange('list');
              }
            }}
            className="absolute inset-0 rounded-full bg-white dark:bg-red-500 shadow-[0_2px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_12px_rgba(239,68,68,0.55)] border border-black/5 dark:border-red-400/30 will-change-transform z-0 cursor-grab active:cursor-grabbing"
          />
        )}
        <span className="relative z-10 flex items-center justify-center pointer-events-none">
          <svg
            className="w-4 h-4"
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
        </span>
      </button>

      {/* Slot 2: List View Button */}
      <button
        type="button"
        onClick={() => {
          if (value !== 'list') {
            soundEffects.click();
            onChange('list');
          }
        }}
        className={`relative z-10 w-[36px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer ${
          value === 'list'
            ? 'text-stone-900 dark:text-white font-bold'
            : 'text-stone-500 dark:text-[#8c887b] hover:text-stone-800 dark:hover:text-[#d4d1c5]'
        }`}
        aria-label="სიის ხედვა"
        title="ყველა კითხვა სიად"
      >
        {value === 'list' && (
          <motion.div
            layoutId="segmentedActivePill"
            transition={SPRING_TRANSITION}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.35}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -10 || info.velocity.x < -100) {
                soundEffects.click();
                onChange('card');
              }
            }}
            className="absolute inset-0 rounded-full bg-white dark:bg-red-500 shadow-[0_2px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_12px_rgba(239,68,68,0.55)] border border-black/5 dark:border-red-400/30 will-change-transform z-0 cursor-grab active:cursor-grabbing"
          />
        )}
        <span className="relative z-10 flex items-center justify-center pointer-events-none">
          <svg
            className="w-4 h-4"
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
        </span>
      </button>
    </motion.div>
  );
};
