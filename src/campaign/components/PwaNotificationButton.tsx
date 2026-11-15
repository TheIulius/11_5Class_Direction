import React, { useState, useEffect, useId, useRef } from 'react';
import {
  Bell,
  BellRing,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Download,
  Sparkles,
  ShieldAlert,
  MoreVertical,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { soundEffects } from '../utils/soundEffects';

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const PwaNotificationButton: React.FC = () => {
  const { user } = usePlatform();
  const dialogId = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const installBtnRef = useRef<HTMLButtonElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Web Install API / beforeinstallprompt & device state
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [supportsWebInstall, setSupportsWebInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [guideOs, setGuideOs] = useState<'ios' | 'android'>('ios');

  const getToken = () => {
    try {
      return localStorage.getItem('class11_5_auth_token') || '';
    } catch {
      return '';
    }
  };

  // Detect standalone mode, mobile/iOS device, and Web Install API / beforeinstallprompt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      Boolean((window.navigator as any).standalone);
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent || '';
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const mobile = ios || /Android/i.test(ua);

    setIsIosDevice(ios);
    setIsMobileDevice(mobile);
    setGuideOs(ios ? 'ios' : 'android');

    const hasNativeInstall = typeof (Navigator.prototype as any).install === 'function';
    setSupportsWebInstall(hasNativeInstall);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, []);

  // Register Service Worker & sync existing PushSubscription with current user account
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        if (!('pushManager' in reg)) return;
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        if (sub) {
          setIsSubscribed(true);
          setCurrentEndpoint(sub.endpoint);
          const token = getToken();
          await fetch('/api/platform/push/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ subscription: sub.toJSON(), isStandalone }),
          }).catch(() => {});
        } else {
          setIsSubscribed(false);
          setCurrentEndpoint(null);
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, isStandalone]);

  // Record Home Screen standalone usage for logged-in user
  useEffect(() => {
    if (!isStandalone || !user?.id) return;
    const token = getToken();
    if (!token) return;
    fetch('/api/platform/push/client-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isStandalone: true }),
    }).catch(() => {});
  }, [isStandalone, user?.id]);

  // Sync native <dialog>
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (isOpen) {
      if (!dlg.open) {
        try {
          dlg.showModal();
        } catch {}
      }
    } else if (dlg.open) {
      dlg.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => setIsOpen(false);
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, []);

  const handleInstallClick = async () => {
    const btn = installBtnRef.current;
    if (btn && btn.getAttribute('aria-disabled') === 'true') return;
    btn?.setAttribute('aria-disabled', 'true');
    setErrorMsg(null);

    try {
      if (supportsWebInstall) {
        await (navigator as any).install();
        setStatusMsg('აპლიკაცია დაყენდა!');
        setIsStandalone(true);
      } else if (deferredInstallPrompt) {
        const promptEvent = deferredInstallPrompt;
        setDeferredInstallPrompt(null);
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setStatusMsg('აპლიკაცია დაემატა მთავარ ეკრანზე!');
          setIsStandalone(true);
        } else {
          setStatusMsg('ინსტალაცია გაუქმდა.');
        }
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        setStatusMsg('ინსტალაცია გაუქმდა.');
      } else {
        setErrorMsg('გამოიყენეთ ქვემოთ მოცემული ინსტრუქცია.');
      }
    } finally {
      btn?.removeAttribute('aria-disabled');
    }
  };

  const handleEnableNotifications = async () => {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        if (isIosDevice && !isStandalone) {
          setErrorMsg('iPhone-ზე ჯერ დაამატე მთავარ ეკრანზე (Share → Add to Home Screen)!');
        } else {
          setErrorMsg('ბრაუზერი არ უჭერს მხარს Push შეტყობინებებს.');
        }
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setErrorMsg('ნებართვა უარყოფილია — დაუშვი Notifications პარამეტრებიდან.');
        return;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const keyRes = await fetch('/api/platform/push/vapid-public-key');
      const keyData = await keyRes.json();
      if (!keyData?.publicKey) {
        setErrorMsg('VAPID გასაღები ვერ მოიძებნა.');
        return;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) as unknown as BufferSource,
        });
      }

      const token = getToken();
      const subRes = await fetch('/api/platform/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subscription: sub.toJSON(), isStandalone }),
      });

      if (!subRes.ok) {
        throw new Error('გამოწერის შენახვა ვერ მოხერხდა.');
      }

      setIsSubscribed(true);
      setCurrentEndpoint(sub.endpoint);
      setStatusMsg('შეტყობინებები ჩაირთო!');
    } catch (err: any) {
      if (isIosDevice && !isStandalone) {
        setErrorMsg('iPhone-ზე ჯერ დაამატე მთავარ ეკრანზე (Share → Add to Home Screen)!');
      } else {
        setErrorMsg(err?.message || 'შეტყობინებების ჩართვა ვერ მოხერხდა.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDisableNotifications = async () => {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/platform/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      setCurrentEndpoint(null);
      setStatusMsg('შეტყობინებები გამოირთო.');
    } catch {
      setErrorMsg('გამორთვა ვერ მოხერხდა.');
    } finally {
      setBusy(false);
    }
  };

  const handleSendTest = async () => {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const token = getToken();
      const res = await fetch('/api/platform/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ endpoint: currentEndpoint }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'ტესტი ვერ გაიგზავნა.');
      } else {
        setStatusMsg('ტესტ-შეტყობინება გამოიგზავნა!');
      }
    } catch {
      setErrorMsg('სერვერთან კავშირი ვერ მოხერხდა.');
    } finally {
      setBusy(false);
    }
  };

  const canOneTapInstall = !isStandalone && (supportsWebInstall || Boolean(deferredInstallPrompt));
  const isFullyProtected = isMobileDevice ? isStandalone && isSubscribed : isSubscribed;

  // Hide completely once everything required for this device is active
  if (isFullyProtected && !isOpen) {
    return null;
  }

  return (
    <>
      {!isFullyProtected && (
        <button
          type="button"
          onClick={() => {
            soundEffects.click();
            setIsOpen(true);
          }}
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl card-third flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
          title="შეტყობინებები & აპი"
          aria-label="შეტყობინებების ჩართვა და აპლიკაციის დაყენება"
        >
          {isSubscribed ? (
            <BellRing
              className="w-5 h-5 text-amber-700 dark:text-amber-300 fill-amber-400/75 dark:fill-amber-400/35"
              aria-hidden="true"
            />
          ) : (
            <Bell
              className="w-5 h-5 text-amber-700 dark:text-amber-300 fill-amber-400/75 dark:fill-amber-400/35"
              aria-hidden="true"
            />
          )}
        </button>
      )}

      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby={dialogId}
        className="fixed inset-0 m-auto w-[94vw] max-w-lg max-h-[90dvh] rounded-2xl p-0 bg-transparent border-0 overflow-visible"
      >
        <div className="card-surface nb-stationary w-full max-h-[90dvh] p-4 sm:p-5 rounded-2xl overflow-y-auto space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl btn-primary text-white flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id={dialogId}
                  className="text-base sm:text-lg font-black text-[var(--text-primary)] leading-tight"
                >
                  შეტყობინებები &amp; აპი
                </h2>
                <p className="text-[11px] text-[var(--text-muted)]">
                  მთავარ ეკრანზე დამატება
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="დახურვა"
              className="w-9 h-9 rounded-xl card-third flex items-center justify-center text-[var(--text-primary)] cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {statusMsg && (
            <div
              role="status"
              className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-start gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: Instant Push Notifications */}
          <div className="p-3.5 rounded-2xl card-third border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[var(--primary-action)]" aria-hidden="true" />
                <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
                  1. შეტყობინებები
                </h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isSubscribed
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                }`}
              >
                {isSubscribed ? 'ჩართულია ✓' : 'გამორთულია'}
              </span>
            </div>

            <p className="text-[11px] text-[var(--text-secondary)]">
              მიიღე შეტყობინება შემაჯამებლებზე, დავალებებსა და სიახლეებზე.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {!isSubscribed ? (
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  disabled={busy}
                  className="min-h-[42px] px-4 py-2 rounded-xl btn-primary text-white text-xs font-black inline-flex items-center gap-2 cursor-pointer"
                >
                  <BellRing className="w-4 h-4" aria-hidden="true" />
                  <span>{busy ? 'ირთვება...' : 'შეტყობინებების ჩართვა'}</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={busy}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl btn-primary text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>ტესტი</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisableNotifications}
                    disabled={busy}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl card-surface border border-[var(--border-subtle)] text-rose-600 text-xs font-bold cursor-pointer"
                  >
                    გამორთვა
                  </button>
                </>
              )}
            </div>
          </div>

          {/* SECTION 2: Add to Home Screen with Visual Mockups */}
          <div className="p-3.5 rounded-2xl card-third border border-[var(--border-subtle)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[var(--primary-action)]" aria-hidden="true" />
                <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
                  2. მთავარ ეკრანზე დამატება
                </h3>
                {isStandalone && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                    დაყენებულია ✓
                  </span>
                )}
              </div>

              {/* OS Switcher Pill */}
              <div
                className="inline-flex p-0.5 rounded-xl card-surface border border-[var(--border-subtle)] text-[11px] font-bold"
                role="group"
                aria-label="მოწყობილობის არჩევა"
              >
                <button
                  type="button"
                  onClick={() => setGuideOs('ios')}
                  aria-pressed={guideOs === 'ios'}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    guideOs === 'ios'
                      ? 'btn-primary text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  🍎 iPhone
                </button>
                <button
                  type="button"
                  onClick={() => setGuideOs('android')}
                  aria-pressed={guideOs === 'android'}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    guideOs === 'android'
                      ? 'btn-primary text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  🤖 Android
                </button>
              </div>
            </div>

            {/* One-tap install button when supported by browser */}
            <button
              ref={installBtnRef}
              type="button"
              hidden={!canOneTapInstall}
              onClick={handleInstallClick}
              className="w-full min-h-[42px] px-4 py-2 rounded-xl btn-primary text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>აპლიკაციის დაყენება (1 დაჭერით)</span>
            </button>

            {/* Visual Screen Guide */}
            {guideOs === 'ios' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* iOS Screen 1: Safari Share button */}
                  <div className="p-2.5 rounded-xl card-surface border border-[var(--border-subtle)] flex flex-col justify-between gap-2">
                    <div
                      aria-hidden="true"
                      className="rounded-xl border-2 border-slate-800/80 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 overflow-hidden flex flex-col justify-between h-28 select-none"
                    >
                      <div className="p-2 space-y-1 opacity-55">
                        <div className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded bg-violet-600 text-white text-[8px] font-black flex items-center justify-center">
                            11⁵
                          </span>
                          <span className="h-2 w-12 rounded bg-slate-300 dark:bg-slate-700" />
                        </div>
                        <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-2 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                      </div>

                      {/* Safari Bottom Bar */}
                      <div className="bg-white/95 dark:bg-slate-800/95 border-t border-slate-200 dark:border-slate-700 px-2 py-1.5 space-y-1">
                        <div className="mx-auto w-4/5 h-3.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[7px] font-mono text-slate-500 dark:text-slate-300 flex items-center justify-center">
                          class11-5...
                        </div>
                        <div className="flex items-center justify-around text-slate-400 text-[9px] font-bold">
                          <span>‹</span>
                          <span>›</span>
                          <span className="relative px-1.5 py-0.5 rounded-md bg-sky-500 text-white ring-2 ring-amber-400 shadow-xs flex items-center justify-center">
                            <Share className="w-3 h-3" />
                          </span>
                          <span>📖</span>
                          <span>▢</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-[11px] font-black text-[var(--text-primary)]">
                      1. Safari → Share ↑
                    </div>
                  </div>

                  {/* iOS Screen 2: Add to Home Screen */}
                  <div className="p-2.5 rounded-xl card-surface border border-[var(--border-subtle)] flex flex-col justify-between gap-2">
                    <div
                      aria-hidden="true"
                      className="rounded-xl border-2 border-slate-800/80 dark:border-slate-600 bg-slate-200/80 dark:bg-slate-900 overflow-hidden flex flex-col justify-end h-28 select-none"
                    >
                      {/* iOS Share Sheet */}
                      <div className="bg-white dark:bg-slate-800 rounded-t-xl border-t border-slate-300 dark:border-slate-700 p-2 space-y-1.5 shadow-md">
                        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-700">
                          <span className="w-5 h-5 rounded-md bg-violet-600 text-white text-[8px] font-black flex items-center justify-center shrink-0">
                            11⁵
                          </span>
                          <div className="leading-none">
                            <div className="text-[8px] font-black text-slate-800 dark:text-slate-100">
                              11⁵ კლასი
                            </div>
                            <div className="text-[6.5px] text-slate-400">onrender.com</div>
                          </div>
                        </div>
                        <div className="h-3 rounded bg-slate-100 dark:bg-slate-700/60 px-1.5 flex items-center text-[7px] text-slate-400">
                          Copy
                        </div>
                        <div className="px-1.5 py-1 rounded-lg bg-violet-600 text-white ring-2 ring-amber-400 flex items-center justify-between text-[8px] font-black">
                          <span className="truncate">Add to Home Screen</span>
                          <PlusSquare className="w-3 h-3 shrink-0 ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-[11px] font-black text-[var(--text-primary)]">
                      2. Add to Home Screen
                    </div>
                  </div>
                </div>
                <p className="text-center text-[10px] font-bold text-[var(--text-muted)]">
                  მერე გახსენი 11⁵ ეკრანიდან და ჩართე 🔔
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Android Screen 1: Chrome 3-dots */}
                  <div className="p-2.5 rounded-xl card-surface border border-[var(--border-subtle)] flex flex-col justify-between gap-2">
                    <div
                      aria-hidden="true"
                      className="rounded-xl border-2 border-slate-800/80 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 overflow-hidden flex flex-col justify-between h-28 select-none"
                    >
                      {/* Chrome Top Bar */}
                      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-2 py-1.5 flex items-center gap-1.5">
                        <div className="flex-1 h-4 rounded-full bg-slate-100 dark:bg-slate-700 px-2 text-[7px] font-mono text-slate-500 dark:text-slate-300 flex items-center">
                          class11-5...
                        </div>
                        <span className="w-4 h-4 rounded-md bg-violet-600 text-white ring-2 ring-amber-400 flex items-center justify-center shrink-0">
                          <MoreVertical className="w-3 h-3" />
                        </span>
                      </div>

                      <div className="p-2.5 space-y-1.5 opacity-55">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded bg-violet-600 text-white text-[8px] font-black flex items-center justify-center">
                            11⁵
                          </span>
                          <span className="h-2 w-14 rounded bg-slate-300 dark:bg-slate-700" />
                        </div>
                        <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-2 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                      </div>
                    </div>
                    <div className="text-center text-[11px] font-black text-[var(--text-primary)]">
                      1. Chrome → ⋮ მენიუ
                    </div>
                  </div>

                  {/* Android Screen 2: Install app */}
                  <div className="p-2.5 rounded-xl card-surface border border-[var(--border-subtle)] flex flex-col justify-between gap-2">
                    <div
                      aria-hidden="true"
                      className="rounded-xl border-2 border-slate-800/80 dark:border-slate-600 bg-slate-200/80 dark:bg-slate-900 overflow-hidden p-1.5 flex justify-end items-start h-28 select-none"
                    >
                      {/* Chrome Dropdown Menu */}
                      <div className="w-4/5 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 p-1.5 space-y-1 shadow-md">
                        <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100 dark:border-slate-700 text-[8px] text-slate-400">
                          <span>→</span>
                          <span>☆</span>
                          <span>⬇</span>
                          <span>↻</span>
                        </div>
                        <div className="h-3 rounded bg-slate-100 dark:bg-slate-700/60 px-1.5 flex items-center text-[7px] text-slate-400">
                          Share...
                        </div>
                        <div className="px-1.5 py-1 rounded-lg bg-violet-600 text-white ring-2 ring-amber-400 flex items-center gap-1 text-[8px] font-black">
                          <Download className="w-3 h-3 shrink-0" />
                          <span className="truncate">Install app</span>
                        </div>
                        <div className="h-2.5 rounded bg-slate-100 dark:bg-slate-700/60 px-1.5 flex items-center text-[6.5px] text-slate-400">
                          Desktop site
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-[11px] font-black text-[var(--text-primary)]">
                      2. Install app
                    </div>
                  </div>
                </div>
                <p className="text-center text-[10px] font-bold text-[var(--text-muted)]">
                  ან დააჭირე ზემოთ „აპლიკაციის დაყენება“-ს
                </p>
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
};
