import React from 'react';
import { motion } from 'framer-motion';

export interface IOSSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'emerald' | 'rose' | 'amber' | 'sky';
  label?: string;
  sublabel?: string;
  className?: string;
  ariaLabel?: string;
}

export const IOSSwitch: React.FC<IOSSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  color = 'emerald',
  label,
  sublabel,
  className = '',
  ariaLabel,
}) => {
  const dimensions = {
    sm: { trackW: 'w-10', trackH: 'h-6', thumb: 'w-4 h-4', translate: 16, pad: 'p-1' },
    md: { trackW: 'w-13', trackH: 'h-7', thumb: 'w-5 h-5', translate: 24, pad: 'p-1' },
    lg: { trackW: 'w-16', trackH: 'h-9', thumb: 'w-7 h-7', translate: 28, pad: 'p-1' },
  }[size];

  const activeBg = {
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
  }[color];

  const handleToggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <div
      onClick={handleToggle}
      className={`inline-flex items-center gap-3 select-none ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {(label || sublabel) && (
        <div className="flex flex-col text-left">
          {label && <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{label}</span>}
          {sublabel && <span className="text-[11px] text-slate-500 dark:text-slate-400">{sublabel}</span>}
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label || 'Toggle switch'}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className={`relative inline-flex items-center ${dimensions.trackW} ${dimensions.trackH} ${dimensions.pad} rounded-full transition-colors duration-250 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 ${
          checked ? activeBg : 'bg-slate-300 dark:bg-zinc-700'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <motion.span
          layout
          transition={{
            type: 'spring',
            stiffness: 550,
            damping: 30,
          }}
          animate={{
            x: checked ? dimensions.translate : 0,
          }}
          className={`${dimensions.thumb} rounded-full bg-white shadow-md pointer-events-none transform`}
        />
      </button>
    </div>
  );
};
