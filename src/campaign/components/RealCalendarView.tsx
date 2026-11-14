import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  SlidersHorizontal,
  X,
  Plus,
  Trash2,
  ChevronDown,
  Sparkles,
  List,
  Grid3X3,
  CalendarDays,
  Calendar as CalendarIcon,
  Tag
} from 'lucide-react';
import {
  MainCategory,
  CalendarCategory,
  CalendarEvent,
  CALENDAR_FILTERS,
  INITIAL_CALENDAR_EVENTS
} from '../data/campaignData';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';
import { ResourceSection } from './ResourceSection';
import { CommentsThread } from './CommentsThread';
import { getTbilisiNow, formatGeorgianDate } from '../utils/tbilisiDate';
import {
  getCategoryStyle,
  getCategoryInlineStyle,
  CATEGORY_PALETTE
} from '../utils/calendarCategories';

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

const WEEKDAYS_SHORT = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'];

const PRIMARY_FILTER_TABS = [
  'ყველა',
  'შემაჯამებელი',
  'დამოუკიდებელი',
  'გამოკითხვა',
  'შეჯიბრებები',
  'ოლიმპიადები',
  'აქტივობები',
];

interface RealCalendarViewProps {
  onOpenQuiz?: () => void;
}

export const RealCalendarView: React.FC<RealCalendarViewProps> = ({ onOpenQuiz }) => {
  const { canModerate, platform, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } =
    usePlatform();

  // Mobile layout switch: 'agenda' | 'week' | 'month'
  const [mobileView, setMobileView] = useState<'agenda' | 'week' | 'month'>('month');

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('ყველა');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Real Tbilisi Date & Time
  const tbilisiNow = useMemo(() => getTbilisiNow(), []);
  const [currentDate, setCurrentDate] = useState<Date>(
    () => new Date(tbilisiNow.year, tbilisiNow.month - 1, 1)
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => tbilisiNow.dateString);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [isAiExpanded, setIsAiExpanded] = useState(false);

  // Reactive theme detection for high-contrast category rendering
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Admin Modal
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(() => tbilisiNow.dateString);
  const [formEndDate, setFormEndDate] = useState('');
  const [formTime, setFormTime] = useState('10:00 - 10:45');
  const [formMainCategory, setFormMainCategory] = useState<MainCategory>('სკოლა');
  const [formCategory, setFormCategory] = useState<CalendarCategory>('შემაჯამებელი');
  const [formTeacher, setFormTeacher] = useState('');
  const [formLocation, setFormLocation] = useState('კომაროვი, 11/5 აუდიტორია');
  const [formDescription, setFormDescription] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const allEvents = useMemo(() => {
    return platform.calendarEvents && platform.calendarEvents.length > 0
      ? platform.calendarEvents
      : INITIAL_CALENDAR_EVENTS;
  }, [platform.calendarEvents]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'ყველა') return allEvents;
    return allEvents.filter(
      (e) => e.category === selectedCategory || e.mainCategory === selectedCategory
    );
  }, [allEvents, selectedCategory]);

  const isEventOnDate = (evt: CalendarEvent, dateStr: string) => {
    if (evt.endDate && evt.endDate >= evt.date) {
      return dateStr >= evt.date && dateStr <= evt.endDate;
    }
    return evt.date === dateStr;
  };

  // Month Grid Calculation (split into full 7-day week rows)
  const calendarGrid = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const prevMonthDays = new Date(year, month, 0).getDate();

    const grid: { dayNumber: number; isCurrentMonth: boolean; dateString: string }[] = [];

    // Pad previous month
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      grid.push({ dayNumber: d, isCurrentMonth: false, dateString: dateStr });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      grid.push({ dayNumber: d, isCurrentMonth: true, dateString: dateStr });
    }

    // Pad next month to complete full weeks (35 or 42 cells)
    const targetLength = grid.length > 35 ? 42 : 35;
    const remaining = targetLength - grid.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      grid.push({ dayNumber: d, isCurrentMonth: false, dateString: dateStr });
    }

    return grid;
  }, [year, month]);

  // Group cells into 7-day week rows
  const calendarWeeks = useMemo(() => {
    const weeks: (typeof calendarGrid)[] = [];
    for (let i = 0; i < calendarGrid.length; i += 7) {
      weeks.push(calendarGrid.slice(i, i + 7));
    }
    return weeks;
  }, [calendarGrid]);

  // Selected Day Events
  const selectedDateEvents = useMemo(() => {
    return filteredEvents.filter((e) => isEventOnDate(e, selectedDate));
  }, [filteredEvents, selectedDate]);

  // Agenda items: all future / active events sorted by date
  const agendaEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredEvents]);

  // Week view dates (surrounding selected date)
  const weekDays = useMemo(() => {
    const sel = new Date(selectedDate + 'T12:00:00');
    if (isNaN(sel.getTime())) return [];
    const dayOfWeek = sel.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(sel);
    monday.setDate(sel.getDate() + mondayOffset);

    const days: { dateStr: string; dayNum: number; shortDay: string; hasEvents: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        dateStr: str,
        dayNum: d.getDate(),
        shortDay: WEEKDAYS_SHORT[i],
        hasEvents: filteredEvents.some((e) => isEventOnDate(e, str)),
      });
    }
    return days;
  }, [selectedDate, filteredEvents]);

  const handlePrevMonth = () => {
    soundEffects.click();
    setCurrentDate((prev) => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      return m === 0 ? new Date(y - 1, 11, 1) : new Date(y, m - 1, 1);
    });
  };

  const handleNextMonth = () => {
    soundEffects.click();
    setCurrentDate((prev) => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      return m === 11 ? new Date(y + 1, 0, 1) : new Date(y, m + 1, 1);
    });
  };

  const handlePrev = () => {
    soundEffects.click();
    if (mobileView === 'week') {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const prevDate = new Date(y, m - 1, d);
      prevDate.setDate(prevDate.getDate() - 7);
      const newStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
      setSelectedDate(newStr);
      setCurrentDate(new Date(prevDate.getFullYear(), prevDate.getMonth(), 1));
    } else {
      handlePrevMonth();
    }
  };

  const handleNext = () => {
    soundEffects.click();
    if (mobileView === 'week') {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const nextDate = new Date(y, m - 1, d);
      nextDate.setDate(nextDate.getDate() + 7);
      const newStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
      setSelectedDate(newStr);
      setCurrentDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    } else {
      handleNextMonth();
    }
  };

  const handleToday = () => {
    soundEffects.click();
    const now = getTbilisiNow();
    setCurrentDate(new Date(now.year, now.month - 1, 1));
    setSelectedDate(now.dateString);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 400) {
      setActiveEvent(null);
    }
  };

  const openCreateModal = () => {
    setEditingEventId(null);
    setFormTitle('');
    setFormDate(selectedDate || tbilisiNow.dateString);
    setFormEndDate('');
    setFormTime('10:00 - 10:45');
    setFormMainCategory('სკოლა');
    setFormCategory('შემაჯამებელი');
    setFormTeacher('');
    setFormLocation('კომაროვი, 11/5 აუდიტორია');
    setFormDescription('');
    setShowEventForm(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;
    const payload: any = {
      title: formTitle.trim(),
      date: formDate,
      endDate: formEndDate.trim() || undefined,
      time: formTime.trim() || undefined,
      mainCategory: formMainCategory,
      category: formCategory,
      teacher: formTeacher.trim() || undefined,
      location: formLocation.trim() || undefined,
      description: formDescription.trim(),
      aiAnalysis: {
        difficultyScore: '7/10',
        estimatedHours: '2 საათი',
        strategy: formDescription.trim(),
        keyPoints: [],
        recommendation: 'გადახედეთ მასალებს და დასვით კითხვები კომენტარებში.',
      },
    };

    if (editingEventId) {
      await updateCalendarEvent(editingEventId, payload);
      setActiveEvent(null);
    } else {
      await addCalendarEvent(payload);
    }
    setShowEventForm(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 min-w-0">
      {/* =========================================================================
          PAGE HEADER: TITLE & CONTROLS
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            კალენდარი
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            შემაჯამებლები, დავალებები, ტესტები, გამოკითხვები და მრავალდღიანი შეჯიბრებები.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Admin / Moderator Create Event Action */}
          {canModerate && (
            <button
              onClick={openCreateModal}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-amber-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>დამატება</span>
            </button>
          )}

          {/* Month & Week Navigation Controls */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl glass-pill">
            <button
              onClick={handlePrev}
              className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-primary)] transition-colors cursor-pointer"
              aria-label={mobileView === 'week' ? 'წინა კვირა' : 'წინა თვე'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-[var(--text-primary)] min-w-[110px] text-center font-mono">
              {GEORGIAN_MONTHS[month]} {year}
            </span>
            <button
              onClick={handleNext}
              className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-primary)] transition-colors cursor-pointer"
              aria-label={mobileView === 'week' ? 'შემდეგი კვირა' : 'შემდეგი თვე'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-2 min-h-[40px] text-xs font-semibold rounded-lg btn-primary transition-colors cursor-pointer flex items-center justify-center"
            >
              დღეს
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CATEGORY FILTER CHIPS & COLOR LEGEND
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none min-w-0">
          {PRIMARY_FILTER_TABS.map((cat) => {
            const isSelected = selectedCategory === cat;
            const catStyle = getCategoryStyle(cat);
            return (
              <button
                key={cat}
                onClick={() => {
                  soundEffects.click();
                  setSelectedCategory(cat);
                }}
                style={
                  isSelected && cat !== 'ყველა'
                    ? {
                        backgroundColor: isDark ? catStyle.bgDark : catStyle.bgLight,
                        borderColor: isDark ? catStyle.borderDark : catStyle.borderLight,
                        color: isDark ? catStyle.textDark : catStyle.textLight,
                      }
                    : undefined
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? cat === 'ყველა'
                      ? 'btn-primary border-transparent shadow-xs'
                      : 'border shadow-2xs font-bold'
                    : 'card-third border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat !== 'ყველა' && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: catStyle.dotColor }}
                  />
                )}
                <span>{cat}</span>
              </button>
            );
          })}
          <button
            onClick={() => {
              soundEffects.click();
              setIsFilterSheetOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 shrink-0 cursor-pointer card-third border border-transparent"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>სხვა ფილტრები</span>
          </button>
        </div>

        {/* Mobile View Toggle: Agenda | Week | Month */}
        <div className="sm:hidden flex items-center p-1 rounded-xl card-third border border-[var(--border-subtle)] self-start">
          <button
            onClick={() => {
              soundEffects.click();
              setMobileView('agenda');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              mobileView === 'agenda'
                ? 'card-surface text-[var(--text-primary)] font-bold shadow-xs'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>სია</span>
          </button>
          <button
            onClick={() => {
              soundEffects.click();
              setMobileView('week');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              mobileView === 'week'
                ? 'card-surface text-[var(--text-primary)] font-bold shadow-xs'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>კვირა</span>
          </button>
          <button
            onClick={() => {
              soundEffects.click();
              setMobileView('month');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              mobileView === 'month'
                ? 'card-surface text-[var(--text-primary)] font-bold shadow-xs'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>თვე</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: MOBILE AGENDA VIEW
          ========================================================================= */}
      {mobileView === 'agenda' && (
        <div className="sm:hidden space-y-3 min-w-0">
          <div className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
            <span>დაგეგმილი მოვლენები ({agendaEvents.length})</span>
            <span className="text-[var(--primary-action)] font-bold">{selectedCategory}</span>
          </div>

          <div className="space-y-2.5">
            {agendaEvents.map((evt) => {
              const catStyle = getCategoryStyle(evt.category);
              const isMulti = evt.endDate && evt.endDate > evt.date;
              return (
                <div
                  key={evt.id}
                  onClick={() => {
                    soundEffects.click();
                    setActiveEvent(evt);
                  }}
                  className="card-surface p-4 space-y-2 cursor-pointer active:scale-[0.99] transition-transform rounded-2xl border border-[var(--border-subtle)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: catStyle.dotColor }}
                      />
                      <span
                        style={getCategoryInlineStyle(evt.category, isDark)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                      >
                        {evt.category}
                      </span>
                      {isMulti && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--primary-action-light)] text-[var(--primary-action)]">
                          მრავალდღიანი
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      {isMulti ? `${evt.date} — ${evt.endDate}` : evt.date}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                    {evt.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                    {evt.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--primary-action)]" />
                        {evt.time}
                      </span>
                    )}
                    {evt.teacher && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[var(--primary-action)]" />
                        {evt.teacher}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: MOBILE WEEK VIEW
          ========================================================================= */}
      {mobileView === 'week' && (
        <div className="sm:hidden space-y-4 min-w-0">
          <div className="grid grid-cols-7 gap-1 card-surface p-2 shadow-sm rounded-2xl min-w-0 border border-[var(--border-subtle)]">
            {weekDays.map((d) => {
              const isSelected = d.dateStr === selectedDate;
              return (
                <button
                  key={d.dateStr}
                  onClick={() => {
                    soundEffects.click();
                    setSelectedDate(d.dateStr);
                  }}
                  className={`py-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'btn-primary font-bold shadow-xs'
                      : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-[10px] font-mono">{d.shortDay}</span>
                  <span className="text-xs font-semibold mt-0.5">{d.dayNum}</span>
                  {d.hasEvents && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        isSelected ? 'bg-white' : 'bg-[var(--primary-action)]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[var(--text-muted)]">
              {selectedDate}: {selectedDateEvents.length} მოვლენა
            </div>
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => {
                    soundEffects.click();
                    setActiveEvent(evt);
                  }}
                  className="card-surface p-4 space-y-1.5 cursor-pointer rounded-2xl border border-[var(--border-subtle)]"
                >
                  <div className="flex items-center justify-between">
                    <span
                      style={getCategoryInlineStyle(evt.category, isDark)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                    >
                      {evt.category}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      {evt.time || evt.date}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                    {evt.description}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-muted)] py-3 text-center">
                ამ დღეს მოვლენა არ არის.
              </p>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 3: MONTH GRID WITH CONTINUOUS MULTI-DAY BARS
          ========================================================================= */}
      <div className={`space-y-5 min-w-0 ${mobileView === 'month' ? 'block' : 'hidden sm:block'}`}>
        <div className="card-surface nb-stationary p-2 sm:p-5 shadow-sm rounded-3xl border border-[var(--border-subtle)] overflow-hidden min-w-0">
          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 mb-2 text-center min-w-0 border-b border-[var(--border-subtle)] pb-2">
            {WEEKDAYS_SHORT.map((day) => (
              <div
                key={day}
                className="text-[11px] sm:text-xs font-semibold text-[var(--text-muted)] py-0.5"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Month Weeks Container */}
          <div className="space-y-1.5 sm:space-y-2 min-w-0">
            {calendarWeeks.map((week, weekIdx) => {
              const weekStartStr = week[0].dateString;
              const weekEndStr = week[6].dateString;

              // 1. Identify multi-day events that span into this week row
              const intersectingMultiDay = filteredEvents.filter((e) => {
                const isMulti = e.endDate && e.endDate > e.date;
                if (!isMulti) return false;
                return e.date <= weekEndStr && (e.endDate as string) >= weekStartStr;
              });

              // Sort by duration descending, then start date for clean packing
              intersectingMultiDay.sort((a, b) => {
                const durA = (a.endDate || a.date).localeCompare(a.date);
                const durB = (b.endDate || b.date).localeCompare(b.date);
                return durB - durA || a.date.localeCompare(b.date);
              });

              // Assign lanes to multi-day segments
              const lanes: boolean[][] = [];
              const multiDaySegments: {
                event: CalendarEvent;
                startCol: number;
                endCol: number;
                isTrueStart: boolean;
                isTrueEnd: boolean;
                lane: number;
              }[] = [];

              for (const evt of intersectingMultiDay) {
                const segStart = evt.date < weekStartStr ? weekStartStr : evt.date;
                const segEnd =
                  (evt.endDate as string) > weekEndStr ? weekEndStr : (evt.endDate as string);

                const startCol = week.findIndex((c) => c.dateString === segStart);
                const endCol = week.findIndex((c) => c.dateString === segEnd);

                if (startCol === -1 || endCol === -1 || endCol < startCol) continue;

                let targetLane = 0;
                while (true) {
                  if (!lanes[targetLane]) {
                    lanes[targetLane] = [false, false, false, false, false, false, false];
                  }
                  let fits = true;
                  for (let c = startCol; c <= endCol; c++) {
                    if (lanes[targetLane][c]) {
                      fits = false;
                      break;
                    }
                  }
                  if (fits) {
                    for (let c = startCol; c <= endCol; c++) {
                      lanes[targetLane][c] = true;
                    }
                    break;
                  }
                  targetLane++;
                }

                multiDaySegments.push({
                  event: evt,
                  startCol,
                  endCol,
                  isTrueStart: evt.date === segStart,
                  isTrueEnd: evt.endDate === segEnd,
                  lane: targetLane,
                });
              }

              const laneCount = lanes.length;

              return (
                <div
                  key={`week-${weekIdx}`}
                  className="rounded-2xl border border-[var(--border-subtle)] card-third/40 overflow-hidden relative"
                >
                  {/* Top: Day cells grid (dates, active selection, cell bounds) */}
                  <div className="grid grid-cols-7 divide-x divide-[var(--border-subtle)]">
                    {week.map((cell, colIdx) => {
                      const isSelectedDay = cell.dateString === selectedDate;
                      const isToday = cell.dateString === tbilisiNow.dateString;
                      const dayAllEvents = filteredEvents.filter((e) =>
                        isEventOnDate(e, cell.dateString)
                      );

                      return (
                        <div
                          key={cell.dateString}
                          onClick={() => {
                            soundEffects.click();
                            setSelectedDate(cell.dateString);
                          }}
                          className={`p-1 sm:p-2 min-h-[38px] sm:min-h-[44px] flex items-center justify-between cursor-pointer transition-colors ${
                            cell.isCurrentMonth ? '' : 'opacity-35'
                          } ${
                            isSelectedDay
                              ? 'bg-[var(--primary-action-light)]'
                              : 'hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {isToday ? (
                              <span className="w-5 h-5 rounded-full btn-primary flex items-center justify-center text-[10px] font-bold shadow-xs">
                                {cell.dayNumber}
                              </span>
                            ) : (
                              <span
                                className={`text-[11px] sm:text-xs font-semibold ${
                                  isSelectedDay
                                    ? 'text-[var(--primary-action)] font-bold'
                                    : 'text-[var(--text-primary)]'
                                }`}
                              >
                                {cell.dayNumber}
                              </span>
                            )}
                          </div>

                          {/* Mobile: Compact Colored Dots */}
                          <div className="sm:hidden flex items-center gap-0.5">
                            {dayAllEvents.slice(0, 2).map((e) => (
                              <span
                                key={e.id}
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: getCategoryStyle(e.category).dotColor,
                                }}
                              />
                            ))}
                            {dayAllEvents.length > 2 && (
                              <span className="text-[9px] text-[var(--text-muted)] font-mono">
                                +
                              </span>
                            )}
                          </div>

                          {/* Desktop: Event count badge */}
                          {dayAllEvents.length > 0 && (
                            <span className="hidden sm:inline text-[10px] font-mono text-[var(--text-muted)]">
                              {dayAllEvents.length}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Middle: Continuous Multi-Day Event Bars Layer (Desktop Only) */}
                  {laneCount > 0 && (
                    <div className="hidden sm:grid grid-cols-7 gap-y-1 px-1 py-1 border-t border-[var(--border-subtle)]/60">
                      {multiDaySegments.map((seg) => {
                        const catStyle = getCategoryStyle(seg.event.category);
                        return (
                          <div
                            key={`seg-${seg.event.id}-${weekIdx}`}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              soundEffects.click();
                              setActiveEvent(seg.event);
                            }}
                            style={{
                              gridColumnStart: seg.startCol + 1,
                              gridColumnEnd: seg.endCol + 2,
                              gridRowStart: seg.lane + 1,
                              ...getCategoryInlineStyle(seg.event.category, isDark),
                            }}
                            className={`h-6 px-2 flex items-center justify-between text-[11px] font-semibold border shadow-2xs cursor-pointer select-none transition-all hover:brightness-105 active:scale-[0.99] ${
                              seg.isTrueStart
                                ? 'rounded-l-lg ml-0.5'
                                : 'rounded-l-none border-l-0 pl-1.5'
                            } ${
                              seg.isTrueEnd
                                ? 'rounded-r-lg mr-0.5'
                                : 'rounded-r-none border-r-0 pr-1.5'
                            }`}
                            title={`${seg.event.title} (${seg.event.date} — ${seg.event.endDate})`}
                          >
                            <div className="flex items-center gap-1.5 truncate min-w-0">
                              {!seg.isTrueStart && (
                                <span className="text-[9px] opacity-75 shrink-0">◀</span>
                              )}
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: catStyle.dotColor }}
                              />
                              <span className="truncate">{seg.event.title}</span>
                            </div>
                            {!seg.isTrueEnd && (
                              <span className="text-[9px] opacity-75 shrink-0 ml-1">▶</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bottom: Single-day events rows (Desktop Only) */}
                  <div className="hidden sm:grid grid-cols-7 divide-x divide-[var(--border-subtle)] min-h-[50px] border-t border-[var(--border-subtle)]/40">
                    {week.map((cell, colIdx) => {
                      const singleDayEvents = filteredEvents.filter(
                        (e) => (!e.endDate || e.endDate <= e.date) && e.date === cell.dateString
                      );

                      // Multi-day events covering this specific day column
                      const multiDayForCell = multiDaySegments.filter(
                        (s) => colIdx >= s.startCol && colIdx <= s.endCol
                      );

                      const isSelectedDay = cell.dateString === selectedDate;
                      const maxSingleToShow = laneCount > 0 ? 1 : 2;
                      const overflowCount = Math.max(0, singleDayEvents.length - maxSingleToShow);

                      return (
                        <div
                          key={`single-${cell.dateString}`}
                          onClick={() => {
                            soundEffects.click();
                            setSelectedDate(cell.dateString);
                          }}
                          className={`p-1 space-y-1 cursor-pointer transition-colors ${
                            isSelectedDay ? 'bg-[var(--primary-action-light)]/40' : ''
                          }`}
                        >
                          {singleDayEvents.slice(0, maxSingleToShow).map((e) => {
                            const catStyle = getCategoryStyle(e.category);
                            return (
                              <div
                                key={e.id}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  soundEffects.click();
                                  setActiveEvent(e);
                                }}
                                style={getCategoryInlineStyle(e.category, isDark)}
                                className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[10.5px] font-medium truncate border shadow-2xs hover:brightness-105 transition-all"
                                title={`${e.title} (${e.category})`}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: catStyle.dotColor }}
                                />
                                <span className="truncate">{e.title}</span>
                              </div>
                            );
                          })}

                          {overflowCount > 0 && (
                            <div
                              onClick={(ev) => {
                                ev.stopPropagation();
                                soundEffects.click();
                                setSelectedDate(cell.dateString);
                              }}
                              className="text-[10px] font-semibold text-[var(--primary-action)] hover:underline px-1 py-0.5 cursor-pointer"
                            >
                              +{overflowCount} კიდევ
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda View (Persistent below month grid) */}
        <div className="card-surface p-4 sm:p-6 space-y-4 shadow-sm rounded-3xl border border-[var(--border-subtle)] min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[var(--primary-action)]" />
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                თარიღის დღის წესრიგი: {selectedDate}
              </h2>
            </div>
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              {selectedDateEvents.length} მოვლენა
            </span>
          </div>

          {selectedDateEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
              {selectedDateEvents.map((evt) => {
                const catStyle = getCategoryStyle(evt.category);
                const isMulti = evt.endDate && evt.endDate > evt.date;

                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      soundEffects.click();
                      setActiveEvent(evt);
                    }}
                    className="p-4 rounded-2xl card-third border border-[var(--border-subtle)] hover:border-[var(--primary-action)]/30 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: catStyle.dotColor }}
                          />
                          <span
                            style={getCategoryInlineStyle(evt.category, isDark)}
                            className="text-[10.5px] font-bold px-2 py-0.5 rounded-md border"
                          >
                            {evt.category}
                          </span>
                          {isMulti && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--primary-action-light)] text-[var(--primary-action)]">
                              {evt.date} — {evt.endDate} (მიმდინარე)
                            </span>
                          )}
                        </div>

                        {evt.time && (
                          <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[var(--primary-action)]" />
                            {evt.time}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                        {evt.title}
                      </h3>

                      {evt.teacher && (
                        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{evt.teacher}</span>
                        </div>
                      )}

                      {evt.description && (
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]/60 text-xs font-semibold text-[var(--primary-action)]">
                      <span>დეტალები &rarr;</span>
                      {evt.aiAnalysis?.difficultyScore && (
                        <span className="text-[10px] text-[var(--text-muted)] font-normal">
                          სირთულე: {evt.aiAnalysis.difficultyScore}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl card-third text-center space-y-1 border border-dashed border-[var(--border-subtle)]">
              <p className="text-xs font-medium text-[var(--text-primary)]">
                ამ დღეს დაგეგმილი აქტივობა ან შემაჯამებელი არ არის
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                აირჩიეთ სხვა დღე კალენდარში ან დაამატეთ ახალი მოვლენა.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          DEEP EVENT DETAIL BOTTOM SHEET (Accessible & Fluid Gesture)
          ========================================================================= */}
      <AnimatePresence>
        {activeEvent && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveEvent(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 38 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.5 }}
              onDragEnd={handleDragEnd}
              className="relative z-10 glass-sheet rounded-t-3xl max-w-2xl mx-auto w-full p-5 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 pb-[max(2rem,env(safe-area-inset-bottom))]"
            >
              {/* Drag Handle Capsule */}
              <div className="w-12 h-1.5 bg-slate-400/40 rounded-full mx-auto" />

              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      style={getCategoryInlineStyle(activeEvent.category, isDark)}
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs flex items-center gap-1.5"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: getCategoryStyle(activeEvent.category).dotColor }}
                      />
                      <span>{activeEvent.category}</span>
                    </span>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      {activeEvent.endDate && activeEvent.endDate > activeEvent.date
                        ? `${activeEvent.date} — ${activeEvent.endDate}`
                        : activeEvent.date}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                    {activeEvent.title}
                  </h2>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {canModerate && (
                    <button
                      onClick={() => deleteCalendarEvent(activeEvent.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      title="წაშლა"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setActiveEvent(null)}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    aria-label="დახურვა"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Authoritative Information: Metadata grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--text-secondary)] card-third p-3.5 rounded-2xl border border-[var(--border-subtle)]">
                {activeEvent.time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[var(--primary-action)]" />
                    <span>დრო: {activeEvent.time}</span>
                  </div>
                )}
                {activeEvent.teacher && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[var(--primary-action)]" />
                    <span>მასწავლებელი: {activeEvent.teacher}</span>
                  </div>
                )}
                {activeEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[var(--primary-action)]" />
                    <span>ადგილი: {activeEvent.location}</span>
                  </div>
                )}
              </div>

              {/* Requirements & Description */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  მოთხოვნები & პროგრამა
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed card-surface p-4 rounded-2xl border border-[var(--border-subtle)]">
                  {activeEvent.description}
                </p>
              </div>

              {/* AI Study Assistance */}
              {activeEvent.aiAnalysis && (
                <div className="rounded-2xl border border-[var(--primary-action)]/20 overflow-hidden bg-[var(--primary-action-light)]/30">
                  <button
                    onClick={() => setIsAiExpanded((prev) => !prev)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-[var(--primary-action)] cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[var(--primary-action)]" />
                      <span>AI სასწავლო რჩევა (დამხმარე)</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isAiExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isAiExpanded && (
                    <div className="px-4 pb-4 pt-1 space-y-2 text-xs text-[var(--text-secondary)] border-t border-[var(--primary-action)]/20">
                      <div className="flex items-center gap-4 text-[11px]">
                        <span>სავარაუდო სირთულე: {activeEvent.aiAnalysis.difficultyScore}</span>
                        <span>საჭირო დრო: {activeEvent.aiAnalysis.estimatedHours}</span>
                      </div>
                      {activeEvent.aiAnalysis.recommendation && (
                        <p className="text-[11px] leading-relaxed">
                          {activeEvent.aiAnalysis.recommendation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Resources & Study Notes Section */}
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <ResourceSection
                  targetType="event"
                  targetId={activeEvent.id}
                  targetTitle={activeEvent.title}
                />
              </div>

              {/* Comments Thread Section */}
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <CommentsThread targetType="event" targetId={activeEvent.id} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          FILTER BOTTOM SHEET
          ========================================================================= */}
      <AnimatePresence>
        {isFilterSheetOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterSheetOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 38 }}
              className="relative z-10 glass-sheet rounded-t-3xl p-5 space-y-4 max-w-md mx-auto w-full pb-[max(2rem,env(safe-area-inset-bottom))]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    კალენდრის ყველა კატეგორია
                  </span>
                  {selectedCategory !== 'ყველა' && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--primary-action)] text-white text-[10px] font-bold">
                      აქტიურია
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  aria-label="დახურვა"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-0.5">
                {CALENDAR_FILTERS.map((f) => {
                  const isSelected = selectedCategory === f.id;
                  const catStyle = getCategoryStyle(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        soundEffects.click();
                        setSelectedCategory(f.id);
                        setIsFilterSheetOpen(false);
                      }}
                      style={
                        isSelected
                          ? {
                              backgroundColor: isDark ? catStyle.bgDark : catStyle.bgLight,
                              borderColor: isDark ? catStyle.borderDark : catStyle.borderLight,
                              color: isDark ? catStyle.textDark : catStyle.textLight,
                            }
                          : undefined
                      }
                      className={`min-h-[44px] p-3 rounded-xl text-xs font-semibold text-left transition-colors flex items-center gap-2.5 border ${
                        isSelected
                          ? 'border shadow-2xs font-bold'
                          : 'card-third border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: catStyle.dotColor }}
                      />
                      <span className="leading-snug">{f.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
                <button
                  onClick={() => {
                    soundEffects.click();
                    setSelectedCategory('ყველა');
                    setIsFilterSheetOpen(false);
                  }}
                  className="min-h-[44px] px-3 py-2 text-xs font-bold text-rose-500 cursor-pointer flex items-center hover:underline"
                >
                  ყველას გასუფთავება
                </button>
                <button
                  onClick={() => {
                    soundEffects.click();
                    setIsFilterSheetOpen(false);
                  }}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl btn-primary text-xs font-bold cursor-pointer flex items-center shadow-xs"
                >
                  მზადაა
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          ADMIN ADD/EDIT EVENT MODAL
          ========================================================================= */}
      <AnimatePresence>
        {showEventForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEventForm(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-3xl card-surface border border-[var(--border-subtle)] p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {editingEventId ? 'მოვლენის რედაქტირება' : 'ახალი მოვლენის დამატება'}
                </h3>
                <button
                  onClick={() => setShowEventForm(false)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    სათაური
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="მაგ. მათემატიკის შემაჯამებელი"
                    className="w-full card-third border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      თარიღი
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full card-third border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      დასრულება (სურვილისამებრ)
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full card-third border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      კატეგორია
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as CalendarCategory)}
                      className="w-full card-third border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                    >
                      <option value="შემაჯამებელი">შემაჯამებელი</option>
                      <option value="დავალება">დავალება</option>
                      <option value="ტესტი">ტესტი</option>
                      <option value="დამოუკიდებელი">დამოუკიდებელი</option>
                      <option value="გამოკითხვა">გამოკითხვა</option>
                      <option value="სკოლა">სასკოლო პროცესი</option>
                      <option value="ჩემპიონატები">ჩემპიონატები</option>
                      <option value="ოლიმპიადები">ოლიმპიადები</option>
                      <option value="აქტივობები">აქტივობები</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      დრო
                    </label>
                    <input
                      type="text"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      placeholder="10:00 - 10:45"
                      className="w-full card-third border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    მასწავლებელი / ორგანიზატორი
                  </label>
                  <input
                    type="text"
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    placeholder="მაგ. ნანა ჯაფარიძე"
                    className="w-full card-third border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    მოთხოვნები & აღწერა
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="შინაარსი, საკითხები, მოსამზადებელი პარაგრაფები..."
                    className="w-full card-third border border-[var(--border-subtle)] rounded-xl p-3 text-xs text-[var(--text-primary)] resize-none focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl btn-primary text-xs font-bold cursor-pointer"
                  >
                    შენახვა
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
