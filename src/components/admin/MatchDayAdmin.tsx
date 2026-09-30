import React, { useState, useMemo, useEffect } from 'react';
import { useFPL } from '../../context/FPLContext';
import { KitJersey } from '../pitch/KitJersey';
import { ClassShieldBadge } from '../common/ClassShieldBadge';
import { CLUBS } from '../../data/clubs';
import { MatchGoal, Venue, Player, Club, PlayerStats } from '../../types/fpl';
import { calculatePlayerPoints } from '../../engine/scoring';
import { adminSaveMatchEventsApi } from '../../services/api';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Plus,
  Minus,
  Crown,
  AlertCircle,
  Check,
  ChevronLeft,
  Award,
  Zap,
  Clock,
  Shield,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Building,
  MapPin,
  MoreHorizontal,
  X,
  Sparkles,
  LayoutList,
  Columns,
} from 'lucide-react';

interface FloatingPointBadge {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
}

export const MatchDayAdmin: React.FC = () => {
  const {
    fixtures,
    currentGW,
    players,
    updateFixture,
    updatePlayerStats,
    editPlayer,
  } = useFPL();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);

  // Match State
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [venue, setVenue] = useState<Venue>('delisi');

  // Match Stopwatch Timer (Default: 30 minutes)
  const [defaultMinutes, setDefaultMinutes] = useState<number>(30);
  const [matchSeconds, setMatchSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Events State
  const [goals, setGoals] = useState<(MatchGoal & { team: 'home' | 'away' })[]>([]);
  // 3 MVPs: [1st (+3 pts), 2nd (+2 pts), 3rd (+1 pt)]
  const [mvpRanking, setMvpRanking] = useState<(string | null)[]>([null, null, null]);
  const [playerMinutes, setPlayerMinutes] = useState<Record<string, number>>({});
  const [yellowCards, setYellowCards] = useState<string[]>([]);
  const [redCards, setRedCards] = useState<string[]>([]);
  const [penaltiesSaved, setPenaltiesSaved] = useState<Record<string, number>>({});
  const [penaltiesMissed, setPenaltiesMissed] = useState<Record<string, number>>({});
  const [playerAssists, setPlayerAssists] = useState<Record<string, number>>({});
  const [playerSaves, setPlayerSaves] = useState<Record<string, number>>({});

  // Floating point feedback
  const [floatingPoints, setFloatingPoints] = useState<FloatingPointBadge[]>([]);

  // Mobile active team tab ('home' | 'away' | 'both')
  const [activeTeamTab, setActiveTeamTab] = useState<'home' | 'away' | 'both'>('home');

  // View mode toggle on mobile/desktop ('table' | 'cards')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Active popovers for MVP picker or More Drawer
  const [activeMvpPickerPlayerId, setActiveMvpPickerPlayerId] = useState<string | null>(null);
  const [activeMorePlayerId, setActiveMorePlayerId] = useState<string | null>(null);

  // Active match timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setMatchSeconds((prev) => {
          if (prev >= defaultMinutes * 60) {
            setIsTimerRunning(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, defaultMinutes]);

  const currentMatchMinute = useMemo(() => {
    if (matchSeconds === 0) return 0;
    return Math.min(defaultMinutes, Math.floor(matchSeconds / 60) + (matchSeconds % 60 > 0 ? 1 : 0));
  }, [matchSeconds, defaultMinutes]);

  const formatTimerDisplay = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const fixture = fixtures.find((f) => f.id === selectedFixtureId);
  const currentFixtures = fixtures.filter((f) => f.gameweek === currentGW);

  const homeClub = fixture ? CLUBS[fixture.homeClubId] : null;
  const awayClub = fixture ? CLUBS[fixture.awayClubId] : null;

  const isOnePrice = venue === 'one_price';

  // Get players for both teams
  const matchPlayers = useMemo(() => {
    if (!fixture) return { home: [], away: [] };
    const all = Object.values(players);

    const sortByPos = (a: Player, b: Player) => {
      const order = { GKP: 1, DEF: 2, MID: 3, FWD: 4 };
      if (order[a.position] !== order[b.position]) {
        return order[a.position] - order[b.position];
      }
      return a.webName.localeCompare(b.webName);
    };

    return {
      home: all
        .filter(
          (p) =>
            p.clubId === fixture.homeClubId ||
            (p.clubId === 'SCH' && fixture.homeClubId === 'SCH_11_5') ||
            (p.clubId === 'SCH_11_5' && fixture.homeClubId === 'SCH')
        )
        .sort(sortByPos),
      away: all
        .filter(
          (p) =>
            p.clubId === fixture.awayClubId ||
            (p.clubId === 'SCH' && fixture.awayClubId === 'SCH_11_5') ||
            (p.clubId === 'SCH_11_5' && fixture.awayClubId === 'SCH')
        )
        .sort(sortByPos),
    };
  }, [fixture, players]);

  const allMatchPlayers = useMemo(() => {
    return [...matchPlayers.home, ...matchPlayers.away];
  }, [matchPlayers]);

  const spawnFloatingPoint = (text: string, color: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setFloatingPoints((prev) => [
      ...prev,
      { id, text, color, x: rect.left + rect.width / 2, y: rect.top },
    ]);
    setTimeout(() => {
      setFloatingPoints((prev) => prev.filter((item) => item.id !== id));
    }, 850);
  };

  const handleSelectFixture = (fId: string) => {
    const f = fixtures.find((x) => x.id === fId);
    if (!f) return;
    setSelectedFixtureId(fId);
    setHomeScore(f.homeScore || 0);
    setAwayScore(f.awayScore || 0);
    setVenue(f.venue === 'one_price' ? 'one_price' : (f.venue || 'delisi'));

    const homeClubId = f.homeClubId;
    const awayClubId = f.awayClubId;

    const getPlayerTeam = (playerId: string): 'home' | 'away' => {
      const pl = players[playerId];
      if (!pl) return 'home';
      const cId = pl.clubId === 'SCH' ? 'SCH_11_5' : pl.clubId;
      const awayId = awayClubId === 'SCH' ? 'SCH_11_5' : awayClubId;
      return cId === awayId ? 'away' : 'home';
    };

    const loadedGoals: (MatchGoal & { team: 'home' | 'away' })[] = (f.goalScorers || []).map((g) => ({
      ...g,
      team: getPlayerTeam(g.playerId),
    }));
    setGoals(loadedGoals);

    const all = Object.values(players);
    const fixturePlayers = all.filter((p) => {
      const cId = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
      return (
        cId === homeClubId ||
        cId === awayClubId ||
        (homeClubId === 'SCH_11_5' && cId === 'SCH') ||
        (awayClubId === 'SCH_11_5' && cId === 'SCH') ||
        (homeClubId === 'SCH' && cId === 'SCH_11_5') ||
        (awayClubId === 'SCH' && cId === 'SCH_11_5')
      );
    });

    const initialMinutes: Record<string, number> = { ...(f.playerMinutes || {}) };
    for (const p of fixturePlayers) {
      const statMins = p.gwStats?.[f.gameweek]?.minutes ?? p.gwStats?.[currentGW]?.minutes;
      if (initialMinutes[p.id] === undefined && typeof statMins === 'number' && statMins > 0) {
        initialMinutes[p.id] = statMins;
      }
    }
    for (const g of loadedGoals) {
      if (!initialMinutes[g.playerId]) initialMinutes[g.playerId] = 30;
      if (g.assistPlayerId && !initialMinutes[g.assistPlayerId]) initialMinutes[g.assistPlayerId] = 30;
    }
    setPlayerMinutes(initialMinutes);

    const initialAssists: Record<string, number> = { ...(f.playerAssists || {}) };
    for (const g of loadedGoals) {
      if (g.assistPlayerId) {
        const goalAssists = loadedGoals.filter((x) => x.assistPlayerId === g.assistPlayerId).length;
        initialAssists[g.assistPlayerId] = Math.max(initialAssists[g.assistPlayerId] || 0, goalAssists);
      }
    }
    for (const p of fixturePlayers) {
      const statAssists = p.gwStats?.[f.gameweek]?.assists ?? p.gwStats?.[currentGW]?.assists;
      if (typeof statAssists === 'number' && statAssists > 0) {
        initialAssists[p.id] = Math.max(initialAssists[p.id] || 0, statAssists);
      }
    }
    setPlayerAssists(initialAssists);

    const initialYellows: string[] = Array.isArray(f.yellowCards) ? [...f.yellowCards] : [];
    const initialReds: string[] = Array.isArray(f.redCards) ? [...f.redCards] : [];
    for (const p of fixturePlayers) {
      const statYellow = p.gwStats?.[f.gameweek]?.yellowCards ?? p.gwStats?.[currentGW]?.yellowCards;
      const statRed = p.gwStats?.[f.gameweek]?.redCards ?? p.gwStats?.[currentGW]?.redCards;
      if (statYellow && statYellow > 0 && !initialYellows.includes(p.id)) {
        initialYellows.push(p.id);
      }
      if (statRed && statRed > 0 && !initialReds.includes(p.id)) {
        initialReds.push(p.id);
      }
    }
    setYellowCards(initialYellows);
    setRedCards(initialReds);

    const initialPenSaved: Record<string, number> = { ...(f.penaltiesSaved || {}) };
    const initialPenMissed: Record<string, number> = { ...(f.penaltiesMissed || {}) };
    for (const p of fixturePlayers) {
      const statSaved = p.gwStats?.[f.gameweek]?.penaltiesSaved ?? p.gwStats?.[currentGW]?.penaltiesSaved;
      const statMissed = p.gwStats?.[f.gameweek]?.penaltiesMissed ?? p.gwStats?.[currentGW]?.penaltiesMissed;
      if (typeof statSaved === 'number' && statSaved > 0 && initialPenSaved[p.id] === undefined) {
        initialPenSaved[p.id] = statSaved;
      }
      if (typeof statMissed === 'number' && statMissed > 0 && initialPenMissed[p.id] === undefined) {
        initialPenMissed[p.id] = statMissed;
      }
    }
    setPenaltiesSaved(initialPenSaved);
    setPenaltiesMissed(initialPenMissed);

    const initialSaves: Record<string, number> = { ...(f.playerSaves || {}) };
    for (const p of fixturePlayers) {
      const statSaves = p.gwStats?.[f.gameweek]?.saves ?? p.gwStats?.[currentGW]?.saves;
      if (typeof statSaves === 'number' && statSaves > 0 && initialSaves[p.id] === undefined) {
        initialSaves[p.id] = statSaves;
      }
    }
    setPlayerSaves(initialSaves);

    const initialMvp: (string | null)[] = [null, null, null];
    if (Array.isArray(f.mvpPlayerIds)) {
      if (f.mvpPlayerIds[0]) initialMvp[0] = f.mvpPlayerIds[0];
      if (f.mvpPlayerIds[1]) initialMvp[1] = f.mvpPlayerIds[1];
      if (f.mvpPlayerIds[2]) initialMvp[2] = f.mvpPlayerIds[2];
    }
    for (const p of fixturePlayers) {
      const stat = p.gwStats?.[f.gameweek] || p.gwStats?.[currentGW];
      if (!stat) continue;
      if (stat.mvpRank === 1 || stat.bonus === 3) {
        initialMvp[0] = p.id;
      } else if (stat.mvpRank === 2 || stat.bonus === 2) {
        initialMvp[1] = p.id;
      } else if (stat.mvpRank === 3 || stat.bonus === 1) {
        initialMvp[2] = p.id;
      } else if (stat.isMVP && !initialMvp.includes(p.id)) {
        const emptyIdx = initialMvp.indexOf(null);
        if (emptyIdx !== -1) initialMvp[emptyIdx] = p.id;
      }
    }
    setMvpRanking(initialMvp);

    const minutesValues = Object.values(initialMinutes);
    const maxPlayedMinutes = minutesValues.length > 0 ? Math.max(...minutesValues) : 30;
    const resolvedDefaultMins = maxPlayedMinutes > 0 ? maxPlayedMinutes : 30;
    setDefaultMinutes(resolvedDefaultMins);

    if (f.isFinished) {
      setMatchSeconds(resolvedDefaultMins * 60);
      setIsTimerRunning(false);
    } else {
      setMatchSeconds(0);
      setIsTimerRunning(false);
    }

    setActiveTeamTab('home');
    setActiveMvpPickerPlayerId(null);
    setActiveMorePlayerId(null);
    setStep(2);
  };

  // Point values calculation based on venue
  const getGoalPoints = (pos: string) => {
    if (pos === 'GKP') return isOnePrice ? 5 : 7;
    if (pos === 'DEF') return isOnePrice ? 4 : 6;
    if (pos === 'MID') return isOnePrice ? 3 : 5;
    return isOnePrice ? 2 : 4; // FWD
  };

  const getAssistPoints = () => (isOnePrice ? 1 : 3);

  // MVP Rank & Points Helpers
  const getMvpRank = (playerId: string): 1 | 2 | 3 | null => {
    if (mvpRanking[0] === playerId) return 1;
    if (mvpRanking[1] === playerId) return 2;
    if (mvpRanking[2] === playerId) return 3;
    return null;
  };

  const getMvpPoints = (playerId: string): number => {
    const rank = getMvpRank(playerId);
    if (!rank) return 0;
    const basePts = rank === 1 ? 3 : rank === 2 ? 2 : 1;
    return isOnePrice ? Math.max(0, basePts - 1) : basePts;
  };

  const handleSetMvp = (playerId: string, targetRank: 1 | 2 | 3 | null, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMvpRanking((prev) => {
      const next: (string | null)[] = [...prev];
      // Clear player from existing slot if any
      for (let i = 0; i < 3; i++) {
        if (next[i] === playerId) next[i] = null;
      }
      if (targetRank) {
        const targetIndex = targetRank - 1;
        next[targetIndex] = playerId;
        const pts = isOnePrice ? Math.max(0, (targetRank === 1 ? 3 : targetRank === 2 ? 2 : 1) - 1) : (targetRank === 1 ? 3 : targetRank === 2 ? 2 : 1);
        if (e) {
          const medal = targetRank === 1 ? '🥇' : targetRank === 2 ? '🥈' : '🥉';
          spawnFloatingPoint(`${medal} +${pts} MVP (${targetRank})`, 'bg-amber-400 text-slate-950 font-black', e);
        }
      } else if (e) {
        spawnFloatingPoint('Removed MVP', 'bg-zinc-700 text-white font-bold', e);
      }
      return next;
    });

    if (!playerMinutes[playerId]) {
      setPlayerMinutes((prev) => ({ ...prev, [playerId]: defaultMinutes }));
    }
  };

  // Live Points Calculation for a player in this match
  const computeLivePlayerPoints = (p: Player, team: 'home' | 'away') => {
    const mins = playerMinutes[p.id] || 0;
    if (mins === 0) return 0;

    const isHome = team === 'home';
    const goalsConceded = isHome ? awayScore : homeScore;
    const cleanSheet = goalsConceded === 0;

    const pGoals = goals.filter((g) => g.playerId === p.id && !g.isOwnGoal).length;
    const pOwnGoals = goals.filter((g) => g.playerId === p.id && g.isOwnGoal).length;
    const pAssists = playerAssists[p.id] || 0;
    const pSaves = playerSaves[p.id] || 0;
    const pPenSaved = penaltiesSaved[p.id] || 0;
    const pPenMissed = penaltiesMissed[p.id] || 0;
    const pYellows = yellowCards.includes(p.id) ? 1 : 0;
    const pReds = redCards.includes(p.id) ? 1 : 0;
    const mvpRank = getMvpRank(p.id);
    const bonus = mvpRank === 1 ? 3 : mvpRank === 2 ? 2 : mvpRank === 3 ? 1 : 0;

    const stats: PlayerStats = {
      minutes: mins,
      goals: pGoals,
      assists: pAssists,
      cleanSheet: cleanSheet && mins >= 20,
      goalsConceded,
      yellowCards: pYellows,
      redCards: pReds,
      penaltiesSaved: pPenSaved,
      penaltiesMissed: pPenMissed,
      ownGoals: pOwnGoals,
      isMVP: bonus > 0,
      bonus,
      mvpRank: mvpRank ?? undefined,
      saves: pSaves,
    };

    return calculatePlayerPoints(p.position, stats, isOnePrice);
  };

  // Rapid Tactile Actions on Players
  const handleRapidGoal = (player: Player, team: 'home' | 'away', e: React.MouseEvent) => {
    const pts = getGoalPoints(player.position);
    spawnFloatingPoint(`+${pts} Goal`, 'bg-emerald-500 text-slate-950 font-black', e);

    setGoals((prev) => [
      ...prev,
      {
        playerId: player.id,
        team,
        isOwnGoal: false,
        minute: currentMatchMinute || undefined,
      },
    ]);

    if (team === 'home') setHomeScore((s) => s + 1);
    else setAwayScore((s) => s + 1);

    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleRapidAssist = (player: Player, e: React.MouseEvent) => {
    const pts = getAssistPoints();
    spawnFloatingPoint(`+${pts} Assist`, 'bg-sky-500 text-slate-950 font-black', e);
    setPlayerAssists((prev) => ({ ...prev, [player.id]: (prev[player.id] || 0) + 1 }));

    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleRapidOwnGoal = (player: Player, team: 'home' | 'away', e: React.MouseEvent) => {
    spawnFloatingPoint('-3 Own Goal', 'bg-rose-600 text-white font-black', e);
    setGoals((prev) => [
      ...prev,
      {
        playerId: player.id,
        team,
        isOwnGoal: true,
        minute: currentMatchMinute || undefined,
      },
    ]);

    if (team === 'home') setAwayScore((s) => s + 1);
    else setHomeScore((s) => s + 1);

    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleRapidMissedPen = (player: Player, e: React.MouseEvent) => {
    spawnFloatingPoint('-2 Pen Miss', 'bg-rose-500 text-white font-black', e);
    setPenaltiesMissed((prev) => ({ ...prev, [player.id]: (prev[player.id] || 0) + 1 }));

    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleRapidSavedPen = (player: Player, e: React.MouseEvent) => {
    spawnFloatingPoint('+3 Pen Save', 'bg-emerald-400 text-slate-950 font-black', e);
    setPenaltiesSaved((prev) => ({ ...prev, [player.id]: (prev[player.id] || 0) + 1 }));

    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleRapidSave = (player: Player, e: React.MouseEvent) => {
    spawnFloatingPoint('+1 Save', 'bg-amber-500 text-slate-950 font-black', e);
    setPlayerSaves((prev) => ({ ...prev, [player.id]: (prev[player.id] || 0) + 1 }));

    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleToggleCard = (playerId: string, type: 'yellow' | 'red', e: React.MouseEvent) => {
    if (type === 'yellow') {
      const isAlready = yellowCards.includes(playerId);
      if (!isAlready) spawnFloatingPoint('-1 Yellow', 'bg-yellow-500 text-slate-950 font-black', e);
      else spawnFloatingPoint('Removed Yellow', 'bg-zinc-700 text-white font-bold', e);
      setYellowCards((prev) =>
        prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
      );
    } else {
      const isAlready = redCards.includes(playerId);
      if (!isAlready) spawnFloatingPoint('-3 Red', 'bg-rose-500 text-white font-black', e);
      else spawnFloatingPoint('Removed Red', 'bg-zinc-700 text-white font-bold', e);
      setRedCards((prev) =>
        prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
      );
    }
  };

  const handleRaisePlayerPrice = (player: Player, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editPlayer) return;
    const currentCost = player.cost;
    const initialCost = player.previousCost ?? currentCost;
    const newCost = Math.max(1.0, Math.round((currentCost + delta) * 10) / 10);
    const priceChange = Math.round((newCost - initialCost) * 10) / 10;

    editPlayer(player.id, {
      cost: newCost,
      previousCost: initialCost,
      priceChange,
    });

    const diffStr = delta > 0 ? `+£${delta.toFixed(1)}m` : `-£${Math.abs(delta).toFixed(1)}m`;
    spawnFloatingPoint(
      `📈 £${currentCost.toFixed(1)}m → £${newCost.toFixed(1)}m (${diffStr})`,
      delta > 0 ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-amber-500 text-slate-950 font-black',
      e
    );
  };

  // Decrement Handlers (-1 handlers)
  const handleRemoveGoal = (player: Player, team: 'home' | 'away', e: React.MouseEvent) => {
    const hasGoal = goals.some((g) => g.playerId === player.id && !g.isOwnGoal);
    if (!hasGoal) return;

    setGoals((prev) => {
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].playerId === player.id && !prev[i].isOwnGoal) {
          return [...prev.slice(0, i), ...prev.slice(i + 1)];
        }
      }
      return prev;
    });

    if (team === 'home') setHomeScore((s) => Math.max(0, s - 1));
    else setAwayScore((s) => Math.max(0, s - 1));

    const pts = getGoalPoints(player.position);
    spawnFloatingPoint(`-1 Goal (-${pts})`, 'bg-rose-600 text-white font-black', e);
  };

  const handleRemoveOwnGoal = (player: Player, team: 'home' | 'away', e: React.MouseEvent) => {
    const hasOg = goals.some((g) => g.playerId === player.id && g.isOwnGoal);
    if (!hasOg) return;

    setGoals((prev) => {
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].playerId === player.id && prev[i].isOwnGoal) {
          return [...prev.slice(0, i), ...prev.slice(i + 1)];
        }
      }
      return prev;
    });

    if (team === 'home') setAwayScore((s) => Math.max(0, s - 1));
    else setHomeScore((s) => Math.max(0, s - 1));

    spawnFloatingPoint('-1 OG (+3)', 'bg-rose-600 text-white font-black', e);
  };

  const handleRemoveAssist = (player: Player, e: React.MouseEvent) => {
    if ((playerAssists[player.id] || 0) <= 0) return;
    const pts = getAssistPoints();
    spawnFloatingPoint(`-1 Assist (-${pts})`, 'bg-sky-600 text-white font-black', e);
    setPlayerAssists((prev) => ({
      ...prev,
      [player.id]: Math.max(0, (prev[player.id] || 0) - 1),
    }));
  };

  const handleRemoveMissedPen = (player: Player, e: React.MouseEvent) => {
    if ((penaltiesMissed[player.id] || 0) <= 0) return;
    spawnFloatingPoint('-1 Pen Miss (+2)', 'bg-emerald-600 text-white font-black', e);
    setPenaltiesMissed((prev) => ({
      ...prev,
      [player.id]: Math.max(0, (prev[player.id] || 0) - 1),
    }));
  };

  const handleRemoveSavedPen = (player: Player, e: React.MouseEvent) => {
    if ((penaltiesSaved[player.id] || 0) <= 0) return;
    spawnFloatingPoint('-1 Pen Save (-3)', 'bg-amber-600 text-white font-black', e);
    setPenaltiesSaved((prev) => ({
      ...prev,
      [player.id]: Math.max(0, (prev[player.id] || 0) - 1),
    }));
  };

  const handleRemoveGoalByIndex = (index: number) => {
    const goal = goals[index];
    if (!goal) return;

    if (goal.isOwnGoal) {
      if (goal.team === 'home') setAwayScore((s) => Math.max(0, s - 1));
      else setHomeScore((s) => Math.max(0, s - 1));
    } else {
      if (goal.team === 'home') setHomeScore((s) => Math.max(0, s - 1));
      else setAwayScore((s) => Math.max(0, s - 1));
    }

    setGoals((prev) => prev.filter((_, i) => i !== index));
  };

  // Minutes Adjustment Helpers (15-min Increments)
  const handleSetPlayerMinutes = (playerId: string, mins: number, e?: React.MouseEvent) => {
    const clamped = Math.max(0, Math.min(120, mins));
    if (e) {
      const pts = clamped >= 20 ? '+2 pts' : clamped > 0 ? '+1 pt' : '0 pts';
      spawnFloatingPoint(`${clamped}m (${pts})`, 'bg-zinc-200 text-slate-900 font-bold', e);
    }
    setPlayerMinutes((prev) => ({ ...prev, [playerId]: clamped }));
  };

  const handleStepPlayerMinutes = (playerId: string, deltaSteps: number, e?: React.MouseEvent) => {
    const cur = playerMinutes[playerId] || 0;
    const step = 15;
    const next = Math.max(0, Math.min(120, cur + deltaSteps * step));
    if (e) {
      const pts = next >= 20 ? '+2 pts' : next > 0 ? '+1 pt' : '0 pts';
      spawnFloatingPoint(`${next}m (${pts})`, 'bg-zinc-200 text-slate-900 font-bold', e);
    }
    setPlayerMinutes((prev) => ({ ...prev, [playerId]: next }));
  };

  const setAllMinutes = (mins: number) => {
    const newMins: Record<string, number> = {};
    allMatchPlayers.forEach((p) => {
      newMins[p.id] = mins;
    });
    setPlayerMinutes(newMins);
  };

  // Commit / Submit Match Results
  const handleSave = async () => {
    if (!fixture) return;

    const mvpPlayerIds = [mvpRanking[0], mvpRanking[1], mvpRanking[2]].filter(Boolean) as string[];
    const mvpBonus: Record<string, number> = {};
    if (mvpRanking[0]) mvpBonus[mvpRanking[0]] = 3;
    if (mvpRanking[1]) mvpBonus[mvpRanking[1]] = 2;
    if (mvpRanking[2]) mvpBonus[mvpRanking[2]] = 1;

    // 1. Update Fixture Details
    await updateFixture(fixture.id, {
      homeScore,
      awayScore,
      isFinished: true,
      completedAt: fixture.completedAt || new Date().toISOString(),
      date: fixture.date || new Date().toISOString().split('T')[0],
      venue,
      goalScorers: goals.map((g) => ({
        playerId: g.playerId,
        assistPlayerId: g.assistPlayerId,
        minute: g.minute,
        isOwnGoal: g.isOwnGoal,
      })),
      mvpPlayerIds,
      mvpBonus,
      playerMinutes,
      yellowCards,
      redCards,
      penaltiesSaved,
      penaltiesMissed,
      playerAssists,
      playerSaves,
    });

    // Try batch endpoint on backend
    try {
      await adminSaveMatchEventsApi({
        fixtureId: fixture.id,
        homeScore,
        awayScore,
        venue: venue === 'one_price' ? 'one_price' : 'parki',
        goalScorers: goals.map((g) => ({
          playerId: g.playerId,
          minute: g.minute,
          isOwnGoal: g.isOwnGoal,
          assistPlayerId: g.assistPlayerId,
        })),
        mvpPlayerIds,
        mvpBonus,
        playerMinutes,
        yellowCards,
        redCards,
        penaltiesSaved,
        penaltiesMissed,
        playerAssists,
        playerSaves,
      });
    } catch (err: any) {
      console.warn('Backend match-events error, fallback to context update:', err.message);
    }

    // 2. Update Player Stats in Context
    for (const p of allMatchPlayers) {
      const mins = playerMinutes[p.id] || 0;
      if (mins === 0) continue; // Skip players who didn't participate

      const pGoals = goals.filter((g) => g.playerId === p.id && !g.isOwnGoal).length;
      const pOwnGoals = goals.filter((g) => g.playerId === p.id && g.isOwnGoal).length;
      const pAssists = playerAssists[p.id] || 0;
      const pSaves = playerSaves[p.id] || 0;

      // Clean sheet calculation
      const isHome = matchPlayers.home.some((hp) => hp.id === p.id);
      const goalsConceded = isHome ? awayScore : homeScore;
      const cleanSheet = goalsConceded === 0;

      const pYellows = yellowCards.includes(p.id) ? 1 : 0;
      const pReds = redCards.includes(p.id) ? 1 : 0;
      const mvpRank = getMvpRank(p.id);
      const bonus = mvpRank === 1 ? 3 : mvpRank === 2 ? 2 : mvpRank === 3 ? 1 : 0;
      const pIsMvp = bonus > 0;
      const pPenSaved = penaltiesSaved[p.id] || 0;
      const pPenMissed = penaltiesMissed[p.id] || 0;

      updatePlayerStats(p.id, currentGW, {
        minutes: mins,
        goals: pGoals,
        assists: pAssists,
        cleanSheet: cleanSheet && mins >= 20,
        goalsConceded,
        yellowCards: pYellows,
        redCards: pReds,
        penaltiesSaved: pPenSaved,
        penaltiesMissed: pPenMissed,
        ownGoals: pOwnGoals,
        isMVP: pIsMvp,
        bonus,
        mvpRank: mvpRank ?? undefined,
        saves: pSaves,
      });
    }

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10B981', '#38BDF8', '#FBBF24'],
    });

    setStep(1);
    setSelectedFixtureId(null);
  };

  // -------------------------------------------------------------
  // STEP 1: SELECT MATCH
  // -------------------------------------------------------------
  if (step === 1) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>Matchday Command Console</span>
            </h2>
            <p className="text-xs text-zinc-400">Select a fixture to enter stats, minutes, and scores</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white/5 border border-white/10 rounded-xl text-zinc-300">
            GW {currentGW}
          </span>
        </div>

        {currentFixtures.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-900 rounded-2xl border border-white/10">
            No fixtures scheduled for Gameweek {currentGW}. Please schedule games first.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentFixtures.map((f) => {
              const home = CLUBS[f.homeClubId];
              const away = CLUBS[f.awayClubId];
              const isOnePriceVenue = f.venue === 'one_price';

              return (
                <div
                  key={f.id}
                  onClick={() => handleSelectFixture(f.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] hover:border-emerald-500/50 ${
                    f.isFinished
                      ? 'bg-zinc-900/60 border-white/5'
                      : f.isLive
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/20'
                      : 'bg-zinc-900 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 ${
                        isOnePriceVenue
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border border-white/10'
                      }`}
                    >
                      {isOnePriceVenue ? <Building className="w-3 h-3 text-amber-400" /> : <MapPin className="w-3 h-3 text-emerald-400" />}
                      <span>{isOnePriceVenue ? 'One Price Stadium' : 'Delisi Stadium'}</span>
                    </span>

                    {f.isFinished ? (
                      <span className="text-emerald-400 font-black text-[10px] uppercase">Final Result</span>
                    ) : f.isLive ? (
                      <span className="text-rose-400 font-black text-[10px] animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> LIVE
                      </span>
                    ) : (
                      <span className="text-zinc-500 font-mono text-[10px]">{f.kickoffTime}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <ClassShieldBadge clubId={f.homeClubId} size="sm" />
                      <span className="font-extrabold text-sm text-white">{home?.name}</span>
                    </div>

                    <div className="px-3 py-1 bg-zinc-950 rounded-xl border border-white/10 font-mono font-black text-sm text-white shrink-0">
                      {f.homeScore !== null ? `${f.homeScore} - ${f.awayScore}` : 'VS'}
                    </div>

                    <div className="flex items-center justify-end gap-2 flex-1 text-right">
                      <span className="font-extrabold text-sm text-white">{away?.name}</span>
                      <ClassShieldBadge clubId={f.awayClubId} size="sm" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 2: MATCH EVENTS CONSOLE
  // -------------------------------------------------------------
  if (step === 2 && fixture && homeClub && awayClub) {
    // Render an individual table row for a player
    const renderPlayerTableRow = (p: Player, team: 'home' | 'away') => {
      const pGoalCount = goals.filter((g) => g.playerId === p.id && !g.isOwnGoal).length;
      const pOwnGoalCount = goals.filter((g) => g.playerId === p.id && g.isOwnGoal).length;
      const pAssistCount = playerAssists[p.id] || 0;
      const pSaveCount = playerSaves[p.id] || 0;
      const pPenSavedCount = penaltiesSaved[p.id] || 0;
      const pPenMissedCount = penaltiesMissed[p.id] || 0;
      const pMins = playerMinutes[p.id] || 0;
      const isYellow = yellowCards.includes(p.id);
      const isRed = redCards.includes(p.id);

      const mvpRank = getMvpRank(p.id);
      const livePts = computeLivePlayerPoints(p, team);

      const isMvpPickerOpen = activeMvpPickerPlayerId === p.id;
      const isMoreDrawerOpen = activeMorePlayerId === p.id;

      return (
        <React.Fragment key={p.id}>
          <tr
            className={`border-b border-white/5 transition-colors ${
              pMins > 0 ? 'bg-zinc-900/50 hover:bg-zinc-800/60' : 'bg-zinc-950/40 opacity-60 hover:opacity-100'
            }`}
          >
            {/* 1. Player Info */}
            <td className="py-2.5 px-3">
              <div className="flex items-center gap-2">
                {p.photoUrl ? (
                  <img
                    src={p.photoUrl}
                    alt={p.webName}
                    className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0"
                  />
                ) : (
                  <KitJersey clubId={p.clubId} position={p.position} className="w-7 h-7 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-xs text-white truncate max-w-[120px] sm:max-w-none">
                      {p.webName}
                    </span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-black uppercase tracking-wider ${
                        p.position === 'FWD'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                          : p.position === 'MID'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                          : p.position === 'DEF'
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/25'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                      }`}
                    >
                      {p.position}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">£{p.cost.toFixed(1)}m</span>
                  </div>

                  {/* Active Event Badges */}
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {pOwnGoalCount > 0 && (
                      <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        OG: {pOwnGoalCount}
                      </span>
                    )}
                    {pPenMissedCount > 0 && (
                      <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        ❌ Pen
                      </span>
                    )}
                    {pPenSavedCount > 0 && (
                      <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        🧤 Pen Save
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </td>

            {/* 2. Minutes (15m increments) */}
            <td className="py-2.5 px-2 text-center">
              <div className="inline-flex items-center gap-0.5 bg-zinc-950 border border-white/10 rounded-lg p-0.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={(e) => handleStepPlayerMinutes(p.id, -1, e)}
                  className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="-15 mins"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSetPlayerMinutes(p.id, 0, e)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                    pMins === 0 ? 'bg-zinc-800 text-zinc-300 border border-white/10' : 'text-zinc-500 hover:text-white'
                  }`}
                  title="0 mins (Did not play)"
                >
                  0m
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSetPlayerMinutes(p.id, 15, e)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                    pMins === 15 ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-xs' : 'text-zinc-500 hover:text-white'
                  }`}
                  title="15 mins (+1 pt)"
                >
                  15m
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSetPlayerMinutes(p.id, 30, e)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                    pMins >= 20 ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-xs' : 'text-zinc-500 hover:text-white'
                  }`}
                  title="30 mins full match (+2 pts)"
                >
                  30m
                </button>

                <button
                  type="button"
                  onClick={(e) => handleStepPlayerMinutes(p.id, 1, e)}
                  className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="+15 mins"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </td>

            {/* 3. Goals */}
            <td className="py-2.5 px-2 text-center">
              {pGoalCount === 0 ? (
                <button
                  type="button"
                  onClick={(e) => handleRapidGoal(p, team, e)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-bold border border-emerald-500/20 transition-all text-xs cursor-pointer"
                  title={`+1 Goal (+${getGoalPoints(p.position)} pts)`}
                >
                  ⚽ +
                </button>
              ) : (
                <div className="inline-flex items-center rounded-lg bg-emerald-500/20 border border-emerald-500 overflow-hidden shadow-xs text-xs font-mono">
                  <button
                    type="button"
                    onClick={(e) => handleRemoveGoal(p, team, e)}
                    className="px-1.5 py-0.5 text-rose-300 hover:bg-rose-500 hover:text-white font-black border-r border-emerald-500/40 transition-colors cursor-pointer"
                    title="Remove 1 Goal"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRapidGoal(p, team, e)}
                    className="px-2 py-0.5 text-emerald-300 font-black hover:bg-emerald-500 hover:text-slate-950 transition-colors cursor-pointer"
                    title="Add Goal"
                  >
                    ⚽ {pGoalCount}
                  </button>
                </div>
              )}
            </td>

            {/* 4. Assists */}
            <td className="py-2.5 px-2 text-center">
              {pAssistCount === 0 ? (
                <button
                  type="button"
                  onClick={(e) => handleRapidAssist(p, e)}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500 hover:text-slate-950 text-sky-300 font-bold border border-sky-500/20 transition-all text-xs cursor-pointer"
                  title={`+1 Assist (+${getAssistPoints()} pts)`}
                >
                  👟 +
                </button>
              ) : (
                <div className="inline-flex items-center rounded-lg bg-sky-500/20 border border-sky-500 overflow-hidden shadow-xs text-xs font-mono">
                  <button
                    type="button"
                    onClick={(e) => handleRemoveAssist(p, e)}
                    className="px-1.5 py-0.5 text-rose-300 hover:bg-rose-500 hover:text-white font-black border-r border-sky-500/40 transition-colors cursor-pointer"
                    title="Remove 1 Assist"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRapidAssist(p, e)}
                    className="px-2 py-0.5 text-sky-300 font-black hover:bg-sky-500 hover:text-slate-950 transition-colors cursor-pointer"
                    title="Add Assist"
                  >
                    👟 {pAssistCount}
                  </button>
                </div>
              )}
            </td>

            {/* 5. MVP (1st, 2nd, 3rd) */}
            <td className="py-2.5 px-2 text-center relative">
              {mvpRank === 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveMvpPickerPlayerId(isMvpPickerOpen ? null : p.id)}
                  className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 border border-amber-300 font-black text-[11px] shadow-xs cursor-pointer inline-flex items-center gap-1"
                >
                  <span>🥇 1st</span>
                  <span className="text-[9px] opacity-80">(+{isOnePrice ? 2 : 3})</span>
                </button>
              ) : mvpRank === 2 ? (
                <button
                  type="button"
                  onClick={() => setActiveMvpPickerPlayerId(isMvpPickerOpen ? null : p.id)}
                  className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-950 border border-slate-300 font-black text-[11px] shadow-xs cursor-pointer inline-flex items-center gap-1"
                >
                  <span>🥈 2nd</span>
                  <span className="text-[9px] opacity-80">(+{isOnePrice ? 1 : 2})</span>
                </button>
              ) : mvpRank === 3 ? (
                <button
                  type="button"
                  onClick={() => setActiveMvpPickerPlayerId(isMvpPickerOpen ? null : p.id)}
                  className="px-2 py-0.5 rounded-lg bg-amber-700 text-white border border-amber-600 font-black text-[11px] shadow-xs cursor-pointer inline-flex items-center gap-1"
                >
                  <span>🥉 3rd</span>
                  <span className="text-[9px] opacity-80">(+{isOnePrice ? 0 : 1})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveMvpPickerPlayerId(isMvpPickerOpen ? null : p.id)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-amber-400/20 text-zinc-400 hover:text-amber-300 border border-white/10 font-bold text-xs transition-colors cursor-pointer"
                  title="Award MVP"
                >
                  ⭐ MVP
                </button>
              )}

              {/* Floating MVP Selector Popover */}
              {isMvpPickerOpen && (
                <div className="absolute z-40 top-full mt-1 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-white/20 shadow-2xl text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={(e) => {
                      handleSetMvp(p.id, 1, e);
                      setActiveMvpPickerPlayerId(null);
                    }}
                    className={`px-2 py-1 rounded-lg font-black transition-colors ${
                      mvpRank === 1 ? 'bg-amber-400 text-slate-950' : 'text-amber-300 hover:bg-amber-500/20'
                    }`}
                  >
                    🥇 1st (+{isOnePrice ? 2 : 3})
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      handleSetMvp(p.id, 2, e);
                      setActiveMvpPickerPlayerId(null);
                    }}
                    className={`px-2 py-1 rounded-lg font-black transition-colors ${
                      mvpRank === 2 ? 'bg-slate-200 text-slate-950' : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    🥈 2nd (+{isOnePrice ? 1 : 2})
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      handleSetMvp(p.id, 3, e);
                      setActiveMvpPickerPlayerId(null);
                    }}
                    className={`px-2 py-1 rounded-lg font-black transition-colors ${
                      mvpRank === 3 ? 'bg-amber-700 text-white' : 'text-amber-500 hover:bg-amber-700/20'
                    }`}
                  >
                    🥉 3rd (+{isOnePrice ? 0 : 1})
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      handleSetMvp(p.id, null, e);
                      setActiveMvpPickerPlayerId(null);
                    }}
                    className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                    title="Clear MVP"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </td>

            {/* 6. Disciplinary Cards */}
            <td className="py-2.5 px-2 text-center">
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleToggleCard(p.id, 'yellow', e)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors cursor-pointer border ${
                    isYellow
                      ? 'bg-yellow-500 text-slate-950 border-yellow-400 font-black shadow-xs'
                      : 'bg-white/5 border-white/10 text-zinc-600 hover:text-white hover:bg-white/10'
                  }`}
                  title={isYellow ? 'Remove Yellow Card' : 'Yellow Card (-1 pt)'}
                >
                  🟨
                </button>
                <button
                  type="button"
                  onClick={(e) => handleToggleCard(p.id, 'red', e)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors cursor-pointer border ${
                    isRed
                      ? 'bg-rose-500 text-white border-rose-400 font-black shadow-xs'
                      : 'bg-white/5 border-white/10 text-zinc-600 hover:text-white hover:bg-white/10'
                  }`}
                  title={isRed ? 'Remove Red Card' : 'Red Card (-3 pts)'}
                >
                  🟥
                </button>
              </div>
            </td>

            {/* 7. More (Drawer Popover) */}
            <td className="py-2.5 px-2 text-center relative">
              <button
                type="button"
                onClick={() => setActiveMorePlayerId(isMoreDrawerOpen ? null : p.id)}
                className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  isMoreDrawerOpen || pOwnGoalCount > 0 || pPenMissedCount > 0 || pPenSavedCount > 0
                    ? 'bg-white/15 text-white border-white/20'
                    : 'bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300'
                }`}
                title="Secondary events: OG, Pen Miss/Save, Price"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* Popover for secondary events */}
              {isMoreDrawerOpen && (
                <div className="absolute z-40 top-full mt-1 right-0 w-64 p-3 rounded-2xl bg-zinc-950 border border-white/20 shadow-2xl text-left text-xs space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-white/10 text-zinc-400">
                    <span className="font-bold text-white text-[11px]">{p.webName}</span>
                    <button
                      type="button"
                      onClick={() => setActiveMorePlayerId(null)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Own Goal Counter */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-300">Own Goal (-3 pts)</span>
                    <div className="inline-flex items-center rounded-lg bg-zinc-900 border border-white/10 overflow-hidden font-mono text-[10px]">
                      <button
                        type="button"
                        onClick={(e) => handleRemoveOwnGoal(p, team, e)}
                        className="px-1.5 py-0.5 text-zinc-400 hover:bg-rose-500 hover:text-white"
                      >
                        -
                      </button>
                      <span className="px-1.5 font-bold text-white">{pOwnGoalCount}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRapidOwnGoal(p, team, e)}
                        className="px-1.5 py-0.5 text-rose-300 hover:bg-rose-500 hover:text-white font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Missed Penalty Counter */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-300">Missed Penalty (-2 pts)</span>
                    <div className="inline-flex items-center rounded-lg bg-zinc-900 border border-white/10 overflow-hidden font-mono text-[10px]">
                      <button
                        type="button"
                        onClick={(e) => handleRemoveMissedPen(p, e)}
                        className="px-1.5 py-0.5 text-zinc-400 hover:bg-rose-500 hover:text-white"
                      >
                        -
                      </button>
                      <span className="px-1.5 font-bold text-white">{pPenMissedCount}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRapidMissedPen(p, e)}
                        className="px-1.5 py-0.5 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Goalkeeper Pen Save */}
                  {p.position === 'GKP' && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-emerald-300">Penalty Saved (+3 pts)</span>
                      <div className="inline-flex items-center rounded-lg bg-zinc-900 border border-white/10 overflow-hidden font-mono text-[10px]">
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSavedPen(p, e)}
                          className="px-1.5 py-0.5 text-zinc-400 hover:bg-zinc-800"
                        >
                          -
                        </button>
                        <span className="px-1.5 font-bold text-emerald-300">{pPenSavedCount}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRapidSavedPen(p, e)}
                          className="px-1.5 py-0.5 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Price Adjustment */}
                  <div className="pt-1.5 border-t border-white/10 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold block">Adjust Price (£{p.cost.toFixed(1)}m):</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleRaisePlayerPrice(p, -0.1, e)}
                        className="flex-1 py-1 rounded bg-zinc-900 border border-white/10 text-[10px] font-mono font-bold text-zinc-400 hover:text-rose-300 hover:bg-rose-500/20"
                      >
                        -0.1
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleRaisePlayerPrice(p, 0.1, e)}
                        className="flex-1 py-1 rounded bg-zinc-900 border border-white/10 text-[10px] font-mono font-bold text-emerald-400 hover:bg-emerald-500/20"
                      >
                        +0.1📈
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleRaisePlayerPrice(p, 0.5, e)}
                        className="flex-1 py-1 rounded bg-zinc-900 border border-white/10 text-[10px] font-mono font-bold text-emerald-400 hover:bg-emerald-500/20"
                      >
                        +0.5📈
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </td>

            {/* 8. Live Fantasy PTS Preview */}
            <td className="py-2.5 px-3 text-right">
              <span
                className={`inline-block px-2 py-0.5 rounded-lg text-xs font-mono font-black ${
                  livePts > 2
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : livePts > 0
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : livePts < 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {livePts > 0 ? `+${livePts}` : livePts}
              </span>
            </td>
          </tr>
        </React.Fragment>
      );
    };

    // Render team roster table
    const renderTeamTable = (teamPlayers: Player[], team: 'home' | 'away', club: Club) => {
      return (
        <div className="bg-zinc-900/90 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 border-b border-white/10 bg-zinc-950/40">
            <div className="flex items-center gap-2 min-w-0">
              <ClassShieldBadge clubId={club.id} size="sm" />
              <h3 className="font-black text-sm text-white truncate">
                {club.name} ({team === 'home' ? 'Home' : 'Away'})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-zinc-400">
                {teamPlayers.length} Players
              </span>
              <button
                type="button"
                onClick={() => {
                  const newMins = { ...playerMinutes };
                  teamPlayers.forEach((p) => {
                    newMins[p.id] = defaultMinutes;
                  });
                  setPlayerMinutes(newMins);
                }}
                className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all text-[10px] cursor-pointer"
              >
                All {defaultMinutes}m
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-zinc-950/60 text-[10px] uppercase tracking-wider text-zinc-400 font-black">
                  <th className="py-2.5 px-3 min-w-[130px]">Player</th>
                  <th className="py-2.5 px-2 text-center min-w-[125px]">Minutes (30m)</th>
                  <th className="py-2.5 px-2 text-center min-w-[70px]">Goals</th>
                  <th className="py-2.5 px-2 text-center min-w-[70px]">Assists</th>
                  <th className="py-2.5 px-2 text-center min-w-[85px]">MVP (1/2/3)</th>
                  <th className="py-2.5 px-2 text-center min-w-[65px]">Cards</th>
                  <th className="py-2.5 px-2 text-center min-w-[45px]">More</th>
                  <th className="py-2.5 px-3 text-right min-w-[45px]">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {teamPlayers.map((p) => renderPlayerTableRow(p, team))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4 animate-fade-in relative">
        {/* Floating Feedback Badges */}
        {floatingPoints.map((fp) => (
          <motion.div
            key={fp.id}
            initial={{ opacity: 1, scale: 0.8, y: 0 }}
            animate={{ opacity: 0, scale: 1.2, y: -45 }}
            transition={{ duration: 0.8 }}
            className={`fixed pointer-events-none z-50 px-2 py-0.5 rounded-full text-xs font-black shadow-lg ${fp.color}`}
            style={{ left: fp.x - 30, top: fp.y - 20 }}
          >
            {fp.text}
          </motion.div>
        ))}

        {/* TOP BAR: Nav + Stadium Toggle + Save CTA */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Change Fixture
          </button>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Table Layout"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Cards Layout"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl hover:bg-emerald-400 transition-colors shadow-md cursor-pointer"
            >
              <span>Review & Save</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STADIUM VENUE SELECTOR */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-white/10 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400">Match Venue:</span>
            <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-white/10">
              <button
                onClick={() => setVenue('delisi')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-black transition-all ${
                  !isOnePrice
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Delisi Stadium (Parki)</span>
              </button>
              <button
                onClick={() => setVenue('one_price')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-black transition-all ${
                  isOnePrice
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>One Price Stadium (-1pt)</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-400">
            {isOnePrice ? (
              <span className="text-amber-300 font-bold">Goals & Assists (-2pts), MVP (-1pt) reduction</span>
            ) : (
              <span className="text-emerald-400 font-bold">Standard Points Active</span>
            )}
          </div>
        </div>

        {/* LIVE SCOREBOARD */}
        <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900 border border-white/10 text-center space-y-3 shadow-lg">
          <div className="flex items-center justify-center gap-4 sm:gap-10">
            {/* Home Team Score Block */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="text-right">
                <span className="font-black text-sm sm:text-base text-white block">{homeClub.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono">Home</span>
              </div>
              <ClassShieldBadge clubId={homeClub.id} size="md" />
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-2xl border border-white/10">
                <button
                  onClick={() => setHomeScore((s) => Math.max(0, s - 1))}
                  className="w-7 h-7 rounded-xl bg-white/5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center font-bold text-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-9 text-2xl font-black font-mono text-emerald-400">{homeScore}</span>
                <button
                  onClick={() => setHomeScore((s) => s + 1)}
                  className="w-7 h-7 rounded-xl bg-white/5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <span className="text-xl font-black text-zinc-600 font-mono">—</span>

            {/* Away Team Score Block */}
            <div className="flex items-center gap-3 flex-1 justify-start">
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-2xl border border-white/10">
                <button
                  onClick={() => setAwayScore((s) => Math.max(0, s - 1))}
                  className="w-7 h-7 rounded-xl bg-white/5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center font-bold text-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-9 text-2xl font-black font-mono text-emerald-400">{awayScore}</span>
                <button
                  onClick={() => setAwayScore((s) => s + 1)}
                  className="w-7 h-7 rounded-xl bg-white/5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <ClassShieldBadge clubId={awayClub.id} size="md" />
              <div className="text-left">
                <span className="font-black text-sm sm:text-base text-white block">{awayClub.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono">Away</span>
              </div>
            </div>
          </div>

          {/* Goal Scorers Ribbon */}
          {goals.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2 border-t border-white/5 text-xs">
              <span className="text-[11px] font-bold text-zinc-400">Goals ({goals.length}):</span>
              {goals.map((g, idx) => {
                const scorer = players[g.playerId];
                const assist = g.assistPlayerId ? players[g.assistPlayerId] : null;
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white font-mono"
                  >
                    ⚽ <strong>{scorer?.webName || 'Goal'}</strong>
                    {g.minute ? <span className="text-zinc-400">({g.minute}&apos;)</span> : ''}
                    {g.isOwnGoal ? <span className="text-rose-400 font-bold">(OG)</span> : ''}
                    {assist ? <span className="text-sky-300 text-[10px]">asst: {assist.webName}</span> : ''}
                    <button
                      onClick={() => handleRemoveGoalByIndex(idx)}
                      className="text-zinc-500 hover:text-rose-400 font-bold ml-1 px-1 hover:bg-rose-500/20 rounded cursor-pointer transition-colors"
                      title="Delete goal entry"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* 3 MVPs PODIUM BANNER */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Match MVPs (Podium)
              </h4>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              🥇 1st: +{isOnePrice ? '2' : '3'} pts • 🥈 2nd: +{isOnePrice ? '1' : '2'} pts • 🥉 3rd: +{isOnePrice ? '0' : '1'} pt
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1st MVP */}
            <div className="p-2.5 rounded-xl border border-amber-400/40 bg-amber-500/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">🥇</span>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                    1st MVP (+{isOnePrice ? '2' : '3'} pts)
                  </span>
                  {mvpRanking[0] ? (
                    <span className="font-extrabold text-xs text-white truncate block">
                      {players[mvpRanking[0]]?.webName || players[mvpRanking[0]]?.name}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 italic block">None selected</span>
                  )}
                </div>
              </div>
              {mvpRanking[0] ? (
                <button
                  type="button"
                  onClick={() => handleSetMvp(mvpRanking[0]!, null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  title="Clear 1st MVP"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <select
                  onChange={(e) => e.target.value && handleSetMvp(e.target.value, 1)}
                  value=""
                  className="bg-zinc-950 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-zinc-300 outline-none cursor-pointer"
                >
                  <option value="">Select...</option>
                  {allMatchPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.webName} ({p.position})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 2nd MVP */}
            <div className="p-2.5 rounded-xl border border-slate-300/40 bg-slate-400/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">🥈</span>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">
                    2nd MVP (+{isOnePrice ? '1' : '2'} pts)
                  </span>
                  {mvpRanking[1] ? (
                    <span className="font-extrabold text-xs text-white truncate block">
                      {players[mvpRanking[1]]?.webName || players[mvpRanking[1]]?.name}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 italic block">None selected</span>
                  )}
                </div>
              </div>
              {mvpRanking[1] ? (
                <button
                  type="button"
                  onClick={() => handleSetMvp(mvpRanking[1]!, null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  title="Clear 2nd MVP"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <select
                  onChange={(e) => e.target.value && handleSetMvp(e.target.value, 2)}
                  value=""
                  className="bg-zinc-950 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-zinc-300 outline-none cursor-pointer"
                >
                  <option value="">Select...</option>
                  {allMatchPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.webName} ({p.position})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3rd MVP */}
            <div className="p-2.5 rounded-xl border border-amber-700/40 bg-amber-700/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">🥉</span>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
                    3rd MVP (+{isOnePrice ? '0' : '1'} pt)
                  </span>
                  {mvpRanking[2] ? (
                    <span className="font-extrabold text-xs text-white truncate block">
                      {players[mvpRanking[2]]?.webName || players[mvpRanking[2]]?.name}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 italic block">None selected</span>
                  )}
                </div>
              </div>
              {mvpRanking[2] ? (
                <button
                  type="button"
                  onClick={() => handleSetMvp(mvpRanking[2]!, null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  title="Clear 3rd MVP"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <select
                  onChange={(e) => e.target.value && handleSetMvp(e.target.value, 3)}
                  value=""
                  className="bg-zinc-950 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-zinc-300 outline-none cursor-pointer"
                >
                  <option value="">Select...</option>
                  {allMatchPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.webName} ({p.position})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* STOPWATCH & BULK MINUTES TOOLBAR */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Live Stopwatch Clock */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 font-mono">
                <Clock className={`w-4 h-4 ${isTimerRunning ? 'text-emerald-400 animate-spin' : 'text-zinc-400'}`} />
                <span className="text-base sm:text-lg font-black text-white">{formatTimerDisplay(matchSeconds)}</span>
                <span className="text-xs text-emerald-400 font-bold ml-1">
                  ({currentMatchMinute}&apos;)
                </span>
              </div>

              {/* Stopwatch Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isTimerRunning
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isTimerRunning ? 'Pause' : 'Start Timer'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setMatchSeconds(0);
                  }}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Reset Timer to 00:00"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bulk Minute Tools (30 min match length, 15m increments) */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span>Match Length:</span>
                <input
                  type="number"
                  min="15"
                  max="120"
                  step="15"
                  value={defaultMinutes}
                  onChange={(e) => setDefaultMinutes(parseInt(e.target.value) || 30)}
                  className="w-14 bg-zinc-950 border border-white/10 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs outline-none"
                />
                <span>m</span>
              </div>

              <button
                type="button"
                onClick={() => setAllMinutes(defaultMinutes)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer"
              >
                All Full Match ({defaultMinutes}m)
              </button>

              <button
                type="button"
                onClick={() => setAllMinutes(0)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-rose-400 font-bold text-xs transition-colors cursor-pointer"
              >
                Clear All (0m)
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Team Switcher Tabs */}
        <div className="flex lg:hidden items-center p-1 rounded-xl bg-zinc-900 border border-white/10 gap-1">
          <button
            type="button"
            onClick={() => setActiveTeamTab('home')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTeamTab === 'home'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ClassShieldBadge clubId={homeClub.id} size="sm" />
            <span className="truncate">{homeClub.shortName}</span>
            <span className="text-[10px] opacity-75">({matchPlayers.home.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTeamTab('away')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTeamTab === 'away'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ClassShieldBadge clubId={awayClub.id} size="sm" />
            <span className="truncate">{awayClub.shortName}</span>
            <span className="text-[10px] opacity-75">({matchPlayers.away.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTeamTab('both')}
            className={`px-3 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTeamTab === 'both'
                ? 'bg-white/20 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Both
          </button>
        </div>

        {/* ROSTERS: TABLE LAYOUT FOR EACH TEAM */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* HOME TEAM */}
          <div className={activeTeamTab === 'away' ? 'hidden lg:block' : 'block'}>
            {renderTeamTable(matchPlayers.home, 'home', homeClub)}
          </div>

          {/* AWAY TEAM */}
          <div className={activeTeamTab === 'home' ? 'hidden lg:block' : 'block'}>
            {renderTeamTable(matchPlayers.away, 'away', awayClub)}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 3: REVIEW & COMMIT MATCH
  // -------------------------------------------------------------
  if (step === 3 && fixture && homeClub && awayClub) {
    const homeCleanSheet = awayScore === 0;
    const awayCleanSheet = homeScore === 0;

    return (
      <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Console
          </button>
          <span className="text-xs font-bold text-emerald-400">Matchday Final Verification</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-4 text-center">
          <h3 className="font-black text-lg text-white">Commit Match Result</h3>

          {/* Stadium Indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-zinc-300">
            {isOnePrice ? (
              <>
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>🏢 One Price Stadium (-2 pts Goals/Assists, -1 pt MVP)</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>🏟️ Delisi Stadium (Standard Rules)</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-8 py-2">
            <div className="text-center">
              <ClassShieldBadge clubId={homeClub.id} size="md" />
              <span className="font-extrabold text-sm text-white block mt-1">{homeClub.shortName}</span>
              <span className="text-3xl font-black font-mono text-emerald-400">{homeScore}</span>
              {homeCleanSheet && (
                <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">Clean Sheet (+4 GK/DEF, +1 MID)</span>
              )}
              {awayScore >= 2 && (
                <span className="text-[10px] text-rose-400 font-bold block mt-0.5">
                  Conceded {awayScore} (-{Math.floor(awayScore / 2)} DEF/GK)
                </span>
              )}
            </div>

            <span className="text-2xl font-black text-zinc-600">—</span>

            <div className="text-center">
              <ClassShieldBadge clubId={awayClub.id} size="md" />
              <span className="font-extrabold text-sm text-white block mt-1">{awayClub.shortName}</span>
              <span className="text-3xl font-black font-mono text-emerald-400">{awayScore}</span>
              {awayCleanSheet && (
                <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">Clean Sheet (+4 GK/DEF, +1 MID)</span>
              )}
              {homeScore >= 2 && (
                <span className="text-[10px] text-rose-400 font-bold block mt-0.5">
                  Conceded {homeScore} (-{Math.floor(homeScore / 2)} DEF/GK)
                </span>
              )}
            </div>
          </div>

          {/* Match Log Summary */}
          <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-white/5 text-left text-xs text-zinc-300 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
              <strong>Goals Logged ({goals.length}):</strong>
              <span>
                {goals.filter((g) => !g.isOwnGoal).length} regular, {goals.filter((g) => g.isOwnGoal).length} own goals
              </span>
            </div>

            <div>
              <strong>3 Match MVPs:</strong>{' '}
              {mvpRanking.some(Boolean) ? (
                <span className="space-x-2">
                  {mvpRanking[0] && <span>🥇 1st: {players[mvpRanking[0]]?.webName} (+{isOnePrice ? 2 : 3} pts)</span>}
                  {mvpRanking[1] && <span>🥈 2nd: {players[mvpRanking[1]]?.webName} (+{isOnePrice ? 1 : 2} pts)</span>}
                  {mvpRanking[2] && <span>🥉 3rd: {players[mvpRanking[2]]?.webName} (+{isOnePrice ? 0 : 1} pt)</span>}
                </span>
              ) : (
                'None selected'
              )}
            </div>

            <div>
              <strong>Disciplinary Cards:</strong> {yellowCards.length} 🟨, {redCards.length} 🟥
            </div>

            <div className="pt-1 text-[11px] text-zinc-400">
              * Points for conceded goals (-1 per 2 conceded for DEF/GK), clean sheets (+4 GK/DEF, +1 MID), 3 MVPs (+3/+2/+1), and minutes (1-19m: +1, 20+m: +2) will be updated immediately.
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg active:scale-98 cursor-pointer"
          >
            Save & Update Fantasy Points
          </button>
        </div>
      </div>
    );
  }

  return null;
};
