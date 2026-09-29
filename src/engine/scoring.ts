import { Player, PlayerStats, Position, SquadPlayer, ChipType } from '../types/fpl';

/**
 * KCL Fantasy Football Scoring Engine
 * ====================================
 * Calculates raw points for a player based on their position and match stats.
 *
 * Rules:
 *  GK:  goal +7, assist +3, CS +4 (20+ min), pen save +3, MVP +3
 *  DEF: goal +6, assist +3, CS +4 (20+ min), MVP +3
 *  MID: goal +5, assist +3, CS +1 (20+ min), MVP +3
 *  FWD: goal +4, assist +3, MVP +3
 *
 *  All positions:
 *    1+ min played   → +1
 *    20+ min played  → +1 (additional, total +2)
 *    penalty miss    → -2
 *    yellow card     → -1
 *    red card        → -3
 *    own goal        → -3
 *
 *  One Price Stadium: goals and MVP reduced by 1 point, assists reduced by 2 points (+1 pt).
 */
export function calculatePlayerPoints(
  position: Position,
  stats?: Partial<PlayerStats>,
  isOnePriceStadium: boolean = false
): number {
  if (!stats) return 0;

  let points = 0;
  const minutes = stats.minutes || 0;
  const goals = stats.goals || 0;
  const assists = stats.assists || 0;

  // 1. Minutes played (KCL: +1 for 1+ min, +1 extra for 20+ min)
  if (minutes >= 20) {
    points += 2;
  } else if (minutes >= 1) {
    points += 1;
  }

  // 2. Goals scored (position-dependent, One Price Stadium reduces by 1)
  if (goals > 0) {
    let goalPts: number;
    if (position === 'GKP') {
      goalPts = 7;
    } else if (position === 'DEF') {
      goalPts = 6;
    } else if (position === 'MID') {
      goalPts = 5;
    } else {
      goalPts = 4; // FWD
    }
    if (isOnePriceStadium) goalPts -= 1;
    points += goals * goalPts;
  }

  // 3. Assists (KCL: +3 all positions, One Price Stadium: -2 pts reduction = +1 pt)
  const assistPts = isOnePriceStadium ? 1 : 3;
  points += assists * assistPts;

  // 4. Clean sheets (KCL: must play 20+ minutes)
  if (stats.cleanSheet && minutes >= 20) {
    if (position === 'GKP' || position === 'DEF') {
      points += 4;
    } else if (position === 'MID') {
      points += 1;
    }
    // FWD: 0 points for clean sheet
  }

  // 4b. Goals conceded: goalkeepers and defenders points reduced by round_down(goals_scored_against_them / 2)
  if (position === 'GKP' || position === 'DEF') {
    const conceded = Math.max(0, stats.goalsConceded || 0);
    points -= Math.floor(conceded / 2);
  }

  // 5. Penalty saved (KCL: +3 for GK only)
  if (position === 'GKP') {
    points += (stats.penaltiesSaved || 0) * 3;
  }

  // 6. Penalty missed (KCL: -2 all positions)
  points -= (stats.penaltiesMissed || 0) * 2;

  // 7. Disciplinary cards
  points -= (stats.yellowCards || 0) * 1;
  points -= (stats.redCards || 0) * 3;

  // 8. Own goals (KCL: -3)
  points -= (stats.ownGoals || 0) * 3;

  // 9. Match MVPs: 1st MVP (+3 pts), 2nd MVP (+2 pts), 3rd MVP (+1 pt)
  // (One Price Stadium reduces MVP points by 1)
  let mvpPts = 0;
  if (stats.bonus != null && stats.bonus > 0) {
    mvpPts = stats.bonus;
  } else if (stats.mvpRank != null) {
    mvpPts = stats.mvpRank === 1 ? 3 : stats.mvpRank === 2 ? 2 : stats.mvpRank === 3 ? 1 : 0;
  } else if (stats.isMVP) {
    mvpPts = 3; // Fallback for legacy single MVP
  }

  if (mvpPts > 0) {
    if (isOnePriceStadium) {
      mvpPts = Math.max(0, mvpPts - 1);
    }
    points += mvpPts;
  }

  return points;
}

export interface GameweekCalculationResult {
  totalPoints: number;
  grossPoints: number;
  transferCost: number;
  effectiveCaptainId: string;
  isTripleCaptain: boolean;
  isBenchBoost: boolean;
  isValidSquadComposition: boolean;
  invalidSquadReason?: string;
  autoSubstitutions: {
    outPlayerId: string;
    inPlayerId: string;
  }[];
  playerPointsBreakdown: Record<string, {
    rawPoints: number;
    multiplier: number;
    finalPoints: number;
    isPlayed: boolean;
    isAutoSubIn: boolean;
    isAutoSubOut: boolean;
  }>;
}

export interface SquadCompositionValidation {
  isValid: boolean;
  gkCount: number;
  defCount: number;
  midCount: number;
  fwdCount: number;
  totalCount: number;
  clubCounts?: Record<string, number>;
  exceededClubs?: { clubId: string; count: number }[];
  message?: string;
}

/**
 * Validates that each fantasy team has:
 * - Exactly 1 Goalkeeper (GK)
 * - Exactly 3 Defenders (mcveli)
 * - Exactly 3 Midfielders
 * - Exactly 2 Forwards
 * - Maximum 2 players from the same class (e.g. 11/1, 9/2)
 * (Total: 9 players). A team cannot play without these exact rules.
 */
export function validateSquadComposition(
  squadPlayers: SquadPlayer[],
  allPlayers: Record<string, Player>
): SquadCompositionValidation {
  let gkCount = 0;
  let defCount = 0;
  let midCount = 0;
  let fwdCount = 0;
  const clubCounts: Record<string, number> = {};

  for (const sp of squadPlayers) {
    const p = allPlayers[sp.playerId];
    if (!p) continue;
    if (p.position === 'GKP') gkCount++;
    else if (p.position === 'DEF') defCount++;
    else if (p.position === 'MID') midCount++;
    else if (p.position === 'FWD') fwdCount++;

    const normClub = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
    clubCounts[normClub] = (clubCounts[normClub] || 0) + 1;
  }

  const exceededClubs: { clubId: string; count: number }[] = [];
  for (const [cId, count] of Object.entries(clubCounts)) {
    if (count > 2) {
      exceededClubs.push({ clubId: cId, count });
    }
  }

  const totalCount = gkCount + defCount + midCount + fwdCount;
  const isPosValid = gkCount === 1 && defCount === 3 && midCount === 3 && fwdCount === 2;
  const isClubValid = exceededClubs.length === 0;
  const isValid = isPosValid && isClubValid;

  let message: string | undefined;
  if (!isPosValid) {
    const parts: string[] = [];
    if (gkCount !== 1) parts.push(`${gkCount}/1 GK`);
    if (defCount !== 3) parts.push(`${defCount}/3 Defenders (mcveli)`);
    if (midCount !== 3) parts.push(`${midCount}/3 Midfielders`);
    if (fwdCount !== 2) parts.push(`${fwdCount}/2 Forwards`);
    message = `Required: 1 GK, 3 Defenders (mcveli), 3 Midfielders, 2 Forwards. Current: ${parts.join(', ')}`;
  } else if (!isClubValid) {
    const clubNames = exceededClubs
      .map((ec) => `${ec.clubId.replace('SCH_', '')} (${ec.count}/2)`)
      .join(', ');
    message = `Class limit exceeded: Max 2 players allowed from the same class. Violating: ${clubNames}`;
  }

  return {
    isValid,
    gkCount,
    defCount,
    midCount,
    fwdCount,
    totalCount,
    clubCounts,
    exceededClubs,
    message,
  };
}

/**
 * Validates whether a set of players forms a legitimate 6-a-side starting lineup:
 * Exactly 1 GKP, 1-3 DEF, 1-3 MID, 1-2 FWD (Total 6 starters).
 */
export function isValidStartingXI(positions: (Position | undefined)[]): boolean {
  const cleanPos = positions.filter((p): p is Position => !!p);
  const gkCount = cleanPos.filter((p) => p === 'GKP').length;
  const defCount = cleanPos.filter((p) => p === 'DEF').length;
  const midCount = cleanPos.filter((p) => p === 'MID').length;
  const fwdCount = cleanPos.filter((p) => p === 'FWD').length;

  if (cleanPos.length === 6) {
    if (gkCount !== 1) return false;
    const formStr = `${defCount}-${midCount}-${fwdCount}`;
    return ['1-2-2', '2-1-2', '2-2-1', '1-3-1', '3-1-1'].includes(formStr);
  }

  return false;
}

/**
 * Full gameweek score calculator for a user's squad:
 * - Validates squad has exact 1 GK, 3 DEF, 3 MID, 2 FWD (cannot play otherwise)
 * - Computes raw points for each player (with One Price Stadium modifier per fixture)
 * - Applies auto-subs for 0-minute starters using bench order
 * - Applies captain (2x / 3x) and vice-captain failover
 * - Applies bench boost if active
 * - Deducts transfer penalty (-4 pts per extra transfer)
 */
export function calculateGameweekSquadPoints(
  squadPlayers: SquadPlayer[],
  allPlayers: Record<string, Player>,
  currentGW: number,
  activeChip: ChipType | null,
  transfersMadeThisGW: number,
  freeTransfers: number,
  fixtures?: { homeClubId: string; awayClubId: string; venue?: string; isFinished?: boolean; gameweek?: number }[],
  isGWFinished?: boolean
): GameweekCalculationResult {
  const compValidation = validateSquadComposition(squadPlayers, allPlayers);

  // If squad does not meet the exact 1 GK, 3 DEF, 3 MID, 2 FWD requirements, they cannot play (0 points)
  if (!compValidation.isValid) {
    const emptyBreakdown: Record<string, any> = {};
    squadPlayers.forEach((sp) => {
      emptyBreakdown[sp.playerId] = {
        rawPoints: 0,
        multiplier: 0,
        finalPoints: 0,
        isPlayed: false,
        isAutoSubIn: false,
        isAutoSubOut: false,
      };
    });

    return {
      totalPoints: 0,
      grossPoints: 0,
      transferCost: 0,
      effectiveCaptainId: '',
      isTripleCaptain: false,
      isBenchBoost: false,
      isValidSquadComposition: false,
      invalidSquadReason: compValidation.message,
      autoSubstitutions: [],
      playerPointsBreakdown: emptyBreakdown,
    };
  }

  const isTripleCaptain = activeChip === 'triple_captain';
  const isBenchBoost = activeChip === 'bench_boost';
  const isWildcard = activeChip === 'wildcard' || (activeChip as any) === 'free_hit';

  // Helper: determine if a player's fixture is at One Price Stadium
  const isPlayerOnePriceStadium = (player: Player): boolean => {
    if (!fixtures || fixtures.length === 0) return false;
    const normClub = player.clubId === 'SCH' ? 'SCH_11_5' : player.clubId;
    const fix = fixtures.find(
      (f) => f.homeClubId === normClub || f.awayClubId === normClub
    );
    return fix?.venue === 'one_price';
  };

  // Calculate raw points for all 9 players
  const rawPointsMap: Record<string, number> = {};
  const minutesMap: Record<string, number> = {};

  squadPlayers.forEach((sp) => {
    const player = allPlayers[sp.playerId];
    if (player) {
      const stats = player.gwStats[currentGW];
      const isOnePrice = isPlayerOnePriceStadium(player);
      rawPointsMap[sp.playerId] = calculatePlayerPoints(player.position, stats, isOnePrice);
      minutesMap[sp.playerId] = stats?.minutes || 0;
    } else {
      rawPointsMap[sp.playerId] = 0;
      minutesMap[sp.playerId] = 0;
    }
  });

  // Identify starters and bench
  const starters = squadPlayers.filter((p) => p.isStarter);
  const bench = squadPlayers
    .filter((p) => !p.isStarter)
    .sort((a, b) => a.benchOrder - b.benchOrder);

  // Determine if the Gameweek has ended
  // Auto-substitutions ONLY activate after the Gameweek is ended.
  let gwEnded = false;
  if (typeof isGWFinished === 'boolean') {
    gwEnded = isGWFinished;
  } else if (fixtures && fixtures.length > 0) {
    const gwFixtures = fixtures.filter((f) => f.gameweek === currentGW);
    gwEnded = gwFixtures.length > 0 && gwFixtures.every((f) => Boolean(f.isFinished));
  }

  // Auto-substitutions
  const autoSubstitutions: { outPlayerId: string; inPlayerId: string }[] = [];
  const currentStartingPlayers = [...starters];
  const usedBenchPlayerIds = new Set<string>();

  // Only perform auto-substitutions once the Gameweek is ended (and Bench Boost is not active)
  if (gwEnded && !isBenchBoost) {
    // 1. Goalkeeper auto-sub (if starter played 0 minutes)
    const starterGK = currentStartingPlayers.find(
      (sp) => allPlayers[sp.playerId]?.position === 'GKP'
    );
    if (starterGK && (minutesMap[starterGK.playerId] || 0) === 0) {
      const benchGK = bench.find(
        (bp) => allPlayers[bp.playerId]?.position === 'GKP' && (minutesMap[bp.playerId] || 0) > 0
      );
      if (benchGK) {
        const idx = currentStartingPlayers.findIndex((p) => p.playerId === starterGK.playerId);
        if (idx !== -1) {
          currentStartingPlayers[idx] = benchGK;
          usedBenchPlayerIds.add(benchGK.playerId);
          autoSubstitutions.push({
            outPlayerId: starterGK.playerId,
            inPlayerId: benchGK.playerId,
          });
        }
      }
    }

    // 2. Outfield auto-subs
    // Any starting outfield player with 0 minutes in the GW is replaced by
    // the highest priority bench player (benchOrder 1, 2, 3) who played (> 0 minutes)
    // and keeps the starting formation valid (1-2-2, 2-1-2, 2-2-1, 1-3-1, 3-1-1).
    for (let i = 0; i < currentStartingPlayers.length; i++) {
      const sp = currentStartingPlayers[i];
      const player = allPlayers[sp.playerId];
      if (player?.position !== 'GKP' && (minutesMap[sp.playerId] || 0) === 0) {
        for (const bp of bench) {
          const benchPlayer = allPlayers[bp.playerId];
          if (
            benchPlayer &&
            benchPlayer.position !== 'GKP' &&
            !usedBenchPlayerIds.has(bp.playerId) &&
            (minutesMap[bp.playerId] || 0) > 0
          ) {
            const candidateStarting = [...currentStartingPlayers];
            candidateStarting[i] = bp;
            const candidatePositions = candidateStarting.map(
              (p) => allPlayers[p.playerId]?.position
            );

            if (isValidStartingXI(candidatePositions)) {
              currentStartingPlayers[i] = bp;
              usedBenchPlayerIds.add(bp.playerId);
              autoSubstitutions.push({
                outPlayerId: sp.playerId,
                inPlayerId: bp.playerId,
              });
              break;
            }
          }
        }
      }
    }
  }

  // Captaincy logic: strictly only the captain receives double points (or 3x with Triple Captain)
  // Vice-Captain does not receive double points
  const captain = squadPlayers.find((p) => p.isCaptain);
  const effectiveCaptainId = captain ? captain.playerId : '';

  const captainMultiplier = isTripleCaptain ? 3 : 2;

  // Compute final points
  const activePlayingIds = new Set(currentStartingPlayers.map((p) => p.playerId));
  if (isBenchBoost) {
    bench.forEach((bp) => activePlayingIds.add(bp.playerId));
  }

  const playerPointsBreakdown: Record<string, any> = {};
  let grossPoints = 0;

  squadPlayers.forEach((sp) => {
    const raw = rawPointsMap[sp.playerId] || 0;
    const isStarter = activePlayingIds.has(sp.playerId);
    const isCap = sp.playerId === effectiveCaptainId;
    const multiplier = isCap ? captainMultiplier : isStarter ? 1 : 0;
    const finalPoints = raw * multiplier;

    if (multiplier > 0) {
      grossPoints += finalPoints;
    }

    const autoSubIn = autoSubstitutions.some((sub) => sub.inPlayerId === sp.playerId);
    const autoSubOut = autoSubstitutions.some((sub) => sub.outPlayerId === sp.playerId);

    playerPointsBreakdown[sp.playerId] = {
      rawPoints: raw,
      multiplier,
      finalPoints,
      isPlayed: minutesMap[sp.playerId] > 0,
      isAutoSubIn: autoSubIn,
      isAutoSubOut: autoSubOut,
    };
  });

  // Transfer cost penalty (Wildcard grants unlimited free transfers with 0 point deduction)
  let transferCost = 0;
  if (!isWildcard && transfersMadeThisGW > freeTransfers) {
    transferCost = (transfersMadeThisGW - freeTransfers) * 4;
  }

  const totalPoints = Math.max(0, grossPoints - transferCost);

  return {
    totalPoints,
    grossPoints,
    transferCost,
    effectiveCaptainId,
    isTripleCaptain,
    isBenchBoost,
    isValidSquadComposition: true,
    autoSubstitutions,
    playerPointsBreakdown,
  };
}
