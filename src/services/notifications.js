/**
 * Notifications, Lock Screen Vibration, Screen Wake Lock, and Audio Alert service.
 */

let audioCtx = null;
let wakeLockSentinel = null;

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

/**
 * Prime AudioContext on user interaction so background audio alert plays
 * even if the screen is locked or tab is in background.
 */
export function primeAudioContext() {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtx) {
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch {
    // Ignore audio priming errors
  }
}

/**
 * Request Screen Wake Lock during active journeys to keep GPS tracking
 * and CPU active even when the phone display is dimmed.
 */
export async function requestScreenWakeLock() {
  if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
    } catch {
      // Ignore wake lock rejection
    }
  }
}

export function releaseScreenWakeLock() {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release();
    } catch {}
    wakeLockSentinel = null;
  }
}

/**
 * Vibrate phone for approaching state (500m radius).
 */
export function vibrateApproaching() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([300, 150, 300, 150, 300]);
    } catch {}
  }
}

/**
 * Vibrate phone for EXACTLY 5 SECONDS on arrival.
 * Pattern: 1000ms vibrate + 250ms pause x 4 = 5000ms total duration.
 */
export function vibrateArrival5Sec() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([1000, 250, 1000, 250, 1000, 250, 1000, 250, 250]);
    } catch {}
  }
}

/**
 * Play an attention-grabbing alert sound via Web Audio API.
 */
export function playAlertSound(isArrival = true) {
  if (typeof window === 'undefined') return;
  try {
    primeAudioContext();
    const ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    const beepTimes = isArrival
      ? [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25]
      : [0, 0.3, 0.6];

    beepTimes.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isArrival ? 'square' : 'sine';
      osc.frequency.setValueAtTime(isArrival ? 880 : 660, now + t);
      gain.gain.setValueAtTime(0.5, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.24);
    });
  } catch {}
}

export async function showApproachingNotification(destinationStationName) {
  vibrateApproaching();
  playAlertSound(false);

  const title = 'Approaching Metro Station ⚠️';
  const options = {
    body: `You are within 500m of ${destinationStationName}. Get ready to disembark!`,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: 'metro-alert-approaching',
    vibrate: [300, 150, 300, 150, 300], // Lock Screen vibration pattern
    renotify: true,
    silent: false
  };

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return true;
      }
    } catch {}
  }

  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      // eslint-disable-new-line no-new
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function showArrivalNotification(destinationStationName) {
  vibrateArrival5Sec();
  playAlertSound(true);

  const title = 'Arrived at Destination! 🚇';
  const options = {
    body: `You've reached ${destinationStationName}. Exit the train now!`,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: 'metro-alert-arrival',
    requireInteraction: true,
    vibrate: [1000, 250, 1000, 250, 1000, 250, 1000, 250, 250], // 5-SECOND LOCK SCREEN VIBRATION!
    renotify: true,
    silent: false
  };

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return true;
      }
    } catch {}
  }

  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      // eslint-disable-new-line no-new
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
