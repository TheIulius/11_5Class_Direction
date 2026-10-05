import fs from 'node:fs';
import path from 'node:path';
import { SEED_PLAYERS } from '../src/data/seedPlayers';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

if (fs.existsSync(DB_PATH)) {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(raw);
    if (db && db.players) {
      let added = 0;
      for (const sp of SEED_PLAYERS) {
        if (!db.players[sp.id]) {
          db.players[sp.id] = sp;
          added++;
        }
      }
      if (added > 0) {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
        console.log(`[Seed Sync] Merged ${added} new seed players into ${DB_PATH}`);
      } else {
        console.log('[Seed Sync] All seed players already present in data/db.json');
      }
    }
  } catch (err) {
    console.error('[Seed Sync] Error syncing seed players into db.json:', err);
  }
}
