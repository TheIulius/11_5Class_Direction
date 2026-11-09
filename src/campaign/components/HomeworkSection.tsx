import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  User,
  FileText,
  Table,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Save,
} from 'lucide-react';
import { DaySchedule, TimetableSlot } from '../data/campaignData';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';
import { ResourceSection } from './ResourceSection';
import { CommentsThread } from './CommentsThread';

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

  const [selectedDate, setSelectedDate] = useState<string>('2026-10-13');
  const [viewMode, setViewMode] = useState<'homework' | 'timetable'>('homework');
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [expandedHwId, setExpandedHwId] = useState<string | null>(null);

  // Add homework modal
  const [isAddHwOpen, setIsAddHwOpen] = useState(false);
  const [hwDate, setHwDate] = useState('2026-10-13');
  const [hwSubject, setHwSubject] = useState('მათემატიკა');
  const [hwTeacher, setHwTeacher] = useState('ნანა ჯაფარიძე');
  const [hwTitle, setHwTitle] = useState('');
  const [hwNotes, setHwNotes] = useState('');
  const [submitBanner, setSubmitBanner] = useState<string | null>(null);

  // Admin timetable editor state
  const [isEditingTimetable, setIsEditingTimetable] = useState(false);
  const [draftTimetable, setDraftTimetable] = useState<DaySchedule[]>([]);

  const homeworks = platform.homeworks;
  const timetable = platform.timetable;

  const handleToggleComplete = (id: string) => {
    soundEffects.success();
    setCompletedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Weekdays buttons + any other dates that have homework
  const baseWeekDays = [
    { date: '2026-10-12', label: '12 ოქტ', dayName: 'ორშაბათი', shortDay: 'ორშ' },
    { date: '2026-10-13', label: '13 ოქტ', dayName: 'სამშაბათი', shortDay: 'სამ' },
    { date: '2026-10-14', label: '14 ოქტ', dayName: 'ოთხშაბათი', shortDay: 'ოთხ' },
    { date: '2026-10-15', label: '15 ოქტ', dayName: 'ხუთშაბათი', shortDay: 'ხუთ' },
    { date: '2026-10-16', label: '16 ოქტ', dayName: 'პარასკევი', shortDay: 'პარ' },
  ];

  const currentSelectedFormatted = formatGeoDate(selectedDate);
  const currentSelectedDayInfo =
    baseWeekDays.find((d) => d.date === selectedDate) || {
      date: selectedDate,
      label: currentSelectedFormatted.displayDate,
      dayName: currentSelectedFormatted.dayOfWeek,
      shortDay: currentSelectedFormatted.dayOfWeek.slice(0, 3),
    };

  const visibleHomeworks = homeworks.filter(
    (h) =>
      h.status !== 'rejected' &&
      (h.status !== 'pending' || isAdmin || (user && h.authorUsername === user.username))
  );
  const activeDayHomeworks = visibleHomeworks.filter((h) => h.date === selectedDate);
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
          ? 'დავალება გაიგზავნა! ადმინისტრატორის დადასტურების შემდეგ გამოჩნდება ყველასთვის.'
          : 'დავალება წარმატებით დაემატა!'
      );
      setTimeout(() => setSubmitBanner(null), 5000);
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
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase text-[#e6e2d3] tracking-widest mb-1 opacity-80 flex items-center flex-wrap">
            <span>სასწავლო დავალებები &bull;&nbsp;</span>
            <span className="inline-flex items-end">
              <span>11/5</span>
              <span className="text-[8px] font-bold lowercase tracking-tight leading-none ml-0.5 mb-[1px]">
                class
              </span>
            </span>
            <span className="ml-1">PLATFORM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fcfbf7]">
            საშინაო დავალებების ცენტრი &amp; ცხრილი
          </h1>
          <p className="text-xs sm:text-sm text-[#b8b5a8] mt-1">
            დავალებები კალენდრის მიხედვით, კონსპექტები/ამოხსნები და გაკვეთილების ცხრილი.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-end">
          {/* Add Homework Button (Admin or Student) */}
          <button
            type="button"
            onClick={() => {
              soundEffects.click();
              if (!user) {
                openAuthModal('login');
                return;
              }
              setHwDate(selectedDate);
              setIsAddHwOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdmin ? '+ დავალების დამატება (Admin)' : '+ დავალების დამატება'}</span>
          </button>

          {/* View Switcher: Homework vs Full Timetable */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#161722]/80 border border-[#f5f2eb]/15 backdrop-blur-xl">
            <button
              onClick={() => {
                soundEffects.click();
                setViewMode('homework');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'homework'
                  ? 'bg-[#f5f2eb] text-[#0c0d12] font-semibold shadow-sm'
                  : 'text-[#c2bfae] hover:text-white'
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'timetable'
                  ? 'bg-[#f5f2eb] text-[#0c0d12] font-semibold shadow-sm'
                  : 'text-[#c2bfae] hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>სრული ცხრილი</span>
            </button>
          </div>
        </div>
      </div>

      {submitBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 font-medium flex items-center justify-between">
          <span>{submitBanner}</span>
          <button onClick={() => setSubmitBanner(null)} className="text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {viewMode === 'homework' && (
        <div className="space-y-6">
          {/* Weekday Date Strip Selector + Custom Date Picker */}
          <div className="rounded-2xl bg-[#141520]/80 border border-[#f5f2eb]/12 backdrop-blur-2xl p-2.5 sm:p-4 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono text-[#a8a495] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#e6e2d3]" />
                <span>აირჩიეთ თარიღი კალენდარში:</span>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="hw-custom-date" className="text-[11px] font-mono text-[#a8a495]">
                  სხვა თარიღი:
                </label>
                <input
                  id="hw-custom-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  className="bg-[#181a28] border border-[#f5f2eb]/15 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
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
                    className={`px-1.5 py-2 sm:p-3 rounded-xl border transition-all text-center cursor-pointer flex flex-col items-center justify-center relative ${
                      isSelected
                        ? 'bg-[#f5f2eb] text-[#0c0d12] border-white font-bold shadow-lg scale-102'
                        : 'bg-[#181a28]/60 border-[#f5f2eb]/10 text-[#c2bfae] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] sm:text-[11px] font-mono uppercase opacity-80">
                      {day.shortDay}
                    </span>
                    <span className="text-[11px] sm:text-sm font-semibold mt-0.5 whitespace-nowrap">
                      {day.label}
                    </span>

                    {hasHw && (
                      <span
                        className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                          isSelected ? 'bg-amber-600' : 'bg-amber-400 animate-pulse'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Detail & Homework Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-[#fcfbf7] flex items-center gap-2">
                <span>
                  {currentSelectedDayInfo.dayName}, {currentSelectedDayInfo.label}
                </span>
                <span className="text-xs font-mono text-[#a8a495] font-normal">
                  ({activeDayHomeworks.length} დავალება)
                </span>
              </h2>
            </div>

            {activeDayHomeworks.length > 0 ? (
              <div className="space-y-4">
                {activeDayHomeworks.map((hw) => {
                  const isDone = Boolean(completedMap[hw.id]);
                  const isExpanded = expandedHwId === hw.id;

                  return (
                    <motion.div
                      key={hw.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 sm:p-6 rounded-2xl border transition-all backdrop-blur-2xl shadow-xl space-y-4 ${
                        isDone
                          ? 'bg-[#151c18]/80 border-emerald-500/30 text-emerald-200'
                          : 'bg-[#171826]/85 border-[#f5f2eb]/15 text-[#f5f2eb]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                              {hw.subject}
                            </span>
                            <span className="text-xs font-mono text-[#a8a495] flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>მასწავლებელი: {hw.teacher}</span>
                            </span>
                            <span className="text-xs font-mono text-[#dedacb] bg-white/10 px-2 py-0.5 rounded-md">
                              {hw.displayDate}
                            </span>
                            {hw.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold">
                                ელოდება ადმინის დადასტურებას
                              </span>
                            )}
                          </div>

                          <h3
                            className={`text-base sm:text-lg font-bold ${
                              isDone ? 'line-through text-emerald-300' : 'text-white'
                            }`}
                          >
                            {hw.title}
                          </h3>

                          {hw.notes && (
                            <p className="text-xs text-[#b8b5a8] leading-relaxed">{hw.notes}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {isAdmin && hw.status === 'pending' && (
                            <>
                              <button
                                onClick={() => moderateHomework(hw.id, 'approved')}
                                className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                დადასტურება
                              </button>
                              <button
                                onClick={() => moderateHomework(hw.id, 'rejected')}
                                className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                უარყოფა
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleToggleComplete(hw.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-[#f5f2eb] hover:bg-white text-[#0c0d12] shadow-md'
                            }`}
                          >
                            {isDone ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>შესრულებულია</span>
                              </>
                            ) : (
                              <>
                                <Circle className="w-4 h-4 text-[#0c0d12]" />
                                <span>მონიშნე შესრულებულად</span>
                              </>
                            )}
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => deleteHomework(hw.id)}
                              title="დავალების წაშლა"
                              className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/25 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setExpandedHwId(isExpanded ? null : hw.id)}
                          className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>
                            {isExpanded
                              ? 'დამალე ამოხსნები / რესურსები & კომენტარები'
                              : 'ამოხსნების / რესურსების ატვირთვა & კომენტარები'}
                          </span>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="pt-3 border-t border-white/10 space-y-5">
                          <ResourceSection
                            targetType="homework"
                            targetId={hw.id}
                            targetTitle={`${hw.subject}: ${hw.title}`}
                            defaultSubject={hw.subject}
                          />
                          <CommentsThread targetType="homework" targetId={hw.id} compact />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 sm:p-12 rounded-2xl bg-[#141520]/50 border border-dashed border-[#f5f2eb]/15 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-[#a8a495]">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-[#fcfbf7]">
                  დავალება არ არის მოცემული
                </h3>
                <p className="text-xs text-[#a8a495] max-w-sm mx-auto">
                  {currentSelectedDayInfo.dayName}სთვის ({currentSelectedDayInfo.label}) ახალი საშინაო
                  დავალება ატვირთული არ არის.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      openAuthModal('login');
                      return;
                    }
                    setHwDate(selectedDate);
                    setIsAddHwOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>დაამატე დავალება ამ დღისთვის</span>
                </button>
              </div>
            )}

            {/* Daily Schedule Preview for selected day */}
            {activeDaySchedule && (
              <div className="pt-4 border-t border-white/5 space-y-3">
                <span className="text-xs font-mono text-[#a8a495] uppercase tracking-wider block">
                  {activeDaySchedule.dayId}ს გაკვეთილების განრიგი ცხრილით:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {activeDaySchedule.slots.map((slot) => (
                    <div
                      key={slot.period}
                      className="p-3 rounded-xl bg-[#161724]/70 border border-[#f5f2eb]/10 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span className="font-mono text-[#a8a495]">{slot.period}.</span>
                          <span>{slot.subject}</span>
                        </div>
                        {slot.teacher && (
                          <div className="text-[11px] text-[#b8b5a8] font-mono mt-0.5">
                            {slot.teacher}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#a8a495] bg-white/5 px-2 py-0.5 rounded shrink-0">
                        {slot.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL TIMETABLE VIEW (WITH ADMIN EDIT CAPABILITY) */}
      {viewMode === 'timetable' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                გაკვეთილების ოფიციალური ცხრილი
              </h2>
              <p className="text-xs text-[#b8b5a8]">11/5 კლასის ყოველკვირეული განრიგი</p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && !isEditingTimetable && (
                <button
                  type="button"
                  onClick={startEditTimetable}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ცხრილის რედაქტირება (Admin)</span>
                </button>
              )}
              {isAdmin && isEditingTimetable && (
                <>
                  <button
                    type="button"
                    onClick={handleSaveTimetable}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>შენახვა</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTimetable(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs cursor-pointer"
                  >
                    გაუქმება
                  </button>
                </>
              )}
              <span className="text-xs font-mono text-[#dedacb] bg-white/5 px-3 py-1 rounded-lg border border-white/10 shrink-0">
                ორშ - პარ
              </span>
            </div>
          </div>

          {/* Mobile Stacked Day Cards (< md) */}
          <div className="md:hidden space-y-3">
            {(isEditingTimetable ? draftTimetable : timetable).map((day) => (
              <div
                key={`mob-tt-${day.dayId}`}
                className="rounded-2xl border border-[#f5f2eb]/15 bg-[#12131d]/90 backdrop-blur-2xl overflow-hidden shadow-lg"
              >
                <div className="px-4 py-2.5 bg-[#181928]/90 border-b border-[#f5f2eb]/12 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#fcfbf7]">{day.dayId}</span>
                  <span className="text-[10px] font-mono text-[#a8a495]">
                    {day.slots.length} გაკვეთილი
                  </span>
                </div>
                <div className="divide-y divide-white/5 p-2 space-y-1">
                  {day.slots.map((slot) => (
                    <div
                      key={`${day.dayId}-${slot.period}`}
                      className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span className="font-mono text-[#a8a495]">{slot.period}.</span>
                          <span>{slot.subject}</span>
                        </div>
                        {slot.teacher && (
                          <div className="text-[10px] font-mono text-[#a8a495] pl-4">
                            {slot.teacher}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#a8a495] bg-white/5 px-2 py-0.5 rounded shrink-0">
                        {slot.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Full Table Container (md and up) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#f5f2eb]/15 bg-[#12131d]/90 backdrop-blur-2xl shadow-2xl">
            <table className="w-full text-left text-xs text-[#dedacb] border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-[#f5f2eb]/15 bg-[#181928]/90 font-mono text-[11px]">
                  <th className="py-3 px-3 sm:px-4 text-[#a8a495] font-semibold w-28">დრო/დღეები</th>
                  <th className="py-3 px-3 sm:px-4 text-[#fcfbf7] font-semibold">ორშაბათი</th>
                  <th className="py-3 px-3 sm:px-4 text-[#fcfbf7] font-semibold">სამშაბათი</th>
                  <th className="py-3 px-3 sm:px-4 text-[#fcfbf7] font-semibold">ოთხშაბათი</th>
                  <th className="py-3 px-3 sm:px-4 text-[#fcfbf7] font-semibold">ხუთშაბათი</th>
                  <th className="py-3 px-3 sm:px-4 text-[#fcfbf7] font-semibold">პარასკევი</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[1, 2, 3, 4, 5, 6, 7].map((periodNum) => {
                  const timeLabel =
                    periodNum === 1
                      ? '1. 8:30 - 9:15'
                      : periodNum === 2
                      ? '2. 9:20 - 10:05'
                      : periodNum === 3
                      ? '3. 10:10 - 10:55'
                      : periodNum === 4
                      ? '4. 11:20 - 12:05'
                      : periodNum === 5
                      ? '5. 12:10 - 12:55'
                      : periodNum === 6
                      ? '6. 13:05 - 13:50'
                      : '7. 13:55 - 14:40';

                  return (
                    <tr key={periodNum} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 sm:px-4 font-mono text-[11px] text-[#a8a495] whitespace-nowrap bg-black/20">
                        {timeLabel}
                      </td>

                      {(isEditingTimetable ? draftTimetable : timetable).map((day) => {
                        const slot = day.slots.find((s) => s.period === periodNum);

                        if (isEditingTimetable) {
                          return (
                            <td key={day.dayId} className="py-2 px-2 align-top space-y-1">
                              <input
                                type="text"
                                value={slot?.subject || ''}
                                onChange={(e) =>
                                  handleSlotChange(day.dayId, periodNum, 'subject', e.target.value)
                                }
                                placeholder="საგანი..."
                                className="w-full bg-black/50 border border-white/15 rounded px-2 py-1 text-[11px] text-white"
                              />
                              <input
                                type="text"
                                value={slot?.teacher || ''}
                                onChange={(e) =>
                                  handleSlotChange(day.dayId, periodNum, 'teacher', e.target.value)
                                }
                                placeholder="მასწავლებელი..."
                                className="w-full bg-black/30 border border-white/10 rounded px-2 py-0.5 text-[10px] text-[#a8a495]"
                              />
                            </td>
                          );
                        }

                        return (
                          <td key={day.dayId} className="py-3 px-3 sm:px-4 align-top">
                            {slot ? (
                              <div className="space-y-0.5 p-1.5 rounded-lg">
                                <div className="font-semibold text-white">{slot.subject}</div>
                                {slot.teacher && (
                                  <div className="text-[10px] font-mono text-[#a8a495]">
                                    {slot.teacher}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-600 font-mono text-xs">—</span>
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
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-2xl bg-[#141522] border border-[#f5f2eb]/20 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">ახალი საშინაო დავალების დამატება</h3>
                <button
                  onClick={() => setIsAddHwOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateHomework} className="space-y-3">
                <div>
                  <label className="block text-xs text-[#b8b5a8] mb-1">თარიღი</label>
                  <input
                    type="date"
                    required
                    value={hwDate}
                    onChange={(e) => setHwDate(e.target.value)}
                    className="w-full bg-black/40 border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs text-[#b8b5a8] mb-1">საგანი</label>
                    <input
                      type="text"
                      required
                      value={hwSubject}
                      onChange={(e) => setHwSubject(e.target.value)}
                      placeholder="მაგ. მათემატიკა"
                      className="w-full bg-black/40 border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#b8b5a8] mb-1">მასწავლებელი</label>
                    <input
                      type="text"
                      value={hwTeacher}
                      onChange={(e) => setHwTeacher(e.target.value)}
                      placeholder="მაგ. ნანა ჯაფარიძე"
                      className="w-full bg-black/40 border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#b8b5a8] mb-1">დავალების სათაური / ნომრები</label>
                  <input
                    type="text"
                    required
                    value={hwTitle}
                    onChange={(e) => setHwTitle(e.target.value)}
                    placeholder="მაგ. ამოცანები 54-დან 60-ის ჩათვლით"
                    className="w-full bg-black/40 border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#b8b5a8] mb-1">შენიშვნა / დეტალები</label>
                  <textarea
                    rows={3}
                    value={hwNotes}
                    onChange={(e) => setHwNotes(e.target.value)}
                    placeholder="დამატებითი მითითებები კლასელებისთვის..."
                    className="w-full bg-black/40 border border-[#f5f2eb]/15 rounded-xl p-3 text-xs text-white resize-none"
                  />
                </div>

                {!isAdmin && (
                  <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                    მოსწავლის მიერ დამატებული დავალება გაეგზავნება ადმინებს დასადასტურებლად.
                  </p>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddHwOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-[#b8b5a8] hover:text-white"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#f5f2eb] hover:bg-white text-xs font-bold text-[#0c0d12] cursor-pointer"
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
