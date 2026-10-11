import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Position, Player } from '../../types/fpl';
import { CLUBS, getSortedSchoolClubs } from '../../data/clubs';
import { KitJersey } from '../pitch/KitJersey';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  Search,
  Check,
  AlertCircle,
  Plus,
  X,
  Lock,
  List,
  LayoutGrid,
  Coins,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { validateSquadComposition, calculatePlayerPoints } from '../../engine/scoring';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../../utils/haptics';
import { ClassGridView } from '../transfers/ClassGridView';
import { PlayerPriceBadge } from '../common/PlayerPriceBadge';
import {
  ClassTwoTierPillStrip,
  GradeOption,
  SectionOption,
  matchesGradeAndSection,
} from '../common/ClassTwoTierPillStrip';

export type SortOption =
  | 'points_desc'
  | 'cost_desc'
  | 'cost_asc'
  | 'form_desc'
  | 'selected_desc'
  | 'name_asc';

export const TransfersView: React.FC = () => {
  const fpl = useFPL();
  const {
    players,
    clubs,
    squad,
    transferPlayer,
    buyPlayer,
    removePlayer,
    freeTransfersRemaining,
    transferOutPlayerId,
    setTransferOutPlayerId,
    currentGW,
    setActiveTab,
  } = fpl;
  const isSquadLocked = (fpl as any).isSquadLocked ?? false;
  const isDemoMode = (fpl as any).isDemoMode ?? false;

  // Selected player for replacement / transfer
  const [outPlayerId, setOutPlayerId] = useState<string | null>(transferOutPlayerId || null);
  const [inPlayerId, setInPlayerId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Filters & Search
  const [positionFilter, setPositionFilter] = useState<Position | 'ALL'>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<GradeOption>('ALL');
  const [selectedSection, setSelectedSection] = useState<SectionOption>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('points_desc');
  const [affordableOnly, setAffordableOnly] = useState<boolean>(false);

  // Default to Calendar view
  const [viewMode, setViewMode] = useState<'list' | 'classes'>('classes');
  const [mobileShowPitch, setMobileShowPitch] = useState<boolean>(true);

  // Feedback notifications
  const [transferMessage, setTransferMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Listen to transferOutPlayerId queued from pitch/action sheet
  useEffect(() => {
    if (transferOutPlayerId) {
      setOutPlayerId(transferOutPlayerId);
      const outP = players[transferOutPlayerId];
      if (outP) {
        setPositionFilter(outP.position);
      }
      setTransferOutPlayerId(null);
    }
  }, [transferOutPlayerId, players, setTransferOutPlayerId]);

  const comp = useMemo(() => validateSquadComposition(squad.players, players, currentGW), [squad.players, players, currentGW]);
  const outPlayer = outPlayerId ? players[outPlayerId] : null;
  const inPlayer = inPlayerId ? players[inPlayerId] : null;

  // Potential bank calculation
  const potentialBank = useMemo(() => {
    if (!outPlayer || !inPlayer) return squad.bank;
    return Math.round((squad.bank + outPlayer.cost - inPlayer.cost) * 10) / 10;
  }, [outPlayer, inPlayer, squad.bank]);

  const squadPlayerIds = useMemo(() => new Set(squad.players.map((p) => p.playerId)), [squad.players]);
  const sortedClubs = useMemo(() => getSortedSchoolClubs(clubs), [clubs]);

  // Only clubs that have at least 1 player registered
  const activeClubs = useMemo(() => {
    return sortedClubs.filter((c) => {
      return Object.values(players).some((p) => {
        const normClub = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
        return normClub === c.id;
      });
    });
  }, [sortedClubs, players]);

  // Squad categorized by tactical positions
  const squadByPosition = useMemo(() => {
    const gks: Player[] = [];
    const defs: Player[] = [];
    const mids: Player[] = [];
    const fwds: Player[] = [];

    squad.players.forEach((sp) => {
      const p = players[sp.playerId];
      if (!p) return;
      if (p.position === 'GKP') gks.push(p);
      else if (p.position === 'DEF') defs.push(p);
      else if (p.position === 'MID') mids.push(p);
      else if (p.position === 'FWD') fwds.push(p);
    });

    return { GKP: gks, DEF: defs, MID: mids, FWD: fwds };
  }, [squad.players, players]);

  // Candidate players in the market
  const candidatePlayers = useMemo(() => {
    const maxAvailableSpend = outPlayer ? squad.bank + outPlayer.cost : squad.bank;

    return Object.values(players)
      .filter((p) => {
        if (squadPlayerIds.has(p.id) && (!outPlayer || p.id !== outPlayer.id)) return false;
        if (outPlayer && p.position !== outPlayer.position) return false;
        if (positionFilter !== 'ALL' && p.position !== positionFilter) return false;
        if (selectedGrade !== 'ALL') {
          if (!matchesGradeAndSection(p.clubId, selectedGrade, selectedSection)) return false;
        }
        if (affordableOnly && p.cost > maxAvailableSpend) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(q);
          const matchWebName = p.webName.toLowerCase().includes(q);
          const club = clubs[p.clubId] || CLUBS[p.clubId];
          const matchClub =
            club &&
            (club.shortName.toLowerCase().includes(q) ||
              club.name.toLowerCase().includes(q) ||
              p.clubId.toLowerCase().includes(q));
          return matchName || matchWebName || matchClub;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'points_desc':
            return b.totalPoints - a.totalPoints;
          case 'cost_desc':
            return b.cost - a.cost;
          case 'cost_asc':
            return a.cost - b.cost;
          case 'form_desc':
            return b.form - a.form;
          case 'selected_desc':
            return b.selectedByPercent - a.selectedByPercent;
          case 'name_asc':
            return a.webName.localeCompare(b.webName);
          default:
            return 0;
        }
      });
  }, [
    players,
    squadPlayerIds,
    outPlayer,
    positionFilter,
    selectedGrade,
    selectedSection,
    affordableOnly,
    searchQuery,
    sortBy,
    clubs,
    squad.bank,
  ]);

  // Buy player directly with validation
  const handleBuyPlayer = (playerId: string) => {
    if (isSquadLocked) return;
    const target = players[playerId];
    if (!target) return;

    const normClub = target.clubId === 'SCH' ? 'SCH_11_5' : target.clubId;
    const currentClubCount = squad.players.filter((sp) => {
      const p = players[sp.playerId];
      return p && (p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId) === normClub;
    }).length;

    if (currentClubCount >= 2) {
      setTransferMessage({
        type: 'error',
        text: `Cannot buy ${target.webName}: Max 2 players from Class ${clubs[normClub]?.shortName || normClub} allowed!`,
      });
      setTimeout(() => setTransferMessage(null), 3500);
      return;
    }

    if (squad.bank < target.cost) {
      setTransferMessage({
        type: 'error',
        text: `Insufficient bank funds for ${target.webName} (£${target.cost.toFixed(1)}m required, £${squad.bank.toFixed(1)}m in bank)`,
      });
      setTimeout(() => setTransferMessage(null), 3500);
      return;
    }

    const res = buyPlayer(playerId);
    if (res.success) {
      triggerHaptic('success');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      setTransferMessage({ type: 'success', text: res.message || `Added ${target.webName} to squad!` });
      setTimeout(() => setTransferMessage(null), 3000);
    } else {
      triggerHaptic('warning');
      setTransferMessage({ type: 'error', text: res.message || 'Failed to buy player' });
      setTimeout(() => setTransferMessage(null), 3500);
    }
  };

  // 1-for-1 Swap confirmation
  const handleConfirmTransfer = () => {
    if (isSquadLocked || !outPlayerId || !inPlayerId) return;
    const res = transferPlayer(outPlayerId, inPlayerId);
    if (res.success) {
      triggerHaptic('success');
      confetti({ particleCount: 50, spread: 65, origin: { y: 0.6 } });
      setTransferMessage({
        type: 'success',
        text: `Transferred ${outPlayer?.webName} → ${inPlayer?.webName}!`,
      });
      setOutPlayerId(null);
      setInPlayerId(null);
      setTimeout(() => setTransferMessage(null), 3500);
    } else {
      triggerHaptic('warning');
      setTransferMessage({ type: 'error', text: res.message || 'Transfer failed' });
      setTimeout(() => setTransferMessage(null), 4000);
    }
  };

  // Sell player directly with refund
  const handleRemovePlayer = (playerId: string) => {
    if (isSquadLocked) return;
    const res = removePlayer(playerId);
    if (res.success) {
      if (outPlayerId === playerId) setOutPlayerId(null);
      setTransferMessage({ type: 'success', text: `Refunded £${players[playerId]?.cost || 0}m to bank` });
      setTimeout(() => setTransferMessage(null), 2500);
    } else {
      setTransferMessage({ type: 'error', text: res.message || 'Failed to remove player' });
      setTimeout(() => setTransferMessage(null), 3500);
    }
  };

  const handleSelectEmptySlot = (pos: Position) => {
    setPositionFilter(pos);
    setOutPlayerId(null);
    setInPlayerId(null);
  };

  const handleSelectSquadPlayer = (p: Player) => {
    if (outPlayerId === p.id) {
      setOutPlayerId(null);
      setInPlayerId(null);
    } else {
      setOutPlayerId(p.id);
      setPositionFilter(p.position);
      setInPlayerId(null);
    }
  };

  const validSquadCount = squad.players.filter((sp) => Boolean(players[sp.playerId])).length;

  return (
    <div className="relative min-h-[calc(100vh-60px)] pb-28 select-none font-sans text-slate-900 dark:text-slate-100">
      {/* 1. Sleek Sticky HUD with frosted glass & backdrop-blur */}
      <header className="sticky top-0 z-30 h-12 max-h-[52px] w-full px-3 sm:px-6 flex items-center justify-between bg-white/85 dark:bg-[#090d16]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-extrabold text-xs sm:text-sm tracking-tight truncate max-w-[130px] sm:max-w-[200px] text-slate-800 dark:text-white">
            {squad.teamName}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.09]">
            GW {currentGW}
          </span>
        </div>

        {/* Squad Progress & Bank Budget Metric */}
        <div className="flex items-center gap-2">
          {squad.activeChip === 'wildcard' && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span>Wildcard</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.09]">
            <span className={comp.isValid ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
              {validSquadCount}/9
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Slots</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.09]">
            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-500 dark:text-cyan-400" />
            <span className="text-xs font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
              {squad.activeChip === 'wildcard' ? '∞' : (squad.freeTransfers ?? 0)} FT
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.09]">
            <Coins className="w-3.5 h-3.5 text-sky-500 dark:text-emerald-400" />
            <span className="text-xs font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
              £{squad.bank.toFixed(1)}m
            </span>
          </div>
        </div>
      </header>

      {/* Lock Banner if Gameweek is Locked */}
      {isSquadLocked && (
        <div className="mx-3 sm:mx-6 mt-2 p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              {isDemoMode
                ? 'Demo Mode: Transfer market is in preview mode. Sign in or register to make transfers.'
                : 'Lineups and transfers are frozen for this matchday.'}
            </span>
          </div>
          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
            {isDemoMode ? 'Demo' : 'Locked'}
          </span>
        </div>
      )}

      {/* Banner Notifications */}
      {transferMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`mx-3 sm:mx-6 mt-2 p-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border shadow-sm ${
            transferMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {transferMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{transferMessage.text}</span>
        </motion.div>
      )}

      {/* Floating 1-for-1 Transfer Confirmation Card */}
      <AnimatePresence>
        {outPlayer && inPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40 p-3.5 sm:p-4 rounded-3xl bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-2xl border border-sky-400/50 dark:border-emerald-500/40 shadow-2xl text-slate-900 dark:text-white"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-extrabold block tracking-wider">
                    1-for-1 Transfer
                  </span>
                  <div className="flex items-center gap-1.5 font-bold truncate mt-0.5">
                    <span className="text-rose-500 dark:text-rose-400 truncate">{outPlayer.webName}</span>
                    <ArrowLeftRight className="w-3.5 h-3.5 text-sky-500 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-600 dark:text-emerald-400 truncate">{inPlayer.webName}</span>
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-300 mt-0.5">
                    <span>ბანკი: £{potentialBank.toFixed(1)}m</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setOutPlayerId(null);
                      setInPlayerId(null);
                      setShowConfirmModal(false);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={potentialBank < 0 || isSquadLocked}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                      potentialBank < 0 || isSquadLocked
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                        : (squad.freeTransfers ?? 0) === 0 && squad.activeChip !== 'wildcard'
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
                        : 'bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                    }`}
                  >
                    <span>Confirm</span>
                    <span className="text-[10px] font-mono opacity-85">
                      {squad.activeChip === 'wildcard'
                        ? '(0 pts)'
                        : (squad.freeTransfers ?? 0) > 0
                        ? '(1 FT)'
                        : '(-4 pts)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Prominent Warning Note */}
              <div
                className={`p-2.5 rounded-2xl border text-[11px] leading-relaxed flex items-center gap-2 ${
                  potentialBank < 0
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                    : squad.activeChip === 'wildcard'
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-800 dark:text-indigo-300'
                    : (squad.freeTransfers ?? 0) > 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200'
                }`}
              >
                {potentialBank < 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span><strong>ბიუჯეტის გადაჭარბება:</strong> თანხა არ არის საკმარისი (£{potentialBank.toFixed(1)}m).</span>
                  </>
                ) : squad.activeChip === 'wildcard' ? (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span><strong>Wildcard აქტიურია:</strong> ტრანსფერი უფასოა (0 ქულა ჯარიმა).</span>
                  </>
                ) : (squad.freeTransfers ?? 0) > 0 ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      <strong>1 უფასო ტრანსფერი:</strong> დაიხარჯება 1 FT (დაგრჩებათ {(squad.freeTransfers ?? 0) - 1} FT, 0 ქულა ჯარიმა).
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                    <span>
                      <strong>ყურადღება (-4 ქულა):</strong> 0 უფასო ტრანსფერი! ეს ტრანსფერი ჩამოგაჭრით -4 ქულას საერთო რეიტინგში.
                    </span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && outPlayer && inPlayer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 text-slate-900 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 dark:text-sky-400">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      ტრანსფერის დადასტურება
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Gameweek {currentGW} • {squad.teamName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Player Swap Comparison */}
              <div className="grid grid-cols-2 gap-3">
                {/* Out Player */}
                <div className="p-3 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 block">
                    გადის (OUT)
                  </span>
                  <div className="flex justify-center py-1">
                    <KitJersey clubId={outPlayer.clubId} position={outPlayer.position} className="w-8 h-8 drop-shadow-xs" />
                  </div>
                  <span className="font-black text-xs block text-slate-900 dark:text-white truncate">
                    {outPlayer.webName}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                    £{outPlayer.cost.toFixed(1)}m • {outPlayer.position}
                  </span>
                </div>

                {/* In Player */}
                <div className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    შედის (IN)
                  </span>
                  <div className="flex justify-center py-1">
                    <KitJersey clubId={inPlayer.clubId} position={inPlayer.position} className="w-8 h-8 drop-shadow-xs" />
                  </div>
                  <span className="font-black text-xs block text-slate-900 dark:text-white truncate">
                    {inPlayer.webName}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                    £{inPlayer.cost.toFixed(1)}m • {inPlayer.position}
                  </span>
                </div>
              </div>

              {/* Financial Balance Summary */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">დარჩენილი ბიუჯეტი (Bank):</span>
                <span className={`font-mono font-black ${potentialBank < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                  £{potentialBank.toFixed(1)}m
                </span>
              </div>

              {/* Explicit Cost & Points Hit Warning Notice */}
              <div
                className={`p-3.5 rounded-2xl border text-[11.5px] leading-relaxed ${
                  potentialBank < 0
                    ? 'bg-rose-500/15 border-rose-500/35 text-rose-800 dark:text-rose-200'
                    : squad.activeChip === 'wildcard'
                    ? 'bg-indigo-500/15 border-indigo-500/35 text-indigo-900 dark:text-indigo-200'
                    : (squad.freeTransfers ?? 0) > 0
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-950 dark:text-emerald-200'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-950 dark:text-amber-200'
                }`}
              >
                {potentialBank < 0 ? (
                  <>
                    <strong className="block font-black text-rose-600 dark:text-rose-400 mb-0.5">
                      ⛔ არასაკმარისი ბიუჯეტი:
                    </strong>
                    მოთამაშის ფასი აღემატება თქვენს ბიუჯეტს. ტრანსფერის განხორციელება შეუძლებელია.
                  </>
                ) : squad.activeChip === 'wildcard' ? (
                  <>
                    <strong className="block font-black text-indigo-600 dark:text-indigo-400 mb-0.5">
                      ✨ Wildcard გააქტიურებულია (0 ქულა):
                    </strong>
                    ეს ტრანსფერი სრულიად უფასოა და არ აკლდება თქვენს უფასო ტრანსფერების ბალანსს ან ქულებს.
                  </>
                ) : (squad.freeTransfers ?? 0) > 0 ? (
                  <>
                    <strong className="block font-black text-emerald-700 dark:text-emerald-300 mb-0.5">
                      🟢 1 უფასო ტრანსფერი (0 ქულა ჯარიმა):
                    </strong>
                    თქვენ გაქვთ <strong>{squad.freeTransfers} უფასო ტრანსფერი</strong>. ამ ტრანსფერის დადასტურებით დაიხარჯება 1 უფასო ტრანსფერი და დაგრჩებათ <strong>{(squad.freeTransfers ?? 0) - 1} FT</strong>.
                  </>
                ) : (
                  <>
                    <strong className="block font-black text-amber-700 dark:text-amber-300 mb-0.5 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>⚠️ გაფრთხილება — -4 ქულა ჯარიმა!</span>
                    </strong>
                    თქვენ გაქვთ <strong>0 უფასო ტრანსფერი</strong>. ამ ტრანსფერის განხორციელება დაგიჯდებათ <strong>-4 ქულა</strong> თქვენი საერთო ფენტეზი რეიტინგიდან!
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 transition-colors cursor-pointer"
                >
                  გაუქმება / Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleConfirmTransfer();
                  }}
                  disabled={potentialBank < 0 || isSquadLocked}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    potentialBank < 0 || isSquadLocked
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                      : (squad.freeTransfers ?? 0) === 0 && squad.activeChip !== 'wildcard'
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                  }`}
                >
                  <span>დადასტურება</span>
                  <span className="text-[10px] font-mono opacity-80">
                    {squad.activeChip === 'wildcard' ? '(0 pts)' : (squad.freeTransfers ?? 0) > 0 ? '(1 FT)' : '(-4 pts)'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Outgoing Player Notice Strip */}
      {outPlayer && (
        <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 pt-2">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div className="text-xs min-w-0">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">
                  მოთამაშის შემცვლელის შერჩევა (Replacing Player)
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white truncate">
                  {outPlayer.webName} ({outPlayer.position} • £{outPlayer.cost.toFixed(1)}m)
                </span>
                <span className="text-[11px] ml-2 font-mono font-black text-sky-600 dark:text-sky-400">
                  {squad.activeChip === 'wildcard'
                    ? '• Wildcard (0 pts)'
                    : (squad.freeTransfers ?? 0) > 0
                    ? `• 1 FT (${squad.freeTransfers} დარჩა)`
                    : '• ⚠️ -4 ქულა ჯარიმა'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setOutPlayerId(null);
                setInPlayerId(null);
              }}
              className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            >
              ✕ გაუქმება
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIDE-BY-SIDE LAYOUT: My Team Selection (Left) & Player Market (Right)     */}
      {/* Player Market is NOT scrollable — fully displays everything!               */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 pt-3 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ------------------------------------------------------------- */}
          {/* LEFT COLUMN: MY TEAM SELECTION (TACTICAL FORMATION PITCH)     */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-5 lg:sticky lg:top-16 space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>My Squad Lineup</span>
                  <span className="font-normal font-mono text-[10px] text-slate-400">
                    ({validSquadCount}/9)
                  </span>
                </h2>
                <button
                  onClick={() => setMobileShowPitch((prev) => !prev)}
                  className="lg:hidden px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-white/10 border border-sky-200/80 dark:border-transparent text-[10px] font-bold text-sky-700 dark:text-slate-300"
                >
                  {mobileShowPitch ? 'Hide Pitch ▲' : 'Show Pitch ▼'}
                </button>
              </div>

              {outPlayer && (
                <button
                  onClick={() => {
                    setOutPlayerId(null);
                    setInPlayerId(null);
                  }}
                  className="text-[10px] font-bold text-rose-500 hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Tactical Pitch with 9 squad slots (Collapsible on mobile, always visible on lg+) */}
            <div className={`${mobileShowPitch ? 'block' : 'hidden lg:block'} relative rounded-3xl bg-[#125828] dark:bg-[#0c2e17] border border-[#1b6b33]/60 dark:border-white/10 shadow-lg p-2.5 sm:p-5 overflow-hidden`}>
              {/* Subtle Turf Pitch Markings & Komarovi Champions League Watermark */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 left-1/4 right-1/4 h-10 border-b border-x border-white/40 rounded-b-xl" />
                <div className="absolute bottom-0 left-1/4 right-1/4 h-10 border-t border-x border-white/40 rounded-t-xl" />
                <div className="absolute top-1/2 left-0 right-0 border-t border-white/40" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/40 rounded-full" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                <img
                  src="/kcl-logo-transparent.png"
                  alt=""
                  className="w-[180px] sm:w-[240px] opacity-[0.10] object-contain"
                />
              </div>

              <div className="relative z-10 flex flex-col justify-between gap-1.5 sm:gap-3 min-h-[225px] sm:min-h-[340px]">
                {/* GK Row (1 slot) */}
                <div className="flex justify-center">
                  <SlotCard
                    position="GKP"
                    label="GK"
                    player={squadByPosition.GKP[0]}
                    isOutPlayer={squadByPosition.GKP[0]?.id === outPlayerId}
                    onSelectEmpty={() => handleSelectEmptySlot('GKP')}
                    onSelectPlayer={handleSelectSquadPlayer}
                    onRemovePlayer={handleRemovePlayer}
                    isLocked={isSquadLocked}
                  />
                </div>

                {/* DEF Row (3 slots) */}
                <div className="flex justify-around gap-1 sm:gap-4">
                  {[0, 1, 2].map((idx) => (
                    <SlotCard
                      key={`def-${idx}`}
                      position="DEF"
                      label={`DEF ${idx + 1}`}
                      player={squadByPosition.DEF[idx]}
                      isOutPlayer={squadByPosition.DEF[idx]?.id === outPlayerId}
                      onSelectEmpty={() => handleSelectEmptySlot('DEF')}
                      onSelectPlayer={handleSelectSquadPlayer}
                      onRemovePlayer={handleRemovePlayer}
                      isLocked={isSquadLocked}
                    />
                  ))}
                </div>

                {/* MID Row (3 slots) */}
                <div className="flex justify-around gap-1 sm:gap-4">
                  {[0, 1, 2].map((idx) => (
                    <SlotCard
                      key={`mid-${idx}`}
                      position="MID"
                      label={`MID ${idx + 1}`}
                      player={squadByPosition.MID[idx]}
                      isOutPlayer={squadByPosition.MID[idx]?.id === outPlayerId}
                      onSelectEmpty={() => handleSelectEmptySlot('MID')}
                      onSelectPlayer={handleSelectSquadPlayer}
                      onRemovePlayer={handleRemovePlayer}
                      isLocked={isSquadLocked}
                    />
                  ))}
                </div>

                {/* FWD Row (2 slots) */}
                <div className="flex justify-center gap-5 sm:gap-12">
                  {[0, 1].map((idx) => (
                    <SlotCard
                      key={`fwd-${idx}`}
                      position="FWD"
                      label={`FWD ${idx + 1}`}
                      player={squadByPosition.FWD[idx]}
                      isOutPlayer={squadByPosition.FWD[idx]?.id === outPlayerId}
                      onSelectEmpty={() => handleSelectEmptySlot('FWD')}
                      onSelectPlayer={handleSelectSquadPlayer}
                      onRemovePlayer={handleRemovePlayer}
                      isLocked={isSquadLocked}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* RIGHT COLUMN: PLAYER MARKET (NOT SCROLLABLE - FULL DISPLAY)    */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl bg-white/90 dark:bg-[#0c1322]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xl p-4 sm:p-6 space-y-4">
              {/* Header Title & Mode Toggle */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  {outPlayer ? (
                    <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-tight">
                      Replacing {outPlayer.webName} ({outPlayer.position})
                    </h2>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('players')}
                      className="group flex items-center gap-1 text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                      title="View full Players tab"
                    >
                      <span>Players</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  )}
                  <span className="text-xs text-slate-400 font-mono">
                    ({candidatePlayers.length} players)
                  </span>
                </div>

                {/* View Mode Toggle: Classes vs List */}
                <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
                  <button
                    onClick={() => setViewMode('classes')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-bold ${
                      viewMode === 'classes'
                        ? 'bg-sky-500 text-white font-black shadow-xs dark:bg-emerald-500 dark:text-slate-950'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Class Grid View"
                  >
                    <span>🏫 Classes</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-bold ${
                      viewMode === 'list'
                        ? 'bg-sky-500 text-white font-black shadow-xs dark:bg-emerald-500 dark:text-slate-950'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="List View"
                  >
                    <span>📋 List</span>
                  </button>
                </div>
              </div>

              {/* Search Bar & Position Filter */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search player or class (e.g. 10/1, Zarno)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-white/5 border border-slate-200/90 dark:border-white/10 focus:border-sky-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-sky-400/20 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-colors shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Position Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {(['ALL', 'GKP', 'DEF', 'MID', 'FWD'] as const).map((pos) => {
                    const label = pos === 'GKP' ? 'GK' : pos;
                    const isSelected = outPlayer ? outPlayer.position === pos : positionFilter === pos;
                    const isDisabled = Boolean(outPlayer && outPlayer.position !== pos);

                    return (
                      <button
                        key={pos}
                        disabled={isDisabled}
                        onClick={() => {
                          if (!outPlayer) setPositionFilter(pos);
                        }}
                        className={`relative px-3 py-1.5 rounded-full text-xs font-bold transition-colors z-10 flex-shrink-0 ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed text-slate-400'
                            : isSelected
                            ? 'text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="activePositionPill"
                            className="absolute inset-0 rounded-full bg-emerald-500 -z-10 shadow-xs"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        <span>{label}</span>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setAffordableOnly((prev) => !prev)}
                    className={`ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors flex-shrink-0 ${
                      affordableOnly
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300'
                        : 'bg-white dark:bg-transparent border-slate-200/90 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Coins className="w-3 h-3 text-sky-500 dark:text-emerald-400" />
                    <span>Affordable</span>
                  </button>
                </div>

                {/* Two-Tier Class Filter & Sort in List mode */}
                {viewMode === 'list' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Class Filter:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="py-1 px-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs outline-none font-bold"
                      >
                        <option value="points_desc">Points: High to Low</option>
                        <option value="cost_desc">Price: High to Low</option>
                        <option value="cost_asc">Price: Low to High</option>
                        <option value="form_desc">Form: High to Low</option>
                        <option value="name_asc">Name: A to Z</option>
                      </select>
                    </div>

                    <ClassTwoTierPillStrip
                      selectedGrade={selectedGrade}
                      selectedSection={selectedSection}
                      onGradeChange={setSelectedGrade}
                      onSectionChange={setSelectedSection}
                      layoutIdPrefix="transfersView"
                    />
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* MARKET CONTENT: FULLY DISPLAYED WITHOUT INTERNAL SCROLL   */}
              {/* ========================================================= */}
              <div className="w-full pt-1">
                {viewMode === 'list' ? (
                  candidatePlayers.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {candidatePlayers.map((p) => {
                        const normClub = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
                        const currentClubCount = squad.players.filter((sp) => {
                          if (outPlayer && sp.playerId === outPlayer.id) return false;
                          const spP = players[sp.playerId];
                          return spP && (spP.clubId === 'SCH' ? 'SCH_11_5' : spP.clubId) === normClub;
                        }).length;
                        const isClassLimitReached = currentClubCount >= 2;
                        const maxAvailableSpend = outPlayer ? squad.bank + outPlayer.cost : squad.bank;
                        const isAffordable = p.cost <= maxAvailableSpend;
                        const isSelectedInPlayer = inPlayerId === p.id;
                        const isIllegal = isClassLimitReached || !isAffordable;

                        return (
                          <div
                            key={p.id}
                            className={`py-2 px-2 flex items-center justify-between rounded-xl transition-all ${
                              isSelectedInPlayer
                                ? 'bg-emerald-500/15 border border-emerald-500/40'
                                : isIllegal
                                ? 'opacity-40'
                                : 'hover:bg-slate-100/60 dark:hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <KitJersey clubId={p.clubId} position={p.position} photoUrl={p.photoUrl} className="w-8 h-8 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold truncate text-slate-900 dark:text-white">
                                    {p.webName}
                                  </span>
                                  <span className="text-[10px] px-1 py-0.2 rounded font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                    {p.position}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {clubs[p.clubId]?.shortName || p.clubId}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <PlayerPriceBadge player={p} className="text-[11px] font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-[10px] font-mono tabular-nums text-slate-400">
                                    {p.totalPoints} pts
                                  </span>
                                  {Object.entries(p.gwStats || {}).length > 0 && (
                                    <span className="text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                      {Object.entries(p.gwStats)
                                        .sort(([a], [b]) => Number(a) - Number(b))
                                        .map(([gwStr, st]) => {
                                          const gw = Number(gwStr);
                                          const normClub = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
                                          const fix = fpl.fixtures?.find(
                                            (f) => f.gameweek === gw && (f.homeClubId === normClub || f.awayClubId === normClub)
                                          );
                                          const isOnePrice = fix?.venue === 'one_price';
                                          const gwPts = calculatePlayerPoints(p.position, st, isOnePrice, p.id);
                                          return `(GW${gw}: ${gwPts}p)`;
                                        })
                                        .join(' ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex-shrink-0 ml-2">
                              {outPlayer ? (
                                <button
                                  onClick={() => {
                                    if (isIllegal) return;
                                    setInPlayerId(isSelectedInPlayer ? null : p.id);
                                  }}
                                  disabled={isIllegal || isSquadLocked}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                                    isSelectedInPlayer
                                      ? 'bg-emerald-500 text-slate-950 font-black'
                                      : isIllegal
                                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                      : 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-slate-950 border border-emerald-500/30'
                                  }`}
                                >
                                  {isSelectedInPlayer ? 'Selected' : 'Replace'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBuyPlayer(p.id)}
                                  disabled={isIllegal || isSquadLocked || validSquadCount >= 9}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                    validSquadCount >= 9 || isIllegal
                                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                      : 'bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-xs'
                                  }`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Buy</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No matching players found.
                    </div>
                  )
                ) : (
                    /* Class Grid View (Photo style: GKP | DEF | MID | FWD) */
                    <ClassGridView
                      players={players}
                      clubs={clubs}
                      squad={squad}
                      outPlayer={outPlayer}
                      inPlayerId={inPlayerId}
                      onSelectInPlayer={setInPlayerId}
                      onBuyPlayer={handleBuyPlayer}
                      isSquadLocked={isSquadLocked}
                      validSquadCount={validSquadCount}
                      searchQuery={searchQuery}
                      positionFilter={positionFilter}
                      affordableOnly={affordableOnly}
                    />
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SlotCardProps {
  position: Position;
  label: string;
  player?: Player;
  isOutPlayer: boolean;
  onSelectEmpty: () => void;
  onSelectPlayer: (p: Player) => void;
  onRemovePlayer: (id: string) => void;
  isLocked: boolean;
}

const SlotCard: React.FC<SlotCardProps> = ({
  position,
  label,
  player,
  isOutPlayer,
  onSelectEmpty,
  onSelectPlayer,
  onRemovePlayer,
  isLocked,
}) => {
  if (!player) {
    return (
      <button
        onClick={onSelectEmpty}
        className="w-[64px] sm:w-[88px] h-[64px] sm:h-[92px] rounded-xl sm:rounded-2xl border border-dashed border-white/40 hover:border-emerald-300 bg-white/10 dark:bg-slate-900/40 hover:bg-white/20 dark:hover:bg-emerald-500/10 flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all group active:scale-95 shadow-xs backdrop-blur-2xs"
      >
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 dark:bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white dark:text-emerald-400" />
        </div>
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/90 dark:text-slate-300 group-hover:text-emerald-200 dark:group-hover:text-emerald-400">
          {label}
        </span>
      </button>
    );
  }

  return (
    <div
      onClick={() => onSelectPlayer(player)}
      className={`relative w-[66px] sm:w-[92px] h-[68px] sm:h-[96px] rounded-xl sm:rounded-2xl cursor-pointer p-1 sm:p-1.5 flex flex-col items-center justify-between transition-all group active:scale-95 ${
        isOutPlayer
          ? 'bg-rose-500/20 border-2 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
          : 'bg-white/95 dark:bg-slate-900/85 hover:bg-white dark:hover:bg-slate-800 border border-white/70 dark:border-white/10 shadow-sm'
      }`}
    >
      {/* Quick Sell / Refund Button */}
      {!isLocked && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemovePlayer(player.id);
          }}
          title="Refund to bank"
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-xs"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}

      {/* Player Jersey Kit */}
      <KitJersey clubId={player.clubId} position={player.position} photoUrl={player.photoUrl} className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />

      {/* Player Name */}
      <span className="text-[9px] sm:text-[11px] font-extrabold truncate w-full text-center text-slate-900 dark:text-white leading-tight">
        {player.webName}
      </span>

      {/* Price Badge in Monospace Tabular Figures */}
      <PlayerPriceBadge player={player} stacked={true} className="text-[8px] sm:text-[10px] font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 -mt-0.5 justify-center" />
    </div>
  );
};
