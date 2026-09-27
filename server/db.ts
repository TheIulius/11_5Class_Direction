import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Player, Fixture, League, Squad, Club } from '../src/types/fpl';
import { SEED_PLAYERS } from '../src/data/seedPlayers';
import { SEED_FIXTURES, SEED_LEAGUES } from '../src/data/seedFixtures';
import { CLUBS } from '../src/data/clubs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  managerName: string;
  teamName: string;
  token?: string;
  createdAt: string;
  role?: 'admin' | 'user';
  isAdmin?: boolean;
  isApproved?: boolean;
}

export interface ManagerProfile {
  id: string;
  managerName: string;
  teamName: string;
  squad: Squad;
  joinedAt: string;
}

export interface PaymentSettings {
  bogLink: string;
  tbcLink: string;
  entryFeeGEL: number;
  requireActivationCode: boolean;
}

export interface ActivationCode {
  code: string;
  createdAt: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
}

export interface DatabaseSchema {
  currentGW: number;
  players: Record<string, Player>;
  clubs?: Record<string, Club>;
  fixtures: Fixture[];
  leagues: League[];
  managers: Record<string, ManagerProfile>;
  users: Record<string, UserAccount>;
  paymentSettings?: PaymentSettings;
  activationCodes?: ActivationCode[];
  deletedUserIds?: string[];
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, s, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: s };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return testHash === hash;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function getDefaultData(): DatabaseSchema {
  const playerMap: Record<string, Player> = {};
  SEED_PLAYERS.forEach((p) => {
    playerMap[p.id] = p;
  });

  const defaultPassword = hashPassword('fantasy123');

  const defaultUser: UserAccount = {
    id: 'user_1',
    username: 'apex',
    email: 'apex@fantasy.pl',
    passwordHash: defaultPassword.hash,
    salt: defaultPassword.salt,
    managerName: 'Apex Manager',
    teamName: 'Apex XI',
    token: 'token_apex_demo',
    createdAt: new Date().toISOString(),
    isApproved: true,
  };

  const defaultManager: ManagerProfile = {
    id: 'user_1',
    managerName: 'Apex Manager',
    teamName: 'Apex XI',
    squad: {
      teamName: 'Apex XI',
      managerName: 'Apex Manager',
      players: [],
      bank: 55.0,
      freeTransfers: 1,
      transfersMadeThisGW: 0,
      activeChip: null,
      usedChips: {
        triple_captain: false,
        bench_boost: false,
        wildcard: false,
      },
    },
    joinedAt: new Date().toISOString(),
  };

  return {
    currentGW: 1,
    players: playerMap,
    clubs: { ...CLUBS },
    fixtures: [...SEED_FIXTURES],
    leagues: SEED_LEAGUES,
    managers: {
      user_1: defaultManager,
    },
    users: {
      user_1: defaultUser,
    },
    paymentSettings: {
      bogLink: 'https://egreve.bog.ge/KCL26_charity',
      tbcLink: '',
      entryFeeGEL: 3,
      requireActivationCode: false,
    },
    activationCodes: [],
  };
}

class Database {
  private data: DatabaseSchema;
  private onSaveCallback?: (reason?: string) => void;
  public isSyncing: boolean = false; // Safety lock to prevent auto-commits during startup/sync

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        this.sanitize();
        this.saveSilent();
      } catch (err) {
        console.error('Error reading db.json, initializing with default data', err);
        this.data = getDefaultData();
        this.saveSilent();
      }
    } else {
      this.data = getDefaultData();
      this.saveSilent();
    }
  }

  /**
   * Sanitizes and enforces database integrity (admins, clubs, legacy fixtures, captain rules).
   * Runs both on startup and whenever new data is loaded from GitHub.
   */
  public sanitize(): boolean {
    if (!this.data) return false;
    let modified = false;

    if (!this.data.users) {
      this.data.users = {};
      modified = true;
    }

    if (!this.data.paymentSettings) {
      this.data.paymentSettings = {
        bogLink: 'https://egreve.bog.ge/KCL26_charity',
        tbcLink: '',
        entryFeeGEL: 3,
        requireActivationCode: false,
      };
      modified = true;
    } else if (!this.data.paymentSettings.bogLink) {
      this.data.paymentSettings.bogLink = 'https://egreve.bog.ge/KCL26_charity';
      modified = true;
    }

    if (!Array.isArray(this.data.activationCodes)) {
      this.data.activationCodes = [];
      modified = true;
    }

    // Grant permanent moderator / admin privileges to designated accounts
    Object.values(this.data.users).forEach((u) => {
      const lower = u.username.toLowerCase();
      if (lower === 'theiulius' || lower === 'chaga') {
        u.role = 'admin';
        u.isAdmin = true;
        u.isApproved = true;
      }
    });

    // Ensure valid school clubs
    if (
      !this.data.clubs ||
      Object.keys(this.data.clubs).some((k) => k === 'ARS' || k === 'CHE' || k === 'WOL' || k === 'SCH_10' || k === 'SCH_TCH') ||
      !('SCH_9_1' in this.data.clubs)
    ) {
      this.data.clubs = { ...CLUBS };
      modified = true;
    }

    // Cleanse any legacy Premier League fixtures
    const legacyClubCodes = new Set(['ARS', 'AVL', 'BOU', 'BRE', 'BHA', 'CHE', 'CRY', 'EVE', 'FUL', 'IPS', 'LEI', 'LIV', 'MCI', 'MUN', 'NEW', 'NFO', 'SOU', 'TOT', 'WHU', 'WOL', 'SCH_10', 'SCH_12', 'SCH_TCH']);
    const hasLegacyFixtures = Array.isArray(this.data.fixtures) && this.data.fixtures.some((f) => legacyClubCodes.has(f.homeClubId) || legacyClubCodes.has(f.awayClubId));
    if (hasLegacyFixtures || !this.data.fixtures || this.data.fixtures.length === 0) {
      this.data.fixtures = [...SEED_FIXTURES];
      modified = true;
    }

    // Ensure Rati is always marked as FWD
    if (this.data.players && this.data.players['p_rati'] && this.data.players['p_rati'].position !== 'FWD') {
      this.data.players['p_rati'].position = 'FWD';
      modified = true;
    }

    // Auto-merge newly added seed players without overwriting existing player stats/costs
    if (this.data.players) {
      SEED_PLAYERS.forEach((sp) => {
        if (!this.data.players[sp.id]) {
          this.data.players[sp.id] = sp;
          modified = true;
        }
      });
    }

    // Sanitize manager squads: enforce valid players and single-captain integrity
    if (this.data.players && Object.keys(this.data.players).length >= 50 && this.data.managers) {
      Object.values(this.data.managers).forEach((m) => {
        if (m.squad && Array.isArray(m.squad.players) && m.squad.players.length > 0) {
          const validPlayers = m.squad.players.filter((sp) => Boolean(this.data.players[sp.playerId]));
          if (validPlayers.length !== m.squad.players.length && validPlayers.length > 0) {
            const totalCost = validPlayers.reduce((sum, sp) => sum + (this.data.players[sp.playerId]?.cost || 0), 0);
            m.squad.bank = Math.max(0, Math.round((55.0 - totalCost) * 10) / 10);
            m.squad.players = validPlayers;
            modified = true;
          }

          const starters = m.squad.players.filter((sp: any) => sp.isStarter);
          const captains = starters.filter((sp: any) => sp.isCaptain);
          if (captains.length > 1 || (starters.length > 0 && !captains.length)) {
            const capId = captains[0]?.playerId || starters[0]?.playerId;
            const remaining = starters.filter((sp: any) => sp.playerId !== capId);
            const viceId = remaining.find((sp: any) => sp.isViceCaptain)?.playerId || remaining[0]?.playerId;

            m.squad.players = m.squad.players.map((sp: any) => {
              if (!sp.isStarter) return { ...sp, isCaptain: false, isViceCaptain: false };
              return {
                ...sp,
                isCaptain: sp.playerId === capId,
                isViceCaptain: sp.playerId === viceId,
              };
            });
            modified = true;
          }
        }
      });
    }

    // Clean up orphaned demo managers that have no user account
    if (this.data.users && Object.keys(this.data.users).length > 0 && this.data.managers) {
      const validUserIds = new Set(Object.keys(this.data.users));
      for (const mid of Object.keys(this.data.managers)) {
        if (!validUserIds.has(mid)) {
          delete this.data.managers[mid];
          modified = true;
        }
      }
      const globalLeague = this.data.leagues?.find((l) => l.isGlobal);
      if (globalLeague && Array.isArray(globalLeague.members)) {
        const beforeLen = globalLeague.members.length;
        globalLeague.members = globalLeague.members.filter((m) => validUserIds.has(m.id));
        if (globalLeague.members.length !== beforeLen) {
          modified = true;
        }
      }
    }

    return modified;
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  /**
   * Overwrites the in-memory database with remote data.
   * Defaults triggerCallback to false so syncing does NOT trigger an auto-commit back to GitHub!
   */
  public setData(newData: DatabaseSchema, triggerCallback: boolean = false): void {
    this.data = newData;
    this.sanitize();
    this.save(undefined, triggerCallback);
  }

  public setOnSaveCallback(cb: (reason?: string) => void): void {
    this.onSaveCallback = cb;
  }

  public save(reason?: string, triggerCallback: boolean = true): void {
    try {
      const tempFile = DB_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);

      // Only invoke GitHub commit callback if NOT syncing and explicitly requested
      if (triggerCallback && this.onSaveCallback && !this.isSyncing) {
        this.onSaveCallback(reason);
      }
    } catch (err) {
      console.error('Failed to save db.json', err);
    }
  }

  public saveSilent(): void {
    this.save(undefined, false);
  }

  public reset(): void {
    this.data.currentGW = 1;
    if (Array.isArray(this.data.fixtures)) {
      this.data.fixtures.forEach((f) => {
        f.homeScore = null;
        f.awayScore = null;
        f.isFinished = false;
        f.isLive = false;
        f.events = [];
      });
    }
    if (this.data.players) {
      Object.values(this.data.players).forEach((p) => {
        p.totalPoints = 0;
        p.gwPoints = 0;
        p.gwStats = {};
      });
    }
    if (this.data.managers) {
      Object.values(this.data.managers).forEach((m) => {
        if (m.squad) {
          m.squad.transfersMadeThisGW = 0;
          m.squad.freeTransfers = 1;
          m.squad.activeChip = null;
          m.squad.usedChips = {
            triple_captain: false,
            bench_boost: false,
            wildcard: false,
          };
        }
      });
    }
    if (Array.isArray(this.data.leagues)) {
      this.data.leagues.forEach((l) => {
        l.members.forEach((mem, idx) => {
          mem.gwPoints = 0;
          mem.totalPoints = 0;
          mem.rank = idx + 1;
          mem.previousRank = idx + 1;
        });
      });
    }
    this.saveSilent();
  }
}

export const db = new Database();
