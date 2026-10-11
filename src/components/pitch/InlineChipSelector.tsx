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
      squad.usedChips?.[chipId] ||
      (squad.gameweekChips &&
        Object.values(squad.gameweekChips).includes(chipId) &&
        squad.gameweekChips[selectedGW] !== chipId)
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
    if (info.offset.x > 20 || info.velocity.x > 120) {
      triggerHaptic('light');
      setIsExpanded(true);
    }
  };

  const handleDragEndExpanded = (_: any, info: PanInfo) => {
    if (info.offset.x < -20 || info.velocity.x < -120) {
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
      className="relative flex items-center h-7 sm:h-7.5 bg-black/60 dark:bg-black/75 backdrop-blur-md border border-white/10 rounded-xl shadow-xs select-none will-change-transform overflow-hidden"
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
            className={`h-full pl-2.5 pr-1 flex items-center gap-1.5 transition-colors ${
              isPastGW ? 'cursor-default' : 'cursor-pointer active:scale-95'
            }`}
          >
            <span className="text-[11px] font-bold whitespace-nowrap tracking-tight flex items-center gap-1">
              {activeChip ? (
                <>
                  <span className="text-xs shrink-0">{CHIP_CONFIG[activeChip]?.icon}</span>
                  <span className="text-white font-black">{CHIP_CONFIG[activeChip]?.label}</span>
                </>
              ) : (
                <span className="text-zinc-400">Chips</span>
              )}
            </span>
          </button>

          {/* Draggable & Clickable iOS "|" Line Handle */}
          <motion.div
            drag={isPastGW ? false : 'x'}
            dragConstraints={{ left: 0, right: 50 }}
            dragElastic={0.2}
            onDragEnd={handleDragEndCollapsed}
            onClick={() => {
              if (isPastGW) return;
              triggerHaptic('light');
              setIsExpanded(true);
            }}
            style={{ touchAction: 'none', willChange: 'transform' }}
            className="h-full px-1.5 flex items-center justify-center cursor-ew-resize active:cursor-grabbing hover:bg-white/5 transition-colors touch-none"
            title="Drag or tap to expand chips"
          >
            <span className="w-[2.5px] h-3.5 rounded-full bg-zinc-500/80 group-hover:bg-zinc-300 pointer-events-none" />
          </motion.div>
        </div>
      ) : (
        /* Expanded State: All 3 Chips + Draggable "|" Handle to Collapse */
        <motion.div
          layout
          transition={SPRING_CONFIG}
          style={{ willChange: 'transform' }}
          className="flex items-center px-1 gap-1 will-change-transform"
        >
          {chipOrder.map((chipId, index) => {
            const isChosen = activeChip === chipId;
            const isUsed = Boolean(
              squad.usedChips?.[chipId] ||
              (squad.gameweekChips &&
                Object.values(squad.gameweekChips).includes(chipId) &&
                squad.gameweekChips[selectedGW] !== chipId)
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
                className={`rounded-lg text-[10.5px] font-bold transition-all whitespace-nowrap flex items-center gap-1 active:scale-95 will-change-transform ${
                  index === 0 && isChosen
                    ? 'px-2.5 py-1 bg-zinc-800 text-white border border-white/10 shadow-xs'
                    : isChosen
                    ? 'px-2 py-1 bg-zinc-800/80 text-white border border-white/10'
                    : isDisabled
                    ? 'px-2 py-1 text-zinc-600 line-through cursor-not-allowed'
                    : 'px-2 py-1 text-zinc-400 hover:text-zinc-200 cursor-pointer'
                }`}
              >
                <span className="text-[11px] shrink-0">{CHIP_CONFIG[chipId].icon}</span>
                <span>{CHIP_CONFIG[chipId].label}</span>
              </motion.button>
            );
          })}

          {/* Draggable & Clickable iOS "|" Line Handle to Collapse */}
          <motion.div
            drag="x"
            dragConstraints={{ left: -50, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEndExpanded}
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              setIsExpanded(false);
            }}
            style={{ touchAction: 'none', willChange: 'transform' }}
            className="h-full px-1.5 flex items-center justify-center cursor-ew-resize active:cursor-grabbing hover:bg-white/5 transition-colors touch-none"
            title="Drag or tap to collapse chips"
          >
            <span className="w-[2.5px] h-3.5 rounded-full bg-zinc-500/80 hover:bg-zinc-300 pointer-events-none" />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
