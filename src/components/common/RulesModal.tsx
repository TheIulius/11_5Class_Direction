import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  Shield,
  Award,
  Clock,
  AlertTriangle,
  Building,
  MapPin,
  History,
  Sparkles,
  Camera,
  TrendingUp,
  Trophy,
  SlidersHorizontal,
  ChevronDown,
  ArrowLeftRight,
} from 'lucide-react';
import { UPDATE_NOTES, UpdateItem } from '../../data/updateNotes';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'rules' | 'updates';
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'rules',
}) => {
  const [lang, setLang] = useState<'geo' | 'eng'>('geo');
  const [activeTab, setActiveTab] = useState<'rules' | 'updates'>(initialTab);
  const [expandedItemId, setExpandedItemId] = useState<string | null>('player_photos_fixed');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  const renderItemIcon = (iconType: UpdateItem['icon']) => {
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl my-auto rounded-3xl bg-white/95 dark:bg-[#070b12]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-slate-900 dark:text-white"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-white/60 dark:bg-zinc-950/40 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200">
                  {activeTab === 'rules' ? <BookOpen className="w-5 h-5" /> : <History className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {activeTab === 'rules'
                      ? lang === 'geo'
                        ? 'ტურნირის წესები და ქულები'
                        : 'Official Rules & Scoring'
                      : lang === 'geo'
                      ? 'განახლებების ისტორია'
                      : 'Updates History & Changelog'}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Komarovi Charity League Fantasy</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Switcher */}
                <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-[10px] font-bold">
                  <button
                    onClick={() => setLang('geo')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      lang === 'geo' ? 'bg-zinc-900 text-white font-black dark:bg-white dark:text-zinc-950 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    GEO
                  </button>
                  <button
                    onClick={() => setLang('eng')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      lang === 'eng' ? 'bg-zinc-900 text-white font-black dark:bg-white dark:text-zinc-950 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    ENG
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2 bg-slate-100/70 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/[0.06] shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('rules')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'rules'
                    ? 'bg-zinc-900 text-white font-black shadow-xs dark:bg-white dark:text-zinc-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{lang === 'geo' ? 'წესები & ქულები' : 'Rules & Scoring'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('updates')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                  activeTab === 'updates'
                    ? 'bg-zinc-900 text-white font-black shadow-xs dark:bg-white dark:text-zinc-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>{lang === 'geo' ? 'განახლებების ისტორია' : 'Updates History'}</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-6 text-xs text-slate-300">
              {activeTab === 'rules' ? (
                <>
                  {/* 1. Squad Requirements */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      <span>{lang === 'geo' ? '1. გუნდის შემადგენლობა' : '1. Squad Composition'}</span>
                    </h3>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {lang === 'geo'
                          ? 'თითოეული მენეჯერის გუნდი შედგება ზუსტად 9 მოთამაშისგან:'
                          : 'Each fantasy squad must consist of exactly 9 players:'}
                      </p>
                      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                        <li className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-2xs">
                          <span className="block font-black text-amber-500 dark:text-amber-400">1</span>
                          <span className="text-slate-700 dark:text-slate-300">{lang === 'geo' ? 'მეკარე (GK)' : 'Goalkeeper'}</span>
                        </li>
                        <li className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-2xs">
                          <span className="block font-black text-sky-500 dark:text-blue-400">3</span>
                          <span className="text-slate-700 dark:text-slate-300">{lang === 'geo' ? 'მცველი (DEF)' : 'Defenders'}</span>
                        </li>
                        <li className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-2xs">
                          <span className="block font-black text-emerald-500 dark:text-emerald-400">3</span>
                          <span className="text-slate-700 dark:text-slate-300">{lang === 'geo' ? 'ნახევარმცველი (MID)' : 'Midfielders'}</span>
                        </li>
                        <li className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-2xs">
                          <span className="block font-black text-rose-500 dark:text-rose-400">2</span>
                          <span className="text-slate-700 dark:text-slate-300">{lang === 'geo' ? 'თავდამსხმელი (FWD)' : 'Forwards'}</span>
                        </li>
                      </ul>
                      <div className="pt-2 text-slate-600 dark:text-slate-400 text-[11px] space-y-1">
                        <p>
                          💰 <strong className="text-slate-900 dark:text-slate-200">{lang === 'geo' ? 'სასტარტო ბიუჯეტი:' : 'Transfer Budget:'}</strong>{' '}
                          {lang === 'geo'
                            ? 'გუნდის შესადგენად თითოეულ მენეჯერს აქვს 55.0 მილიონი (£55.0m).'
                            : 'Each manager starts with a total budget of £55.0m.'}
                        </p>
                        <p>
                          ⚠️ <strong className="text-slate-900 dark:text-slate-200">{lang === 'geo' ? 'კლასის ლიმიტი:' : 'Class Limit:'}</strong>{' '}
                          {lang === 'geo'
                            ? 'ერთი და იგივე კლასიდან (მაგ. 11/5, 9/2) ნებადართულია მაქსიმუმ 2 მოთამაშე.'
                            : 'Maximum 2 players from the same class (e.g. 11/5, 9/2).'}
                        </p>
                        <p>
                          👥 <strong className="text-slate-900 dark:text-slate-200">{lang === 'geo' ? 'ძირითადი & სკამი:' : 'Lineup:'}</strong>{' '}
                          {lang === 'geo'
                            ? '6 ძირითადი მოთამაშე + 3 სათადარიგო. ძირითადში აუცილებელია: 1 მეკარე, 1-3 მცველი, 1-3 ნახევარმცველი, 1-2 თავდამსხმელი.'
                            : '6 starters + 3 bench. Formation must have 1 GK, 1-3 DEF, 1-3 MID, 1-2 FWD.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Scoring System Table: Delisi vs One Price */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      <span>{lang === 'geo' ? '2. ქულების სისტემა სტადიონების მიხედვით' : '2. Stadium Points Comparison'}</span>
                    </h3>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-2.5 sm:p-3">{lang === 'geo' ? 'მოქმედება' : 'Action'}</th>
                            <th className="p-2.5 sm:p-3 text-center bg-slate-50 dark:bg-slate-900/40">
                              <span className="flex items-center justify-center gap-1 text-slate-800 dark:text-slate-200">
                                <MapPin className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                <span>{lang === 'geo' ? 'სტანდარტული (Delisi)' : 'Standard (Delisi)'}</span>
                              </span>
                            </th>
                            <th className="p-2.5 sm:p-3 text-center bg-amber-500/10 text-amber-700 dark:text-amber-300">
                              <span className="flex items-center justify-center gap-1">
                                <Building className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                                <span>One Price Stadium</span>
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                              {lang === 'geo' ? 'მეკარის გოლი' : 'Goalkeeper Goal'}
                            </td>
                            <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">+7</td>
                            <td className="p-2.5 text-center font-bold text-amber-700 dark:text-amber-300 bg-amber-500/5">+5</td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                              {lang === 'geo' ? 'მცველის გოლი' : 'Defender Goal'}
                            </td>
                            <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">+6</td>
                            <td className="p-2.5 text-center font-bold text-amber-700 dark:text-amber-300 bg-amber-500/5">+4</td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                              {lang === 'geo' ? 'ნახევარმცველის გოლი' : 'Midfielder Goal'}
                            </td>
                            <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">+5</td>
                            <td className="p-2.5 text-center font-bold text-amber-700 dark:text-amber-300 bg-amber-500/5">+3</td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                              {lang === 'geo' ? 'თავდამსხმელის გოლი' : 'Forward Goal'}
                            </td>
                            <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">+4</td>
                            <td className="p-2.5 text-center font-bold text-amber-700 dark:text-amber-300 bg-amber-500/5">+2</td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                              {lang === 'geo' ? 'საგოლე გადაცემა (ასისტი)' : 'Assist'}
                            </td>
                            <td className="p-2.5 text-center font-bold text-sky-600 dark:text-sky-400">+3</td>
                            <td className="p-2.5 text-center font-bold text-amber-700 dark:text-amber-300 bg-amber-500/5">+1</td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                              {lang === 'geo' ? '🥇 1-ლი MVP (საუკეთესო)' : '🥇 1st MVP'}
                            </td>
                            <td className="p-2.5 text-center font-bold text-amber-600 dark:text-amber-400">+3</td>
                            <td className="p-2.5 text-center font-bold text-amber-700 dark:text-amber-300 bg-amber-500/5">+2</td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                              {lang === 'geo' ? '🥈 მე-2 MVP' : '🥈 2nd MVP'}
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-700 dark:text-slate-300">+2</td>
                            <td className="p-2.5 text-center font-bold text-amber-700 dark:text-amber-300 bg-amber-500/5">+1</td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                              {lang === 'geo' ? '🥉 მე-3 MVP' : '🥉 3rd MVP'}
                            </td>
                            <td className="p-2.5 text-center font-bold text-amber-600">+1</td>
                            <td className="p-2.5 text-center font-bold text-amber-700 dark:text-amber-300 bg-amber-500/5">0</td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 bg-emerald-500/5">
                            <td className="p-2.5 font-sans font-medium text-emerald-700 dark:text-emerald-300">
                              {lang === 'geo' ? 'მშრალი მატჩი (Clean Sheet - GK/DEF)' : 'Clean Sheet (GK/DEF)'}
                            </td>
                            <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">+4</td>
                            <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">+4</td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 bg-emerald-500/5">
                            <td className="p-2.5 font-sans font-medium text-emerald-700 dark:text-emerald-300">
                              {lang === 'geo' ? 'მშრალი მატჩი (Clean Sheet - MID)' : 'Clean Sheet (MID)'}
                            </td>
                            <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">+1</td>
                            <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">+1</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 3. Additional Points & Penalties */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{lang === 'geo' ? '3. დამატებითი ქულები და ჯარიმები' : '3. Additional Scoring & Penalties'}</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                      {/* Conceded goals */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-rose-500/30 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-bold text-rose-600 dark:text-rose-300">
                            {lang === 'geo' ? 'გაშვებული გოლები (DEF/GK)' : 'Goals Conceded (DEF/GK)'}
                          </span>
                          <span className="font-black text-rose-600 dark:text-rose-400">
                            {lang === 'geo' ? '-⌊გოლები / 2⌋ ქულა' : '-⌊goals / 2⌋ pts'}
                          </span>
                        </div>
                        <p className="font-sans text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {lang === 'geo'
                            ? 'მეკარეებსა და მცველებს აკლდებათ round_down(გაშვებული გოლები / 2) ქულა (მაგ. 0-1 გოლზე: 0, 2-3 გოლზე: -1, 4-5 გოლზე: -2, 8 გოლზე: -4).'
                            : 'Goalkeepers and defenders lose round_down(goals_conceded / 2) points (e.g. 0-1 goals: 0, 2-3 goals: -1, 4-5 goals: -2, 8 goals: -4).'}
                        </p>
                      </div>

                      {/* Own Goal */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-rose-500/30 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-bold text-rose-600 dark:text-rose-300">
                            {lang === 'geo' ? 'ავტოგოლი (ყველა პოზიცია)' : 'Own Goal (All Positions)'}
                          </span>
                          <span className="font-black text-rose-600 dark:text-rose-400">-3 ქულა</span>
                        </div>
                        <p className="font-sans text-[10px] text-slate-600 dark:text-slate-400">
                          {lang === 'geo' ? 'საკუთარ კარში გატანილ გოლზე -3 ქულა.' : '-3 points for scoring an own goal.'}
                        </p>
                      </div>

                      {/* Missed Penalty */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-amber-500/30 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-bold text-amber-700 dark:text-amber-300">
                            {lang === 'geo' ? 'გაფუჭებული პენალტი' : 'Missed Penalty'}
                          </span>
                          <span className="font-black text-rose-600 dark:text-rose-400">-2 ქულა</span>
                        </div>
                        <p className="font-sans text-[10px] text-slate-600 dark:text-slate-400">
                          {lang === 'geo' ? 'პენალტის აცილებაზე ან გაფუჭებაზე -2 ქულა.' : '-2 points for missing a penalty.'}
                        </p>
                      </div>

                      {/* Saved Penalty */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-emerald-500/30 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-bold text-emerald-700 dark:text-emerald-300">
                            {lang === 'geo' ? 'მოგერიებული პენალტი (GK)' : 'Saved Penalty (GK only)'}
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">+3 ქულა</span>
                        </div>
                        <p className="font-sans text-[10px] text-slate-600 dark:text-slate-400">
                          {lang === 'geo' ? 'მეკარის მიერ პენალტის აღებაზე +3 ქულა.' : '+3 points for goalkeeper saving penalty.'}
                        </p>
                      </div>

                      {/* Clean Sheet */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-emerald-500/30 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-bold text-emerald-700 dark:text-emerald-300">
                            {lang === 'geo' ? 'მშრალი მატჩი (Clean Sheet)' : 'Clean Sheet'}
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">+4 GK/DEF, +1 MID</span>
                        </div>
                        <p className="font-sans text-[10px] text-slate-600 dark:text-slate-400">
                          {lang === 'geo'
                            ? 'მეკარეებსა და მცველებს +4 ქულა, ნახევარმცველებს +1 ქულა. მოითხოვს მინიმუმ 20 წუთის გატარებას 0 გაშვებული გოლით.'
                            : 'Goalkeepers & Defenders earn +4 pts, Midfielders +1 pt. Requires 20+ mins played with 0 goals conceded.'}
                        </p>
                      </div>

                      {/* Minutes Played */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-bold text-slate-800 dark:text-slate-200">
                            {lang === 'geo' ? 'ნათამაშები წუთები (30 წთ მატჩი)' : 'Minutes Played (30m match)'}
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">+1 (1-19&apos;), +2 (20-30&apos;)</span>
                        </div>
                        <p className="font-sans text-[10px] text-slate-600 dark:text-slate-400">
                          {lang === 'geo'
                            ? 'მატჩის ხანგრძლივობაა 30 წთ (შეყვანა 15 წთ ბიჯით). 1-19 წთ: +1 ქულა; 20+ წთ: +2 ქულა.'
                            : 'Match length is 30m (15m increments). 1-19 mins: +1 pt; 20+ mins: +2 pts.'}
                        </p>
                      </div>

                      {/* 3 MVPs Awarded per match */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-amber-500/30 space-y-1 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-bold text-amber-700 dark:text-amber-300">
                            {lang === 'geo' ? 'მატჩის 3 MVP (საუკეთესო მოთამაშეები)' : '3 Match MVPs'}
                          </span>
                          <span className="font-black text-amber-600 dark:text-amber-400">🥇 +3, 🥈 +2, 🥉 +1</span>
                        </div>
                        <p className="font-sans text-[10px] text-slate-600 dark:text-slate-400">
                          {lang === 'geo'
                            ? 'თითოეულ მატჩში ჯილდოვდება 3 MVP: 1-ლი ადგილი: +3 ქულა, მე-2 ადგილი: +2 ქულა, მე-3 ადგილი: +1 ქულა (One Price-ზე: +2, +1, 0).'
                            : '3 MVPs are awarded per match: 1st MVP: +3 pts, 2nd MVP: +2 pts, 3rd MVP: +1 pt (at One Price: +2, +1, 0).'}
                        </p>
                      </div>

                      {/* Yellow & Red Cards */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-bold text-slate-800 dark:text-slate-200">
                            {lang === 'geo' ? 'დისციპლინა (ბარათები)' : 'Cards & Discipline'}
                          </span>
                          <span className="font-black text-rose-600 dark:text-rose-400">🟨 -1, 🟥 -3</span>
                        </div>
                        <p className="font-sans text-[10px] text-slate-600 dark:text-slate-400">
                          {lang === 'geo'
                            ? 'ყვითელ ბარათზე -1 ქულა, წითელ ბარათზე -3 ქულა.'
                            : '-1 point for yellow card, -3 points for red card.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4. One Price Stadium Official Note */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <h4 className="font-black text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        {lang === 'geo' ? '4. One Price Stadium-ის გამონაკლისი' : '4. One Price Stadium Exception'}
                      </h4>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-100/90">
                      {lang === 'geo' ? (
                        <>
                          One Price Stadium-ზე ჩატარებულ მატჩებში გოლებსა და საგოლე გადაცემებზე (ასისტებზე) სტანდარტული ქულების რაოდენობა <strong>2 ქულით მცირდება (-2 ქულა)</strong>, ხოლო MVP-ზე — <strong>1 ქულით მცირდება (-1 ქულა)</strong>. ეს ცვლილება მოქმედებს იმის გამო, რომ One Price Stadium-ზე გატანილი გოლების საშუალო რაოდენობა მნიშვნელოვნად აღემატება Delisi (Parki) Stadium-ის მაჩვენებელს. <em>ყველა სხვა ქულების წესი უცვლელი რჩება.</em>
                        </>
                      ) : (
                        <>
                          In matches played at <strong>One Price Stadium</strong>, standard points awarded for Goals and Assists are each <strong>reduced by 2 points (-2 pts)</strong>, and MVP points are <strong>reduced by 1 point (-1 pt)</strong>. This adjustment accounts for the significantly higher average goal-scoring rate compared to Delisi (Parki) Stadium. All other rules remain unmodified.
                        </>
                      )}
                    </p>
                  </div>

                  {/* 5. Transfers & Free Transfer Accumulation Rules */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>{lang === 'geo' ? '5. ტრანსფერები და უფასო ტრანსფერების სისტემა' : '5. Transfers & Free Transfer Rules'}</span>
                    </h3>

                    {/* Core Rules Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {lang === 'geo' ? '🔄 1 უფასო ტრანსფერი' : '🔄 1 Free Transfer'}
                        </span>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {lang === 'geo'
                            ? 'თითოეულ ტურში გეძლევათ 1 უფასო ტრანსფერი (FT).'
                            : 'Every manager receives 1 free transfer per gameweek.'}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {lang === 'geo' ? '📦 დაგროვება (Rollover)' : '📦 Carryover (Rollover)'}
                        </span>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {lang === 'geo'
                            ? 'გამოუყენებელი ტრანსფერი გადადის მომდევნო ტურში.'
                            : 'Unused free transfers carry over to the next gameweek.'}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {lang === 'geo' ? '🛑 მაქსიმუმ 3 FT ლიმიტი' : '🛑 Max Cap: 3 FT'}
                        </span>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {lang === 'geo'
                            ? 'უფასო ტრანსფერების ბალანსი არასდროს აღემატება 3-ს.'
                            : 'The balance of free transfers can never exceed 3.'}
                        </p>
                      </div>
                    </div>

                    {/* Penalty & Timing Information */}
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-700 dark:text-rose-300">
                          {lang === 'geo' ? '⚠️ დამატებითი ტრანსფერების ჯარიმა: -4 ქულა' : '⚠️ Extra Transfer Penalty: -4 Points'}
                        </span>
                        <span className="font-mono font-black text-rose-600 dark:text-rose-400">-4 pts / extra</span>
                      </div>
                      <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        {lang === 'geo'
                          ? 'როდესაც მოთამაშეს შეცვლით, პირველ რიგში იხარჯება არსებული უფასო ტრანსფერები. უფასო ტრანსფერების ამოწურვის შემდეგ, ყოველი დამატებითი ტრანსფერი ჩამოგაჭრით -4 ქულას საერთო რეიტინგში. ტრანსფერის ჯარიმა აკლდება მხოლოდ საერთო ქულებს და არასდროს ცვლის კონკრეტული ტურის მატჩის ქულებს.'
                          : 'Transfers consume available free transfers first. If no free transfers remain, each additional transfer costs -4 points from your overall fantasy score. Transfer penalties affect overall standings only, never individual gameweek scores.'}
                      </p>
                    </div>

                    {/* Concrete Rule Examples */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                        {lang === 'geo' ? '💡 პრაქტიკული მაგალითები:' : '💡 Official Rule Examples:'}
                      </span>
                      <ul className="space-y-1.5 text-[10.5px] text-slate-600 dark:text-slate-400">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>
                            <strong className="text-slate-800 dark:text-slate-200">
                              {lang === 'geo' ? 'GW1 → GW2:' : 'GW1 → GW2:'}
                            </strong>{' '}
                            {lang === 'geo'
                              ? 'დაიწყეთ GW1 1 FT-ით. თუ არ გამოიყენეთ, GW2-ში იწყებთ 2 უფასო ტრანსფერით!'
                              : 'Start GW1 with 1 FT. Use none: start GW2 with 2 free transfers!'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>
                            <strong className="text-slate-800 dark:text-slate-200">
                              {lang === 'geo' ? 'GW2 → GW3:' : 'GW2 → GW3:'}
                            </strong>{' '}
                            {lang === 'geo'
                              ? 'დაიწყეთ GW2 2 FT-ით. თუ არ გამოიყენეთ, GW3-ში იწყებთ 3 უფასო ტრანსფერით!'
                              : 'Start GW2 with 2 FT. Use none: start GW3 with 3 free transfers!'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>
                            <strong className="text-slate-800 dark:text-slate-200">
                              {lang === 'geo' ? '3 FT ლიმიტი:' : '3 FT Cap:'}
                            </strong>{' '}
                            {lang === 'geo'
                              ? 'დაიწყეთ ტური 3 FT-ით. თუ არცერთს არ გამოიყენებთ, მომდევნო ტურშიც დარჩება 3 FT (ლიმიტი).'
                              : 'Start a gameweek with 3 FT. Use none: remain capped at 3 for the next gameweek.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sky-500 font-bold">•</span>
                          <span>
                            <strong className="text-slate-800 dark:text-slate-200">
                              {lang === 'geo' ? '2 ტრანსფერის გაკეთება:' : 'Making 2 Transfers:'}
                            </strong>{' '}
                            {lang === 'geo'
                              ? 'თუ გაქვთ 2 FT და შეცვლით 2 მოთამაშეს — ორივე ტრანსფერი უფასოა (0 ჯარიმა) და დაგრჩებათ 0 FT.'
                              : 'Start with 2 FT and make 2 transfers: finish with 0 FT remaining and 0 point penalty.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>
                            <strong className="text-slate-800 dark:text-slate-200">
                              {lang === 'geo' ? 'ჯარიმა (Hits):' : 'Penalties (Hits):'}
                            </strong>{' '}
                            {lang === 'geo'
                              ? 'თუ გაქვთ 1 FT და შეცვლით 3 მოთამაშეს — 1 უფასოა, დარჩენილი 2 კი დაჯარიმდება -4 და -4 ქულით = სულ -8 ქულა.'
                              : 'Start with 1 FT and make 3 transfers: 1 free, 2 excess at -4 pts each = -8 total overall points.'}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                /* Updates History Tab */
                <div className="space-y-6">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {lang === 'geo' ? 'ვებსაიტის განახლებები & ცვლილებები' : 'Website Updates & Changelog'}
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        {lang === 'geo'
                          ? 'აქ შეგიძლიათ გაეცნოთ ტურნირის წესების, ქულებისა და ფუნქციების ყველა სიახლეს.'
                          : 'Explore all updates, scoring adjustments, and tournament features in chronological order.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {UPDATE_NOTES.map((release, idx) => (
                      <div
                        key={release.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          idx === 0
                            ? 'bg-emerald-50/60 dark:bg-slate-900 border-emerald-500/30 ring-1 ring-emerald-500/20'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                idx === 0
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                              }`}
                            >
                              {lang === 'geo' ? release.tagKa : release.tagEn} • {release.version}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              {release.date}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight mb-1">
                          {lang === 'geo' ? release.titleKa : release.titleEn}
                        </h3>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                          {lang === 'geo' ? release.summaryKa : release.summaryEn}
                        </p>

                        <div className="space-y-2">
                          {release.items.map((item) => {
                            const isExpanded = expandedItemId === item.id;
                            const isStandout = item.highlight;

                            return (
                              <div
                                key={item.id}
                                className={`rounded-xl border transition-all overflow-hidden ${
                                  isStandout
                                    ? 'bg-gradient-to-r from-sky-50 via-white to-sky-50/40 dark:from-sky-950/30 dark:via-slate-900 dark:to-indigo-950/20 border-sky-300 dark:border-sky-400/40 shadow-xs'
                                    : isExpanded
                                    ? 'bg-emerald-50/50 dark:bg-slate-900/90 border-emerald-300 dark:border-emerald-500/30'
                                    : 'bg-slate-50/80 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800/80 hover:border-sky-300 dark:hover:border-slate-700'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setExpandedItemId(prev => prev === item.id ? null : item.id)}
                                  className="w-full p-2.5 sm:p-3 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className={`p-1.5 rounded-lg border shrink-0 ${
                                      isStandout ? 'bg-sky-500/15 border-sky-400/40 text-sky-600 dark:text-sky-400' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                                    }`}>
                                      {renderItemIcon(item.icon)}
                                    </div>
                                    <span className={`font-bold text-xs truncate ${isStandout ? 'text-sky-950 dark:text-sky-200' : 'text-slate-800 dark:text-slate-200'}`}>
                                      {lang === 'geo' ? item.titleKa : item.titleEn}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                                      isStandout ? 'bg-sky-100 text-sky-700 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-400/30' : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                      {lang === 'geo' ? item.badgeKa : item.badgeEn}
                                    </span>
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                        isExpanded ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                                      }`}
                                    />
                                  </div>
                                </button>

                                <AnimatePresence initial={false}>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.18, ease: 'easeInOut' }}
                                    >
                                      <div className="px-3 pb-3 pt-0 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-slate-800/40 font-sans">
                                        {lang === 'geo' ? item.descriptionKa : item.descriptionEn}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors shadow-sm cursor-pointer"
              >
                {lang === 'geo' ? 'გასაგებია' : 'Got It'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
