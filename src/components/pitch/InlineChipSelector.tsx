import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
    }, 240);
  };

  return (
    <motion.div
      ref={containerRef}
      layout
      transition={SPRING_CONFIG}
      style={{ willChange: 'transform' }}
      className="relative flex items-center h-9 bg-black border border-white/10 rounded-2xl shadow-xs select-none will-change-transform overflow-hidden"
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
          transition={SPRING_CONFIG}
          style={{ willChange: 'transform' }}
          className={`h-full px-3.5 flex items-center gap-2 rounded-2xl transition-colors will-change-transform ${
            isPastGW ? 'cursor-default' : 'cursor-pointer active:scale-95'
          }`}
        >
          <span className="text-xs font-bold whitespace-nowrap tracking-tight flex items-center gap-1.5">
            {activeChip ? (
              <>
                <span className="text-xs shrink-0">{CHIP_CONFIG[activeChip]?.icon}</span>
                <span className="text-white font-black">{CHIP_CONFIG[activeChip]?.label}</span>
              </>
            ) : (
              <span className="text-zinc-400">Chips</span>
            )}
          </span>
          {/* iOS Vertical Separator */}
          <span className="text-zinc-700 font-semibold text-xs select-none leading-none">|</span>
        </motion.button>
      ) : (
        /* Expanded Revealing All 3 Chips with Morphing Physics */
        <motion.div
          layout
          transition={SPRING_CONFIG}
          style={{ willChange: 'transform' }}
          className="flex items-center p-1 gap-1.5 will-change-transform"
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
                className={`rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-95 will-change-transform ${
                  index === 0 && isChosen
                    ? 'px-4 py-1.5 bg-zinc-800 text-white border border-white/10 shadow-sm'
                    : isChosen
                    ? 'px-3 py-1.5 bg-zinc-800/80 text-white border border-white/10'
                    : isDisabled
                    ? 'px-2.5 py-1.5 text-zinc-600 line-through cursor-not-allowed'
                    : 'px-2.5 py-1.5 text-zinc-500 hover:text-zinc-300 cursor-pointer'
                }`}
              >
                <span className="text-xs shrink-0">{CHIP_CONFIG[chipId].icon}</span>
                <span>{CHIP_CONFIG[chipId].label}</span>
              </motion.button>
            );
          })}

          {/* iOS Vertical Separator / Collapse Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              setIsExpanded(false);
            }}
            className="h-full px-2 flex items-center justify-center cursor-pointer hover:text-zinc-400 active:scale-90 transition-all text-zinc-700 font-semibold text-xs leading-none select-none"
            title="Collapse"
          >
            <span>|</span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};
