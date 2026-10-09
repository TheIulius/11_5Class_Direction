import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateGameweekSquadPoints } from '../src/engine/scoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../data/db.json');

const raw = fs.readFileSync(dbPath, 'utf8');
const data = JSON.parse(raw);

const targetManagersWithTC = [
  'user_1790357898196', // Nika
  'user_1790455471750', // Giorguna
  'user_1790462143820', // Gigi
  'user_1790491568897', // luka
  'user_1790492992563', // Erekle
  'user_1790509284463', // Dachi
  'user_1790509727660', // Dgi
  'user_1790589603201', // NIKA
  'user_1790590014100', // Alexander
];

for (const m of Object.values(data.managers || {})) {
  if (!m.squad) continue;
  if (!m.squad.gameweekSquads) m.squad.gameweekSquads = {};
  if (!m.squad.gameweekChips) m.squad.gameweekChips = {};
  if (!m.squad.usedChips) m.squad.usedChips = { triple_captain: false, bench_boost: false, wildcard: false };
  if (!m.squad.gwTransferPenalties) m.squad.gwTransferPenalties = {};
  if (typeof m.squad.accumulatedTransferPenalties !== 'number') m.squad.accumulatedTransferPenalties = 0;
  if (typeof m.squad.freeTransfers !== 'number') m.squad.freeTransfers = 1;

  // Snapshot GW1 squad if players exist
  if (!m.squad.gameweekSquads[1] && m.squad.players?.length === 9) {
    m.squad.gameweekSquads[1] = JSON.parse(JSON.stringify(m.squad.players));
  }
  if (m.squad.gwTransferPenalties[1] === undefined) {
    m.squad.gwTransferPenalties[1] = 0;
  }

  // Lock TC for the 9 managers who played it in GW1
  if (targetManagersWithTC.includes(m.id) || m.squad.activeChip === 'triple_captain') {
    m.squad.gameweekChips[1] = 'triple_captain';
    m.squad.usedChips.triple_captain = true;
    m.squad.activeChip = null;
    console.log(`Locked triple_captain in GW1 for ${m.managerName} (${m.id})`);
  }
}

// Recalculate standings and member scores
const globalLeague = data.leagues?.find((l) => l.isGlobal);
const currentGW = data.currentGW || 1;

for (const m of Object.values(data.managers || {})) {
  if (!m.squad) continue;
  let cumulativeGrossTotal = 0;
  let latestGWGrossPoints = 0;

  for (let gw = 1; gw <= currentGW; gw++) {
    const gwPlayers = (m.squad.gameweekSquads && m.squad.gameweekSquads[gw])
      ? m.squad.gameweekSquads[gw]
      : (m.squad.players || []);

    const chipForGw = (m.squad.gameweekChips && m.squad.gameweekChips[gw] !== undefined)
      ? m.squad.gameweekChips[gw]
      : (gw === currentGW ? m.squad.activeChip || null : null);

    const gwCalc = calculateGameweekSquadPoints(
      gwPlayers,
      data.players,
      gw,
      chipForGw,
      0,
      1,
      data.fixtures,
      true
    );

    cumulativeGrossTotal += gwCalc.grossPoints;
    if (gw === currentGW) latestGWGrossPoints = gwCalc.grossPoints;
  }

  const overallTotalPoints = cumulativeGrossTotal - (m.squad.accumulatedTransferPenalties || 0);
  m.gwPoints = latestGWGrossPoints;
  m.totalPoints = overallTotalPoints;

  const chipForCurrentGW = (m.squad.gameweekChips && m.squad.gameweekChips[currentGW] !== undefined)
    ? m.squad.gameweekChips[currentGW]
    : (m.squad.activeChip || null);

  const displaySquad = (m.squad.gameweekSquads && m.squad.gameweekSquads[currentGW])
    ? m.squad.gameweekSquads[currentGW]
    : (m.squad.players || []);

  const currentCalc = calculateGameweekSquadPoints(
    displaySquad,
    data.players,
    currentGW,
    chipForCurrentGW,
    0,
    1,
    data.fixtures,
    true
  );

  const lineupSummary = displaySquad
    .map((sp) => {
      const p = data.players?.[sp.playerId];
      if (!p) return null;
      const bd = currentCalc.playerPointsBreakdown?.[sp.playerId];
      const isScoringActive = sp.isStarter || bd?.isAutoSubIn || currentCalc.isBenchBoost;
      return {
        playerId: sp.playerId,
        webName: p.webName,
        clubId: p.clubId,
        position: p.position,
        isStarter: Boolean(sp.isStarter),
        isCaptain: Boolean(sp.isCaptain),
        isViceCaptain: Boolean(sp.isViceCaptain),
        benchOrder: sp.benchOrder || 0,
        points: bd ? (isScoringActive ? bd.finalPoints : bd.rawPoints) : (p.gwStats?.[currentGW] ? p.gwPoints : 0),
      };
    })
    .filter(Boolean);

  if (globalLeague?.members) {
    const mem = globalLeague.members.find((member) => member.id === m.id);
    if (mem) {
      mem.gwPoints = latestGWGrossPoints;
      mem.totalPoints = overallTotalPoints;
      mem.activeChip = chipForCurrentGW;
      mem.lineup = lineupSummary;
    }
  }
}

if (globalLeague?.members) {
  globalLeague.members.sort((a, b) => b.totalPoints - a.totalPoints || b.gwPoints - a.gwPoints);
  globalLeague.members.forEach((mem, idx) => {
    mem.previousRank = mem.rank || idx + 1;
    mem.rank = idx + 1;
  });
}

fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated data/db.json with locked chips for GW1.');
