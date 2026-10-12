import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, ManagerProfile, hashPassword, verifyPassword, generateToken, UserAccount, PaymentSettings, ActivationCode, DatabaseSchema } from './db';
import { calculateGameweekSquadPoints, calculatePlayerPoints } from '../src/engine/scoring';
import { applyTransferAccountingToManager } from '../src/engine/transferAccounting';
import { DEFAULT_SQUAD_PLAYER_IDS } from '../src/data/seedPlayers';
import { CLUBS } from '../src/data/clubs';
import { Player, PlayerStats, Fixture, Club } from '../src/types/fpl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Moderator / Admin privilege designations
export const ADMIN_USERNAMES = ['theiulius', 'chaga'];
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminpassword';
export const INITIAL_BUDGET = 55.0;

export function isUserAdmin(username?: string): boolean {
  if (!username) return false;
  const clean = username.trim().toLowerCase();
  if (ADMIN_USERNAMES.includes(clean)) return true;
  try {
    const data = db.getData();
    if (data?.users) {
      const u = Object.values(data.users).find((acc) => acc.username.toLowerCase() === clean);
      if (u && (u.role === 'admin' || Boolean(u.isAdmin))) return true;
    }
  } catch (e) {}
  return false;
}

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

function isDeadlinePassed(data: any): boolean {
  if (!data.deadline || !data.deadline.deadlineTime) return false;
  return new Date() >= new Date(data.deadline.deadlineTime);
}

function isLineupsVisibleForPublic(data: any): boolean {
  const mode = data.lineupVisibility || 'auto';
  if (mode === 'always_show') return true;
  if (mode === 'always_hide') return false;
  return isDeadlinePassed(data);
}

// 2. Fetch Global State + Specific Manager Squad
app.get('/api/state', (req: Request, res: Response) => {
  const data = db.getData();
  const managerId = req.query.managerId as string | undefined;
  let manager: ManagerProfile | null = null;

  if (managerId) {
    if (data.managers[managerId]) {
      manager = data.managers[managerId];
    } else if (data.users?.[managerId]) {
      const user = data.users[managerId];
      manager = {
        id: user.id,
        managerName: user.managerName,
        teamName: user.teamName,
        squad: {
          teamName: user.teamName,
          managerName: user.managerName,
          players: [],
          bank: INITIAL_BUDGET,
          freeTransfers: 1,
          transfersMadeThisGW: 0,
          activeChip: null,
          usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
          accumulatedTransferPenalties: 0,
          gwTransferPenalties: {},
          gameweekSquads: {},
          gameweekChips: {},
        },
        joinedAt: new Date().toISOString(),
      };
      data.managers[user.id] = manager;
      db.save();
    }
  }

  recalculateAllManagersLeaguePoints(data);

  // 1. Approved managers filtering (Task 1)
  const allUsersList = Object.values(data.users || {});
  const approvedUsers = allUsersList.filter(
    (u: any) => isUserAdmin(u.username) || u.role === 'admin' || Boolean(u.isApproved)
  );
  const approvedUserIds = new Set(approvedUsers.map((u: any) => u.id));

  // Registered managers count: ONLY approved users (who paid and can play)
  const registeredManagersCount = allUsersList.length > 0
    ? approvedUsers.length
    : Object.values(data.managers || {}).length;

  const managersList = Object.values(data.managers).map((m) => {
    const user = data.users?.[m.id];
    return {
      id: m.id,
      managerName: m.managerName,
      teamName: m.teamName,
      isApproved: user ? (isUserAdmin(user.username) || user.role === 'admin' || Boolean(user.isApproved)) : false,
      isAdmin: user ? (isUserAdmin(user.username) || user.role === 'admin') : false,
    };
  });

  // 2. Dynamic Player Ownership Calculation (Task 2)
  const eligibleManagers = Object.values(data.managers || {}).filter((m: any) => {
    if (allUsersList.length > 0) {
      return approvedUserIds.has(m.id);
    }
    return true;
  });
  const totalEligible = eligibleManagers.length || 1;

  const playerOwnership: Record<string, {
    percent: number;
    count: number;
    managers: Array<{ id: string; managerName: string; teamName: string; isCaptain?: boolean; isViceCaptain?: boolean }>;
  }> = {};

  eligibleManagers.forEach((m: any) => {
    const squadPlayers = Array.isArray(m.squad?.players) ? m.squad.players : [];
    squadPlayers.forEach((sp: any) => {
      if (!playerOwnership[sp.playerId]) {
        playerOwnership[sp.playerId] = { percent: 0, count: 0, managers: [] };
      }
      playerOwnership[sp.playerId].count += 1;
      playerOwnership[sp.playerId].managers.push({
        id: m.id,
        managerName: m.managerName,
        teamName: m.teamName,
        isCaptain: Boolean(sp.isCaptain),
        isViceCaptain: Boolean(sp.isViceCaptain),
      });
    });
  });

  Object.keys(data.players || {}).forEach((pid) => {
    const info = playerOwnership[pid];
    if (info) {
      info.percent = Math.round((info.count / totalEligible) * 100);
      data.players[pid].selectedByPercent = info.percent;
    } else {
      data.players[pid].selectedByPercent = 0;
    }
  });

  // 3. Lineup Visibility & Deadline (Task 3)
  const publicLineupsVisible = isLineupsVisibleForPublic(data);
  const lineupVisibilityMode = data.lineupVisibility || 'auto';

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const usernameHeader = req.headers['x-auth-username']
    ? decodeURIComponent(req.headers['x-auth-username'] as string).trim().toLowerCase()
    : ((req.headers['x-username'] as string)?.trim().toLowerCase() || null);
  const requestingUser = token ? Object.values(data.users || {}).find((u: any) => u.token === token) : null;
  const queriedUser = managerId ? data.users?.[managerId] : null;
  const activeUser = requestingUser || queriedUser;
  const isApproved = activeUser ? (isUserAdmin(activeUser.username) || Boolean(activeUser.isApproved)) : false;
  const isAdmin = (activeUser ? (isUserAdmin(activeUser.username) || activeUser.role === 'admin' || Boolean(activeUser.isAdmin)) : false)
    || (usernameHeader ? isUserAdmin(usernameHeader) : false);

  const sanitizedLeagues = (publicLineupsVisible || isAdmin)
    ? data.leagues
    : (data.leagues || []).map((l: any) => ({
        ...l,
        members: (l.members || []).map((m: any) => ({
          ...m,
          lineup: m.id === managerId ? m.lineup : [],
        })),
      }));

  res.json({
    currentGW: data.currentGW,
    players: data.players,
    clubs: data.clubs || CLUBS,
    fixtures: data.fixtures,
    leagues: sanitizedLeagues,
    managers: managersList,
    registeredManagersCount,
    playerOwnership,
    lineupVisibility: lineupVisibilityMode,
    isLineupsVisible: publicLineupsVisible,
    activeManager: manager,
    currentUserApproved: isApproved,
    deadline: data.deadline || null,
    paymentSettings: {
      bogLink: data.paymentSettings?.bogLink || 'https://egreve.bog.ge/KCL26_charity',
      tbcLink: data.paymentSettings?.tbcLink || '',
      entryFeeGEL: data.paymentSettings?.entryFeeGEL || 3,
      requireActivationCode: Boolean(data.paymentSettings?.requireActivationCode),
    },
    pendingPhotos: data.pendingPhotos || [],
  });
});

// 2b. Fetch a Specific Manager Profile, Squad, and Live Calculated Points
app.get('/api/manager/:id', (req: Request, res: Response) => {
  const managerId = req.params.id;
  const data = db.getData();

  let manager = data.managers[managerId];
  if (!manager) {
    // Check if it's one of the league members
    const leagueMember = data.leagues.flatMap((l) => l.members).find((m) => m.id === managerId);
    if (leagueMember) {
      manager = {
        id: leagueMember.id,
        managerName: leagueMember.managerName,
        teamName: leagueMember.teamName,
        squad: {
          teamName: leagueMember.teamName,
          managerName: leagueMember.managerName,
          players: [],
          bank: INITIAL_BUDGET,
          freeTransfers: 1,
          transfersMadeThisGW: 0,
          activeChip: null,
          usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
          accumulatedTransferPenalties: 0,
          gwTransferPenalties: {},
          gameweekSquads: {},
          gameweekChips: {},
        },
        joinedAt: new Date().toISOString(),
      };
    }
  }

  if (!manager) {
    return res.status(404).json({ error: 'Manager not found' });
  }

  // Check if viewing other manager lineups is allowed
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const usernameHeader = req.headers['x-auth-username']
    ? decodeURIComponent(req.headers['x-auth-username'] as string).trim().toLowerCase()
    : ((req.headers['x-username'] as string)?.trim().toLowerCase() || null);
  const requestingUser = token ? Object.values(data.users || {}).find((u: any) => u.token === token) : null;
  const isAdmin = (requestingUser ? (isUserAdmin(requestingUser.username) || requestingUser.role === 'admin' || Boolean(requestingUser.isAdmin)) : false)
    || (usernameHeader ? isUserAdmin(usernameHeader) : false);
  const isSelf = requestingUser ? requestingUser.id === managerId : false;

  const publicVisible = isLineupsVisibleForPublic(data);

  if (!isSelf && !publicVisible && !isAdmin) {
    return res.json({
      success: true,
      manager: {
        id: manager.id,
        managerName: manager.managerName,
        teamName: manager.teamName,
        squad: {
          teamName: manager.squad.teamName,
          managerName: manager.squad.managerName,
          players: [],
          bank: manager.squad.bank,
          freeTransfers: manager.squad.freeTransfers,
          transfersMadeThisGW: manager.squad.transfersMadeThisGW,
          activeChip: null,
          usedChips: manager.squad.usedChips,
        },
        joinedAt: manager.joinedAt,
      },
      calculationResult: null,
      currentGW: data.currentGW,
      isLineupHidden: true,
    });
  }

  const squadForCalc = (manager.squad.gameweekSquads && manager.squad.gameweekSquads[data.currentGW])
    ? manager.squad.gameweekSquads[data.currentGW]
    : manager.squad.players;
  const chipForCalc = (manager.squad.gameweekChips && manager.squad.gameweekChips[data.currentGW] !== undefined)
    ? manager.squad.gameweekChips[data.currentGW]
    : manager.squad.activeChip;

  const calc = calculateGameweekSquadPoints(
    squadForCalc,
    data.players,
    data.currentGW,
    chipForCalc,
    0,
    1,
    data.fixtures
  );

  res.json({
    success: true,
    manager,
    calculationResult: calc,
    currentGW: data.currentGW,
    isLineupHidden: false,
  });
});

// --- AUTHENTICATION & SEPARATE ACCOUNTS ---

// Register Account with Password (Supports 3 GEL Charity BOG/TBC Activation Codes)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { username, email, password, managerName, teamName, activationCode } = req.body;

  if (!username || !password || !managerName || !teamName) {
    return res.status(400).json({ error: 'Username, password, manager name and team name are required' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  // In-memory data is the live source of truth
  const data = db.getData();
  if (!data.users) data.users = {};

  // Check Activation Code requirement
  const requireActivation = Boolean(data.paymentSettings?.requireActivationCode);
  const cleanCode = (activationCode || '').trim().toUpperCase();
  let matchedCodeObj: any = null;

  if (requireActivation || cleanCode) {
    if (!cleanCode) {
      return res.status(400).json({
        error: `A ${data.paymentSettings?.entryFeeGEL || 3} ₾ entry activation code is required. Please pay via Bank of Georgia or TBC Bank to get your code.`,
      });
    }
    matchedCodeObj = (data.activationCodes || []).find((c: any) => c.code.toUpperCase() === cleanCode);
    if (!matchedCodeObj) {
      return res.status(400).json({
        error: 'Invalid activation code. Please verify the code or contact tournament admins.',
      });
    }
    if (matchedCodeObj.isUsed) {
      return res.status(400).json({
        error: 'This activation code has already been redeemed by another manager.',
      });
    }
  }

  const cleanUser = username.trim().toLowerCase();
  const cleanEmail = (email || `${cleanUser}@fantasy.pl`).trim().toLowerCase();

  // Check username uniqueness
  const existingUser = Object.values(data.users).find(
    (u) => u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanEmail)
  );

  if (existingUser) {
    return res.status(400).json({ error: 'Username or email is already taken' });
  }

  const id = 'user_' + Date.now();
  const pwd = hashPassword(password);
  const token = generateToken();
  const isAdmin = isUserAdmin(cleanUser);
  const isApproved = isAdmin; // Admins are automatically approved; regular users wait for admin approval

  const newUser: UserAccount = {
    id,
    username: cleanUser,
    email: cleanEmail,
    passwordHash: pwd.hash,
    salt: pwd.salt,
    managerName: managerName.trim(),
    teamName: teamName.trim(),
    token,
    createdAt: new Date().toISOString(),
    role: isAdmin ? 'admin' : 'user',
    isAdmin,
    isApproved,
    grade: req.body.grade || '',
    parallel: req.body.parallel || '',
    realName: (req.body.realName || '').trim(),
    showRealNamePublicly: req.body.showRealNamePublicly !== undefined ? Boolean(req.body.showRealNamePublicly) : true,
  };

  const newManager: ManagerProfile = {
    id,
    managerName: managerName.trim(),
    teamName: teamName.trim(),
    grade: newUser.grade,
    parallel: newUser.parallel,
    realName: newUser.realName,
    showRealNamePublicly: newUser.showRealNamePublicly,
    squad: {
      teamName: teamName.trim(),
      managerName: managerName.trim(),
      players: [],
      bank: INITIAL_BUDGET,
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

  data.users[id] = newUser;
  data.managers[id] = newManager;

  if (Array.isArray(data.deletedUserIds)) {
    data.deletedUserIds = data.deletedUserIds.filter((did) => did !== id);
  }

  // Mark activation code as redeemed
  if (matchedCodeObj) {
    matchedCodeObj.isUsed = true;
    matchedCodeObj.usedBy = cleanUser;
    matchedCodeObj.usedAt = new Date().toISOString();
  }

  // Add to Global League
  const globalLeague = data.leagues.find((l) => l.isGlobal);
  if (globalLeague) {
    globalLeague.members.push({
      id,
      managerName: newManager.managerName,
      teamName: newManager.teamName,
      totalPoints: 0,
      gwPoints: 0,
      rank: globalLeague.members.length + 1,
      previousRank: globalLeague.members.length + 1,
      grade: newUser.grade,
      parallel: newUser.parallel,
      realName: newUser.realName,
      showRealNamePublicly: newUser.showRealNamePublicly,
    });
  }

  db.save();
  scheduleAutoSyncToGitHub(`New user registered: @${cleanUser}`);

  res.json({
    success: true,
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      managerName: newUser.managerName,
      teamName: newUser.teamName,
      role: newUser.role,
      isAdmin: newUser.isAdmin,
      isApproved: newUser.isApproved,
      grade: newUser.grade,
      parallel: newUser.parallel,
      realName: newUser.realName,
      showRealNamePublicly: newUser.showRealNamePublicly,
    },
    squad: newManager.squad,
  });
});

// Helper: match user by username, email, manager name, team name, or known typo aliases
export function findUserByLogin(loginInput: string, users: Record<string, UserAccount>): UserAccount | undefined {
  if (!users || !loginInput) return undefined;
  const clean = loginInput.trim().toLowerCase();
  if (!clean) return undefined;

  // 1. Direct username or email match
  let found = Object.values(users).find(
    (u) =>
      (u.username && u.username.toLowerCase() === clean) ||
      (u.email && u.email.toLowerCase() === clean)
  );
  if (found) return found;

  // 2. Manager name or team name match (case-insensitive)
  found = Object.values(users).find(
    (u) =>
      (u.managerName && u.managerName.toLowerCase() === clean) ||
      (u.teamName && u.teamName.toLowerCase() === clean)
  );
  if (found) return found;

  // 3. Typo/alias tolerance (e.g. axali <-> axalli)
  found = Object.values(users).find((u) => {
    const uName = (u.username || '').toLowerCase();
    const uEmail = (u.email || '').toLowerCase();
    if (
      (clean === 'axali' && (uName === 'axalli' || uEmail.startsWith('axalli'))) ||
      (clean === 'axalli' && (uName === 'axali' || uEmail.startsWith('axali'))) ||
      (clean.startsWith('axalli') && uName === 'axali') ||
      (clean.startsWith('axali') && uName === 'axalli')
    ) {
      return true;
    }
    return false;
  });
  if (found) return found;

  // 4. Exact user ID match
  if (users[clean]) return users[clean];

  return undefined;
}

// Log In with Username/Email & Password (with on-demand GitHub sync fallback)
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password are required' });
  }

  let data = db.getData();
  if (!data.users) data.users = {};

  let user = findUserByLogin(login, data.users);

  // If user not found in local memory, immediately sync with latest GitHub database
  if (!user) {
    try {
      console.log(`[Auth Login] User "${login}" not found in local cache. Syncing latest data from GitHub...`);
      await syncDatabaseFromGitHub();
      data = db.getData();
      user = findUserByLogin(login, data.users || {});
    } catch (e) {
      console.warn('[Auth Login] GitHub fallback sync error:', e);
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Account not found. Please register.' });
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const token = generateToken();
  user.token = token;
  db.save();

  let manager = data.managers[user.id];
  if (!manager) {
    manager = {
      id: user.id,
      managerName: user.managerName,
      teamName: user.teamName,
      squad: {
        teamName: user.teamName,
        managerName: user.managerName,
        players: [],
        bank: INITIAL_BUDGET,
        freeTransfers: 1,
        transfersMadeThisGW: 0,
        activeChip: null,
        usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
      },
      joinedAt: new Date().toISOString(),
    };
    data.managers[user.id] = manager;
    db.save();
  }

  const isAdmin = isUserAdmin(user.username) || user.role === 'admin' || Boolean(user.isAdmin);
  const isApproved = isAdmin || Boolean(user.isApproved);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      managerName: user.managerName,
      teamName: user.teamName,
      role: isAdmin ? 'admin' : (user.role === 'ref' || user.isReferee ? 'ref' : 'user'),
      isAdmin,
      isReferee: Boolean(user.role === 'ref' || user.isReferee),
      isApproved,
      grade: user.grade,
      parallel: user.parallel,
      realName: user.realName,
      showRealNamePublicly: user.showRealNamePublicly,
    },
    squad: manager.squad,
  });
});

// Check Session / Current Logged In User
app.get('/api/auth/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.query.token as string);

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  let data = db.getData();
  if (!data.users) data.users = {};

  let user = Object.values(data.users).find((u) => u.token === token);
  if (!user) {
    try {
      await syncDatabaseFromGitHub();
      data = db.getData();
      user = Object.values(data.users || {}).find((u) => u.token === token);
    } catch (e) {
      // Non-blocking fallback
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  let manager = data.managers[user.id];
  if (!manager) {
    manager = {
      id: user.id,
      managerName: user.managerName,
      teamName: user.teamName,
      squad: {
        teamName: user.teamName,
        managerName: user.managerName,
        players: [],
        bank: INITIAL_BUDGET,
        freeTransfers: 1,
        transfersMadeThisGW: 0,
        activeChip: null,
        usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
      },
      joinedAt: new Date().toISOString(),
    };
    data.managers[user.id] = manager;
    db.save();
  }

  const isAdmin = isUserAdmin(user.username) || user.role === 'admin' || Boolean(user.isAdmin);
  const isApproved = isAdmin || Boolean(user.isApproved);

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      managerName: user.managerName,
      teamName: user.teamName,
      role: isAdmin ? 'admin' : (user.role === 'ref' || user.isReferee ? 'ref' : 'user'),
      isAdmin,
      isReferee: Boolean(user.role === 'ref' || user.isReferee),
      isApproved,
      grade: user.grade,
      parallel: user.parallel,
      realName: user.realName,
      showRealNamePublicly: user.showRealNamePublicly,
    },
    squad: manager.squad,
  });
});

// Log Out
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.body.token;

  if (token) {
    const data = db.getData();
    if (data.users) {
      const user = Object.values(data.users).find((u) => u.token === token);
      if (user) {
        user.token = undefined;
        db.save();
      }
    }
  }

  res.json({ success: true });
});

// Update Student Profile (Grade, Parallel, Real Name & Public Visibility)
app.post('/api/user/profile', (req: Request, res: Response) => {
  const { grade, parallel, firstName, lastName, realName, showRealNamePublicly } = req.body;
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.body.token as string);
  const authUsername = (req.headers['x-auth-username'] as string) || '';

  const data = db.getData();
  if (!data.users) data.users = {};

  let user: UserAccount | undefined;
  if (token) {
    user = Object.values(data.users).find((u) => u.token === token);
  }
  if (!user && authUsername) {
    user = Object.values(data.users).find((u) => u.username.toLowerCase() === authUsername.toLowerCase());
  }
  if (!user && req.body.userId) {
    user = data.users[req.body.userId];
  }

  if (!user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const finalRealName = (realName || `${firstName || ''} ${lastName || ''}`).trim();
  const cleanGrade = (grade || '').trim();
  const cleanParallel = (parallel || '').trim();
  const cleanShowPublic = showRealNamePublicly === undefined ? true : Boolean(showRealNamePublicly);

  if (!cleanGrade || !cleanParallel || !finalRealName) {
    return res.status(400).json({ error: 'Grade, parallel, and full name are required' });
  }

  user.grade = cleanGrade;
  user.parallel = cleanParallel;
  user.realName = finalRealName;
  user.showRealNamePublicly = cleanShowPublic;

  // Also update in manager profile
  if (data.managers && data.managers[user.id]) {
    const m = data.managers[user.id];
    m.grade = cleanGrade;
    m.parallel = cleanParallel;
    m.realName = finalRealName;
    m.showRealNamePublicly = cleanShowPublic;
  }

  // Also update in all leagues
  (data.leagues || []).forEach((l: any) => {
    const member = l.members?.find((mem: any) => mem.id === user!.id);
    if (member) {
      member.grade = cleanGrade;
      member.parallel = cleanParallel;
      member.realName = finalRealName;
      member.showRealNamePublicly = cleanShowPublic;
    }
  });

  db.save();
  scheduleAutoSyncToGitHub(`Updated school profile for @${user.username} (${cleanGrade}/${cleanParallel} ${finalRealName})`);

  const isAdmin = isUserAdmin(user.username) || user.role === 'admin' || Boolean(user.isAdmin);
  const isApproved = isAdmin || Boolean(user.isApproved);

  return res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      managerName: user.managerName,
      teamName: user.teamName,
      role: isAdmin ? 'admin' : 'user',
      isAdmin,
      isApproved,
      grade: user.grade,
      parallel: user.parallel,
      realName: user.realName,
      showRealNamePublicly: user.showRealNamePublicly,
    },
  });
});

// Admin Developer Authentication (Server-Side verification)
app.post('/api/admin/login', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.body.token;

  // 1. Direct authorization if user token belongs to a designated moderator
  const data = db.getData();
  if (token && data.users) {
    const user = Object.values(data.users).find((u) => u.token === token);
    if (user && (isUserAdmin(user.username) || user.role === 'admin')) {
      return res.json({
        success: true,
        token,
        user: { username: user.username, role: 'admin', isAdmin: true },
      });
    }
  }

  // 2. Fallback to PIN / Root password
  const password = req.body.password || req.body.pin;
  const expectedPassword = ADMIN_PASSWORD;

  if (password && (password === expectedPassword || password === 'komarovi2025' || password === 'fantasy123')) {
    const adminToken = generateToken();
    return res.json({ success: true, token: adminToken });
  }

  return res.status(401).json({ error: 'Incorrect password or unauthorized moderator account.' });
});

// 3. Manager Login / Register (for friends to join)
app.post('/api/manager/login', (req: Request, res: Response) => {
  const { managerName, teamName } = req.body;
  if (!managerName || !teamName) {
    return res.status(400).json({ error: 'Manager name and team name required' });
  }

  const data = db.getData();

  // Look for existing profile matching name
  let existing = Object.values(data.managers).find(
    (m) => m.managerName.toLowerCase() === managerName.trim().toLowerCase()
  );

  if (!existing) {
    const id = 'user_' + Date.now();
    existing = {
      id,
      managerName: managerName.trim(),
      teamName: teamName.trim(),
      squad: {
        teamName: teamName.trim(),
        managerName: managerName.trim(),
        players: [],
        bank: INITIAL_BUDGET,
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

    data.managers[id] = existing;

    // Add to Global League
    const globalLeague = data.leagues.find((l) => l.isGlobal);
    if (globalLeague) {
      globalLeague.members.push({
        id,
        managerName: existing.managerName,
        teamName: existing.teamName,
        totalPoints: 0,
        gwPoints: 0,
        rank: globalLeague.members.length + 1,
        previousRank: globalLeague.members.length + 1,
      });
    }

    db.save();
  }

  res.json({ success: true, manager: existing });
});

/**
 * Unified transfer accounting engine (Rules 1-6, 8, 9)
 * Synchronizes freeTransfers, transfersMadeThisGW, gwTransferPenalties, and accumulatedTransferPenalties
 * across all transfer mechanisms (1-for-1 swaps, sell+buy, and complete squad saves).
 */
export function updateManagerTransferAccounting(manager: any, data: any) {
  applyTransferAccountingToManager(manager, Number(data.currentGW || 1));
}

// 4. Save Squad Lineup
app.post('/api/squad/save', (req: Request, res: Response) => {
  const { managerId, players, teamName, bank } = req.body;
  if (!managerId) {
    return res.status(400).json({ error: 'managerId is required' });
  }

  const data = db.getData();

  // Deadline check
  if (data.deadline && new Date() >= new Date(data.deadline.deadlineTime)) {
    return res.status(403).json({ error: 'Lineups are locked. The deadline has passed.' });
  }

  // Account approval check
  const user = data.users?.[managerId];
  if (user && !isUserAdmin(user.username) && !user.isApproved) {
    return res.status(403).json({ error: 'Your account is pending approval by administrators.' });
  }

  let manager = data.managers[managerId];

  if (!manager) {
    const user = data.users?.[managerId];
    manager = {
      id: managerId,
      managerName: user?.managerName || 'My Team Manager',
      teamName: teamName || user?.teamName || 'My Squad XI',
      squad: {
        teamName: teamName || user?.teamName || 'My Squad XI',
        managerName: user?.managerName || 'My Team Manager',
        players: players || [],
        bank: typeof bank === 'number' ? Math.round(bank * 10) / 10 : INITIAL_BUDGET,
        freeTransfers: 1,
        transfersMadeThisGW: 0,
        activeChip: null,
        usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
        accumulatedTransferPenalties: 0,
        gwTransferPenalties: {},
        gameweekSquads: {},
        gameweekChips: {},
      },
      joinedAt: new Date().toISOString(),
    };
    data.managers[managerId] = manager;
  }

  if (players && Array.isArray(players)) {
    // Check for duplicate player IDs
    const uniqueIds = new Set(players.map((sp: any) => sp.playerId));
    if (uniqueIds.size !== players.length) {
      return res.status(400).json({ error: 'Duplicate player detected in squad!' });
    }

    const gkCount = players.filter((sp: any) => data.players[sp.playerId]?.position === 'GKP').length;
    const defCount = players.filter((sp: any) => data.players[sp.playerId]?.position === 'DEF').length;
    const midCount = players.filter((sp: any) => data.players[sp.playerId]?.position === 'MID').length;
    const fwdCount = players.filter((sp: any) => data.players[sp.playerId]?.position === 'FWD').length;

    // Check position limits (cannot exceed max allowable counts)
    if (gkCount > 1 || defCount > 3 || midCount > 3 || fwdCount > 2 || players.length > 9) {
      return res.status(400).json({
        error: `Squad limits exceeded! Max allowed: 1 GK, 3 Defenders, 3 Midfielders, 2 Forwards (Total 9). Current: ${gkCount} GK, ${defCount} DEF, ${midCount} MID, ${fwdCount} FWD.`,
      });
    }

    // Check class limits: max 2 players from the same class / club
    const clubCounts: Record<string, number> = {};
    for (const sp of players) {
      const p = data.players[sp.playerId];
      if (p) {
        const clubKey = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
        clubCounts[clubKey] = (clubCounts[clubKey] || 0) + 1;
        if (clubCounts[clubKey] > 2 && req.body.validateComplete) {
          const clubName = data.clubs[p.clubId]?.name || data.clubs[clubKey]?.name || p.clubId;
          return res.status(400).json({
            error: `Class limit exceeded! You cannot choose more than 2 players from the same class (${clubName}).`,
          });
        }
      }
    }

    // If explicit complete squad validation requested (e.g. finalizing match lineup)
    const isComplete = gkCount === 1 && defCount === 3 && midCount === 3 && fwdCount === 2;
    if (req.body.validateComplete && !isComplete) {
      return res.status(400).json({
        error: `Cannot play! Squad must have exactly 1 GK, 3 Defenders (mcveli), 3 Midfielders, and 2 Forwards. (Current: ${gkCount} GK, ${defCount} DEF, ${midCount} MID, ${fwdCount} FWD)`,
      });
    }

    // Formation validation when squad is complete

    if (isComplete && req.body.validateComplete) {
      const starters = players.filter((sp: any) => sp.isStarter);
      const sGk = starters.filter((sp: any) => data.players[sp.playerId]?.position === 'GKP').length;
      const sDef = starters.filter((sp: any) => data.players[sp.playerId]?.position === 'DEF').length;
      const sMid = starters.filter((sp: any) => data.players[sp.playerId]?.position === 'MID').length;
      const sFwd = starters.filter((sp: any) => data.players[sp.playerId]?.position === 'FWD').length;
      const validFormations = ['1-2-2', '2-1-2', '2-2-1', '1-3-1', '3-1-1'];
      if (starters.length !== 6 || sGk !== 1 || !validFormations.includes(`${sDef}-${sMid}-${sFwd}`)) {
        return res.status(400).json({
          error: `Invalid starting formation (${sDef}-${sMid}-${sFwd}). Must have exactly 6 starters forming 1-2-2, 2-1-2, 2-2-1, 1-3-1, or 3-1-1.`,
        });
      }
    }

    // Ensure strict single-captain integrity
    const starters = players.filter((sp: any) => sp.isStarter);
    let capAssigned = false;
    let viceAssigned = false;
    const sanitizedPlayers = players.map((sp: any) => {
      if (!sp.isStarter) {
        return { ...sp, isCaptain: false, isViceCaptain: false };
      }
      let isCap = false;
      let isVice = false;
      if (sp.isCaptain && !capAssigned) {
        isCap = true;
        capAssigned = true;
      }
      if (sp.isViceCaptain && !isCap && !viceAssigned) {
        isVice = true;
        viceAssigned = true;
      }
      return { ...sp, isCaptain: isCap, isViceCaptain: isVice };
    });

    if (!capAssigned && starters.length > 0) {
      const firstStarter = sanitizedPlayers.find((sp: any) => sp.isStarter);
      if (firstStarter) firstStarter.isCaptain = true;
    }
    if (!viceAssigned && starters.length > 1) {
      const firstNonCap = sanitizedPlayers.find((sp: any) => sp.isStarter && !sp.isCaptain);
      if (firstNonCap) firstNonCap.isViceCaptain = true;
    }

    const currentGWKey = data.currentGW || 1;
    if (!manager.squad.gameweekSquads) manager.squad.gameweekSquads = {};
    if (!manager.squad.gameweekChips) manager.squad.gameweekChips = {};

    // Keep activeChip aligned with current gameweek without absorbing it into finished gameweeks
    if (manager.squad.activeChip) {
      manager.squad.gameweekChips[currentGWKey] = manager.squad.activeChip;
    }

    manager.squad.players = sanitizedPlayers;
    if (typeof bank === 'number') {
      manager.squad.bank = Math.round(bank * 10) / 10;
    } else {
      const totalCost = players.reduce((sum: number, sp: any) => sum + (data.players[sp.playerId]?.cost || 0), 0);
      manager.squad.bank = Math.max(0, Math.round((INITIAL_BUDGET - totalCost) * 10) / 10);
    }

    if (sanitizedPlayers.length === 9) {
      updateManagerTransferAccounting(manager, data);
    }
  }

  const registeredUser = data.users?.[managerId];
  if (registeredUser?.teamName) {
    manager.teamName = registeredUser.teamName;
    manager.squad.teamName = registeredUser.teamName;
  } else if (teamName) {
    manager.teamName = teamName;
    manager.squad.teamName = teamName;
  }

  // Update Global League member teamName as well
  const globalLeague = data.leagues?.find((l) => l.isGlobal);
  if (globalLeague?.members) {
    const mem = globalLeague.members.find((m) => m.id === managerId);
    if (mem) {
      mem.teamName = manager.teamName;
      mem.managerName = manager.managerName;
    }
  }

  recalculateAllManagersLeaguePoints(data);
  db.save();
  res.json({ success: true, squad: manager.squad, manager });
});

// 5. Activate Chip
app.post('/api/squad/chip', (req: Request, res: Response) => {
  const { managerId, chip } = req.body;
  const data = db.getData();

  // Deadline check: cannot activate/change chips once lineups are locked
  if (data.deadline && new Date() >= new Date(data.deadline.deadlineTime)) {
    return res.status(403).json({ error: 'Lineups are locked. The deadline has passed.' });
  }

  // Account approval check
  const user = data.users?.[managerId];
  if (user && !isUserAdmin(user.username) && !user.isApproved) {
    return res.status(403).json({ error: 'Your account is pending approval by administrators.' });
  }

  let manager = data.managers[managerId];

  if (!manager) {
    const user = data.users?.[managerId];
    if (user) {
      manager = {
        id: user.id,
        managerName: user.managerName,
        teamName: user.teamName,
        squad: {
          teamName: user.teamName,
          managerName: user.managerName,
          players: [],
          bank: INITIAL_BUDGET,
          freeTransfers: 1,
          transfersMadeThisGW: 0,
          activeChip: null,
          usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
          accumulatedTransferPenalties: 0,
          gwTransferPenalties: {},
          gameweekSquads: {},
          gameweekChips: {},
        },
        joinedAt: new Date().toISOString(),
      };
      data.managers[user.id] = manager;
    } else {
      return res.status(404).json({ error: 'Manager not found' });
    }
  }

  const normalizedChip = chip === 'free_hit' ? 'wildcard' : chip;

  if (!manager.squad.usedChips) {
    manager.squad.usedChips = { triple_captain: false, bench_boost: false, wildcard: false };
  }
  if (!manager.squad.gameweekChips) {
    manager.squad.gameweekChips = {};
  }

  if (manager.squad.usedChips) {
    if ((manager.squad.usedChips as any).free_hit !== undefined && (manager.squad.usedChips as any).wildcard === undefined) {
      (manager.squad.usedChips as any).wildcard = (manager.squad.usedChips as any).free_hit;
    }
  }

  const currentGWKey = data.currentGW || 1;

  // Strict one-use per season rule: check usedChips and any past completed gameweek in gameweekChips
  const isAlreadyUsed = Boolean(
    (manager.squad.usedChips && manager.squad.usedChips[normalizedChip]) ||
    Object.entries(manager.squad.gameweekChips || {}).some(
      ([gwStr, c]) => Number(gwStr) < currentGWKey && c === normalizedChip
    )
  );

  if (normalizedChip && isAlreadyUsed) {
    manager.squad.usedChips[normalizedChip] = true;
    return res.status(400).json({ error: 'Chip already used in a previous gameweek. Each chip can only be used once per season.' });
  }

  const newActive = manager.squad.activeChip === normalizedChip ? null : normalizedChip;
  manager.squad.activeChip = newActive;
  if (newActive) {
    manager.squad.gameweekChips[currentGWKey] = newActive;
  } else {
    delete manager.squad.gameweekChips[currentGWKey];
  }
  updateManagerTransferAccounting(manager, data);
  recalculateAllManagersLeaguePoints(data);
  db.save();

  res.json({ success: true, activeChip: manager.squad.activeChip, usedChips: manager.squad.usedChips, squad: manager.squad });
});

// 6. Execute Transfer
app.post('/api/squad/transfer', (req: Request, res: Response) => {
  const { managerId, outPlayerId, inPlayerId } = req.body;
  const data = db.getData();

  // Deadline check
  if (data.deadline && new Date() >= new Date(data.deadline.deadlineTime)) {
    return res.status(403).json({ error: 'Transfers are locked. The deadline has passed.' });
  }

  // Account approval check
  const user = data.users?.[managerId];
  if (user && !isUserAdmin(user.username) && !user.isApproved) {
    return res.status(403).json({ error: 'Your account is pending approval by administrators.' });
  }

  let manager = data.managers[managerId];

  if (!manager) {
    const user = data.users?.[managerId];
    if (user) {
      manager = {
        id: user.id,
        managerName: user.managerName,
        teamName: user.teamName,
        squad: {
          teamName: user.teamName,
          managerName: user.managerName,
          players: [],
          bank: INITIAL_BUDGET,
          freeTransfers: 1,
          transfersMadeThisGW: 0,
          activeChip: null,
          usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
          accumulatedTransferPenalties: 0,
          gwTransferPenalties: {},
          gameweekSquads: {},
          gameweekChips: {},
        },
        joinedAt: new Date().toISOString(),
      };
      data.managers[user.id] = manager;
    } else {
      return res.status(404).json({ error: 'Manager not found' });
    }
  }

  if (!manager.squad.gameweekSquads) manager.squad.gameweekSquads = {};
  if (!manager.squad.gameweekChips) manager.squad.gameweekChips = {};
  if (!manager.squad.gwTransferPenalties) manager.squad.gwTransferPenalties = {};
  if (typeof manager.squad.accumulatedTransferPenalties !== 'number') manager.squad.accumulatedTransferPenalties = 0;
  if (typeof manager.squad.freeTransfers !== 'number') manager.squad.freeTransfers = 1;
  if (typeof manager.squad.transfersMadeThisGW !== 'number') manager.squad.transfersMadeThisGW = 0;

  const outP = data.players[outPlayerId];
  const inP = data.players[inPlayerId];

  if (!outP || !inP) return res.status(400).json({ error: 'Invalid player' });
  if (outP.position !== inP.position) {
    return res.status(400).json({ error: 'Must swap players in the same position' });
  }

  // Class limit check: max 2 players from the same class / club
  const normalizeClub = (c: string) => (c === 'SCH' ? 'SCH_11_5' : c);
  const targetClub = normalizeClub(inP.clubId);
  const clubCount = manager.squad.players.filter((sp) => {
    if (sp.playerId === outPlayerId) return false;
    const p = data.players[sp.playerId];
    return p && normalizeClub(p.clubId) === targetClub;
  }).length;

  if (clubCount >= 2) {
    const clubName = data.clubs[inP.clubId]?.shortName || data.clubs[targetClub]?.shortName || inP.clubId;
    return res.status(400).json({ error: `Class limit reached! You cannot choose more than 2 players from the same class (${clubName}).` });
  }

  const newBank = Math.round((manager.squad.bank + outP.cost - inP.cost) * 10) / 10;
  if (newBank < 0) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  // Snapshot completed gameweek squads before mutating manager.squad.players
  const currentGWKey = data.currentGW || 1;
  const gwFixtures = (data.fixtures || []).filter((f: any) => Number(f.gameweek) === currentGWKey);
  const isCurrentGWFinished = gwFixtures.length > 0 && gwFixtures.every((f: any) => Boolean(f.isFinished));

  if (!manager.squad.gameweekSquads) manager.squad.gameweekSquads = {};
  if (!manager.squad.gameweekChips) manager.squad.gameweekChips = {};

  // If deadline has passed for the ongoing gameweek, preserve snapshot
  if (!isCurrentGWFinished && (data.deadline && new Date() >= new Date(data.deadline.deadlineTime))) {
    if (!manager.squad.gameweekSquads[currentGWKey] && manager.squad.players?.length === 9) {
      manager.squad.gameweekSquads[currentGWKey] = JSON.parse(JSON.stringify(manager.squad.players));
      manager.squad.gameweekChips[currentGWKey] = manager.squad.activeChip || null;
    }
  }

  // Keep activeChip aligned for current active gameweek
  if (manager.squad.activeChip) {
    manager.squad.gameweekChips[currentGWKey] = manager.squad.activeChip;
  }

  manager.squad.bank = newBank;
  manager.squad.players = manager.squad.players.map((sp) =>
    sp.playerId === outPlayerId ? { ...sp, playerId: inPlayerId } : sp
  );
  manager.squad.transfersMadeThisGW = (manager.squad.transfersMadeThisGW || 0) + 1;

  updateManagerTransferAccounting(manager, data);
  recalculateAllManagersLeaguePoints(data);
  db.save();
  res.json({ success: true, squad: manager.squad });
});

// 7. Developer Admin: Update Live Match Stat for Player
app.post('/api/admin/stat', (req: Request, res: Response) => {
  const { playerId, gw, stats } = req.body;
  const data = db.getData();
  const player = data.players[playerId];

  if (!player) return res.status(404).json({ error: 'Player not found' });

  const currentStats: PlayerStats = player.gwStats[gw] || {
    minutes: 0,
    goals: 0,
    assists: 0,
    cleanSheet: false,
    goalsConceded: 0,
    yellowCards: 0,
    redCards: 0,
    penaltiesSaved: 0,
    penaltiesMissed: 0,
    ownGoals: 0,
    isMVP: false,
    bonus: 0,
  };

  const updatedStats = { ...currentStats, ...stats };
  player.gwStats[gw] = updatedStats;

  const normClub = player.clubId === 'SCH' ? 'SCH_11_5' : player.clubId;
  const gwFixture = (data.fixtures || []).find(
    (f: Fixture) => f.gameweek === gw && (f.homeClubId === normClub || f.awayClubId === normClub)
  );
  const isOnePrice = gwFixture?.venue === 'one_price';
  player.gwPoints = calculatePlayerPoints(player.position, updatedStats, isOnePrice, player.id);

  // Recalculate total points across all GWs
  let sum = 0;
  Object.entries(player.gwStats).forEach(([gKey, s]: [string, any]) => {
    const gNum = parseInt(gKey, 10);
    const gFix = (data.fixtures || []).find(
      (f: Fixture) => f.gameweek === gNum && (f.homeClubId === normClub || f.awayClubId === normClub)
    );
    const gOnePrice = gFix?.venue === 'one_price';
    sum += calculatePlayerPoints(player.position, s, gOnePrice, player.id);
  });
  player.totalPoints = sum;

  recalculateAllManagersLeaguePoints(data);
  db.save();
  res.json({ success: true, player });
});

// 8. Developer Admin: Simulate Gameweek
app.post('/api/admin/simulate', (req: Request, res: Response) => {
  const { gw } = req.body;
  const data = db.getData();

  data.fixtures = data.fixtures.map((f) => {
    if (f.gameweek === gw) {
      return {
        ...f,
        homeScore: Math.floor(Math.random() * 4),
        awayScore: Math.floor(Math.random() * 3),
        isFinished: true,
        isLive: false,
      };
    }
    return f;
  });

  Object.values(data.players).forEach((p) => {
    const minutes = Math.random() > 0.15 ? (Math.random() > 0.2 ? 90 : 65) : 0;
    const goals =
      p.position === 'FWD'
        ? Math.random() > 0.4
          ? 1 + (Math.random() > 0.7 ? 1 : 0)
          : 0
        : p.position === 'MID'
        ? Math.random() > 0.6
          ? 1
          : 0
        : p.position === 'DEF'
        ? Math.random() > 0.9
          ? 1
          : 0
        : 0;
    const assists = Math.random() > 0.65 ? 1 : 0;
    const cleanSheet = (p.position === 'GKP' || p.position === 'DEF') && Math.random() > 0.55;
    const yellowCards = Math.random() > 0.8 ? 1 : 0;
    const saves = p.position === 'GKP' ? Math.floor(Math.random() * 6) + 1 : 0;
    const bonus = goals > 0 || cleanSheet ? (Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0) : 0;

    const stats: PlayerStats = {
      minutes,
      goals,
      assists,
      cleanSheet,
      goalsConceded: cleanSheet ? 0 : Math.floor(Math.random() * 2) + 1,
      yellowCards,
      redCards: 0,
      saves,
      penaltiesSaved: 0,
      penaltiesMissed: 0,
      ownGoals: 0,
      bonus,
    };

    p.gwStats[gw] = stats;
    p.gwPoints = calculatePlayerPoints(p.position, stats, false, p.id);

    let sum = 0;
    Object.values(p.gwStats).forEach((s) => {
      sum += calculatePlayerPoints(p.position, s, false, p.id);
    });
    p.totalPoints = sum;
  });

  db.save();
  res.json({ success: true, currentGW: gw });
});

function recalculateAllManagersLeaguePoints(data: any) {
  const currentGW = data.currentGW || 1;
  if (!data.managers) data.managers = {};
  if (!data.leagues) data.leagues = [];

  // Ensure every registered user has a manager profile
  Object.values(data.users || {}).forEach((u: any) => {
    if (!data.managers[u.id]) {
      data.managers[u.id] = {
        id: u.id,
        managerName: u.managerName || u.username,
        teamName: u.teamName || `${u.username} XI`,
        squad: {
          teamName: u.teamName || `${u.username} XI`,
          managerName: u.managerName || u.username,
          players: [],
          bank: INITIAL_BUDGET,
          freeTransfers: 1,
          transfersMadeThisGW: 0,
          activeChip: null,
          usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
          accumulatedTransferPenalties: 0,
          gwTransferPenalties: {},
          gameweekSquads: {},
          gameweekChips: {},
        },
        joinedAt: u.createdAt || new Date().toISOString(),
      };
    }
  });

  // Ensure Global School League exists and contains every manager
  let globalLeague = data.leagues.find((l: any) => l.isGlobal);
  if (!globalLeague) {
    globalLeague = {
      id: 'league_global',
      name: 'Komarovi Overall',
      code: 'GLOBAL',
      isGlobal: true,
      members: [],
    };
    data.leagues.unshift(globalLeague);
  }

  Object.values(data.managers).forEach((m: any) => {
    if (!globalLeague.members.some((mem: any) => mem.id === m.id)) {
      globalLeague.members.push({
        id: m.id,
        managerName: m.managerName,
        teamName: m.teamName,
        totalPoints: 0,
        gwPoints: 0,
        rank: globalLeague.members.length + 1,
        previousRank: globalLeague.members.length + 1,
      });
    }
  });

  Object.values(data.managers).forEach((m: any) => {
    if (!m.squad) return;
    updateManagerTransferAccounting(m, data);
    if (!m.squad.gameweekSquads) m.squad.gameweekSquads = {};
    if (!m.squad.gameweekChips) m.squad.gameweekChips = {};
    if (!m.squad.gwTransferPenalties) m.squad.gwTransferPenalties = {};

    // Lock used chips from completed gameweeks permanently
    if (!m.squad.usedChips) m.squad.usedChips = { triple_captain: false, bench_boost: false, wildcard: false };
    for (let gw = 1; gw <= currentGW; gw++) {
      const gwFixtures = (data.fixtures || []).filter((f: any) => Number(f.gameweek) === gw);
      const isGwFinished = gw < currentGW || (gwFixtures.length > 0 && gwFixtures.every((f: any) => Boolean(f.isFinished)));
      if (isGwFinished && m.squad.gameweekChips?.[gw]) {
        const usedChip = m.squad.gameweekChips[gw];
        if (usedChip && !m.squad.usedChips[usedChip]) {
          m.squad.usedChips[usedChip] = true;
        }
        if (m.squad.activeChip === usedChip) {
          m.squad.activeChip = null;
        }
      }
    }

    let cumulativeGrossTotal = 0;
    let latestGWGrossPoints = 0;

    for (let gw = 1; gw <= currentGW; gw++) {
      const gwFixtures = (data.fixtures || []).filter((f: any) => Number(f.gameweek) === gw);
      const isGwFinished = gw < currentGW || (gwFixtures.length > 0 && gwFixtures.every((f: any) => Boolean(f.isFinished)));

      // Completed / past gameweeks MUST strictly use their preserved snapshot.
      // If a manager did not have a squad registered for that gameweek, they have 0 players and 0 points.
      // Under no circumstances should current squad be backfilled or used as fallback for finished gameweeks.
      const gwPlayers = (isGwFinished || gw < currentGW)
        ? (m.squad.gameweekSquads?.[gw] || [])
        : (m.squad.gameweekSquads?.[gw] || m.squad.players || []);

      const chipForGw = (isGwFinished || gw < currentGW)
        ? (m.squad.gameweekChips?.[gw] || null)
        : (m.squad.gameweekChips?.[gw] !== undefined ? m.squad.gameweekChips[gw] : m.squad.activeChip || null);

      const gwCalc = calculateGameweekSquadPoints(
        gwPlayers,
        data.players,
        gw,
        chipForGw,
        0, // Rule 7: Individual gameweek score is unpenalized gross score
        1,
        data.fixtures,
        isGwFinished
      );

      cumulativeGrossTotal += gwCalc.grossPoints;
      if (gw === currentGW) {
        latestGWGrossPoints = gwCalc.grossPoints;
      }
    }

    // Rule 7: Transfer penalties affect overall fantasy points only,
    // never individual gameweek scores or gameweek rankings.
    const totalPenalties = m.squad.accumulatedTransferPenalties || 0;
    const bonusAdjustment = typeof m.bonusPointsAdjustment === 'number' ? m.bonusPointsAdjustment : 0;
    const overallTotalPoints = cumulativeGrossTotal - totalPenalties + bonusAdjustment;

    const displaySquad = (m.squad.gameweekSquads && m.squad.gameweekSquads[currentGW])
      ? m.squad.gameweekSquads[currentGW]
      : (m.squad.players || []);

    const chipForCurrentGW = (m.squad.gameweekChips && m.squad.gameweekChips[currentGW] !== undefined)
      ? m.squad.gameweekChips[currentGW]
      : (m.squad.activeChip || null);

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
      .map((sp: any) => {
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

    m.gwPoints = latestGWGrossPoints;
    m.totalPoints = overallTotalPoints;

    (data.leagues || []).forEach((l: any) => {
      const member = l.members.find((mem: any) => mem.id === m.id);
      if (member) {
        member.managerName = m.managerName;
        const u = data.users?.[m.id];
        if (m.grade || u?.grade) member.grade = m.grade || u?.grade;
        if (m.parallel || u?.parallel) member.parallel = m.parallel || u?.parallel;
        if (m.realName || u?.realName) member.realName = m.realName || u?.realName;
        if (m.showRealNamePublicly !== undefined || u?.showRealNamePublicly !== undefined) {
          member.showRealNamePublicly = m.showRealNamePublicly ?? u?.showRealNamePublicly;
        }

        member.gwPoints = latestGWGrossPoints;
        member.totalPoints = overallTotalPoints;
        member.activeChip = chipForCurrentGW;
        member.lineup = lineupSummary;
      }
    });
  });

  (data.leagues || []).forEach((l: any) => {
    l.members.sort((a: any, b: any) => b.totalPoints - a.totalPoints || b.gwPoints - a.gwPoints);
    l.members.forEach((mem: any, idx: number) => {
      mem.previousRank = mem.rank || idx + 1;
      mem.rank = idx + 1;
    });
  });
}

// 9. Developer Admin: Finalize Gameweek across ALL managers
app.post('/api/admin/finalize', (req: Request, res: Response) => {
  const data = db.getData();
  const currentGW = data.currentGW;

  recalculateAllManagersLeaguePoints(data);

  db.save();
  scheduleAutoSyncToGitHub(`Finalized GW ${currentGW} standings`);

  res.json({ success: true, currentGW: data.currentGW });
});

// 9b. Developer Admin: Gameweek Controls (Advance, Set GW, Reset Current GW, Reset Season to GW 1)
app.post('/api/admin/gameweek', (req: Request, res: Response) => {
  const { action, gw } = req.body;
  const data = db.getData();

  if (action === 'advance') {
    const endingGW = data.currentGW || 1;
    Object.values(data.managers || {}).forEach((m: any) => {
      if (!m.squad) return;
      if (!m.squad.gameweekSquads) m.squad.gameweekSquads = {};
      if (!m.squad.gameweekChips) m.squad.gameweekChips = {};

      if (!m.squad.gameweekSquads[endingGW] && m.squad.players?.length === 9) {
        m.squad.gameweekSquads[endingGW] = JSON.parse(JSON.stringify(m.squad.players));
        m.squad.gameweekChips[endingGW] = m.squad.activeChip || null;
      }

      if (m.squad.activeChip) {
        if (!m.squad.usedChips) m.squad.usedChips = {};
        m.squad.usedChips[m.squad.activeChip] = true;
        m.squad.activeChip = null;
      }
      m.squad.transfersMadeThisGW = 0;
      // Rules 1, 2, 3, 6:
      // Each new gameweek adds 1 free transfer to the existing balance, capped at 3!
      const currentBalance = typeof m.squad.freeTransfers === 'number' ? m.squad.freeTransfers : 1;
      m.squad.freeTransfers = Math.min(3, currentBalance + 1);
      m.squad.startFreeTransfers = m.squad.freeTransfers;
      if (!m.squad.gwTransferPenalties) m.squad.gwTransferPenalties = {};
      m.squad.gwTransferPenalties[endingGW + 1] = 0;
    });
    data.currentGW = endingGW + 1;
    recalculateAllManagersLeaguePoints(data);
    db.save();
    scheduleAutoSyncToGitHub(`Advanced to GW ${data.currentGW}`);
    return res.json({ success: true, currentGW: data.currentGW });
  }

  if (action === 'set_gw') {
    const targetGw = Math.max(1, Number(gw || 1));
    data.currentGW = targetGw;
    recalculateAllManagersLeaguePoints(data);
    db.save();
    scheduleAutoSyncToGitHub(`Set current Gameweek to GW ${targetGw}`);
    return res.json({ success: true, currentGW: data.currentGW });
  }

  if (action === 'reset_current_gw') {
    const targetGw = Math.max(1, Number(gw || data.currentGW || 1));
    // Reset fixtures for targetGw
    (data.fixtures || []).forEach((f: any) => {
      if (f.gameweek === targetGw) {
        f.homeScore = null;
        f.awayScore = null;
        f.isFinished = false;
        f.isLive = false;
        f.events = [];
      }
    });
    // Reset player stats for targetGw and recalculate totalPoints
    Object.values(data.players || {}).forEach((p: any) => {
      if (p.gwStats && p.gwStats[targetGw]) {
        delete p.gwStats[targetGw];
      }
      if (targetGw === data.currentGW) {
        p.gwPoints = 0;
      }
      let total = 0;
      Object.entries(p.gwStats || {}).forEach(([gKey, st]: [string, any]) => {
        const gNum = Number(gKey);
        const fix = (data.fixtures || []).find(
          (fx: any) => fx.gameweek === gNum && (fx.homeClubId === p.clubId || fx.awayClubId === p.clubId)
        );
        const isOnePrice = fix?.venue === 'one_price';
        const pts = calculatePlayerPoints(p.position, st, isOnePrice, p.id);
        total += pts;
      });
      p.totalPoints = total;
    });
    recalculateAllManagersLeaguePoints(data);
    db.save();
    scheduleAutoSyncToGitHub(`Reset GW ${targetGw} scores and stats`);
    return res.json({ success: true, currentGW: data.currentGW });
  }

  if (action === 'reset_all_gws') {
    db.reset();
    scheduleAutoSyncToGitHub('Reset all Gameweeks to GW 1 (preserved squads & users)');
    return res.json({ success: true, currentGW: 1 });
  }

  return res.status(400).json({ error: 'Unknown gameweek action' });
});

// 10. Developer Admin: Add / Edit / Delete Player
app.post('/api/admin/player', (req: Request, res: Response) => {
  const { action, player, playerId, updates } = req.body;
  const data = db.getData();

  if (action === 'add' && player) {
    const id = 'p_custom_' + Date.now();
    const finalCost = Math.max(4.0, Math.round(Number(player.cost || 4.0) * 10) / 10);
    const newP: Player = {
      ...player,
      id,
      cost: finalCost,
      totalPoints: 0,
      gwPoints: 0,
      form: 5.0,
      selectedByPercent: 5.0,
      isAvailable: true,
      gwStats: {},
    };
    data.players[id] = newP;
    db.save();
    scheduleAutoSyncToGitHub(`Added footballer ${newP.webName}`);
    return res.json({ success: true, player: newP });
  }

  if (action === 'edit' && playerId && updates) {
    const p = data.players[playerId];
    if (p) {
      if (updates.cost !== undefined) {
        updates.cost = Math.max(1.0, Math.round(Number(updates.cost) * 10) / 10);
        if (updates.previousCost === undefined && updates.cost !== p.cost) {
          updates.previousCost = p.previousCost ?? p.cost;
          updates.priceChange = Math.round((updates.cost - updates.previousCost) * 10) / 10;
        }
      }
      Object.assign(p, updates);
      db.save();
      const priceMsg = updates.cost !== undefined ? `price £${updates.cost}m` : 'details';
      scheduleAutoSyncToGitHub(`Updated ${p.webName} (${priceMsg})`);
      return res.json({ success: true, player: p });
    }
  }

  if (action === 'delete' && playerId) {
    const pName = data.players[playerId]?.webName || playerId;
    delete data.players[playerId];
    if (data.managers) {
      Object.values(data.managers).forEach((m) => {
        if (m.squad && Array.isArray(m.squad.players)) {
          m.squad.players = m.squad.players.filter((sp: any) => sp.playerId !== playerId);
        }
      });
    }
    db.save();
    scheduleAutoSyncToGitHub(`Deleted footballer ${pName}`);
    return res.json({ success: true, deleted: playerId });
  }

  res.status(400).json({ error: 'Invalid player operation' });
});

// 11. Developer Admin: Reset database to factory defaults
app.post('/api/admin/reset', (req: Request, res: Response) => {
  db.reset();
  scheduleAutoSyncToGitHub('Reset game state to GW 1');
  res.json({ success: true });
});

// 11a. Database Export
app.get('/api/admin/db/export', (req: Request, res: Response) => {
  const data = db.getData();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="db.json"');
  res.send(JSON.stringify(data, null, 2));
});

// 11b. Database Import
app.post('/api/admin/db/import', (req: Request, res: Response) => {
  const { dbData } = req.body;
  if (!dbData || typeof dbData !== 'object' || !dbData.players) {
    return res.status(400).json({ error: 'Invalid database JSON format' });
  }
  db.setData(dbData);
  scheduleAutoSyncToGitHub('Imported database JSON');
  res.json({ success: true, message: 'Database imported and saved successfully!' });
});

// 12. Payment & Charity Links Settings
app.get('/api/payment-settings', (req: Request, res: Response) => {
  const data = db.getData();
  res.json({
    bogLink: data.paymentSettings?.bogLink || 'https://egreve.bog.ge/KCL26_charity',
    tbcLink: data.paymentSettings?.tbcLink || '',
    entryFeeGEL: data.paymentSettings?.entryFeeGEL || 3,
    requireActivationCode: Boolean(data.paymentSettings?.requireActivationCode),
  });
});

app.post('/api/admin/payment-settings', (req: Request, res: Response) => {
  const { bogLink, tbcLink, entryFeeGEL, requireActivationCode } = req.body;
  const data = db.getData();

  data.paymentSettings = {
    bogLink: typeof bogLink === 'string' ? bogLink.trim() : (data.paymentSettings?.bogLink || ''),
    tbcLink: typeof tbcLink === 'string' ? tbcLink.trim() : (data.paymentSettings?.tbcLink || ''),
    entryFeeGEL: typeof entryFeeGEL === 'number' ? entryFeeGEL : (data.paymentSettings?.entryFeeGEL || 3),
    requireActivationCode: typeof requireActivationCode === 'boolean' ? requireActivationCode : Boolean(data.paymentSettings?.requireActivationCode),
  };

  db.save();
  scheduleAutoSyncToGitHub('Updated BOG/TBC payment settings');
  res.json({ success: true, settings: data.paymentSettings });
});

// 13. Activation Codes Management
app.get('/api/admin/activation-codes', (req: Request, res: Response) => {
  const data = db.getData();
  res.json({ codes: data.activationCodes || [] });
});

app.post('/api/admin/activation-codes/generate', (req: Request, res: Response) => {
  const { count } = req.body;
  const numCodes = Math.min(50, Math.max(1, Number(count) || 1));
  const data = db.getData();
  if (!Array.isArray(data.activationCodes)) {
    data.activationCodes = [];
  }

  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const newCodes: ActivationCode[] = [];

  for (let i = 0; i < numCodes; i++) {
    let rand = '';
    for (let c = 0; c < 4; c++) {
      rand += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    const code = `KCL-${rand}`;
    if (!data.activationCodes.some((existing) => existing.code === code)) {
      const codeObj: ActivationCode = {
        code,
        createdAt: new Date().toISOString(),
        isUsed: false,
      };
      data.activationCodes.unshift(codeObj);
      newCodes.push(codeObj);
    }
  }

  db.save();
  scheduleAutoSyncToGitHub(`Generated ${newCodes.length} activation codes`);
  res.json({ success: true, codes: newCodes, allCodes: data.activationCodes });
});

app.delete('/api/admin/activation-codes/:code', (req: Request, res: Response) => {
  const targetCode = req.params.code.toUpperCase();
  const data = db.getData();
  if (!Array.isArray(data.activationCodes)) {
    data.activationCodes = [];
  }

  const initialLen = data.activationCodes.length;
  data.activationCodes = data.activationCodes.filter((c) => c.code.toUpperCase() !== targetCode);

  if (data.activationCodes.length !== initialLen) {
    db.save();
    scheduleAutoSyncToGitHub(`Revoked activation code ${targetCode}`);
  }

  res.json({ success: true });
});

// In-memory runtime GitHub token (can be set via environment variable or admin portal)
const TOKEN_FILE = path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), '.github_token');

export function loadStoredGithubToken(): string {
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim()) {
    return process.env.GITHUB_TOKEN.trim();
  }
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const stored = fs.readFileSync(TOKEN_FILE, 'utf-8').trim();
      if (stored) return stored;
    }
  } catch (e) {}
  return '';
}

export function saveStoredGithubToken(token: string) {
  runtimeGithubToken = token;
  try {
    if (token) {
      fs.writeFileSync(TOKEN_FILE, token, 'utf-8');
    } else if (fs.existsSync(TOKEN_FILE)) {
      fs.unlinkSync(TOKEN_FILE);
    }
  } catch (e) {
    console.warn('Failed to persist token file:', e);
  }
}

let runtimeGithubToken = loadStoredGithubToken();
let autoSyncTimer: NodeJS.Timeout | null = null;
let hasPendingLocalChanges = false;
let lastLocalWriteTime = 0;
let isCommittingToGitHub = false;
let pendingCommitAfterCurrent = false;
let pendingCommitReason = '';

export function applyFixtureEventsToPlayers(
  fixture: Fixture,
  data: DatabaseSchema,
  overrideBody?: any
): boolean {
  if (!fixture || !fixture.isFinished || !data.players) return false;

  const playerMinutes = overrideBody?.playerMinutes ?? fixture.playerMinutes ?? {};
  if (!playerMinutes || Object.keys(playerMinutes).length === 0) return false;

  const gw = fixture.gameweek;
  const homeScore = overrideBody?.homeScore ?? fixture.homeScore ?? 0;
  const awayScore = overrideBody?.awayScore ?? fixture.awayScore ?? 0;
  const goalScorers = overrideBody?.goalScorers ?? fixture.goalScorers ?? [];
  const yellowCards = overrideBody?.yellowCards ?? fixture.yellowCards ?? [];
  const redCards = overrideBody?.redCards ?? fixture.redCards ?? [];
  const penaltiesSaved = overrideBody?.penaltiesSaved ?? fixture.penaltiesSaved ?? {};
  const penaltiesMissed = overrideBody?.penaltiesMissed ?? fixture.penaltiesMissed ?? {};
  const playerAssists = overrideBody?.playerAssists ?? fixture.playerAssists ?? {};
  const playerSaves = overrideBody?.playerSaves ?? fixture.playerSaves ?? {};
  const mvpPlayerIds = overrideBody?.mvpPlayerIds ?? fixture.mvpPlayerIds ?? [];
  const mvpBonus = overrideBody?.mvpBonus ?? fixture.mvpBonus ?? {};
  const venue = overrideBody?.venue ?? fixture.venue ?? 'parki';

  const normClub = (c: string) => (c === 'SCH' ? 'SCH_11_5' : c);
  const homePlayers = Object.values(data.players).filter(
    (p: Player) => normClub(p.clubId) === normClub(fixture.homeClubId)
  );
  const awayPlayers = Object.values(data.players).filter(
    (p: Player) => normClub(p.clubId) === normClub(fixture.awayClubId)
  );
  const allMatchPlayers = [...homePlayers, ...awayPlayers];

  const goalCount: Record<string, number> = {};
  const assistCount: Record<string, number> = { ...(playerAssists || {}) };
  const ownGoalCount: Record<string, number> = {};

  (goalScorers || []).forEach((g: any) => {
    if (g.isOwnGoal) {
      ownGoalCount[g.playerId] = (ownGoalCount[g.playerId] || 0) + 1;
    } else {
      goalCount[g.playerId] = (goalCount[g.playerId] || 0) + 1;
    }
    if (g.assistPlayerId && (!playerAssists || playerAssists[g.assistPlayerId] === undefined)) {
      assistCount[g.assistPlayerId] = (assistCount[g.assistPlayerId] || 0) + 1;
    }
  });

  const homeCleanSheet = (awayScore || 0) === 0;
  const awayCleanSheet = (homeScore || 0) === 0;

  let anyModified = false;

  for (const player of allMatchPlayers) {
    const mins = playerMinutes?.[player.id] || 0;
    if (mins === 0) continue;

    const isHomeTeam = homePlayers.some((p: Player) => p.id === player.id);
    const hasCleanSheet = isHomeTeam ? homeCleanSheet : awayCleanSheet;
    const goalsConceded = isHomeTeam ? (awayScore || 0) : (homeScore || 0);

    let bonus = 0;
    let isMVP = false;
    let mvpRank: 1 | 2 | 3 | undefined = undefined;

    if (mvpBonus && typeof mvpBonus[player.id] === 'number') {
      bonus = mvpBonus[player.id];
      isMVP = bonus > 0;
      if (bonus === 3) mvpRank = 1;
      else if (bonus === 2) mvpRank = 2;
      else if (bonus === 1) mvpRank = 3;
    } else if (Array.isArray(mvpPlayerIds)) {
      const idx = mvpPlayerIds.indexOf(player.id);
      if (idx === 0) { bonus = 3; isMVP = true; mvpRank = 1; }
      else if (idx === 1) { bonus = 2; isMVP = true; mvpRank = 2; }
      else if (idx === 2) { bonus = 1; isMVP = true; mvpRank = 3; }
    }

    if (!player.gwStats) player.gwStats = {};

    const stats: PlayerStats = {
      minutes: mins,
      goals: goalCount[player.id] || 0,
      assists: assistCount[player.id] || 0,
      cleanSheet: hasCleanSheet && mins >= 20,
      goalsConceded: goalsConceded,
      yellowCards: (yellowCards || []).filter((id: string) => id === player.id).length,
      redCards: (redCards || []).filter((id: string) => id === player.id).length,
      penaltiesSaved: penaltiesSaved?.[player.id] || 0,
      penaltiesMissed: penaltiesMissed?.[player.id] || 0,
      ownGoals: ownGoalCount[player.id] || 0,
      isMVP: isMVP,
      bonus: bonus,
      mvpRank: mvpRank,
      saves: playerSaves?.[player.id] || 0,
    };

    player.gwStats[gw] = stats;

    const isOnePrice = venue === 'one_price';
    player.gwPoints = calculatePlayerPoints(player.position, stats, isOnePrice, player.id);

    // Recalculate total points across all GWs
    let sum = 0;
    for (const gwKey of Object.keys(player.gwStats)) {
      const gwNum = parseInt(gwKey, 10);
      const gwFixture = data.fixtures.find((f: Fixture) => {
        const nClub = normClub(player.clubId);
        return f.gameweek === gwNum && (normClub(f.homeClubId) === nClub || normClub(f.awayClubId) === nClub);
      });
      const gwIsOnePrice = gwFixture?.venue === 'one_price';
      sum += calculatePlayerPoints(player.position, player.gwStats[gwNum], gwIsOnePrice, player.id);
    }
    player.totalPoints = sum;
    anyModified = true;
  }

  return anyModified;
}

export function syncAllFinishedFixturesStats(data: DatabaseSchema): boolean {
  if (!data || !Array.isArray(data.fixtures) || !data.players) return false;
  let changed = false;
  for (const f of data.fixtures) {
    if (f.isFinished && f.playerMinutes && Object.keys(f.playerMinutes).length > 0) {
      const updated = applyFixtureEventsToPlayers(f, data);
      if (updated) changed = true;
    }
  }

  // Ensure all managers have historical snapshots initialized for completed gameweeks and used chips locked
  if (data.managers) {
    const maxGW = Math.max(Number(data.currentGW || 1), 1);
    for (const m of Object.values(data.managers)) {
      if (!m.squad) continue;
      if (!m.squad.gameweekSquads) {
        m.squad.gameweekSquads = {};
        changed = true;
      }
      if (!m.squad.gameweekChips) {
        m.squad.gameweekChips = {};
        changed = true;
      }
      if (!m.squad.usedChips) {
        m.squad.usedChips = { triple_captain: false, bench_boost: false, wildcard: false };
        changed = true;
      }
      if (!m.squad.gwTransferPenalties) {
        m.squad.gwTransferPenalties = {};
        changed = true;
      }
      if (typeof m.squad.accumulatedTransferPenalties !== 'number') {
        m.squad.accumulatedTransferPenalties = 0;
        changed = true;
      }
      if (typeof m.squad.freeTransfers !== 'number') {
        m.squad.freeTransfers = 1;
        changed = true;
      }

      // Only chips from PAST/COMPLETED gameweeks must be permanently locked in usedChips
      for (const [gwStr, chipName] of Object.entries(m.squad.gameweekChips)) {
        const gwNum = Number(gwStr);
        if (chipName && gwNum < maxGW) {
          if (!m.squad.usedChips[chipName]) {
            m.squad.usedChips[chipName] = true;
            changed = true;
          }
        }
      }

      for (let gw = 1; gw <= maxGW; gw++) {
        const gwFixtures = (data.fixtures || []).filter((f: any) => Number(f.gameweek) === gw);
        const isGwFinished = gw < maxGW || (gwFixtures.length > 0 && gwFixtures.every((f: any) => Boolean(f.isFinished)));
        if (isGwFinished) {
          if (m.squad.gameweekChips[gw]) {
            const usedChip = m.squad.gameweekChips[gw];
            if (usedChip && !m.squad.usedChips[usedChip]) {
              m.squad.usedChips[usedChip] = true;
              changed = true;
            }
            if (m.squad.activeChip === usedChip) {
              m.squad.activeChip = null;
              changed = true;
            }
          }
        }
      }
    }
  }

  if (changed) {
    recalculateAllManagersLeaguePoints(data);
  }
  return changed;
}

export function mergeDatabases(local: DatabaseSchema, remote: any): boolean {
  if (!remote || typeof remote !== 'object') return false;
  let changed = false;

  // 0. Merge deletedUserIds (tombstones to prevent resurrecting deleted users)
  const localDeleted = new Set(local.deletedUserIds || []);
  if (Array.isArray(remote.deletedUserIds)) {
    for (const did of remote.deletedUserIds) {
      if (!localDeleted.has(did)) {
        localDeleted.add(did);
        changed = true;
      }
    }
  }
  local.deletedUserIds = Array.from(localDeleted);

  // Prune any tombstones from local if present
  for (const did of localDeleted) {
    if (local.users && local.users[did]) {
      delete local.users[did];
      changed = true;
    }
    if (local.managers && local.managers[did]) {
      delete local.managers[did];
      changed = true;
    }
  }

  // 1. Merge users
  if (remote.users && typeof remote.users === 'object') {
    if (!local.users) {
      local.users = {};
      changed = true;
    }
    for (const [uid, rUser] of Object.entries(remote.users as Record<string, any>)) {
      if (localDeleted.has(uid)) continue; // Do not resurrect deleted user
      if (!local.users[uid]) {
        local.users[uid] = rUser;
        changed = true;
      } else {
        const lUser = local.users[uid];
        // Preserve admin status if set on either
        if ((rUser.isAdmin || rUser.role === 'admin') && !lUser.isAdmin) {
          lUser.isAdmin = true;
          lUser.role = 'admin';
          changed = true;
        }
        // Preserve approval if approved on either
        if (rUser.isApproved && !lUser.isApproved) {
          lUser.isApproved = true;
          changed = true;
        }
        // Preserve password hash if updated
        if (rUser.passwordHash && rUser.salt && rUser.passwordHash !== lUser.passwordHash && !lUser.passwordHash) {
          lUser.passwordHash = rUser.passwordHash;
          lUser.salt = rUser.salt;
          changed = true;
        }
        // Fill missing manager or team name
        if (rUser.managerName && !lUser.managerName) {
          lUser.managerName = rUser.managerName;
          changed = true;
        }
        if (rUser.teamName && !lUser.teamName) {
          lUser.teamName = rUser.teamName;
          changed = true;
        }
        if (rUser.grade && !lUser.grade) {
          lUser.grade = rUser.grade;
          changed = true;
        }
        if (rUser.parallel && !lUser.parallel) {
          lUser.parallel = rUser.parallel;
          changed = true;
        }
        if (rUser.realName && !lUser.realName) {
          lUser.realName = rUser.realName;
          changed = true;
        }
        if (rUser.showRealNamePublicly !== undefined && lUser.showRealNamePublicly === undefined) {
          lUser.showRealNamePublicly = rUser.showRealNamePublicly;
          changed = true;
        }
        if (rUser.role === 'ref' || rUser.isReferee) {
          lUser.role = 'ref';
          lUser.isReferee = true;
          changed = true;
        }
      }
    }
  }

  // 2. Merge managers
  if (remote.managers && typeof remote.managers === 'object') {
    if (!local.managers) {
      local.managers = {};
      changed = true;
    }
    for (const [mid, rMgr] of Object.entries(remote.managers as Record<string, any>)) {
      if (localDeleted.has(mid)) continue; // Do not resurrect deleted manager
      if (!local.managers[mid]) {
        local.managers[mid] = rMgr;
        changed = true;
      } else {
        const lMgr = local.managers[mid];
        const lSquadCount = lMgr.squad?.players?.length || 0;
        const rSquadCount = rMgr.squad?.players?.length || 0;
        if (lSquadCount === 0 && rSquadCount > 0) {
          lMgr.squad = rMgr.squad;
          changed = true;
        } else if (lMgr.squad && rMgr.squad) {
          const joinedMs = new Date(lMgr.joinedAt || local.users?.[mid]?.createdAt || 0).getTime();
          const gw1DeadlineMs = new Date('2026-09-28T11:12:21.384Z').getTime();

          if (rMgr.squad.gameweekSquads && typeof rMgr.squad.gameweekSquads === 'object') {
            if (!lMgr.squad.gameweekSquads) lMgr.squad.gameweekSquads = {};
            for (const [gwKey, snap] of Object.entries(rMgr.squad.gameweekSquads)) {
              if (gwKey === '1' && joinedMs > gw1DeadlineMs) {
                continue;
              }
              if (!lMgr.squad.gameweekSquads[gwKey]) {
                lMgr.squad.gameweekSquads[gwKey] = snap;
                changed = true;
              }
            }
          }
          if (joinedMs > gw1DeadlineMs) {
            if (lMgr.squad.gameweekSquads?.[1]) {
              delete lMgr.squad.gameweekSquads[1];
              changed = true;
            }
            if (lMgr.squad.gameweekChips?.[1]) {
              delete lMgr.squad.gameweekChips[1];
              changed = true;
            }
          }
          if (rMgr.squad.gameweekChips && typeof rMgr.squad.gameweekChips === 'object') {
            if (!lMgr.squad.gameweekChips) lMgr.squad.gameweekChips = {};
            for (const [gwKey, chip] of Object.entries(rMgr.squad.gameweekChips)) {
              if (!lMgr.squad.gameweekChips[gwKey] && chip) {
                lMgr.squad.gameweekChips[gwKey] = chip;
                changed = true;
              }
            }
          }
          if (rMgr.squad.usedChips && typeof rMgr.squad.usedChips === 'object') {
            if (!lMgr.squad.usedChips) lMgr.squad.usedChips = { triple_captain: false, bench_boost: false, wildcard: false };
            for (const [chipKey, isUsed] of Object.entries(rMgr.squad.usedChips)) {
              if (isUsed && !lMgr.squad.usedChips[chipKey]) {
                lMgr.squad.usedChips[chipKey] = true;
                changed = true;
              }
            }
          }
        }
      }
    }
  }

  // 3. Clean up orphaned demo managers with no user account
  if (local.users && Object.keys(local.users).length > 0 && local.managers) {
    const validUserIds = new Set(Object.keys(local.users));
    for (const mid of Object.keys(local.managers)) {
      if (!validUserIds.has(mid)) {
        delete local.managers[mid];
        changed = true;
      }
    }
  }

  // 4. Merge Global League members
  const localGlobal = local.leagues?.find((l) => l.isGlobal);
  const remoteGlobal = (remote.leagues || []).find((l: any) => l.isGlobal);
  if (localGlobal && remoteGlobal && Array.isArray(remoteGlobal.members)) {
    const validUserIds = local.users ? new Set(Object.keys(local.users)) : null;
    const existingIds = new Set(localGlobal.members.map((m) => m.id));
    for (const rm of remoteGlobal.members) {
      if (!existingIds.has(rm.id)) {
        if (!validUserIds || validUserIds.has(rm.id)) {
          localGlobal.members.push(rm);
          existingIds.add(rm.id);
          changed = true;
        }
      }
    }
    if (validUserIds) {
      const beforeLen = localGlobal.members.length;
      localGlobal.members = localGlobal.members.filter((m) => validUserIds.has(m.id));
      if (localGlobal.members.length !== beforeLen) {
        changed = true;
      }
    }
  }

  // 5. Merge Activation Codes
  if (Array.isArray(remote.activationCodes)) {
    if (!Array.isArray(local.activationCodes)) {
      local.activationCodes = [];
      changed = true;
    }
    const localMap = new Map(local.activationCodes.map((c) => [c.code.toUpperCase(), c]));
    for (const rc of remote.activationCodes) {
      const k = rc.code.toUpperCase();
      if (!localMap.has(k)) {
        local.activationCodes.push(rc);
        localMap.set(k, rc);
        changed = true;
      } else {
        const lc = localMap.get(k)!;
        if (rc.isUsed && !lc.isUsed) {
          lc.isUsed = true;
          lc.usedBy = lc.usedBy || rc.usedBy;
          lc.usedAt = lc.usedAt || rc.usedAt;
          changed = true;
        }
      }
    }
  }

  // 6. Merge Fixtures (scores, finished status, dates, goal scorers, venues)
  if (Array.isArray(remote.fixtures) && Array.isArray(local.fixtures)) {
    for (const rf of remote.fixtures) {
      const lf = local.fixtures.find((f) => f.id === rf.id);
      if (lf) {
        const remoteHasMoreMinutes = Object.keys(rf.playerMinutes || {}).length > Object.keys(lf.playerMinutes || {}).length;
        const remoteIsFinished = rf.isFinished && !lf.isFinished;
        const remoteScoreUpdated = rf.homeScore != null && (lf.homeScore == null || rf.homeScore !== lf.homeScore || rf.awayScore !== lf.awayScore);
        const remoteHasMoreScorers = Array.isArray(rf.goalScorers) && rf.goalScorers.length > (lf.goalScorers?.length || 0);
        const remoteHasBonus = Object.keys(rf.mvpBonus || {}).length > Object.keys(lf.mvpBonus || {}).length;

        if (
          remoteIsFinished ||
          remoteScoreUpdated ||
          remoteHasMoreMinutes ||
          remoteHasMoreScorers ||
          remoteHasBonus ||
          (rf.date && !lf.date) ||
          (rf.venue && !lf.venue) ||
          (rf.completedAt && !lf.completedAt)
        ) {
          Object.assign(lf, rf);
          changed = true;
        }
      } else {
        local.fixtures.push(rf);
        changed = true;
      }
    }
  }

  // 7. Merge players (stats, points, photos, costs)
  if (remote.players && typeof remote.players === 'object' && local.players) {
    for (const [pid, rp] of Object.entries(remote.players as Record<string, any>)) {
      if (!local.players[pid]) {
        local.players[pid] = rp;
        changed = true;
      } else {
        const lp = local.players[pid];
        // 1. Merge photo
        if (rp.photoUrl && !lp.photoUrl) {
          lp.photoUrl = rp.photoUrl;
          changed = true;
        }
        // 2. Merge gameweek stats and points (CRITICAL: preserve match stats from remote)
        if (rp.gwStats && Object.keys(rp.gwStats).length > 0) {
          if (!lp.gwStats || Object.keys(lp.gwStats).length === 0) {
            lp.gwStats = rp.gwStats;
            lp.totalPoints = rp.totalPoints ?? lp.totalPoints;
            lp.gwPoints = rp.gwPoints ?? lp.gwPoints;
            changed = true;
          } else {
            for (const [gw, st] of Object.entries(rp.gwStats)) {
              const rStats = st as any;
              const lStats = lp.gwStats[gw];
              if (!lStats) {
                lp.gwStats[gw] = rStats;
                changed = true;
              } else {
                const rSum = (rStats.minutes || 0) + (rStats.goals || 0) + (rStats.assists || 0);
                const lSum = (lStats.minutes || 0) + (lStats.goals || 0) + (lStats.assists || 0);
                if (rSum > lSum || (rStats.isMVP && !lStats.isMVP) || (rStats.cleanSheet && !lStats.cleanSheet)) {
                  lp.gwStats[gw] = { ...lStats, ...rStats };
                  changed = true;
                }
              }
            }
            if ((rp.totalPoints || 0) > (lp.totalPoints || 0)) {
              lp.totalPoints = rp.totalPoints;
              lp.gwPoints = rp.gwPoints ?? lp.gwPoints;
              changed = true;
            }
          }
        }
        // 3. Merge price changes if remote has updated cost
        if (rp.cost !== undefined && rp.cost !== lp.cost && rp.priceChange !== undefined) {
          lp.cost = rp.cost;
          lp.previousCost = rp.previousCost;
          lp.priceChange = rp.priceChange;
          changed = true;
        }
      }
    }
  }

  // 8. Merge Payment Settings
  if (remote.paymentSettings && typeof remote.paymentSettings === 'object') {
    if (!local.paymentSettings) {
      local.paymentSettings = remote.paymentSettings;
      changed = true;
    }
  }

  // 9. Merge Pending Player Photos
  if (Array.isArray(remote.pendingPhotos)) {
    if (!Array.isArray(local.pendingPhotos)) {
      local.pendingPhotos = [];
    }
    const localPhotoIds = new Set((local.pendingPhotos as any[]).map((p) => p.id));
    for (const rp of remote.pendingPhotos) {
      if (!localPhotoIds.has(rp.id)) {
        local.pendingPhotos.push(rp);
        changed = true;
      }
    }
  }

  const fixturesSynced = syncAllFinishedFixturesStats(local);
  if (fixturesSynced) {
    changed = true;
  }

  return changed;
}

export async function syncDatabaseFromGitHub(explicitToken?: string, force: boolean = false): Promise<{ success: boolean; changed: boolean; error?: string }> {
  // If not explicitly forced (e.g. boot-up or manual dev action), protect pending local writes
  if (!force) {
    if (hasPendingLocalChanges || isCommittingToGitHub || (Date.now() - lastLocalWriteTime < 15000)) {
      console.log('[GitHub Sync] Skipped: local in-memory modifications are active/pending commit.');
      return { success: true, changed: false };
    }
  }

  db.isSyncing = true;
  try {
    const token = explicitToken || runtimeGithubToken || loadStoredGithubToken();
    const owner = process.env.GITHUB_OWNER || 'TheIulius';
    const repo = process.env.GITHUB_REPO || 'premier-league-fantasy';
    const branch = process.env.GITHUB_BRANCH || 'data';
    const filePath = 'data/db.json';
    let remoteData: any = null;

    // Method 1: Try GitHub REST API if token is configured
    if (token) {
      try {
        const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Premier-League-Fantasy-App',
          },
        });

        if (getRes.ok) {
          const getJson: any = await getRes.json();
          if (getJson.content) {
            const remoteRaw = Buffer.from(getJson.content, 'base64').toString('utf-8');
            remoteData = JSON.parse(remoteRaw);
            console.log('[GitHub Sync] Retrieved latest database via GitHub REST API.');
          }
        } else {
          console.warn(`[GitHub Sync] GitHub REST API returned HTTP ${getRes.status}. Attempting git fallback...`);
        }
      } catch (apiErr: any) {
        console.warn('[GitHub Sync] GitHub REST API request failed:', apiErr?.message || apiErr);
      }
    }

    // Method 2: Git CLI fallback (works on Render and local)
    if (!remoteData) {
      try {
        const { execSync } = await import('child_process');
        const gitUrl = token
          ? `https://x-access-token:${token}@github.com/${owner}/${repo}.git`
          : 'origin';
        execSync(`git fetch ${gitUrl} data --depth=1`, { stdio: 'pipe', timeout: 15000 });
        const gitRaw = execSync('git show FETCH_HEAD:data/db.json', {
          encoding: 'utf-8',
          timeout: 15000,
          maxBuffer: 50 * 1024 * 1024,
        });
        if (gitRaw && gitRaw.trim().startsWith('{')) {
          remoteData = JSON.parse(gitRaw);
          console.log('[GitHub Sync] Successfully retrieved latest database via local git CLI fallback.');
        }
      } catch (gitErr: any) {
        console.warn('[GitHub Sync] Git CLI fallback skipped or failed:', gitErr?.message || gitErr);
      }
    }

    if (!remoteData) {
      const errReason = token ? 'Failed to fetch from GitHub API and Git CLI' : 'No GitHub token configured and git CLI fallback failed';
      return { success: false, changed: false, error: errReason };
    }

    if (force) {
      // Direct full database load (initial boot or explicit admin reset)
      const local = db.getData();
      const remoteFinished = (remoteData.fixtures || []).filter((f: any) => f.isFinished).length;
      const localFinished = (local?.fixtures || []).filter((f: any) => f.isFinished).length;
      if (localFinished > remoteFinished) {
        console.warn(`[GitHub Sync] Local has ${localFinished} finished fixtures but remote only has ${remoteFinished}. Merging instead of overwriting.`);
        const changed = mergeDatabases(local, remoteData);
        syncAllFinishedFixturesStats(local);
        if (changed) db.saveSilent();
        return { success: true, changed: true };
      } else {
        db.setData(remoteData);
        syncAllFinishedFixturesStats(db.getData());
        console.log('[GitHub Sync] Remote database loaded into memory (forced).');
        return { success: true, changed: true };
      }
    } else {
      // Safe non-destructive merge that never reverts local squads or approvals
      const local = db.getData();
      const changed = mergeDatabases(local, remoteData);
      syncAllFinishedFixturesStats(local);
      if (changed) {
        db.saveSilent();
        console.log('[GitHub Sync] Remote database merged into memory without clobbering local changes.');
      }
      return { success: true, changed };
    }
  } catch (err: any) {
    console.warn('[GitHub Sync] Error syncing from GitHub:', err?.message || err);
    return { success: false, changed: false, error: err?.message };
  } finally {
    db.isSyncing = false;
  }
}

export async function commitDbToGitHub(message: string, explicitToken?: string): Promise<{ success: boolean; commitUrl?: string; error?: string }> {
  const token = explicitToken || runtimeGithubToken || process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'TheIulius';
  const repo = process.env.GITHUB_REPO || 'premier-league-fantasy';
  const branch = process.env.GITHUB_BRANCH || 'data';
  const filePath = 'data/db.json';

  if (!token) {
    return { success: false, error: 'No GitHub token configured' };
  }

  // If already committing, queue another commit after current finishes to avoid SHA 409 conflict
  if (isCommittingToGitHub) {
    pendingCommitAfterCurrent = true;
    pendingCommitReason = message;
    return { success: true };
  }

  isCommittingToGitHub = true;
  try {
    // 1. Fetch current file SHA from GitHub so we can update it without a conflict
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Premier-League-Fantasy-App',
      },
    });

    let sha: string | undefined;
    if (getRes.ok) {
      const getJson: any = await getRes.json();
      sha = getJson.sha;

      // CRITICAL DATA PRESERVATION GUARD:
      // Merge remote database into local BEFORE committing!
      // This guarantees that any matches, stats, or users that exist on GitHub will NEVER be wiped
      // by a local in-memory instance that started with an older database state.
      if (getJson.content) {
        try {
          const remoteRaw = Buffer.from(getJson.content, 'base64').toString('utf-8');
          const remoteData = JSON.parse(remoteRaw);
          const local = db.getData();
          const changed = mergeDatabases(local, remoteData);
          if (changed) {
            console.log('[GitHub Commit Guard] Merged remote changes into local database before committing to prevent regression.');
            db.saveSilent();
          }
        } catch (mergeErr) {
          console.warn('[GitHub Commit Guard] Non-fatal error merging remote data:', mergeErr);
        }
      }
    }

    // 2. Commit the live in-memory database directly to GitHub
    const contentStr = JSON.stringify(db.getData(), null, 2);
    const base64Content = Buffer.from(contentStr, 'utf-8').toString('base64');

    const commitMsg = message.includes('[skip ci]') ? message : `${message} [skip ci]`;
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Premier-League-Fantasy-App',
      },
      body: JSON.stringify({
        message: commitMsg,
        content: base64Content,
        sha,
        branch,
      }),
    });

    const putJson: any = await putRes.json();
    if (!putRes.ok) {
      console.warn('Auto-commit to GitHub failed:', putJson?.message || putJson);
      return { success: false, error: putJson?.message || 'Failed to commit to GitHub' };
    }

    console.log(`Successfully committed database to GitHub: "${commitMsg}"`);
    hasPendingLocalChanges = false;
    return { success: true, commitUrl: putJson.commit?.html_url };
  } catch (err: any) {
    console.warn('GitHub auto-sync error:', err);
    return { success: false, error: err?.message || 'Sync error' };
  } finally {
    isCommittingToGitHub = false;
    if (pendingCommitAfterCurrent) {
      pendingCommitAfterCurrent = false;
      const nextReason = pendingCommitReason;
      setTimeout(() => {
        commitDbToGitHub(nextReason);
      }, 300);
    }
  }
}

export function scheduleAutoSyncToGitHub(reason: string, immediate: boolean = false) {
  hasPendingLocalChanges = true;
  lastLocalWriteTime = Date.now();

  const token = runtimeGithubToken || process.env.GITHUB_TOKEN;
  if (!token) return;

  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  const delay = immediate ? 50 : 1000; // 1s debounce for batch edits, 50ms for immediate
  autoSyncTimer = setTimeout(async () => {
    try {
      await commitDbToGitHub(`Admin update: ${reason}`);
    } catch (e) {
      console.warn('Background auto-sync failed:', e);
    }
  }, delay);
}

// Automatically sync all database saves (user registrations, squads, transfers, match events) to GitHub
db.setOnSaveCallback((reason) => {
  scheduleAutoSyncToGitHub(reason || 'Data updated');
});

// Check Server Auto-Sync Status
app.get('/api/admin/db/sync-status', (req: Request, res: Response) => {
  const hasToken = Boolean(runtimeGithubToken || process.env.GITHUB_TOKEN || loadStoredGithubToken());
  res.json({
    hasServerToken: hasToken,
    owner: process.env.GITHUB_OWNER || 'TheIulius',
    repo: process.env.GITHUB_REPO || 'premier-league-fantasy',
    branch: process.env.GITHUB_BRANCH || 'data',
  });
});

// Set or Update Server Token in Memory & Disk
app.post('/api/admin/db/set-token', (req: Request, res: Response) => {
  const { token } = req.body;
  if (token && typeof token === 'string' && token.trim().length > 0) {
    saveStoredGithubToken(token.trim());
    return res.json({ success: true, message: 'Server GitHub token activated! Auto-sync is now active.' });
  }
  saveStoredGithubToken('');
  res.json({ success: true, message: 'Server GitHub token cleared.' });
});

// 11c. Sync / Commit Database directly to GitHub
app.post('/api/admin/db/sync-github', async (req: Request, res: Response) => {
  const token = req.body.token || runtimeGithubToken || process.env.GITHUB_TOKEN || loadStoredGithubToken();
  if (req.body.token && !runtimeGithubToken) {
    saveStoredGithubToken(req.body.token.trim());
  }

  if (!token) {
    return res.status(400).json({
      error: 'GitHub Personal Access Token required. Provide token or set GITHUB_TOKEN on server.',
    });
  }

  const result = await commitDbToGitHub(req.body.message || 'Update database from Dev Portal', token);
  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  return res.json({
    success: true,
    message: 'Successfully committed database to GitHub!',
    commitUrl: result.commitUrl,
  });
});

// 11b. Developer Admin: Add Game / Fixture
app.post('/api/admin/fixture/add', (req: Request, res: Response) => {
  const { gameweek, homeClubId, awayClubId, homeScore, awayScore, isFinished, isLive, kickoffTime } = req.body;
  if (!gameweek || !homeClubId || !awayClubId) {
    return res.status(400).json({ error: 'gameweek, homeClubId, and awayClubId are required' });
  }
  const data = db.getData();
  const id = `fix_gw${gameweek}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const newFixture: Fixture = {
    id,
    gameweek: parseInt(gameweek, 10),
    homeClubId,
    awayClubId,
    homeScore: homeScore !== undefined && homeScore !== null && homeScore !== '' ? parseInt(homeScore, 10) : null,
    awayScore: awayScore !== undefined && awayScore !== null && awayScore !== '' ? parseInt(awayScore, 10) : null,
    isFinished: !!isFinished,
    isLive: !!isLive,
    kickoffTime: kickoffTime || 'TBD',
  };
  data.fixtures.push(newFixture);
  db.save();
  scheduleAutoSyncToGitHub(`Added GW ${gameweek} match`);
  res.json({ success: true, fixture: newFixture, fixtures: data.fixtures });
});

// 11c. Developer Admin: Update Game / Fixture
app.post('/api/admin/fixture/update', (req: Request, res: Response) => {
  const { id, updates } = req.body;
  if (!id || !updates) {
    return res.status(400).json({ error: 'id and updates are required' });
  }
  const data = db.getData();
  const fix = data.fixtures.find((f) => f.id === id);
  if (!fix) {
    return res.status(404).json({ error: 'Fixture not found' });
  }
  Object.assign(fix, updates);
  db.save();
  scheduleAutoSyncToGitHub(`Updated match fixture ${id}`);
  res.json({ success: true, fixture: fix, fixtures: data.fixtures });
});

// 11d. Developer Admin: Delete Game / Fixture
app.post('/api/admin/fixture/delete', (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }
  const data = db.getData();
  data.fixtures = data.fixtures.filter((f) => f.id !== id);
  db.save();
  scheduleAutoSyncToGitHub(`Deleted match fixture ${id}`);
  res.json({ success: true, fixtures: data.fixtures });
});

// 11e. Developer Admin: Add School Club / Team
app.post('/api/admin/club/add', (req: Request, res: Response) => {
  const { id, name, shortName, primaryColor, secondaryColor, textColor } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Team name is required' });
  }
  const data = db.getData();
  if (!data.clubs) data.clubs = { ...CLUBS };
  const clubId = id || `SCH_${name.trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
  const newClub: Club = {
    id: clubId,
    name: name.trim(),
    shortName: shortName?.trim() || name.trim().slice(0, 4).toUpperCase(),
    primaryColor: primaryColor || '#37003c',
    secondaryColor: secondaryColor || '#00ff87',
    textColor: textColor || '#ffffff',
  };
  data.clubs[clubId] = newClub;
  db.save();
  scheduleAutoSyncToGitHub(`Added team ${newClub.name}`);
  res.json({ success: true, club: newClub, clubs: data.clubs });
});



// 11d. Developer Admin: List Registered Users (Instant in-memory lookup)
app.get('/api/admin/users', (req: Request, res: Response) => {
  const data = db.getData();
  const usersList = Object.values(data.users || {}).map((u) => {
    const isAdmin = isUserAdmin(u.username) || u.role === 'admin' || Boolean(u.isAdmin);
    const isReferee = Boolean(u.role === 'ref' || u.isReferee);
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      managerName: u.managerName,
      teamName: u.teamName,
      createdAt: u.createdAt,
      role: u.role || (isAdmin ? 'admin' : isReferee ? 'ref' : 'user'),
      isAdmin,
      isReferee,
      isApproved: isAdmin || Boolean(u.isApproved),
      grade: u.grade,
      parallel: u.parallel,
      realName: u.realName,
      showRealNamePublicly: u.showRealNamePublicly,
    };
  });
  res.json({ success: true, users: usersList });
});

// Developer Admin: Explicitly Pull / Reload Database from GitHub
app.post('/api/admin/db/pull-github', async (req: Request, res: Response) => {
  const token = req.body.token || runtimeGithubToken || process.env.GITHUB_TOKEN;
  const result = await syncDatabaseFromGitHub(token, true);
  if (!result.success) {
    return res.status(500).json({ error: result.error || 'Failed to pull from GitHub' });
  }
  return res.json({ success: true, message: 'Database reloaded from GitHub data branch!' });
});

// 11e. Developer Admin: Approve / Unapprove User Account
app.post('/api/admin/user/approve', (req: Request, res: Response) => {
  const { userId, username, isApproved } = req.body;
  const data = db.getData();
  if (!data.users) data.users = {};

  const clean = (username || '').trim().toLowerCase();
  const user = Object.values(data.users).find(
    (u) => (userId && u.id === userId) || (clean && u.username.toLowerCase() === clean)
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const newStatus = typeof isApproved === 'boolean' ? isApproved : true;
  user.isApproved = newStatus;
  db.save();

  scheduleAutoSyncToGitHub(`Admin ${newStatus ? 'approved' : 'unapproved'} user @${user.username}`, true);

  res.json({
    success: true,
    message: `Account @${user.username} (${user.managerName}) is now ${newStatus ? 'Approved' : 'Pending Approval'}.`,
    user: {
      id: user.id,
      username: user.username,
      managerName: user.managerName,
      teamName: user.teamName,
      isApproved: user.isApproved,
    },
  });
});

// 11f. Developer Admin: Set User Role (Admin / Ref / Regular User)
app.post('/api/admin/user/set-role', (req: Request, res: Response) => {
  const { userId, username, role, isReferee } = req.body;
  const data = db.getData();
  if (!data.users) data.users = {};

  const clean = (username || '').trim().toLowerCase();
  const user = Object.values(data.users).find(
    (u) => (userId && u.id === userId) || (clean && u.username.toLowerCase() === clean)
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent demoting primary administrators
  if ((user.username === 'theiulius' || user.username === 'chaga') && role && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot change role of primary tournament administrators.' });
  }

  const targetRole: 'admin' | 'ref' | 'user' = role || (isReferee ? 'ref' : 'user');
  user.role = targetRole;
  user.isAdmin = targetRole === 'admin';
  user.isReferee = targetRole === 'ref' || Boolean(isReferee);
  if (targetRole === 'admin') {
    user.isApproved = true;
  }

  if (data.managers && data.managers[user.id]) {
    data.managers[user.id].role = targetRole;
    data.managers[user.id].isAdmin = user.isAdmin;
    data.managers[user.id].isReferee = user.isReferee;
    if (targetRole === 'admin') {
      data.managers[user.id].isApproved = true;
    }
  }

  db.save();
  scheduleAutoSyncToGitHub(`Admin set role of @${user.username} to ${targetRole}`, true);

  res.json({
    success: true,
    message: `@${user.username} (${user.managerName}) is now ${targetRole === 'ref' ? 'a trusted Referee (მსაჯი)' : targetRole === 'admin' ? 'an Admin' : 'a Regular Manager'}.`,
    user: {
      id: user.id,
      username: user.username,
      managerName: user.managerName,
      teamName: user.teamName,
      role: user.role,
      isAdmin: user.isAdmin,
      isReferee: user.isReferee,
      isApproved: user.isApproved,
    },
  });
});

// --- Player Profile Picture Suggestion & Admin Approval ---

// Any authenticated manager can suggest/upload a photo for a player
app.post('/api/player/photo/suggest', (req: Request, res: Response) => {
  const { playerId, photoUrl } = req.body;
  if (!playerId || !photoUrl) {
    return res.status(400).json({ error: 'playerId and photoUrl are required' });
  }

  const data = db.getData();
  const player = data.players[playerId];
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  // Identify submitting user from auth token or x-auth-username header
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const rawHeader = (req.headers['x-auth-username'] as string | undefined)?.trim();
  let usernameHeader = rawHeader;
  try {
    if (rawHeader) usernameHeader = decodeURIComponent(rawHeader);
  } catch (e) {}

  const user = token
    ? Object.values(data.users || {}).find((u) => u.token === token)
    : usernameHeader
    ? Object.values(data.users || {}).find((u) => u.username.toLowerCase() === usernameHeader.toLowerCase())
    : null;

  const isAdmin =
    (user && (isUserAdmin(user.username) || user.role === 'admin' || Boolean(user.isAdmin))) ||
    (usernameHeader && isUserAdmin(usernameHeader)) ||
    req.headers['x-admin-password'] === ADMIN_PASSWORD;

  const suggestedBy = user ? `@${user.username}` : usernameHeader ? `@${usernameHeader}` : (req.body.suggestedBy || 'manager');

  // If submitting user is an administrator, attach photo DIRECTLY without additional approval!
  if (isAdmin) {
    player.photoUrl = photoUrl;
    delete player.pendingPhotoUrl;
    if (Array.isArray(data.pendingPhotos)) {
      data.pendingPhotos = data.pendingPhotos.filter((p: any) => p.playerId !== playerId);
    }
    db.save();
    scheduleAutoSyncToGitHub(`Admin ${suggestedBy} set photo for player ${player.webName}`, true);
    return res.json({
      success: true,
      message: `Profile picture attached directly for ${player.webName}!`,
      photoUrl,
      isAdminDirect: true,
    });
  }

  if (!Array.isArray(data.pendingPhotos)) data.pendingPhotos = [];

  const photoEntry = {
    id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    playerId,
    photoUrl,
    suggestedBy,
    suggestedAt: new Date().toISOString(),
  };

  data.pendingPhotos.push(photoEntry);
  player.pendingPhotoUrl = photoUrl;

  db.save();
  scheduleAutoSyncToGitHub(`User ${suggestedBy} suggested photo for player ${player.webName}`);

  res.json({
    success: true,
    message: 'Photo submitted! Administrators will review and approve it shortly.',
    pendingPhoto: photoEntry,
    isAdminDirect: false,
  });
});

// Admin: Remove player photo
app.post('/api/admin/player-photo/remove', (req: Request, res: Response) => {
  const { playerId } = req.body;
  if (!playerId) {
    return res.status(400).json({ error: 'playerId is required' });
  }

  const data = db.getData();
  const player = data.players[playerId];
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const rawAdminHeader = (req.headers['x-auth-username'] as string | undefined)?.trim();
  let usernameHeader = rawAdminHeader;
  try {
    if (rawAdminHeader) usernameHeader = decodeURIComponent(rawAdminHeader);
  } catch (e) {}

  const user = token
    ? Object.values(data.users || {}).find((u) => u.token === token)
    : usernameHeader
    ? Object.values(data.users || {}).find((u) => u.username.toLowerCase() === usernameHeader.toLowerCase())
    : null;

  const isAdmin =
    (user && (isUserAdmin(user.username) || user.role === 'admin' || Boolean(user.isAdmin))) ||
    (usernameHeader && isUserAdmin(usernameHeader)) ||
    req.headers['x-admin-password'] === ADMIN_PASSWORD;

  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin authorization required to remove player photo' });
  }

  delete player.photoUrl;
  delete player.pendingPhotoUrl;
  if (data.pendingPhotos) {
    data.pendingPhotos = data.pendingPhotos.filter((p: any) => p.playerId !== playerId);
  }

  db.save();
  scheduleAutoSyncToGitHub(`Admin @${user?.username || usernameHeader || 'admin'} removed photo for player ${player.webName}`, true);

  res.json({
    success: true,
    message: `Profile picture removed for ${player.webName}`,
  });
});

// Admin: List all pending player photos
app.get('/api/admin/player-photos', (req: Request, res: Response) => {
  const data = db.getData();
  res.json({
    success: true,
    pendingPhotos: data.pendingPhotos || [],
  });
});

// Admin: Approve or Reject a player photo
app.post('/api/admin/player-photo/review', (req: Request, res: Response) => {
  const { photoId, approve } = req.body;
  if (!photoId) {
    return res.status(400).json({ error: 'photoId is required' });
  }

  const data = db.getData();
  if (!data.pendingPhotos) data.pendingPhotos = [];

  const idx = data.pendingPhotos.findIndex((p: any) => p.id === photoId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Pending photo not found' });
  }

  const item = data.pendingPhotos[idx];
  const player = data.players[item.playerId];

  if (approve) {
    if (player) {
      player.photoUrl = item.photoUrl;
      delete player.pendingPhotoUrl;
    }
  } else {
    if (player && player.pendingPhotoUrl === item.photoUrl) {
      delete player.pendingPhotoUrl;
    }
  }

  data.pendingPhotos.splice(idx, 1);
  db.save();

  scheduleAutoSyncToGitHub(`Admin ${approve ? 'approved' : 'rejected'} photo for player ${player?.webName || item.playerId}`, true);

  res.json({
    success: true,
    message: approve ? `Photo approved for ${player?.webName || 'player'}!` : 'Photo rejected.',
    photoUrl: approve ? item.photoUrl : null,
  });
});

// 11e. Developer Admin: Reset User Password
app.post('/api/admin/user/reset-password', (req: Request, res: Response) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: 'Username and new password are required' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  const data = db.getData();
  if (!data.users) data.users = {};

  const clean = username.trim().toLowerCase();
  const user = Object.values(data.users).find(
    (u) =>
      u.username.toLowerCase() === clean ||
      (u.email && u.email.toLowerCase() === clean) ||
      u.id === username
  );

  if (!user) {
    return res.status(404).json({ error: `User "${username}" not found in database` });
  }

  const pwd = hashPassword(newPassword);
  user.passwordHash = pwd.hash;
  user.salt = pwd.salt;
  user.token = undefined; // Invalidate previous session token to require fresh login
  db.save();

  res.json({
    success: true,
    message: `Password for @${user.username} (${user.managerName}) was reset successfully!`,
    user: {
      id: user.id,
      username: user.username,
      managerName: user.managerName,
      teamName: user.teamName,
    },
  });
});

// 11f. Developer Admin: Add New User Account
app.post('/api/admin/user/create', (req: Request, res: Response) => {
  const { username, password, managerName, teamName, email, isApproved, role } = req.body;
  if (!username || !password || !managerName || !teamName) {
    return res.status(400).json({ error: 'Username, password, manager name and team name are required.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
  }

  const data = db.getData();
  if (!data.users) data.users = {};
  if (!data.managers) data.managers = {};

  const cleanUser = username.trim().toLowerCase();
  const cleanEmail = (email || `${cleanUser}@fantasy.pl`).trim().toLowerCase();

  const existing = Object.values(data.users).find(
    (u) => u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanEmail)
  );
  if (existing) {
    return res.status(400).json({ error: `Username "${cleanUser}" or email is already taken.` });
  }

  const id = 'user_' + Date.now();
  const pwd = hashPassword(password);
  const isAdm = role === 'admin' || isUserAdmin(cleanUser);
  const approved = isAdm || (typeof isApproved === 'boolean' ? isApproved : true);

  const newUser: UserAccount = {
    id,
    username: cleanUser,
    email: cleanEmail,
    passwordHash: pwd.hash,
    salt: pwd.salt,
    managerName: managerName.trim(),
    teamName: teamName.trim(),
    createdAt: new Date().toISOString(),
    role: isAdm ? 'admin' : 'user',
    isAdmin: isAdm,
    isApproved: approved,
  };

  const newManager: ManagerProfile = {
    id,
    managerName: managerName.trim(),
    teamName: teamName.trim(),
    squad: {
      teamName: teamName.trim(),
      managerName: managerName.trim(),
      players: [],
      bank: INITIAL_BUDGET,
      freeTransfers: 1,
      transfersMadeThisGW: 0,
      activeChip: null,
      usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
    },
    joinedAt: new Date().toISOString(),
  };

  data.users[id] = newUser;
  data.managers[id] = newManager;

  if (Array.isArray(data.deletedUserIds)) {
    data.deletedUserIds = data.deletedUserIds.filter((did) => did !== id);
  }

  // Add to Global League
  const globalLeague = data.leagues?.find((l) => l.isGlobal);
  if (globalLeague) {
    globalLeague.members.push({
      id,
      managerName: newManager.managerName,
      teamName: newManager.teamName,
      totalPoints: 0,
      gwPoints: 0,
      rank: globalLeague.members.length + 1,
      previousRank: globalLeague.members.length + 1,
    });
  }

  db.save();
  scheduleAutoSyncToGitHub(`Admin created user @${cleanUser}`);

  res.json({
    success: true,
    message: `Account for @${cleanUser} (${newManager.managerName}) created successfully!`,
    user: {
      id: newUser.id,
      username: newUser.username,
      managerName: newUser.managerName,
      teamName: newUser.teamName,
      email: newUser.email,
      role: newUser.role,
      isAdmin: newUser.isAdmin,
      isApproved: newUser.isApproved,
    },
  });
});

// 11g. Developer Admin: Remove User Account
app.post('/api/admin/user/delete', (req: Request, res: Response) => {
  const { userId, username } = req.body;
  const data = db.getData();
  if (!data.users) data.users = {};

  const clean = (username || '').trim().toLowerCase();
  const user = Object.values(data.users).find(
    (u) => (userId && u.id === userId) || (clean && u.username.toLowerCase() === clean)
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (isUserAdmin(user.username) || user.username === 'theiulius' || user.username === 'chaga') {
    return res.status(403).json({ error: `Cannot delete protected moderator account @${user.username}.` });
  }

  const targetId = user.id;
  const targetUsername = user.username;

  // 1. Delete user
  delete data.users[targetId];

  // 2. Delete manager
  if (data.managers) {
    delete data.managers[targetId];
  }

  // 3. Remove from all leagues
  if (data.leagues) {
    data.leagues.forEach((l) => {
      if (l.members) {
        l.members = l.members.filter((m) => m.id !== targetId);
      }
    });
  }

  // 4. Record tombstone in deletedUserIds so 2-way sync does not revive it
  if (!Array.isArray(data.deletedUserIds)) {
    data.deletedUserIds = [];
  }
  if (!data.deletedUserIds.includes(targetId)) {
    data.deletedUserIds.push(targetId);
  }

  db.save();
  scheduleAutoSyncToGitHub(`Admin deleted user @${targetUsername}`);

  res.json({
    success: true,
    message: `User @${targetUsername} has been permanently deleted.`,
  });
});

// 11h. Developer Admin: Reset User's Everything (Squad, Points, Chips, Transfers)
app.post('/api/admin/user/reset', (req: Request, res: Response) => {
  const { userId, username, newPassword } = req.body;
  const data = db.getData();
  if (!data.users) data.users = {};

  const clean = (username || '').trim().toLowerCase();
  const user = Object.values(data.users).find(
    (u) => (userId && u.id === userId) || (clean && u.username.toLowerCase() === clean)
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const targetId = user.id;

  // 1. Reset Manager profile & squad
  if (data.managers && data.managers[targetId]) {
    const m = data.managers[targetId];
    m.teamName = user.teamName;
    m.managerName = user.managerName;
    m.squad = {
      teamName: user.teamName,
      managerName: user.managerName,
      players: [],
      bank: INITIAL_BUDGET,
      freeTransfers: 1,
      transfersMadeThisGW: 0,
      activeChip: null,
      usedChips: {
        triple_captain: false,
        bench_boost: false,
        wildcard: false,
      },
    };
  }

  // 2. Reset points and lineup in all leagues
  if (data.leagues) {
    data.leagues.forEach((l) => {
      if (l.members) {
        const mem = l.members.find((m) => m.id === targetId);
        if (mem) {
          mem.totalPoints = 0;
          mem.gwPoints = 0;
          mem.activeChip = null;
          mem.lineup = [];
          mem.teamName = user.teamName;
          mem.managerName = user.managerName;
        }
      }
    });
  }

  // 3. Optional password reset
  if (newPassword && newPassword.length >= 4) {
    const pwd = hashPassword(newPassword);
    user.passwordHash = pwd.hash;
    user.salt = pwd.salt;
  }

  // Invalidate current session
  user.token = undefined;

  db.save();
  scheduleAutoSyncToGitHub(`Admin reset everything for user @${user.username}`);

  res.json({
    success: true,
    message: `Everything for @${user.username} (${user.managerName}) has been reset: squad emptied, bank £${INITIAL_BUDGET.toFixed(1)}m, chips and points reset to 0.`,
  });
});

/**
 * Helper to compute the live breakdown of all managers who made GW2 transfers
 */
export function getLiveTransfersBreakdown(data: any) {
  const managers = Object.values(data.managers || {}) as any[];
  const list: any[] = [];
  const allEligible: any[] = [];

  for (const m of managers) {
    const squad = m.squad;
    if (!squad) continue;

    const gw1Squad = squad.gameweekSquads?.['1'] || [];
    const hadGW1 = Array.isArray(gw1Squad) && gw1Squad.length === 9;
    const currentPlayers = squad.players || [];

    let netTransfers = 0;
    if (hadGW1 && currentPlayers.length === 9) {
      const gw1Ids = new Set(gw1Squad.map((p: any) => p.playerId));
      netTransfers = currentPlayers.filter((p: any) => !gw1Ids.has(p.playerId)).length;
    }
    const recorded = Number(squad.transfersMadeThisGW || 0);

    const gw1Calc = hadGW1
      ? calculateGameweekSquadPoints(
          gw1Squad,
          data.players,
          1,
          squad.gameweekChips?.['1'] || null,
          0,
          1,
          data.fixtures,
          true
        )
      : { grossPoints: 0 };

    const summary = {
      id: m.id,
      managerName: m.managerName,
      teamName: m.teamName,
      grade: m.grade || data.users?.[m.id]?.grade,
      parallel: m.parallel || data.users?.[m.id]?.parallel,
      realName: m.realName || data.users?.[m.id]?.realName,
      chip: squad.activeChip || 'none',
      gw1Gross: gw1Calc.grossPoints,
      netDiff: netTransfers,
      recordedTransfers: recorded,
      startFT: squad.startFreeTransfers ?? (hadGW1 ? 2 : 1),
      remainingFT: squad.freeTransfers ?? (hadGW1 ? 2 : 1),
      penalty: squad.accumulatedTransferPenalties || 0,
      totalPoints: m.totalPoints ?? gw1Calc.grossPoints,
      gwPoints: m.gwPoints ?? 0,
      hadGW1,
      canReset: hadGW1 && (netTransfers > 0 || recorded > 0 || (squad.accumulatedTransferPenalties || 0) > 0 || Boolean(squad.activeChip)),
      isAtGW1Baseline: hadGW1 && netTransfers === 0 && recorded === 0 && (squad.accumulatedTransferPenalties || 0) === 0 && !squad.activeChip,
    };

    if (hadGW1) {
      allEligible.push(summary);
    }

    if (netTransfers > 0 || recorded > 0 || (squad.accumulatedTransferPenalties || 0) > 0 || squad.activeChip) {
      list.push(summary);
    }
  }

  list.sort((a, b) => b.penalty - a.penalty || b.recordedTransfers - a.recordedTransfers || b.totalPoints - a.totalPoints);
  allEligible.sort((a, b) => a.managerName.localeCompare(b.managerName));

  return { list, allEligible };
}

// 11i. Developer Admin: Live Breakdown of Managers who made GW2 Transfers
app.get('/api/admin/transfers-breakdown', (req: Request, res: Response) => {
  const data = db.getData();
  const breakdown = getLiveTransfersBreakdown(data);
  res.json({ success: true, ...breakdown });
});

// 11j. Developer Admin: Reset Individual Manager's Transfers Back to GW1 Locked State
app.post('/api/admin/manager/reset-to-gw1', (req: Request, res: Response) => {
  const { managerId } = req.body;
  if (!managerId) {
    return res.status(400).json({ error: 'managerId is required' });
  }

  const data = db.getData();
  const manager = data.managers?.[managerId];
  if (!manager || !manager.squad) {
    return res.status(404).json({ error: 'Manager not found' });
  }

  const gw1Squad = manager.squad.gameweekSquads?.['1'];
  if (!gw1Squad || !Array.isArray(gw1Squad) || gw1Squad.length !== 9) {
    return res.status(400).json({
      error: `Manager ${manager.managerName} (${manager.teamName}) has no valid GW1 locked lineup snapshot.`,
    });
  }

  // 1. Restore exact locked GW1 players (starters, benchOrder, captain, vice-captain)
  manager.squad.players = JSON.parse(JSON.stringify(gw1Squad));

  // 2. Recalculate bank based on restored squad
  const totalCost = manager.squad.players.reduce(
    (sum: number, sp: any) => sum + (data.players?.[sp.playerId]?.cost || 0),
    0
  );
  manager.squad.bank = Math.max(0, Math.round((INITIAL_BUDGET - totalCost) * 10) / 10);

  // 3. Reset transfer counts and restore 2 Free Transfers for GW2 (Rule 5A & Rule 6)
  manager.squad.transfersMadeThisGW = 0;
  manager.squad.startFreeTransfers = 2;
  manager.squad.freeTransfers = 2;

  // 4. Reset GW2 transfer penalties to 0
  if (!manager.squad.gwTransferPenalties) manager.squad.gwTransferPenalties = {};
  manager.squad.gwTransferPenalties[2] = 0;
  manager.squad.gwTransferPenalties[1] = 0;
  manager.squad.accumulatedTransferPenalties = 0;

  // 5. Revert any chips activated in GW2
  if (manager.squad.activeChip) {
    const chip = manager.squad.activeChip;
    manager.squad.activeChip = null;
    if (manager.squad.usedChips && manager.squad.gameweekChips?.['1'] !== chip) {
      manager.squad.usedChips[chip] = false;
    }
  }
  if (manager.squad.gameweekChips) {
    delete manager.squad.gameweekChips[2];
  }

  // 6. Recalculate league points, ranks, and totalPoints
  recalculateAllManagersLeaguePoints(data);

  db.save(`Reset manager ${manager.managerName} (${manager.teamName}) transfers back to GW1 locked state`);
  scheduleAutoSyncToGitHub(`Admin reset ${manager.managerName} transfers to GW1 state`, true);

  const breakdown = getLiveTransfersBreakdown(data);
  res.json({
    success: true,
    message: `${manager.managerName} (${manager.teamName}) წარმატებით დაბრუნდა GW1-ის შემადგენლობაზე, ქულებსა (სრული ${manager.totalPoints} ქულა) და 2 უფასო ტრანსფერზე!`,
    manager,
    ...breakdown,
  });
});

// 11k. Developer Admin: Remediate Illegal Players (Refund and remove from all managers)
app.post('/api/admin/remediate-illegal-players', (req: Request, res: Response) => {
  const data = db.getData();
  const modified = applyPositionChangesAndRemediation(data);
  if (modified) {
    recalculateAllManagersLeaguePoints(data);
    db.save('Remediate illegal players: removed position-changed players and refunded bank');
    scheduleAutoSyncToGitHub('Remediated illegal players and refunded bank to all managers', true);
  }
  res.json({ success: true, modified, message: 'Illegal players remediated and bank refunded successfully.' });
});

// 11l. Developer Admin: Adjust Manager Bank, Free Transfers, Points, Chips
app.post('/api/admin/manager/adjust', (req: Request, res: Response) => {
  const {
    managerId,
    bank,
    bankDelta,
    freeTransfers,
    freeTransfersDelta,
    pointsDelta,
    activeChip,
    usedChips,
  } = req.body;

  if (!managerId) return res.status(400).json({ error: 'managerId is required' });

  const data = db.getData();
  const manager = data.managers?.[managerId];
  if (!manager || !manager.squad) return res.status(404).json({ error: 'Manager not found' });

  // 1. Bank adjustments
  if (typeof bank === 'number') {
    manager.squad.bank = Math.round(bank * 10) / 10;
  } else if (typeof bankDelta === 'number') {
    manager.squad.bank = Math.round(((manager.squad.bank || 0) + bankDelta) * 10) / 10;
  }

  // 2. Free Transfers adjustments
  if (typeof freeTransfers === 'number') {
    manager.squad.freeTransfers = Math.max(0, freeTransfers);
    manager.squad.startFreeTransfers = Math.max(0, freeTransfers);
  } else if (typeof freeTransfersDelta === 'number') {
    manager.squad.freeTransfers = Math.max(0, (manager.squad.freeTransfers || 0) + freeTransfersDelta);
    manager.squad.startFreeTransfers = Math.max(0, (manager.squad.startFreeTransfers || 0) + freeTransfersDelta);
  }

  // 3. Points adjustment
  if (typeof pointsDelta === 'number') {
    manager.bonusPointsAdjustment = (manager.bonusPointsAdjustment || 0) + pointsDelta;
  }

  // 4. Active Chip
  if (activeChip !== undefined) {
    const currentGWKey = data.currentGW || 1;
    manager.squad.activeChip = activeChip;
    if (activeChip) {
      if (!manager.squad.gameweekChips) manager.squad.gameweekChips = {};
      manager.squad.gameweekChips[currentGWKey] = activeChip;
    } else {
      if (manager.squad.gameweekChips) {
        delete manager.squad.gameweekChips[currentGWKey];
      }
    }
  }

  // 5. Used Chips
  if (usedChips && typeof usedChips === 'object') {
    manager.squad.usedChips = {
      ...(manager.squad.usedChips || { triple_captain: false, bench_boost: false, wildcard: false }),
      ...usedChips,
    };
  }

  updateManagerTransferAccounting(manager, data);
  recalculateAllManagersLeaguePoints(data);
  db.save(`Admin adjusted manager ${manager.managerName} (${manager.teamName})`);
  scheduleAutoSyncToGitHub(`Admin adjusted manager ${manager.managerName}`, true);

  res.json({ success: true, manager });
});

// 11m. Developer Admin: Remove & Refund Player from Manager Squad
app.post('/api/admin/manager/remove-player', (req: Request, res: Response) => {
  const { managerId, playerId, refund = true } = req.body;
  if (!managerId || !playerId) return res.status(400).json({ error: 'managerId and playerId are required' });

  const data = db.getData();
  const manager = data.managers?.[managerId];
  if (!manager || !manager.squad) return res.status(404).json({ error: 'Manager not found' });

  const p = data.players?.[playerId];
  const existingIndex = (manager.squad.players || []).findIndex((sp: any) => sp.playerId === playerId);
  if (existingIndex === -1) return res.status(404).json({ error: 'Player not in manager squad' });

  if (refund && p) {
    const cost = p.cost || 0;
    manager.squad.bank = Math.round(((manager.squad.bank || 0) + cost) * 10) / 10;
  }

  manager.squad.players.splice(existingIndex, 1);

  // Re-sanitize captaincy
  const starters = manager.squad.players.filter((sp: any) => sp.isStarter);
  let cap = starters.find((sp: any) => sp.isCaptain);
  let vc = starters.find((sp: any) => sp.isViceCaptain && sp !== cap);
  if (!cap && starters.length > 0) {
    starters[0].isCaptain = true;
    starters[0].isViceCaptain = false;
    cap = starters[0];
  }
  if (!vc && starters.length > 1) {
    const next = starters.find((sp: any) => sp !== cap);
    if (next) next.isViceCaptain = true;
  }

  // Re-index bench orders
  let benchIndex = 1;
  manager.squad.players.forEach((sp: any) => {
    if (!sp.isStarter) {
      sp.benchOrder = benchIndex++;
    } else {
      sp.benchOrder = 0;
    }
  });

  updateManagerTransferAccounting(manager, data);
  recalculateAllManagersLeaguePoints(data);
  db.save(`Admin removed player ${p?.webName || playerId} from manager ${manager.managerName}`);
  scheduleAutoSyncToGitHub(`Admin removed player ${p?.webName || playerId} from ${manager.managerName}`, true);

  res.json({ success: true, manager });
});

// 11n. Developer Admin: Add Player to Manager Squad
app.post('/api/admin/manager/add-player', (req: Request, res: Response) => {
  const { managerId, playerId, deductCost = true, isStarter } = req.body;
  if (!managerId || !playerId) return res.status(400).json({ error: 'managerId and playerId are required' });

  const data = db.getData();
  const manager = data.managers?.[managerId];
  if (!manager || !manager.squad) return res.status(404).json({ error: 'Manager not found' });

  const p = data.players?.[playerId];
  if (!p) return res.status(404).json({ error: 'Player not found in database' });

  if ((manager.squad.players || []).some((sp: any) => sp.playerId === playerId)) {
    return res.status(400).json({ error: 'Player is already in this manager squad' });
  }

  if (deductCost) {
    const cost = p.cost || 0;
    manager.squad.bank = Math.round(((manager.squad.bank || 0) - cost) * 10) / 10;
  }

  const startersCount = (manager.squad.players || []).filter((sp: any) => sp.isStarter).length;
  const starterFlag = typeof isStarter === 'boolean' ? isStarter : startersCount < 6;

  const benchOrders = (manager.squad.players || []).filter((sp: any) => !sp.isStarter).map((sp: any) => sp.benchOrder || 0);
  const nextBenchOrder = starterFlag ? 0 : (benchOrders.length > 0 ? Math.max(...benchOrders) + 1 : 1);

  manager.squad.players.push({
    playerId,
    isStarter: starterFlag,
    isCaptain: false,
    isViceCaptain: false,
    benchOrder: nextBenchOrder,
  });

  updateManagerTransferAccounting(manager, data);
  recalculateAllManagersLeaguePoints(data);
  db.save(`Admin added player ${p.webName} to manager ${manager.managerName}`);
  scheduleAutoSyncToGitHub(`Admin added player ${p.webName} to ${manager.managerName}`, true);

  res.json({ success: true, manager });
});

// 11o. Developer Admin: Swap / Transfer Player in Manager Squad
app.post('/api/admin/manager/swap-player', (req: Request, res: Response) => {
  const { managerId, outPlayerId, inPlayerId, adjustBank = true } = req.body;
  if (!managerId || !outPlayerId || !inPlayerId) {
    return res.status(400).json({ error: 'managerId, outPlayerId, and inPlayerId are required' });
  }

  const data = db.getData();
  const manager = data.managers?.[managerId];
  if (!manager || !manager.squad) return res.status(404).json({ error: 'Manager not found' });

  const outP = data.players?.[outPlayerId];
  const inP = data.players?.[inPlayerId];
  if (!inP) return res.status(404).json({ error: 'Replacement player not found' });

  const existingIdx = (manager.squad.players || []).findIndex((sp: any) => sp.playerId === outPlayerId);
  if (existingIdx === -1) return res.status(404).json({ error: 'Out player not found in squad' });

  if (adjustBank) {
    const outCost = outP?.cost || 0;
    const inCost = inP.cost || 0;
    const diff = outCost - inCost;
    manager.squad.bank = Math.round(((manager.squad.bank || 0) + diff) * 10) / 10;
  }

  manager.squad.players[existingIdx].playerId = inPlayerId;

  updateManagerTransferAccounting(manager, data);
  recalculateAllManagersLeaguePoints(data);
  db.save(`Admin swapped player ${outP?.webName || outPlayerId} for ${inP.webName} in manager ${manager.managerName}`);
  scheduleAutoSyncToGitHub(`Admin swapped player for ${manager.managerName}`, true);

  res.json({ success: true, manager });
});

// 11p. Developer Admin: Toggle Player Role (Starter/Bench, Captain, Vice-Captain)
app.post('/api/admin/manager/toggle-role', (req: Request, res: Response) => {
  const { managerId, playerId, role } = req.body;
  if (!managerId || !playerId || !role) {
    return res.status(400).json({ error: 'managerId, playerId, and role are required' });
  }

  const data = db.getData();
  const manager = data.managers?.[managerId];
  if (!manager || !manager.squad) return res.status(404).json({ error: 'Manager not found' });

  const target = (manager.squad.players || []).find((sp: any) => sp.playerId === playerId);
  if (!target) return res.status(404).json({ error: 'Player not found in squad' });

  if (role === 'captain') {
    manager.squad.players.forEach((sp: any) => { sp.isCaptain = false; });
    target.isCaptain = true;
    target.isViceCaptain = false;
    target.isStarter = true;
    target.benchOrder = 0;
  } else if (role === 'viceCaptain') {
    manager.squad.players.forEach((sp: any) => { sp.isViceCaptain = false; });
    target.isViceCaptain = true;
    target.isCaptain = false;
    target.isStarter = true;
    target.benchOrder = 0;
  } else if (role === 'starter') {
    target.isStarter = true;
    target.benchOrder = 0;
  } else if (role === 'bench') {
    target.isStarter = false;
    target.isCaptain = false;
    target.isViceCaptain = false;
    const benchOrders = manager.squad.players.filter((sp: any) => !sp.isStarter && sp !== target).map((sp: any) => sp.benchOrder || 0);
    target.benchOrder = benchOrders.length > 0 ? Math.max(...benchOrders) + 1 : 1;
  }

  recalculateAllManagersLeaguePoints(data);
  db.save(`Admin toggled role ${role} for player ${playerId} in manager ${manager.managerName}`);

  res.json({ success: true, manager });
});

// 12. Create / Join / Delete Mini-League
app.post('/api/league/create', (req: Request, res: Response) => {
  const { name, managerId } = req.body;
  const data = db.getData();

  const user = data.users?.[managerId];
  if (user && !isUserAdmin(user.username) && !user.isApproved) {
    return res.status(403).json({ error: 'Your account is pending approval by administrators.' });
  }

  const manager = data.managers[managerId];

  if (!manager) return res.status(404).json({ error: 'Manager not found' });

  const code = 'KCL-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  const currentPts = typeof manager.totalPoints === 'number' ? manager.totalPoints : 0;
  const currentGwPts = typeof manager.gwPoints === 'number' ? manager.gwPoints : 0;

  const newLeague = {
    id: 'league_' + Date.now(),
    name,
    code,
    isGlobal: false,
    members: [
      {
        id: manager.id,
        managerName: manager.managerName,
        teamName: manager.teamName,
        totalPoints: currentPts,
        gwPoints: currentGwPts,
        rank: 1,
        previousRank: 1,
      },
    ],
  };

  data.leagues.push(newLeague);
  db.save();

  res.json({ success: true, league: newLeague });
});

app.post('/api/league/join', (req: Request, res: Response) => {
  const { code, managerId } = req.body;
  const data = db.getData();

  const user = data.users?.[managerId];
  if (user && !isUserAdmin(user.username) && !user.isApproved) {
    return res.status(403).json({ error: 'Your account is pending approval by administrators.' });
  }

  const manager = data.managers[managerId];

  if (!manager) return res.status(404).json({ error: 'Manager not found' });

  const league = data.leagues.find((l) => l.code.toUpperCase() === code.trim().toUpperCase());
  if (!league) return res.status(404).json({ error: 'League code not found' });

  if (!league.members.some((m) => m.id === manager.id)) {
    const currentPts = typeof manager.totalPoints === 'number' ? manager.totalPoints : 0;
    const currentGwPts = typeof manager.gwPoints === 'number' ? manager.gwPoints : 0;

    league.members.push({
      id: manager.id,
      managerName: manager.managerName,
      teamName: manager.teamName,
      totalPoints: currentPts,
      gwPoints: currentGwPts,
      rank: league.members.length + 1,
      previousRank: league.members.length + 1,
    });

    // Re-rank members by score
    league.members.sort((a, b) => b.totalPoints - a.totalPoints);
    league.members.forEach((m, idx) => {
      m.previousRank = m.rank;
      m.rank = idx + 1;
    });

    db.save();
  }

  res.json({ success: true, league });
});

app.post('/api/league/delete', (req: Request, res: Response) => {
  const { leagueId } = req.body;
  const data = db.getData();
  const idx = data.leagues.findIndex((l) => l.id === leagueId);
  if (idx === -1) return res.status(404).json({ error: 'League not found' });

  data.leagues.splice(idx, 1);
  db.save();
  res.json({ success: true, leagues: data.leagues });
});

// --- Deadline Management ---

// Get current deadline
app.get('/api/deadline', (req: Request, res: Response) => {
  const data = db.getData();
  res.json({ deadline: data.deadline || null });
});

// Set deadline
app.post('/api/admin/deadline', (req: Request, res: Response) => {
  const { gameweek, deadlineTime } = req.body;
  if (!gameweek || !deadlineTime) {
    return res.status(400).json({ error: 'gameweek and deadlineTime are required' });
  }
  const data = db.getData();
  data.deadline = { gameweek, deadlineTime };
  db.save();
  res.json({ success: true, deadline: data.deadline });
});

// Clear deadline
app.post('/api/admin/deadline/clear', (req: Request, res: Response) => {
  const data = db.getData();
  data.deadline = null;
  db.save();
  res.json({ success: true, deadline: null });
});

// Update lineup visibility mode (Task 3)
app.post('/api/admin/lineup-visibility', (req: Request, res: Response) => {
  const { mode } = req.body;
  if (!['auto', 'always_show', 'always_hide'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Must be auto, always_show, or always_hide.' });
  }

  const data = db.getData();
  data.lineupVisibility = mode;
  db.save();

  res.json({
    success: true,
    lineupVisibility: mode,
    isLineupsVisible: isLineupsVisibleForPublic(data),
  });
});

// --- Batch Match Events (for Match-Day Admin module) ---

app.post('/api/admin/match-events', (req: Request, res: Response) => {
  const {
    fixtureId,
    homeScore,
    awayScore,
    goalScorers,
    mvpPlayerIds,
    playerMinutes,
    yellowCards,
    redCards,
    penaltiesSaved,
    penaltiesMissed,
    playerAssists,
    playerSaves,
    venue,
  } = req.body;

  const data = db.getData();
  const fixture = data.fixtures.find((f: Fixture) => f.id === fixtureId);
  if (!fixture) return res.status(404).json({ error: 'Fixture not found' });

  // Update fixture
  fixture.homeScore = homeScore;
  fixture.awayScore = awayScore;
  fixture.isFinished = true;
  fixture.isLive = false;
  fixture.venue = venue || 'parki';
  fixture.goalScorers = goalScorers || [];
  fixture.mvpPlayerIds = mvpPlayerIds || [];
  fixture.mvpBonus = req.body.mvpBonus || {};
  fixture.playerMinutes = playerMinutes || {};
  fixture.yellowCards = yellowCards || [];
  fixture.redCards = redCards || [];
  fixture.penaltiesSaved = penaltiesSaved || {};
  fixture.penaltiesMissed = penaltiesMissed || {};
  fixture.playerAssists = playerAssists || {};
  fixture.playerSaves = playerSaves || {};
  fixture.completedAt = new Date().toISOString();

  applyFixtureEventsToPlayers(fixture, data, req.body);
  recalculateAllManagersLeaguePoints(data);
  db.save(`Match stats saved for ${fixture.homeClubId} vs ${fixture.awayClubId}`);
  res.json({ success: true, fixture, players: data.players });
});

// Global JSON error handler (prevents default Express HTML error pages for payload too large, bad JSON, etc.)
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[API Error]', err?.message || err);
  if (err?.status === 413 || err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'ფოტოს ზომა ძალიან დიდია (Photo size exceeds maximum allowed limit).' });
  }
  return res.status(err?.status || 500).json({ error: err?.message || 'Server error' });
});

// Static assets in production
const clientDist = path.join(__dirname, '../dist');
app.use(express.static(clientDist));

app.use((req: Request, res: Response) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

export function applyPositionChangesAndRemediation(data: any): boolean {
  let modified = false;

  // 1. Ensure player positions match new official roles
  if (data.players) {
    if (data.players['p_10_5_shakarishvili'] && data.players['p_10_5_shakarishvili'].position !== 'DEF') {
      data.players['p_10_5_shakarishvili'].position = 'DEF';
      modified = true;
    }
    if (data.players['p_12_3_vashakmadze'] && data.players['p_12_3_vashakmadze'].position !== 'FWD') {
      data.players['p_12_3_vashakmadze'].position = 'FWD';
      modified = true;
    }
    if (data.players['p_12_3_palelashvili'] && data.players['p_12_3_palelashvili'].position !== 'FWD') {
      data.players['p_12_3_palelashvili'].position = 'FWD';
      modified = true;
    }
  }

  // 2. (Completed) Remediation free transfers for GW1 holders have already been granted.

  // 3. (Completed) Position-changed players have been refunded and may now be purchased legally as DEF/FWD.

  // 4. Ensure Nikoloz Kirtadze (user_1790456870935) has TC active for GW2 and not locked in GW1
  const kirtadze = data.managers?.['user_1790456870935'];
  if (kirtadze?.squad) {
    if (kirtadze.squad.gameweekChips?.[1] === 'triple_captain' || kirtadze.squad.gameweekChips?.['1'] === 'triple_captain') {
      delete kirtadze.squad.gameweekChips[1];
      delete kirtadze.squad.gameweekChips['1'];
      kirtadze.squad.activeChip = 'triple_captain';
      kirtadze.squad.gameweekChips = kirtadze.squad.gameweekChips || {};
      kirtadze.squad.gameweekChips[2] = 'triple_captain';
      kirtadze.squad.usedChips = kirtadze.squad.usedChips || { triple_captain: false, bench_boost: false, wildcard: false };
      kirtadze.squad.usedChips.triple_captain = false;
      modified = true;
      console.log('[Remediation] Corrected Nikoloz Kirtadze TC: disabled in GW1 and activated for GW2.');
    }
  }

  // 5. Ensure Gega Vashakmadze (user_1790456463804) has Wildcard active for GW2 and not locked in GW1, and FT reduced by 1
  const gega = data.managers?.['user_1790456463804'];
  if (gega?.squad) {
    if (gega.squad.gameweekChips?.[1] === 'wildcard' || gega.squad.gameweekChips?.['1'] === 'wildcard') {
      delete gega.squad.gameweekChips[1];
      delete gega.squad.gameweekChips['1'];
      gega.squad.activeChip = 'wildcard';
      gega.squad.gameweekChips = gega.squad.gameweekChips || {};
      gega.squad.gameweekChips[2] = 'wildcard';
      gega.squad.usedChips = gega.squad.usedChips || { triple_captain: false, bench_boost: false, wildcard: false };
      gega.squad.usedChips.wildcard = false;
      gega.squad.freeTransfers = 2;
      gega.squad.startFreeTransfers = 2;
      modified = true;
      console.log('[Remediation] Corrected Gega Vashakmadze Wildcard: disabled in GW1 and activated for GW2, FT set to 2.');
    }
  }

  return modified;
}

// Startup initialization: load latest database from GitHub data branch
async function startServer() {
  console.log('[Startup] Syncing latest database from data branch before accepting traffic...');
  try {
    const syncRes = await syncDatabaseFromGitHub(undefined, true);
    if (syncRes.success) {
      console.log(`[Startup] GitHub database sync successful (changed: ${syncRes.changed})`);
    } else {
      console.warn(`[Startup] GitHub database sync skipped/failed: ${syncRes.error}`);
    }
  } catch (e) {
    console.warn('[Startup] Initial GitHub database sync exception:', e);
  }

  // Ensure all finished fixtures have their player stats and manager points fully calculated
  try {
    const data = db.getData();
    applyPositionChangesAndRemediation(data);
    const statsSynced = syncAllFinishedFixturesStats(data);
    recalculateAllManagersLeaguePoints(data);
    db.saveSilent();
    console.log('[Startup] Verified and synced player stats, positions, and manager points.');
  } catch (e) {
    console.warn('[Startup] Error auto-syncing finished fixtures stats:', e);
  }

  app.listen(PORT, () => {
    console.log(`Premier League Fantasy server running on port ${PORT}`);
  });
}

startServer();

// Periodic background sync from GitHub every 5 minutes only if server is completely idle (no pending local writes)
setInterval(() => {
  if (!hasPendingLocalChanges && !isCommittingToGitHub && Date.now() - lastLocalWriteTime > 60000) {
    syncDatabaseFromGitHub(undefined, false).catch(() => {});
  }
}, 300000);
