import React, { useState, useEffect, useId, useRef } from 'react';
import {
  Bell,
  BellRing,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  Send,
  X,
  Download,
  Sparkles,
  ShieldAlert,
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
  const { user, canModerate } = usePlatform();
  const dialogId = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const installBtnRef = useRef<HTMLButtonElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Web Install API / beforeinstallprompt state
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [supportsWebInstall, setSupportsWebInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  // Admin broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');

  const getToken = () => {
    try {
      return localStorage.getItem('class11_5_auth_token') || '';
    } catch {
      return '';
    }
  };

  // Detect standalone mode, iOS, and Web Install API / beforeinstallprompt
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
    setIsIosDevice(ios);

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
          // Sync subscription with backend so user role (admin/moderator/student) stays linked
          const token = getToken();
          await fetch('/api/platform/push/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ subscription: sub.toJSON() }),
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
  }, [user?.id, user?.role]);

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
        // Call directly from click handler to retain transient user activation
        await (navigator as any).install();
        setStatusMsg('აპლიკაცია წარმატებით დაყენდა!');
        setIsStandalone(true);
      } else if (deferredInstallPrompt) {
        // Save and clear the single-use event before awaiting the user's choice
        const promptEvent = deferredInstallPrompt;
        setDeferredInstallPrompt(null);
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setStatusMsg('აპლიკაცია წარმატებით დაემატა მთავარ ეკრანზე!');
          setIsStandalone(true);
        } else {
          setStatusMsg('ინსტალაცია გაუქმდა.');
        }
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        setStatusMsg('ინსტალაცია გაუქმდა.');
      } else {
        setErrorMsg('ავტომატური ინსტალაცია ვერ დაიწყო. გამოიყენეთ ქვემოთ მოცემული ინსტრუქცია.');
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
          setErrorMsg(
            'iPhone-ზე შეტყობინებების ჩასართავად ჯერ დაამატეთ საიტი მთავარ ეკრანზე (Share ⬆️ → Add to Home Screen) და გახსენით იქიდან!'
          );
        } else {
          setErrorMsg('თქვენი ბრაუზერი არ უჭერს მხარს Web Push შეტყობინებებს.');
        }
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setErrorMsg('შეტყობინებების ნებართვა უარყოფილია. გთხოვთ დაუშვათ Notifications ბრაუზერის პარამეტრებიდან.');
        return;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const keyRes = await fetch('/api/platform/push/vapid-public-key');
      const keyData = await keyRes.json();
      if (!keyData?.publicKey) {
        setErrorMsg('VAPID გასაღები ვერ მოიძებნა სერვერზე.');
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
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (!subRes.ok) {
        throw new Error('სერვერზე გამოწერის შენახვა ვერ მოხერხდა.');
      }

      setIsSubscribed(true);
      setCurrentEndpoint(sub.endpoint);
      setStatusMsg('🔔 შეტყობინებები წარმატებით ჩაირთო ამ მოწყობილობაზე!');
    } catch (err: any) {
      if (isIosDevice && !isStandalone) {
        setErrorMsg(
          'iPhone-ზე შეტყობინებების მისაღებად აუცილებელია ჯერ საიტის დამატება მთავარ ეკრანზე (Share ⬆️ → Add to Home Screen) და მთავარი ეკრანიდან გახსნა!'
        );
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
      setStatusMsg('შეტყობინებები გამოირთო ამ მოწყობილობაზე.');
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
        setErrorMsg(data.error || 'ტესტ-შეტყობინების გაგზავნა ვერ მოხერხდა.');
      } else {
        setStatusMsg('✅ ტესტ-შეტყობინება გამოიგზავნა! შეამოწმეთ ეკრანის ზედა შეტყობინება.');
      }
    } catch {
      setErrorMsg('სერვერთან დაკავშირება ვერ მოხერხდა.');
    } finally {
      setBusy(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastBody.trim()) return;
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
        body: JSON.stringify({
          broadcast: true,
          title: broadcastTitle.trim() || '📢 11⁵ კლასი • შეტყობინება',
          body: broadcastBody.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'გაგზავნა ვერ მოხერხდა.');
      } else {
        setStatusMsg(`📢 შეტყობინება გაეგზავნა ${data.sent || 0} გამოწერილ მოწყობილობას!`);
        setBroadcastTitle('');
        setBroadcastBody('');
      }
    } catch {
      setErrorMsg('სერვერთან დაკავშირება ვერ მოხერხდა.');
    } finally {
      setBusy(false);
    }
  };

  const canOneTapInstall = !isStandalone && (supportsWebInstall || Boolean(deferredInstallPrompt));

  return (
    <>
      <button
        type="button"
        onClick={() => {
          soundEffects.click();
          setIsOpen(true);
        }}
        className="relative h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl card-third text-[var(--text-primary)] text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
        title="მთავარ ეკრანზე დამატება & შეტყობინებები"
        aria-label="აპლიკაციის ჩაწერა და შეტყობინებების ჩართვა"
      >
        {isSubscribed ? (
          <BellRing className="w-4 h-4 text-[var(--primary-action)]" />
        ) : (
          <Bell className="w-4 h-4 text-[var(--primary-action)]" />
        )}
        <span className="hidden md:inline">აპი &amp; 🔔</span>
        <span
          className={`w-2 h-2 rounded-full ${
            isSubscribed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
          }`}
          aria-hidden="true"
        />
      </button>

      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby={dialogId}
        className="fixed inset-0 m-auto w-[94vw] max-w-lg max-h-[90dvh] rounded-2xl p-0 bg-transparent border-0 overflow-visible"
      >
        <div className="card-surface nb-stationary w-full max-h-[90dvh] p-4 sm:p-6 rounded-2xl overflow-y-auto space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl btn-primary text-white flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 id={dialogId} className="text-base sm:text-lg font-black text-[var(--text-primary)] leading-tight">
                  11⁵ ვებ-აპლიკაცია &amp; შეტყობინებები
                </h2>
                <p className="text-[11px] text-[var(--text-muted)]">
                  მთავარ ეკრანზე დამატება (iPhone / Android) და მყისიერი Push-შეტყობინებები
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="დახურვა"
              className="w-8 h-8 rounded-xl card-third flex items-center justify-center text-[var(--text-primary)] cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {statusMsg && (
            <div
              role="status"
              className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-start gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: Instant Push Notifications */}
          <div className="p-4 rounded-2xl card-third border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[var(--primary-action)]" />
                <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
                  1. მყისიერი Push-შეტყობინებები
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

            <ul className="text-[11px] text-[var(--text-secondary)] space-y-1 pl-4 list-disc">
              <li>
                <strong>ყველა მოსწავლისთვის:</strong> მყისიერი შეტყობინება ახალ{' '}
                <strong>შემაჯამებელზე</strong> (მაგ. ქიმიის შემაჯამებელი), <strong>განცხადებაზე</strong> და ატვირთული მასალის დადასტურებაზე.
              </li>
              <li>
                <strong>ადმინებისა &amp; მოდერატორებისთვის:</strong> მყისიერი შეტყობინება, როცა მოსწავლე ატვირთავს ახალ <strong>მასალას</strong> ან <strong>დავალებას</strong> დასადასტურებლად.
              </li>
            </ul>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {!isSubscribed ? (
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  disabled={busy}
                  className="min-h-[42px] px-4 py-2 rounded-xl btn-primary text-white text-xs font-black inline-flex items-center gap-2 cursor-pointer"
                >
                  <BellRing className="w-4 h-4" />
                  <span>{busy ? 'ირთვება...' : 'შეტყობინებების ჩართვა'}</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={busy}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl btn-primary text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ტესტ-შეტყობინების გაგზავნა</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisableNotifications}
                    disabled={busy}
                    className="min-h-[40px] px-3 py-2 rounded-xl card-surface border border-[var(--border-subtle)] text-rose-600 text-xs font-bold cursor-pointer"
                  >
                    გამორთვა
                  </button>
                </>
              )}
            </div>
          </div>

          {/* SECTION 2: Add to Home Screen (iPhone & Android) */}
          <div className="p-4 rounded-2xl card-third border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[var(--primary-action)]" />
                <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
                  2. მთავარ ეკრანზე დამატება (Home Screen აპი)
                </h3>
              </div>
              {isStandalone && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                  დაყენებულია ✓
                </span>
              )}
            </div>

            {/* One-tap install button when supported by browser (Android Chrome / Desktop Chrome & Edge) */}
            <button
              ref={installBtnRef}
              type="button"
              hidden={!canOneTapInstall}
              onClick={handleInstallClick}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl btn-primary text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>აპლიკაციის დაყენება მთავარ ეკრანზე (1 დაჭერით)</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
              {/* iPhone / iOS Guide */}
              <div className="p-3 rounded-xl card-surface border border-[var(--border-subtle)] space-y-1.5">
                <div className="font-black text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>🍎 iPhone (Safari)</span>
                </div>
                <ol className="space-y-1 text-[var(--text-secondary)] list-decimal pl-4">
                  <li>
                    გახსენით საიტი <strong>Safari</strong>-ში და დააჭირეთ ქვემოთ{' '}
                    <span className="inline-flex items-center px-1 py-0.5 rounded bg-[var(--primary-action-light)] text-[var(--primary-action)] font-bold">
                      <Share className="w-3 h-3 mr-0.5" /> Share
                    </span>{' '}
                    ღილაკს.
                  </li>
                  <li>
                    აირჩიეთ{' '}
                    <span className="inline-flex items-center px-1 py-0.5 rounded bg-[var(--primary-action-light)] text-[var(--primary-action)] font-bold">
                      <PlusSquare className="w-3 h-3 mr-0.5" /> Add to Home Screen
                    </span>
                    .
                  </li>
                  <li>
                    გახსენით <strong>11⁵ კლასი</strong> მთავარი ეკრანიდან და დააჭირეთ{' '}
                    <strong>„შეტყობინებების ჩართვა“</strong>-ს!
                  </li>
                </ol>
              </div>

              {/* Android Guide */}
              <div className="p-3 rounded-xl card-surface border border-[var(--border-subtle)] space-y-1.5">
                <div className="font-black text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>🤖 Android (Chrome)</span>
                </div>
                <ol className="space-y-1 text-[var(--text-secondary)] list-decimal pl-4">
                  <li>
                    დააჭირეთ ზემოთ ლურჯ/იისფერ ღილაკს{' '}
                    <strong>„აპლიკაციის დაყენება“</strong> (ან Chrome-ის <strong>⋮</strong> მენიუს).
                  </li>
                  <li>
                    აირჩიეთ <strong>„Install app“</strong> ან <strong>„Add to Home screen“</strong>.
                  </li>
                  <li>
                    ჩართეთ <strong>„შეტყობინებების ჩართვა“</strong> მყისიერი Push-შეტყობინებებისთვის.
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* SECTION 3: Admin / Moderator Instant Push Broadcast */}
          {canModerate && (
            <form
              onSubmit={handleSendBroadcast}
              className="p-4 rounded-2xl card-third border border-[var(--border-subtle)] space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[var(--primary-action)]" />
                <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
                  ადმინი / მოდერატორი: Push-შეტყობინების გაგზავნა ყველასთან
                </h3>
              </div>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="სათაური (მაგ: ქიმიის შემაჯამებელი ხვალ!)"
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] text-xs bg-[var(--surface-card)] text-[var(--text-primary)]"
              />
              <textarea
                rows={2}
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="შეტყობინების ტექსტი (მაგ: არ დაგავიწყდეთ კონსპექტის გადახედვა მასალებში)..."
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] text-xs bg-[var(--surface-card)] text-[var(--text-primary)]"
              />
              <button
                type="submit"
                disabled={busy || !broadcastBody.trim()}
                className="min-h-[40px] px-4 py-2 rounded-xl btn-primary text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ყველა მოსწავლესთან გაგზავნა</span>
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
};
