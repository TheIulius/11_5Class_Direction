import React, { useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type GradeOption = 'ALL' | '9' | '10' | '11' | '12';
export type SectionOption = 'ALL' | '1' | '2' | '3' | '4' | '5' | '6' | '7';

export const GRADES: { id: GradeOption; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: '9', label: '9th' },
  { id: '10', label: '10th' },
  { id: '11', label: '11th' },
  { id: '12', label: '12th' },
];

export const SECTIONS: SectionOption[] = ['1', '2', '3', '4', '5', '6', '7'];

export interface ClassTwoTierPillStripProps {
  selectedGrade: GradeOption;
  selectedSection: SectionOption;
  onGradeChange: (grade: GradeOption) => void;
  onSectionChange: (section: SectionOption) => void;
  layoutIdPrefix?: string;
  className?: string;
  badgeCounts?: Record<string, number>;
}

export function matchesGradeAndSection(
  clubIdOrClass: string,
  selectedGrade: GradeOption,
  selectedSection: SectionOption
): boolean {
  if (selectedGrade === 'ALL') return true;
  const raw = (clubIdOrClass || '').toLowerCase().trim();
  const normalized = raw === 'sch' ? 'sch_11_5' : raw;

  if (selectedSection === 'ALL') {
    return (
      normalized.includes(`sch_${selectedGrade}_`) ||
      normalized.includes(`${selectedGrade}/`) ||
      normalized.includes(`${selectedGrade}-`) ||
      normalized.startsWith(`${selectedGrade}_`)
    );
  }

  const targetId = `sch_${selectedGrade}_${selectedSection}`;
  const targetSlash = `${selectedGrade}/${selectedSection}`;
  const targetDash = `${selectedGrade}-${selectedSection}`;
  return (
    normalized.includes(targetId) ||
    normalized.includes(targetSlash) ||
    normalized.includes(targetDash) ||
    normalized === targetId
  );
}

export const ClassTwoTierPillStrip: React.FC<ClassTwoTierPillStripProps> = ({
  selectedGrade,
  selectedSection,
  onGradeChange,
  onSectionChange,
  layoutIdPrefix,
  className = '',
}) => {
  const autoId = useId();
  const activePillId = `${layoutIdPrefix || autoId}_activeGradePill`;

  const handleSelectGrade = (grade: GradeOption) => {
    onGradeChange(grade);
    onSectionChange('ALL');
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Tier 1 (Grades): Horizontal row containing "All", "9th", "10th", "11th", "12th" */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 backdrop-blur-md">
        {GRADES.map((grade) => {
          const isActive = selectedGrade === grade.id;
          return (
            <button
              key={grade.id}
              type="button"
              onClick={() => handleSelectGrade(grade.id)}
              className={`relative flex-1 py-1 sm:py-1.5 px-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none text-center ${
                isActive
                  ? 'text-white dark:text-slate-950 font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId={activePillId}
                  className="absolute inset-0 rounded-xl bg-slate-900 dark:bg-white shadow-xs"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{grade.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tier 2 (Sections): Accordion container directly underneath Tier 1 */}
      <AnimatePresence initial={false}>
        {selectedGrade !== 'ALL' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-1 pb-0.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {/* "All [Grade]th" Button */}
              <button
                type="button"
                onClick={() => onSectionChange('ALL')}
                className={`relative px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedSection === 'ALL'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
                }`}
              >
                All {selectedGrade}th
              </button>

              {/* 7 compact circular/rounded badges: "1", "2", "3", "4", "5", "6", "7" */}
              {SECTIONS.map((sec) => {
                const isSecActive = selectedSection === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onSectionChange(sec)}
                    className={`w-7 h-7 rounded-full text-xs font-bold shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                      isSecActive
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs ring-2 ring-emerald-500/40'
                        : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10'
                    }`}
                    title={`Class ${selectedGrade}/${sec}`}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
