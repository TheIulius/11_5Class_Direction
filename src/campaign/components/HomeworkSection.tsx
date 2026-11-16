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
  ChevronDown,
  Layers
} from 'lucide-react';
import { DaySchedule, TimetableSlot } from '../data/campaignData';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';
import { ResourceSection } from './ResourceSection';
import { CommentsThread } from './CommentsThread';
import {
  getTbilisiNow,
  formatGeorgianDate,
  getNextSchoolDayDateString,
  parseDateOnly,
} from '../utils/tbilisiDate';
import { SubjectAutocomplete, CLASS_11_5_SUBJECTS } from './SubjectAutocomplete';

interface GroupedLessonBlock {
  key: string;
  periods: number[];
  lessonCount: number;
  periodLabel: string;
  subject: string;
  canonicalSubject: string;
  teacher: string;
  canonicalTeacher: string;
  timeRange: string;
  slots: TimetableSlot[];
}

function resolveCanonicalSubjectInfo(rawSubject: string, fallbackTeacher = ''): {
  subject: string;
  teacher: string;
} {
  const norm = rawSubject.trim().toLowerCase();
  if (!norm) return { subject: rawSubject.trim(), teacher: fallbackTeacher };

  for (const item of CLASS_11_5_SUBJECTS) {
    if (
      item.name.toLowerCase() === norm ||
      (item.aliases && item.aliases.some((a) => a.toLowerCase() === norm))
    ) {
      return { subject: item.name, teacher: item.teacher || fallbackTeacher };
    }
  }

  if (norm.includes('საქ') && norm.includes('ისტ')) {
    const found = CLASS_11_5_SUBJECTS.find((i) => i.name === 'საქ.ისტორია');
    return {
      subject: 'საქ.ისტორია',
      teacher: found?.teacher || fallbackTeacher,
    };
  }

  if (norm === 'ისტორია' || norm.includes('მსოფლიო ისტ')) {
    const found = CLASS_11_5_SUBJECTS.find((i) => i.name === 'ისტორია');
    return {
      subject: 'ისტორია',
      teacher: found?.teacher || fallbackTeacher,
    };
  }

  for (const item of CLASS_11_5_SUBJECTS) {
    if (item.name === 'ისტორია' && norm.includes('საქ')) continue;
    if (
      norm.includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(norm) ||
      (item.aliases && item.aliases.some((a) => norm.includes(a.toLowerCase())))
    ) {
      return { subject: item.name, teacher: item.teacher || fallbackTeacher };
    }
  }

  return { subject: rawSubject.trim(), teacher: fallbackTeacher };
}

function buildGroupedLessonBlocks(slots: TimetableSlot[]): GroupedLessonBlock[] {
  if (!slots || slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => a.period - b.period);
  const groups: GroupedLessonBlock[] = [];

  for (const slot of sorted) {
    const canonical = resolveCanonicalSubjectInfo(slot.subject, slot.teacher || '');
    const prev = groups[groups.length - 1];

    if (
      prev &&
      prev.canonicalSubject.toLowerCase() === canonical.subject.toLowerCase()
    ) {
      prev.periods.push(slot.period);
      prev.slots.push(slot);
      prev.lessonCount = prev.periods.length;
      const firstPeriod = prev.periods[0];
      const lastPeriod = prev.periods[prev.periods.length - 1];
      prev.periodLabel = `${firstPeriod}–${lastPeriod} გაკვ.`;

      const firstStart = prev.slots[0].time.split('-')[0]?.trim();
      const lastEnd = slot.time.split('-')[1]?.trim();
      if (firstStart && lastEnd) {
        prev.timeRange = `${firstStart} - ${lastEnd}`;
      }
      prev.key = `${prev.periods.join('-')}-${prev.canonicalSubject}`;
    } else {
      groups.push({
        key: `${slot.period}-${canonical.subject}`,
        periods: [slot.period],
        lessonCount: 1,
        periodLabel: `${slot.period} გაკვ.`,
        subject: slot.subject,
        canonicalSubject: canonical.subject,
        teacher: slot.teacher || '',
        canonicalTeacher: canonical.teacher || slot.teacher || '',
        timeRange: slot.time,
        slots: [slot],
      });
    }
  }

  return groups;
}

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
    canModerate,
    platform,
    addHomework,
    updateHomework,
    deleteHomework,
    moderateHomework,
    updateTimetable,
    openAuthModal,
  } = usePlatform();

  const tbilisiNow = useMemo(() => getTbilisiNow(), []);
  const defaultNextSchoolDate = useMemo(
    () => getNextSchoolDayDateString(tbilisiNow),
    [tbilisiNow]
  );

  const [viewMode, setViewMode] = useState<'homework' | 'timetable'>('homework');
  const [selectedDate, setSelectedDate] = useState<string>(() => defaultNextSchoolDate);

  // Calculate the Monday–Friday school week corresponding to `selectedDate`
  // (if `selectedDate` is Saturday/Sunday, roll forward to the upcoming Monday–Friday week)
  const baseWeekDays = useMemo(() => {
    const parsed = parseDateOnly(selectedDate);
    const refDate = parsed
      ? new Date(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0)
      : new Date(tbilisiNow.year, tbilisiNow.month - 1, tbilisiNow.day, 12, 0, 0);

    const jsDay = refDate.getDay(); // 0 = Sun, 1 = Mon .. 6 = Sat
    const offsetToMonday =
      jsDay === 0 ? 1 : jsDay === 6 ? 2 : 1 - jsDay;

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
      const d = new Date(refDate);
      d.setDate(refDate.getDate() + offsetToMonday + i);
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
  }, [selectedDate, tbilisiNow]);

  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
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

  // Homeworks with attached materials or comments are OPEN by default; user can still collapse them
  const [collapsedHwIds, setCollapsedHwIds] = useState<Record<string, boolean>>({});
  const [manuallyOpenedHwIds, setManuallyOpenedHwIds] = useState<Record<string, boolean>>({});

  const checkIsHwExpanded = (hwId: string, hasAttachmentsOrComments: boolean): boolean => {
    if (hasAttachmentsOrComments) {
      return !collapsedHwIds[hwId];
    }
    return Boolean(manuallyOpenedHwIds[hwId]);
  };

  const toggleHwExpanded = (hwId: string, hasAttachmentsOrComments: boolean) => {
    if (hasAttachmentsOrComments) {
      setCollapsedHwIds((prev) => ({ ...prev, [hwId]: !prev[hwId] }));
    } else {
      setManuallyOpenedHwIds((prev) => ({ ...prev, [hwId]: !prev[hwId] }));
    }
  };

  // Add / Edit Homework Modal
  const [isAddHwOpen, setIsAddHwOpen] = useState(false);
  const [editingHwId, setEditingHwId] = useState<string | null>(null);
  const [hwDate, setHwDate] = useState(() => defaultNextSchoolDate);
  const [hwSubject, setHwSubject] = useState('მათემატიკა');
  const [hwTeacher, setHwTeacher] = useState('ნანა ჯაფარიძე');
  const [hwTitle, setHwTitle] = useState('');
  const [hwNotes, setHwNotes] = useState('');
  const [isSubmittingHw, setIsSubmittingHw] = useState(false);
  const [submitBanner, setSubmitBanner] = useState<string | null>(null);

  const openEditHomeworkModal = (hw: any) => {
    setEditingHwId(hw.id);
    setHwDate(hw.date || selectedDate);
    setHwSubject(hw.subject || 'მათემატიკა');
    setHwTeacher(hw.teacher || '');
    setHwTitle(hw.title || '');
    setHwNotes(hw.notes || '');
    setIsAddHwOpen(true);
  };

  // Mobile timetable selected day tab (defaults to next school day's weekday)
  const [mobileTimetableDay, setMobileTimetableDay] = useState<string>(() => {
    return formatGeoDate(defaultNextSchoolDate).dayOfWeek || 'ორშაბათი';
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
        const serialized = JSON.stringify(updated);
        localStorage.setItem('class11_5_hw_completed_v1', serialized);
        localStorage.setItem('class11_5_completed_homework', serialized);
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
        (h.status !== 'pending' || canModerate || (user && h.authorUsername === user.username))
    );
  }, [homeworks, canModerate, user]);

  const activeDayHomeworks = useMemo(() => {
    return visibleHomeworks.filter((h) => h.date === selectedDate);
  }, [visibleHomeworks, selectedDate]);

  const activeDaySchedule = timetable.find((d) => d.dayId === currentSelectedDayInfo.dayName);

  const groupedScheduleBlocks = useMemo(() => {
    return buildGroupedLessonBlocks(activeDaySchedule?.slots || []);
  }, [activeDaySchedule]);

  const { scheduledLessonEntries, unmatchedHomeworks } = useMemo(() => {
    const usedIds = new Set<string>();
    const entries = groupedScheduleBlocks.map((block) => {
      const matched = activeDayHomeworks.filter((hw) => {
        if (usedIds.has(hw.id)) return false;
        const hwCanonical = resolveCanonicalSubjectInfo(hw.subject).subject.toLowerCase();
        return hwCanonical === block.canonicalSubject.toLowerCase();
      });
      matched.forEach((m) => usedIds.add(m.id));
      return {
        block,
        homeworks: matched,
      };
    });

    const unmatched = activeDayHomeworks.filter((hw) => !usedIds.has(hw.id));
    return { scheduledLessonEntries: entries, unmatchedHomeworks: unmatched };
  }, [groupedScheduleBlocks, activeDayHomeworks]);

  const openAddForLessonBlock = (block: GroupedLessonBlock) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    soundEffects.click();
    setEditingHwId(null);
    setHwDate(selectedDate);
    setHwSubject(block.canonicalSubject || block.subject);
    setHwTeacher(block.canonicalTeacher || block.teacher);
    setHwTitle('');
    setHwNotes('');
    setIsAddHwOpen(true);
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim() || isSubmittingHw) return;
    setIsSubmittingHw(true);
    try {
      const { displayDate, dayOfWeek } = formatGeoDate(hwDate);

      if (editingHwId) {
        const ok = await updateHomework(editingHwId, {
          date: hwDate,
          displayDate,
          dayOfWeek,
          subject: hwSubject.trim(),
          teacher: hwTeacher.trim() || 'მასწავლებელი',
          title: hwTitle.trim(),
          notes: hwNotes.trim(),
        });
        if (ok) {
          soundEffects.success();
          setSelectedDate(hwDate);
          setEditingHwId(null);
          setHwTitle('');
          setHwNotes('');
          setIsAddHwOpen(false);
          setSubmitBanner('დავალება წარმატებით განახლდა!');
          setTimeout(() => setSubmitBanner(null), 4000);
        }
        return;
      }

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
    } finally {
      setIsSubmittingHw(false);
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
                setEditingHwId(null);
                setHwTitle('');
                setHwNotes('');
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
          {/* Weekday Strip + Date Control (Defaults to Next School Day) */}
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

          {/* Active Day Homework List (Ordered by Timetable, Merged Consecutive Lessons) */}
          <div className="space-y-3.5 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {currentSelectedDayInfo.dayName}, {currentSelectedDayInfo.label} ({activeDayHomeworks.length} დავალება)
              </span>
              {activeDaySchedule && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  ცხრილის მიხედვით • {activeDaySchedule.slots.length} გაკვეთილი ({scheduledLessonEntries.length} საგნობრივი ბლოკი)
                </span>
              )}
            </div>

            {scheduledLessonEntries.length > 0 ? (
              <div className="space-y-2.5 min-w-0">
                {scheduledLessonEntries.map(({ block, homeworks: blockHomeworks }) => {
                  if (blockHomeworks.length === 0) {
                    // Compact grayed-out single-line row ("პატარა line") for lessons without homework
                    return (
                      <div
                        key={block.key}
                        className="group px-3 py-2 rounded-xl border border-dashed border-slate-300/80 dark:border-white/10 bg-slate-100/50 dark:bg-white/[0.02] text-slate-400 dark:text-slate-500 opacity-65 hover:opacity-100 transition-all flex items-center gap-2 sm:gap-2.5 min-w-0"
                      >
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200/75 dark:bg-white/10 text-slate-500 dark:text-slate-400 shrink-0">
                          {block.periodLabel}
                        </span>

                        {block.lessonCount > 1 && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-300/70 dark:border-white/10 shrink-0"
                            title={`გაერთიანებულია ${block.lessonCount} მიმდევრობითი გაკვეთილი (${block.periods.map((p) => `#${p}`).join(', ')})`}
                          >
                            <Layers className="w-3 h-3" />
                            <span>{block.lessonCount} გაკვეთილი</span>
                          </span>
                        )}

                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate shrink-0 max-w-[130px] sm:max-w-none">
                          {block.subject}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 hidden md:inline shrink-0">
                          {block.timeRange}
                        </span>

                        {/* Subtle horizontal divider line ("პატარა line") */}
                        <div className="flex-1 border-b border-dashed border-slate-300/90 dark:border-white/10 min-w-[12px] mx-1" />

                        <span className="text-[11px] italic text-slate-400 dark:text-slate-500 shrink-0 hidden xs:inline sm:inline">
                          დავალება არ არის
                        </span>

                        <button
                          type="button"
                          onClick={() => openAddForLessonBlock(block)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-[var(--primary-action)] hover:bg-white dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-colors cursor-pointer shrink-0"
                          title={`${block.subject} — დავალების დამატება`}
                        >
                          <Plus className="w-3 h-3" />
                          <span className="hidden sm:inline">დამატება</span>
                        </button>
                      </div>
                    );
                  }

                  // Lesson block WITH uploaded homework(s) — unified for consecutive lessons
                  return (
                    <div key={block.key} className="space-y-2 min-w-0">
                      {blockHomeworks.map((hw, hwIdx) => {
                        const isDone = Boolean(completedMap[hw.id]);
                        const resCount = platform.resources.filter(
                          (r) => r.targetType === 'homework' && r.targetId === hw.id
                        ).length;
                        const comCount = platform.comments.filter(
                          (c) => c.targetType === 'homework' && c.targetId === hw.id
                        ).length;
                        const hasAttachmentsOrComments = resCount > 0 || comCount > 0;
                        const isExpanded = checkIsHwExpanded(hw.id, hasAttachmentsOrComments);

                        return (
                          <div
                            key={hw.id}
                            className={`card-surface p-3.5 sm:p-4 space-y-2.5 transition-all min-w-0 ${
                              isDone
                                ? 'border-emerald-300/80 dark:border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10'
                                : ''
                            }`}
                          >
                            {/* Unified Timetable Slot Strip */}
                            {hwIdx === 0 && (
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-dashed border-[var(--border-subtle)] text-[11px]">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-white/15 dark:text-slate-100 text-[10px]">
                                    {block.periodLabel}
                                  </span>

                                  {block.lessonCount > 1 && (
                                    <span className="inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-800 dark:text-purple-200 border border-purple-500/30 text-[10px]">
                                      <Layers className="w-3 h-3" />
                                      <span>
                                        {block.lessonCount} გაკვეთილი ({block.periods.map((p) => `#${p}`).join(', ')})
                                      </span>
                                    </span>
                                  )}

                                  <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                                    <Clock className="w-3 h-3" />
                                    <span>{block.timeRange}</span>
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => openAddForLessonBlock(block)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-500 hover:text-[var(--primary-action)] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                  title={`${block.subject} — კიდევ ერთი დავალების დამატება`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+ დავალება</span>
                                </button>
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 min-w-0">
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                    {hw.subject}
                                  </span>
                                  {(hw.teacher || block.teacher) && (
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {hw.teacher || block.teacher}
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
                              <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                                {canModerate && hw.status === 'pending' && (
                                  <button
                                    onClick={() => moderateHomework(hw.id, 'approved')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                                  >
                                    დადასტურება
                                  </button>
                                )}

                                <button
                                  onClick={() => handleToggleComplete(hw.id)}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
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

                                {(canModerate || (user && hw.authorUsername === user.username)) && (
                                  <button
                                    type="button"
                                    onClick={() => openEditHomeworkModal(hw)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--primary-action)] transition-colors cursor-pointer"
                                    title="რედაქტირება"
                                    aria-label="დავალების რედაქტირება"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}

                                {canModerate && (
                                  <button
                                    type="button"
                                    onClick={() => deleteHomework(hw.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                    title="წაშლა"
                                    aria-label="დავალების წაშლა"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Expandable Resource & Comment Bar (Open by default when resources/comments exist!) */}
                            <div className="pt-1.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                              <button
                                type="button"
                                onClick={() => toggleHwExpanded(hw.id, hasAttachmentsOrComments)}
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
                              <button
                                type="button"
                                onClick={() => toggleHwExpanded(hw.id, hasAttachmentsOrComments)}
                                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>{isExpanded ? 'ჩაკეცვა' : 'გახსნა'}</span>
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Expanded Section (Always open by default when resources/comments exist, ultra-compact) */}
                            {isExpanded && (
                              <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
                                <ResourceSection
                                  targetType="homework"
                                  targetId={hw.id}
                                  targetTitle={`${hw.subject}: ${hw.title}`}
                                  defaultSubject={hw.subject}
                                  compact
                                />
                                <CommentsThread targetType="homework" targetId={hw.id} compact />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Any extra homework on this date whose subject isn't in that day's standard timetable */}
                {unmatchedHomeworks.map((hw) => {
                  const isDone = Boolean(completedMap[hw.id]);
                  const resCount = platform.resources.filter(
                    (r) => r.targetType === 'homework' && r.targetId === hw.id
                  ).length;
                  const comCount = platform.comments.filter(
                    (c) => c.targetType === 'homework' && c.targetId === hw.id
                  ).length;
                  const hasAttachmentsOrComments = resCount > 0 || comCount > 0;
                  const isExpanded = checkIsHwExpanded(hw.id, hasAttachmentsOrComments);

                  return (
                    <div
                      key={hw.id}
                      className={`card-surface p-3.5 sm:p-4 space-y-2.5 transition-all min-w-0 ${
                        isDone
                          ? 'border-emerald-300/80 dark:border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10'
                          : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 min-w-0">
                        <div className="space-y-1 min-w-0 flex-1">
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

                        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                          <button
                            onClick={() => handleToggleComplete(hw.id)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
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

                          {(canModerate || (user && hw.authorUsername === user.username)) && (
                            <button
                              type="button"
                              onClick={() => openEditHomeworkModal(hw)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--primary-action)] transition-colors cursor-pointer"
                              title="რედაქტირება"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {canModerate && (
                            <button
                              type="button"
                              onClick={() => deleteHomework(hw.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="წაშლა"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => toggleHwExpanded(hw.id, hasAttachmentsOrComments)}
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
                        <button
                          type="button"
                          onClick={() => toggleHwExpanded(hw.id, hasAttachmentsOrComments)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'ჩაკეცვა' : 'გახსნა'}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
                          <ResourceSection
                            targetType="homework"
                            targetId={hw.id}
                            targetTitle={`${hw.subject}: ${hw.title}`}
                            defaultSubject={hw.subject}
                            compact
                          />
                          <CommentsThread targetType="homework" targetId={hw.id} compact />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : activeDayHomeworks.length > 0 ? (
              <div className="space-y-3 min-w-0">
                {activeDayHomeworks.map((hw) => {
                  const isDone = Boolean(completedMap[hw.id]);
                  const resCount = platform.resources.filter(
                    (r) => r.targetType === 'homework' && r.targetId === hw.id
                  ).length;
                  const comCount = platform.comments.filter(
                    (c) => c.targetType === 'homework' && c.targetId === hw.id
                  ).length;
                  const hasAttachmentsOrComments = resCount > 0 || comCount > 0;
                  const isExpanded = checkIsHwExpanded(hw.id, hasAttachmentsOrComments);
                  return (
                    <div key={hw.id} className="card-surface p-3.5 sm:p-4 space-y-2.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold">{hw.subject} — {hw.title}</span>
                        <button
                          onClick={() => handleToggleComplete(hw.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/10"
                        >
                          {isDone ? 'შესრულებულია' : 'მონიშვნა'}
                        </button>
                      </div>
                      <div className="pt-1.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => toggleHwExpanded(hw.id, hasAttachmentsOrComments)}
                          className="font-semibold text-[var(--primary-action)] hover:underline flex items-center gap-3 cursor-pointer"
                        >
                          <span>მასალები ({resCount})</span>
                          <span>კომენტარები ({comCount})</span>
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
                          <ResourceSection
                            targetType="homework"
                            targetId={hw.id}
                            targetTitle={`${hw.subject}: ${hw.title}`}
                            defaultSubject={hw.subject}
                            compact
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
                  {currentSelectedDayInfo.dayName}სთვის ცხრილი ან დავალება არ მოიძებნა.
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

            {canModerate && (
              <div className="flex items-center gap-2">
                {!isEditingTimetable ? (
                  <button
                    onClick={startEditTimetable}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>ცხრილის რედაქტირება</span>
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
          <div className="hidden md:block overflow-x-auto card-surface nb-stationary p-1 shadow-sm min-w-0">
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
                  {editingHwId ? 'დავალების რედაქტირება' : 'საშინაო დავალების დამატება'}
                </h3>
                <button
                  onClick={() => {
                    setEditingHwId(null);
                    setIsAddHwOpen(false);
                  }}
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
                    onClick={() => {
                      setEditingHwId(null);
                      setIsAddHwOpen(false);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs text-slate-500"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingHw}
                    className="px-4 py-2 rounded-xl btn-primary text-xs font-bold cursor-pointer disabled:opacity-60"
                  >
                    {isSubmittingHw ? 'ინახება...' : editingHwId ? 'შენახვა' : 'დამატება'}
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
