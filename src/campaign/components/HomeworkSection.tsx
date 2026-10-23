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
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { 
  CLASS_TIMETABLE, 
  INITIAL_HOMEWORKS, 
  HomeworkAssignment 
} from '../data/campaignData';
import { soundEffects } from '../utils/soundEffects';

export const HomeworkSection: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-13'); // Defaults to Oct 13
  const [viewMode, setViewMode] = useState<'homework' | 'timetable'>('homework');
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  // Active homework items
  const homeworks = INITIAL_HOMEWORKS;

  const handleToggleComplete = (id: string) => {
    soundEffects.success();
    setCompletedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Weekdays buttons for October 2026 current week (Oct 12 - Oct 16)
  const currentWeekDays = [
    { date: '2026-10-12', label: '12 ოქტ', dayName: 'ორშაბათი', shortDay: 'ორშ' },
    { date: '2026-10-13', label: '13 ოქტ', dayName: 'სამშაბათი', shortDay: 'სამ', hasHw: true },
    { date: '2026-10-14', label: '14 ოქტ', dayName: 'ოთხშაბათი', shortDay: 'ოთხ' },
    { date: '2026-10-15', label: '15 ოქტ', dayName: 'ხუთშაბათი', shortDay: 'ხუთ' },
    { date: '2026-10-16', label: '16 ოქტ', dayName: 'პარასკევი', shortDay: 'პარ' }
  ];

  const currentSelectedDayInfo = currentWeekDays.find(d => d.date === selectedDate) || currentWeekDays[1];
  const activeDayHomeworks = homeworks.filter(h => h.date === selectedDate);
  const activeDaySchedule = CLASS_TIMETABLE.find(d => d.dayId === currentSelectedDayInfo.dayName);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase text-[#e6e2d3] tracking-widest mb-1 opacity-80">
            სასწავლო დავალებები &bull; 11/5 <span className="text-[9px] font-normal lowercase opacity-75 mx-0.5">class</span> PLATFORM
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fcfbf7]">
            საშინაო დავალებების ცენტრი &amp; ცხრილი
          </h1>
          <p className="text-xs sm:text-sm text-[#b8b5a8] mt-1">
            დავალებები კალენდრის მიხედვით და ოფიციალური გაკვეთილების ცხრილი.
          </p>
        </div>

        {/* View Switcher: Homework vs Full Timetable */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#161722]/80 border border-[#f5f2eb]/15 backdrop-blur-xl self-start sm:self-end">
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

      {viewMode === 'homework' && (
        <div className="space-y-6">
          {/* Weekday Date Strip Selector */}
          <div className="rounded-2xl bg-[#141520]/80 border border-[#f5f2eb]/12 backdrop-blur-2xl p-2.5 sm:p-4 shadow-xl">
            <div className="text-xs font-mono text-[#a8a495] mb-2.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#e6e2d3]" />
              <span>აირჩიეთ თარიღი კალენდარში:</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
              {currentWeekDays.map(day => {
                const isSelected = selectedDate === day.date;
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
                    <span className="text-[10px] sm:text-[11px] font-mono uppercase opacity-80">{day.shortDay}</span>
                    <span className="text-[11px] sm:text-sm font-semibold mt-0.5 whitespace-nowrap">{day.label}</span>

                    {/* Indicator if active homework uploaded on this day */}
                    {day.hasHw && (
                      <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${isSelected ? 'bg-amber-600' : 'bg-amber-400 animate-pulse'}`} />
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
                <span>{currentSelectedDayInfo.dayName}, {currentSelectedDayInfo.label}</span>
                <span className="text-xs font-mono text-[#a8a495] font-normal">
                  ({activeDayHomeworks.length} დავალება)
                </span>
              </h2>
            </div>

            {/* If Homework exists for selected date (13 ოქტომბერი - მათემატიკა 54-60) */}
            {activeDayHomeworks.length > 0 ? (
              <div className="space-y-3">
                {activeDayHomeworks.map(hw => {
                  const isDone = Boolean(completedMap[hw.id]);

                  return (
                    <motion.div
                      key={hw.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 sm:p-6 rounded-2xl border transition-all backdrop-blur-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isDone
                          ? 'bg-[#151c18]/80 border-emerald-500/30 text-emerald-200'
                          : 'bg-[#171826]/85 border-[#f5f2eb]/15 text-[#f5f2eb]'
                      }`}
                    >
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
                        </div>

                        <h3 className={`text-base sm:text-lg font-bold ${isDone ? 'line-through text-emerald-300' : 'text-white'}`}>
                          {hw.title}
                        </h3>

                        {hw.notes && (
                          <p className="text-xs text-[#b8b5a8] leading-relaxed">
                            {hw.notes}
                          </p>
                        )}

                        <div className="text-[11px] font-mono text-[#dedacb]/70 flex items-center gap-2 pt-1">
                          <Clock className="w-3.5 h-3.5 text-[#e6e2d3] shrink-0" />
                          <span>სამშაბათის გაკვეთილები: მე-3, მე-4, მე-5 (10:10 - 12:55)</span>
                        </div>
                      </div>

                      {/* Complete Checkbox */}
                      <button
                        onClick={() => handleToggleComplete(hw.id)}
                        className={`w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
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
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Clean Empty State as instructed: nothing else uploaded right now */
              <div className="p-8 sm:p-12 rounded-2xl bg-[#141520]/50 border border-dashed border-[#f5f2eb]/15 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-[#a8a495]">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-[#fcfbf7]">
                  დავალება არ არის მოცემული
                </h3>
                <p className="text-xs text-[#a8a495] max-w-sm mx-auto">
                  {currentSelectedDayInfo.dayName}სთვის ახალი საშინაო დავალება ატვირთული არ არის.
                </p>
              </div>
            )}

            {/* Daily Schedule Preview for selected day */}
            {activeDaySchedule && (
              <div className="pt-4 border-t border-white/5 space-y-3">
                <span className="text-xs font-mono text-[#a8a495] uppercase tracking-wider block">
                  {activeDaySchedule.dayId}ს გაკვეთილების განრიგი ცხრილით:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {activeDaySchedule.slots.map(slot => (
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

      {/* FULL TIMETABLE VIEW (EXACT REPLICA OF THE UPLOADED SCHEDULE PHOTO) */}
      {viewMode === 'timetable' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">გაკვეთილების ოფიციალური ცხრილი</h2>
              <p className="text-xs text-[#b8b5a8]">11/5 კლასის ყოველკვირეული განრიგი</p>
            </div>
            <span className="text-xs font-mono text-[#dedacb] bg-white/5 px-3 py-1 rounded-lg border border-white/10 shrink-0">
              ორშ - პარ
            </span>
          </div>

          {/* Mobile Stacked Day Cards (< md) so everything fits without horizontal scroll */}
          <div className="md:hidden space-y-3">
            {CLASS_TIMETABLE.map(day => (
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
                  {day.slots.map(slot => {
                    const isMathNana =
                      slot.subject === 'მათემატიკა' && slot.teacher?.includes('ჯაფარიძე');
                    return (
                      <div
                        key={`${day.dayId}-${slot.period}`}
                        className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl ${
                          isMathNana ? 'bg-amber-500/10 border border-amber-500/20' : ''
                        }`}
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
                    );
                  })}
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
                {[1, 2, 3, 4, 5, 6, 7].map(periodNum => {
                  const timeLabel = 
                    periodNum === 1 ? '1. 8:30 - 9:15' :
                    periodNum === 2 ? '2. 9:20 - 10:05' :
                    periodNum === 3 ? '3. 10:10 - 10:55' :
                    periodNum === 4 ? '4. 11:20 - 12:05' :
                    periodNum === 5 ? '5. 12:10 - 12:55' :
                    periodNum === 6 ? '6. 13:05 - 13:50' :
                    '7. 13:55 - 14:40';

                  return (
                    <tr key={periodNum} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 sm:px-4 font-mono text-[11px] text-[#a8a495] whitespace-nowrap bg-black/20">
                        {timeLabel}
                      </td>

                      {CLASS_TIMETABLE.map(day => {
                        const slot = day.slots.find(s => s.period === periodNum);
                        const isMathNana = slot && slot.subject === 'მათემატიკა' && slot.teacher?.includes('ჯაფარიძე');

                        return (
                          <td key={day.dayId} className="py-3 px-3 sm:px-4 align-top">
                            {slot ? (
                              <div className={`space-y-0.5 p-1.5 rounded-lg ${isMathNana ? 'bg-amber-500/10 border border-amber-500/20' : ''}`}>
                                <div className="font-semibold text-white">
                                  {slot.subject}
                                </div>
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
    </div>
  );
};
