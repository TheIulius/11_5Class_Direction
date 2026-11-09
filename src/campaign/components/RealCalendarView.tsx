import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  SlidersHorizontal,
  X,
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  Sparkles,
  BookOpen,
  CheckCircle2,
  List,
  Grid3X3,
  CalendarDays
} from 'lucide-react';
import {
  MainCategory,
  CalendarCategory,
  CalendarEvent,
  MAIN_CATEGORIES,
  CALENDAR_FILTERS,
  INITIAL_CALENDAR_EVENTS
} from '../data/campaignData';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';
import { ResourceSection } from './ResourceSection';
import { CommentsThread } from './CommentsThread';
import { getTbilisiNow, formatGeorgianDate } from '../utils/tbilisiDate';

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

const CATEGORY_DOT_COLORS: Record<string, string> = {
  შემაჯამებელი: 'bg-rose-500',
  დამოუკიდებელი: 'bg-amber-500',
  გამოკითხვა: 'bg-pink-500',
  დავალებები: 'bg-yellow-400',
  სკოლა: 'bg-[var(--primary-action)]',
  ჩემპიონატები: 'bg-emerald-600',
  'ჰაკათონები/იდეათონები': 'bg-emerald-400',
  აქტივობები: 'bg-sky-500',
  'პრე-აქსელერაციის პროგრამები': 'bg-sky-400',
  მოხალისეობრივი: 'bg-yellow-500',
  ოლიმპიადები: 'bg-teal-500',
};

interface RealCalendarViewProps {
  onOpenQuiz?: () => void;
}

export const RealCalendarView: React.FC<RealCalendarViewProps> = ({ onOpenQuiz }) => {
  const { isAdmin, platform, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } =
    usePlatform();

  // Mobile layout switch: 'agenda' | 'week' | 'month' (defaulting to agenda on mobile for fast, zero-overflow scanning)
  const [mobileView, setMobileView] = useState<'agenda' | 'week' | 'month'>('agenda');

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('ყველა');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Real Tbilisi Date & Time initialized from local school time
  const tbilisiNow = useMemo(() => getTbilisiNow(), []);
  const [currentDate, setCurrentDate] = useState<Date>(
    () => new Date(tbilisiNow.year, tbilisiNow.month - 1, 1)
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => tbilisiNow.dateString);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [isAiExpanded, setIsAiExpanded] = useState(false);

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
    if (evt.endDate) {
      return dateStr >= evt.date && dateStr <= evt.endDate;
    }
    return evt.date === dateStr;
  };

  // Month Grid Calculation
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

    // Pad next month to complete 35 or 42 cells
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
    setFormDate(selectedDate || '2026-10-15');
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            კალენდარი
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            შემაჯამებლები, დამოუკიდებლები, გამოკითხვები და ოლიმპიადები.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Create Event Action */}
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-amber-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>დამატება (Admin)</span>
            </button>
          )}

          {/* Month Navigation Controls */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl glass-pill">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              aria-label="წინა თვე"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-slate-900 dark:text-slate-100 min-w-[100px] text-center">
              {GEORGIAN_MONTHS[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              aria-label="შემდეგი თვე"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg btn-primary transition-colors cursor-pointer"
            >
              დღეს
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FILTER PILLS & MOBILE VIEW SWITCHER
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        {/* Concise Primary Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none min-w-0">
          {['ყველა', 'შემაჯამებელი', 'დამოუკიდებელი', 'გამოკითხვა', 'შეჯიბრებები'].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'btn-primary shadow-xs'
                    : 'card-third text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat}
              </button>
            );
          })}
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>ფილტრები</span>
          </button>
        </div>

        {/* Mobile View Toggle: Agenda | Week | Month */}
        <div className="sm:hidden flex items-center p-1 rounded-xl card-third border border-[var(--border-subtle)] self-start">
          <button
            onClick={() => setMobileView('agenda')}
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
            onClick={() => setMobileView('week')}
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
            onClick={() => setMobileView('month')}
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
          VIEW MODE 1: MOBILE AGENDA VIEW (Fast, Clean, Zero Overflow)
          ========================================================================= */}
      {mobileView === 'agenda' && (
        <div className="sm:hidden space-y-3 min-w-0">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>დაგეგმილი მოვლენები ({agendaEvents.length})</span>
            <span>{selectedCategory}</span>
          </div>

          <div className="space-y-2.5">
            {agendaEvents.map((evt) => {
              const dotColor = CATEGORY_DOT_COLORS[evt.category] || 'bg-slate-400';
              return (
                <div
                  key={evt.id}
                  onClick={() => setActiveEvent(evt)}
                  className="card-surface p-4 space-y-2 cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {evt.category}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {evt.date}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {evt.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    {evt.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {evt.time}
                      </span>
                    )}
                    {evt.teacher && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
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
          <div className="grid grid-cols-7 gap-1 card-surface p-2 shadow-sm min-w-0">
            {weekDays.map((d) => {
              const isSelected = d.dateStr === selectedDate;
              return (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDate(d.dateStr)}
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
                        isSelected ? 'bg-white' : 'bg-rose-500'
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
                  onClick={() => setActiveEvent(evt)}
                  className="card-surface p-4 space-y-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--primary-action-light)] text-[var(--primary-action)]">
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
              <p className="text-xs text-[var(--text-muted)] py-3 text-center">ამ დღეს მოვლენა არ არის.</p>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 3: MONTH GRID (Desktop Always Visible, Mobile when mobileView === 'month')
          ========================================================================= */}
      <div className={`space-y-4 min-w-0 ${mobileView === 'month' ? 'block' : 'hidden sm:block'}`}>
          <div className="card-surface p-2 sm:p-5 shadow-sm overflow-hidden min-w-0">
            {/* Weekday Row */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center min-w-0">
              {WEEKDAYS_SHORT.map((day) => (
                <div
                  key={day}
                  className="text-[10px] sm:text-xs font-semibold text-[var(--text-muted)] py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Matrix: Min-w-0 on everything to prevent any 720px blowout! */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-0">
              {calendarGrid.map((cell, idx) => {
                const dayEvents = filteredEvents.filter((e) => isEventOnDate(e, cell.dateString));
                const isSelectedDay = cell.dateString === selectedDate;
                const isToday = cell.dateString === tbilisiNow.dateString;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      soundEffects.click();
                      setSelectedDate(cell.dateString);
                      if (dayEvents.length > 0 && window.innerWidth < 640) {
                        setActiveEvent(dayEvents[0]);
                      }
                    }}
                    className={`min-h-[52px] sm:min-h-[105px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between cursor-pointer min-w-0 ${
                      cell.isCurrentMonth
                        ? 'card-third/60 border-[var(--border-subtle)] hover:border-[var(--primary-action)]/30'
                        : 'bg-transparent border-transparent opacity-30'
                    } ${
                      isSelectedDay
                        ? 'ring-2 ring-[var(--primary-action)] bg-[var(--primary-action-light)]'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
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

                      {/* Desktop event counter */}
                      {dayEvents.length > 0 && (
                        <span className="hidden sm:inline text-[10px] font-mono text-[var(--text-muted)]">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Mobile: Clean dots view (Zero text blowout!) */}
                    <div className="sm:hidden flex items-center justify-center gap-1 py-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            CATEGORY_DOT_COLORS[e.category] || 'bg-[var(--primary-action)]'
                          }`}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] font-mono text-[var(--text-muted)]">+</span>
                      )}
                    </div>

                    {/* Desktop: Clear readable event pills with +N more */}
                    <div className="hidden sm:block space-y-1 mt-1 overflow-hidden min-w-0">
                      {dayEvents.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setActiveEvent(e);
                          }}
                          className="px-1.5 py-0.5 rounded text-[11px] font-medium truncate card-surface text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--primary-action)]/40 transition-colors"
                          title={e.title}
                        >
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-[var(--primary-action)] font-semibold px-1">
                          +{dayEvents.length - 2} კიდევ
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Selected Day Details Bar */}
          <div className="hidden sm:block card-surface p-5 space-y-3 shadow-sm min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>თარიღი: {selectedDate}</span>
                <span className="text-xs text-[var(--text-muted)] font-normal">
                  ({selectedDateEvents.length} მოვლენა)
                </span>
              </h2>
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                {selectedDateEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setActiveEvent(evt)}
                    className="p-3.5 rounded-xl card-third border border-[var(--border-subtle)] hover:border-[var(--primary-action)]/30 transition-all cursor-pointer flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--primary-action-light)] text-[var(--primary-action)]">
                          {evt.category}
                        </span>
                        {evt.teacher && (
                          <span className="text-[11px] text-[var(--text-muted)]">
                            • {evt.teacher}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                        {evt.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                        {evt.description}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--primary-action)]">
                      დეტალები &rarr;
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] py-2">
                ამ დღეს დაგეგმილი შემაჯამებელი ან აქტივობა არ არის.
              </p>
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
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--primary-action-light)] text-[var(--primary-action)] border border-[var(--primary-action)]/20">
                      {activeEvent.category}
                    </span>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      {activeEvent.date}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                    {activeEvent.title}
                  </h2>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isAdmin && (
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

              {/* AI Study Assistance — Collapsed by default & clearly labeled as unofficial */}
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
              <div className="pt-2 border-t border-slate-200/70 dark:border-white/10">
                <ResourceSection
                  targetType="event"
                  targetId={activeEvent.id}
                  targetTitle={activeEvent.title}
                />
              </div>

              {/* Comments Thread Section */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-white/10">
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
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  კალენდრის ფილტრები
                </span>
                <button
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {CALENDAR_FILTERS.map((f) => {
                  const isSelected = selectedCategory === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        setSelectedCategory(f.id);
                        setIsFilterSheetOpen(false);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                        isSelected
                          ? 'btn-primary shadow-xs'
                          : 'card-third text-[var(--text-secondary)]'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => {
                    setSelectedCategory('ყველა');
                    setIsFilterSheetOpen(false);
                  }}
                  className="text-xs font-bold text-rose-500"
                >
                  ყველას გასუფთავება
                </button>
                <button
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="px-4 py-2 rounded-xl btn-primary text-xs font-bold"
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
              className="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-[#141522] border border-slate-200/80 dark:border-white/10 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingEventId ? 'მოვლენის რედაქტირება' : 'ახალი მოვლენის დამატება'}
                </h3>
                <button
                  onClick={() => setShowEventForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    სათაური
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="მაგ. მათემატიკის შემაჯამებელი"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      თარიღი
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      დასრულება (სურვილისამებრ)
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      კატეგორია
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as CalendarCategory)}
                      className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="შემაჯამებელი">შემაჯამებელი</option>
                      <option value="დამოუკიდებელი">დამოუკიდებელი</option>
                      <option value="გამოკითხვა">გამოკითხვა</option>
                      <option value="სკოლა">სასკოლო პროცესი</option>
                      <option value="ჩემპიონატები">ჩემპიონატები</option>
                      <option value="ოლიმპიადები">ოლიმპიადები</option>
                      <option value="აქტივობები">აქტივობები</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      დრო
                    </label>
                    <input
                      type="text"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      placeholder="10:00 - 10:45"
                      className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    მასწავლებელი / ორგანიზატორი
                  </label>
                  <input
                    type="text"
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    placeholder="მაგ. ნანა ჯაფარიძე"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    მოთხოვნები & აღწერა
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="შინაარსი, საკითხები, მოსამზადებელი პარაგრაფები..."
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 rounded-xl p-3 text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800"
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
