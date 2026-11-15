import React from 'react';
import { Lock, UserPlus, LogIn } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { TapeStrip } from './NotebookDecorations';

interface GuestBlurGateProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const GuestBlurGate: React.FC<GuestBlurGateProps> = ({
  children,
  title = 'დარეგისტრირდი!',
  subtitle = 'დავალებების, შემაჯამებლების, ცხრილისა და სასწავლო მასალების სანახავად გაიარე სწრაფი რეგისტრაცია ან შედი აქაუნთზე.',
}) => {
  const { user, openAuthModal } = usePlatform();

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[340px]">
      {/* Blurred underlying content (non-interactive and inert for keyboard/AT) */}
      <div
        {...({ inert: '' } as any)}
        aria-hidden="true"
        onClick={() => openAuthModal('register')}
        className="select-none pointer-events-none filter blur-[7px] opacity-75 transition-all duration-200"
      >
        {children}
      </div>

      {/* Clickable overlay & sticky centered Notebook registration prompt */}
      <div
        onClick={() => openAuthModal('register')}
        className="absolute inset-0 z-20 flex items-start justify-center pt-8 sm:pt-16 px-4 bg-gradient-to-b from-transparent via-[var(--bg-page)]/25 to-[var(--bg-page)]/50 cursor-pointer"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="sticky top-24 w-full max-w-md card-surface nb-noticeboard-card p-6 sm:p-7 text-center space-y-4 cursor-default shadow-xl"
        >
          <TapeStrip tilt="left" />

          <div className="w-12 h-12 mx-auto rounded-2xl btn-primary text-white flex items-center justify-center shadow-sm">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-xl btn-primary text-white text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>დარეგისტრირდი!</span>
            </button>

            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl card-surface border-2 border-[var(--border-subtle)] text-[var(--text-primary)] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 hover:border-[var(--primary-action)] cursor-pointer"
            >
              <LogIn className="w-4 h-4 shrink-0 text-[var(--primary-action)]" />
              <span>შესვლა</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
