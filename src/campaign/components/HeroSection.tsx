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
  MessageSquare
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';
import { ActiveTab } from './Navbar';
import { CalendarEvent } from '../data/campaignData';

interface HeroSectionProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenVideo?: () => void;
}

const GEORGIAN_DAYS = [
  'კვირა',
  'ორშაბათი',
  'სამშაბათი',
  'ოთხშაბათი',
  'ხუთშაბათი',
  'პარასკევი',
  'შაბათი',
];

const GEORGIAN_MONTHS = [
  'იანვარი',
  'თებერვალი',
  'მარტი',
  'აპრილი',
  'მაისი',
  'ივნისი',
  'ივლისი',
  'აგვისტო',
  'სექტემბერი',
  'ოქტომბერი',
  'ნოემბერი',
  'დეკემბერი',
];

// Curated class photos for a quiet, authentic memory strip
const CURATED_CLASS_PHOTOS = [
  { src: '/class-photos/image1.png', caption: '11/5 კლასი' },
  { src: '/class-photos/image2.png', caption: 'კომაროვი' },
  { src: '/class-photos/IMG_3480.png', caption: 'გაკვეთილებზე' },
  { src: '/class-photos/image3.png', caption: '2026' },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigateTab, onOpenVideo }) => {
  const { platform } = usePlatform();
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (isVideoOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [isVideoOpen]);

  // Today's real local date
  const now = useMemo(() => new Date(), []);
  const todayDayName = GEORGIAN_DAYS[now.getDay()];
  const todayFormatted = `${now.getDate()} ${GEORGIAN_MONTHS[now.getMonth()]}, ${todayDayName}`;

  // Find today's timetable or default to Monday/Tuesday
  const todaySchedule = useMemo(() => {
    const match = platform.timetable.find((d) => d.dayId === todayDayName);
    return match || platform.timetable[1] || platform.timetable[0]; // fallback to Tuesday (contains Math Nana)
  }, [platform.timetable, todayDayName]);

  // Upcoming Assessments (შემაჯამებელი / დამოუკიდებელი)
  const upcomingAssessments = useMemo(() => {
    const items = platform.calendarEvents.filter(
      (e) => e.category === 'შემაჯამებელი' || e.category === 'დამოუკიდებელი'
    );
    // Sort by date
    return items.slice(0, 3);
  }, [platform.calendarEvents]);

  // Active/Recent Homework items
  const activeHomeworks = useMemo(() => {
    return platform.homeworks.filter((h) => h.status !== 'rejected').slice(0, 3);
  }, [platform.homeworks]);

  // Next Alumni / Opportunity session
  const nextOpportunity = useMemo(() => {
    return platform.opportunities[0] || null;
  }, [platform.opportunities]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* =========================================================================
          TOP BAR: COMPACT GREETING & DATE
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/70 dark:border-white/10">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {todayFormatted}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            კომაროვის 11/5 კლასი
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              soundEffects.click();
              if (onOpenVideo) {
                onOpenVideo();
              } else {
                setIsVideoOpen(true);
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current text-indigo-600 dark:text-indigo-400" />
            <span>რატომ ავირჩიოთ</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN ASYMMETRIC GRID: ACADEMIC CORE (LEFT) vs SCHEDULE & COMMUNITY (RIGHT)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =======================================================================
            LEFT COLUMN (8 cols desktop): HOMEWORK, ASSESSMENTS, STUDY WORKSPACE
            ======================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section: Today's Homework */}
          <div className="card-surface p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    საშინაო დავალებები
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    მიმდინარე დავალებები კალენდრით
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('homework')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>სრულად</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeHomeworks.length > 0 ? (
              <div className="space-y-2.5">
                {activeHomeworks.map((hw) => (
                  <div
                    key={hw.id}
                    onClick={() => onNavigateTab('homework')}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 hover:border-indigo-400/30 transition-all cursor-pointer flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          {hw.subject}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {hw.displayDate}
                        </span>
                        {hw.teacher && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                            • {hw.teacher}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                        {hw.title}
                      </h3>
                      {hw.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {hw.notes}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                აქტიური დავალება არ არის.
              </p>
            )}
          </div>

          {/* Section: Upcoming Assessments */}
          <div className="card-surface p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    მოახლოებული შემაჯამებლები
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    აკადემიური კალენდრის შეფასებები
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>კალენდარი</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingAssessments.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => onNavigateTab('calendar')}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 hover:border-rose-400/30 transition-all cursor-pointer flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                        {evt.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {evt.date}
                      </span>
                      {evt.teacher && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          • {evt.teacher}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {evt.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {evt.description}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0 mt-1">
                    ნახვა
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Featured Study Module */}
          <div className="card-surface p-5 sm:p-6 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 dark:from-indigo-950/20 dark:via-[#131826] dark:to-[#131826] border-indigo-200/80 dark:border-indigo-500/20 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                  სასწავლო მოდული
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  ქართული ლიტერატურა
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                ქართული რომანტიზმი — სრული მოსამზადებელი
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                7 საკვანძო ლექსი, ლექსიკონი, ანალიზი, ტესტები, აუდიო პოდკასტი და ვიდეო მიმოხილვა.
              </p>
            </div>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateTab('materials')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <span>მასალების გახსნა</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* =======================================================================
            RIGHT COLUMN (4 cols desktop): TIMETABLE, ALUMNI & CLASS IDENTITY
            ======================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today's Timetable Card */}
          <div className="card-surface p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {todaySchedule.dayId}ს განრიგი
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    გაკვეთილების თანმიმდევრობა
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('homework')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                ცხრილი
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {todaySchedule.slots.map((slot) => (
                <div
                  key={`${todaySchedule.dayId}-${slot.period}`}
                  className="py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="font-mono text-slate-400 text-[11px]">{slot.period}.</span>
                      <span className="truncate">{slot.subject}</span>
                    </div>
                    {slot.teacher && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 pl-4">
                        {slot.teacher}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded shrink-0">
                    {slot.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Alumni Session Card */}
          {nextOpportunity && (
            <div className="card-surface p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  ალუმნების შეხვედრა
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {nextOpportunity.date}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {nextOpportunity.speaker}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {nextOpportunity.university}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                  {nextOpportunity.description}
                </p>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => onNavigateTab('opportunities')}
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-900 dark:text-slate-100 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>დეტალები & კითხვები</span>
                </button>
              </div>
            </div>
          )}

          {/* Curated Class Photo Strip (Tasteful & Compact) */}
          <div className="card-surface p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                11/5 კლასი • 2026
              </span>
              <span>კომაროვი</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {CURATED_CLASS_PHOTOS.map((photo, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10"
                >
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal ("რატომ ავირჩიოთ") */}
      <AnimatePresence>
        {isVideoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVideoOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-4xl bg-slate-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/80 border-b border-white/10">
                <span className="text-xs font-bold text-white">რატომ ავირჩიოთ — 11/5 კლასი</span>
                <button
                  onClick={() => setIsVideoOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                  aria-label="დახურვა"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-black aspect-video w-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  src="/videos/why-vote.mp4?v=2"
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                >
                  თქვენი ბრაუზერი ვერ ხსნის ვიდეოს.
                </video>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
