import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, Loader2, ChevronRight } from 'lucide-react';

export interface SlideToConfirmProps {
  label: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'emerald';
  disabled?: boolean;
}

export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({
  label,
  confirmLabel = 'Confirmed!',
  onConfirm,
  isLoading = false,
  variant = 'emerald',
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxDrag, setMaxDrag] = useState(200);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const x = useMotionValue(0);

  // Measure container width to calculate drag travel
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      // Thumb width is 44px + 8px padding
      setMaxDrag(Math.max(80, containerWidth - 52));
    }
  }, []);

  const variantStyles = {
    danger: {
      trackBg: 'bg-zinc-900 border-rose-500/30',
      activeTrack: 'bg-rose-500/25',
      thumbBg: 'bg-rose-500 text-white',
      thumbGlow: 'shadow-[0_0_20px_rgba(244,63,94,0.5)]',
      text: 'text-rose-300',
    },
    warning: {
      trackBg: 'bg-zinc-900 border-amber-500/30',
      activeTrack: 'bg-amber-500/25',
      thumbBg: 'bg-amber-400 text-slate-950',
      thumbGlow: 'shadow-[0_0_20px_rgba(251,191,36,0.5)]',
      text: 'text-amber-300',
    },
    emerald: {
      trackBg: 'bg-zinc-900 border-emerald-500/30',
      activeTrack: 'bg-emerald-500/25',
      thumbBg: 'bg-emerald-500 text-slate-950',
      thumbGlow: 'shadow-[0_0_20px_rgba(16,185,129,0.5)]',
      text: 'text-emerald-300',
    },
  }[variant];

  const triggerConfirm = async () => {
    if (disabled || isLoading || isExecuting || isConfirmed) return;
    setIsExecuting(true);
    setIsConfirmed(true);
    x.set(maxDrag);
    try {
      await onConfirm();
    } catch {
      setIsConfirmed(false);
      x.set(0);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDragEnd = () => {
    if (disabled || isLoading || isExecuting || isConfirmed) return;
    const currentX = x.get();
    if (currentX >= maxDrag * 0.65) {
      triggerConfirm();
    } else {
      x.set(0);
    }
  };

  // Reset confirmation after a short display
  useEffect(() => {
    if (isConfirmed && !isLoading && !isExecuting) {
      const timer = setTimeout(() => {
        setIsConfirmed(false);
        x.set(0);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, isLoading, isExecuting, x]);

  return (
    <div
      ref={containerRef}
      className={`relative h-13 w-full rounded-full border p-1 select-none overflow-hidden transition-all shadow-inner ${
        disabled
          ? 'opacity-40 pointer-events-none bg-zinc-950 border-white/5'
          : variantStyles.trackBg
      }`}
    >
      {/* Background Active Fill based on drag position */}
      <motion.div
        className={`absolute inset-y-0 left-0 rounded-full ${variantStyles.activeTrack}`}
        style={{
          width: isConfirmed ? '100%' : undefined,
        }}
      />

      {/* Label Text Centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
        {isLoading || isExecuting ? (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Processing...</span>
          </div>
        ) : isConfirmed ? (
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
            <Check className="w-4 h-4" />
            <span>{confirmLabel}</span>
          </div>
        ) : (
          <span className={`text-xs font-black tracking-wide uppercase truncate ${variantStyles.text}`}>
            {label}
          </span>
        )}
      </div>

      {/* iOS Style Draggable Thumb */}
      <motion.div
        drag={disabled || isLoading || isExecuting || isConfirmed ? false : 'x'}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={isConfirmed ? { x: maxDrag } : undefined}
        style={{ x }}
        className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing font-bold transition-shadow ${
          variantStyles.thumbBg
        } ${variantStyles.thumbGlow}`}
      >
        {isConfirmed ? (
          <Check className="w-5 h-5 text-current stroke-[3]" />
        ) : isLoading || isExecuting ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          <ChevronRight className="w-5 h-5 text-current stroke-[3]" />
        )}
      </motion.div>
    </div>
  );
};
