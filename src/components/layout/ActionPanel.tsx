import React from 'react';
import { useFPL } from '../../context/FPLContext';
import { ChipType } from '../../types/fpl';
import { TripleCaptainIcon, BenchBoostIcon, WildcardIcon } from '../icons/ChipIcons';
import {
  Zap,
  CheckCircle,
  AlertCircle,
  Lock,
  Clock,
  Award,
  Loader2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import confetti from 'canvas-confetti';

interface ActionPanelProps {
  selectedGW: number;
  setSelectedGW: (gw: number | ((prev: number) => number)) => void;
  activeCalculation: any;
  comp: any;
  activeSquadPlayers: any[];
  isPastGW: boolean;
  activeGWChip: string | null;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  selectedGW,
  setSelectedGW,
  activeCalculation,
  comp,
  isPastGW,
  activeGWChip,
}) => {
  const {
    squad,
    activateChip,
    teamValue,
    freeTransfersRemaining,
    saveSquad,
    setActiveTab,
    isSquadLocked,
    isReferee,
    isDemoMode,
    currentGW,
    deadline,
    leagues,
    currentManager,
    authUser,
  } = useFPL();

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [timeLeft, setTimeLeft] = React.useState<string>('');

  React.useEffect(() => {
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

  const userLeagueMember = leagues?.flatMap((l) => l.members).find(
    (m) => m.id === currentManager?.id || m.id === 'user' || (authUser && m.id === authUser.id)
  );
  const totalUserPoints = userLeagueMember ? userLeagueMember.totalPoints : (activeCalculation.totalPoints || 0);
  const overallRank = userLeagueMember ? `#${userLeagueMember.rank}` : '-';

  const chips: { id: ChipType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'triple_captain', label: 'Triple Captain', icon: TripleCaptainIcon },
    { id: 'bench_boost', label: 'Bench Boost', icon: BenchBoostIcon },
    { id: 'wildcard', label: 'Wildcard', icon: WildcardIcon },
  ];

  const handleSaveTeam = async () => {
    if (!comp.isValid) {
      setErrorMessage(comp.message || 'Squad incomplete: Need 1 GK, 3 DEF, 3 MID, 2 FWD!');
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
          particleCount: 40,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#ffffff', '#38bdf8', '#f59e0b'],
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

  return (
    <aside className="hidden lg:flex flex-col w-[320px] xl:w-[340px] h-screen sticky top-0 border-l border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl z-40 select-none overflow-y-auto p-4 space-y-4 transition-colors">
      {/* Action Panel Title */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xs font-black uppercase font-mono tracking-wider text-slate-900 dark:text-white">
          Command Center
        </h2>
        <span className="text-[10px] font-mono font-bold text-slate-400">
          GW {selectedGW} {selectedGW === currentGW ? 'LIVE' : 'ARCHIVE'}
        </span>
      </div>

      {/* Gameweek Performance Card */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-sky-500/20 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            Matchday Points
          </span>
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black tabular-nums bg-blue-600 text-white dark:bg-sky-500 dark:text-slate-950 shadow-2xs">
            {activeCalculation.totalPoints} PTS
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Points
            </span>
            <span className="text-base font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 block">
              {totalUserPoints}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
              Overall Rank
            </span>
            <span className="text-base font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 block">
              {overallRank}
            </span>
          </div>
        </div>

        {/* Financial & Transfer Metrics Capsule */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Bank</span>
            <span className="text-xs font-black tabular-nums text-slate-900 dark:text-white">
              £{squad.bank.toFixed(1)}m
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Value</span>
            <span className="text-xs font-black tabular-nums text-slate-900 dark:text-white">
              £{teamValue.toFixed(1)}m
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Free FT</span>
            <span className="text-xs font-black tabular-nums text-slate-900 dark:text-white">
              {freeTransfersRemaining}
            </span>
          </div>
        </div>

        {/* Deadline Indicator */}
        {deadline && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Next Deadline</span>
            </span>
            <span
              className={`font-black tabular-nums ${
                isSquadLocked ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
              }`}
            >
              {isSquadLocked ? 'Lineups Locked' : timeLeft}
            </span>
          </div>
        )}
      </div>

      {/* Warnings & Mod/Referee Alerts */}
      {isReferee && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 dark:border-sky-500/20 text-amber-300 text-xs font-bold space-y-2 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] transition-all">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-black text-amber-300 uppercase tracking-wide">
              Referee Console
            </span>
          </div>
          <p className="text-[11px] text-amber-200/90 leading-relaxed font-normal">
            You have referee privileges to record live match goals, assists, and bonus points.
          </p>
          <button
            onClick={() => setActiveTab('dev')}
            className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Open Match Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mandatory Position Changes Alert */}
      {!isPastGW && comp.hasPositionChangedPlayers && (
        <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-black text-rose-300 uppercase tracking-wide">
              Mandatory Transfer (GW2)
            </span>
          </div>
          <p className="text-[11px] text-rose-200/90 leading-relaxed font-normal">
            Squad has position-changed player(s):{' '}
            <strong className="text-white font-bold">
              {comp.positionChangedPlayers?.map((p: any) => `${p.name} (${p.oldPosition}→${p.newPosition})`).join(', ')}
            </strong>
            . Must transfer out before GW2 lock!
          </p>
          <button
            onClick={() => setActiveTab('transfers')}
            className="w-full py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all cursor-pointer shadow-sm"
          >
            Go To Transfers
          </button>
        </div>
      )}

      {/* Lineup Locked Status Banner */}
      {isSquadLocked && (
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-[11px]">
            {isDemoMode ? 'Demo Mode: Mutations disabled' : `Gameweek ${currentGW} Lineups are Locked.`}
          </span>
        </div>
      )}

      {/* Squad Composition Checklist (1 GK, 3 DEF, 3 MID, 2 FWD) */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-sky-500/20 shadow-xs space-y-2.5 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            Squad Composition
          </span>
          <span
            className={`text-[10px] font-bold font-mono px-2 py-0.2 rounded-full border ${
              comp.isValid
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}
          >
            {comp.isValid ? 'Valid 9/9' : 'Incomplete'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
          <div
            className={`p-2 rounded-xl border ${
              comp.gkCount === 1
                ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            <span className="text-[8.5px] uppercase font-bold block text-slate-400">GK</span>
            <span className="font-bold text-xs">{comp.gkCount}/1</span>
          </div>
          <div
            className={`p-2 rounded-xl border ${
              comp.defCount === 3
                ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            <span className="text-[8.5px] uppercase font-bold block text-slate-400">DEF</span>
            <span className="font-bold text-xs">{comp.defCount}/3</span>
          </div>
          <div
            className={`p-2 rounded-xl border ${
              comp.midCount === 3
                ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            <span className="text-[8.5px] uppercase font-bold block text-slate-400">MID</span>
            <span className="font-bold text-xs">{comp.midCount}/3</span>
          </div>
          <div
            className={`p-2 rounded-xl border ${
              comp.fwdCount === 2
                ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            <span className="text-[8.5px] uppercase font-bold block text-slate-400">FWD</span>
            <span className="font-bold text-xs">{comp.fwdCount}/2</span>
          </div>
        </div>
      </div>

      {/* Available Chips Dock */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-sky-500/20 shadow-xs space-y-2.5 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            {isPastGW ? `GW ${selectedGW} Chip` : 'Available Chips'}
          </span>
          {((isPastGW && activeGWChip) ||
            (!isPastGW && squad.activeChip && !squad.usedChips?.[squad.activeChip])) && (
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white dark:bg-sky-500 dark:text-slate-950">
              Active
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          {chips.map((chip) => {
            const Icon = chip.icon;
            const isUsedInSeason = Boolean(
              squad.usedChips?.[chip.id] ||
                (squad.gameweekChips && Object.values(squad.gameweekChips).includes(chip.id))
            );
            const isActiveInThisGW = isPastGW
              ? activeGWChip === chip.id
              : !isUsedInSeason && squad.activeChip === chip.id;

            return (
              <button
                key={chip.id}
                disabled={isPastGW || isUsedInSeason || isSquadLocked}
                onClick={() => {
                  triggerHaptic(isActiveInThisGW ? 'light' : 'medium');
                  activateChip(chip.id);
                }}
                className={`w-full group relative overflow-hidden flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isActiveInThisGW
                    ? 'bg-blue-600 text-white dark:bg-sky-500 dark:text-slate-950 border-blue-600 dark:border-sky-400 shadow-sm'
                    : isPastGW || isUsedInSeason || isSquadLocked
                    ? 'bg-slate-100/60 dark:bg-slate-950/40 text-slate-400 dark:text-slate-500 border-slate-200/50 dark:border-slate-800 opacity-50 cursor-not-allowed'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-sky-500/30 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1 rounded-lg ${
                      isActiveInThisGW
                        ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs">{chip.label}</span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold ${
                    isActiveInThisGW
                      ? 'text-white dark:text-slate-950'
                      : isUsedInSeason
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {isActiveInThisGW ? 'ACTIVE' : isUsedInSeason ? 'LOCKED' : 'READY'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message Notice */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Primary Action Button (Clean Luxury Styling) */}
      <div className="pt-2">
        {isPastGW ? (
          <button
            type="button"
            onClick={() => setSelectedGW(currentGW)}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 cursor-pointer shadow-md active:scale-[0.98]"
          >
            <Clock className="w-4 h-4" />
            <span>Return to Current GW {currentGW}</span>
          </button>
        ) : (
          <button
            onClick={handleSaveTeam}
            disabled={isSaving || !comp.isValid || isSquadLocked}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98] ${
              isSquadLocked
                ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed shadow-none'
                : !comp.isValid
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 border border-transparent'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Lineup...</span>
              </>
            ) : isSquadLocked ? (
              <span>Lineups Locked</span>
            ) : comp.hasPositionChangedPlayers ? (
              <span>Action Required</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Saved Successfully</span>
              </>
            ) : (
              <span>Save Team Lineup</span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};
