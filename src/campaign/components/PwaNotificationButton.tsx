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
  Laptop,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { soundEffects } from '../utils/soundEffects';

const requestBrowserNotificationPermission = (): Promise<NotificationPermission> =>
  new Promise((resolve, reject) => {
    try {
      const maybePromise = Notification.requestPermission((result) => resolve(result));
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(resolve, reject);
      }
    } catch (err) {
      reject(err);
    }
  });

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

const uint8ArraysEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export const PwaNotificationButton: React.FC = () => {
  const { user, token: contextToken } = usePlatform();
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
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);
  const [isMacDevice, setIsMacDevice] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [guideOs, setGuideOs] = useState<'ios' | 'android' | 'macos'>('ios');
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );

  const getToken = () => {
    if (contextToken) return contextToken;
    try {
      return (
        localStorage.getItem('class11_5_auth_token_v1') ||
        localStorage.getItem('class11_5_auth_token') ||
        ''
      );
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
    const android = /Android/i.test(ua);
    const macDesktop =
      !ios && (/Macintosh|Mac OS X/i.test(ua) || /Mac/i.test(window.navigator.platform || ''));
    const mobile = ios || android;

    setIsIosDevice(ios);
    setIsAndroidDevice(android);
    setIsMacDevice(macDesktop);
    setIsMobileDevice(mobile);
    setGuideOs(ios ? 'ios' : macDesktop ? 'macos' : 'android');

    const syncPermissionState = () => {
      if (!('Notification' in window)) {
        setNotifPermission('unsupported');
        return;
      }
      const next = Notification.permission;
      setNotifPermission(next);
      if (next === 'granted') {
        setErrorMsg((prev) => (prev && prev.includes('ნებართვა') ? null : prev));
      }
    };

    syncPermissionState();

    const hasNativeInstall = typeof (Navigator.prototype as any).install === 'function';
    setSupportsWebInstall(hasNativeInstall);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    };

    const onFocusOrVisible = () => {
      if (document.visibilityState !== 'hidden') {
        syncPermissionState();
      }
    };

    let permStatus: PermissionStatus | null = null;
    if ('permissions' in navigator && typeof navigator.permissions?.query === 'function') {
      navigator.permissions
        .query({ name: 'notifications' as PermissionName })
        .then((status) => {
          permStatus = status;
          status.onchange = syncPermissionState;
        })
        .catch(() => {});
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('focus', syncPermissionState);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('focus', syncPermissionState);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
      if (permStatus) {
        permStatus.onchange = null;
      }
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
  }, [user?.id, user?.role, contextToken, isStandalone]);

  // Record Home Screen standalone usage and link push endpoint for logged-in user
  useEffect(() => {
    if (!user?.id || (!isStandalone && !currentEndpoint)) return;
    const authToken = getToken();
    if (!authToken) return;
    fetch('/api/platform/push/client-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ isStandalone, endpoint: currentEndpoint }),
    }).catch(() => {});
  }, [isStandalone, user?.id, contextToken, currentEndpoint]);

  // Re-check Notification.permission whenever dialog opens
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !('Notification' in window)) return;
    const perm = Notification.permission;
    setNotifPermission(perm);
    if (perm === 'granted') {
      setErrorMsg((prev) => (prev && prev.includes('ნებართვა') ? null : prev));
    }
  }, [isOpen]);

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

    // Light-dismiss fallback for browsers without <dialog closedby="any"> support (e.g. Safari)
    const supportsClosedBy = 'closedBy' in HTMLDialogElement.prototype;
    const handleBackdropClick = (event: MouseEvent) => {
      if (supportsClosedBy || event.target !== dlg) return;
      const rect = dlg.getBoundingClientRect();
      const insideDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!insideDialog) {
        dlg.close();
      }
    };

    dlg.addEventListener('click', handleBackdropClick);
    return () => {
      dlg.removeEventListener('close', handleClose);
      dlg.removeEventListener('click', handleBackdropClick);
    };
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

  const getDeniedPermissionHint = (): string => {
    if (isMacDevice && isStandalone) {
      return 'Mac Dock აპს ცალკე ნებართვა სჭირდება Safari-სგან დამოუკიდებლად: გახსენი  → System Settings → Notifications → „11⁵ კლასი“ და ჩართე Allow Notifications (თუ მაინც ბლოკავს, წაშალე Dock აპი და Safari-დან თავიდან გააკეთე File → Add to Dock).';
    }
    if (isIosDevice && isStandalone) {
      return 'iPhone-ზე გახსენი Settings → Notifications → „11⁵ კლასი“ და ჩართე Allow Notifications.';
    }
    if (isAndroidDevice) {
      return 'Chrome-ში დააჭირე მისამართის ზოლის 🔒/პარამეტრების ხატულას → Permissions → Notifications → Allow.';
    }
    if (isMacDevice) {
      return 'Safari → Settings → Websites → Notifications (ან Chrome-ის 🔒 ხატულიდან) აირჩიე Allow. თუ Mac Dock აპს იყენებ, იქ ნებართვა  → System Settings → Notifications → „11⁵ კლასი“-დან ირთვება.';
    }
    return 'ნებართვა უარყოფილია — დაუშვი Notifications ბრაუზერის პარამეტრებიდან.';
  };

  const handleEnableNotifications = async () => {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) {
        if (isIosDevice && !isStandalone) {
          setErrorMsg('Safari (iOS)-ზე ჯერ დაამატე მთავარ ეკრანზე (Share → Add to Home Screen) და იქიდან გახსენი!');
        } else {
          setErrorMsg('ბრაუზერი არ უჭერს მხარს Push შეტყობინებებს.');
        }
        return;
      }

      let permission: NotificationPermission = Notification.permission;
      if (permission !== 'granted') {
        permission = await requestBrowserNotificationPermission();
      }
      setNotifPermission(permission);

      if (permission === 'default') {
        setErrorMsg('ნებართვის მოთხოვნა დაიხურა — დააჭირე „შეტყობინებების ჩართვა“-ს და აირჩიე Allow.');
        return;
      }
      if (permission !== 'granted') {
        setErrorMsg(getDeniedPermissionHint());
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

      const expectedKey = urlBase64ToUint8Array(keyData.publicKey);
      let sub = await reg.pushManager.getSubscription();
      if (sub && sub.options?.applicationServerKey) {
        const currentKey = new Uint8Array(sub.options.applicationServerKey);
        if (!uint8ArraysEqual(currentKey, expectedKey)) {
          await sub.unsubscribe().catch(() => {});
          sub = null;
        }
      }
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: expectedKey as unknown as BufferSource,
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

            {!isSubscribed && notifPermission === 'denied' && !errorMsg && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-900 dark:text-amber-200 leading-relaxed">
                {getDeniedPermissionHint()}
              </div>
            )}

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

              {/* OS / Browser Switcher Pill */}
              <div
                className="inline-flex flex-wrap p-0.5 rounded-xl card-surface border border-[var(--border-subtle)] text-[11px] font-bold"
                role="group"
                aria-label="ბრაუზერის და მოწყობილობის არჩევა"
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
                  Safari (iOS)
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
                  Chrome (Android)
                </button>
                <button
                  type="button"
                  onClick={() => setGuideOs('macos')}
                  aria-pressed={guideOs === 'macos'}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 ${
                    guideOs === 'macos'
                      ? 'btn-primary text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Laptop className="w-3 h-3" aria-hidden="true" />
                  <span>Mac</span>
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
              <div className="space-y-2.5">
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

                <ol className="p-2.5 rounded-xl card-surface border border-[var(--border-subtle)] space-y-1.5 text-[11px] text-[var(--text-secondary)] leading-relaxed list-decimal list-inside">
                  <li>
                    გახსენი საიტი <strong className="text-[var(--text-primary)]">Safari</strong>-ში (არა Chrome-ში ან Instagram/Messenger-ის ბრაუზერში).
                  </li>
                  <li>
                    დააჭირე ქვედა პანელზე <strong className="text-[var(--text-primary)]">Share (↑)</strong> ღილაკს (ან ზედა მარჯვნივ iPad-ზე).
                  </li>
                  <li>
                    ჩამოსქროლე, აირჩიე <strong className="text-[var(--text-primary)]">Add to Home Screen</strong> და დააჭირე <strong className="text-[var(--text-primary)]">Add</strong>.
                  </li>
                  <li>
                    გახსენი მთავარ ეკრანზე გაჩენილი <strong className="text-[var(--text-primary)]">11⁵ კლასი</strong> აპი და იქ დააჭირე <strong className="text-[var(--text-primary)]">„შეტყობინებების ჩართვა“-ს → Allow</strong>.
                  </li>
                </ol>
              </div>
            ) : guideOs === 'android' ? (
              <div className="space-y-2.5">
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

                <ol className="p-2.5 rounded-xl card-surface border border-[var(--border-subtle)] space-y-1.5 text-[11px] text-[var(--text-secondary)] leading-relaxed list-decimal list-inside">
                  <li>
                    გახსენი საიტი <strong className="text-[var(--text-primary)]">Google Chrome</strong>-ში (არა Incognito რეჟიმში).
                  </li>
                  <li>
                    დააჭირე ზემოთ <strong className="text-[var(--text-primary)]">„აპლიკაციის დაყენება (1 დაჭერით)“</strong> ღილაკს, ან ზედა მარჯვნივ <strong className="text-[var(--text-primary)]">⋮ მენიუს</strong>.
                  </li>
                  <li>
                    აირჩიე <strong className="text-[var(--text-primary)]">Install app</strong> (ან <strong className="text-[var(--text-primary)]">Add to Home screen</strong>) → დაადასტურე <strong className="text-[var(--text-primary)]">Install</strong>.
                  </li>
                  <li>
                    გახსენი <strong className="text-[var(--text-primary)]">11⁵ კლასი</strong> ეკრანიდან და დააჭირე <strong className="text-[var(--text-primary)]">„შეტყობინებების ჩართვა“-ს → Allow</strong>.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Mac Screen 1: Safari File -> Add to Dock */}
                  <div className="p-2.5 rounded-xl card-surface border border-[var(--border-subtle)] flex flex-col justify-between gap-2">
                    <div
                      aria-hidden="true"
                      className="rounded-xl border-2 border-slate-800/80 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 overflow-hidden flex flex-col justify-between h-28 select-none"
                    >
                      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-2 py-1 flex items-center gap-2 text-[7px] font-bold text-slate-600 dark:text-slate-300">
                        <span className="font-black">Safari</span>
                        <span className="px-1 rounded bg-slate-200 dark:bg-slate-700">File</span>
                      </div>
                      <div className="mx-2 my-auto bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 space-y-1 shadow-sm">
                        <div className="text-[7px] text-slate-400 px-1">Share…</div>
                        <div className="px-1.5 py-0.5 rounded bg-violet-600 text-white ring-2 ring-amber-400 text-[8px] font-black truncate">
                          Add to Dock…
                        </div>
                      </div>
                      <div className="mx-auto mb-1 px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-300/70 dark:border-slate-700 flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-violet-600 text-white text-[6px] font-black flex items-center justify-center">
                          11⁵
                        </span>
                        <span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-600" />
                      </div>
                    </div>
                    <div className="text-center text-[11px] font-black text-[var(--text-primary)]">
                      Safari → File → Add to Dock
                    </div>
                  </div>

                  {/* Mac Screen 2: Chrome Install */}
                  <div className="p-2.5 rounded-xl card-surface border border-[var(--border-subtle)] flex flex-col justify-between gap-2">
                    <div
                      aria-hidden="true"
                      className="rounded-xl border-2 border-slate-800/80 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 overflow-hidden flex flex-col justify-between h-28 select-none"
                    >
                      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-2 py-1 flex items-center justify-between gap-1">
                        <span className="text-[7px] font-mono text-slate-500 dark:text-slate-300 truncate">
                          class11-5...
                        </span>
                        <span className="px-1 rounded bg-violet-600 text-white text-[7px] font-black">
                          ⋮
                        </span>
                      </div>
                      <div className="m-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 space-y-1 shadow-sm">
                        <div className="text-[7px] text-slate-400 px-1 truncate">
                          Cast, save, and share
                        </div>
                        <div className="px-1.5 py-0.5 rounded bg-violet-600 text-white ring-2 ring-amber-400 text-[8px] font-black flex items-center gap-1">
                          <Download className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">Install page as app…</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-[11px] font-black text-[var(--text-primary)]">
                      Chrome → ⋮ → Install app
                    </div>
                  </div>
                </div>

                <ol className="p-2.5 rounded-xl card-surface border border-[var(--border-subtle)] space-y-1.5 text-[11px] text-[var(--text-secondary)] leading-relaxed list-decimal list-inside">
                  <li>
                    <strong className="text-[var(--text-primary)]">Safari-დან:</strong> ზედა მენიუდან <strong className="text-[var(--text-primary)]">File → Add to Dock…</strong> → <strong className="text-[var(--text-primary)]">Add</strong>.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Chrome-დან:</strong> ზედა მარჯვენა <strong className="text-[var(--text-primary)]">⋮ → Cast, save, and share → Install page as app…</strong> → <strong className="text-[var(--text-primary)]">Install</strong>.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">მნიშვნელოვანია Mac Safari Dock აპზე:</strong> Dock-ში დამატებული აპი Safari-სგან დამოუკიდებელი აპია (Safari-ს Allow იქ ავტომატურად არ გადადის) — გახსენი აპი Dock-დან და შიგნით დააჭირე <strong className="text-[var(--text-primary)]">„შეტყობინებების ჩართვა“-ს</strong>.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">თუ წერს „ნებართვა უარყოფილია“:</strong> გახსენი <strong className="text-[var(--text-primary)]"> → System Settings → Notifications → 11⁵ კლასი</strong> და ჩართე <strong className="text-[var(--text-primary)]">Allow Notifications</strong> (თუ მაინც ბლოკავს, წაშალე Dock აპი და Safari-დან თავიდან დაამატე <strong className="text-[var(--text-primary)]">Add to Dock</strong>).
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
};
