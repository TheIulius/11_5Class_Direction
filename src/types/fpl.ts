export type Position = 'GKP' | 'DEF' | 'MID' | 'FWD';

export interface Club {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}

export interface PlayerStats {
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  yellowCards: number;
  redCards: number;
  penaltiesSaved: number;
  penaltiesMissed: number;
  ownGoals: number;
  isMVP: boolean;
  // Legacy and extended fields
  goalsConceded?: number;
  saves?: number;
  bonus?: number;
  mvpRank?: 1 | 2 | 3;
}

export interface Player {
  id: string;
  name: string;
  webName: string;
  clubId: string;
  position: Position;
  cost: number; // in millions, e.g. 15.0
  totalPoints: number;
  gwPoints: number;
  form: number;
  selectedByPercent: number;
  isAvailable: boolean;
  gwStats: Record<number, PlayerStats>; // Gameweek -> Stats
  photoUrl?: string; // Approved player profile picture URL
  pendingPhotoUrl?: string; // Pending admin approval picture URL
  previousCost?: number; // Previous price before rise/drop (e.g. 6.0)
  priceChange?: number; // Price difference (e.g. +0.5)
}

export interface PendingPlayerPhoto {
  id: string;
  playerId: string;
  photoUrl: string;
  suggestedBy: string;
  suggestedAt: string;
}

export interface SquadPlayer {
  playerId: string;
  isStarter: boolean;
  benchOrder: number; // 0 for starters, 1 for sub GK, 2 for sub 1, 3 for sub 2, 4 for sub 3
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export type ChipType = 'triple_captain' | 'bench_boost' | 'wildcard';

export interface Squad {
  teamName: string;
  managerName: string;
  players: SquadPlayer[];
  bank: number; // e.g. 1.5 = £1.5m
  freeTransfers: number;
  transfersMadeThisGW: number;
  activeChip: ChipType | null;
  usedChips: Record<ChipType, boolean>;
  accumulatedTransferPenalties?: number;
  gwTransferPenalties?: Record<number, number>;
  gameweekSquads?: Record<number, SquadPlayer[]>;
  gameweekChips?: Record<number, ChipType | null>;
}

export type Venue = 'parki' | 'delisi' | 'one_price';

export interface MatchGoal {
  playerId: string;
  minute?: number;
  isOwnGoal?: boolean;
  assistPlayerId?: string;
}

export interface Fixture {
  id: string;
  gameweek: number;
  homeClubId: string;
  awayClubId: string;
  homeScore: number | null;
  awayScore: number | null;
  isFinished: boolean;
  isLive: boolean;
  kickoffTime: string;
  date?: string;
  completedAt?: string;
  venue?: Venue;
  goalScorers?: MatchGoal[];
  mvpPlayerIds?: string[];
  mvpBonus?: Record<string, number>;
  playerMinutes?: Record<string, number>;
  yellowCards?: string[];
  redCards?: string[];
  penaltiesSaved?: Record<string, number>;
  penaltiesMissed?: Record<string, number>;
  playerAssists?: Record<string, number>;
  playerSaves?: Record<string, number>;
}

export interface LeagueMember {
  id: string;
  managerName: string;
  teamName: string;
  totalPoints: number;
  gwPoints: number;
  rank: number;
  previousRank: number;
  grade?: string;
  parallel?: string;
  realName?: string;
  showRealNamePublicly?: boolean;
}

export interface League {
  id: string;
  name: string;
  code: string;
  isGlobal: boolean;
  members: LeagueMember[];
}

export interface GameweekDeadline {
  gameweek: number;
  deadlineTime: string; // ISO timestamp
}

export interface GameweekInfo {
  currentGW: number;
  deadlineTime: string;
  isLive: boolean;
  isFinished: boolean;
  highestScore: number;
  averageScore: number;
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

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  managerName: string;
  teamName: string;
  role?: 'admin' | 'ref' | 'user';
  isAdmin?: boolean;
  isReferee?: boolean;
  isApproved?: boolean;
  grade?: string;
  parallel?: string;
  realName?: string;
  showRealNamePublicly?: boolean;
}

export type LineupVisibilityMode = 'auto' | 'always_show' | 'always_hide';

export interface PlayerOwnershipManager {
  id: string;
  managerName: string;
  teamName: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

export interface PlayerOwnership {
  percent: number;
  count: number;
  managers: PlayerOwnershipManager[];
}
