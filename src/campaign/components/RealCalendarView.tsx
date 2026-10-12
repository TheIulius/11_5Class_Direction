import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Clock, 
  MapPin, 
  User,
  Layers,
  SlidersHorizontal,
  X,
  Bot,
  RotateCcw
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

const GEORGIAN_MONTHS = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
];

const WEEKDAYS = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'];

export const RealCalendarView: React.FC = () => {
  // Main Category state (Top Level)
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | 'ყველა'>('ყველა');
  // Specific Filter state (Sub Level)
  const [selectedFilter, setSelectedFilter] = useState<CalendarCategory | 'ყველა'>('ყველა');

  // Target current view to October 2026
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 1)); // 9 = October
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  // Typewriter effect state for AI evaluation
  const [typedText, setTypedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Filters that belong to the active main category (or all if 'ყველა')
  const visibleFilters = useMemo(() => {
    if (selectedMainCategory === 'ყველა') return CALENDAR_FILTERS;
    return CALENDAR_FILTERS.filter(f => f.parentCategory === selectedMainCategory);
  }, [selectedMainCategory]);

  // When main category changes, reset filter to 'ყველა' if it doesn't belong
  const handleSelectMainCategory = (cat: MainCategory | 'ყველა') => {
    soundEffects.click();
    setSelectedMainCategory(cat);
    if (cat !== 'ყველა') {
      const match = CALENDAR_FILTERS.find(f => f.id === selectedFilter && f.parentCategory === cat);
      if (!match) setSelectedFilter('ყველა');
    }
  };

  const handleSelectFilter = (filter: CalendarCategory | 'ყველა') => {
    soundEffects.click();
    setSelectedFilter(filter);
  };

  // Filter events based on both Main Category and Specific Filter
  const filteredEvents = useMemo(() => {
    return INITIAL_CALENDAR_EVENTS.filter(evt => {
      // Check main category
      if (selectedMainCategory !== 'ყველა' && evt.mainCategory !== selectedMainCategory) {
        return false;
      }
      // Check sub-filter
      if (selectedFilter !== 'ყველა' && evt.category !== selectedFilter) {
        return false;
      }
      return true;
    });
  }, [selectedMainCategory, selectedFilter]);

  // Calendar matrix calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  // Convert to Monday-first (0 = Monday, 6 = Sunday)
  const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Previous month days to pad
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarGrid = useMemo(() => {
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

    // Pad next month
    const remaining = 42 - grid.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      grid.push({ dayNumber: d, isCurrentMonth: false, dateString: dateStr });
    }

    return grid;
  }, [year, month, startDay, prevMonthDays, daysInMonth]);

  // Typewriter effect when activeEvent changes
  useEffect(() => {
    if (!activeEvent) {
      setTypedText('');
      setIsTyping(false);
      return;
    }

    const fullAnalysis = 
`[11/5 AI საგანმანათლებლო ანალიზი]:
• სირთულე: ${activeEvent.aiAnalysis.difficultyScore}
• საჭირო დრო: ${activeEvent.aiAnalysis.estimatedHours}
• სტრატეგია: ${activeEvent.aiAnalysis.strategy}
• რეკომენდაცია: ${activeEvent.aiAnalysis.recommendation}`;

    setIsTyping(true);
    setTypedText('');
    let index = 0;

    const interval = setInterval(() => {
      index += 2;
      if (index >= fullAnalysis.length) {
        setTypedText(fullAnalysis);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setTypedText(fullAnalysis.slice(0, index));
      }
    }, 20);

    return () => clearInterval(interval);
  }, [activeEvent]);

  const handlePrevMonth = () => {
    soundEffects.click();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    soundEffects.click();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleResetToOctober = () => {
    soundEffects.click();
    setCurrentDate(new Date(2026, 9, 1));
  };

  // Drag down to close handler for iOS fluid gesture drawer
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 400) {
      setActiveEvent(null);
    }
  };

  // Helper to check if event falls on given date string (supports intervals)
  const isEventOnDate = (evt: CalendarEvent, dateStr: string) => {
    if (evt.endDate) {
      return dateStr >= evt.date && dateStr <= evt.endDate;
    }
    return evt.date === dateStr;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-xs font-mono uppercase text-[#e6e2d3] tracking-widest mb-1 opacity-80">
            ინტერაქტიული კალენდარი &bull; 11/5 DIRECTION
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fcfbf7]">
            სასკოლო &amp; აკადემიური კალენდარი
          </h1>
          <p className="text-xs sm:text-sm text-[#b8b5a8] mt-1">
            შემაჯამებლები, დამოუკიდებლები, გამოკითხვები, ოლიმპიადები და ჩემპიონატები.
          </p>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#161722]/80 border border-[#f5f2eb]/15 backdrop-blur-xl self-start sm:self-end">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-[#e8e5d8] hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="წინა თვე"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 text-xs font-semibold font-mono text-[#fcfbf7] whitespace-nowrap min-w-[130px] text-center">
            {GEORGIAN_MONTHS[month]} {year}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-[#e8e5d8] hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="შემდეგი თვე"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetToOctober}
            className="ml-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[#f5f2eb]/10 hover:bg-[#f5f2eb]/20 text-[#fcfbf7] transition-colors cursor-pointer"
          >
            მიმდინარე
          </button>
        </div>
      </div>

      {/* DUAL-LEVEL HIERARCHICAL BAR: CATEGORIES (LARGE) + FILTERS (COLORED) */}
      <div className="rounded-2xl bg-[#141520]/85 border border-[#f5f2eb]/12 backdrop-blur-2xl p-3 sm:p-4 space-y-3.5 shadow-xl">
        {/* ROW 1: REAL CATEGORIES (უფრო დიდი ზომა და ნაკლები კატეგორია) */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 text-[11px] font-mono text-[#a8a495] uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#e6e2d3]" />
            <span>კატეგორიები:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => handleSelectMainCategory('ყველა')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedMainCategory === 'ყველა'
                  ? 'bg-[#f5f2eb] text-[#0c0d12] shadow-md scale-102'
                  : 'text-[#d4d1c5] hover:text-white bg-[#191a27] border border-white/5 hover:bg-white/5'
              }`}
            >
              ყველა კატეგორია
            </button>

            {MAIN_CATEGORIES.map(cat => {
              const isSelected = selectedMainCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectMainCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#f5f2eb] text-[#0c0d12] shadow-md scale-102 font-bold'
                      : 'bg-[#181a28]/70 text-[#c2bfae] hover:text-white border border-[#f5f2eb]/10 hover:bg-white/5'
                  }`}
                  title={cat.description}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-white/5 pt-2" />

        {/* ROW 2: FILTERS (ფილტრები — შემაჯამებელი წითლად, ჩემპიონატები, და ა.შ.) */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#a8a495] uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#e6e2d3]" />
              <span>ფილტრები:</span>
            </div>
            <span className="text-[10px] font-mono text-[#a8a495]">
              ნაპოვნია: {filteredEvents.length} მოვლენა
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => handleSelectFilter('ყველა')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === 'ყველა'
                  ? 'bg-[#f5f2eb]/90 text-[#0c0d12] shadow-sm'
                  : 'text-[#c2bfae] hover:text-white bg-white/5 border border-white/5'
              }`}
            >
              ყველა ფილტრი
            </button>

            {visibleFilters.map(flt => {
              const isSelected = selectedFilter === flt.id;
              return (
                <button
                  key={flt.id}
                  onClick={() => handleSelectFilter(flt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? `${flt.bgClass} ${flt.textClass} ${flt.borderClass} font-bold shadow-sm ring-1 ring-white/20`
                      : 'bg-[#191b29]/60 border-[#f5f2eb]/10 text-[#bab6a5] hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${flt.dotClass}`} />
                  <span>{flt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CALENDAR GRID */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#12131d]/75 border border-[#f5f2eb]/10 backdrop-blur-2xl p-3 sm:p-5 shadow-2xl overflow-hidden">
        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-[11px] sm:text-xs font-mono font-semibold text-[#a8a495] py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarGrid.map((cell, idx) => {
            const dayIntervalEvents = filteredEvents.filter(
              e => e.category === 'ჩემპიონატები' && Boolean(e.endDate) && isEventOnDate(e, cell.dateString)
            );
            const daySingleEvents = filteredEvents.filter(
              e => e.category !== 'ჩემპიონატები' && isEventOnDate(e, cell.dateString)
            );
            const totalDayCount = dayIntervalEvents.length + daySingleEvents.length;
            const isToday = cell.dateString === '2026-10-13'; // current demo date Oct 13
            const isRowStart = idx % 7 === 0;
            const isRowEnd = idx % 7 === 6;

            return (
              <div
                key={idx}
                className={`min-h-[92px] sm:min-h-[118px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col relative ${
                  cell.isCurrentMonth
                    ? 'bg-[#171825]/50 hover:bg-[#1f2133]/60 border-[#f5f2eb]/10'
                    : 'bg-[#0f1018]/30 border-white/5 opacity-40'
                } ${isToday ? 'ring-1 ring-[#f5f2eb]/50 bg-[#222436]/60' : ''}`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between h-5 shrink-0">
                  <span
                    className={`text-xs font-mono font-medium ${
                      cell.isCurrentMonth
                        ? isToday
                          ? 'text-white font-bold bg-[#f5f2eb]/20 px-1.5 py-0.2 rounded-md'
                          : 'text-[#dedacb]'
                        : 'text-zinc-600'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {totalDayCount > 0 && (
                    <span className="text-[10px] font-mono text-[#dedacb]/60 hidden sm:inline">
                      {totalDayCount}
                    </span>
                  )}
                </div>

                {/* CONTINUOUS SUBTLE DARK GREEN INTERVAL LINE (FIXED VERTICAL ALIGNMENT) */}
                {dayIntervalEvents.map(evt => {
                  const isStart = cell.dateString === evt.date;
                  const isEnd = cell.dateString === evt.endDate;

                  const leftPos = isStart
                    ? 'left-1.5 rounded-l-full'
                    : isRowStart
                    ? 'left-1 rounded-l-full'
                    : '-left-[3px] sm:-left-[5px]';

                  const rightPos = isEnd
                    ? 'right-1.5 rounded-r-full'
                    : isRowEnd
                    ? 'right-1 rounded-r-full'
                    : '-right-[3px] sm:-right-[5px]';

                  return (
                    <React.Fragment key={`interval-${evt.id}-${cell.dateString}`}>
                      <div
                        onClick={e => {
                          e.stopPropagation();
                          soundEffects.click();
                          setActiveEvent(evt);
                        }}
                        title={`${evt.title} (${evt.date} — ${evt.endDate})`}
                        className={`absolute top-[25px] h-[3px] bg-[#345440]/85 hover:bg-[#487358] transition-colors cursor-pointer z-20 ${leftPos} ${rightPos}`}
                      />
                      {isStart && (
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            soundEffects.click();
                            setActiveEvent(evt);
                          }}
                          className="absolute top-[31px] left-1.5 right-1.5 text-[9px] font-mono text-[#7c9987] truncate cursor-pointer hover:text-[#9cbba7] transition-colors"
                        >
                          პინგ-პონგი
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Single-day Event indicators / chips inside cell */}
                <div className="space-y-1 mt-3 flex-1 overflow-hidden">
                  {daySingleEvents.slice(0, 2).map(evt => {
                    const fltMeta = CALENDAR_FILTERS.find(c => c.id === evt.category);

                    return (
                      <button
                        key={evt.id}
                        onClick={() => {
                          soundEffects.click();
                          setActiveEvent(evt);
                        }}
                        className={`w-full text-left px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] truncate font-medium border transition-all cursor-pointer block ${
                          fltMeta
                            ? `${fltMeta.bgClass} ${fltMeta.textClass} ${fltMeta.borderClass}`
                            : 'bg-white/10 text-white'
                        }`}
                        title={`${evt.title} ${evt.teacher ? `(${evt.teacher})` : ''}`}
                      >
                        {evt.title}
                      </button>
                    );
                  })}

                  {daySingleEvents.length > 2 && (
                    <button
                      onClick={() => {
                        soundEffects.click();
                        setActiveEvent(daySingleEvents[0]);
                      }}
                      className="text-[10px] font-mono text-[#dedacb]/80 hover:text-white px-1 block truncate cursor-pointer"
                    >
                      +{daySingleEvents.length - 2} მეტი
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK UPCOMING LIST BELOW GRID */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#12131d]/60 border border-[#f5f2eb]/10 backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-[#fcfbf7] mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#e6e2d3]" />
            <span>აღნიშნული მოვლენები ({filteredEvents.length})</span>
          </div>
          <span className="text-[10px] font-mono font-normal text-[#7c796e]/65 select-none">
            made by Theiulius
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredEvents.slice(0, 6).map(evt => {
            const fltMeta = CALENDAR_FILTERS.find(c => c.id === evt.category);
            return (
              <div
                key={evt.id}
                onClick={() => {
                  soundEffects.click();
                  setActiveEvent(evt);
                }}
                className="p-3 rounded-xl bg-[#171825]/60 hover:bg-[#1e2030]/70 border border-[#f5f2eb]/10 transition-colors cursor-pointer flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[11px] font-mono text-[#a8a495]">
                      {evt.endDate ? `${evt.date} - ${evt.endDate}` : evt.date}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.2 rounded-full border ${fltMeta?.bgClass} ${fltMeta?.textClass} ${fltMeta?.borderClass}`}>
                      {evt.category}
                    </span>
                    {evt.teacher && (
                      <span className="text-[10px] font-mono text-[#dedacb]/80">
                        {evt.teacher}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-white truncate">{evt.title}</h4>
                  <p className="text-[11px] text-[#b8b5a8] truncate mt-0.5">{evt.description}</p>
                </div>
                <span className="text-[10px] text-[#e6e2d3] font-mono shrink-0 underline">
                  დეტალები &rarr;
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DEEP EVENT DETAIL DRAWER WITH AI EVALUATION AND TYPEWRITER ANIMATION (@ios-fluid-gestures) */}
      <AnimatePresence>
        {activeEvent && (
          <>
            {/* iOS Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveEvent(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
              aria-hidden="true"
            />

            {/* iOS Bottom Sheet with GPU spring animation */}
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 40,
                mass: 1
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.08, bottom: 0.65 }}
              onDragEnd={handleDragEnd}
              className="fixed bottom-0 inset-x-0 max-w-xl mx-auto bg-[#13141f]/95 backdrop-blur-2xl border-t border-[#f5f2eb]/20 rounded-t-[28px] shadow-2xl z-50 will-change-transform flex flex-col max-h-[90vh] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {/* Drag Handle Capsule */}
              <div className="w-full pt-3 pb-2 touch-none cursor-grab active:cursor-grabbing select-none flex flex-col items-center">
                <div className="w-12 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Scrollable Content inside sheet */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-2 space-y-4 overscroll-contain text-[#f5f2eb]">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-mono text-[#b8b5a8]">
                        {activeEvent.endDate 
                          ? `${activeEvent.date} — ${activeEvent.endDate}` 
                          : `${activeEvent.date} ${activeEvent.time ? `• ${activeEvent.time}` : ''}`}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white">
                        {activeEvent.category}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f5f2eb]/10 text-[#fcfbf7]">
                        {activeEvent.mainCategory}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                      {activeEvent.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => setActiveEvent(null)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Logistics */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#1a1b28]/60 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[#a8a495] block text-[10px]">მასწავლებელი / პასუხისმგებელი:</span>
                    <span className="text-white font-medium">{activeEvent.teacher || activeEvent.organizer || '11/5 კლასი'}</span>
                  </div>
                  <div>
                    <span className="text-[#a8a495] block text-[10px]">ადგილმდებარეობა:</span>
                    <span className="text-white font-medium">{activeEvent.location || 'სკოლა'}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-[#dedacb] uppercase tracking-wider">აღწერა:</h4>
                  <p className="text-xs sm:text-sm text-[#d4d1c5] leading-relaxed">
                    {activeEvent.description}
                  </p>
                </div>

                {/* AI EVALUATION SECTION WITH REALISTIC TYPEWRITING ANIMATION */}
                <div className="p-4 rounded-2xl bg-[#1b1c2b]/80 border border-[#f5f2eb]/15 backdrop-blur-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#f5f2eb]/10 flex items-center justify-center text-[#fcfbf7]">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#fcfbf7]">
                        11/5 AI საგანმანათლებლო ასისტენტი
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        soundEffects.click();
                        setTypedText('');
                        setIsTyping(true);
                      }}
                      className="text-[10px] font-mono text-[#c2bfae] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>თავიდან გაანალიზება</span>
                    </button>
                  </div>

                  {/* Typing Output Container */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs leading-relaxed text-[#eae7da] min-h-[110px] whitespace-pre-wrap">
                    {typedText}
                    {isTyping && <span className="inline-block w-1.5 h-3.5 bg-[#f5f2eb] ml-0.5 animate-pulse" />}
                  </div>

                  {/* Key structured points */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-medium text-[#c2bfae] uppercase tracking-wider block">
                      საკვანძო ასპექტები:
                    </span>
                    <div className="space-y-1">
                      {activeEvent.aiAnalysis.keyPoints.map((pt, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2 text-xs text-[#dedacb]">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      soundEffects.success();
                      setActiveEvent(null);
                    }}
                    className="w-full py-3 rounded-xl bg-[#f5f2eb] hover:bg-white text-[#0c0d12] font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer shadow-md"
                  >
                    დახურვა
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
