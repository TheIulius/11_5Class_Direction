import React, { useState } from 'react';
import { PlayerCard } from './PlayerCard';
import { useFPL } from '../../context/FPLContext';
import { ArrowLeft, ArrowRight, ChevronUp, Users } from 'lucide-react';
import { TripleCaptainIcon, BenchBoostIcon, WildcardIcon } from '../icons/ChipIcons';
import { ChipType } from '../../types/fpl';
import { triggerHaptic } from '../../utils/haptics';
import { motion, PanInfo } from 'framer-motion';

interface SubstitutesDrawerProps {
  layout: any;
  benchSlots: number[];
  onCardClick: (id: string) => void;
  showPoints: boolean;
  activeCalculation: any;
  selectedGW: number;
  readOnly: boolean;
  isPrimaryExpanded?: boolean;
  setIsPrimaryExpanded?: React.Dispatch<React.SetStateAction<boolean>>;
}

const PRI_HEIGHT = 400; // Fixed physical height of primary sheet (px)
const PRI_HEADER = 52;  // Visible header height in peek state (px)
const PRI_PEEK_Y = PRI_HEIGHT - PRI_HEADER; // ~348px offset in peek state

const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 40,
  mass: 0.8,
};

export const SubstitutesDrawer: React.FC<SubstitutesDrawerProps> = ({
  layout,
  benchSlots,
  onCardClick,
  showPoints,
  activeCalculation,
  selectedGW,
  readOnly,
  isPrimaryExpanded: externalPrimary,
  setIsPrimaryExpanded: setExternalPrimary,
}) => {
  const {
    isSquadLocked,
    reorderBenchPlayer,
    setActiveTab,
    squad,
    activateChip,
    teamValue,
  } = useFPL();

  const [internalPrimary, setInternalPrimary] = useState(false);
  const isPrimaryExpanded = externalPrimary ?? internalPrimary;
  const setIsPrimaryExpanded = setExternalPrimary ?? setInternalPrimary;

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

  const togglePrimary = () => {
    triggerHaptic('light');
    setIsPrimaryExpanded((prev) => !prev);
  };

  const handlePrimaryDragEnd = (_: any, info: PanInfo) => {
    if (info.velocity.y < -250 || info.offset.y < -50) {
      triggerHaptic('light');
      setIsPrimaryExpanded(true);
    } else if (info.velocity.y > 250 || info.offset.y > 50) {
      triggerHaptic('light');
      setIsPrimaryExpanded(false);
    }
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. DESKTOP VIEW: Tactical Bench Dock under Pitch         */}
      {/* ======================================================== */}
      <div className="hidden lg:block w-full mt-3 p-3.5 rounded-2xl bg-white/80 dark:bg-[#070b12]/90 border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Substitutes Bench ({layout.bench.length}/3)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <span>Bank: <strong className="text-slate-700 dark:text-slate-300 font-bold">£{squad.bank.toFixed(1)}m</strong></span>
              <span className="text-slate-300 dark:text-white/15">•</span>
              <span>Val: <strong className="text-slate-700 dark:text-slate-300 font-bold">£{teamValue.toFixed(1)}m</strong></span>
            </div>
            <span className="text-slate-300 dark:text-white/15">•</span>
            <span className="text-[10px] font-mono text-slate-400">
              Auto-Sub Priority: Sub 1 enters first
            </span>
          </div>
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
                          : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
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
                <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 font-mono uppercase">
                  {readOnly ? 'Empty' : '+ Add Player'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MOBILE VIEW: iOS Hardware-Accelerated Sliding Sheet    */}
      {/* ======================================================== */}
      <div className="lg:hidden pointer-events-none">
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: PRI_PEEK_Y }}
          dragElastic={{ top: 0.05, bottom: 0.25 }}
          onDragEnd={handlePrimaryDragEnd}
          animate={{
            y: isPrimaryExpanded ? 0 : PRI_PEEK_Y,
          }}
          transition={SPRING_CONFIG}
          style={{ willChange: 'transform' }}
          className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] inset-x-0 w-full z-40 h-[400px] rounded-t-[28px] bg-[#0c1117]/95 dark:bg-[#070b12]/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden select-none pointer-events-auto"
        >
          {/* Header Handle Bar with touch-action: none */}
          <div
            onClick={togglePrimary}
            className="w-full pt-2 pb-1.5 px-4 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none select-none"
            style={{ touchAction: 'none' }}
          >
            {/* iOS Drag Handle Capsule */}
            <div
              className="w-12 h-1 rounded-full bg-slate-300/60 dark:bg-white/25 mx-auto mb-2 pointer-events-none touch-none"
              style={{ touchAction: 'none' }}
            />

            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  SUBSTITUTES
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  ({layout.bench.length}/3)
                </span>
              </div>

              {/* Really subtle Bank & Value Details */}
              <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                <span>Bank <strong className="text-slate-700 dark:text-slate-300 font-bold">£{squad.bank.toFixed(1)}m</strong></span>
                <span className="text-slate-300 dark:text-white/15">•</span>
                <span>Val <strong className="text-slate-700 dark:text-slate-300 font-bold">£{teamValue.toFixed(1)}m</strong></span>
              </div>

              <div className="flex items-center gap-1 text-slate-400 text-xs shrink-0">
                <motion.div
                  animate={{ rotate: isPrimaryExpanded ? 180 : 0 }}
                  transition={SPRING_CONFIG}
                >
                  <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Fixed Height Content for Primary Tier (Zero Layout Reflow / Stretch) */}
          <div className="flex-1 px-3 pb-3 pt-1 space-y-3 overflow-y-auto overscroll-contain">
            {/* Substitutes 3-Card Row */}
            <div className="grid grid-cols-3 gap-2">
              {benchSlots.map((order) => {
                const sp = layout.bench.find((b: any) => b.benchOrder === order) || layout.bench[order - 1];
                if (sp) {
                  return (
                    <div key={sp.playerId} className="flex flex-col items-center w-full">
                      <div className="w-full flex items-center justify-between mb-1 px-1">
                        <span
                          className={`text-[8.5px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                            order === 1
                              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-700 dark:border-white/20'
                              : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                          }`}
                        >
                          {order === 1 ? '1st' : order === 2 ? '2nd' : '3rd'}
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
                                title={`Promote`}
                                className="p-0.5 rounded bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 transition-all active:scale-90 cursor-pointer"
                              >
                                <ArrowLeft className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {order < layout.bench.length && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerHaptic('light');
                                  reorderBenchPlayer(sp.playerId, order + 1);
                                }}
                                title={`Demote`}
                                className="p-0.5 rounded bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 transition-all active:scale-90 cursor-pointer"
                              >
                                <ArrowRight className="w-2.5 h-2.5" />
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
                    key={`mobile-empty-sub-${order}`}
                    onClick={() => {
                      if (!readOnly) setActiveTab('transfers');
                    }}
                    className="w-full p-2.5 rounded-2xl border border-dashed border-slate-300/80 dark:border-white/15 bg-white/50 dark:bg-white/[0.01] text-slate-400 flex flex-col items-center justify-center min-h-[92px] cursor-pointer"
                  >
                    <span className="text-[10px] font-bold">Sub {order}</span>
                    <span className="text-[8.5px] text-slate-500 uppercase mt-0.5">+ Add</span>
                  </div>
                );
              })}
            </div>

            {/* Available Chips Section */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between px-0.5 text-slate-400">
                <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  AVAILABLE CHIPS
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
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
                      className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all active:scale-95 cursor-pointer select-none ${
                        isActive
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-sm'
                          : isDisabled
                          ? 'bg-slate-100/60 dark:bg-white/[0.01] border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-slate-600 opacity-40 cursor-not-allowed'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-white'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400 dark:text-amber-500' : 'text-slate-400 dark:text-slate-300'}`} />
                      <span className="text-[9px] font-black uppercase tracking-tight text-center leading-tight truncate w-full">
                        {chip.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};
