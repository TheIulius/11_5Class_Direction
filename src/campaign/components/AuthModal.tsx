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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={closeAuthModal}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {mode === 'login' ? 'აქაუნთზე შესვლა' : 'კლასელის რეგისტრაცია'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                11/5 კლასის ციფრული პლატფორმა • კომაროვი
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="ფანჯრის დახურვა"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'login'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
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
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'register'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ახალი აქაუნთი
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950 leading-relaxed">
            {mode === 'login' ? (
              <>
                საიტის დათვალიერება უფასო და ღიაა ყველასთვის, ხოლო აქაუნთით შეძლებთ{' '}
                <span className="font-bold">კომენტარების დატოვებას</span>,{' '}
                <span className="font-bold">კონსპექტების/დავალებების ატვირთვას</span> და{' '}
                <span className="font-bold">ადმინ პანელის</span> მართვას.
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
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="signin-username"
                className="block text-xs font-bold text-slate-700 mb-1.5"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="signin-password"
                className="block text-xs font-bold text-slate-700 mb-1.5"
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
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'პაროლის დამალვა' : 'პაროლის გამოჩენა'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl btn-primary disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                className="block text-xs font-bold text-slate-700 mb-1.5"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-action)]"
              />
            </div>

            <div>
              <label
                htmlFor="signup-username"
                className="block text-xs font-bold text-slate-700 mb-1.5"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-action)] font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-bold text-slate-700 mb-1.5"
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
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-action)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'პაროლის დამალვა' : 'პაროლის გამოჩენა'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl btn-primary disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'იქმნება აქაუნთი...' : '11/5 აქაუნთის რეგისტრაცია'}
            </button>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            ადმინებისთვის: შეიყვანეთ სპეციალური ადმინ-აქაუნთი
          </span>
        </div>
      </div>
    </div>
  );
};
