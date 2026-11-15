import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  Play,
  X,
  Sparkles,
  ChevronRight,
  User,
  GraduationCap,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';
import { ActiveTab } from './Navbar';
import { CalendarEvent, HomeworkAssignment } from '../data/campaignData';
import {
  getTbilisiNow,
  getTbilisiTodayString,
  getCurrentActivePeriod,
  formatGeorgianDate,
  getDaysBetweenDateStrings,
  LESSON_PERIOD_TIMES,
} from '../utils/tbilisiDate';
import { getCategoryStyle } from '../utils/calendarCategories';
import { useDesignPreview } from '../context/DesignPreviewContext';
import {
  TapeStrip,
  PinDot,
  SketchBlueArrow,
  SketchPurpleSmiley,
} from './NotebookDecorations';
import { GuestBlurGate } from './GuestBlurGate';

interface HeroSectionProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenVideo?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigateTab, onOpenVideo }) => {
  const { user, platform, openAuthModal } = usePlatform();
  const { isNotebook } = useDesignPreview();
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const getGenitiveWeekday = (day: string) => {
    if (day.endsWith('ი')) {
      return day.slice(0, -1) + 'ის';
    }
    return day + 'ის';
  };

  const handleCloseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsVideoOpen(false);
    setVideoError(false);
  };

  // Real Tbilisi Date & Time (auto-refreshes every 30s or on visibilitychange)
  const [tbilisiTime, setTbilisiTime] = useState(() => getTbilisiNow());
  const [completedHw, setCompletedHw] = useState<Record<string, boolean>>(() => {
    try {
      const savedV1 = localStorage.getItem('class11_5_hw_completed_v1');
      const savedLegacy = localStorage.getItem('class11_5_completed_homework');
      return {
        ...(savedLegacy ? JSON.parse(savedLegacy) : {}),
        ...(savedV1 ? JSON.parse(savedV1) : {}),
      };
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleRefresh = () => setTbilisiTime(getTbilisiNow());
    const interval = setInterval(handleRefresh, 30000);
    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
    };
  }, []);

  useEffect(() => {
    if (isVideoOpen && videoRef.current) {
      setVideoError(false);
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [isVideoOpen]);

  const toggleHomeworkComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.success();
    setCompletedHw((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        const serialized = JSON.stringify(next);
        localStorage.setItem('class11_5_hw_completed_v1', serialized);
        localStorage.setItem('class11_5_completed_homework', serialized);
      } catch {}
      return next;
    });
  };

  const todayString = tbilisiTime.dateString;
  const activePeriod = getCurrentActivePeriod();

  // Find today's timetable based on real weekday in Tbilisi
  // If weekend (Sat=6, Sun=7), default to Monday (dayId: 'ორშაბათი')
  const timetableDayId = tbilisiTime.weekday >= 1 && tbilisiTime.weekday <= 5
    ? tbilisiTime.weekdayGeorgian
    : 'ორშაბათი';

  const todaySchedule = useMemo(() => {
    const match = platform.timetable.find((d) => d.dayId === timetableDayId);
    return match || platform.timetable[0];
  }, [platform.timetable, timetableDayId]);

  // Real Upcoming Assessments (შემაჯამებელი / დამოუკიდებელი)
  // Strictly filter by date >= today in Tbilisi. Never show past events as upcoming!
  const upcomingAssessments = useMemo(() => {
    const items = platform.calendarEvents
      .filter((e) => {
        const isAssessment = e.category === 'შემაჯამებელი' || e.category === 'დამოუკიდებელი';
        return isAssessment && e.date >= todayString;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
    return items.slice(0, 3);
  }, [platform.calendarEvents, todayString]);

  // Active / Upcoming Homework items (due today or in future)
  const activeHomeworks = useMemo(() => {
    return platform.homeworks
      .filter((h) => h.status !== 'rejected' && (h.date || '') >= todayString)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .slice(0, 4);
  }, [platform.homeworks, todayString]);

  // Overdue Homework items on the Home page:
  // Automatically expire/cancel overdue items once more than 10 days (1–2 weeks) have passed!
  const overdueHomeworks = useMemo(() => {
    return platform.homeworks
      .filter((h) => {
        if (h.status === 'rejected' || !h.date) return false;
        if (completedHw[h.id]) return false;
        const daysElapsed = getDaysBetweenDateStrings(h.date, todayString);
        return daysElapsed > 0 && daysElapsed <= 10;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [platform.homeworks, todayString, completedHw]);

  // Next Alumni Session (if in future)
  const nextOpportunity = useMemo(() => {
    const upcoming = platform.opportunities.filter((o) => (o.date || '') >= todayString);
    return upcoming[0] || platform.opportunities[0] || null;
  }, [platform.opportunities, todayString]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-8 space-y-3.5 sm:space-y-8">
      {/* =========================================================================
          TOP BAR OR KOMCLUB NOTEBOOK HERO + ACTIVE BOARD
          ========================================================================= */}
      {isNotebook ? (
        <section
          aria-label="11/5 კლასის მთავარი დაფა"
          className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-10 items-center pt-0.5 sm:pt-2 pb-1 sm:pb-4"
        >
          {/* Left: Expressive Wordmark, Sticky Eyebrow, Copy, Tactile CTAs & Dashed Blue Arrow */}
          <div className="lg:col-span-7 space-y-2 sm:space-y-4">
            {/* Top row: Date eyebrow + Compact Mobile Active Board Pill Strip in top-right corner */}
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              <div className="nb-eyebrow !text-[10px] sm:!text-xs !py-1 !px-2.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-600" aria-hidden="true" />
                <span>11/5 &bull; {tbilisiTime.formattedDisplay}</span>
              </div>

              {/* Compact Mobile Top-Corner "აქტიური დაფა" Pill Strip */}
              <div
                className="lg:hidden flex items-center gap-1 bg-[#f7f3ec] border-2 border-[#2d2d2d] rounded-xl px-1.5 py-0.5 shadow-[2px_2px_0_#2d2d2d]"
                aria-label="აქტიური დაფის მოკლე მაჩვენებლები"
              >
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.click();
                    if (!user) openAuthModal('register');
                    else onNavigateTab('homework');
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-[#2d2d2d] hover:bg-[#fff9c4] cursor-pointer"
                  title="მიმდინარე დავალებები"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#7b2ff7]" />
                  <span className={!user ? 'blur-[3px] select-none' : ''}>{activeHomeworks.length}</span>
                </button>
                <span className="text-[#2d2d2d]/30 text-[10px]">|</span>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.click();
                    if (!user) openAuthModal('register');
                    else onNavigateTab('calendar');
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-[#2d2d2d] hover:bg-[#fff9c4] cursor-pointer"
                  title="მოახლოებული შემაჯამებლები"
                >
                  <CalendarIcon className="w-3 h-3 text-[#d91b7a]" />
                  <span className={!user ? 'blur-[3px] select-none' : ''}>{upcomingAssessments.length}</span>
                </button>
                <span className="text-[#2d2d2d]/30 text-[10px]">|</span>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.click();
                    if (!user) openAuthModal('register');
                    else onNavigateTab('materials');
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-[#2d2d2d] hover:bg-[#fff9c4] cursor-pointer"
                  title="სასწავლო მოდულები"
                >
                  <BookOpen className="w-3 h-3 text-[#1d70b8]" />
                  <span className={!user ? 'blur-[3px] select-none' : ''}>{platform.archivePacks.length}</span>
                </button>
              </div>
            </div>

            {/* Compact Title Row on Mobile + Inline Video Trigger */}
            <div className="flex items-center justify-between gap-2">
              <h1 className="nb-hero-wordmark !text-[1.45rem] sm:!text-[clamp(2.25rem,4.6vw,3.65rem)] !leading-tight">
                კომაროვის{' '}
                <span className="nb-hero-wordmark-magenta">11⁵ კლასი</span>
                <span className="nb-hero-wordmark-bang" aria-hidden="true">
                  !
                </span>
              </h1>

              <button
                type="button"
                onClick={() => {
                  soundEffects.click();
                  if (onOpenVideo) onOpenVideo();
                  else setIsVideoOpen(true);
                }}
                className="sm:hidden shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#f7f3ec] border-2 border-[#2d2d2d] shadow-[2px_2px_0_#2d2d2d] text-[11px] font-bold text-[#2d2d2d] cursor-pointer"
              >
                <Play className="w-3 h-3 text-[var(--primary-action)] fill-[var(--primary-action)]" aria-hidden="true" />
                <span>რატომ ავირჩიოთ</span>
              </button>
            </div>

            <p className="hidden sm:block text-base sm:text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed">
              საშინაო დავალებები, შემაჯამებლების კალენდარი, მიმდინარე გაკვეთილების ცხრილი და სასწავლო მოდულები ერთ სივრცეში.
            </p>

            <div className="hidden sm:flex flex-wrap items-center gap-2.5 sm:gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  soundEffects.click();
                  onNavigateTab('homework');
                }}
                className="nb-btn-primary min-h-[46px] sm:min-h-[48px] px-4 sm:px-5 py-2.5 text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>დავალებები &amp; ცხრილი</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.click();
                  if (onOpenVideo) onOpenVideo();
                  else setIsVideoOpen(true);
                }}
                className="nb-btn-secondary min-h-[46px] sm:min-h-[48px] px-4 sm:px-5 py-2.5 text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 shrink-0 text-[var(--primary-action)] fill-[var(--primary-action)]" aria-hidden="true" />
                <span>რატომ ავირჩიოთ</span>
              </button>

              <SketchBlueArrow />
            </div>
          </div>

          {/* Right (Desktop only at top): Crooked Paper Active Board ("11/5 კლასის აქტიური დაფა") */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="nb-active-board">
              <TapeStrip tilt="left" />
              <h2 className="nb-active-board-title">11/5 კლასის აქტიური დაფა</h2>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.click();
                    if (!user) openAuthModal('register');
                    else onNavigateTab('homework');
                  }}
                  className="nb-stat-tile"
                >
                  <span className="nb-stat-icon" aria-hidden="true">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <span>
                    <span className="nb-stat-label">მიმდინარე დავალებები</span>
                    <strong className={`nb-stat-value ${!user ? 'blur-[4px] select-none' : ''}`}>
                      {activeHomeworks.length}
                    </strong>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.click();
                    if (!user) openAuthModal('register');
                    else onNavigateTab('calendar');
                  }}
                  className="nb-stat-tile"
                >
                  <span className="nb-stat-icon" aria-hidden="true">
                    <CalendarIcon className="w-5 h-5" />
                  </span>
                  <span>
                    <span className="nb-stat-label">მოახლოებული შემაჯამებლები</span>
                    <strong className={`nb-stat-value ${!user ? 'blur-[4px] select-none' : ''}`}>
                      {upcomingAssessments.length}
                    </strong>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.click();
                    if (!user) openAuthModal('register');
                    else onNavigateTab('materials');
                  }}
                  className="nb-stat-tile"
                >
                  <span className="nb-stat-icon" aria-hidden="true">
                    <BookOpen className="w-5 h-5" />
                  </span>
                  <span>
                    <span className="nb-stat-label">სასწავლო მოდულები</span>
                    <strong className={`nb-stat-value ${!user ? 'blur-[4px] select-none' : ''}`}>
                      {platform.archivePacks.length}
                    </strong>
                  </span>
                </button>
              </div>

              <SketchPurpleSmiley />
            </div>
          </div>
        </section>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-subtle)]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {tbilisiTime.formattedDisplay}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              კომაროვის 11/5 კლასი
            </h1>
          </div>

          <button
            onClick={() => {
              soundEffects.click();
              if (onOpenVideo) onOpenVideo();
              else setIsVideoOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl card-third text-xs font-semibold text-[var(--text-primary)] hover:opacity-90 transition-opacity self-start sm:self-auto cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-[var(--primary-action)] fill-[var(--primary-action)]" />
            <span>რატომ ავირჩიოთ</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          MAIN COMMAND CENTER GRID (2 COLUMNS) — BLURRED FOR GUESTS
          ========================================================================= */}
      <GuestBlurGate>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* =====================================================================
            LEFT COLUMN (7 COLS): DAILY TASKS & UPCOMING ASSESSMENTS
            ===================================================================== */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          {/* Card 1: Today's Homework */}
          <div className="card-surface rounded-2xl p-4 sm:p-6 space-y-4">
            {isNotebook && <TapeStrip tilt="right" />}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl card-third flex items-center justify-center text-[var(--primary-action)]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">საშინაო დავალებები</h2>
                  <p className="text-[11px] text-[var(--text-muted)]">მიმდინარე დავალებები კალენდრით</p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundEffects.click();
                  onNavigateTab('homework');
                }}
                className="text-xs font-semibold text-[var(--primary-action)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>სრულად</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Homework List using third tonal surface instead of nested borders */}
            <div className="space-y-2.5">
              {activeHomeworks.length === 0 ? (
                <div className="p-4 rounded-xl card-third text-center text-xs text-[var(--text-muted)]">
                  დავალებები ამჟამად არ არის დამატებული.
                </div>
              ) : (
                activeHomeworks.map((hw) => {
                  const isDone = Boolean(completedHw[hw.id]);
                  return (
                    <div
                      key={hw.id}
                      onClick={() => onNavigateTab('homework')}
                      className={`p-3.5 rounded-xl card-third transition-all cursor-pointer ${
                        isDone ? 'opacity-60' : 'hover:opacity-95'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={(e) => toggleHomeworkComplete(hw.id, e)}
                          className="w-11 h-11 min-w-[44px] min-h-[44px] -m-2.5 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                          aria-label={isDone ? 'მონიშვნის მოხსნა' : 'შესრულებულად მონიშვნა'}
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : 'border border-[var(--text-muted)] hover:border-[var(--primary-action)]'
                            }`}
                          >
                            {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)] mb-1">
                            <span className="font-semibold text-[var(--primary-action)]">{hw.subject}</span>
                            <span>&bull;</span>
                            <span>{hw.displayDate || formatGeorgianDate(hw.date)}</span>
                            {hw.teacher && (
                              <>
                                <span>&bull;</span>
                                <span className="truncate max-w-[130px]">{hw.teacher}</span>
                              </>
                            )}
                          </div>
                          <h3
                            className={`text-xs sm:text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-snug ${
                              isDone ? 'line-through text-[var(--text-muted)]' : ''
                            }`}
                          >
                            {hw.title}
                          </h3>
                          {hw.notes && (
                            <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                              {hw.notes}
                            </p>
                          )}
                        </div>

                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0 self-center" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Overdue Homeworks moved to Home page (auto-expires after 10 days / 1-2 weeks) */}
            {overdueHomeworks.length > 0 && (
              <div className="pt-3 border-t border-dashed border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>ვადაგასული დავალებები ({overdueHomeworks.length})</span>
                  </span>
                  <span className="text-[10px] font-normal text-[var(--text-muted)]">
                    ავტომატურად იხსნება 1–2 კვირაში
                  </span>
                </div>
                <div className="space-y-1.5">
                  {overdueHomeworks.map((hw) => (
                    <div
                      key={hw.id}
                      onClick={() => onNavigateTab('homework')}
                      className="p-2.5 sm:p-3 rounded-xl card-third text-xs flex items-center justify-between gap-2.5 cursor-pointer hover:opacity-95"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-rose-600 dark:text-rose-400 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 shrink-0">
                            {hw.subject}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {hw.displayDate || formatGeorgianDate(hw.date)}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {hw.title}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => toggleHomeworkComplete(hw.id, e)}
                        className="px-3 py-1.5 rounded-xl btn-primary text-white text-[11px] font-bold shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
                        aria-label="დავალების დასრულება"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>დასრულება</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Upcoming Assessments (Real dynamic date filtering) */}
          <div className="card-surface rounded-2xl p-5 sm:p-6 space-y-4">
            {isNotebook && <PinDot />}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl card-third flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">მოახლოებული შემაჯამებლები</h2>
                  <p className="text-[11px] text-[var(--text-muted)]">აკადემიური კალენდრის შეფასებები</p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundEffects.click();
                  onNavigateTab('calendar');
                }}
                className="text-xs font-semibold text-[var(--primary-action)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>კალენდარი</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Assessment items or honest empty state */}
            <div className="space-y-2.5">
              {upcomingAssessments.length === 0 ? (
                <div className="p-5 rounded-xl card-third text-center space-y-1">
                  <p className="text-xs font-medium text-[var(--text-primary)]">
                    ამ ეტაპზე მოახლოებული შემაჯამებელი არ არის
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    ახალი შემაჯამებლები და დამოუკიდებლები გამოჩნდება მასწავლებლების მიერ დანიშვნისთანავე.
                  </p>
                </div>
              ) : (
                upcomingAssessments.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onNavigateTab('calendar')}
                    className="p-3.5 rounded-xl card-third hover:opacity-95 transition-opacity cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: getCategoryStyle(ev.category).dotColor }}
                        />
                        <span className="font-semibold text-[var(--text-primary)]">{ev.category}</span>
                        <span className="text-[var(--text-muted)]">&bull;</span>
                        <span className="font-mono text-[var(--text-secondary)]">
                          {formatGeorgianDate(ev.date, true)}
                        </span>
                        {ev.teacher && (
                          <>
                            <span className="text-[var(--text-muted)]">&bull;</span>
                            <span className="text-[var(--text-muted)] truncate">{ev.teacher}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-[var(--text-primary)] truncate">{ev.title}</h3>
                    </div>

                    <span className="text-xs font-semibold text-[var(--primary-action)] shrink-0">
                      ნახვა
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN (5 COLS): TODAY'S LESSONS & FEATURED STUDY MODULE
            ===================================================================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 3: Today's Timetable with REAL active lesson highlight */}
          <div className="card-surface nb-stationary rounded-2xl p-5 sm:p-6 space-y-4">
            {isNotebook && <TapeStrip tilt="left" />}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl card-third flex items-center justify-center text-[var(--primary-action)]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    {getGenitiveWeekday(timetableDayId)} განრიგი
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {tbilisiTime.weekday >= 1 && tbilisiTime.weekday <= 5
                      ? 'მიმდინარე დღის გაკვეთილები'
                      : 'ორშაბათის საგაკვეთილო ცხრილი'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundEffects.click();
                  onNavigateTab('homework');
                }}
                className="text-xs font-semibold text-[var(--primary-action)] hover:underline cursor-pointer"
              >
                ცხრილი
              </button>
            </div>

            {/* Lessons List */}
            <div className="space-y-1.5">
              {todaySchedule.slots.map((slot) => {
                const isCurrentLesson = activePeriod === slot.period;
                const periodTime = LESSON_PERIOD_TIMES.find((p) => p.period === slot.period);

                return (
                  <div
                    key={slot.period}
                    className={`px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                      isCurrentLesson
                        ? 'btn-primary font-bold shadow-xs'
                        : 'card-third text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[11px] opacity-75 shrink-0">
                        {slot.period}.
                      </span>
                      <span className="truncate">{slot.subject}</span>
                      {isCurrentLesson && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-white text-[var(--primary-action)] font-black uppercase">
                          მიმდინარე
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] opacity-75 shrink-0 ml-2">
                      {periodTime?.timeRange || ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Featured Study Resource (Links to Literature Module) */}
          <div className="card-surface rounded-2xl p-5 sm:p-6 space-y-3">
            {isNotebook && <PinDot />}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-[var(--primary-action)]">
                სასწავლო მოდული &bull; არქივი
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full card-third text-[var(--text-secondary)]">
                ქართული ლიტერატურა
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                ქართული რომანტიზმი &bull; 7 თემა
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                დაკარგული ედემი, გოგჩა, ვაჰ დრონი, ვისაც გსურთ, საღამო გამოსალმებისა, თამარ მეფე, იარაღი. ლექსიკონი, ტესტები და პოდკასტი.
              </p>
            </div>

            <button
              onClick={() => {
                soundEffects.click();
                onNavigateTab('materials');
              }}
              className="w-full py-2.5 rounded-xl btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[44px]"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>მოდულის გახსნა</span>
            </button>
          </div>

          {/* Mobile-only Active Board moved to the bottom so Homework & Assessments appear immediately at the top */}
          {isNotebook && (
            <div className="lg:hidden pt-1">
              <div className="nb-active-board">
                <TapeStrip tilt="left" />
                <h2 className="nb-active-board-title">11/5 კლასის აქტიური დაფა</h2>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.click();
                      onNavigateTab('homework');
                    }}
                    className="nb-stat-tile"
                  >
                    <span className="nb-stat-icon" aria-hidden="true">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="nb-stat-label">მიმდინარე დავალებები</span>
                      <strong className="nb-stat-value">{activeHomeworks.length}</strong>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.click();
                      onNavigateTab('calendar');
                    }}
                    className="nb-stat-tile"
                  >
                    <span className="nb-stat-icon" aria-hidden="true">
                      <CalendarIcon className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="nb-stat-label">მოახლოებული შემაჯამებლები</span>
                      <strong className="nb-stat-value">{upcomingAssessments.length}</strong>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.click();
                      onNavigateTab('materials');
                    }}
                    className="nb-stat-tile"
                  >
                    <span className="nb-stat-icon" aria-hidden="true">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="nb-stat-label">სასწავლო მოდულები</span>
                      <strong className="nb-stat-value">{platform.archivePacks.length}</strong>
                    </span>
                  </button>
                </div>

                <SketchPurpleSmiley />
              </div>
            </div>
          )}
        </div>
      </div>
      </GuestBlurGate>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseVideo}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl card-surface rounded-2xl overflow-hidden z-10 shadow-2xl"
            >
              <div className="p-4 flex items-center justify-between border-b border-[var(--border-subtle)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  რატომ უნდა ამირჩიოთ &bull; ვიდეო მიმართვა
                </h3>
                <button
                  onClick={handleCloseVideo}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  aria-label="დახურვა"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-video bg-black relative flex items-center justify-center">
                {videoError ? (
                  <div className="p-6 text-center space-y-3 text-white max-w-md">
                    <p className="text-xs sm:text-sm font-semibold">
                      ვიდეოს ჩატვირთვა ვერ მოხერხდა ამ მოწყობილობაზე
                    </p>
                    <p className="text-[11px] text-white/70">
                      შეგიძლიათ გახსნათ ვიდეო პირდაპირი ბმულით:
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <a
                        href="/videos/why-vote.mp4"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl btn-primary text-xs font-bold inline-flex items-center gap-1.5 min-h-[44px]"
                      >
                        პირდაპირი ვიდეო ბმული
                      </a>
                      <button
                        onClick={() => {
                          setVideoError(false);
                          if (videoRef.current) {
                            videoRef.current.load();
                            videoRef.current.play().catch(() => {});
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold min-h-[44px]"
                      >
                        ხელახლა ცდა
                      </button>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    controls
                    playsInline
                    preload="metadata"
                    onError={() => setVideoError(true)}
                    className="w-full h-full"
                    src="/videos/why-vote.mp4"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
