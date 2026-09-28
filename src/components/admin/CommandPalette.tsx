import React, { useState, useEffect, useMemo } from 'react';
import { Player, Position, Fixture, Club, Venue } from '../../types/fpl';
import { CLUBS } from '../../data/clubs';
import { KitJersey } from '../pitch/KitJersey';
import { ClassShieldBadge } from '../common/ClassShieldBadge';
import { PlayerPriceBadge } from '../common/PlayerPriceBadge';
import { useFPL } from '../../context/FPLContext';
import { formatFixtureDate, sortFixturesByDate } from '../views/FixturesView';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Plus,
  Minus,
  Shield,
  Zap,
  Award,
  Clock,
  Check,
  AlertCircle,
  Sparkles,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
} from 'lucide-react';

interface FloatingScore {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  players?: Record<string, Player>;
  currentGW?: number;
  onUpdatePlayerStats?: (playerId: string, stats: any) => Promise<boolean>;
  onEditPlayer?: (playerId: string, data: Partial<Player>) => void;
  fixtures?: Fixture[];
  clubs?: Record<string, Club>;
  onUpdateFixture?: (fixtureId: string, data: Partial<Fixture>) => Promise<void> | void;
  initialMode?: 'players' | 'scheduler';
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  players,
  currentGW,
  onUpdatePlayerStats,
  onEditPlayer,
  fixtures,
  clubs,
  onUpdateFixture,
  initialMode = 'players',
}) => {
  // Access context as fallback
  const fpl = useFPL();
  const actualPlayers = players || fpl.players;
  const actualGW = currentGW ?? fpl.currentGW;
  const actualFixtures = fixtures || fpl.fixtures;
  const actualClubs = clubs || fpl.clubs;
  const actualUpdateFixture = onUpdateFixture || fpl.updateFixture;
  const actualUpdatePlayerStats =
    onUpdatePlayerStats ||
    (async (pId: string, s: any) => {
      await fpl.updatePlayerStats(pId, actualGW, s);
      return true;
    });
  const actualEditPlayer = onEditPlayer || fpl.editPlayer;

  const [mode, setMode] = useState<'players' | 'scheduler'>(initialMode);
  const [selectedGW, setSelectedGW] = useState<number>(actualGW);
  const [query, setQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [editingFixtureId, setEditingFixtureId] = useState<string | null>(null);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [priceInput, setPriceInput] = useState<string>('');

  // Fixture draft editing state
  const [fixtureForm, setFixtureForm] = useState<{
    date: string;
    kickoffTime: string;
    venue: Venue;
    homeScore: number | null;
    awayScore: number | null;
    isFinished: boolean;
    isLive: boolean;
  }>({
    date: '',
    kickoffTime: '',
    venue: 'delisi',
    homeScore: null,
    awayScore: null,
    isFinished: false,
    isLive: false,
  });

  // Listen for ⌘K or Ctrl+K or ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Keep selectedGW in sync when actualGW changes
  useEffect(() => {
    setSelectedGW(actualGW);
  }, [actualGW]);

  // Filter players by query
  const filteredPlayers = useMemo(() => {
    if (!query.trim()) return Object.values(actualPlayers).slice(0, 12);
    const q = query.toLowerCase().trim();
    return Object.values(actualPlayers)
      .filter((p) => {
        const club = CLUBS[p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId] || actualClubs[p.clubId];
        return (
          p.webName.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (club?.shortName && club.shortName.toLowerCase().includes(q)) ||
          p.position.toLowerCase().includes(q)
        );
      })
      .slice(0, 20);
  }, [actualPlayers, actualClubs, query]);

  // Filter fixtures for scheduler view
  const schedulerFixtures = useMemo(() => {
    const filtered = actualFixtures.filter((f) => f.gameweek === selectedGW);
    const q = query.toLowerCase().trim();
    const searched = q
      ? filtered.filter((f) => {
          const home = actualClubs[f.homeClubId] || CLUBS[f.homeClubId];
          const away = actualClubs[f.awayClubId] || CLUBS[f.awayClubId];
          return (
            f.homeClubId.toLowerCase().includes(q) ||
            f.awayClubId.toLowerCase().includes(q) ||
            (home?.name && home.name.toLowerCase().includes(q)) ||
            (home?.shortName && home.shortName.toLowerCase().includes(q)) ||
            (away?.name && away.name.toLowerCase().includes(q)) ||
            (away?.shortName && away.shortName.toLowerCase().includes(q))
          );
        })
      : filtered;

    return sortFixturesByDate(searched);
  }, [actualFixtures, selectedGW, query, actualClubs]);

  const selectedPlayer = selectedPlayerId ? actualPlayers[selectedPlayerId] : null;

  useEffect(() => {
    if (selectedPlayer) {
      setPriceInput(selectedPlayer.cost.toFixed(1));
    }
  }, [selectedPlayerId, selectedPlayer?.cost]);

  const currentStats = selectedPlayer?.gwStats[actualGW] || {
    minutes: 0,
    goals: 0,
    assists: 0,
    cleanSheet: false,
    yellowCards: 0,
    redCards: 0,
    penaltiesSaved: 0,
    penaltiesMissed: 0,
    ownGoals: 0,
    isMVP: false,
    goalsConceded: 0,
    saves: 0,
    bonus: 0,
  };

  const spawnFloatingScore = (text: string, color: string, e?: React.MouseEvent) => {
    const rect = e?.currentTarget?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top : window.innerHeight / 2;
    const id = Date.now() + Math.random();
    setFloatingScores((prev) => [
      ...prev,
      { id, text, color, x, y },
    ]);
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((item) => item.id !== id));
    }, 1100);
  };

  const handlePriceDelta = (delta: number, e: React.MouseEvent) => {
    if (!selectedPlayer || !actualEditPlayer) return;
    const nextCost = Math.max(1.0, Math.round((selectedPlayer.cost + delta) * 10) / 10);
    setPriceInput(nextCost.toFixed(1));
    actualEditPlayer(selectedPlayer.id, { cost: nextCost });
    spawnFloatingScore(
      `£${nextCost.toFixed(1)}m (${delta > 0 ? '+' : ''}${delta.toFixed(1)})`,
      delta > 0 ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950',
      e
    );
  };

  const handleDirectPriceSave = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!selectedPlayer || !actualEditPlayer) return;
    const parsed = parseFloat(priceInput);
    if (isNaN(parsed) || parsed < 1.0) return;
    const nextCost = Math.round(parsed * 10) / 10;
    setPriceInput(nextCost.toFixed(1));
    actualEditPlayer(selectedPlayer.id, { cost: nextCost });
    spawnFloatingScore(`£${nextCost.toFixed(1)}m Saved`, 'bg-emerald-500 text-slate-950', e as React.MouseEvent);
  };

  const handleStatIncrement = async (
    key: string,
    delta: number,
    pointDeltaLabel: string,
    color: string,
    e: React.MouseEvent
  ) => {
    if (!selectedPlayer) return;
    spawnFloatingScore(pointDeltaLabel, color, e);
    const updated = {
      ...currentStats,
      [key]: Math.max(0, ((currentStats as any)[key] || 0) + delta),
    };
    await actualUpdatePlayerStats(selectedPlayer.id, updated);
  };

  const handleToggleStat = async (
    key: string,
    pointDeltaLabel: string,
    color: string,
    e: React.MouseEvent
  ) => {
    if (!selectedPlayer) return;
    const currentVal = Boolean((currentStats as any)[key]);
    if (!currentVal) {
      spawnFloatingScore(pointDeltaLabel, color, e);
    }
    const updated = {
      ...currentStats,
      [key]: !currentVal,
    };
    await actualUpdatePlayerStats(selectedPlayer.id, updated);
  };

  // Fixture scheduling handlers
  const handleToggleFixtureEdit = (fix: Fixture) => {
    if (editingFixtureId === fix.id) {
      setEditingFixtureId(null);
    } else {
      setEditingFixtureId(fix.id);
      setFixtureForm({
        date: fix.date || '',
        kickoffTime: fix.kickoffTime || '',
        venue: fix.venue || 'delisi',
        homeScore: fix.homeScore ?? null,
        awayScore: fix.awayScore ?? null,
        isFinished: Boolean(fix.isFinished),
        isLive: Boolean(fix.isLive),
      });
    }
  };

  const handleSaveFixtureSchedule = async (fixId: string, e: React.MouseEvent) => {
    try {
      await actualUpdateFixture(fixId, {
        date: fixtureForm.date ? fixtureForm.date.trim() : undefined,
        kickoffTime: fixtureForm.kickoffTime ? fixtureForm.kickoffTime.trim() : 'TBD',
        venue: fixtureForm.venue,
        homeScore: fixtureForm.homeScore,
        awayScore: fixtureForm.awayScore,
        isFinished: fixtureForm.isFinished,
        isLive: fixtureForm.isLive,
      });

      const dateLabel = fixtureForm.date ? formatFixtureDate(fixtureForm.date) : 'Cleared';
      spawnFloatingScore(`📅 Saved: ${dateLabel}`, 'bg-emerald-500 text-slate-950', e);
      setEditingFixtureId(null);
    } catch (err) {
      console.error('Failed to save fixture schedule:', err);
      spawnFloatingScore('❌ Save Failed', 'bg-rose-500 text-white', e);
    }
  };

  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const getTomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Floating score / action badges */}
      {floatingScores.map((score) => (
        <motion.div
          key={score.id}
          initial={{ opacity: 1, y: 0, scale: 0.8 }}
          animate={{ opacity: 0, y: -45, scale: 1.25 }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
          style={{ left: score.x, top: score.y }}
          className={`fixed pointer-events-none z-50 -translate-x-1/2 font-black text-sm px-2.5 py-1 rounded-full shadow-lg ${score.color}`}
        >
          {score.text}
        </motion.div>
      ))}

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
      >
        {/* Command Search Input Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center gap-3 bg-zinc-950/70">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedPlayerId(null);
            }}
            placeholder={
              mode === 'scheduler'
                ? 'Search match by class or team (e.g. 11/5, 10/7, 9/1)...'
                : 'Type player nickname, name, or class (e.g. Zarno, 11/5, Gvrit)...'
            }
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-zinc-950/90 border-b border-white/10 px-3">
          <button
            type="button"
            onClick={() => {
              setMode('players');
              setSelectedPlayerId(null);
              setQuery('');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'players'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Player Quick-Tuner</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('scheduler');
              setEditingFixtureId(null);
              setQuery('');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'scheduler'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Easy Match Scheduler</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                mode === 'scheduler' ? 'bg-black/25 text-slate-950 font-black' : 'bg-white/10 text-zinc-300'
              }`}
            >
              GW {selectedGW}
            </span>
          </button>
        </div>

        {/* Sub-header for Scheduler: Gameweek Filter Pills */}
        {mode === 'scheduler' && (
          <div className="px-3 py-2 bg-zinc-950/60 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mr-1">
                GW:
              </span>
              {[1, 2, 3, 4, 5, 6, 7].map((gw) => {
                const hasScheduled = actualFixtures.filter((f) => f.gameweek === gw && f.date).length;
                return (
                  <button
                    key={gw}
                    type="button"
                    onClick={() => {
                      setSelectedGW(gw);
                      setEditingFixtureId(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors flex items-center gap-1 cursor-pointer ${
                      selectedGW === gw
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>GW {gw}</span>
                    {hasScheduled > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedGW === gw ? 'bg-slate-950' : 'bg-emerald-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 shrink-0">
              <span className="text-emerald-400 font-bold">
                {actualFixtures.filter((f) => f.gameweek === selectedGW && f.date).length}
              </span>
              <span>/</span>
              <span>{actualFixtures.filter((f) => f.gameweek === selectedGW).length} scheduled</span>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-white/[0.04]">
          {/* ================================================================= */}
          {/* TAB 1: PLAYER TUNER & STAT MODIFIER                               */}
          {/* ================================================================= */}
          {mode === 'players' && (
            <>
              {selectedPlayer ? (
                /* Rapid-Action Live Stat Modifier Card */
                <div className="space-y-4 py-2">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <KitJersey clubId={selectedPlayer.clubId} position={selectedPlayer.position} className="w-10 h-10" />
                      <div>
                        <div className="flex items-center gap-2">
                          <ClassShieldBadge clubId={selectedPlayer.clubId} size="xs" />
                          <h3 className="font-black text-base text-white">{selectedPlayer.webName}</h3>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-white/10 text-emerald-400">
                            {selectedPlayer.position}
                          </span>
                          <PlayerPriceBadge player={selectedPlayer} showDifference={true} className="text-[11px] font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded" />
                        </div>
                        <span className="text-xs text-zinc-400">{selectedPlayer.name}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPlayerId(null)}
                      className="text-xs font-bold text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
                    >
                      ← Back to Search
                    </button>
                  </div>

                  {/* Player Price Editor Row */}
                  {Boolean(actualEditPlayer) && (
                    <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          Market Price (£m)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handlePriceDelta(-0.5, e)}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono font-bold text-rose-400 transition-colors cursor-pointer"
                        >
                          -0.5
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handlePriceDelta(-0.1, e)}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono font-bold text-rose-300 transition-colors cursor-pointer"
                        >
                          -0.1
                        </button>

                        <form onSubmit={handleDirectPriceSave} className="flex items-center gap-1">
                          <div className="relative flex items-center">
                            <span className="absolute left-2 text-xs font-mono font-bold text-emerald-400">£</span>
                            <input
                              type="number"
                              step="0.1"
                              min="1.0"
                              max="20.0"
                              value={priceInput}
                              onChange={(e) => setPriceInput(e.target.value)}
                              className="w-20 pl-5 pr-4 py-1 rounded-lg bg-zinc-900 border border-emerald-500/40 text-xs font-mono font-black text-white text-center outline-none focus:border-emerald-400"
                            />
                            <span className="absolute right-1.5 text-[10px] font-mono font-bold text-zinc-400">m</span>
                          </div>
                          <button
                            type="submit"
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black transition-colors cursor-pointer"
                          >
                            Set
                          </button>
                        </form>

                        <button
                          type="button"
                          onClick={(e) => handlePriceDelta(0.1, e)}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono font-bold text-emerald-300 transition-colors cursor-pointer"
                        >
                          +0.1
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handlePriceDelta(0.5, e)}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono font-bold text-emerald-400 transition-colors cursor-pointer"
                        >
                          +0.5
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Current Match Metrics Dashboard */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-zinc-950/70 border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Goals</span>
                      <span className="font-mono text-lg font-black text-emerald-400">{currentStats.goals}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950/70 border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Assists</span>
                      <span className="font-mono text-lg font-black text-sky-400">{currentStats.assists}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950/70 border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Saves</span>
                      <span className="font-mono text-lg font-black text-amber-400">{currentStats.saves || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950/70 border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Minutes</span>
                      <span className="font-mono text-lg font-black text-white">{currentStats.minutes || 0}&apos;</span>
                    </div>
                  </div>

                  {/* Rapid Action Tactile Buttons */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Tactile Stat Increments (GW {actualGW})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {/* Goal Button Group */}
                      <div className="flex items-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 overflow-hidden">
                        <button
                          disabled={!currentStats.goals}
                          onClick={(e) =>
                            handleStatIncrement('goals', -1, '-1 Goal', 'bg-rose-500 text-white', e)
                          }
                          className="px-2 py-2.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-black text-xs disabled:opacity-30 disabled:cursor-not-allowed border-r border-emerald-500/30 transition-colors cursor-pointer"
                          title="Remove 1 Goal (-1)"
                        >
                          -1
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) =>
                            handleStatIncrement('goals', 1, `+${selectedPlayer.position === 'FWD' ? 6 : selectedPlayer.position === 'MID' ? 6 : 7} Goal`, 'bg-emerald-500 text-slate-950', e)
                          }
                          className="flex-1 p-2.5 text-emerald-300 font-black text-xs flex items-center justify-between hover:bg-emerald-500/25 transition-colors cursor-pointer"
                        >
                          <span>+ Goal</span>
                          <span className="text-[10px] font-mono opacity-80 font-bold">+{selectedPlayer.position === 'FWD' ? 6 : 7}</span>
                        </motion.button>
                      </div>

                      {/* Assist Button Group */}
                      <div className="flex items-center rounded-xl bg-sky-500/15 border border-sky-500/30 overflow-hidden">
                        <button
                          disabled={!currentStats.assists}
                          onClick={(e) =>
                            handleStatIncrement('assists', -1, '-1 Assist', 'bg-rose-500 text-white', e)
                          }
                          className="px-2 py-2.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-black text-xs disabled:opacity-30 disabled:cursor-not-allowed border-r border-sky-500/30 transition-colors cursor-pointer"
                          title="Remove 1 Assist (-1)"
                        >
                          -1
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleStatIncrement('assists', 1, '+3 Assist', 'bg-sky-500 text-slate-950', e)}
                          className="flex-1 p-2.5 text-sky-300 font-black text-xs flex items-center justify-between hover:bg-sky-500/25 transition-colors cursor-pointer"
                        >
                          <span>+ Assist</span>
                          <span className="text-[10px] font-mono opacity-80 font-bold">+3</span>
                        </motion.button>
                      </div>

                      {/* Clean Sheet Toggle */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleToggleStat('cleanSheet', '+4 Clean Sheet', 'bg-cyan-500 text-slate-950', e)}
                        className={`p-2.5 rounded-xl border font-black text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          currentStats.cleanSheet
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25'
                        }`}
                      >
                        <span>{currentStats.cleanSheet ? 'Clean Sheet ✓' : '+ Clean Sheet'}</span>
                        <span className="text-[10px] font-mono font-bold">+4</span>
                      </motion.button>

                      {/* Save Button (GKs) */}
                      <div className="flex items-center rounded-xl bg-amber-500/15 border border-amber-500/30 overflow-hidden">
                        <button
                          disabled={!currentStats.saves}
                          onClick={(e) =>
                            handleStatIncrement('saves', -1, '-1 Save', 'bg-rose-500 text-white', e)
                          }
                          className="px-2 py-2.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-black text-xs disabled:opacity-30 disabled:cursor-not-allowed border-r border-amber-500/30 transition-colors cursor-pointer"
                          title="Remove 1 Save (-1)"
                        >
                          -1
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleStatIncrement('saves', 1, '+1 Save', 'bg-amber-500 text-slate-950', e)}
                          className="flex-1 p-2.5 text-amber-300 font-black text-xs flex items-center justify-between hover:bg-amber-500/25 transition-colors cursor-pointer"
                        >
                          <span>+ Save</span>
                          <span className="text-[10px] font-mono opacity-80 font-bold">+1</span>
                        </motion.button>
                      </div>

                      {/* Yellow Card Button */}
                      <div className="flex items-center rounded-xl bg-yellow-500/15 border border-yellow-500/30 overflow-hidden">
                        <button
                          disabled={!currentStats.yellowCards}
                          onClick={(e) =>
                            handleStatIncrement('yellowCards', -1, 'Removed Yellow', 'bg-zinc-700 text-white', e)
                          }
                          className="px-2 py-2.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-black text-xs disabled:opacity-30 disabled:cursor-not-allowed border-r border-yellow-500/30 transition-colors cursor-pointer"
                          title="Remove 1 Yellow Card (-1)"
                        >
                          -1
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleStatIncrement('yellowCards', 1, '-1 Yellow', 'bg-yellow-500 text-slate-950', e)}
                          className="flex-1 p-2.5 text-yellow-300 font-black text-xs flex items-center justify-between hover:bg-yellow-500/25 transition-colors cursor-pointer"
                        >
                          <span>+ 🟨 Yellow</span>
                          <span className="text-[10px] font-mono opacity-80 font-bold">-1</span>
                        </motion.button>
                      </div>

                      {/* Red Card Button */}
                      <div className="flex items-center rounded-xl bg-rose-500/15 border border-rose-500/30 overflow-hidden">
                        <button
                          disabled={!currentStats.redCards}
                          onClick={(e) =>
                            handleStatIncrement('redCards', -1, 'Removed Red', 'bg-zinc-700 text-white', e)
                          }
                          className="px-2 py-2.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-black text-xs disabled:opacity-30 disabled:cursor-not-allowed border-r border-rose-500/30 transition-colors cursor-pointer"
                          title="Remove 1 Red Card (-1)"
                        >
                          -1
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleStatIncrement('redCards', 1, '-3 Red Card', 'bg-rose-500 text-white', e)}
                          className="flex-1 p-2.5 text-rose-300 font-black text-xs flex items-center justify-between hover:bg-rose-500/25 transition-colors cursor-pointer"
                        >
                          <span>+ 🟥 Red Card</span>
                          <span className="text-[10px] font-mono opacity-80 font-bold">-3</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : filteredPlayers.length > 0 ? (
                filteredPlayers.map((p) => {
                  const club = CLUBS[p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId] || actualClubs[p.clubId];
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlayerId(p.id)}
                      className="p-2.5 rounded-xl hover:bg-white/[0.06] cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <KitJersey clubId={p.clubId} position={p.position} className="w-8 h-8 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition-colors">
                              {p.webName}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                              {p.position}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {club?.shortName || p.clubId}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400 block">{p.name}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <PlayerPriceBadge player={p} className="text-xs font-mono font-bold text-emerald-400 block" />
                        <span className="text-[10px] font-mono text-zinc-400">
                          {p.totalPoints} pts
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No players found matching &ldquo;{query}&rdquo;.
                </div>
              )}
            </>
          )}

          {/* ================================================================= */}
          {/* TAB 2: EASY MATCH SCHEDULER                                       */}
          {/* ================================================================= */}
          {mode === 'scheduler' && (
            <div className="space-y-3 py-1">
              {schedulerFixtures.length === 0 ? (
                <div className="py-10 text-center text-xs text-zinc-500 space-y-2">
                  <Calendar className="w-8 h-8 text-zinc-600 mx-auto opacity-40" />
                  <p>No fixtures found for Gameweek {selectedGW} matching your search.</p>
                </div>
              ) : (
                schedulerFixtures.map((fix) => {
                  const homeClub =
                    actualClubs[fix.homeClubId] ||
                    CLUBS[fix.homeClubId] || {
                      name: fix.homeClubId,
                      shortName: fix.homeClubId,
                      primaryColor: '#10b981',
                    };
                  const awayClub =
                    actualClubs[fix.awayClubId] ||
                    CLUBS[fix.awayClubId] || {
                      name: fix.awayClubId,
                      shortName: fix.awayClubId,
                      primaryColor: '#3b82f6',
                    };

                  const homeName = homeClub.shortName || homeClub.name.replace(/^Team\s+/i, '');
                  const awayName = awayClub.shortName || awayClub.name.replace(/^Team\s+/i, '');
                  const isEditing = editingFixtureId === fix.id;
                  const hasDate = Boolean(fix.date);

                  return (
                    <div
                      key={fix.id}
                      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                        isEditing
                          ? 'bg-zinc-950/95 border-emerald-500/50 ring-1 ring-emerald-500/30'
                          : hasDate
                          ? 'bg-zinc-950/40 border-white/10 hover:border-white/20'
                          : 'bg-zinc-950/20 border-white/[0.06] hover:border-white/15 opacity-90'
                      }`}
                    >
                      {/* Match Card Header */}
                      <div
                        onClick={() => handleToggleFixtureEdit(fix)}
                        className="p-3 cursor-pointer hover:bg-white/[0.03] transition-colors flex items-center justify-between gap-3"
                      >
                        {/* Pairing & Teams */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {/* Home */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                                style={{ backgroundColor: homeClub.primaryColor }}
                              />
                              <span className="font-bold text-xs sm:text-sm text-white truncate">
                                {homeName}
                              </span>
                            </div>

                            <span className="text-zinc-500 text-xs font-mono font-bold">vs</span>

                            {/* Away */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                                style={{ backgroundColor: awayClub.primaryColor }}
                              />
                              <span className="font-bold text-xs sm:text-sm text-white truncate">
                                {awayName}
                              </span>
                            </div>
                          </div>

                          {/* Quick Meta Badges */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px]">
                            {/* Date Badge */}
                            {fix.date ? (
                              <span className="font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatFixtureDate(fix.date)}
                              </span>
                            ) : (
                              <span className="text-zinc-500 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-zinc-500" />
                                Date TBD
                              </span>
                            )}

                            {/* Kickoff */}
                            <span className="text-zinc-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              {fix.kickoffTime || 'TBD'}
                            </span>

                            {/* Venue */}
                            <span className="text-zinc-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-zinc-500" />
                              {fix.venue === 'one_price' ? 'One Price' : 'Delisi'}
                            </span>
                          </div>
                        </div>

                        {/* Status / Score & Edit Arrow */}
                        <div className="flex items-center gap-2 shrink-0">
                          {fix.isFinished ? (
                            <div className="px-2 py-1 rounded bg-white/10 font-mono font-black text-xs text-emerald-400 border border-white/10 text-center">
                              {fix.homeScore ?? 0} - {fix.awayScore ?? 0}
                              <span className="block text-[8px] font-bold text-zinc-400">FT</span>
                            </div>
                          ) : fix.isLive ? (
                            <div className="px-2 py-1 rounded bg-rose-500/20 font-mono font-black text-xs text-rose-400 border border-rose-500/30 text-center animate-pulse">
                              {fix.homeScore ?? 0} - {fix.awayScore ?? 0}
                              <span className="block text-[8px] font-bold text-rose-400">LIVE</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                              Upcoming
                            </span>
                          )}

                          <button
                            type="button"
                            className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                              isEditing
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                            }`}
                          >
                            {isEditing ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Inline Scheduling & Details Form */}
                      {isEditing && (
                        <div className="p-3.5 border-t border-white/10 bg-zinc-950 space-y-3.5 animate-fade-in text-xs">
                          {/* Row 1: Date Picker & Quick Presets */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-emerald-400" />
                                Match Date
                              </label>
                              {fixtureForm.date && (
                                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                                  Formatted: {formatFixtureDate(fixtureForm.date)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <input
                                type="date"
                                value={fixtureForm.date}
                                onChange={(e) =>
                                  setFixtureForm((prev) => ({ ...prev, date: e.target.value }))
                                }
                                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/15 text-white text-xs font-mono font-bold focus:border-emerald-400 outline-none"
                              />

                              {/* 1-Tap Quick Presets */}
                              <button
                                type="button"
                                onClick={() =>
                                  setFixtureForm((prev) => ({ ...prev, date: getTodayISO() }))
                                }
                                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                              >
                                Today
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFixtureForm((prev) => ({ ...prev, date: getTomorrowISO() }))
                                }
                                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                              >
                                Tomorrow
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFixtureForm((prev) => ({ ...prev, date: '2026-09-28' }))
                                }
                                className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 transition-colors cursor-pointer"
                              >
                                Sep 28
                              </button>
                              {fixtureForm.date && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFixtureForm((prev) => ({ ...prev, date: '' }))
                                  }
                                  className="px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[10px] font-bold text-rose-300 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  Clear Date
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Kickoff Time & Venue */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Kickoff */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3 text-sky-400" />
                                Kickoff Time
                              </label>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <input
                                  type="text"
                                  value={fixtureForm.kickoffTime}
                                  onChange={(e) =>
                                    setFixtureForm((prev) => ({ ...prev, kickoffTime: e.target.value }))
                                  }
                                  placeholder="e.g. 15:30"
                                  className="w-28 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/15 text-white text-xs font-mono font-bold focus:border-sky-400 outline-none"
                                />
                                {['14:00', '15:00', '16:00', '17:00'].map((timePreset) => (
                                  <button
                                    key={timePreset}
                                    type="button"
                                    onClick={() =>
                                      setFixtureForm((prev) => ({ ...prev, kickoffTime: timePreset }))
                                    }
                                    className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                                      fixtureForm.kickoffTime === timePreset
                                        ? 'bg-sky-500 text-slate-950'
                                        : 'bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10'
                                    }`}
                                  >
                                    {timePreset}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Venue */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-amber-400" />
                                Venue
                              </label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFixtureForm((prev) => ({ ...prev, venue: 'delisi' }))
                                  }
                                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                                    fixtureForm.venue !== 'one_price'
                                      ? 'bg-amber-500 text-slate-950 font-black'
                                      : 'bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10'
                                  }`}
                                >
                                  🏟️ Delisi
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFixtureForm((prev) => ({ ...prev, venue: 'one_price' }))
                                  }
                                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                                    fixtureForm.venue === 'one_price'
                                      ? 'bg-amber-500 text-slate-950 font-black'
                                      : 'bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10'
                                  }`}
                                >
                                  🏢 One Price
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Row 3: Score & Status Modifier */}
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 flex flex-wrap items-center justify-between gap-2.5">
                            {/* Status */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setFixtureForm((prev) => ({ ...prev, isFinished: false, isLive: false }))
                                }
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                  !fixtureForm.isFinished && !fixtureForm.isLive
                                    ? 'bg-white/20 text-white'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                Scheduled
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFixtureForm((prev) => ({ ...prev, isFinished: false, isLive: true }))
                                }
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                  fixtureForm.isLive
                                    ? 'bg-rose-500 text-white animate-pulse'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                LIVE
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFixtureForm((prev) => ({ ...prev, isFinished: true, isLive: false }))
                                }
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                  fixtureForm.isFinished
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                Finished (FT)
                              </button>
                            </div>

                            {/* Score Adjuster */}
                            {(fixtureForm.isFinished || fixtureForm.isLive) && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-zinc-400 font-bold">{homeName}:</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFixtureForm((p) => ({
                                        ...p,
                                        homeScore: Math.max(0, (p.homeScore || 0) - 1),
                                      }))
                                    }
                                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-black text-xs flex items-center justify-center cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-xs px-1 text-white">
                                    {fixtureForm.homeScore ?? 0}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFixtureForm((p) => ({
                                        ...p,
                                        homeScore: (p.homeScore || 0) + 1,
                                      }))
                                    }
                                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-black text-xs flex items-center justify-center cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>

                                <span className="text-zinc-500">-</span>

                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-zinc-400 font-bold">{awayName}:</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFixtureForm((p) => ({
                                        ...p,
                                        awayScore: Math.max(0, (p.awayScore || 0) - 1),
                                      }))
                                    }
                                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-black text-xs flex items-center justify-center cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-xs px-1 text-white">
                                    {fixtureForm.awayScore ?? 0}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFixtureForm((p) => ({
                                        ...p,
                                        awayScore: (p.awayScore || 0) + 1,
                                      }))
                                    }
                                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-black text-xs flex items-center justify-center cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Save Schedule Button */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingFixtureId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleSaveFixtureSchedule(fix.id, e)}
                              className="px-4 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Match Schedule</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-2.5 px-4 bg-zinc-950/90 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
          <span>
            {mode === 'scheduler'
              ? 'Matches with defined dates are pinned to the top chronologically.'
              : 'Press ESC to close or click any player to modify live stats.'}
          </span>
          <span className="font-mono font-bold text-zinc-400">GW {mode === 'scheduler' ? selectedGW : actualGW}</span>
        </div>
      </div>
    </div>
  );
};
