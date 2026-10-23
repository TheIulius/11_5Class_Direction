// Live Visitor and Quiz-Click Analytics Service for 11/5 class Platform
// Uses resilient multi-tier counters: primary Abacus API, fallback MilesHilliard CountAPI, and LocalStorage cache.
import { useState, useEffect } from 'react';

export interface PlatformAnalyticsStats {
  visits: number;
  quizClicks: number;
  loading: boolean;
}

const STORAGE_KEY_VISITS = '11_5_cached_visits_v1';
const STORAGE_KEY_QUIZ_CLICKS = '11_5_cached_quiz_clicks_v1';
const SESSION_VISIT_KEY = '11_5_session_visit_registered_v1';

const ABACUS_BASE = 'https://abacus.jasoncameron.dev';
const ABACUS_NAMESPACE = '11_5_class_platform_prod';

const FALLBACK_BASE = 'https://countapi.mileshilliard.com/api/v1';
const FALLBACK_KEY_VISITS = '11_5_class_platform_visits_prod';
const FALLBACK_KEY_QUIZ = '11_5_class_platform_quiz_clicks_prod';

type Listener = (stats: PlatformAnalyticsStats) => void;
const listeners = new Set<Listener>();

// Initial in-memory stats initialized from localStorage cache if available
let currentStats: PlatformAnalyticsStats = {
  visits: getStoredNumber(STORAGE_KEY_VISITS, 1),
  quizClicks: getStoredNumber(STORAGE_KEY_QUIZ_CLICKS, 1),
  loading: true
};

function getStoredNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = localStorage.getItem(key);
    if (val) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {}
  return fallback;
}

function updateStats(newVisits?: number, newQuizClicks?: number, loading = false) {
  let changed = false;
  const next: PlatformAnalyticsStats = { ...currentStats, loading };

  if (typeof newVisits === 'number' && newVisits >= currentStats.visits) {
    next.visits = newVisits;
    try {
      localStorage.setItem(STORAGE_KEY_VISITS, String(newVisits));
    } catch {}
    changed = true;
  }

  if (typeof newQuizClicks === 'number' && newQuizClicks >= currentStats.quizClicks) {
    next.quizClicks = newQuizClicks;
    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_CLICKS, String(newQuizClicks));
    } catch {}
    changed = true;
  }

  if (currentStats.loading !== loading) {
    changed = true;
  }

  if (changed) {
    currentStats = next;
    listeners.forEach(fn => {
      try {
        fn(currentStats);
      } catch (err) {
        console.warn('[Analytics] Listener error:', err);
      }
    });
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 3500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// 1. Fetch value via Abacus with Fallback to MilesHilliard
async function fetchMetric(action: 'hit' | 'get', metric: 'site_visits' | 'quiz_clicks'): Promise<number | null> {
  // Try Abacus (Primary)
  try {
    const url = `${ABACUS_BASE}/${action}/${ABACUS_NAMESPACE}/${metric}`;
    const res = await fetchWithTimeout(url, 3500);
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.value === 'number') {
        return data.value;
      }
    }
  } catch {}

  // Try MilesHilliard (Secondary Fallback)
  try {
    const fallbackKey = metric === 'site_visits' ? FALLBACK_KEY_VISITS : FALLBACK_KEY_QUIZ;
    const url = `${FALLBACK_BASE}/${action}/${fallbackKey}`;
    const res = await fetchWithTimeout(url, 3500);
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.value === 'number') {
        return data.value;
      }
    }
  } catch {}

  return null;
}

let hasInitializedSession = false;

/**
 * Initializes and records a website visit on first page load in a browser session.
 * Subsequent refreshes in the same tab only fetch current counts without inflating visits.
 */
export async function recordSiteVisit(): Promise<PlatformAnalyticsStats> {
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
    const visitAction = isNewSession ? 'hit' : 'get';
    const [visitsResult, quizResult] = await Promise.allSettled([
      fetchMetric(visitAction, 'site_visits'),
      fetchMetric('get', 'quiz_clicks')
    ]);

    const visits = visitsResult.status === 'fulfilled' && visitsResult.value !== null
      ? visitsResult.value
      : currentStats.visits;

    const quizClicks = quizResult.status === 'fulfilled' && quizResult.value !== null
      ? quizResult.value
      : currentStats.quizClicks;

    updateStats(visits, quizClicks, false);
  } catch {
    updateStats(currentStats.visits, currentStats.quizClicks, false);
  }

  return currentStats;
}

let lastQuizClickTime = 0;

/**
 * Increments the Quiz button click counter whenever someone clicks the Quiz button.
 */
export async function recordQuizClick(): Promise<void> {
  const now = Date.now();
  if (now - lastQuizClickTime < 500) {
    return; // Ignore duplicate calls triggered in the same user gesture
  }
  lastQuizClickTime = now;

  // Optimistically increment locally immediately for zero-lag UI feedback
  updateStats(currentStats.visits, currentStats.quizClicks + 1, false);

  try {
    const freshQuizClicks = await fetchMetric('hit', 'quiz_clicks');
    if (freshQuizClicks !== null) {
      updateStats(undefined, freshQuizClicks, false);
    }
  } catch (err) {
    console.warn('[Analytics] Failed to register quiz click to remote counter:', err);
  }
}

/**
 * Subscribe to stats updates
 */
export function subscribeAnalytics(listener: Listener): () => void {
  listeners.add(listener);
  listener(currentStats);
  return () => {
    listeners.delete(listener);
  };
}

export function getCurrentStats(): PlatformAnalyticsStats {
  return currentStats;
}

/**
 * React Hook for consuming live platform analytics in components.
 */
export function usePlatformAnalytics() {
  const [stats, setStats] = useState<PlatformAnalyticsStats>(() => getCurrentStats());

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
