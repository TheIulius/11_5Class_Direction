import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useFPL } from '../../context/FPLContext';
import { ChipType } from '../../types/fpl';
import { triggerHaptic } from '../../utils/haptics';

interface InlineChipSelectorProps {
  selectedGW: number;
  isPastGW?: boolean;
}

const CHIP_CONFIG: Record<ChipType, { label: string }> = {
  triple_captain: { label: 'Triple Captain' },
  bench_boost: { label: 'Bench Boost' },
  wildcard: { label: 'Wildcard' },
};

const DEFAULT_ORDER: ChipType[] = ['triple_captain', 'bench_boost', 'wildcard'];

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
    }, 240);
  };

  return (
    <motion.div
      ref={containerRef}
      layout
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="relative flex items-center h-9 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-full shadow-xs select-none"
    >
      {!isExpanded ? (
        /* Collapsed Default & Active States */
        <motion.button
          layout
          type="button"
          disabled={isPastGW}
          onClick={() => {
            if (isPastGW) return;
            triggerHaptic('light');
            setIsExpanded(true);
          }}
          className={`h-full px-3 flex items-center gap-1.5 rounded-full transition-all ${
            isPastGW ? 'cursor-default' : 'cursor-pointer active:scale-95'
          }`}
        >
          <span
            className={`text-xs font-bold whitespace-nowrap tracking-tight ${
              activeChip
                ? 'text-blue-600 dark:text-sky-400'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {activeChip ? CHIP_CONFIG[activeChip]?.label : 'Chips'}
          </span>
          {/* iOS Vertical Pill Indicator */}
          <span className="w-[2px] h-[14px] bg-slate-400/50 dark:bg-slate-500/50 rounded-full shrink-0" />
        </motion.button>
      ) : (
        /* Expanded Revealing All 3 Chips with Morphing Physics */
        <motion.div layout className="flex items-center px-1.5 gap-0.5 sm:gap-1">
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
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 active:scale-95 ${
                  index === 0 && isChosen
                    ? 'text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-sky-500/10'
                    : isChosen
                    ? 'text-blue-600 dark:text-sky-400'
                    : isDisabled
                    ? 'text-slate-400/40 dark:text-slate-600 line-through cursor-not-allowed'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer'
                }`}
              >
                <span>{CHIP_CONFIG[chipId].label}</span>
              </motion.button>
            );
          })}

          {/* iOS Vertical Pill Separator / Collapse Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              setIsExpanded(false);
            }}
            className="h-full px-1.5 flex items-center justify-center cursor-pointer hover:opacity-80 active:scale-90 transition-all"
            title="Collapse"
          >
            <span className="w-[2px] h-[14px] bg-slate-400/50 dark:bg-slate-500/50 rounded-full shrink-0" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};
