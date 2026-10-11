import fs from 'node:fs';
import path from 'node:path';
import { SEED_PLAYERS } from '../src/data/seedPlayers';
import { POSITION_CHANGED_PLAYERS } from '../src/engine/scoring';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

if (fs.existsSync(DB_PATH)) {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(raw);
    let modified = false;

    if (db && db.players) {
      let added = 0;
      let posUpdated = 0;
      for (const sp of SEED_PLAYERS) {
        if (!db.players[sp.id]) {
          db.players[sp.id] = sp;
          added++;
          modified = true;
        } else if (POSITION_CHANGED_PLAYERS[sp.id] && db.players[sp.id].position !== sp.position) {
          db.players[sp.id].position = sp.position;
          posUpdated++;
          modified = true;
        }
      }
      if (added > 0) {
        console.log(`[Seed Sync] Merged ${added} new seed players into ${DB_PATH}`);
      }
      if (posUpdated > 0) {
        console.log(`[Seed Sync] Updated positions for ${posUpdated} players (GW2 position changes)`);
      }
    }

    // GW2 Manager Remediation: Grant +1 Free Transfer per position-changed player owned
    if (db && db.managers) {
      let managersUpdated = 0;
      for (const m of Object.values(db.managers) as any[]) {
        const squad = m.squad;
        if (!squad || !Array.isArray(squad.players)) continue;
        squad.remediationGranted = squad.remediationGranted || {};

        let granted = 0;
        for (const sp of squad.players) {
          if (POSITION_CHANGED_PLAYERS[sp.playerId] && !squad.remediationGranted[sp.playerId]) {
            squad.remediationGranted[sp.playerId] = true;
            granted++;
          }
        }

        if (granted > 0) {
          squad.startFreeTransfers = (squad.startFreeTransfers ?? 2) + granted;
          const startFT = squad.startFreeTransfers;
          const made = squad.transfersMadeThisGW || 0;
          const consumed = Math.min(startFT, made);
          const excess = Math.max(0, made - startFT);
          squad.freeTransfers = Math.max(0, startFT - consumed);
          squad.gwTransferPenalties = squad.gwTransferPenalties || {};
          squad.gwTransferPenalties['2'] = excess * 4;
          let acc = 0;
          for (const p of Object.values(squad.gwTransferPenalties)) {
            acc += Number(p || 0);
          }
          squad.accumulatedTransferPenalties = acc;
          managersUpdated++;
          modified = true;
        }
      }
      if (managersUpdated > 0) {
        console.log(`[Seed Sync] Granted remediation free transfers to ${managersUpdated} managers`);
      }
    }

    if (modified) {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
      console.log(`[Seed Sync] Successfully synced database changes into ${DB_PATH}`);
    } else {
      console.log('[Seed Sync] Database is up to date.');
    }
  } catch (err) {
    console.error('[Seed Sync] Error syncing seed players into db.json:', err);
  }
}
