import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  INITIAL_CALENDAR_EVENTS,
  INITIAL_HOMEWORKS,
  CLASS_TIMETABLE,
  INITIAL_OPPORTUNITIES,
  INITIAL_IDEAS,
  INITIAL_GREEN_LIGHT_CLUBS,
  INITIAL_STUDY_PODS,
  CalendarEvent,
  HomeworkAssignment,
  DaySchedule,
  OpportunityItem,
  IdeaItem,
  GreenLightClub,
  StudyPod,
} from '../data/campaignData';

export interface PlatformUser {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'moderator' | 'user';
  isAdmin: boolean;
  isModerator?: boolean;
  canModerate?: boolean;
}

export interface PlatformComment {
  id: string;
  targetType: 'event' | 'homework' | 'resource' | 'idea' | 'opportunity' | 'club' | 'general' | 'archive';
  targetId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  isAdmin?: boolean;
  isModerator?: boolean;
  content: string;
  createdAt: string;
  isPinned?: boolean;
}

export interface ResourceAttachment {
  name: string;
  dataUrl: string;
  size?: number;
  mimeType?: string;
}

export interface PlatformResource {
  id: string;
  title: string;
  description: string;
  content?: string;
  linkUrl?: string;
  attachmentName?: string;
  attachmentDataUrl?: string;
  attachments?: ResourceAttachment[];
  resourceType: 'კონსპექტი' | 'დავალების ამოხსნა' | 'პრეზენტაცია' | 'ტესტი/მასალა' | 'ბმული';
  subject?: string;
  targetType: 'event' | 'homework' | 'archive' | 'general';
  targetId?: string;
  targetTitle?: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  approvedBy?: string;
  upvotes?: number;
  upvotedBy?: string[];
}

export interface ArchiveStudyPack {
  id: string;
  title: string;
  subject: string;
  teacher?: string;
  date: string;
  description: string;
  badge?: string;
  isBuiltInGeorgianQuiz?: boolean;
  content?: string;
  linkUrl?: string;
  keyTopics?: string[];
  createdBy: string;
  createdAt: string;
}

export interface PlatformAnnouncement {
  text: string;
  active: boolean;
  type: 'info' | 'urgent' | 'success';
  linkTab?: string;
  updatedAt: string;
}

export interface OpportunityQuestion {
  id: string;
  opportunityId: string;
  speaker: string;
  authorName: string;
  authorUsername: string;
  question: string;
  createdAt: string;
  answer?: string;
}

export interface BackgroundPhysicsSettings {
  stiffness: number;
  damping: number;
  mass: number;
  adaptiveFastScroll: boolean;
  parallaxDeep: number;
  parallaxMid: number;
  parallaxNear: number;
}

export const DEFAULT_BACKGROUND_PHYSICS: BackgroundPhysicsSettings = {
  stiffness: 520,
  damping: 15,
  mass: 0.08,
  adaptiveFastScroll: true,
  parallaxDeep: 0.20,
  parallaxMid: 0.32,
  parallaxNear: 0.45,
};

export interface PlatformDataState {
  announcement?: PlatformAnnouncement;
  backgroundPhysics?: BackgroundPhysicsSettings;
  calendarEvents: CalendarEvent[];
  homeworks: (HomeworkAssignment & { status?: 'approved' | 'pending' | 'rejected'; authorName?: string; authorUsername?: string })[];
  timetable: DaySchedule[];
  opportunities: (OpportunityItem & { rsvpUsers?: string[] })[];
  opportunityQuestions: OpportunityQuestion[];
  ideas: (IdeaItem & { upvotedBy?: string[] })[];
  clubs: (GreenLightClub & { status?: string })[];
  studyPods: (StudyPod & { participants?: string[] })[];
  resources: PlatformResource[];
  comments: PlatformComment[];
  archivePacks: ArchiveStudyPack[];
}

interface PendingCounts {
  resources: number;
  homeworks: number;
  clubs: number;
  total: number;
}

interface PlatformContextValue {
  user: PlatformUser | null;
  isAdmin: boolean;
  isModerator: boolean;
  canModerate: boolean;
  token: string | null;
  platform: PlatformDataState;
  pendingCounts: PendingCounts;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalInitialMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isAdminModalOpen: boolean;
  adminModalTab: 'approvals' | 'users' | 'announcement' | 'analytics' | 'physics';
  openAdminModal: (tab?: 'approvals' | 'users' | 'announcement' | 'analytics' | 'physics') => void;
  closeAdminModal: () => void;
  refreshPlatform: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, fullName: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateBackgroundPhysics: (settings: BackgroundPhysicsSettings) => Promise<boolean>;
  // Calendar
  addCalendarEvent: (ev: Partial<CalendarEvent>) => Promise<boolean>;
  updateCalendarEvent: (id: string, ev: Partial<CalendarEvent>) => Promise<boolean>;
  deleteCalendarEvent: (id: string) => Promise<boolean>;
  // Homework & Timetable
  addHomework: (hw: any) => Promise<{ success: boolean; isPending?: boolean; error?: string }>;
  updateHomework: (id: string, hw: any) => Promise<boolean>;
  moderateHomework: (id: string, status: 'approved' | 'rejected') => Promise<boolean>;
  deleteHomework: (id: string) => Promise<boolean>;
  updateTimetable: (timetable: DaySchedule[]) => Promise<boolean>;
  // Resources / Study Notes
  submitResource: (res: Partial<PlatformResource>) => Promise<{ success: boolean; isPending?: boolean; error?: string }>;
  updateResource: (id: string, res: Partial<PlatformResource>) => Promise<boolean>;
  moderateResource: (id: string, status: 'approved' | 'rejected') => Promise<boolean>;
  deleteResource: (id: string) => Promise<boolean>;
  upvoteResource: (id: string) => Promise<boolean>;
  // Comments
  addComment: (targetType: PlatformComment['targetType'], targetId: string, content: string) => Promise<{ success: boolean; error?: string }>;
  deleteComment: (id: string) => Promise<boolean>;
  pinComment: (id: string) => Promise<boolean>;
  // Opportunities
  addOpportunity: (opp: any) => Promise<boolean>;
  updateOpportunity: (id: string, opp: any) => Promise<boolean>;
  deleteOpportunity: (id: string) => Promise<boolean>;
  rsvpOpportunity: (id: string) => Promise<boolean>;
  askOpportunityQuestion: (id: string, question: string) => Promise<boolean>;
  // Ideas
  addIdea: (idea: any) => Promise<boolean>;
  updateIdea: (id: string, idea: any) => Promise<boolean>;
  deleteIdea: (id: string) => Promise<boolean>;
  upvoteIdea: (id: string) => Promise<boolean>;
  // Clubs
  addClub: (club: any) => Promise<boolean>;
  updateClub: (id: string, club: any) => Promise<boolean>;
  deleteClub: (id: string) => Promise<boolean>;
  // Study Pods
  addStudyPod: (pod: any) => Promise<boolean>;
  joinStudyPod: (id: string, guestName?: string) => Promise<boolean>;
  deleteStudyPod: (id: string) => Promise<boolean>;
  // Archive
  addArchivePack: (pack: Partial<ArchiveStudyPack>) => Promise<boolean>;
  deleteArchivePack: (id: string) => Promise<boolean>;
  // Announcement
  updateAnnouncement: (ann: Partial<PlatformAnnouncement>) => Promise<boolean>;
}

const TOKEN_STORAGE_KEY = 'class11_5_auth_token_v1';
const USER_STORAGE_KEY = 'class11_5_auth_user_v1';
const PHYSICS_STORAGE_KEY = 'class11_5_bg_physics_v1';
const PLATFORM_CACHE_KEY = 'class11_5_platform_cache_v1';

const getInitialBackgroundPhysics = (): BackgroundPhysicsSettings => {
  try {
    const stored = localStorage.getItem(PHYSICS_STORAGE_KEY);
    if (stored) return { ...DEFAULT_BACKGROUND_PHYSICS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_BACKGROUND_PHYSICS;
};

const readCachedPlatformState = (): PlatformDataState | null => {
  try {
    const raw = localStorage.getItem(PLATFORM_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      announcement: parsed.announcement,
      backgroundPhysics: parsed.backgroundPhysics || getInitialBackgroundPhysics(),
      calendarEvents: Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : INITIAL_CALENDAR_EVENTS,
      homeworks: Array.isArray(parsed.homeworks) ? parsed.homeworks : INITIAL_HOMEWORKS,
      timetable: Array.isArray(parsed.timetable) ? parsed.timetable : CLASS_TIMETABLE,
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : INITIAL_OPPORTUNITIES,
      opportunityQuestions: Array.isArray(parsed.opportunityQuestions) ? parsed.opportunityQuestions : [],
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas : INITIAL_IDEAS,
      clubs: Array.isArray(parsed.clubs) ? parsed.clubs : INITIAL_GREEN_LIGHT_CLUBS,
      studyPods: Array.isArray(parsed.studyPods) ? parsed.studyPods : INITIAL_STUDY_PODS,
      resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
      archivePacks:
        Array.isArray(parsed.archivePacks) && parsed.archivePacks.length > 0
          ? parsed.archivePacks
          : defaultArchivePacks,
    };
  } catch {
    return null;
  }
};

const writeCachedPlatformState = (state: PlatformDataState): void => {
  try {
    const json = JSON.stringify(state);
    if (json.length < 1_500_000) {
      localStorage.setItem(PLATFORM_CACHE_KEY, json);
    }
  } catch {}
};

const defaultArchivePacks: ArchiveStudyPack[] = [
  {
    id: 'arch_geo_romantizmi_quiz',
    title: 'ქართული რომანტიზმი',
    subject: 'ქართული',
    teacher: 'ნინო ჩხაიძე',
    date: '2026-10-15',
    description:
      'სრული მოსამზადებელი მოდული 7 საკვანძო თემით, 30+ ტესტური და ღია კითხვით, NotebookLM-ის აუდიო პოდკასტებით, ვიდეო მიმოხილვითა და ფლეშ-ბარათებით.',
    badge: 'ინტერაქტიული მოდული',
    isBuiltInGeorgianQuiz: true,
    keyTopics: [
      'ედემი (ხალხური)',
      'ვისაც გსურთ (ალ. ჭავჭავაძე)',
      'ვაჰ, დრონი, დრონი (ალ. ჭავჭავაძე)',
      'გოგჩა (ალ. ჭავჭავაძე)',
      'საღამო გამოსალმებისა (გრ. ორბელიანი)',
      'თამარ მეფის სახე ბეთანიის ეკლესიაში (გრ. ორბელიანი)',
      'იარაღი (გრ. ორბელიანი)',
    ],
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
  },
];

const PlatformContext = createContext<PlatformContextValue | null>(null);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<PlatformUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [platform, setPlatform] = useState<PlatformDataState>(() => {
    const cached = readCachedPlatformState();
    if (cached) return cached;
    return {
      backgroundPhysics: getInitialBackgroundPhysics(),
      calendarEvents: INITIAL_CALENDAR_EVENTS,
      homeworks: INITIAL_HOMEWORKS,
      timetable: CLASS_TIMETABLE,
      opportunities: INITIAL_OPPORTUNITIES,
      opportunityQuestions: [],
      ideas: INITIAL_IDEAS,
      clubs: INITIAL_GREEN_LIGHT_CLUBS,
      studyPods: INITIAL_STUDY_PODS,
      resources: [],
      comments: [],
      archivePacks: defaultArchivePacks,
    };
  });

  const pendingCounts = useMemo<PendingCounts>(() => {
    const resCount = platform.resources.filter((r) => r.status === 'pending').length;
    const hwCount = platform.homeworks.filter((h: any) => h.status === 'pending').length;
    const clubCount = platform.clubs.filter((c: any) => c.status === 'განხილვაშია').length;
    return {
      resources: resCount,
      homeworks: hwCount,
      clubs: clubCount,
      total: resCount + hwCount + clubCount,
    };
  }, [platform.resources, platform.homeworks, platform.clubs]);

  const [isLoading, setIsLoading] = useState<boolean>(() => !readCachedPlatformState());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>('login');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [adminModalTab, setAdminModalTab] = useState<'approvals' | 'users' | 'announcement' | 'analytics' | 'physics'>('approvals');

  const getHeaders = useCallback(
    (customToken?: string | null) => {
      const activeToken = customToken !== undefined ? customToken : token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }
      return headers;
    },
    [token]
  );

  const applyServerPatch = useCallback((patch: Partial<PlatformDataState>) => {
    setPlatform((prev) => {
      const next: PlatformDataState = {
        ...prev,
        ...(patch.announcement !== undefined ? { announcement: patch.announcement } : {}),
        ...(patch.backgroundPhysics !== undefined ? { backgroundPhysics: patch.backgroundPhysics } : {}),
        ...(patch.calendarEvents !== undefined ? { calendarEvents: patch.calendarEvents } : {}),
        ...(patch.homeworks !== undefined ? { homeworks: patch.homeworks } : {}),
        ...(patch.timetable !== undefined ? { timetable: patch.timetable } : {}),
        ...(patch.opportunities !== undefined ? { opportunities: patch.opportunities } : {}),
        ...(patch.opportunityQuestions !== undefined ? { opportunityQuestions: patch.opportunityQuestions } : {}),
        ...(patch.ideas !== undefined ? { ideas: patch.ideas } : {}),
        ...(patch.clubs !== undefined ? { clubs: patch.clubs } : {}),
        ...(patch.studyPods !== undefined ? { studyPods: patch.studyPods } : {}),
        ...(patch.resources !== undefined ? { resources: patch.resources } : {}),
        ...(patch.comments !== undefined ? { comments: patch.comments } : {}),
        ...(patch.archivePacks !== undefined && patch.archivePacks.length > 0
          ? { archivePacks: patch.archivePacks }
          : {}),
      };
      writeCachedPlatformState(next);
      return next;
    });
  }, []);

  const refreshPlatform = useCallback(
    async (overrideToken?: string | null) => {
      try {
        const res = await fetch('/api/platform/state', {
          headers: getHeaders(overrideToken),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.platform) {
          if (data.platform.backgroundPhysics) {
            try {
              localStorage.setItem(PHYSICS_STORAGE_KEY, JSON.stringify(data.platform.backgroundPhysics));
            } catch {}
          }
          const nextState: PlatformDataState = {
            announcement: data.platform.announcement,
            backgroundPhysics: data.platform.backgroundPhysics || getInitialBackgroundPhysics(),
            calendarEvents: data.platform.calendarEvents || INITIAL_CALENDAR_EVENTS,
            homeworks: data.platform.homeworks || INITIAL_HOMEWORKS,
            timetable: data.platform.timetable || CLASS_TIMETABLE,
            opportunities: data.platform.opportunities || INITIAL_OPPORTUNITIES,
            opportunityQuestions: data.platform.opportunityQuestions || [],
            ideas: data.platform.ideas || INITIAL_IDEAS,
            clubs: data.platform.clubs || INITIAL_GREEN_LIGHT_CLUBS,
            studyPods: data.platform.studyPods || INITIAL_STUDY_PODS,
            resources: data.platform.resources || [],
            comments: data.platform.comments || [],
            archivePacks:
              data.platform.archivePacks && data.platform.archivePacks.length > 0
                ? data.platform.archivePacks
                : defaultArchivePacks,
          };
          setPlatform(nextState);
          writeCachedPlatformState(nextState);
        }
        const sentToken = overrideToken !== undefined ? overrideToken : token;
        if (data.currentUser) {
          setUser(data.currentUser);
          try {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.currentUser));
          } catch {}
        } else if (overrideToken === null || (sentToken && data.currentUser === null)) {
          setUser(null);
          if (sentToken) {
            setToken(null);
            try {
              localStorage.removeItem(TOKEN_STORAGE_KEY);
              localStorage.removeItem(USER_STORAGE_KEY);
            } catch {}
          }
        }
      } catch (e) {
        console.warn('[PlatformContext] Failed to fetch state:', e);
      } finally {
        setIsLoading(false);
      }
    },
    [getHeaders, token]
  );

  useEffect(() => {
    refreshPlatform();
  }, [refreshPlatform]);

  const isAdminUser = Boolean(user?.isAdmin || user?.role === 'admin');
  const isModeratorUser = !isAdminUser && Boolean(user?.isModerator || user?.role === 'moderator');
  const canModerateUser = isAdminUser || isModeratorUser;

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalInitialMode(mode);
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openAdminModal = (tab: 'approvals' | 'users' | 'announcement' | 'analytics' | 'physics' = 'approvals') => {
    const safeTab = !isAdminUser && (tab === 'users' || tab === 'physics') ? 'approvals' : tab;
    setAdminModalTab(safeTab);
    setIsAdminModalOpen(true);
  };
  const closeAdminModal = () => setIsAdminModalOpen(false);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/platform/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'შესვლა ვერ მოხერხდა' };
      }
      setToken(data.token);
      setUser(data.user);
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      } catch {}
      await refreshPlatform(data.token);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'ქსელური შეცდომა' };
    }
  };

  const register = async (username: string, fullName: string, password: string) => {
    try {
      const res = await fetch('/api/platform/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, fullName, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'რეგისტრაცია ვერ მოხერხდა' };
      }
      setToken(data.token);
      setUser(data.user);
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      } catch {}
      await refreshPlatform(data.token);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'ქსელური შეცდომა' };
    }
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST', headers: getHeaders() }).catch(() => {});
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  };

  // --- CRUD Mutations (apply returned server patch directly to eliminate blocking /state re-fetches) ---
  const runPlatformMutation = useCallback(
    async (url: string, method: string, body?: unknown): Promise<{ ok: boolean; data: any }> => {
      try {
        const res = await fetch(url, {
          method,
          headers: getHeaders(),
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          applyServerPatch(data);
          return { ok: true, data };
        }
        return { ok: false, data };
      } catch {
        return { ok: false, data: {} };
      }
    },
    [getHeaders, applyServerPatch]
  );

  const addCalendarEvent = async (ev: Partial<CalendarEvent>) =>
    (await runPlatformMutation('/api/platform/calendar', 'POST', ev)).ok;

  const updateCalendarEvent = async (id: string, ev: Partial<CalendarEvent>) =>
    (await runPlatformMutation(`/api/platform/calendar/${id}`, 'PUT', ev)).ok;

  const deleteCalendarEvent = async (id: string) =>
    (await runPlatformMutation(`/api/platform/calendar/${id}`, 'DELETE')).ok;

  const addHomework = async (hw: any) => {
    const { ok, data } = await runPlatformMutation('/api/platform/homework', 'POST', hw);
    if (ok) {
      return { success: true, isPending: data.homework?.status === 'pending' };
    }
    return { success: false, error: data.error || 'დავალების დამატება ვერ მოხერხდა' };
  };

  const updateHomework = async (id: string, hw: any) =>
    (await runPlatformMutation(`/api/platform/homework/${id}`, 'PUT', hw)).ok;

  const moderateHomework = async (id: string, status: 'approved' | 'rejected') =>
    (await runPlatformMutation(`/api/platform/homework/${id}/status`, 'POST', { status })).ok;

  const deleteHomework = async (id: string) =>
    (await runPlatformMutation(`/api/platform/homework/${id}`, 'DELETE')).ok;

  const updateTimetable = async (timetable: DaySchedule[]) =>
    (await runPlatformMutation('/api/platform/timetable', 'PUT', { timetable })).ok;

  const submitResource = async (resource: Partial<PlatformResource>) => {
    const { ok, data } = await runPlatformMutation('/api/platform/resources', 'POST', resource);
    if (ok) {
      return { success: true, isPending: data.resource?.status === 'pending' };
    }
    return { success: false, error: data.error || 'მასალის ატვირთვა ვერ მოხერხდა' };
  };

  const updateResource = async (id: string, resource: Partial<PlatformResource>) =>
    (await runPlatformMutation(`/api/platform/resources/${id}`, 'PUT', resource)).ok;

  const moderateResource = async (id: string, status: 'approved' | 'rejected') =>
    (await runPlatformMutation(`/api/platform/resources/${id}/status`, 'POST', { status })).ok;

  const deleteResource = async (id: string) =>
    (await runPlatformMutation(`/api/platform/resources/${id}`, 'DELETE')).ok;

  const upvoteResource = async (id: string) =>
    (await runPlatformMutation(`/api/platform/resources/${id}/upvote`, 'POST')).ok;

  const addComment = async (
    targetType: PlatformComment['targetType'],
    targetId: string,
    content: string
  ) => {
    const { ok, data } = await runPlatformMutation('/api/platform/comments', 'POST', {
      targetType,
      targetId,
      content,
    });
    if (ok) {
      return { success: true };
    }
    return { success: false, error: data.error || 'კომენტარის დამატება ვერ მოხერხდა' };
  };

  const deleteComment = async (id: string) =>
    (await runPlatformMutation(`/api/platform/comments/${id}`, 'DELETE')).ok;

  const pinComment = async (id: string) =>
    (await runPlatformMutation(`/api/platform/comments/${id}/pin`, 'POST')).ok;

  const addOpportunity = async (opp: any) =>
    (await runPlatformMutation('/api/platform/opportunities', 'POST', opp)).ok;

  const updateOpportunity = async (id: string, opp: any) =>
    (await runPlatformMutation(`/api/platform/opportunities/${id}`, 'PUT', opp)).ok;

  const deleteOpportunity = async (id: string) =>
    (await runPlatformMutation(`/api/platform/opportunities/${id}`, 'DELETE')).ok;

  const rsvpOpportunity = async (id: string) =>
    (await runPlatformMutation(`/api/platform/opportunities/${id}/rsvp`, 'POST')).ok;

  const askOpportunityQuestion = async (id: string, question: string) =>
    (await runPlatformMutation(`/api/platform/opportunities/${id}/question`, 'POST', { question })).ok;

  const addIdea = async (idea: any) =>
    (await runPlatformMutation('/api/platform/ideas', 'POST', idea)).ok;

  const updateIdea = async (id: string, idea: any) =>
    (await runPlatformMutation(`/api/platform/ideas/${id}`, 'PUT', idea)).ok;

  const deleteIdea = async (id: string) =>
    (await runPlatformMutation(`/api/platform/ideas/${id}`, 'DELETE')).ok;

  const upvoteIdea = async (id: string) =>
    (await runPlatformMutation(`/api/platform/ideas/${id}/upvote`, 'POST')).ok;

  const addClub = async (club: any) =>
    (await runPlatformMutation('/api/platform/clubs', 'POST', club)).ok;

  const updateClub = async (id: string, club: any) =>
    (await runPlatformMutation(`/api/platform/clubs/${id}`, 'PUT', club)).ok;

  const deleteClub = async (id: string) =>
    (await runPlatformMutation(`/api/platform/clubs/${id}`, 'DELETE')).ok;

  const addStudyPod = async (pod: any) =>
    (await runPlatformMutation('/api/platform/study-pods', 'POST', pod)).ok;

  const joinStudyPod = async (id: string, guestName?: string) =>
    (await runPlatformMutation(`/api/platform/study-pods/${id}/join`, 'POST', { name: guestName })).ok;

  const deleteStudyPod = async (id: string) =>
    (await runPlatformMutation(`/api/platform/study-pods/${id}`, 'DELETE')).ok;

  const addArchivePack = async (pack: Partial<ArchiveStudyPack>) =>
    (await runPlatformMutation('/api/platform/archive', 'POST', pack)).ok;

  const deleteArchivePack = async (id: string) =>
    (await runPlatformMutation(`/api/platform/archive/${id}`, 'DELETE')).ok;

  const updateAnnouncement = async (ann: Partial<PlatformAnnouncement>) =>
    (await runPlatformMutation('/api/platform/announcement', 'PUT', ann)).ok;

  const updateBackgroundPhysics = async (newSettings: BackgroundPhysicsSettings) => {
    setPlatform((prev) => ({ ...prev, backgroundPhysics: newSettings }));
    try {
      localStorage.setItem(PHYSICS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch {}

    if (token) {
      try {
        const res = await fetch('/api/platform/physics', {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(newSettings),
        });
        return res.ok;
      } catch (err) {
        console.warn('Failed to sync background physics to server:', err);
      }
    }
    return true;
  };

  return (
    <PlatformContext.Provider
      value={{
        user,
        isAdmin: isAdminUser,
        isModerator: isModeratorUser,
        canModerate: canModerateUser,
        token,
        platform,
        pendingCounts,
        isLoading,
        isAuthModalOpen,
        authModalInitialMode,
        openAuthModal,
        closeAuthModal,
        isAdminModalOpen,
        adminModalTab,
        openAdminModal,
        closeAdminModal,
        refreshPlatform: () => refreshPlatform(),
        login,
        register,
        logout,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        addHomework,
        updateHomework,
        moderateHomework,
        deleteHomework,
        updateTimetable,
        submitResource,
        updateResource,
        moderateResource,
        deleteResource,
        upvoteResource,
        addComment,
        deleteComment,
        pinComment,
        addOpportunity,
        updateOpportunity,
        deleteOpportunity,
        rsvpOpportunity,
        askOpportunityQuestion,
        addIdea,
        updateIdea,
        deleteIdea,
        upvoteIdea,
        addClub,
        updateClub,
        deleteClub,
        addStudyPod,
        joinStudyPod,
        deleteStudyPod,
        addArchivePack,
        deleteArchivePack,
        updateAnnouncement,
        updateBackgroundPhysics,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
};
