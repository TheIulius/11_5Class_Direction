import { Squad, SquadPlayer } from '../types/fpl';

export interface TransferAccountingResult {
  freeTransfers: number;
  transfersMadeThisGW: number;
  startFreeTransfers: number;
  currentGWPenalty: number;
  accumulatedTransferPenalties: number;
  gwTransferPenalties: Record<number, number>;
}

/**
 * Unified transfer accounting engine (Rules 1-6, 8, 9)
 * Calculates free transfer balance, penalties, and transfer counts
 * across all transfer methods (1-for-1 swaps, sell+buy, and squad saves).
 */
export function calculateSquadTransfers(
  squad: Squad,
  currentGW: number
): TransferAccountingResult {
  const currentGWKey = Number(currentGW || 1);
  const prevGW = currentGWKey - 1;

  const gwSquads = squad.gameweekSquads || {};
  const gwPenalties = { ...(squad.gwTransferPenalties || {}) };

  // Determine starting free transfers for this GW
  // Rules 1, 2, 5A, 6:
  // Managers carry over unused free transfers from previous GW + 1 new transfer for the new GW, capped at 3.
  // E.g. Start GW1 with 1 FT, use none -> start GW2 with 2 FT (Rule 5 Example A).
  let startFT: number;
  if (typeof squad.startFreeTransfers === 'number') {
    startFT = squad.startFreeTransfers;
  } else if (prevGW === 1) {
    // GW2: All managers with a valid GW1 baseline carried over 1 unused FT + 1 new FT = 2 FT
    startFT = 2;
  } else {
    startFT = Math.min(3, Math.max(1, (squad.freeTransfers || 0) + (squad.transfersMadeThisGW || 0)));
  }

  // If no previous completed GW (e.g. GW1), transfers are unlimited & free for initial squad selection
  if (prevGW < 1) {
    return {
      freeTransfers: squad.freeTransfers ?? 1,
      transfersMadeThisGW: squad.transfersMadeThisGW ?? 0,
      startFreeTransfers: startFT,
      currentGWPenalty: 0,
      accumulatedTransferPenalties: squad.accumulatedTransferPenalties || 0,
      gwTransferPenalties: gwPenalties,
    };
  }

  const baselineSquad = gwSquads[prevGW];
  // Late joiner with no previous GW baseline has unlimited free transfers until first deadline
  if (!baselineSquad || !Array.isArray(baselineSquad) || baselineSquad.length !== 9) {
    return {
      freeTransfers: squad.freeTransfers ?? 1,
      transfersMadeThisGW: squad.transfersMadeThisGW ?? 0,
      startFreeTransfers: startFT,
      currentGWPenalty: 0,
      accumulatedTransferPenalties: squad.accumulatedTransferPenalties || 0,
      gwTransferPenalties: gwPenalties,
    };
  }

  // Baseline exists with 9 players.
  // Count net player changes against baseline squad if current squad has 9 players
  const currentPlayers = squad.players || [];
  let netTransfers = 0;
  if (currentPlayers.length === 9) {
    const baselineIds = new Set(baselineSquad.map((sp: SquadPlayer) => sp.playerId));
    netTransfers = currentPlayers.filter((sp: SquadPlayer) => !baselineIds.has(sp.playerId)).length;
  }

  const totalTransfers = Math.max(squad.transfersMadeThisGW || 0, netTransfers);
  const isWildcard = squad.activeChip === 'wildcard' || (squad.activeChip as any) === 'free_hit';

  let freeTransfers: number;
  let currentGWPenalty: number;

  if (isWildcard) {
    freeTransfers = startFT;
    currentGWPenalty = 0;
  } else {
    const consumed = Math.min(startFT, totalTransfers);
    const excess = Math.max(0, totalTransfers - startFT);
    freeTransfers = Math.max(0, startFT - consumed);
    currentGWPenalty = excess * 4;
  }

  gwPenalties[currentGWKey] = currentGWPenalty;

  let accumulatedPenalties = 0;
  for (const pen of Object.values(gwPenalties)) {
    accumulatedPenalties += Number(pen || 0);
  }

  return {
    freeTransfers,
    transfersMadeThisGW: totalTransfers,
    startFreeTransfers: startFT,
    currentGWPenalty,
    accumulatedTransferPenalties: accumulatedPenalties,
    gwTransferPenalties: gwPenalties,
  };
}

/**
 * Mutates/synchronizes manager.squad with updated transfer accounting.
 */
export function applyTransferAccountingToManager(manager: any, currentGW: number) {
  if (!manager || !manager.squad) return;
  const result = calculateSquadTransfers(manager.squad, currentGW);
  manager.squad.freeTransfers = result.freeTransfers;
  manager.squad.transfersMadeThisGW = result.transfersMadeThisGW;
  manager.squad.startFreeTransfers = result.startFreeTransfers;
  manager.squad.gwTransferPenalties = result.gwTransferPenalties;
  manager.squad.accumulatedTransferPenalties = result.accumulatedTransferPenalties;
}
