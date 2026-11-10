import React, { useState, useEffect } from 'react';
import { X, Shield, UserPlus, LogIn, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalInitialMode, closeAuthModal, login, register } = usePlatform();
  const [mode, setMode] = useState<'login' | 'register'>(authModalInitialMode);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(authModalInitialMode);
    setError(null);
  }, [authModalInitialMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('გთხოვთ შეავსოთ მომხმარებლის სახელი და პაროლი.');
      return;
    }
    setIsSubmitting(true);
    const res = await login(username.trim(), password);
    setIsSubmitting(false);
    if (!res.success) {
      setError(res.error || 'შესვლა ვერ მოხერხდა.');
    } else {
      setPassword('');
      closeAuthModal();
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !fullName.trim() || !password) {
      setError('გთხოვთ შეავსოთ ყველა სავალდებულო ველი.');
      return;
    }
    if (password.length < 4) {
      setError('პაროლი უნდა შედგებოდეს მინიმუმ 4 სიმბოლოსგან.');
      return;
    }
    setIsSubmitting(true);
    const res = await register(username.trim(), fullName.trim(), password);
    setIsSubmitting(false);
    if (!res.success) {
      setError(res.error || 'რეგისტრაცია ვერ მოხერხდა.');
    } else {
      setPassword('');
      closeAuthModal();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={closeAuthModal}
    >
      <div
        className="card-surface rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[var(--border-subtle)] relative overflow-hidden text-[var(--text-primary)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl btn-primary text-white flex items-center justify-center shadow-md">
              {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)]">
                {mode === 'login' ? 'აქაუნთზე შესვლა' : 'კლასელის რეგისტრაცია'}
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                11/5 კლასის ციფრული პლატფორმა • კომაროვი
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="დახურვა"
            className="w-11 h-11 min-w-[44px] min-h-[44px] -mr-2 -mt-2 rounded-full card-third hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 card-third rounded-xl mb-5 border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`min-h-[44px] py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              mode === 'login'
                ? 'card-surface text-[var(--primary-action)] font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            შესვლა (მოსწავლე / ადმინი)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`min-h-[44px] py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              mode === 'register'
                ? 'card-surface text-[var(--primary-action)] font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            ახალი აქაუნთი
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-[var(--primary-action-light)] border border-[var(--primary-action)]/20 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[var(--primary-action)] shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {mode === 'login' ? (
              <>
                საიტის დათვალიერება უფასო და ღიაა ყველასთვის, ხოლო აქაუნთით შეძლებთ{' '}
                <span className="font-bold text-[var(--text-primary)]">კომენტარების დატოვებას</span>,{' '}
                <span className="font-bold text-[var(--text-primary)]">კონსპექტების/დავალებების ატვირთვას</span> და{' '}
                <span className="font-bold text-[var(--text-primary)]">ადმინ პანელის</span> მართვას.
              </>
            ) : (
              <>
                შექმენი შენი კლასელის პროფილი 10 წამში — ატვირთე შემაჯამებლის კონსპექტები, დაამატე
                დავალებები და დატოვე კომენტარები ნებისმიერ აქტივობაზე!
              </>
            )}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="signin-username"
                className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5"
              >
                მომხმარებლის სახელი (Username)
              </label>
              <input
                id="signin-username"
                name="username"
                type="text"
                autoComplete="username"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="მაგ: nika115 ან admin"
                className="w-full px-3.5 py-3 rounded-xl card-third border border-[var(--border-subtle)] text-base sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)] min-h-[46px]"
              />
            </div>

            <div>
              <label
                htmlFor="signin-password"
                className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5"
              >
                პაროლი
              </label>
              <div className="relative">
                <input
                  id="signin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="შეიყვანეთ პაროლი"
                  className="w-full pl-3.5 pr-12 py-3 rounded-xl card-third border border-[var(--border-subtle)] text-base sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)] min-h-[46px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'პაროლის დამალვა' : 'პაროლის გამოჩენა'}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 min-h-[46px] rounded-xl btn-primary disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'მიმდინარეობს შესვლა...' : 'შესვლა'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="signup-fullname"
                className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5"
              >
                სახელი და გვარი (11/5 კლასელი)
              </label>
              <input
                id="signup-fullname"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="მაგ: ნიკოლოზ ბერიძე"
                className="w-full px-3.5 py-3 rounded-xl card-third border border-[var(--border-subtle)] text-base sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)] min-h-[46px]"
              />
            </div>

            <div>
              <label
                htmlFor="signup-username"
                className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5"
              >
                მომხმარებლის სახელი (Username)
              </label>
              <input
                id="signup-username"
                name="username"
                type="text"
                autoComplete="username"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="მაგ: nika_b"
                className="w-full px-3.5 py-3 rounded-xl card-third border border-[var(--border-subtle)] text-base sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)] min-h-[46px] font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5"
              >
                პაროლი (მინიმუმ 4 სიმბოლო)
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={4}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="შექმენით პაროლი"
                  className="w-full pl-3.5 pr-12 py-3 rounded-xl card-third border border-[var(--border-subtle)] text-base sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)] min-h-[46px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'პაროლის დამალვა' : 'პაროლის გამოჩენა'}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 min-h-[46px] rounded-xl btn-primary disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'იქმნება აქაუნთი...' : '11/5 აქაუნთის რეგისტრაცია'}
            </button>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="w-3.5 h-3.5 text-[var(--primary-action)]" />
            ადმინებისთვის: შეიყვანეთ სპეციალური ადმინ-აქაუნთი
          </span>
        </div>
      </div>
    </div>
  );
};
