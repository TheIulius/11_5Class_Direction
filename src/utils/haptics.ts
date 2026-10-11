/**
 * Universal Tactile Haptic Feedback Utility for Mobile Browsers
 * 
 * Supports:
 * 1. Web Vibration API (Android Chrome, Firefox) via navigator.vibrate
 * 2. iOS Safari (WebKit on iOS 17.4+ & iOS 18+) via native <input type="checkbox" switch> label trick
 *    (Safari intentionally omits navigator.vibrate; native switch toggles engage the Apple Taptic Engine)
 */

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'selection';

let iosLabelElement: HTMLLabelElement | null = null;
let iosSwitchElement: HTMLInputElement | null = null;

function ensureIosHapticElements(): boolean {
  if (typeof document === 'undefined') return false;

  if (iosLabelElement && iosSwitchElement && document.body.contains(iosLabelElement)) {
    return true;
  }

  try {
    const existingLabel = document.getElementById('kcl-haptic-label') as HTMLLabelElement | null;
    const existingSwitch = document.getElementById('kcl-haptic-switch') as HTMLInputElement | null;

    if (existingLabel && existingSwitch) {
      iosLabelElement = existingLabel;
      iosSwitchElement = existingSwitch;
      return true;
    }

    // Must be in DOM layout without display:none or visibility:hidden
    // WebKit only dispatches native Taptic feedback if element is rendered
    const label = document.createElement('label');
    label.id = 'kcl-haptic-label';
    label.htmlFor = 'kcl-haptic-switch';
    label.setAttribute('aria-hidden', 'true');
    label.style.position = 'fixed';
    label.style.top = '-9999px';
    label.style.left = '-9999px';
    label.style.width = '1px';
    label.style.height = '1px';
    label.style.opacity = '0';
    label.style.pointerEvents = 'none';
    label.style.overflow = 'hidden';

    const input = document.createElement('input');
    input.id = 'kcl-haptic-switch';
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    input.style.position = 'absolute';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';

    label.appendChild(input);
    document.body.appendChild(label);

    iosLabelElement = label;
    iosSwitchElement = input;
    return true;
  } catch {
    return false;
  }
}

// Pre-initialize on browser load so elements are ready on the very first user interaction
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      ensureIosHapticElements();
    }, { once: true });
  } else {
    ensureIosHapticElements();
  }
}

function triggerIosSwitchFeedback(type: HapticFeedbackType): void {
  if (!ensureIosHapticElements() || !iosLabelElement) return;

  try {
    iosLabelElement.click();

    if (type === 'success') {
      // Double tap rhythm for success
      setTimeout(() => {
        try {
          iosLabelElement?.click();
        } catch {}
      }, 75);
    } else if (type === 'warning' || type === 'heavy') {
      // Triple tap rhythm for warning/error
      setTimeout(() => {
        try {
          iosLabelElement?.click();
          setTimeout(() => {
            try {
              iosLabelElement?.click();
            } catch {}
          }, 80);
        } catch {}
      }, 75);
    }
  } catch {
    // Ignore any browser security restrictions
  }
}

export function triggerHaptic(type: HapticFeedbackType = 'light'): void {
  if (typeof window === 'undefined') return;

  // 1. Android / Chrome / Web Vibration API
  const hasVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  if (hasVibrate) {
    try {
      switch (type) {
        case 'light':
        case 'selection':
          navigator.vibrate(12);
          break;
        case 'medium':
          navigator.vibrate(28);
          break;
        case 'heavy':
          navigator.vibrate(45);
          break;
        case 'success':
          navigator.vibrate([15, 50, 25]);
          break;
        case 'warning':
          navigator.vibrate([25, 60, 35]);
          break;
      }
      return;
    } catch {
      // Fallback to iOS switch trick if vibrate was denied by browser policy
    }
  }

  // 2. iOS Safari (WebKit) native switch haptic
  triggerIosSwitchFeedback(type);
}
