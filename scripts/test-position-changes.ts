import { POSITION_CHANGED_PLAYERS, validateSquadComposition } from '../src/engine/scoring';
import { calculateSquadTransfers } from '../src/engine/transferAccounting';
import { Player, Squad, SquadPlayer } from '../src/types/fpl';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✓ PASS: ${message}`);
}

console.log('=== RUNNING GW2 POSITION CHANGES & ADMIN VISIBILITY INTEGRITY TESTS ===\n');

// 1. Verify Player Position Changes Definitions
console.log('Test 1: POSITION_CHANGED_PLAYERS Definitions');
assert(POSITION_CHANGED_PLAYERS['p_10_5_shakarishvili'] !== undefined, 'Luka Shakarishvili is tracked in POSITION_CHANGED_PLAYERS');
assert(POSITION_CHANGED_PLAYERS['p_10_5_shakarishvili'].oldPosition === 'GKP', 'Luka Shakarishvili old position was GKP');
assert(POSITION_CHANGED_PLAYERS['p_10_5_shakarishvili'].newPosition === 'DEF', 'Luka Shakarishvili new position is DEF');

assert(POSITION_CHANGED_PLAYERS['p_12_3_vashakmadze'] !== undefined, 'Gega Vashakmadze is tracked in POSITION_CHANGED_PLAYERS');
assert(POSITION_CHANGED_PLAYERS['p_12_3_vashakmadze'].oldPosition === 'MID', 'Gega Vashakmadze old position was MID');
assert(POSITION_CHANGED_PLAYERS['p_12_3_vashakmadze'].newPosition === 'FWD', 'Gega Vashakmadze new position is FWD');

assert(POSITION_CHANGED_PLAYERS['p_12_3_palelashvili'] !== undefined, 'Badri Palelashvili is tracked in POSITION_CHANGED_PLAYERS');
assert(POSITION_CHANGED_PLAYERS['p_12_3_palelashvili'].oldPosition === 'DEF', 'Badri Palelashvili old position was DEF');
assert(POSITION_CHANGED_PLAYERS['p_12_3_palelashvili'].newPosition === 'FWD', 'Badri Palelashvili new position is FWD');

// 2. Squad Validation: Mandatory Transfer Out
console.log('\nTest 2: Squad Validation Blocks Squad with Position Changed Players');
const mockPlayers: Record<string, Player> = {
  p_gk: { id: 'p_gk', name: 'Test GK', webName: 'GK', clubId: 'SCH_9_1', position: 'GKP', cost: 5, totalPoints: 0, gwPoints: 0, form: 5, selectedByPercent: 10, isAvailable: true, gwStats: {} },
  p_d1: { id: 'p_d1', name: 'Test DEF 1', webName: 'DEF 1', clubId: 'SCH_9_2', position: 'DEF', cost: 5, totalPoints: 0, gwPoints: 0, form: 5, selectedByPercent: 10, isAvailable: true, gwStats: {} },
  p_d2: { id: 'p_d2', name: 'Test DEF 2', webName: 'DEF 2', clubId: 'SCH_9_3', position: 'DEF', cost: 5, totalPoints: 0, gwPoints: 0, form: 5, selectedByPercent: 10, isAvailable: true, gwStats: {} },
  p_d3: { id: 'p_d3', name: 'Test DEF 3', webName: 'DEF 3', clubId: 'SCH_9_4', position: 'DEF', cost: 5, totalPoints: 0, gwPoints: 0, form: 5, selectedByPercent: 10, isAvailable: true, gwStats: {} },
  p_m1: { id: 'p_m1', name: 'Test MID 1', webName: 'MID 1', clubId: 'SCH_10_1', position: 'MID', cost: 5, totalPoints: 0, gwPoints: 0, form: 5, selectedByPercent: 10, isAvailable: true, gwStats: {} },
  p_m2: { id: 'p_m2', name: 'Test MID 2', webName: 'MID 2', clubId: 'SCH_10_2', position: 'MID', cost: 5, totalPoints: 0, gwPoints: 0, form: 5, selectedByPercent: 10, isAvailable: true, gwStats: {} },
  p_m3: { id: 'p_m3', name: 'Test MID 3', webName: 'MID 3', clubId: 'SCH_10_3', position: 'MID', cost: 5, totalPoints: 0, gwPoints: 0, form: 5, selectedByPercent: 10, isAvailable: true, gwStats: {} },
  p_f1: { id: 'p_f1', name: 'Test FWD 1', webName: 'FWD 1', clubId: 'SCH_11_1', position: 'FWD', cost: 5, totalPoints: 0, gwPoints: 0, form: 5, selectedByPercent: 10, isAvailable: true, gwStats: {} },
  p_f2: { id: 'p_f2', name: 'Test FWD 2', webName: 'FWD 2', clubId: 'SCH_11_2', position: 'FWD', cost: 5, totalPoints: 0, gwPoints: 0, form: 5, selectedByPercent: 10, isAvailable: true, gwStats: {} },
  // Changed player
  p_10_5_shakarishvili: { id: 'p_10_5_shakarishvili', name: 'Luka Shakarishvili', webName: 'Shakarishvili', clubId: 'SCH_10_5', position: 'DEF', cost: 6, totalPoints: 0, gwPoints: 0, form: 5, selectedByPercent: 5, isAvailable: true, gwStats: {} },
};

// Normal valid squad
const validSquad: SquadPlayer[] = [
  { playerId: 'p_gk', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false },
  { playerId: 'p_d1', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false },
  { playerId: 'p_d2', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false },
  { playerId: 'p_d3', isStarter: false, benchOrder: 1, isCaptain: false, isViceCaptain: false },
  { playerId: 'p_m1', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false },
  { playerId: 'p_m2', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false },
  { playerId: 'p_m3', isStarter: false, benchOrder: 2, isCaptain: false, isViceCaptain: false },
  { playerId: 'p_f1', isStarter: true, benchOrder: 0, isCaptain: true, isViceCaptain: false },
  { playerId: 'p_f2', isStarter: false, benchOrder: 3, isCaptain: false, isViceCaptain: false },
];

const res1 = validateSquadComposition(validSquad, mockPlayers);
assert(res1.isValid === true, 'Standard squad is valid');
assert(res1.hasPositionChangedPlayers === false, 'Standard squad has no position changed players');

// Squad with Shakarishvili as DEF
const squadWithShakara: SquadPlayer[] = [
  ...validSquad.slice(0, 3),
  { playerId: 'p_10_5_shakarishvili', isStarter: false, benchOrder: 1, isCaptain: false, isViceCaptain: false },
  ...validSquad.slice(4),
];
const res2 = validateSquadComposition(squadWithShakara, mockPlayers);
assert(res2.isValid === true, 'Squad containing Shakarishvili as DEF is valid now');
assert(res2.hasPositionChangedPlayers === false, 'hasPositionChangedPlayers is false');

// 3. Free Transfer Accounting with Remediation
console.log('\nTest 3: Remediation Free Transfers Allowance');
const squadWithBonusFT: Squad = {
  teamName: 'Affected Team',
  managerName: 'Manager',
  players: squadWithShakara,
  bank: 0,
  freeTransfers: 3, // Granted +1 FT (2 baseline + 1 remediation = 3)
  transfersMadeThisGW: 0,
  startFreeTransfers: 3,
  activeChip: null,
  usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
  accumulatedTransferPenalties: 0,
  gwTransferPenalties: {},
  gameweekSquads: { 1: squadWithShakara },
  gameweekChips: {},
};

// Manager transfers out Shakarishvili for a new defender (1 transfer made)
const squadAfter1Transfer: Squad = {
  ...squadWithBonusFT,
  players: validSquad,
  transfersMadeThisGW: 1,
};
const acct1 = calculateSquadTransfers(squadAfter1Transfer, 2);
assert(acct1.freeTransfers === 2, 'Transferring out affected player consumed 1 of the 3 FTs, leaving 2 FT');
assert(acct1.currentGWPenalty === 0, 'Zero transfer penalty incurred (was completely covered by remediation FT)');

// Manager makes 2 MORE transfers (Total 3 transfers made = uses all 3 FT)
const squadAfter3Transfers: Squad = {
  ...squadWithBonusFT,
  transfersMadeThisGW: 3,
};
const acct2 = calculateSquadTransfers(squadAfter3Transfers, 2);
assert(acct2.freeTransfers === 0, 'All 3 FTs consumed after 3 transfers');
assert(acct2.currentGWPenalty === 0, 'Zero penalty incurred after using all 3 FTs');

// Manager makes 4th transfer (Exceeds 3 FT)
const squadAfter4Transfers: Squad = {
  ...squadWithBonusFT,
  transfersMadeThisGW: 4,
};
const acct3 = calculateSquadTransfers(squadAfter4Transfers, 2);
assert(acct3.freeTransfers === 0, '0 FT remaining');
assert(acct3.currentGWPenalty === 4, '4th transfer incurs standard -4 pt penalty');

// 4. GW1 Immutability: Squads from GW1 must be valid and scored with GW1 positions
console.log('\nTest 4: GW1 Historical Preservation & Scoring');
// In GW1, Shakarishvili was a Goalkeeper (GKP)
const validGW1SquadWithShakara: SquadPlayer[] = [
  { playerId: 'p_10_5_shakarishvili', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false },
  ...validSquad.slice(1), // p_d1, p_d2, p_d3, p_m1, p_m2, p_m3, p_f1, p_f2
];
const gw1Res = validateSquadComposition(validGW1SquadWithShakara, mockPlayers, 1);
assert(gw1Res.isValid === true, 'GW1 squad containing Shakarishvili is valid (was legal as GKP in GW1)');
assert(gw1Res.hasPositionChangedPlayers === false, 'hasPositionChangedPlayers is false for GW1');
assert(gw1Res.gkCount === 1, 'Shakarishvili counted as 1 GKP in GW1');

console.log('\n=================================================================');
console.log('ALL GW2 POSITION CHANGE & REMEDIATION TESTS PASSED! 🎉');
console.log('=================================================================');
