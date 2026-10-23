import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Lock } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

export type ActiveTab = 'hero' | 'calendar' | 'quiz' | 'homework' | 'opportunities' | 'ideas' | 'clubs';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const NAV_LINKS: {
  id: ActiveTab;
  label: string;
  isUrgentQuiz?: boolean;
  caption?: string;
  isLocked?: boolean;
}[] = [
  { id: 'hero', label: 'მთავარი' },
  { id: 'calendar', label: 'კალენდარი' },
  { id: 'quiz', label: 'ქვიზი', isUrgentQuiz: true, caption: 'ორშაბათი' },
  { id: 'homework', label: 'დავალებები', isLocked: true },
  { id: 'opportunities', label: 'შესაძლებლობები', isLocked: true },
  { id: 'ideas', label: 'იდეები', isLocked: true },
  { id: 'clubs', label: 'კლუბები', isLocked: true }
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleClick = (id: ActiveTab) => {
    soundEffects.click();
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[#12131d]/80 border-b border-[#f5f2eb]/12 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => handleClick('hero')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-6 h-6 rounded-md bg-[#f5f2eb]/15 border border-[#f5f2eb]/20 flex items-center justify-center text-xs font-mono font-bold text-[#fcfbf7] group-hover:bg-[#f5f2eb] group-hover:text-[#0c0d12] transition-colors">
            11
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#fcfbf7] group-hover:text-white transition-colors">
            11/5 Direction
          </span>
        </button>

        {/* Crisp Georgian Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-[#171825]/60 border border-[#f5f2eb]/10 backdrop-blur-xl">
          {NAV_LINKS.map(link => {
            const isActive = activeTab === link.id;
            if (link.isUrgentQuiz) {
              return (
                <button
                  key={link.id}
                  onClick={() => handleClick(link.id)}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] ring-1 ring-red-300'
                      : 'bg-red-500/20 text-red-200 border border-red-500/50 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  <span>{link.label}</span>
                  {link.caption && (
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full tracking-tight ${
                        isActive
                          ? 'bg-black/30 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {link.caption}
                    </span>
                  )}
                </button>
              );
            }

            return (
              <button
                key={link.id}
                onClick={() => handleClick(link.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#0c0d12] font-semibold bg-[#f5f2eb] shadow-sm'
                    : 'text-[#c7c4b5] hover:text-[#fcfbf7] hover:bg-white/5'
                }`}
              >
                <span>{link.label}</span>
                {link.isLocked && (
                  <Lock className="w-3 h-3 opacity-60" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Theme Switch & Subtle Signature */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              soundEffects.click();
              onToggleTheme();
            }}
            title={theme === 'dark' ? 'ნათელ რეჟიმზე გადართვა' : 'მუქ რეჟიმზე გადართვა'}
            aria-label={theme === 'dark' ? 'ნათელ რეჟიმზე გადართვა' : 'მუქ რეჟიმზე გადართვა'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#171825]/70 hover:bg-[#202235]/85 border border-[#f5f2eb]/15 text-xs font-medium text-[#fcfbf7] backdrop-blur-xl transition-all cursor-pointer shadow-sm"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#f5f2eb]" />
                <span className="hidden sm:inline text-[11px]">ნათელი</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#fcfbf7]" />
                <span className="hidden sm:inline text-[11px]">მუქი</span>
              </>
            )}
          </button>

          <span className="hidden lg:inline-block text-[10px] font-mono text-[#7c796e]/75 tracking-wide select-none">
            made by Theiulius
          </span>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-[#dedacb] hover:text-white cursor-pointer"
            aria-label="მენიუს გახსნა"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[#f5f2eb]/10 bg-[#12131d]/95 backdrop-blur-2xl px-4 py-3 space-y-1"
          >
            {NAV_LINKS.map(link => {
              const isActive = activeTab === link.id;
              if (link.isUrgentQuiz) {
                return (
                  <button
                    key={link.id}
                    onClick={() => handleClick(link.id)}
                    className={`w-full text-left py-2.5 px-3 rounded-lg text-sm font-bold transition-colors cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.5)]'
                        : 'bg-red-500/20 border border-red-500/45 text-red-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      <span>{link.label}</span>
                    </span>
                    {link.caption && (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-red-500 text-white">
                        {link.caption}
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={link.id}
                  onClick={() => handleClick(link.id)}
                  className={`w-full text-left py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-[#f5f2eb] text-[#0c0d12] font-semibold'
                      : 'text-[#d4d1c5] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.isLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono opacity-70">
                      <Lock className="w-3 h-3" />
                      <span>COMING SOON</span>
                    </span>
                  )}
                </button>
              );
            })}
            <div className="pt-2 px-3 text-[10px] font-mono text-[#7c796e]/70 select-none">
              &copy; made by Theiulius
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
