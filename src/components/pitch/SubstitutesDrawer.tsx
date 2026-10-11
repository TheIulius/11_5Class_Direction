import React from 'react';
import { PlayerCard } from './PlayerCard';
import { useFPL } from '../../context/FPLContext';
import { ArrowLeft, ArrowRight, ChevronUp, ChevronDown, Users, ArrowRightLeft, Sparkles } from 'lucide-react';
import { TripleCaptainIcon, BenchBoostIcon, WildcardIcon } from '../icons/ChipIcons';
import { ChipType } from '../../types/fpl';
import { triggerHaptic } from '../../utils/haptics';
import { useDrawerState } from '../../hooks/useDrawerState';
import { motion, AnimatePresence } from 'framer-motion';

interface SubstitutesDrawerProps {
  layout: any;
  benchSlots: number[];
  onCardClick: (id: string) => void;
  showPoints: boolean;
  activeCalculation: any;
  selectedGW: number;
  readOnly: boolean;
}

export const SubstitutesDrawer: React.FC<SubstitutesDrawerProps> = ({
  layout,
  benchSlots,
  onCardClick,
  showPoints,
  activeCalculation,
  selectedGW,
  readOnly,
}) => {
  const {
    isSquadLocked,
    reorderBenchPlayer,
    setActiveTab,
    players,
    squad,
    activateChip,
    freeTransfersRemaining,
    teamValue,
  } = useFPL();

  const {
    isPrimaryExpanded,
    isSecondaryExpanded,
    isChipsExpanded,
    togglePrimary,
    toggleSecondary,
    toggleChips,
  } = useDrawerState(true);

  const chips: { id: ChipType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'triple_captain', label: 'TRIPLE CAPTAIN', icon: TripleCaptainIcon },
    { id: 'bench_boost', label: 'BENCH BOOST', icon: BenchBoostIcon },
    { id: 'wildcard', label: 'WILDCARD', icon: WildcardIcon },
  ];

  const handleChipClick = (chipId: ChipType) => {
    if (readOnly || isSquadLocked) return;
    triggerHaptic('medium');
    activateChip(chipId);
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. DESKTOP VIEW: Tactical Bench Dock under Pitch         */}
      {/* ======================================================== */}
      <div className="hidden lg:block w-full mt-3 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] backdrop-blur-xl shadow-xs">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              Substitutes Bench ({layout.bench.length}/3)
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Auto-Sub Priority: Sub 1 enters first
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {benchSlots.map((order) => {
            const sp = layout.bench.find((b: any) => b.benchOrder === order) || layout.bench[order - 1];
            if (sp) {
              return (
                <div key={sp.playerId} className="flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-1.5 px-1">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${
                        order === 1
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-700 dark:border-white/20'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {order === 1 ? '1st Sub' : order === 2 ? '2nd Sub' : '3rd Sub'}
                    </span>

                    {!isSquadLocked && !readOnly && layout.bench.length > 1 && (
                      <div className="flex items-center gap-1">
                        {order > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('light');
                              reorderBenchPlayer(sp.playerId, order - 1);
                            }}
                            title={`Promote to Sub ${order - 1}`}
                            className="p-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 transition-all active:scale-90 cursor-pointer"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        )}
                        {order < layout.bench.length && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('light');
                              reorderBenchPlayer(sp.playerId, order + 1);
                            }}
                            title={`Demote to Sub ${order + 1}`}
                            className="p-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 transition-all active:scale-90 cursor-pointer"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <PlayerCard
                    playerId={sp.playerId}
                    isStarter={false}
                    benchOrder={order}
                    isCaptain={sp.isCaptain}
                    isViceCaptain={sp.isViceCaptain}
                    onCardClick={onCardClick}
                    showPoints={showPoints}
                    customCalculation={activeCalculation}
                    selectedGW={selectedGW}
                    readOnly={readOnly}
                  />
                </div>
              );
            }

            return (
              <div
                key={`empty-bench-${order}`}
                onClick={() => {
                  if (!readOnly) setActiveTab('transfers');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-slate-300/80 dark:border-white/15 bg-white/50 dark:bg-white/[0.01] text-slate-400 transition-all min-h-[90px] ${
                  readOnly ? 'cursor-default opacity-50' : 'hover:border-slate-400 cursor-pointer active:scale-95'
                }`}
              >
                <span className="text-[10px] font-bold">Sub {order}</span>
                <span className="text-[9px] text-slate-500 dark:text-zinc-400 mt-1 font-mono uppercase">
                  {readOnly ? 'Empty' : '+ Add Player'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MOBILE VIEW: iOS Stacked Sliding Bottom Sheets        */}
      {/* ======================================================== */}
      <div className="lg:hidden sticky bottom-[calc(3.8rem+env(safe-area-inset-bottom))] z-30 w-full px-2 mt-2 select-none">
        <div className="relative w-full flex flex-col">
          {/* ---------------------------------------------------- */}
          {/* TIER 1 (Behind / Upper): CHIPS & TRANSFERS Drawer    */}
          {/* ---------------------------------------------------- */}
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="w-full rounded-t-[26px] bg-[#121822]/95 backdrop-blur-2xl border-t border-x border-white/10 shadow-lg overflow-hidden"
          >
            {/* Header Handle Bar */}
            <div
              onClick={toggleSecondary}
              className="w-full pt-1.5 pb-2 px-4 flex flex-col items-center cursor-pointer active:opacity-80 transition-opacity"
            >
              {/* iOS Drag Handle */}
              <div className="w-10 h-1 rounded-full bg-white/20 mb-1" />
              <div className="flex items-center justify-between w-full">
                <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-300">
                  CHIPS & TRANSFERS
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {isSecondaryExpanded ? 'Tap to minimize' : 'FT: ' + freeTransfersRemaining}
                </span>
              </div>
            </div>

            {/* Expanded Content for Secondary Tier */}
            <AnimatePresence>
              {isSecondaryExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 22 }}
                  className="px-3 pb-3 pt-1 space-y-2.5 border-t border-white/5"
                >
                  {/* Transfer Quick Portal */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Transfer Budget
                      </div>
                      <div className="text-xs font-mono font-bold text-white">
                        Bank: £{squad.bank.toFixed(1)}m • Value: £{teamValue.toFixed(1)}m
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('medium');
                        setActiveTab('transfers');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[11px] font-bold border border-white/10 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Transfers ({freeTransfersRemaining} FT)</span>
                    </button>
                  </div>

                  {/* Active Chip Details */}
                  {squad.activeChip && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Active Chip: {squad.activeChip.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded">
                        LOCKED FOR GW {selectedGW}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ---------------------------------------------------- */}
          {/* TIER 2 (Foreground / Lower): SUBSTITUTES & CHIPS     */}
          {/* ---------------------------------------------------- */}
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="w-full rounded-t-[26px] bg-[#17202c]/95 backdrop-blur-2xl border-t border-x border-white/10 shadow-2xl overflow-hidden -mt-1 z-10"
          >
            {/* Header Handle & Title */}
            <div
              onClick={togglePrimary}
              className="w-full pt-1.5 pb-2 px-3 flex flex-col items-center cursor-pointer active:opacity-80 transition-opacity"
            >
              {/* iOS Drag Handle */}
              <div className="w-10 h-1 rounded-full bg-white/20 mb-1" />

              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight text-white uppercase">
                    SUBSTITUTES
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    ({layout.bench.length}/3) & CHIPS
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  {isPrimaryExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-300" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-300" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Primary Drawer Content */}
            <AnimatePresence>
              {isPrimaryExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 22 }}
                  className="px-2.5 pb-2.5 space-y-2.5"
                >
                  {/* Substitutes 3-Card Row */}
                  <div className="grid grid-cols-3 gap-2">
                    {benchSlots.map((order) => {
                      const sp = layout.bench.find((b: any) => b.benchOrder === order) || layout.bench[order - 1];
                      if (sp) {
                        return (
                          <div key={sp.playerId} className="flex flex-col items-center w-full">
                            <PlayerCard
                              playerId={sp.playerId}
                              isStarter={false}
                              benchOrder={order}
                              isCaptain={sp.isCaptain}
                              isViceCaptain={sp.isViceCaptain}
                              onCardClick={onCardClick}
                              showPoints={showPoints}
                              customCalculation={activeCalculation}
                              selectedGW={selectedGW}
                              readOnly={readOnly}
                            />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`mobile-empty-sub-${order}`}
                          onClick={() => {
                            if (!readOnly) setActiveTab('transfers');
                          }}
                          className="w-full p-2.5 rounded-2xl border border-dashed border-white/15 bg-white/[0.01] text-slate-400 flex flex-col items-center justify-center min-h-[92px] cursor-pointer"
                        >
                          <span className="text-[10px] font-bold">Sub {order}</span>
                          <span className="text-[8.5px] text-slate-500 uppercase mt-0.5">+ Add</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Available Chips Section */}
                  <div className="pt-1 border-t border-white/5 space-y-1.5">
                    <div
                      onClick={toggleChips}
                      className="flex items-center justify-between px-0.5 cursor-pointer text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        AVAILABLE CHIPS
                      </span>
                      {isChipsExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <AnimatePresence>
                      {isChipsExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                        >
                          {chips.map((chip) => {
                            const Icon = chip.icon;
                            const isActive = squad.activeChip === chip.id;
                            const isUsed = Boolean(
                              squad.usedChips?.[chip.id] ||
                              (squad.gameweekChips && Object.values(squad.gameweekChips).includes(chip.id))
                            );
                            const isDisabled = isSquadLocked || isUsed || readOnly;

                            return (
                              <button
                                key={chip.id}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => handleChipClick(chip.id)}
                                className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer select-none ${
                                  isActive
                                    ? 'bg-white/15 border-white/30 text-white shadow-sm ring-1 ring-white/20'
                                    : isDisabled
                                    ? 'bg-white/[0.01] border-white/5 text-slate-600 opacity-40 cursor-not-allowed'
                                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white'
                                }`}
                              >
                                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-300'}`} />
                                <span className="text-[10px] font-black uppercase tracking-tight truncate">
                                  {chip.label}
                                </span>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>
  );
};
