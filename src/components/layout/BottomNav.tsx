import React from 'react';
import { useFPL, TabType } from '../../context/FPLContext';
import { Shirt, ArrowLeftRight, Zap, Trophy, Calendar, Wrench, Shield, Users, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'team', label: 'Team', icon: Shirt },
  { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'standings', label: 'Standings', icon: Trophy },
  { id: 'fixtures', label: 'Fixtures', icon: Calendar },
  { id: 'dev', label: 'Dev', icon: Wrench },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, isDevAuthenticated, isModerator, isReferee } = useFPL();

  const visibleTabs = TABS.filter((tab) => tab.id !== 'dev' || isModerator || isReferee);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0a0f1a]/95 backdrop-blur-2xl border-t border-slate-200/90 dark:border-white/[0.08] shadow-[0_-8px_32px_rgba(15,23,42,0.06)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.6)] pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-1 select-none">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {visibleTabs.map((tab) => {
          const isDev = tab.id === 'dev';
          const Icon = isDev ? (isModerator ? Shield : Award) : tab.icon;
          const isActive = activeTab === tab.id;
          const displayLabel = isDev ? (isModerator ? 'Mod' : 'Ref') : tab.label;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 py-1 px-0.5 flex flex-col items-center justify-center transition-colors group z-10"
            >
              {/* Active Dock Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeDockPill"
                  className="absolute inset-0 rounded-xl bg-sky-50 border border-sky-200/80 dark:bg-white/[0.07] dark:border-white/15 shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? (isDev ? 'scale-110 text-amber-500 dark:text-amber-400' : 'scale-110 text-sky-600 dark:text-emerald-400') : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                  }`}
                />
                {isDev && (isDevAuthenticated || isReferee) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-950" />
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 tracking-tight truncate max-w-[55px] transition-colors ${
                  isActive ? (isDev ? 'font-black text-amber-600 dark:text-amber-400' : 'font-black text-sky-600 dark:text-emerald-400') : 'font-medium text-slate-500 dark:text-slate-400'
                }`}
              >
                {displayLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
