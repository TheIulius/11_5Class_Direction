import React, { useRef, useCallback } from 'react';
import { useFPL, TabType } from '../../context/FPLContext';
import { Shirt, ArrowLeftRight, Trophy, Calendar, Wrench, Shield, Users, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

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
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const isPointerDownRef = useRef(false);

  const visibleTabs = TABS.filter((tab) => tab.id !== 'dev' || isModerator || isReferee);

  const handleTabChange = useCallback(
    (tabId: TabType) => {
      if (tabId === activeTabRef.current) return;
      activeTabRef.current = tabId;
      triggerHaptic('light');
      setActiveTab(tabId);
    },
    [setActiveTab]
  );

  // Real-time tab hit detection: instantly triggers the millisecond finger crosses boundary
  const checkTabAtX = useCallback(
    (clientX: number) => {
      for (let i = 0; i < visibleTabs.length; i++) {
        const el = tabRefs.current[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (clientX >= rect.left && clientX <= rect.right) {
            const targetId = visibleTabs[i].id;
            if (targetId !== activeTabRef.current) {
              activeTabRef.current = targetId;
              triggerHaptic('light');
              setActiveTab(targetId);
            }
            break;
          }
        }
      }
    },
    [visibleTabs, setActiveTab]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const touch = e.touches[0];
      if (touch) {
        checkTabAtX(touch.clientX);
      }
    },
    [checkTabAtX]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button === 0) {
      isPointerDownRef.current = true;
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (isPointerDownRef.current && e.buttons === 1) {
        checkTabAtX(e.clientX);
      }
    },
    [checkTabAtX]
  );

  const handlePointerUp = useCallback(() => {
    isPointerDownRef.current = false;
  }, []);

  return (
    <div className="md:hidden fixed bottom-[max(0.6rem,env(safe-area-inset-bottom))] inset-x-3 max-w-md mx-auto z-40 select-none">
      <nav
        ref={navRef}
        onTouchMove={handleTouchMove}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'pan-y' }}
        className="relative w-full rounded-2xl bg-[#070b12]/95 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1.5 flex items-center justify-between overflow-hidden"
      >
        {visibleTabs.map((tab, idx) => {
          const isDev = tab.id === 'dev';
          const Icon = isDev ? (isModerator ? Shield : Award) : tab.icon;
          const isActive = activeTab === tab.id;
          const displayLabel = isDev ? (isModerator ? 'Mod' : 'Ref') : tab.label;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex-1 py-1.5 px-1 flex flex-col items-center justify-center transition-colors group z-10 cursor-pointer ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Tab Highlight: Snappy 60fps Morph with uniform rounded-xl corners */}
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  transition={{
                    type: 'spring',
                    stiffness: 450,
                    damping: 32,
                    mass: 0.6,
                  }}
                  style={{ willChange: 'transform' }}
                  className="absolute inset-0 bg-white/15 border border-white/20 shadow-xs pointer-events-none z-0 rounded-xl"
                />
              )}

              <div className="relative flex items-center justify-center pointer-events-none z-10">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {isDev && (isDevAuthenticated || isReferee) && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </div>

              <span
                className={`text-[9.5px] mt-0.5 tracking-tight truncate max-w-[50px] leading-tight transition-colors pointer-events-none z-10 ${
                  isActive ? 'font-bold text-white' : 'font-medium text-slate-400'
                }`}
              >
                {displayLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
