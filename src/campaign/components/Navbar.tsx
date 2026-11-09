import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  CheckSquare,
  FolderOpen,
  MoreHorizontal,
  Sun,
  Moon,
  Shield,
  LogIn,
  LogOut,
  User,
  Compass,
  MessageSquare,
  Rocket,
  Info,
  X,
  Play
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';

export type ActiveTab =
  | 'home'
  | 'calendar'
  | 'homework'
  | 'materials'
  | 'opportunities'
  | 'ideas'
  | 'clubs'
  | 'about';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenVideo?: () => void;
}

const DESKTOP_NAV_LINKS: { id: ActiveTab; label: string }[] = [
  { id: 'home', label: 'მთავარი' },
  { id: 'calendar', label: 'კალენდარი' },
  { id: 'homework', label: 'დავალებები & ცხრილი' },
  { id: 'materials', label: 'მასალები' },
  { id: 'opportunities', label: 'შესაძლებლობები' },
  { id: 'ideas', label: 'იდეები' },
  { id: 'clubs', label: 'კლუბები' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme,
  onOpenVideo,
}) => {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const { user, isAdmin, pendingCounts, openAuthModal, openAdminModal, logout } = usePlatform();

  const handleNavClick = (id: ActiveTab) => {
    soundEffects.click();
    onSelectTab(id);
    setIsMoreSheetOpen(false);
  };

  const getActiveTabTitle = (): string => {
    switch (activeTab) {
      case 'home':
        return 'მთავარი';
      case 'calendar':
        return 'კალენდარი';
      case 'homework':
        return 'დავალებები & ცხრილი';
      case 'materials':
        return 'სასწავლო მასალები';
      case 'opportunities':
        return 'შესაძლებლობები';
      case 'ideas':
        return 'იდეები';
      case 'clubs':
        return 'კლუბები & ჯგუფები';
      case 'about':
        return 'პლატფორმის შესახებ';
      default:
        return '11/5 კლასი';
    }
  };

  return (
    <>
      {/* =========================================================================
          DESKTOP & MOBILE TOP HEADER
          ========================================================================= */}
      <header className="sticky top-0 z-40 w-full glass-nav transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer shrink-0"
            aria-label="მთავარ გვერდზე გადასვლა"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-sm shadow-indigo-600/20 group-hover:bg-indigo-500 transition-colors">
              11/5
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>კომაროვი</span>
                <span className="hidden sm:inline text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  • 11/5 კლასი
                </span>
              </span>
            </div>
          </button>

          {/* Mobile Current Section Title (Center) */}
          <div className="lg:hidden text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
            {getActiveTabTitle()}
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl glass-pill">
            {DESKTOP_NAV_LINKS.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer relative whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-label={theme === 'dark' ? 'ღია თემაზე გადართვა' : 'მუქ თემაზე გადართვა'}
              title={theme === 'dark' ? 'ღია თემა' : 'მუქი თემა'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Admin Badge & Quick Access (If Admin) */}
            {isAdmin && (
              <button
                onClick={() => openAdminModal('approvals')}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-300 border border-amber-400/30 text-xs font-semibold hover:bg-amber-400/25 transition-colors cursor-pointer"
                title="ადმინ პანელი"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>ადმინი</span>
                {pendingCounts.total > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingCounts.total}
                  </span>
                )}
              </button>
            )}

            {/* User Session Profile Pill or Sign In Button */}
            {user ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openAdminModal('users')}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-medium hover:bg-slate-200 dark:hover:bg-white/15 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="აქაუნთი"
                >
                  <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="max-w-[100px] truncate">{user.fullName || user.username}</span>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="გამოსვლა"
                  aria-label="გამოსვლა"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>შესვლა</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE BOTTOM TAB BAR (iOS Style Liquid Glass)
          ========================================================================= */}
      <nav
        aria-label="მობილური ნავიგაცია"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-sheet pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors"
      >
        <div className="grid grid-cols-5 h-14 max-w-md mx-auto px-2">
          {/* Tab 1: Home */}
          <button
            onClick={() => handleNavClick('home')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              activeTab === 'home'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px]">მთავარი</span>
          </button>

          {/* Tab 2: Calendar */}
          <button
            onClick={() => handleNavClick('calendar')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              activeTab === 'calendar'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px]">კალენდარი</span>
          </button>

          {/* Tab 3: Homework & Timetable */}
          <button
            onClick={() => handleNavClick('homework')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              activeTab === 'homework'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="text-[10px]">დავალებები</span>
          </button>

          {/* Tab 4: Materials / Archive */}
          <button
            onClick={() => handleNavClick('materials')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              activeTab === 'materials'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-[10px]">მასალები</span>
          </button>

          {/* Tab 5: More */}
          <button
            onClick={() => {
              soundEffects.click();
              setIsMoreSheetOpen(true);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer relative ${
              isMoreSheetOpen ||
              activeTab === 'opportunities' ||
              activeTab === 'ideas' ||
              activeTab === 'clubs' ||
              activeTab === 'about'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-[10px]">მეტი</span>
            {isAdmin && pendingCounts.total > 0 && (
              <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>
      </nav>

      {/* =========================================================================
          MOBILE "MORE" ACTION SHEET (iOS Fluid Gesture Sheet)
          ========================================================================= */}
      <AnimatePresence>
        {isMoreSheetOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreSheetOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 38 }}
              className="relative z-10 glass-sheet rounded-t-3xl p-5 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Handle Capsule */}
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  სხვა განყოფილებები
                </span>
                <button
                  onClick={() => setIsMoreSheetOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleNavClick('opportunities')}
                  className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-left flex flex-col gap-1.5 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    შესაძლებლობები
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Zoom ალუმნებთან
                  </span>
                </button>

                <button
                  onClick={() => handleNavClick('ideas')}
                  className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-left flex flex-col gap-1.5 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    იდეების დაფა
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    წინადადებები & ხმები
                  </span>
                </button>

                <button
                  onClick={() => handleNavClick('clubs')}
                  className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-left flex flex-col gap-1.5 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Rocket className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    კლუბები & ჯგუფები
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    სივრცეები & მეცადინეობა
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    if (onOpenVideo) onOpenVideo();
                  }}
                  className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-left flex flex-col gap-1.5 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Play className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    რატომ ავირჩიოთ
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    ვიდეო მიმართვა
                  </span>
                </button>
              </div>

              {/* Admin Dashboard Entry in More menu */}
              {isAdmin && (
                <div className="pt-2 border-t border-slate-200/70 dark:border-white/10">
                  <button
                    onClick={() => {
                      setIsMoreSheetOpen(false);
                      openAdminModal('approvals');
                    }}
                    className="w-full p-3 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-500" />
                      <span>ადმინ პანელი (დადასტურებები & მართვა)</span>
                    </div>
                    {pendingCounts.total > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                        {pendingCounts.total}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
