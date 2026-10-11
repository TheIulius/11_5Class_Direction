import React, { useState, useEffect, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { useFPL } from '../../context/FPLContext';
import { ChipType } from '../../types/fpl';
import { triggerHaptic } from '../../utils/haptics';

interface InlineChipSelectorProps {
  selectedGW: number;
  isPastGW?: boolean;
}

const CHIP_CONFIG: Record<ChipType, { label: string; icon: string }> = {
  triple_captain: { label: 'Triple Captain', icon: '🏆' },
  bench_boost: { label: 'Bench Boost', icon: '🛡️' },
  wildcard: { label: 'Wildcard', icon: '🃏' },
};

const CHIP_THEMES: Record<ChipType, { border: string; bg: string; text: string; glow: string; handle: string; badge: string }> = {
  triple_captain: {
    border: 'border-amber-400/70 dark:border-amber-400/80',
    bg: 'bg-gradient-to-r from-amber-950/90 via-black/85 to-amber-950/90',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_18px_rgba(251,191,36,0.35)]',
    handle: 'bg-amber-400',
    badge: 'bg-amber-500/25 border-amber-400/50 text-amber-200',
  },
  bench_boost: {
    border: 'border-emerald-400/70 dark:border-emerald-400/80',
    bg: 'bg-gradient-to-r from-emerald-950/90 via-black/85 to-emerald-950/90',
    text: 'text-emerald-300',
    glow: 'shadow-[0_0_18px_rgba(52,211,153,0.35)]',
    handle: 'bg-emerald-400',
    badge: 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200',
  },
  wildcard: {
    border: 'border-purple-400/70 dark:border-purple-400/80',
    bg: 'bg-gradient-to-r from-purple-950/90 via-black/85 to-purple-950/90',
    text: 'text-purple-300',
    glow: 'shadow-[0_0_18px_rgba(192,132,252,0.35)]',
    handle: 'bg-purple-400',
    badge: 'bg-purple-500/25 border-purple-400/50 text-purple-200',
  },
};

const DEFAULT_ORDER: ChipType[] = ['triple_captain', 'bench_boost', 'wildcard'];

// Authentic iOS spring physics from @ios-fluid-gesturesSKILL
const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 40,
  mass: 0.8,
};

export const InlineChipSelector: React.FC<InlineChipSelectorProps> = ({
  selectedGW,
  isPastGW = false,
}) => {
  const { squad, activateChip, isSquadLocked } = useFPL();
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeChip: ChipType | null = isPastGW
    ? squad.gameweekChips?.[selectedGW] || null
    : squad.activeChip;

  const currentTheme = activeChip ? CHIP_THEMES[activeChip] : null;

  const [chipOrder, setChipOrder] = useState<ChipType[]>(() => {
    if (activeChip) {
      return [activeChip, ...DEFAULT_ORDER.filter((id) => id !== activeChip)];
    }
    return DEFAULT_ORDER;
  });

  // Reorder chips array in state so the chosen chip stays at index 0
  useEffect(() => {
    if (activeChip) {
      setChipOrder((prev) => [activeChip, ...prev.filter((id) => id !== activeChip)]);
    }
  }, [activeChip]);

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

  const handleChipClick = (chipId: ChipType) => {
    if (isPastGW || isSquadLocked) return;

    const isAlreadyUsed = Boolean(
      squad.gameweekChips &&
        Object.entries(squad.gameweekChips).some(
          ([gwStr, c]) => Number(gwStr) < selectedGW && c === chipId
        )
    );
    if (isAlreadyUsed) {
      triggerHaptic('warning');
      return;
    }

    triggerHaptic('medium');

    // 1. Reorder chips array in state so chosen chip moves to index 0
    setChipOrder((prev) => [chipId, ...prev.filter((id) => id !== chipId)]);

    // 2. Activate or toggle off chip in context
    activateChip(chipId);

    // 3. Smoothly collapse after physical spring animation
    setTimeout(() => {
      setIsExpanded(false);
    }, 200);
  };

  // Horizontal drag gesture on the "|" line handle to expand or collapse
  const handleDragEndCollapsed = (_: any, info: PanInfo) => {
    if (isPastGW) return;
    if (info.offset.x > 20 || info.velocity.x > 100) {
      triggerHaptic('light');
      setIsExpanded(true);
    }
  };

  const handleDragEndExpanded = (_: any, info: PanInfo) => {
    if (info.offset.x < -20 || info.velocity.x < -100) {
      triggerHaptic('light');
      setIsExpanded(false);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      layout
      transition={SPRING_CONFIG}
      style={{ willChange: 'transform' }}
      className={`relative flex items-center h-8.5 sm:h-9 backdrop-blur-md rounded-2xl shadow-xs select-none will-change-transform overflow-hidden border transition-all duration-300 ${
        currentTheme
          ? `${currentTheme.bg} ${currentTheme.border} ${currentTheme.glow}`
          : 'bg-black/70 border-white/15 text-white'
      }`}
    >
      {!isExpanded ? (
        /* Collapsed State: [ Chip Icon + Name ] + [ Draggable "|" Handle ] */
        <div className="h-full flex items-center">
          <button
            type="button"
            disabled={isPastGW}
            onClick={() => {
              if (isPastGW) return;
              triggerHaptic('light');
              setIsExpanded(true);
            }}
            className={`h-full pl-3 pr-1.5 flex items-center gap-2 transition-colors ${
              isPastGW ? 'cursor-default' : 'cursor-pointer active:scale-95'
            }`}
          >
            <span className="text-xs sm:text-[12.5px] font-bold whitespace-nowrap tracking-tight flex items-center gap-1.5">
              {activeChip ? (
                <>
                  <span className="text-sm shrink-0">{CHIP_CONFIG[activeChip]?.icon}</span>
                  <span className={`font-black ${currentTheme?.text || 'text-white'}`}>
                    {CHIP_CONFIG[activeChip]?.label}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
                </>
              ) : (
                <span className="text-zinc-400">Chips</span>
              )}
            </span>
          </button>

          {/* Draggable & Clickable iOS "|" Line Handle (Larger touch area) */}
          <motion.div
            drag={isPastGW ? false : 'x'}
            dragConstraints={{ left: 0, right: 60 }}
            dragElastic={0.2}
            onDragEnd={handleDragEndCollapsed}
            onClick={() => {
              if (isPastGW) return;
              triggerHaptic('light');
              setIsExpanded(true);
            }}
            style={{ touchAction: 'none', willChange: 'transform' }}
            className="h-full px-2 sm:px-2.5 flex items-center justify-center cursor-ew-resize active:cursor-grabbing hover:bg-white/10 transition-colors touch-none"
            title="Drag right or tap to expand chips"
          >
            <span
              className={`w-[3px] h-4.5 rounded-full transition-colors pointer-events-none ${
                currentTheme?.handle || 'bg-zinc-400/80 group-hover:bg-zinc-200'
              }`}
            />
          </motion.div>
        </div>
      ) : (
        /* Expanded State: All 3 Chips + Draggable "|" Handle to Collapse */
        <motion.div
          layout
          transition={SPRING_CONFIG}
          style={{ willChange: 'transform' }}
          className="flex items-center px-1.5 gap-1.5 will-change-transform"
        >
          {chipOrder.map((chipId, index) => {
            const isChosen = activeChip === chipId;
            const theme = CHIP_THEMES[chipId];
            const isUsed = Boolean(
              squad.gameweekChips &&
                Object.entries(squad.gameweekChips).some(
                  ([gwStr, c]) => Number(gwStr) < selectedGW && c === chipId
                )
            );
            const isDisabled = isPastGW || isSquadLocked || isUsed;

            return (
              <motion.button
                layout
                key={chipId}
                type="button"
                disabled={isDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChipClick(chipId);
                }}
                transition={SPRING_CONFIG}
                style={{ willChange: 'transform' }}
                className={`rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-95 will-change-transform ${
                  index === 0 && isChosen
                    ? `px-3 py-1.5 ${theme.bg} ${theme.border} ${theme.text} border shadow-xs`
                    : isChosen
                    ? `px-2.5 py-1.5 ${theme.bg} ${theme.border} ${theme.text} border`
                    : isDisabled
                    ? 'px-2.5 py-1.5 text-zinc-600 line-through cursor-not-allowed'
                    : 'px-2.5 py-1.5 text-zinc-400 hover:text-zinc-200 cursor-pointer hover:bg-white/5'
                }`}
              >
                <span className="text-xs shrink-0">{CHIP_CONFIG[chipId].icon}</span>
                <span>{CHIP_CONFIG[chipId].label}</span>
              </motion.button>
            );
          })}

          {/* Draggable & Clickable iOS "|" Line Handle to Collapse */}
          <motion.div
            drag="x"
            dragConstraints={{ left: -60, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEndExpanded}
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              setIsExpanded(false);
            }}
            style={{ touchAction: 'none', willChange: 'transform' }}
            className="h-full px-2 sm:px-2.5 flex items-center justify-center cursor-ew-resize active:cursor-grabbing hover:bg-white/10 transition-colors touch-none"
            title="Drag left or tap to collapse chips"
          >
            <span
              className={`w-[3px] h-4.5 rounded-full pointer-events-none ${
                currentTheme?.handle || 'bg-zinc-400 hover:bg-zinc-200'
              }`}
            />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
