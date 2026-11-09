import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Shield, LogIn, LogOut, Archive, User } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { recordQuizClick } from '../services/analytics';
import { usePlatform } from '../context/PlatformContext';

export type ActiveTab =
  | 'hero'
  | 'calendar'
  | 'homework'
  | 'opportunities'
  | 'ideas'
  | 'clubs'
  | 'archive'
  | 'quiz';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const NAV_LINKS: {
  id: ActiveTab;
  label: string;
  isArchive?: boolean;
}[] = [
  { id: 'hero', label: 'მთავარი' },
  { id: 'calendar', label: 'კალენდარი' },
  { id: 'homework', label: 'დავალებები & ცხრილი' },
  { id: 'opportunities', label: 'შესაძლებლობები' },
  { id: 'ideas', label: 'იდეები' },
  { id: 'clubs', label: 'კლუბები' },
  { id: 'archive', label: 'არქივი (ქვიზი)', isArchive: true },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, pendingCounts, openAuthModal, openAdminModal, logout } = usePlatform();

  const handleClick = (id: ActiveTab) => {
    soundEffects.click();
    if (id === 'archive' || id === 'quiz') {
      recordQuizClick();
    }
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[#12131d]/90 border-b border-[#f5f2eb]/12 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <button
          onClick={() => handleClick('hero')}
          className="flex items-center gap-2 text-left group cursor-pointer shrink-0"
        >
          <div className="w-6 h-6 rounded-md bg-[#f5f2eb]/15 border border-[#f5f2eb]/20 flex items-center justify-center text-xs font-mono font-bold text-[#fcfbf7] group-hover:bg-[#f5f2eb] group-hover:text-[#0c0d12] transition-colors">
            11
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#fcfbf7] group-hover:text-white transition-colors flex items-center">
            <span className="inline-flex items-end">
              <span>11/5</span>
              <span className="text-[9px] font-bold lowercase tracking-tight leading-none ml-0.5 mb-0.5">
                class
              </span>
            </span>
            <span className="ml-1.5 hidden sm:inline">Platform</span>
          </span>
        </button>

        {/* Crisp Georgian Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-[#171825]/60 border border-[#f5f2eb]/10 backdrop-blur-xl">
          {NAV_LINKS.map((link) => {
            const isActive =
              activeTab === link.id || (link.id === 'archive' && activeTab === 'quiz');
            return (
              <button
                key={link.id}
                onClick={() => handleClick(link.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#f5f2eb] text-[#0c0d12] font-bold shadow-sm'
                    : link.isArchive
                    ? 'text-amber-300 hover:text-amber-200 hover:bg-[#f5f2eb]/10'
                    : 'text-[#f5f2eb]/70 hover:text-[#fcfbf7] hover:bg-[#f5f2eb]/10'
                }`}
              >
                {link.isArchive && <Archive className="w-3.5 h-3.5" />}
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Side: Account / Admin Controls + Theme Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => openAdminModal('approvals')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ადმინ პანელი</span>
              {pendingCounts.total > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
                  {pendingCounts.total}
                </span>
              )}
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-1.5 bg-[#171825]/80 border border-[#f5f2eb]/15 rounded-xl px-2.5 py-1">
              <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-[#fcfbf7] max-w-[100px] sm:max-w-[130px] truncate">
                {user.fullName}
              </span>
              <button
                type="button"
                onClick={logout}
                title="აქაუნთიდან გასვლა"
                className="p-1 rounded-lg text-[#f5f2eb]/60 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>შესვლა</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => {
              soundEffects.click();
              onToggleTheme();
            }}
            aria-label={theme === 'dark' ? 'ნათელ რეჟიმზე გადართვა' : 'მუქ რეჟიმზე გადართვა'}
            className="w-8 h-8 rounded-lg bg-[#171825]/80 border border-[#f5f2eb]/15 flex items-center justify-center text-[#f5f2eb]/80 hover:text-[#fcfbf7] hover:bg-[#f5f2eb]/10 transition-all cursor-pointer"
            title={theme === 'dark' ? 'ნათელი რეჟიმი' : 'მუქი რეჟიმი'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-200" />
            )}
          </button>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#f5f2eb]/70 hover:text-[#fcfbf7] hover:bg-[#f5f2eb]/10 transition-colors"
              aria-label="მენიუს გახსნა"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-b border-[#f5f2eb]/10 bg-[#12131d]/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const isActive =
                  activeTab === link.id || (link.id === 'archive' && activeTab === 'quiz');
                return (
                  <button
                    key={link.id}
                    onClick={() => handleClick(link.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                      isActive
                        ? 'bg-[#f5f2eb] text-[#0c0d12] font-bold'
                        : 'text-[#f5f2eb]/75 hover:text-[#fcfbf7] hover:bg-[#f5f2eb]/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {link.isArchive && <Archive className="w-4 h-4 text-amber-400" />}
                      {link.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
