import React, { useRef, useState, useTransition, useCallback } from 'react';
import { useFPL, TabType } from '../../context/FPLContext';
import { Shirt, ArrowLeftRight, Trophy, Calendar, Wrench, Shield, Users, Award } from 'lucide-react';
import { motion, PanInfo, useMotionValue, useTransform, useSpring } from 'framer-motion';
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
  const [, startTransition] = useTransition();
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const visibleTabs = TABS.filter((tab) => tab.id !== 'dev' || isModerator || isReferee);
  const activeIndex = visibleTabs.findIndex((tab) => tab.id === activeTab);

  // Dynamic Island Elastic Stretch: Motion values tied to pan offset
  const panOffset = useMotionValue(0);
  const [originX, setOriginX] = useState<'0% 50%' | '100% 50%' | '50% 50%'>('50% 50%');

  // Stretch width organically when pulled (scaleX from 1.0 up to ~1.2)
  const rawScaleX = useTransform(panOffset, [-60, 0, 60], [1.2, 1, 1.2]);
  const springScaleX = useSpring(rawScaleX, {
    stiffness: 500,
    damping: 30,
    mass: 0.5,
  });

  const handleTabChange = useCallback(
    (tabId: TabType) => {
      if (tabId === activeTab) return;
      triggerHaptic('light');
      startTransition(() => {
        setActiveTab(tabId);
      });
    },
    [activeTab, setActiveTab]
  );

  // Real-time tab hit detection: instantly triggers the millisecond finger crosses boundary
  const checkTabAtX = useCallback(
    (clientX: number) => {
      for (let i = 0; i < visibleTabs.length; i++) {
        const el = tabRefs.current[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (clientX >= rect.left && clientX <= rect.right) {
            if (visibleTabs[i].id !== activeTab) {
              handleTabChange(visibleTabs[i].id);
            }
            break;
          }
        }
      }
    },
    [visibleTabs, activeTab, handleTabChange]
  );

  const handlePan = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // 1. Instant tab boundary check
      checkTabAtX(info.point.x);

      // 2. Dynamic Island stretch & origin anchoring
      panOffset.set(info.offset.x);
      if (info.delta.x > 0.5) {
        setOriginX('0% 50%'); // Anchor left, stretch right
      } else if (info.delta.x < -0.5) {
        setOriginX('100% 50%'); // Anchor right, stretch left
      }
    },
    [checkTabAtX, panOffset]
  );

  const handlePanEnd = useCallback(() => {
    // Snap organically back to normal width with tight spring
    panOffset.set(0);
    setOriginX('50% 50%');
  }, [panOffset]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const touch = e.touches[0];
      if (touch) {
        checkTabAtX(touch.clientX);
      }
    },
    [checkTabAtX]
  );

  // Dynamic corner radius for active highlight to match outer rounded-2xl
  const getIndicatorCornerRadius = (idx: number) => {
    if (idx === 0) return 'rounded-l-[14px] rounded-r-lg';
    if (idx === visibleTabs.length - 1) return 'rounded-r-[14px] rounded-l-lg';
    return 'rounded-xl';
  };

  return (
    <div className="md:hidden fixed bottom-[max(0.6rem,env(safe-area-inset-bottom))] inset-x-3 max-w-md mx-auto z-40 select-none">
      <motion.nav
        ref={navRef}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePanEnd}
        style={{ touchAction: 'none' }}
        className="relative w-full rounded-2xl bg-[#070b12]/95 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1.5 flex items-center justify-between overflow-hidden touch-none"
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
              className={`relative flex-1 py-1.5 px-1 flex flex-col items-center justify-center transition-all group z-10 cursor-pointer ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Tab Highlight: Dynamic Island Organic Spring Morph */}
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  style={{
                    scaleX: springScaleX,
                    transformOrigin: originX,
                    willChange: 'transform',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                    mass: 0.5,
                  }}
                  className={`absolute inset-0 bg-white/15 border border-white/20 shadow-xs pointer-events-none z-0 ${getIndicatorCornerRadius(
                    idx
                  )}`}
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
      </motion.nav>
    </div>
  );
};
