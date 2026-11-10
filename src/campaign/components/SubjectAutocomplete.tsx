import React, { useState, useEffect, useRef, useId } from 'react';
import { Check, ChevronDown, Sparkles } from 'lucide-react';

export interface SubjectMeta {
  name: string;
  teacher: string;
  aliases?: string[];
}

export const CLASS_11_5_SUBJECTS: SubjectMeta[] = [
  { name: 'ქართული', teacher: 'თ. თვალჭრელიძე', aliases: ['ქართული ენა', 'ლიტერატურა'] },
  { name: 'მათემატიკა', teacher: 'ნანა ჯაფარიძე', aliases: ['ალგებრა', 'გეომეტრია', 'მათ'] },
  { name: 'ფიზიკა', teacher: 'ა. გელაშვილი', aliases: ['ფიზ'] },
  { name: 'ქიმია', teacher: 'მ. ინწკირველი', aliases: ['ქიმ'] },
  { name: 'ბიოლოგია', teacher: 'რუსუდან გაფრინდაშვილი', aliases: ['ბიოლ'] },
  { name: 'ინგლისური', teacher: 'ბენდიაშვილი', aliases: ['ინგლ', 'english'] },
  { name: 'ისტორია', teacher: 'გ. ქორიძე', aliases: ['მსოფლიო ისტორია'] },
  { name: 'საქ.ისტორია', teacher: 'გ. ქორიძე', aliases: ['საქართველოს ისტორია', 'საქ ისტორია'] },
  { name: 'გეოგრაფია', teacher: 'მ. ინწკირველი', aliases: ['გეოგ'] },
  { name: 'გერ/რუს', teacher: 'არაბიძე/იულია', aliases: ['გერმანული', 'რუსული', 'მეორე უცხოური'] },
  { name: 'მოქალაქეობა', teacher: 'ი. ბოლქვაძე', aliases: ['სამოქალაქო'] },
  { name: 'ეკონ. და სახ.', teacher: 'შ. ქათამაძე', aliases: ['ეკონომიკა', 'ეკონომიკა და სახელმწიფო'] },
  { name: 'სპორტი', teacher: 'უცხ. შაბახიძე', aliases: ['ფიზკულტურა'] },
];

export interface SubjectAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectTeacher?: (teacher: string) => void;
  currentTeacher?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export const SubjectAutocomplete: React.FC<SubjectAutocompleteProps> = ({
  value,
  onChange,
  onSelectTeacher,
  currentTeacher,
  placeholder = 'მათემატიკა',
  required = false,
  className = '',
  id,
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const listboxId = `${inputId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isBackspaceRef = useRef(false);

  // Compute matching subjects based on current user prefix
  const matchingSubjects = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return CLASS_11_5_SUBJECTS;

    // Rank 1: Subject starts with typed prefix
    const startsWithName = CLASS_11_5_SUBJECTS.filter((s) =>
      s.name.toLowerCase().startsWith(q)
    );

    // Rank 2: An alias starts with typed prefix
    const startsWithAlias = CLASS_11_5_SUBJECTS.filter(
      (s) =>
        !startsWithName.includes(s) &&
        s.aliases?.some((a) => a.toLowerCase().startsWith(q))
    );

    // Rank 3: Subject or alias contains query anywhere
    const containsAnywhere = CLASS_11_5_SUBJECTS.filter(
      (s) =>
        !startsWithName.includes(s) &&
        !startsWithAlias.includes(s) &&
        (s.name.toLowerCase().includes(q) ||
          s.aliases?.some((a) => a.toLowerCase().includes(q)))
    );

    return [...startsWithName, ...startsWithAlias, ...containsAnywhere];
  }, [value]);

  // Handle outside click / light dismiss
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const handleSelect = (item: SubjectMeta, triggerAutofill = true) => {
    onChange(item.name);
    setIsOpen(false);
    setHighlightedIndex(-1);

    if (triggerAutofill && onSelectTeacher && item.teacher) {
      onSelectTeacher(item.teacher);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      isBackspaceRef.current = true;
    } else {
      isBackspaceRef.current = false;
    }

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < matchingSubjects.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : matchingSubjects.length - 1
      );
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && matchingSubjects[highlightedIndex]) {
        e.preventDefault();
        handleSelect(matchingSubjects[highlightedIndex]);
      } else if (matchingSubjects.length === 1 && value.trim()) {
        e.preventDefault();
        handleSelect(matchingSubjects[0]);
      } else if (isOpen) {
        setIsOpen(false);
      }
    } else if (e.key === 'Tab') {
      // If exactly 1 match or one is highlighted, accept it on Tab
      if (isOpen && highlightedIndex >= 0 && matchingSubjects[highlightedIndex]) {
        handleSelect(matchingSubjects[highlightedIndex]);
      } else if (matchingSubjects.length === 1 && value.trim()) {
        handleSelect(matchingSubjects[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const isBackspace = isBackspaceRef.current;
    onChange(rawVal);
    setIsOpen(true);

    const q = rawVal.trim().toLowerCase();

    // If empty or deleting, don't inline auto-complete
    if (!q || isBackspace) {
      setHighlightedIndex(-1);
      return;
    }

    // Filter subjects that start with this prefix
    const prefixMatches = CLASS_11_5_SUBJECTS.filter((s) =>
      s.name.toLowerCase().startsWith(q)
    );

    // If exactly ONE subject matches the typed prefix:
    // "ან თუ ერთადერთია პირდაპირ დაგიმთავრებს ტექსტს"
    // (Or if it's the only one, directly complete the text for you)
    if (prefixMatches.length === 1 && rawVal.length >= 2) {
      const match = prefixMatches[0];
      const fullName = match.name;

      // Update value to full name
      onChange(fullName);
      setHighlightedIndex(0);

      // Auto-fill teacher if available
      if (onSelectTeacher && match.teacher) {
        onSelectTeacher(match.teacher);
      }

      // Preserve cursor and highlight the auto-completed suffix (Apple/Browser inline autofill behavior)
      const inputEl = inputRef.current;
      if (inputEl) {
        const startPos = rawVal.length;
        const endPos = fullName.length;
        // Schedule selection range so React render finishes
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(startPos, endPos);
          }
        });
      }
    } else {
      setHighlightedIndex(0);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0 && matchingSubjects[highlightedIndex]
              ? `${inputId}-opt-${highlightedIndex}`
              : undefined
          }
          required={required}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            if (matchingSubjects.length > 0) setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          className={
            className ||
            'w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[var(--primary-action)] focus:ring-1 focus:ring-[var(--primary-action)] transition-all'
          }
        />

        <button
          type="button"
          tabIndex={-1}
          aria-label="საგნების სია"
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (!isOpen) {
              inputRef.current?.focus();
            }
          }}
          className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Dropdown Options List */}
      {isOpen && matchingSubjects.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 top-full mt-1.5 z-50 rounded-2xl bg-white/95 dark:bg-[#141F32]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 shadow-2xl overflow-hidden max-h-56 overflow-y-auto py-1 min-w-[240px] w-full max-w-[calc(100vw-3rem)]"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] font-semibold text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--primary-action)]" />
              <span>11/5 საგნები ({matchingSubjects.length})</span>
            </span>
            <span className="hidden sm:inline opacity-70">Enter / Tab ასარჩევად</span>
          </div>

          {matchingSubjects.map((subject, idx) => {
            const isSelected = value.trim() === subject.name;
            const isHighlighted = idx === highlightedIndex;

            return (
              <div
                key={subject.name}
                id={`${inputId}-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur before click finishes
                  handleSelect(subject);
                }}
                className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  isHighlighted
                    ? 'bg-[var(--primary-action-light)] text-[var(--primary-action)] font-semibold'
                    : isSelected
                    ? 'bg-slate-100 dark:bg-white/5 text-[var(--text-primary)] font-medium'
                    : 'text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{subject.name}</span>
                  {subject.aliases && subject.aliases.length > 0 && (
                    <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">
                      ({subject.aliases[0]})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  {subject.teacher && <span>{subject.teacher}</span>}
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[var(--primary-action)]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
