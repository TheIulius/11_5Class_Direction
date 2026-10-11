/**
 * Tactile Haptic Feedback Utility for Modern Mobile Browsers
 * Safely invokes navigator.vibrate when available.
 */
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light'): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'success':
        navigator.vibrate([12, 40, 15]);
        break;
      case 'warning':
        navigator.vibrate([20, 50, 30]);
        break;
    }
  } catch {
    // Gracefully ignore vibrations not permitted by browser policies
  }
}
