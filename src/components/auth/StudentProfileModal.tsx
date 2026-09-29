import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFPL } from '../../context/FPLContext';
import { CLUBS } from '../../data/clubs';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  User,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  School,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface StudentProfileModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export type GradeSelection = '9' | '10' | '11' | '12' | 'other';

const GRADES: { id: GradeSelection; labelKa: string; labelEn: string }[] = [
  { id: '9', labelKa: '9 კლასი', labelEn: '9th' },
  { id: '10', labelKa: '10 კლასი', labelEn: '10th' },
  { id: '11', labelKa: '11 კლასი', labelEn: '11th' },
  { id: '12', labelKa: '12 კლასი', labelEn: '12th' },
  { id: 'other', labelKa: 'სხვა', labelEn: 'Other' },
];

const PARALLELS = ['1', '2', '3', '4', '5', '6', '7'];

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const { authUser, updateUserProfile } = useFPL();

  // Profile is complete if grade, parallel, and realName are filled
  const isProfileComplete = Boolean(
    authUser?.grade && authUser?.parallel && authUser?.realName
  );

  // If already completed and not forced open, don't show
  const shouldShow = Boolean(authUser) && (!isProfileComplete || forceOpen);

  // Form State
  const [selectedGrade, setSelectedGrade] = useState<GradeSelection>(() => {
    if (authUser?.grade) {
      if (['9', '10', '11', '12'].includes(authUser.grade)) {
        return authUser.grade as GradeSelection;
      }
      return 'other';
    }
    return '11'; // Default sensible school grade
  });

  const [selectedParallel, setSelectedParallel] = useState<string>(() => {
    return authUser?.parallel || '1';
  });

  const [otherDetails, setOtherDetails] = useState<string>(() => {
    if (authUser?.grade && !['9', '10', '11', '12'].includes(authUser.grade)) {
      return `${authUser.grade} ${authUser.parallel || ''}`.trim();
    }
    return '';
  });

  // Name & Surname
  const initialNames = (authUser?.realName || '').trim().split(' ');
  const [firstName, setFirstName] = useState<string>(initialNames[0] || '');
  const [lastName, setLastName] = useState<string>(initialNames.slice(1).join(' ') || '');

  // Public Visibility Checkbox (check✅ type of thing)
  const [showPublicly, setShowPublicly] = useState<boolean>(() => {
    return authUser?.showRealNamePublicly ?? true;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessThanks, setIsSuccessThanks] = useState(false);

  if (!shouldShow) return null;

  const handleGradeSelect = (grade: GradeSelection) => {
    setSelectedGrade(grade);
    if (grade !== 'other' && !PARALLELS.includes(selectedParallel)) {
      setSelectedParallel('1');
    }
  };

  const finalParallel = selectedGrade === 'other' ? (otherDetails.trim() || 'სხვა') : selectedParallel;
  const clubKey = selectedGrade !== 'other' ? `SCH_${selectedGrade}_${selectedParallel}` : null;
  const clubInfo = clubKey ? CLUBS[clubKey] : null;

  const isValid =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    (selectedGrade !== 'other'
      ? PARALLELS.includes(selectedParallel)
      : otherDetails.trim().length >= 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setError(null);
    setLoading(true);

    try {
      const finalRealName = `${firstName.trim()} ${lastName.trim()}`;
      await updateUserProfile({
        grade: selectedGrade === 'other' ? 'სხვა' : selectedGrade,
        parallel: finalParallel,
        realName: finalRealName,
        showRealNamePublicly: showPublicly,
      });

      // Confetti burst for successful fill-in
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10B981', '#06D6A0', '#FBBF24', '#3B82F6'],
        });
      } catch (e) {}

      // Show "Thanks" view
      setIsSuccessThanks(true);
    } catch (err: any) {
      setError(err?.message || 'შეცდომა მონაცემების შენახვისას. გთხოვთ სცადოთ ხელახლა.');
      setLoading(false);
    }
  };

  const handleCompleteAndDismiss = () => {
    setIsSuccessThanks(false);
    if (onClose) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-fadeIn"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col">
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        <AnimatePresence mode="wait">
          {/* ========================================================
              SUCCESS / "THANKS" SCREEN (As explicitly requested)
             ======================================================== */}
          {isSuccessThanks ? (
            <motion.div
              key="thanks_view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="p-6 sm:p-8 text-center space-y-5"
            >
              <div className="mx-auto w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>მონაცემები შენახულია</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  მადლობა! ✨
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Thanks for providing your details,{' '}
                  <strong className="text-emerald-400 font-bold">{firstName}</strong>!
                  თქვენი კლასი და პროფილი წარმატებით დაფიქსირდა.
                </p>
              </div>

              {/* Profile Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>სახელი & გვარი:</span>
                  <span className="font-bold text-white">{firstName} {lastName}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>კლასი / პარალელი:</span>
                  <span className="font-mono font-black text-emerald-400">
                    {selectedGrade !== 'other' ? `${selectedGrade}/${selectedParallel}` : otherDetails}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>საჯარო ჩვენება:</span>
                  <span className="font-bold flex items-center gap-1 text-slate-200">
                    {showPublicly ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">საჯარო (ჩანს)</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        <span>დაფარული (მხოლოდ გუნდი)</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteAndDismiss}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>თამაშზე გადასვლა</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            /* ========================================================
               FORM ENTRY SCREEN (Mandatory & Unskippable)
               ======================================================== */
            <motion.div
              key="form_view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="p-5 sm:p-7 space-y-5"
            >
              {/* Header */}
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      სავალდებულო • Mandatory
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    მიუთითეთ თქვენი კლასი და სახელი
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    ტურნირის ზუსტი სტატისტიკისა და ლიდერბორდისთვის აუცილებელია თქვენი კლასისა და სახელის მითითება.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. GRADE SELECTION (Simmilar pill input to Standings filter) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-emerald-400" />
                    <span>რომელ კლასში ხართ? (Grade)</span>
                    <span className="text-rose-400 font-bold">*</span>
                  </label>

                  {/* Horizontal Sliding Pill Bar */}
                  <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                    {GRADES.map((g) => {
                      const isActive = selectedGrade === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => handleGradeSelect(g.id)}
                          className={`relative flex-1 py-1.5 sm:py-2 px-1 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none text-center ${
                            isActive
                              ? 'text-slate-950 font-black'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeGradeSelectPill"
                              className="absolute inset-0 rounded-xl bg-emerald-400 shadow-md"
                              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                            />
                          )}
                          <span className="relative z-10">{g.labelKa}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. PARALLEL SELECTION (1 to 7 Circular Badges or Custom text for other) */}
                {selectedGrade !== 'other' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span>რომელი პარალელი? (Parallel / Section)</span>
                        <span className="text-rose-400 font-bold">*</span>
                      </span>
                      {selectedGrade && selectedParallel && (
                        <span className="text-[11px] font-mono font-bold text-emerald-400">
                          {selectedGrade}/{selectedParallel} კლასი
                        </span>
                      )}
                    </label>

                    {/* 7 Circular/Rounded buttons (1-7) */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
                      {PARALLELS.map((sec) => {
                        const isSecActive = selectedParallel === sec;
                        return (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setSelectedParallel(sec)}
                            className={`h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-black font-mono flex items-center justify-center transition-all cursor-pointer ${
                              isSecActive
                                ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/50 scale-[1.04]'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 hover:text-white'
                            }`}
                          >
                            {sec}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-emerald-400" />
                      <span>მიუთითეთ თქვენი სტატუსი ან კლასი</span>
                      <span className="text-rose-400 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={otherDetails}
                      onChange={(e) => setOtherDetails(e.target.value)}
                      placeholder="მაგ. კურსდამთავრებული, მასწავლებელი, 8/1..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>
                )}

                {/* Class Preview Card if 9-12 selected */}
                {selectedGrade !== 'other' && clubInfo && (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border border-white/20 inline-block"
                        style={{ backgroundColor: clubInfo.primaryColor }}
                      />
                      <span>შერჩეული კლასი:</span>
                    </span>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      {selectedGrade}/{selectedParallel} ({clubInfo.name})
                    </span>
                  </div>
                )}

                {/* 3. NAME & SURNAME INPUTS */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>თქვენი სახელი და გვარი (Name & Surname)</span>
                    <span className="text-rose-400 font-bold">*</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="სახელი (First Name)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="გვარი (Surname)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 4. PUBLIC NAME DISPLAY BOOLEAN CHECKBOX (check✅ type of thing) */}
                <div className="pt-2">
                  <label
                    onClick={() => setShowPublicly(!showPublicly)}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 cursor-pointer select-none transition-all group"
                  >
                    <div className="pt-0.5">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                          showPublicly
                            ? 'bg-emerald-500 text-slate-950 shadow-xs ring-2 ring-emerald-500/40'
                            : 'bg-slate-900 border border-slate-700 group-hover:border-slate-500'
                        }`}
                      >
                        {showPublicly && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <span>ჩემი სახელი და გვარი საჯაროდ გამოჩნდეს ანგარიშზე</span>
                        {showPublicly ? (
                          <span className="text-[10px] text-emerald-400 font-mono font-black">✅ დიახ</span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono font-bold">არა</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {showPublicly
                          ? 'ლიდერბორდზე და პროფილში გამოჩნდება თქვენი რეალური სახელი და გვარი.'
                          : 'თქვენი სახელი და გვარი კონფიდენციალური დარჩება და მხოლოდ ადმინისტრატორს ეცოდინება.'}
                      </p>
                    </div>
                  </label>
                </div>

                {/* 5. SUBMIT BUTTON */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!isValid || loading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>დადასტურება & შენახვა</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-500 mt-2">
                    ⚠️ ეს ფორმა სავალდებულოა ყველა მენეჯერისთვის და მისი გამოტოვება შეუძლებელია.
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
