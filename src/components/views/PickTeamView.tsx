import React, { useState, useEffect, useMemo } from 'react';
import { useFPL } from '../../context/FPLContext';
import { PitchView } from '../pitch/PitchView';
import { PlayerCard } from '../pitch/PlayerCard';
import { PlayerActionSheet } from '../pitch/PlayerActionSheet';
import { getFormationLayout } from '../../engine/formations';
import { ChipType } from '../../types/fpl';
import { Zap, CheckCircle, Loader2, AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Lock, ArrowLeft, ArrowRight, Clock, Award } from 'lucide-react';
import { validateSquadComposition, calculateGameweekSquadPoints } from '../../engine/scoring';
import confetti from 'canvas-confetti';
import { TripleCaptainIcon, BenchBoostIcon, WildcardIcon } from '../icons/ChipIcons';
import { triggerHaptic } from '../../utils/haptics';

export const PickTeamView: React.FC = () => {
  const {
    squad,
    players,
    activateChip,
    teamValue,
    freeTransfersRemaining,
    saveSquad,
    setActiveTab,
    isSquadLocked,
    isReferee,
    isDemoMode,
    currentGW,
    reorderBenchPlayer,
    deadline,
    fixtures,
    calculationResult,
    leagues,
    currentManager,
    authUser,
  } = useFPL();

  const userLeagueMember = leagues?.flatMap((l) => l.members).find(
    (m) => m.id === currentManager?.id || m.id === 'user' || (authUser && m.id === authUser.id)
  );
  const totalUserPoints = userLeagueMember ? userLeagueMember.totalPoints : (calculationResult.totalPoints || 0);
  const overallRank = userLeagueMember ? `#${userLeagueMember.rank}` : null;

  const [selectedGW, setSelectedGW] = useState<number>(currentGW);
  useEffect(() => {
    setSelectedGW(currentGW);
  }, [currentGW]);

  const isPastGW = selectedGW < currentGW;

  const activeSquadPlayers = useMemo(() => {
    if (!isPastGW) {
      return squad.players;
    }
    return (squad.gameweekSquads && squad.gameweekSquads[selectedGW] && squad.gameweekSquads[selectedGW].length > 0)
      ? squad.gameweekSquads[selectedGW]
      : [];
  }, [isPastGW, squad.players, squad.gameweekSquads, selectedGW]);

  const activeGWChip = useMemo(() => {
    if (!isPastGW) {
      return squad.activeChip;
    }
    return (squad.gameweekChips && squad.gameweekChips[selectedGW] !== undefined)
      ? squad.gameweekChips[selectedGW]
      : null;
  }, [isPastGW, squad.activeChip, squad.gameweekChips, selectedGW]);

  const activeCalculation = useMemo(() => {
    if (!isPastGW) {
      return calculationResult;
    }
    return calculateGameweekSquadPoints(
      activeSquadPlayers,
      players,
      selectedGW,
      activeGWChip,
      0,
      1,
      fixtures,
      true
    );
  }, [isPastGW, calculationResult, activeSquadPlayers, players, selectedGW, activeGWChip, fixtures]);

  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!deadline) {
      setTimeLeft('');
      return;
    }
    const updateCountdown = () => {
      const diff = new Date(deadline.deadlineTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Locked');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${mins}m`);
      } else {
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${mins}m ${secs}s`);
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const [activeSheetPlayerId, setActiveSheetPlayerId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const comp = validateSquadComposition(activeSquadPlayers, players);
  const [showCompDetails, setShowCompDetails] = useState<boolean>(!comp.isValid && activeSquadPlayers.length > 0);

  const layout = getFormationLayout(activeSquadPlayers, players);
  const benchSlots = [1, 2, 3];

  const chips: { id: ChipType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'triple_captain', label: 'Triple Captain', icon: TripleCaptainIcon },
    { id: 'bench_boost', label: 'Bench Boost', icon: BenchBoostIcon },
    { id: 'wildcard', label: 'Wildcard', icon: WildcardIcon },
  ];

  const handleSaveTeam = async () => {
    if (!comp.isValid) {
      setErrorMessage(comp.message || 'Squad incomplete: Need 1 GK, 3 DEF, 3 MID, 2 FWD!');
      setShowCompDetails(true);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await saveSquad(undefined, true);
      if (res.success) {
        triggerHaptic('success');
        setSaveSuccess(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#38bdf8', '#fbbf24'],
        });
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        triggerHaptic('warning');
        setErrorMessage(res.message || 'Failed to save lineup');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch (err: any) {
      triggerHaptic('warning');
      setErrorMessage(err?.message || 'Failed to save lineup to database');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = activeSquadPlayers.filter((sp) => Boolean(players[sp.playerId])).length;

  return (
    <div className="flex flex-col pb-24 md:pb-12 px-2 sm:px-4 md:px-6 pt-2 md:pt-4 max-w-4xl lg:max-w-5xl mx-auto w-full transition-colors duration-200">
      {/* ======================================================== */}
      {/* SECTION 1: UPPER CANVAS (Tactical Pitch & Quick Metrics) */}
      {/* ======================================================== */}
      <section className="flex flex-col space-y-2.5">
        {/* Tournament Brand Header - desktop only */}
        <div className="hidden md:flex flex-col items-center justify-center pt-1 pb-1">
          <img
            src="/kcl-logo.png"
            alt="Komarovi Champions League"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-white/10 shadow-md object-contain"
          />
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] text-slate-200">
              Komarovi Champions League
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/10">
              GW {currentGW}
            </span>
          </div>
        </div>

        {/* Trusted Referee Prompt Banner - desktop only (mobile has top header button & bottom nav Ref tab) */}
        {isReferee && (
          <div className="hidden md:flex p-3 md:p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-bold items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 flex-shrink-0 text-amber-400" />
              <div>
                <span className="font-black text-amber-300 mr-1.5 uppercase tracking-wide">
                  მსაჯის პანელი (Referee):
                </span>
                <span>თქვენ გაქვთ მატჩების შედეგების და სტატისტიკის შეყვანის უფლება.</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('dev')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shrink-0 cursor-pointer shadow-xs active:scale-95 ml-2 flex items-center gap-1"
            >
              <span>Match Console</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Lineup Locked Notification Banner */}
        {isSquadLocked && (
          <div className="p-2.5 md:p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>
                {isDemoMode
                  ? 'Demo Mode: Browsing sample squad. Sign in or register to pick and customize your own squad.'
                  : `Lineups are locked for Gameweek ${currentGW}. Team changes are prohibited.`}
              </span>
            </div>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
              {isDemoMode ? 'Demo' : 'Locked'}
            </span>
          </div>
        )}

        {/* Read-Only Archive Notification Banner for Past Gameweeks */}
        {isPastGW && (
          <div className="p-2.5 md:p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 flex-shrink-0 text-sky-400" />
              <span className="truncate">
                Viewing Gameweek {selectedGW} archive. Historical lineup and player scores are read-only.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedGW(currentGW)}
              className="px-2.5 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all shrink-0 cursor-pointer shadow-xs active:scale-95 ml-2 flex items-center gap-1"
            >
              <span>Jump to GW {currentGW}</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Notice for Past GW without Registered Lineup */}
        {isPastGW && activeSquadPlayers.length === 0 && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <div>
              <span className="font-extrabold text-amber-200">ამ ტურში შემადგენლობა არ გყავდათ დარეგისტრირებული (0 ქულა)</span>
              <span className="hidden sm:inline text-amber-300/80 font-normal ml-1">
                • No lineup was registered for Gameweek {selectedGW}.
              </span>
            </div>
          </div>
        )}

        {/* Mandatory Position Changes Banner for GW2 */}
        {!isPastGW && comp.hasPositionChangedPlayers && (
          <div className="p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-rose-500/20 via-amber-500/15 to-rose-500/20 backdrop-blur-xl border border-rose-500/40 shadow-md flex items-start gap-2.5 animate-pulse">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md mt-0.5">
              !
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  სავალდებულო ტრანსფერი (GW2)
                </span>
                <span className="text-[9.5px] px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold font-mono">
                  Mandatory Action
                </span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                თქვენს გუნდშია მოთამაშე(ები), რომელთაც ოფიციალურად შეეცვალათ პოზიცია:{' '}
                <strong className="text-rose-600 dark:text-rose-400 font-black">
                  {comp.positionChangedPlayers?.map((p) => `${p.name} (${p.oldPosition} → ${p.newPosition})`).join(', ')}
                </strong>
                . გუნდის შესანახად აუცილებელია მათი ჩანაცვლება ტრანსფერით. თითოეულზე მოგეცათ +1 უფასო ტრანსფერი!
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('transfers')}
                  className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <span>გადასვლა ტრანსფერებზე</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* UNIFIED LIQUID GLASS LINEUP CENTER CARD                 */}
        {/* ======================================================== */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-white/75 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/10 dark:ring-white/5 p-2 sm:p-3 overflow-hidden transition-all">
          {/* Subtle Specular Top Rim */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent pointer-events-none" />

          {/* Top Row: Stepper + Points & Chip Pills */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedGW((prev) => Math.max(1, prev - 1));
                }}
                disabled={selectedGW <= 1}
                aria-label="Previous Gameweek"
                className="p-1 sm:p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">
                  GW {selectedGW} Lineup
                </span>
                {selectedGW === currentGW ? (
                  <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                    Current
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 shrink-0">
                    Archive
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedGW((prev) => Math.min(currentGW, prev + 1));
                }}
                disabled={selectedGW >= currentGW}
                aria-label="Next Gameweek"
                className="p-1 sm:p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs" title="Gameweek Points">
                {activeCalculation.totalPoints} PTS
              </span>
              {overallRank && (
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-400/30 shadow-xs" title={`Rank: ${overallRank} (${totalUserPoints} total pts)`}>
                  {overallRank}
                </span>
              )}
              {activeGWChip && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-400/30 shadow-xs">
                  <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  <span className="hidden xs:inline">{activeGWChip.replace('_', ' ')}</span>
                  <span className="xs:hidden">{activeGWChip === 'triple_captain' ? 'TC' : activeGWChip === 'bench_boost' ? 'BB' : 'WC'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Bottom Row: Liquid Glass Stats Capsule Chips */}
          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between flex-wrap gap-1.5 text-xs font-mono">
            <div className="flex items-center flex-wrap gap-1 sm:gap-1.5">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">VAL</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-[11px]">£{teamValue.toFixed(1)}m</span>
              </div>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">BANK</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">£{squad.bank.toFixed(1)}m</span>
              </div>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/10 dark:bg-sky-500/10 border border-sky-500/20">
                <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">FT</span>
                <span className="font-bold text-sky-600 dark:text-cyan-400 text-[11px]">{freeTransfersRemaining}</span>
              </div>

              {deadline && (
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20"
                  title={`Deadline: ${new Date(deadline.deadlineTime).toLocaleString()}`}
                >
                  <Clock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                  <span className={`text-[10.5px] font-bold ${isSquadLocked ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {isSquadLocked ? 'Locked' : timeLeft}
                  </span>
                </div>
              )}
            </div>

            {/* Lineup Checklist Toggle */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowCompDetails((prev) => !prev);
              }}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ml-auto cursor-pointer ${
                comp.isValid
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {comp.isValid ? (
                <>
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] sm:text-[11px]">Lineup Ready</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                  <span className="text-[10px] sm:text-[11px]">Incomplete ({validCount}/9)</span>
                </>
              )}
              {showCompDetails ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>
          </div>

          {/* Collapsible Squad Composition Matrix (Internal to the same card) */}
          {showCompDetails && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-white/10 animate-fade-in space-y-2">
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className={`p-1.5 rounded-xl border text-xs ${comp.gkCount === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                  <span className="text-[9px] uppercase font-bold block text-slate-500 dark:text-slate-400">GK</span>
                  <span className="font-mono font-black text-xs">{comp.gkCount}/1</span>
                </div>
                <div className={`p-1.5 rounded-xl border text-xs ${comp.defCount === 3 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                  <span className="text-[9px] uppercase font-bold block text-slate-500 dark:text-slate-400">DEF</span>
                  <span className="font-mono font-black text-xs">{comp.defCount}/3</span>
                </div>
                <div className={`p-1.5 rounded-xl border text-xs ${comp.midCount === 3 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                  <span className="text-[9px] uppercase font-bold block text-slate-500 dark:text-slate-400">MID</span>
                  <span className="font-mono font-black text-xs">{comp.midCount}/3</span>
                </div>
                <div className={`p-1.5 rounded-xl border text-xs ${comp.fwdCount === 2 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                  <span className="text-[9px] uppercase font-bold block text-slate-500 dark:text-slate-400">FWD</span>
                  <span className="font-mono font-black text-xs">{comp.fwdCount}/2</span>
                </div>
              </div>

              {comp.exceededClubs && comp.exceededClubs.length > 0 && (
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
                  <span className="text-[11px]">Max 2 players per class: {comp.exceededClubs.map((ec) => ec.clubId.replace('SCH_', '')).join(', ')}</span>
                  <button
                    onClick={() => setActiveTab('transfers')}
                    className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold"
                  >
                    Adjust
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tactical Pitch Surface (Bench decoupled to Section 2) */}
        <PitchView
          showPoints={isPastGW}
          renderBench={false}
          onCardClick={(id) => setActiveSheetPlayerId(id)}
          customSquad={activeSquadPlayers}
          customCalculation={activeCalculation}
          selectedGW={selectedGW}
          readOnly={isPastGW}
        />
      </section>

      {/* Fine Subtle Divider between Sections */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent my-2 sm:my-3" />

      {/* ======================================================== */}
      {/* SECTION 2: BOTTOM RIBBON (Unified Liquid Glass Substitutes & Chips Dock) */}
      {/* ======================================================== */}
      <section className="flex flex-col space-y-3">
        <div className="relative rounded-2xl sm:rounded-3xl bg-white/75 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/10 dark:ring-white/5 p-3 sm:p-4 overflow-hidden transition-all grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
          {/* Subtle Specular Top Rim */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent pointer-events-none" />

          {/* Left Column: Substitutes (Strictly 3 Reserves) */}
          <div className="md:col-span-7 flex flex-col justify-between md:border-r border-slate-200/80 dark:border-white/10 md:pr-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                Substitutes ({layout.bench.length}/3)
              </span>
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                Priority: Sub 1 enters 1st
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {benchSlots.map((order) => {
                const sp = layout.bench.find((b) => b.benchOrder === order) || layout.bench[order - 1];
                if (sp) {
                  return (
                    <div key={sp.playerId} className="flex flex-col items-center">
                      {/* Priority Tag Header & Reorder Controls */}
                      <div className="w-full flex items-center justify-between mb-1 px-1">
                        <span className={`text-[9px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded-lg ${
                          order === 1
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                            : order === 2
                            ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/40'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                        }`}>
                          {order === 1 ? '1st Sub ★' : order === 2 ? '2nd Sub' : '3rd Sub'}
                        </span>
                        {/* Quick Reorder Arrow Buttons */}
                        {!isSquadLocked && !isPastGW && layout.bench.length > 1 && (
                          <div className="flex items-center gap-1">
                            {order > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderBenchPlayer(sp.playerId, order - 1);
                                }}
                                title={`Promote to Sub ${order - 1}`}
                                className="p-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {order < layout.bench.length && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderBenchPlayer(sp.playerId, order + 1);
                                }}
                                title={`Demote to Sub ${order + 1}`}
                                className="p-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
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
                        onCardClick={(id) => setActiveSheetPlayerId(id)}
                        showPoints={isPastGW}
                        customCalculation={activeCalculation}
                        selectedGW={selectedGW}
                        readOnly={isPastGW}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={`empty-bench-${order}`}
                    onClick={() => {
                      if (!isPastGW) setActiveTab('transfers');
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border border-dashed border-slate-300/80 dark:border-white/15 bg-slate-50/60 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 transition-all min-h-[90px] ${
                      isPastGW ? 'cursor-default opacity-50' : 'hover:border-sky-400 hover:bg-sky-50/50 cursor-pointer active:scale-95'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Sub {order}</span>
                    <span className="text-[8px] text-sky-600 dark:text-emerald-400 mt-1 font-mono uppercase tracking-wider">{isPastGW ? 'Empty' : '+ Empty'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Available Chips with Metallic Shine */}
          <div className="md:col-span-5 flex flex-col justify-between pt-3 md:pt-0 border-t md:border-t-0 border-slate-200/80 dark:border-white/10 md:pl-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                {isPastGW ? `GW ${selectedGW} Chip` : 'Available Chips'}
              </span>
              {((isPastGW && activeGWChip) || (!isPastGW && squad.activeChip && !squad.usedChips?.[squad.activeChip])) && (
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 animate-pulse">
                  Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 md:grid-cols-1 gap-2 flex-1 items-stretch">
              {chips.map((chip) => {
                const Icon = chip.icon;
                const isUsedInSeason = Boolean(
                  squad.usedChips?.[chip.id] ||
                  (squad.gameweekChips && Object.values(squad.gameweekChips).includes(chip.id))
                );
                const isActiveInThisGW = isPastGW
                  ? activeGWChip === chip.id
                  : (!isUsedInSeason && squad.activeChip === chip.id);

                return (
                  <button
                    key={chip.id}
                    disabled={isPastGW || isUsedInSeason || isSquadLocked}
                    onClick={() => {
                      triggerHaptic(isActiveInThisGW ? 'light' : 'medium');
                      activateChip(chip.id);
                    }}
                    className={`group relative overflow-hidden flex flex-col md:flex-row items-center md:justify-between p-2 md:px-3 md:py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                      isActiveInThisGW
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white border-emerald-400/80 shadow-md shadow-emerald-500/20'
                        : isPastGW
                        ? 'bg-slate-100/60 dark:bg-black/20 text-slate-400 dark:text-slate-500 border-slate-200/60 dark:border-white/5 opacity-50 cursor-not-allowed'
                        : isUsedInSeason
                        ? 'bg-slate-100/80 dark:bg-black/40 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-white/5 opacity-50 cursor-not-allowed'
                        : isSquadLocked
                        ? 'bg-slate-100 dark:bg-black/30 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-white/5 opacity-60 cursor-not-allowed'
                        : 'bg-white/60 hover:bg-sky-50/70 text-slate-700 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:border-sky-400/60 dark:hover:border-emerald-500/40 shadow-xs active:scale-98'
                    }`}
                  >
                    {/* Metallic sweep shine */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none transition-transform" />
                    <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 relative z-10">
                      <div className={`p-1 rounded-lg ${isActiveInThisGW ? 'bg-white/20 text-white' : isUsedInSeason ? 'bg-slate-200/50 dark:bg-white/5 text-slate-400 dark:text-slate-500' : 'bg-sky-500/10 text-sky-600 dark:bg-white/5 dark:text-slate-300'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] md:text-xs text-center md:text-left leading-tight">{chip.label}</span>
                    </div>
                    <span className={`text-[8px] md:text-[10px] font-mono mt-1 md:mt-0 relative z-10 font-bold ${
                      isActiveInThisGW ? 'text-white' : isPastGW ? 'text-slate-400' : isUsedInSeason ? 'text-rose-500 dark:text-rose-400' : 'text-sky-600 dark:text-slate-400'
                    }`}>
                      {isActiveInThisGW ? 'ACTIVE' : isPastGW ? 'INACTIVE' : isUsedInSeason ? '🔒 USED' : 'READY'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error notification if save fails or squad invalid */}
        {errorMessage && (
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tactile Lineup Save Action / Past GW Jump Button */}
        {isPastGW ? (
          <button
            type="button"
            onClick={() => setSelectedGW(currentGW)}
            className="w-full py-3.5 px-5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:brightness-105 active:scale-98 text-slate-950 cursor-pointer border border-sky-400/40"
          >
            <Clock className="w-4 h-4" />
            <span>Viewing GW {selectedGW} Archive • Jump to Current GW {currentGW} →</span>
          </button>
        ) : (
          <button
            onClick={handleSaveTeam}
            disabled={isSaving || !comp.isValid || isSquadLocked}
            className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl ${
              isSquadLocked
                ? 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/10 cursor-not-allowed shadow-none'
                : !comp.isValid
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:brightness-105 active:scale-98 text-slate-950 cursor-pointer shadow-emerald-500/25 border border-emerald-300/40'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Lineup...</span>
              </>
            ) : isSquadLocked ? (
              <span>Lineups Locked for GW {currentGW}</span>
            ) : comp.hasPositionChangedPlayers ? (
              <span>⚠️ სავალდებულოა ტრანსფერი ({comp.positionChangedPlayers?.[0]?.name?.split(' ')[0]})</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Squad Saved Successfully!</span>
              </>
            ) : (
              <span>Save Team Lineup</span>
            )}
          </button>
        )}
      </section>

      {/* Modal Action Sheet for Selected Player */}
      {activeSheetPlayerId && (
        <PlayerActionSheet
          playerId={activeSheetPlayerId}
          onClose={() => setActiveSheetPlayerId(null)}
          selectedGW={selectedGW}
          readOnly={isPastGW}
          customCalculation={activeCalculation}
        />
      )}
    </div>
  );
};
