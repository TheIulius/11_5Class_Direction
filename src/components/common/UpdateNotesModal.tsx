import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Building,
  Camera,
  TrendingUp,
  Trophy,
  Clock,
  Shield,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  BellRing,
} from 'lucide-react';
import { useFPL } from '../../context/FPLContext';
import {
  LATEST_UPDATE,
  hasManagerSeenLatestUpdate,
  markLatestUpdateSeen,
  UpdateItem,
} from '../../data/updateNotes';

interface UpdateNotesModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenRulesHistory?: () => void;
}

export const UpdateNotesModal: React.FC<UpdateNotesModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onOpenRulesHistory,
}) => {
  const { authUser, setIsRulesModalOpen, setActiveTab } = useFPL();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Accordion state: Set of opened item IDs. By default, the standout photo feature is open!
  const [expandedId, setExpandedId] = useState<string | null>('player_photos_fixed');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-trigger if manager has not seen latest update
  useEffect(() => {
    if (controlledIsOpen !== undefined) return;
    if (!authUser?.id) return;

    const isSeen = hasManagerSeenLatestUpdate(authUser.id);
    if (!isSeen) {
      const timer = setTimeout(() => {
        setInternalIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [authUser?.id, controlledIsOpen]);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleDismiss = () => {
    if (authUser?.id) {
      markLatestUpdateSeen(authUser.id);
    }
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleViewAllHistory = () => {
    handleDismiss();
    if (onOpenRulesHistory) {
      onOpenRulesHistory();
    } else {
      setIsRulesModalOpen(true);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!mounted || typeof document === 'undefined') return null;

  const renderIcon = (iconType: UpdateItem['icon']) => {
    switch (iconType) {
      case 'stadium':
        return <Building className="w-4 h-4 text-amber-400" />;
      case 'camera':
        return <Camera className="w-4 h-4 text-sky-400" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'trophy':
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'clock':
        return <Clock className="w-4 h-4 text-indigo-400" />;
      case 'shield':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'sliders':
        return <SlidersHorizontal className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg my-auto rounded-3xl bg-slate-900 border border-slate-800/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-emerald-950/40 via-slate-950/60 to-slate-950/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-inner">
                  <BellRing className="w-5 h-5 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-ping" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {LATEST_UPDATE.tagKa} • {LATEST_UPDATE.version}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {LATEST_UPDATE.date}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                    ახალი განახლებები & წესები
                  </h2>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="დახურვა"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header instruction */}
            <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <span>დააჭირეთ ნებისმიერ სიახლეს დეტალების სანახავად:</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">{LATEST_UPDATE.items.length} სიახლე</span>
            </div>

            {/* Click-to-Expand Accordion Items List */}
            <div className="p-3 sm:p-4 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-2">
              {LATEST_UPDATE.items.map((item) => {
                const isExpanded = expandedId === item.id;
                const isStandout = item.highlight;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isStandout
                        ? 'bg-gradient-to-r from-sky-950/30 via-slate-900 to-indigo-950/20 border-sky-400/50 shadow-md shadow-sky-500/5'
                        : isExpanded
                        ? 'bg-slate-900/90 border-emerald-500/30'
                        : 'bg-slate-950/60 border-slate-800/70 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Clickable Header Bar */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-left cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`p-1.5 rounded-xl border shrink-0 ${
                            isStandout
                              ? 'bg-sky-500/20 border-sky-400/40 text-sky-400'
                              : 'bg-slate-800/80 border-slate-700/60'
                          }`}
                        >
                          {renderIcon(item.icon)}
                        </div>

                        <span
                          className={`text-xs sm:text-[13px] font-bold tracking-tight truncate ${
                            isStandout ? 'text-sky-200 font-black' : 'text-slate-200'
                          }`}
                        >
                          {item.titleKa}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                            isStandout
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 font-black'
                              : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                          }`}
                        >
                          {item.badgeKa}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-emerald-400' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {/* Expandable Body */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-3.5 pb-3.5 pt-0.5 text-[11.5px] text-slate-300 leading-relaxed border-t border-slate-800/40 font-sans">
                            {item.descriptionKa}

                            {isStandout && (
                              <div className="mt-2.5 pt-2 border-t border-sky-500/20 flex items-center justify-between gap-2">
                                <span className="text-[10px] text-sky-300/90 font-medium">
                                  💡 დააჭირეთ მოთამაშეს მის ბარათზე და ატვირთეთ ფოტო!
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDismiss();
                                    setActiveTab('players');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[10px] transition-colors shrink-0 shadow-xs"
                                >
                                  Players ტაბი →
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={handleViewAllHistory}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>წესები & ისტორია</span>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>გავიგე</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
