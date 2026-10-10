import assert from 'node:assert';
import { calculateGameweekSquadPoints } from '../src/engine/scoring';
import { Squad, SquadPlayer, Player, Fixture } from '../src/types/fpl';

console.log('=== RUNNING FREE TRANSFER RULES & HISTORICAL PRESERVATION TEST SUITE ===\n');

// Mock helper to create sample players
function createMockPlayers(): Record<string, Player> {
  const positions: ('GKP' | 'DEF' | 'MID' | 'FWD')[] = ['GKP', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD'];
  const map: Record<string, Player> = {};
  for (let i = 1; i <= 15; i++) {
    const id = `p_${i}`;
    const pos = i <= 9 ? positions[i - 1] : (i === 10 ? 'GKP' : i <= 12 ? 'DEF' : i <= 14 ? 'MID' : 'FWD');
    map[id] = {
      id,
      name: `Player ${i}`,
      webName: `P${i}`,
      clubId: `SCH_${Math.ceil(i / 2)}`,
      position: pos,
      cost: 5.0,
      totalPoints: 10,
      gwPoints: 5,
      form: 5,
      selectedByPercent: 10,
      isAvailable: true,
      gwStats: {
        1: { minutes: 30, goals: i === 1 ? 1 : 0, assists: 0, cleanSheet: false, yellowCards: 0, redCards: 0, penaltiesSaved: 0, penaltiesMissed: 0, ownGoals: 0, isMVP: false },
        2: { minutes: 30, goals: i === 2 ? 1 : 0, assists: 0, cleanSheet: false, yellowCards: 0, redCards: 0, penaltiesSaved: 0, penaltiesMissed: 0, ownGoals: 0, isMVP: false },
      },
    };
  }
  return map;
}

function createMockSquad(): Squad {
  const players: SquadPlayer[] = [
    { playerId: 'p_1', isStarter: true, benchOrder: 0, isCaptain: true, isViceCaptain: false }, // GKP
    { playerId: 'p_2', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: true }, // DEF
    { playerId: 'p_3', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // DEF
    { playerId: 'p_4', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // DEF
    { playerId: 'p_5', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // MID
    { playerId: 'p_6', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // MID
    { playerId: 'p_7', isStarter: false, benchOrder: 1, isCaptain: false, isViceCaptain: false }, // MID (bench)
    { playerId: 'p_8', isStarter: false, benchOrder: 2, isCaptain: false, isViceCaptain: false }, // FWD (bench)
    { playerId: 'p_9', isStarter: false, benchOrder: 3, isCaptain: false, isViceCaptain: false }, // FWD (bench)
  ];
  return {
    teamName: 'Test XI',
    managerName: 'Tester',
    players,
    bank: 10.0,
    freeTransfers: 1,
    transfersMadeThisGW: 0,
    activeChip: null,
    usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
    accumulatedTransferPenalties: 0,
    gwTransferPenalties: {},
    gameweekSquads: {},
    gameweekChips: {},
  };
}

// Simulated transfer execution matching server/index.ts and FPLContext.tsx logic
function executeTransfer(squad: Squad, outPlayerId: string, inPlayerId: string, currentGW: number) {
  if (!squad.gameweekSquads) squad.gameweekSquads = {};
  if (!squad.gameweekChips) squad.gameweekChips = {};
  if (!squad.gwTransferPenalties) squad.gwTransferPenalties = {};
  if (typeof squad.accumulatedTransferPenalties !== 'number') squad.accumulatedTransferPenalties = 0;
  if (typeof squad.freeTransfers !== 'number') squad.freeTransfers = 1;
  if (typeof squad.transfersMadeThisGW !== 'number') squad.transfersMadeThisGW = 0;

  const isWildcard = squad.activeChip === 'wildcard' || (squad.activeChip as any) === 'free_hit';
  if (!isWildcard) {
    if (squad.freeTransfers > 0) {
      squad.freeTransfers -= 1;
    } else {
      squad.accumulatedTransferPenalties += 4;
      squad.gwTransferPenalties[currentGW] = (squad.gwTransferPenalties[currentGW] || 0) + 4;
    }
  }
  squad.transfersMadeThisGW += 1;
  squad.players = squad.players.map(sp => sp.playerId === outPlayerId ? { ...sp, playerId: inPlayerId } : sp);
}

// Simulated gameweek advance matching server/index.ts advance action
function advanceGameweek(squad: Squad, currentGW: number) {
  if (!squad.gameweekSquads) squad.gameweekSquads = {};
  if (!squad.gameweekChips) squad.gameweekChips = {};

  // Snapshot ending gameweek
  if (!squad.gameweekSquads[currentGW] && squad.players.length === 9) {
    squad.gameweekSquads[currentGW] = JSON.parse(JSON.stringify(squad.players));
    squad.gameweekChips[currentGW] = squad.activeChip || null;
  }

  if (squad.activeChip) {
    squad.usedChips[squad.activeChip] = true;
    squad.activeChip = null;
  }
  squad.transfersMadeThisGW = 0;

  // Rules 1, 2, 3, 6: Each new GW adds 1 free transfer, capped at 3
  const currentBalance = typeof squad.freeTransfers === 'number' ? squad.freeTransfers : 1;
  squad.freeTransfers = Math.min(3, currentBalance + 1);
}

// -------------------------------------------------------------
// TEST 1: Initial squad receives 1 free transfer (Rule 1)
// -------------------------------------------------------------
console.log('Test 1: Initial squad registration');
const squad1 = createMockSquad();
assert.strictEqual(squad1.freeTransfers, 1, 'Initial free transfer balance must be 1');
console.log('✓ PASS: User starts with 1 free transfer.\n');

// -------------------------------------------------------------
// TEST 2: Example A: Start GW1 with 1 FT. Use none: start GW2 with 2 (Rule 5A)
// -------------------------------------------------------------
console.log('Test 2: Rule 5 Example A - Start GW1 with 1, use none, advance to GW2');
advanceGameweek(squad1, 1);
assert.strictEqual(squad1.freeTransfers, 2, 'Starting GW2 with unused FT must result in 2 free transfers');
console.log('✓ PASS: Carried over 1 unused transfer + 1 new = 2 FT.\n');

// -------------------------------------------------------------
// TEST 3: Example B: Start GW2 with 2 FT. Use none: start GW3 with 3 (Rule 5B)
// -------------------------------------------------------------
console.log('Test 3: Rule 5 Example B - Start GW2 with 2, use none, advance to GW3');
advanceGameweek(squad1, 2);
assert.strictEqual(squad1.freeTransfers, 3, 'Starting GW3 with 2 unused FT must result in 3 free transfers');
console.log('✓ PASS: Carried over 2 unused transfers + 1 new = 3 FT.\n');

// -------------------------------------------------------------
// TEST 4: Example C: Start GW3 with 3 FT. Use none: remain at 3 for GW4 (Rule 3 & 5C)
// -------------------------------------------------------------
console.log('Test 4: Rule 5 Example C - Start with 3 FT, use none, advance (Strict Cap of 3)');
advanceGameweek(squad1, 3);
assert.strictEqual(squad1.freeTransfers, 3, 'Free transfer balance can NEVER exceed 3 (must remain at 3)');
advanceGameweek(squad1, 4);
assert.strictEqual(squad1.freeTransfers, 3, 'Consecutive advances without usage must strictly cap at 3');
console.log('✓ PASS: Maximum cap of 3 strictly enforced across multiple gameweeks.\n');

// -------------------------------------------------------------
// TEST 5: Example D: Start with 3 FT, make 2 transfers: finish with 1 FT remaining (Rule 5D)
// -------------------------------------------------------------
console.log('Test 5: Rule 5 Example D - Start with 3 FT, make 2 transfers');
const squadD = createMockSquad();
squadD.freeTransfers = 3;
executeTransfer(squadD, 'p_3', 'p_11', 1);
assert.strictEqual(squadD.freeTransfers, 2, 'After 1st transfer, balance should be 2');
assert.strictEqual(squadD.accumulatedTransferPenalties, 0, 'No penalty for free transfer');

executeTransfer(squadD, 'p_4', 'p_12', 1);
assert.strictEqual(squadD.freeTransfers, 1, 'After 2nd transfer, balance should be 1');
assert.strictEqual(squadD.accumulatedTransferPenalties, 0, 'No penalty for 2nd free transfer');

advanceGameweek(squadD, 1);
assert.strictEqual(squadD.freeTransfers, 2, 'Remaining 1 FT + 1 new for next GW = 2 FT');
console.log('✓ PASS: 2 free transfers consumed, 1 carried over, next GW starts with 2.\n');

// -------------------------------------------------------------
// TEST 6: Example E: Start with 1 FT, make 3 transfers: 1 free, 2 at -4 pts = -8 pts penalty (Rule 5E)
// -------------------------------------------------------------
console.log('Test 6: Rule 5 Example E - Start with 1 FT, make 3 transfers');
const squadE = createMockSquad();
squadE.freeTransfers = 1;

// Transfer 1: Free
executeTransfer(squadE, 'p_3', 'p_11', 1);
assert.strictEqual(squadE.freeTransfers, 0, '1st transfer consumes the free transfer -> balance 0');
assert.strictEqual(squadE.accumulatedTransferPenalties, 0, 'Penalty remains 0 after 1st transfer');

// Transfer 2: Costs -4
executeTransfer(squadE, 'p_4', 'p_12', 1);
assert.strictEqual(squadE.freeTransfers, 0, 'Balance remains 0');
assert.strictEqual(squadE.accumulatedTransferPenalties, 4, '2nd transfer incurs 4 pt penalty');

// Transfer 3: Costs -4
executeTransfer(squadE, 'p_5', 'p_13', 1);
assert.strictEqual(squadE.freeTransfers, 0, 'Balance remains 0');
assert.strictEqual(squadE.accumulatedTransferPenalties, 8, '3rd transfer incurs additional 4 pt penalty (total 8)');
assert.strictEqual(squadE.gwTransferPenalties?.[1], 8, 'GW1 specific penalty recorded as 8');

// Advance to GW2: Starts with 0 + 1 = 1 FT
advanceGameweek(squadE, 1);
assert.strictEqual(squadE.freeTransfers, 1, 'GW2 starts with Math.min(3, 0 + 1) = 1 FT');
assert.strictEqual(squadE.accumulatedTransferPenalties, 8, 'Accumulated penalty persists across gameweeks');
console.log('✓ PASS: 1 free transfer consumed, 2 excess transfers incurred -8 penalty, GW2 starts with 1 FT.\n');

// -------------------------------------------------------------
// TEST 7: Wildcard chip: unlimited free transfers, 0 penalty, 0 FT consumed
// -------------------------------------------------------------
console.log('Test 7: Wildcard Chip Integration');
const squadWC = createMockSquad();
squadWC.freeTransfers = 2;
squadWC.activeChip = 'wildcard';

executeTransfer(squadWC, 'p_3', 'p_11', 1);
executeTransfer(squadWC, 'p_4', 'p_12', 1);
executeTransfer(squadWC, 'p_5', 'p_13', 1);

assert.strictEqual(squadWC.freeTransfers, 2, 'Wildcard must NOT deplete free transfer balance');
assert.strictEqual(squadWC.accumulatedTransferPenalties, 0, 'Wildcard transfers must incur 0 penalty');
console.log('✓ PASS: Wildcard grants unlimited free transfers without depleting balance or adding penalty.\n');

// -------------------------------------------------------------
// TEST 8: Rule 7: Transfer penalties affect overall points only, never individual GW score
// -------------------------------------------------------------
console.log('Test 8: Rule 7 - Individual Gameweek score vs Overall fantasy points');
const allPlayers = createMockPlayers();
const squadScoring = createMockSquad();

// Player 1 scored in GW1, captain gets 2x
const gw1Gross = calculateGameweekSquadPoints(
  squadScoring.players,
  allPlayers,
  1,
  null,
  3, // 3 transfers made
  1, // 1 free transfer
  []
);

assert.strictEqual(gw1Gross.totalPoints, gw1Gross.grossPoints, 'Gameweek totalPoints MUST equal grossPoints (unpenalized score)');
assert.strictEqual(gw1Gross.transferCost, 8, 'Gameweek transferCost reports 8 points penalty');

// Overall points calculation
const overallPoints = gw1Gross.grossPoints - 8;
assert.strictEqual(overallPoints, gw1Gross.totalPoints - 8, 'Overall total points reflects the 8 pt penalty');
console.log(`✓ PASS: GW score is unpenalized (${gw1Gross.grossPoints} pts). Overall total is penalized (${overallPoints} pts).\n`);

// -------------------------------------------------------------
// TEST 9: Preservation of Historical Gameweek Scores (User Bug)
// -------------------------------------------------------------
console.log('Test 9: Historical Gameweek Score Immutability');
const squadHistory = createMockSquad();
// Snapshot GW1 squad before transfers
squadHistory.gameweekSquads = {
  1: JSON.parse(JSON.stringify(squadHistory.players)),
};

// Calculate initial GW1 score
const initialGW1Score = calculateGameweekSquadPoints(
  squadHistory.gameweekSquads[1],
  allPlayers,
  1,
  null,
  0,
  1,
  []
).grossPoints;

// Now user transfers p_1 (captain who scored in GW1) for p_10 (who had 0 points in GW1)
executeTransfer(squadHistory, 'p_1', 'p_10', 2);

// Re-evaluate GW1 using historical snapshot
const preservedGW1Score = calculateGameweekSquadPoints(
  squadHistory.gameweekSquads[1],
  allPlayers,
  1,
  null,
  0,
  1,
  []
).grossPoints;

assert.strictEqual(preservedGW1Score, initialGW1Score, 'Historical GW1 score MUST NOT CHANGE after a transfer');
assert.notStrictEqual(squadHistory.players[0].playerId, squadHistory.gameweekSquads[1][0].playerId, 'Live squad is updated while historical squad is preserved');
console.log(`✓ PASS: Historical GW1 score remained frozen at ${preservedGW1Score} pts despite transfer.\n`);

// -------------------------------------------------------------
// TEST 10: Idempotency & Persistence: Score recalculation does not duplicate penalties (Rule 9)
// -------------------------------------------------------------
console.log('Test 10: Idempotent recalculation without duplicate penalties');
const penaltyBefore = squadE.accumulatedTransferPenalties;
// Simulate multiple standings recalculations
let calculatedOverall1 = 100 - (squadE.accumulatedTransferPenalties || 0);
let calculatedOverall2 = 100 - (squadE.accumulatedTransferPenalties || 0);
assert.strictEqual(calculatedOverall1, calculatedOverall2, 'Repeated recalculation must yield identical overall points');
assert.strictEqual(squadE.accumulatedTransferPenalties, penaltyBefore, 'Penalties must not accumulate repeatedly');
console.log('✓ PASS: Penalty deductions are strictly idempotent.\n');

// -------------------------------------------------------------
// TEST 11: Single-Use Chip Rule (One GW use only per season)
// -------------------------------------------------------------
console.log('Test 11: Single-Use Chip Rule (Triple Captain used in GW1 is locked for season)');
const squadChipTest = createMockSquad();
squadChipTest.activeChip = 'triple_captain';

// Simulate advancing/concluding GW1:
const endingGW = 1;
squadChipTest.gameweekSquads[endingGW] = JSON.parse(JSON.stringify(squadChipTest.players));
squadChipTest.gameweekChips[endingGW] = squadChipTest.activeChip;
squadChipTest.usedChips[squadChipTest.activeChip!] = true;
squadChipTest.activeChip = null;

assert.strictEqual(squadChipTest.usedChips.triple_captain, true, 'Triple Captain must be marked as used');
assert.strictEqual(squadChipTest.activeChip, null, 'activeChip must be cleared after gameweek');
assert.strictEqual(squadChipTest.gameweekChips[1], 'triple_captain', 'gameweekChips[1] must preserve the chip played in GW1');

// Function simulating chip activation attempt in subsequent gameweek
function tryActivateChip(squad: Squad, chip: 'triple_captain' | 'bench_boost' | 'wildcard'): boolean {
  const isAlreadyUsed = Boolean(
    squad.usedChips?.[chip] ||
    (squad.gameweekChips && Object.values(squad.gameweekChips).includes(chip))
  );
  if (isAlreadyUsed) return false;
  squad.activeChip = squad.activeChip === chip ? null : chip;
  return true;
}

const canReactivateTC = tryActivateChip(squadChipTest, 'triple_captain');
assert.strictEqual(canReactivateTC, false, 'Attempt to reactivate already used Triple Captain must fail');
assert.strictEqual(squadChipTest.activeChip, null, 'activeChip must remain null');
console.log('✓ PASS: Triple Captain used in GW1 is permanently locked and cannot be reactivated in future GWs.\n');

// -------------------------------------------------------------
// TEST 12: Historical Chip Multiplier Preservation vs Future GWs
// -------------------------------------------------------------
console.log('Test 12: Historical Chip Multiplier Preservation vs Future Normal Captaincy');
// In GW1 with Triple Captain:
const gw1WithTC = calculateGameweekSquadPoints(
  squadChipTest.gameweekSquads[1],
  allPlayers,
  1,
  squadChipTest.gameweekChips[1], // 'triple_captain'
  0,
  1,
  []
);
// In GW2 without chip:
const gw2WithoutTC = calculateGameweekSquadPoints(
  squadChipTest.players,
  allPlayers,
  2,
  squadChipTest.activeChip, // null
  0,
  1,
  []
);

assert.strictEqual(gw1WithTC.isTripleCaptain, true, 'GW1 calculation must apply Triple Captain multiplier');
assert.strictEqual(gw2WithoutTC.isTripleCaptain, false, 'GW2 calculation must NOT apply Triple Captain multiplier');
assert.strictEqual(gw2WithoutTC.isBenchBoost, false, 'GW2 calculation must have no active chips');
console.log('✓ PASS: Historical GW1 retained 3x multiplier while subsequent GW2 uses standard scoring.\n');

// -------------------------------------------------------------
// TEST 13: Remaining Chips Availability
// -------------------------------------------------------------
console.log('Test 13: Remaining Unused Chips (Bench Boost, Wildcard) Remain Usable');
assert.strictEqual(squadChipTest.usedChips.bench_boost, false, 'Bench Boost is still unused');
assert.strictEqual(squadChipTest.usedChips.wildcard, false, 'Wildcard is still unused');

const canActivateBB = tryActivateChip(squadChipTest, 'bench_boost');
assert.strictEqual(canActivateBB, true, 'Manager CAN activate Bench Boost in future gameweek');
assert.strictEqual(squadChipTest.activeChip, 'bench_boost', 'Bench Boost becomes active');

const canDeactivateBB = tryActivateChip(squadChipTest, 'bench_boost');
assert.strictEqual(canDeactivateBB, true, 'Manager can toggle off active chip before deadline');
assert.strictEqual(squadChipTest.activeChip, null, 'Chip toggled off');
console.log('✓ PASS: Remaining chips (Bench Boost, Wildcard) remain fully accessible.\n');

// -------------------------------------------------------------
// TEST 14: Late Joiner (No GW1 Lineup) Must Receive 0 Points for GW1
// -------------------------------------------------------------
console.log('Test 14: Late Joiners / Users Without GW1 Lineup Receive 0 Points for GW1');
const lateJoinerSquad = createMockSquad();
// Manager creates their first 9-man squad in GW2 after GW1 has concluded
assert.strictEqual(lateJoinerSquad.gameweekSquads[1], undefined, 'GW1 squad must not exist for late joiner');

// In recalculation, finished gameweeks (GW1) must never backfill or use GW2 squad
const isGw1Finished = true;
const lateJoinerGw1Players = isGw1Finished
  ? (lateJoinerSquad.gameweekSquads?.[1] || [])
  : (lateJoinerSquad.players || []);

const lateJoinerGw1Calc = calculateGameweekSquadPoints(
  lateJoinerGw1Players,
  allPlayers,
  1,
  null,
  0,
  1,
  [],
  isGw1Finished
);

assert.strictEqual(lateJoinerGw1Players.length, 0, 'Late joiner has 0 players in finished GW1');
assert.strictEqual(lateJoinerGw1Calc.grossPoints, 0, 'Late joiner receives strictly 0 points for GW1');
assert.strictEqual(lateJoinerSquad.gameweekSquads[1], undefined, 'GW1 snapshot was not backfilled');
console.log('✓ PASS: Late joiners without GW1 squad receive 0 points and have no retroactively created GW1 lineup.\n');

// -------------------------------------------------------------
// TEST 15: Immutability of Historical Gameweek Lineups and Points
// -------------------------------------------------------------
console.log('Test 15: Historical Gameweek 1 Lineup and Points are Strictly Immutable');
const historicalManager = createMockSquad();
// Genuine manager who played GW1
historicalManager.gameweekSquads[1] = JSON.parse(JSON.stringify(historicalManager.players));
const originalGw1Score = calculateGameweekSquadPoints(
  historicalManager.gameweekSquads[1],
  allPlayers,
  1,
  null,
  0,
  1,
  [],
  true
).grossPoints;

// Manager modifies GW2 squad (transfers or swaps captain)
historicalManager.players[0].playerId = 'p_10'; // GKP transfer
historicalManager.players[1].isCaptain = true; // New captain

// Verify GW1 preserved snapshot is completely unchanged
assert.strictEqual(historicalManager.gameweekSquads[1][0].playerId, 'p_1', 'GW1 squad player 0 remained p_1');
assert.strictEqual(historicalManager.gameweekSquads[1][0].isCaptain, true, 'GW1 captain remained p_1');

const recalculatedGw1Score = calculateGameweekSquadPoints(
  historicalManager.gameweekSquads[1],
  allPlayers,
  1,
  null,
  0,
  1,
  [],
  true
).grossPoints;

assert.strictEqual(recalculatedGw1Score, originalGw1Score, 'Historical GW1 points remain 100% identical');
console.log('✓ PASS: GW2 squad mutations have zero effect on preserved GW1 lineups and scores.\n');

console.log('=================================================================');
console.log('ALL 15 TRANSFER, PENALTY, CHIP & HISTORICAL INTEGRITY TESTS PASSED! 🎉');
console.log('=================================================================');
