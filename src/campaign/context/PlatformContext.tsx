import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  role: 'admin' | 'user';
  isAdmin: boolean;
}

export interface PlatformComment {
  id: string;
  targetType: 'event' | 'homework' | 'resource' | 'idea' | 'opportunity' | 'club' | 'general' | 'archive';
  targetId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  isAdmin?: boolean;
  content: string;
  createdAt: string;
  isPinned?: boolean;
}

export interface PlatformResource {
  id: string;
  title: string;
  description: string;
  content?: string;
  linkUrl?: string;
  attachmentName?: string;
  attachmentDataUrl?: string;
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

export interface PlatformDataState {
  announcement?: PlatformAnnouncement;
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
  token: string | null;
  platform: PlatformDataState;
  pendingCounts: PendingCounts;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalInitialMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isAdminModalOpen: boolean;
  adminModalTab: 'approvals' | 'users' | 'announcement' | 'analytics';
  openAdminModal: (tab?: 'approvals' | 'users' | 'announcement' | 'analytics') => void;
  closeAdminModal: () => void;
  refreshPlatform: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, fullName: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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

  const [platform, setPlatform] = useState<PlatformDataState>({
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
  });

  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({
    resources: 0,
    homeworks: 0,
    clubs: 0,
    total: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>('login');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [adminModalTab, setAdminModalTab] = useState<'approvals' | 'users' | 'announcement' | 'analytics'>('approvals');

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

  const refreshPlatform = useCallback(
    async (overrideToken?: string | null) => {
      try {
        const res = await fetch('/api/platform/state', {
          headers: getHeaders(overrideToken),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.platform) {
          setPlatform({
            announcement: data.platform.announcement,
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
          });
        }
        if (data.pendingCounts) {
          setPendingCounts(data.pendingCounts);
        }
        if (data.currentUser) {
          setUser(data.currentUser);
          try {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.currentUser));
          } catch {}
        } else if (overrideToken === null) {
          setUser(null);
        }
      } catch (e) {
        console.warn('[PlatformContext] Failed to fetch state:', e);
      } finally {
        setIsLoading(false);
      }
    },
    [getHeaders]
  );

  useEffect(() => {
    refreshPlatform();
  }, [refreshPlatform]);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalInitialMode(mode);
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openAdminModal = (tab: 'approvals' | 'users' | 'announcement' | 'analytics' = 'approvals') => {
    setAdminModalTab(tab);
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

  // --- CRUD Mutations ---
  const addCalendarEvent = async (ev: Partial<CalendarEvent>) => {
    const res = await fetch('/api/platform/calendar', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(ev),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const updateCalendarEvent = async (id: string, ev: Partial<CalendarEvent>) => {
    const res = await fetch(`/api/platform/calendar/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(ev),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const deleteCalendarEvent = async (id: string) => {
    const res = await fetch(`/api/platform/calendar/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const addHomework = async (hw: any) => {
    const res = await fetch('/api/platform/homework', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(hw),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      await refreshPlatform();
      return { success: true, isPending: data.homework?.status === 'pending' };
    }
    return { success: false, error: data.error || 'დავალების დამატება ვერ მოხერხდა' };
  };

  const updateHomework = async (id: string, hw: any) => {
    const res = await fetch(`/api/platform/homework/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(hw),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const moderateHomework = async (id: string, status: 'approved' | 'rejected') => {
    const res = await fetch(`/api/platform/homework/${id}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const deleteHomework = async (id: string) => {
    const res = await fetch(`/api/platform/homework/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const updateTimetable = async (timetable: DaySchedule[]) => {
    const res = await fetch('/api/platform/timetable', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ timetable }),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const submitResource = async (resource: Partial<PlatformResource>) => {
    const res = await fetch('/api/platform/resources', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(resource),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      await refreshPlatform();
      return { success: true, isPending: data.resource?.status === 'pending' };
    }
    return { success: false, error: data.error || 'მასალის ატვირთვა ვერ მოხერხდა' };
  };

  const moderateResource = async (id: string, status: 'approved' | 'rejected') => {
    const res = await fetch(`/api/platform/resources/${id}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const deleteResource = async (id: string) => {
    const res = await fetch(`/api/platform/resources/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const upvoteResource = async (id: string) => {
    const res = await fetch(`/api/platform/resources/${id}/upvote`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const addComment = async (
    targetType: PlatformComment['targetType'],
    targetId: string,
    content: string
  ) => {
    const res = await fetch('/api/platform/comments', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ targetType, targetId, content }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      await refreshPlatform();
      return { success: true };
    }
    return { success: false, error: data.error || 'კომენტარის დამატება ვერ მოხერხდა' };
  };

  const deleteComment = async (id: string) => {
    const res = await fetch(`/api/platform/comments/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const pinComment = async (id: string) => {
    const res = await fetch(`/api/platform/comments/${id}/pin`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const addOpportunity = async (opp: any) => {
    const res = await fetch('/api/platform/opportunities', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(opp),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const updateOpportunity = async (id: string, opp: any) => {
    const res = await fetch(`/api/platform/opportunities/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(opp),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const deleteOpportunity = async (id: string) => {
    const res = await fetch(`/api/platform/opportunities/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const rsvpOpportunity = async (id: string) => {
    const res = await fetch(`/api/platform/opportunities/${id}/rsvp`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const askOpportunityQuestion = async (id: string, question: string) => {
    const res = await fetch(`/api/platform/opportunities/${id}/question`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question }),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const addIdea = async (idea: any) => {
    const res = await fetch('/api/platform/ideas', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(idea),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const updateIdea = async (id: string, idea: any) => {
    const res = await fetch(`/api/platform/ideas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(idea),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const deleteIdea = async (id: string) => {
    const res = await fetch(`/api/platform/ideas/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const upvoteIdea = async (id: string) => {
    const res = await fetch(`/api/platform/ideas/${id}/upvote`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const addClub = async (club: any) => {
    const res = await fetch('/api/platform/clubs', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(club),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const updateClub = async (id: string, club: any) => {
    const res = await fetch(`/api/platform/clubs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(club),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const deleteClub = async (id: string) => {
    const res = await fetch(`/api/platform/clubs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const addStudyPod = async (pod: any) => {
    const res = await fetch('/api/platform/study-pods', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(pod),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const joinStudyPod = async (id: string, guestName?: string) => {
    const res = await fetch(`/api/platform/study-pods/${id}/join`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name: guestName }),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const deleteStudyPod = async (id: string) => {
    const res = await fetch(`/api/platform/study-pods/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const addArchivePack = async (pack: Partial<ArchiveStudyPack>) => {
    const res = await fetch('/api/platform/archive', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(pack),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const deleteArchivePack = async (id: string) => {
    const res = await fetch(`/api/platform/archive/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  const updateAnnouncement = async (ann: Partial<PlatformAnnouncement>) => {
    const res = await fetch('/api/platform/announcement', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(ann),
    });
    if (res.ok) {
      await refreshPlatform();
      return true;
    }
    return false;
  };

  return (
    <PlatformContext.Provider
      value={{
        user,
        isAdmin: Boolean(user?.isAdmin || user?.role === 'admin'),
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
