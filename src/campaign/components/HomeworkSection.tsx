import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Table,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Save,
  MessageSquare,
  FileText,
  ChevronDown
} from 'lucide-react';
import { DaySchedule, TimetableSlot } from '../data/campaignData';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';
import { ResourceSection } from './ResourceSection';
import { CommentsThread } from './CommentsThread';
import { getTbilisiNow, formatGeorgianDate } from '../utils/tbilisiDate';
import { SubjectAutocomplete } from './SubjectAutocomplete';

const DAY_NAMES_BY_INDEX = [
  'კვირა',
  'ორშაბათი',
  'სამშაბათი',
  'ოთხშაბათი',
  'ხუთშაბათი',
  'პარასკევი',
  'შაბათი',
];

const MONTHS_GEO = [
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

function formatGeoDate(dateStr: string): { displayDate: string; dayOfWeek: string } {
  const d = new Date(dateStr + 'T12:00:00');
  if (isNaN(d.getTime())) {
    return { displayDate: dateStr, dayOfWeek: 'ორშაბათი' };
  }
  const day = d.getDate();
  const month = MONTHS_GEO[d.getMonth()] || '';
  const dayOfWeek = DAY_NAMES_BY_INDEX[d.getDay()] || 'ორშაბათი';
  return { displayDate: `${day} ${month}`, dayOfWeek };
}

export const HomeworkSection: React.FC = () => {
  const {
    user,
    isAdmin,
    platform,
    addHomework,
    deleteHomework,
    moderateHomework,
    updateTimetable,
    openAuthModal,
  } = usePlatform();

  const tbilisiNow = useMemo(() => getTbilisiNow(), []);
  const todayString = tbilisiNow.dateString;

  // Calculate current school week Monday through Friday
  const baseWeekDays = useMemo(() => {
    const currentW = tbilisiNow.weekday; // 1 (Mon) .. 7 (Sun)
    const offsetToMonday = 1 - currentW;
    const nowRef = new Date(tbilisiNow.year, tbilisiNow.month - 1, tbilisiNow.day);

    const days: {
      date: string;
      label: string;
      dayNum: number;
      monthShort: string;
      dayName: string;
      shortDay: string;
    }[] = [];
    const DAY_NAMES = ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი'];
    const DAY_SHORTS = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ'];
    const MONTH_SHORTS = ['იანვ', 'თებ', 'მარტ', 'აპრ', 'მაის', 'ივნ', 'ივლ', 'აგვ', 'სექტ', 'ოქტ', 'ნოემ', 'დეკ'];

    for (let i = 0; i < 5; i++) {
      const d = new Date(nowRef);
      d.setDate(nowRef.getDate() + offsetToMonday + i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const dayNum = d.getDate();
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        dayNum,
        monthShort: MONTH_SHORTS[d.getMonth()],
        label: `${dayNum} ${MONTH_SHORTS[d.getMonth()]}`,
        dayName: DAY_NAMES[i],
        shortDay: DAY_SHORTS[i],
      });
    }
    return days;
  }, [tbilisiNow]);

  const [viewMode, setViewMode] = useState<'homework' | 'timetable'>('homework');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (tbilisiNow.weekday >= 1 && tbilisiNow.weekday <= 5) {
      return tbilisiNow.dateString;
    }
    return baseWeekDays[0]?.date || tbilisiNow.dateString;
  });

  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('class11_5_hw_completed_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [expandedHwId, setExpandedHwId] = useState<string | null>(null);

  // Add Homework Modal
  const [isAddHwOpen, setIsAddHwOpen] = useState(false);
  const [hwDate, setHwDate] = useState(() => tbilisiNow.dateString);
  const [hwSubject, setHwSubject] = useState('მათემატიკა');
  const [hwTeacher, setHwTeacher] = useState('ნანა ჯაფარიძე');
  const [hwTitle, setHwTitle] = useState('');
  const [hwNotes, setHwNotes] = useState('');
  const [submitBanner, setSubmitBanner] = useState<string | null>(null);

  // Mobile timetable selected day tab
  const [mobileTimetableDay, setMobileTimetableDay] = useState<string>(() => {
    return tbilisiNow.weekday >= 1 && tbilisiNow.weekday <= 5
      ? tbilisiNow.weekdayGeorgian
      : 'ორშაბათი';
  });

  // Admin Timetable Editing
  const [isEditingTimetable, setIsEditingTimetable] = useState(false);
  const [draftTimetable, setDraftTimetable] = useState<DaySchedule[]>([]);

  const homeworks = platform.homeworks;
  const timetable = platform.timetable;

  const handleToggleComplete = (id: string) => {
    soundEffects.success();
    setCompletedMap((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('class11_5_hw_completed_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const currentSelectedFormatted = formatGeoDate(selectedDate);
  const currentSelectedDayInfo =
    baseWeekDays.find((d) => d.date === selectedDate) || {
      date: selectedDate,
      label: currentSelectedFormatted.displayDate,
      dayName: currentSelectedFormatted.dayOfWeek,
      shortDay: currentSelectedFormatted.dayOfWeek.slice(0, 3),
    };

  const visibleHomeworks = useMemo(() => {
    return homeworks.filter(
      (h) =>
        h.status !== 'rejected' &&
        (h.status !== 'pending' || isAdmin || (user && h.authorUsername === user.username))
    );
  }, [homeworks, isAdmin, user]);

  const activeDayHomeworks = useMemo(() => {
    return visibleHomeworks.filter((h) => h.date === selectedDate);
  }, [visibleHomeworks, selectedDate]);

  // Separate overdue homework from upcoming work with persistent completion state
  const overdueHomeworks = useMemo(() => {
    return visibleHomeworks.filter((h) => h.date < todayString && !completedMap[h.id]);
  }, [visibleHomeworks, todayString, completedMap]);

  const activeDaySchedule = timetable.find((d) => d.dayId === currentSelectedDayInfo.dayName);

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim()) return;
    const { displayDate, dayOfWeek } = formatGeoDate(hwDate);
    const res = await addHomework({
      date: hwDate,
      displayDate,
      dayOfWeek,
      subject: hwSubject.trim(),
      teacher: hwTeacher.trim() || 'მასწავლებელი',
      title: hwTitle.trim(),
      notes: hwNotes.trim(),
    });

    if (res.success) {
      soundEffects.success();
      setSelectedDate(hwDate);
      setHwTitle('');
      setHwNotes('');
      setIsAddHwOpen(false);
      setSubmitBanner(
        res.isPending
          ? 'დავალება გაიგზავნა დასადასტურებლად.'
          : 'დავალება წარმატებით დაემატა!'
      );
      setTimeout(() => setSubmitBanner(null), 4000);
    }
  };

  const startEditTimetable = () => {
    setDraftTimetable(JSON.parse(JSON.stringify(timetable)));
    setIsEditingTimetable(true);
  };

  const handleSlotChange = (
    dayId: DaySchedule['dayId'],
    period: number,
    field: keyof TimetableSlot,
    value: string
  ) => {
    setDraftTimetable((prev) =>
      prev.map((day) => {
        if (day.dayId !== dayId) return day;
        const exists = day.slots.some((s) => s.period === period);
        const defaultTime =
          period === 1
            ? '8:30 - 9:15'
            : period === 2
            ? '9:20 - 10:05'
            : period === 3
            ? '10:10 - 10:55'
            : period === 4
            ? '11:20 - 12:05'
            : period === 5
            ? '12:10 - 12:55'
            : period === 6
            ? '13:05 - 13:50'
            : '13:55 - 14:40';

        const updatedSlots = exists
          ? day.slots.map((s) => (s.period === period ? { ...s, [field]: value } : s))
          : [
              ...day.slots,
              {
                period,
                time: defaultTime,
                subject: field === 'subject' ? value : '',
                teacher: field === 'teacher' ? value : '',
              },
            ].sort((a, b) => a.period - b.period);

        return {
          ...day,
          slots: updatedSlots.filter((s) => s.subject.trim() !== '' || s.teacher?.trim()),
        };
      })
    );
  };

  const handleSaveTimetable = async () => {
    const ok = await updateTimetable(draftTimetable);
    if (ok) {
      soundEffects.success();
      setIsEditingTimetable(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 min-w-0">
      {/* =========================================================================
          PAGE HEADER: TITLE & SEGMENTED VIEW SWITCH
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {viewMode === 'homework' ? 'დავალებები' : 'გაკვეთილების ცხრილი'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {viewMode === 'homework'
              ? 'საშინაო დავალებები და მიმაგრებული ამოხსნები'
              : '11/5 კლასის ყოველკვირეული გაკვეთილები'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Add Homework Button */}
          {viewMode === 'homework' && (
            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                setHwDate(selectedDate);
                setIsAddHwOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl btn-primary text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>დამატება</span>
            </button>
          )}

          {/* Segmented Control: Homework vs Timetable */}
          <div className="flex items-center p-1 rounded-xl glass-pill">
            <button
              onClick={() => {
                soundEffects.click();
                setViewMode('homework');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'homework'
                  ? 'bg-white dark:bg-[#1a2236] text-slate-900 dark:text-slate-100 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>დავალებები</span>
            </button>

            <button
              onClick={() => {
                soundEffects.click();
                setViewMode('timetable');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'timetable'
                  ? 'bg-white dark:bg-[#1a2236] text-slate-900 dark:text-slate-100 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>ცხრილი</span>
            </button>
          </div>
        </div>
      </div>

      {submitBanner && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-between">
          <span>{submitBanner}</span>
          <button onClick={() => setSubmitBanner(null)} className="text-emerald-600 dark:text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          MODE 1: HOMEWORK VIEW
          ========================================================================= */}
      {viewMode === 'homework' && (
        <div className="space-y-6 min-w-0">
          {/* Overdue Homework Banner (Separated from upcoming work with persistent state) */}
          {overdueHomeworks.length > 0 && (
            <div className="card-surface p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>ვადაგასული დავალებები ({overdueHomeworks.length})</span>
                </span>
                <span className="text-[11px] font-normal text-[var(--text-muted)]">
                  გთხოვთ მონიშნოთ დასრულებისას
                </span>
              </div>
              <div className="space-y-2">
                {overdueHomeworks.map((hw) => (
                  <div
                    key={hw.id}
                    className="p-3.5 rounded-xl card-third text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-rose-600 dark:text-rose-400 text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 shrink-0">
                          {hw.subject}
                        </span>
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">
                          {hw.displayDate}
                        </span>
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded">
                          ვადაგასული
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] leading-snug break-words">
                        {hw.title}
                      </h4>
                      {hw.notes && (
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                          {hw.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleComplete(hw.id)}
                      className="min-h-[44px] px-4 py-2 rounded-xl btn-primary text-xs font-bold shrink-0 cursor-pointer self-start sm:self-center flex items-center justify-center gap-1.5 shadow-xs"
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

          {/* Weekday Strip + Date Control */}
          <div className="card-surface p-3 sm:p-4 space-y-2.5 shadow-sm min-w-0">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-primary)]">
                აირჩიეთ თარიღი:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="bg-transparent text-xs font-mono text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-lg px-2 py-0.5"
              />
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 min-w-0">
              {baseWeekDays.map((day) => {
                const isSelected = selectedDate === day.date;
                const hasHw = visibleHomeworks.some((h) => h.date === day.date);
                return (
                  <button
                    key={day.date}
                    onClick={() => {
                      soundEffects.click();
                      setSelectedDate(day.date);
                    }}
                    className={`p-1.5 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center relative min-w-0 min-h-[52px] ${
                      isSelected
                        ? 'btn-primary font-bold shadow-xs border-[var(--primary-action)]'
                        : 'card-third border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary-action)]/30'
                    }`}
                  >
                    <span className="text-[10px] font-mono opacity-80 leading-tight">{day.shortDay}</span>
                    <span className="text-xs sm:text-sm font-bold mt-0.5 leading-tight">{day.dayNum}</span>
                    <span className="text-[9px] text-[var(--text-muted)] mt-0.5 leading-tight">{day.monthShort}</span>
                    {hasHw && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-1 ${
                          isSelected ? 'bg-white' : 'bg-amber-500'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Day Homework List */}
          <div className="space-y-3.5 min-w-0">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {currentSelectedDayInfo.dayName}, {currentSelectedDayInfo.label} ({activeDayHomeworks.length} დავალება)
              </span>
            </div>

            {activeDayHomeworks.length > 0 ? (
              <div className="space-y-3 min-w-0">
                {activeDayHomeworks.map((hw) => {
                  const isDone = Boolean(completedMap[hw.id]);
                  const isExpanded = expandedHwId === hw.id;
                  const resCount = platform.resources.filter(
                    (r) => r.targetType === 'homework' && r.targetId === hw.id
                  ).length;
                  const comCount = platform.comments.filter(
                    (c) => c.targetType === 'homework' && c.targetId === hw.id
                  ).length;

                  return (
                    <div
                      key={hw.id}
                      className={`card-surface p-4 sm:p-5 space-y-3 transition-all min-w-0 ${
                        isDone
                          ? 'border-emerald-300/80 dark:border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10'
                          : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 min-w-0">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                              {hw.subject}
                            </span>
                            {hw.teacher && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {hw.teacher}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">•</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {hw.displayDate}
                            </span>
                            {hw.status === 'pending' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                დასადასტურებელი
                              </span>
                            )}
                          </div>

                          <h3
                            className={`text-sm sm:text-base font-bold leading-snug ${
                              isDone
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {hw.title}
                          </h3>

                          {hw.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {hw.notes}
                            </p>
                          )}
                        </div>

                        {/* Completion Button & Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                          {isAdmin && hw.status === 'pending' && (
                            <button
                              onClick={() => moderateHomework(hw.id, 'approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                            >
                              დადასტურება
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleComplete(hw.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15'
                            }`}
                          >
                            {isDone ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>შესრულებულია</span>
                              </>
                            ) : (
                              <>
                                <Circle className="w-3.5 h-3.5" />
                                <span>მონიშვნა</span>
                              </>
                            )}
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => deleteHomework(hw.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                              title="წაშლა"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Resource & Comment Bar */}
                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                        <button
                          onClick={() => setExpandedHwId(isExpanded ? null : hw.id)}
                          className="font-semibold text-[var(--primary-action)] hover:underline flex items-center gap-3 cursor-pointer"
                        >
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            <span>მასალები ({resCount})</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>კომენტარები ({comCount})</span>
                          </span>
                        </button>
                        <ChevronDown
                          onClick={() => setExpandedHwId(isExpanded ? null : hw.id)}
                          className={`w-4 h-4 text-slate-400 transition-transform cursor-pointer ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {/* Expanded Section (Preserves card context, no sudden jump!) */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-4">
                          <ResourceSection
                            targetType="homework"
                            targetId={hw.id}
                            targetTitle={`${hw.subject}: ${hw.title}`}
                            defaultSubject={hw.subject}
                          />
                          <CommentsThread targetType="homework" targetId={hw.id} compact />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card-surface p-8 text-center space-y-2">
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {currentSelectedDayInfo.dayName}სთვის დავალება ატვირთული არ არის.
                </p>
                <button
                  onClick={() => {
                    if (!user) {
                      openAuthModal('login');
                      return;
                    }
                    setHwDate(selectedDate);
                    setIsAddHwOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>დაამატე დავალება</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 2: TIMETABLE VIEW
          ========================================================================= */}
      {viewMode === 'timetable' && (
        <div className="space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ყოველკვირეული განრიგი (ორშაბათი – პარასკევი)
            </span>

            {isAdmin && (
              <div className="flex items-center gap-2">
                {!isEditingTimetable ? (
                  <button
                    onClick={startEditTimetable}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>ცხრილის რედაქტირება (Admin)</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveTimetable}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>შენახვა</span>
                    </button>
                    <button
                      onClick={() => setIsEditingTimetable(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 text-xs cursor-pointer"
                    >
                      გაუქმება
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile: Day Selector & Vertical Lesson Cards */}
          <div className="md:hidden space-y-3 min-w-0">
            <div className="flex items-center gap-1 p-1 rounded-xl glass-pill overflow-x-auto scrollbar-none">
              {(isEditingTimetable ? draftTimetable : timetable).map((day) => {
                const isSelected = mobileTimetableDay === day.dayId;
                return (
                  <button
                    key={day.dayId}
                    onClick={() => setMobileTimetableDay(day.dayId)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'btn-primary shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {day.dayId}
                  </button>
                );
              })}
            </div>

            {/* Vertical Lesson Cards for Selected Day */}
            {(() => {
              const currentDaySchedule =
                (isEditingTimetable ? draftTimetable : timetable).find(
                  (d) => d.dayId === mobileTimetableDay
                ) || timetable[0];

              return (
                <div className="card-surface p-4 space-y-2 min-w-0">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-100 dark:border-white/5">
                    {currentDaySchedule.dayId} ({currentDaySchedule.slots.length} გაკვეთილი)
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {currentDaySchedule.slots.map((slot) => (
                      <div
                        key={`${currentDaySchedule.dayId}-${slot.period}`}
                        className="py-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span className="font-mono text-slate-400">{slot.period}.</span>
                            <span>{slot.subject}</span>
                          </div>
                          {slot.teacher && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-4">
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
              );
            })()}
          </div>

          {/* Desktop Full Weekly Table */}
          <div className="hidden md:block overflow-x-auto card-surface p-1 shadow-sm min-w-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 w-28">დრო</th>
                  <th className="py-3 px-4">ორშაბათი</th>
                  <th className="py-3 px-4">სამშაბათი</th>
                  <th className="py-3 px-4">ოთხშაბათი</th>
                  <th className="py-3 px-4">ხუთშაბათი</th>
                  <th className="py-3 px-4">პარასკევი</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {[1, 2, 3, 4, 5, 6, 7].map((periodNum) => {
                  const timeLabel =
                    periodNum === 1
                      ? '8:30 - 9:15'
                      : periodNum === 2
                      ? '9:20 - 10:05'
                      : periodNum === 3
                      ? '10:10 - 10:55'
                      : periodNum === 4
                      ? '11:20 - 12:05'
                      : periodNum === 5
                      ? '12:10 - 12:55'
                      : periodNum === 6
                      ? '13:05 - 13:50'
                      : '13:55 - 14:40';

                  return (
                    <tr key={periodNum} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {periodNum}. {timeLabel}
                      </td>

                      {(isEditingTimetable ? draftTimetable : timetable).map((day) => {
                        const slot = day.slots.find((s) => s.period === periodNum);

                        if (isEditingTimetable) {
                          return (
                            <td key={day.dayId} className="py-2 px-3 align-top space-y-1">
                              <input
                                type="text"
                                value={slot?.subject || ''}
                                onChange={(e) =>
                                  handleSlotChange(day.dayId, periodNum, 'subject', e.target.value)
                                }
                                placeholder="საგანი..."
                                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs"
                              />
                              <input
                                type="text"
                                value={slot?.teacher || ''}
                                onChange={(e) =>
                                  handleSlotChange(day.dayId, periodNum, 'teacher', e.target.value)
                                }
                                placeholder="მასწავლებელი..."
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded px-2 py-0.5 text-[10px] text-slate-500"
                              />
                            </td>
                          );
                        }

                        return (
                          <td key={day.dayId} className="py-3 px-4 align-top">
                            {slot ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {slot.subject}
                                </div>
                                {slot.teacher && (
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {slot.teacher}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700 font-mono text-xs">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Homework Modal */}
      <AnimatePresence>
        {isAddHwOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddHwOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-[#141522] border border-slate-200/80 dark:border-white/10 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  საშინაო დავალების დამატება
                </h3>
                <button
                  onClick={() => setIsAddHwOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateHomework} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    თარიღი
                  </label>
                  <input
                    type="date"
                    required
                    value={hwDate}
                    onChange={(e) => setHwDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      საგანი
                    </label>
                    <SubjectAutocomplete
                      required
                      value={hwSubject}
                      onChange={setHwSubject}
                      onSelectTeacher={setHwTeacher}
                      currentTeacher={hwTeacher}
                      placeholder="მათემატიკა"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      მასწავლებელი
                    </label>
                    <input
                      type="text"
                      value={hwTeacher}
                      onChange={(e) => setHwTeacher(e.target.value)}
                      placeholder="ნანა ჯაფარიძე"
                      className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    დავალება / ნომრები
                  </label>
                  <input
                    type="text"
                    required
                    value={hwTitle}
                    onChange={(e) => setHwTitle(e.target.value)}
                    placeholder="ამოცანები 54-60"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    დეტალები
                  </label>
                  <textarea
                    rows={2}
                    value={hwNotes}
                    onChange={(e) => setHwNotes(e.target.value)}
                    placeholder="მითითებები კლასელებისთვის..."
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 rounded-xl p-3 text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddHwOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-slate-500"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl btn-primary text-xs font-bold cursor-pointer"
                  >
                    დამატება
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
