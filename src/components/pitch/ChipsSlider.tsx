import React, { useState, useEffect, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { useFPL } from '../../context/FPLContext';
import { ChipType } from '../../types/fpl';
import { triggerHaptic } from '../../utils/haptics';
import { TripleCaptainIcon, BenchBoostIcon, WildcardIcon } from '../icons/ChipIcons';
import { Sparkles } from 'lucide-react';

interface ChipsSliderProps {
  selectedGW: number;
  isPastGW?: boolean;
}

interface ChipItemConfig {
  id: ChipType;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CHIP_ITEMS: ChipItemConfig[] = [
  { id: 'triple_captain', label: 'Triple Captain', shortLabel: 'Triple C', icon: TripleCaptainIcon },
  { id: 'bench_boost', label: 'Bench Boost', shortLabel: 'Bench B', icon: BenchBoostIcon },
  { id: 'wildcard', label: 'Wildcard', shortLabel: 'Wildcard', icon: WildcardIcon },
];

const CHIP_THEMES: Record<
  ChipType,
  {
    border: string;
    bg: string;
    text: string;
    glow: string;
    handle: string;
    pill: string;
  }
> = {
  triple_captain: {
    border: 'border-amber-400/80',
    bg: 'bg-gradient-to-r from-amber-950/95 via-black/90 to-amber-950/95',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.35)]',
    handle: 'bg-amber-400',
    pill: 'bg-amber-500/25 border-amber-400/60 text-amber-200',
  },
  bench_boost: {
    border: 'border-emerald-400/80',
    bg: 'bg-gradient-to-r from-emerald-950/95 via-black/90 to-emerald-950/95',
    text: 'text-emerald-300',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.35)]',
    handle: 'bg-emerald-400',
    pill: 'bg-emerald-500/25 border-emerald-400/60 text-emerald-200',
  },
  wildcard: {
    border: 'border-purple-400/80',
    bg: 'bg-gradient-to-r from-purple-950/95 via-black/90 to-purple-950/95',
    text: 'text-purple-300',
    glow: 'shadow-[0_0_20px_rgba(192,132,252,0.35)]',
    handle: 'bg-purple-400',
    pill: 'bg-purple-500/25 border-purple-400/60 text-purple-200',
  },
};

// iOS Authentic Spring Physics (@ios-fluid-gesturesSKILL)
const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 40,
  mass: 0.8,
};

export const ChipsSlider: React.FC<ChipsSliderProps> = ({
  selectedGW,
  isPastGW = false,
}) => {
  const { squad, activateChip, isSquadLocked } = useFPL();
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active chip detection
  const activeChip: ChipType | null = isPastGW
    ? squad.gameweekChips?.[selectedGW] || null
    : squad.activeChip;

  const currentTheme = activeChip ? CHIP_THEMES[activeChip] : null;

  // Click outside to collapse
  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isExpanded]);

  const toggleExpand = () => {
    if (isPastGW) return;
    triggerHaptic('light');
    setIsExpanded((prev) => !prev);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (isPastGW) return;
    // Slide out if dragged right
    if (!isExpanded && (info.offset.x > 25 || info.velocity.x > 120)) {
      triggerHaptic('light');
      setIsExpanded(true);
    }
    // Slide in if dragged left
    else if (isExpanded && (info.offset.x < -25 || info.velocity.x < -120)) {
      triggerHaptic('light');
      setIsExpanded(false);
    }
  };

  const handleSelectChip = (chipId: ChipType) => {
    if (isPastGW || isSquadLocked) return;

    // Check if used in previous gameweeks
    const isUsedInPast = Boolean(
      squad.gameweekChips &&
        Object.entries(squad.gameweekChips).some(
          ([gwStr, c]) => Number(gwStr) < selectedGW && c === chipId
        )
    );
    if (isUsedInPast) {
      triggerHaptic('warning');
      return;
    }

    triggerHaptic('medium');
    activateChip(chipId);

    // Smoothly collapse back to default state
    setTimeout(() => {
      setIsExpanded(false);
    }, 180);
  };

  // Find active item config
  const activeItem = activeChip
    ? CHIP_ITEMS.find((c) => c.id === activeChip)
    : null;

  return (
    <motion.div
      ref={containerRef}
      layout
      transition={SPRING_CONFIG}
      style={{ willChange: 'transform' }}
      className={`relative flex items-center h-10 backdrop-blur-2xl rounded-2xl select-none will-change-transform shadow-2xl border transition-colors duration-300 ${
        currentTheme
          ? `${currentTheme.bg} ${currentTheme.border} ${currentTheme.glow}`
          : 'bg-black/90 dark:bg-[#070b12]/95 border-white/10 text-white'
      }`}
    >
      {!isExpanded ? (
        /* ======================================================== */
        /* DEFAULT STATE: Active Chip or "Chips" + Large "|" Handle  */
        /* ======================================================== */
        <div className="h-full flex items-center">
          {/* Default Label Button (Tapping slides it out) */}
          <button
            type="button"
            disabled={isPastGW}
            onClick={toggleExpand}
            className={`h-full pl-3.5 pr-1.5 flex items-center gap-2 transition-transform ${
              isPastGW ? 'cursor-default' : 'cursor-pointer active:scale-95'
            }`}
            title="Tap or slide to view chips"
          >
            {activeItem && currentTheme ? (
              <span className="text-xs font-black tracking-tight uppercase flex items-center gap-1.5 whitespace-nowrap">
                <activeItem.icon className="w-3.5 h-3.5 shrink-0" />
                <span className={currentTheme.text}>{activeItem.label}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${currentTheme.handle} animate-pulse ml-0.5`} />
              </span>
            ) : (
              <span className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5 text-zinc-300 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Chips</span>
              </span>
            )}
          </button>

          {/* iOS Draggable & Tappable "|" Line Handle (Generous 44px Touch Target) */}
          <motion.div
            drag={isPastGW ? false : 'x'}
            dragConstraints={{ left: 0, right: 80 }}
            dragElastic={0.25}
            onDragEnd={handleDragEnd}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            style={{ touchAction: 'none', willChange: 'transform' }}
            className="h-full w-11 min-w-[44px] flex items-center justify-center cursor-ew-resize active:cursor-grabbing hover:bg-white/10 rounded-r-2xl transition-colors touch-none"
            title="Drag right or tap to slide out chips"
          >
            {/* The Physical "|" Handle Pill */}
            <span
              className={`w-1.5 h-5 rounded-full transition-colors pointer-events-none shadow-xs ${
                currentTheme ? currentTheme.handle : 'bg-zinc-400/90 group-hover:bg-zinc-200'
              }`}
            />
          </motion.div>
        </div>
      ) : (
        /* ======================================================== */
        /* EXPANDED STATE: All 3 Chips Visible + Draggable "|" Handle */
        /* ======================================================== */
        <motion.div
          layout
          transition={SPRING_CONFIG}
          style={{ willChange: 'transform' }}
          className="h-full flex items-center px-1.5 gap-1 sm:gap-1.5 will-change-transform"
        >
          {CHIP_ITEMS.map((item) => {
            const isChosen = activeChip === item.id;
            const theme = CHIP_THEMES[item.id];
            const isUsed = Boolean(
              squad.gameweekChips &&
                Object.entries(squad.gameweekChips).some(
                  ([gwStr, c]) => Number(gwStr) < selectedGW && c === item.id
                )
            );
            const isDisabled = isPastGW || isSquadLocked || isUsed;
            const IconComponent = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                disabled={isDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectChip(item.id);
                }}
                className={`h-7 sm:h-7.5 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
                  isChosen
                    ? `${theme.bg} ${theme.border} ${theme.text} border shadow-xs font-black ring-1 ring-white/20`
                    : isDisabled
                    ? 'text-zinc-600 line-through opacity-45 cursor-not-allowed bg-black/20'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer'
                }`}
                title={
                  isUsed
                    ? `${item.label} (Already used)`
                    : isChosen
                    ? `${item.label} (Active - Tap to toggle off)`
                    : `Activate ${item.label}`
                }
              >
                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
                {isChosen && (
                  <span className={`w-1 h-1 rounded-full ${theme.handle} animate-pulse shrink-0`} />
                )}
              </button>
            );
          })}

          {/* Right Handle: Tap or drag left to collapse back */}
          <motion.div
            drag={isPastGW ? false : 'x'}
            dragConstraints={{ left: -80, right: 0 }}
            dragElastic={0.25}
            onDragEnd={handleDragEnd}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            style={{ touchAction: 'none', willChange: 'transform' }}
            className="h-full w-10 min-w-[40px] flex items-center justify-center cursor-ew-resize active:cursor-grabbing hover:bg-white/10 rounded-r-2xl transition-colors touch-none ml-0.5"
            title="Drag left or tap to slide in"
          >
            <span
              className={`w-1.5 h-5 rounded-full transition-colors pointer-events-none shadow-xs ${
                currentTheme ? currentTheme.handle : 'bg-zinc-400/90'
              }`}
            />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
