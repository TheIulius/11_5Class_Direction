// Live Platform & Detailed Learning Analytics Service for 11/5 Class Direction Platform
// Captures site visits, quiz views, studio tab clicks, poem views, test completions,
// open written question submissions (word counts & validation), and voice/video watch/listen metrics.
// Persists multi-tier: LocalStorage cache + Express db.json backend synced to GitHub data branch.

import { useState, useEffect } from 'react';

export interface DetailedAnalyticsStats {
  visits: number;
  uniqueIpsCount: number;
  quizClicks: number;
  loading: boolean;
  lastUpdated?: string;

  // Tabs clicks
  tabClicks: {
    overview: number;
    poem: number;
    analysis: number;
    quiz: number;
    open: number;
    flashcards: number;
    [key: string]: number;
  };

  // Poem/Topic views
  topicViews: Record<string, number>;

  // Multiple-choice test stats
  tests: {
    totalAnswered: number;
    correctAnswers: number;
    incorrectAnswers: number;
    quizzesCompleted: number;
    byTopic: Record<string, { answered: number; correct: number }>;
  };

  // Open written questions stats (real answers verification)
  openQuestions: {
    totalSubmitted: number;
    meaningfulSubmissions: number; // >= 10 words (real written answers)
    totalWords: number;
    averageWordCount: number;
    statusBreakdown: {
      correct: number;
      partial: number;
      needs_work: number;
    };
    byTopic: Record<string, number>;
  };

  // 2-host podcast listening stats
  podcastStats: {
    totalPlays: number;
    totalCompletes: number;
    totalSeconds: number;
    averageSeconds: number;
    milestones: {
      reached25: number;
      reached50: number;
      reached75: number;
      reached100: number;
    };
    byEpisode: Record<string, { plays: number; completes: number; totalSeconds: number }>;
  };

  // Video overview watching stats
  videoStats: {
    totalPlays: number;
    totalCompletes: number;
    totalSeconds: number;
    averageSeconds: number;
    milestones: {
      reached25: number;
      reached50: number;
      reached75: number;
      reached100: number;
    };
    byVideo: Record<string, { plays: number; completes: number; totalSeconds: number }>;
  };
}

const STORAGE_KEY_DETAILED = '11_5_detailed_analytics_v2';
const SESSION_VISIT_KEY = '11_5_session_visit_registered_v2';

const ABACUS_BASE = 'https://abacus.jasoncameron.dev';
const ABACUS_NAMESPACE = '11_5_class_platform_prod';
const FALLBACK_BASE = 'https://countapi.mileshilliard.com/api/v1';
const FALLBACK_KEY_VISITS = '11_5_class_platform_visits_prod';
const FALLBACK_KEY_QUIZ = '11_5_class_platform_quiz_clicks_prod';

type Listener = (stats: DetailedAnalyticsStats) => void;
const listeners = new Set<Listener>();

function getDefaultStats(): DetailedAnalyticsStats {
  return {
    visits: 1,
    uniqueIpsCount: 1,
    quizClicks: 1,
    loading: true,
    lastUpdated: new Date().toISOString(),
    tabClicks: { overview: 0, poem: 0, analysis: 0, quiz: 0, open: 0, flashcards: 0 },
    topicViews: { 'edemi': 0, 'visac-gsurt': 0, 'vah-droni': 0, 'gogcha': 0, 'sagamo': 0, 'tamar-mefe': 0 },
    tests: { totalAnswered: 0, correctAnswers: 0, incorrectAnswers: 0, quizzesCompleted: 0, byTopic: {} },
    openQuestions: {
      totalSubmitted: 0,
      meaningfulSubmissions: 0,
      totalWords: 0,
      averageWordCount: 0,
      statusBreakdown: { correct: 0, partial: 0, needs_work: 0 },
      byTopic: {}
    },
    podcastStats: {
      totalPlays: 0,
      totalCompletes: 0,
      totalSeconds: 0,
      averageSeconds: 0,
      milestones: { reached25: 0, reached50: 0, reached75: 0, reached100: 0 },
      byEpisode: {}
    },
    videoStats: {
      totalPlays: 0,
      totalCompletes: 0,
      totalSeconds: 0,
      averageSeconds: 0,
      milestones: { reached25: 0, reached50: 0, reached75: 0, reached100: 0 },
      byVideo: {}
    }
  };
}

function loadInitialStats(): DetailedAnalyticsStats {
  if (typeof window === 'undefined') return getDefaultStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DETAILED);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...getDefaultStats(),
        ...parsed,
        loading: true
      };
    }
  } catch {}
  return getDefaultStats();
}

let currentStats: DetailedAnalyticsStats = loadInitialStats();

function notifyListeners() {
  try {
    localStorage.setItem(STORAGE_KEY_DETAILED, JSON.stringify(currentStats));
  } catch {}
  listeners.forEach(fn => {
    try {
      fn(currentStats);
    } catch (err) {
      console.warn('[Analytics] Listener error:', err);
    }
  });
}

async function fetchWithTimeout(url: string, timeoutMs = 3500, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// Fetch analytics from backend
export async function refreshAnalytics(): Promise<DetailedAnalyticsStats> {
  try {
    const res = await fetchWithTimeout('/api/analytics', 3500);
    if (res.ok) {
      const data = await res.json();
      currentStats = {
        ...currentStats,
        ...data,
        visits: Math.max(currentStats.visits, data.visits || 0),
        uniqueIpsCount: Math.max(currentStats.uniqueIpsCount || 1, data.uniqueIpsCount || 1),
        quizClicks: Math.max(currentStats.quizClicks, data.quizClicks || 0),
        loading: false
      };
      notifyListeners();
    }
  } catch {
    currentStats = { ...currentStats, loading: false };
    notifyListeners();
  }
  return currentStats;
}

// Record site visit on session startup
let hasInitializedSession = false;
export async function recordSiteVisit(): Promise<DetailedAnalyticsStats> {
  let isNewSession = false;
  if (typeof window !== 'undefined' && !hasInitializedSession) {
    hasInitializedSession = true;
    try {
      if (!sessionStorage.getItem(SESSION_VISIT_KEY)) {
        isNewSession = true;
        sessionStorage.setItem(SESSION_VISIT_KEY, 'true');
      }
    } catch {
      isNewSession = true;
    }
  }

  try {
    if (isNewSession) {
      currentStats.visits += 1;
      notifyListeners();
      await fetchWithTimeout('/api/analytics/visit', 3500, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    }
    await refreshAnalytics();
  } catch {
    currentStats = { ...currentStats, loading: false };
    notifyListeners();
  }
  return currentStats;
}

// Record Quiz button click
let lastQuizClickTime = 0;
export async function recordQuizClick(): Promise<void> {
  const now = Date.now();
  if (now - lastQuizClickTime < 500) return;
  lastQuizClickTime = now;

  currentStats.quizClicks += 1;
  notifyListeners();

  try {
    await fetchWithTimeout('/api/analytics/quiz-click', 3500, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {}
}

// Generic event sender
export async function sendAnalyticsEvent(event: string, payload?: any): Promise<void> {
  try {
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload })
    }).catch(() => {});
  } catch {}
}

// 1. Studio Tab Click
export function trackTabClick(tab: string) {
  if (!currentStats.tabClicks) currentStats.tabClicks = { overview: 0, poem: 0, analysis: 0, quiz: 0, open: 0, flashcards: 0 };
  currentStats.tabClicks[tab] = (currentStats.tabClicks[tab] || 0) + 1;
  notifyListeners();
  sendAnalyticsEvent('tab_click', { tab });
}

// 2. Topic/Poem View
export function trackTopicView(topicId: string) {
  if (!currentStats.topicViews) currentStats.topicViews = {};
  currentStats.topicViews[topicId] = (currentStats.topicViews[topicId] || 0) + 1;
  notifyListeners();
  sendAnalyticsEvent('topic_view', { topicId });
}

// 3. Multiple Choice Question Answered
export function trackTestAnswer(topicId: string, questionId: string, isCorrect: boolean) {
  if (!currentStats.tests) currentStats.tests = { totalAnswered: 0, correctAnswers: 0, incorrectAnswers: 0, quizzesCompleted: 0, byTopic: {} };
  currentStats.tests.totalAnswered += 1;
  if (isCorrect) {
    currentStats.tests.correctAnswers += 1;
  } else {
    currentStats.tests.incorrectAnswers += 1;
  }
  if (!currentStats.tests.byTopic) currentStats.tests.byTopic = {};
  const t = currentStats.tests.byTopic[topicId] || { answered: 0, correct: 0 };
  t.answered += 1;
  if (isCorrect) t.correct += 1;
  currentStats.tests.byTopic[topicId] = t;

  notifyListeners();
  sendAnalyticsEvent('test_answer', { topicId, questionId, isCorrect });
}

// 4. Quiz Topic Completed
export function trackQuizComplete(topicId: string, score: number, total: number) {
  if (!currentStats.tests) currentStats.tests = { totalAnswered: 0, correctAnswers: 0, incorrectAnswers: 0, quizzesCompleted: 0, byTopic: {} };
  currentStats.tests.quizzesCompleted += 1;
  notifyListeners();
  sendAnalyticsEvent('quiz_complete', { topicId, score, total });
}

// 5. Open Written Question Submitted for AI Review
export function trackOpenQuestionSubmit(
  topicId: string,
  questionId: string,
  wordCount: number,
  status: 'correct' | 'partial' | 'needs_work',
  score: number
) {
  if (!currentStats.openQuestions) {
    currentStats.openQuestions = {
      totalSubmitted: 0,
      meaningfulSubmissions: 0,
      totalWords: 0,
      averageWordCount: 0,
      statusBreakdown: { correct: 0, partial: 0, needs_work: 0 },
      byTopic: {}
    };
  }

  const w = Math.max(0, wordCount);
  currentStats.openQuestions.totalSubmitted += 1;
  currentStats.openQuestions.totalWords += w;
  currentStats.openQuestions.averageWordCount = Math.round(
    currentStats.openQuestions.totalWords / currentStats.openQuestions.totalSubmitted
  );
  if (w >= 10) {
    currentStats.openQuestions.meaningfulSubmissions += 1;
  }
  if (status in currentStats.openQuestions.statusBreakdown) {
    currentStats.openQuestions.statusBreakdown[status] += 1;
  }
  if (!currentStats.openQuestions.byTopic) currentStats.openQuestions.byTopic = {};
  currentStats.openQuestions.byTopic[topicId] = (currentStats.openQuestions.byTopic[topicId] || 0) + 1;

  notifyListeners();
  sendAnalyticsEvent('open_question_submit', { topicId, questionId, wordCount: w, status, score });
}

// 6. Podcast Audio Listening Progress & Completion Tracking
export function trackPodcastProgress(params: {
  episode: string;
  seconds: number;
  percent: number;
  isNewPlay?: boolean;
  milestone?: 25 | 50 | 75 | 100;
  completed?: boolean;
}) {
  if (!currentStats.podcastStats) {
    currentStats.podcastStats = {
      totalPlays: 0,
      totalCompletes: 0,
      totalSeconds: 0,
      averageSeconds: 0,
      milestones: { reached25: 0, reached50: 0, reached75: 0, reached100: 0 },
      byEpisode: {}
    };
  }

  const { episode, seconds, isNewPlay, milestone, completed } = params;
  if (isNewPlay) currentStats.podcastStats.totalPlays += 1;
  if (seconds > 0) currentStats.podcastStats.totalSeconds += seconds;
  if (currentStats.podcastStats.totalPlays > 0) {
    currentStats.podcastStats.averageSeconds = Math.round(
      currentStats.podcastStats.totalSeconds / currentStats.podcastStats.totalPlays
    );
  }
  if (milestone === 25) currentStats.podcastStats.milestones.reached25 += 1;
  if (milestone === 50) currentStats.podcastStats.milestones.reached50 += 1;
  if (milestone === 75) currentStats.podcastStats.milestones.reached75 += 1;
  if (completed || milestone === 100) {
    currentStats.podcastStats.milestones.reached100 += 1;
    currentStats.podcastStats.totalCompletes += 1;
  }

  notifyListeners();
  sendAnalyticsEvent('podcast_progress', params);
}

// 7. Video Overview Watching Progress & Completion Tracking
export function trackVideoProgress(params: {
  video: string;
  seconds: number;
  percent: number;
  isNewPlay?: boolean;
  milestone?: 25 | 50 | 75 | 100;
  completed?: boolean;
}) {
  if (!currentStats.videoStats) {
    currentStats.videoStats = {
      totalPlays: 0,
      totalCompletes: 0,
      totalSeconds: 0,
      averageSeconds: 0,
      milestones: { reached25: 0, reached50: 0, reached75: 0, reached100: 0 },
      byVideo: {}
    };
  }

  const { video, seconds, isNewPlay, milestone, completed } = params;
  if (isNewPlay) currentStats.videoStats.totalPlays += 1;
  if (seconds > 0) currentStats.videoStats.totalSeconds += seconds;
  if (currentStats.videoStats.totalPlays > 0) {
    currentStats.videoStats.averageSeconds = Math.round(
      currentStats.videoStats.totalSeconds / currentStats.videoStats.totalPlays
    );
  }
  if (milestone === 25) currentStats.videoStats.milestones.reached25 += 1;
  if (milestone === 50) currentStats.videoStats.milestones.reached50 += 1;
  if (milestone === 75) currentStats.videoStats.milestones.reached75 += 1;
  if (completed || milestone === 100) {
    currentStats.videoStats.milestones.reached100 += 1;
    currentStats.videoStats.totalCompletes += 1;
  }

  notifyListeners();
  sendAnalyticsEvent('video_progress', params);
}

// Subscription & Hooks
export function subscribeAnalytics(listener: Listener): () => void {
  listeners.add(listener);
  listener(currentStats);
  return () => {
    listeners.delete(listener);
  };
}

export function getCurrentStats(): DetailedAnalyticsStats {
  return currentStats;
}

export function usePlatformAnalytics(): DetailedAnalyticsStats {
  const [stats, setStats] = useState<DetailedAnalyticsStats>(() => getCurrentStats());

  useEffect(() => {
    const unsubscribe = subscribeAnalytics(newStats => {
      setStats({ ...newStats });
    });
    recordSiteVisit();
    return () => {
      unsubscribe();
    };
  }, []);

  return stats;
}
