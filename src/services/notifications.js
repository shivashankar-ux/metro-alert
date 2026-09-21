/**
 * Notifications, Vibration, and Sound Alert service.
 */

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
 * Vibrate phone for approaching state (500m radius).
 */
export function vibrateApproaching() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Approaching pulse pattern (~1.2 seconds)
      navigator.vibrate([300, 150, 300, 150, 300]);
    } catch {
      // Ignore vibration errors on unsupported devices
    }
  }
}

/**
 * Vibrate phone for EXACTLY 5 SECONDS on arrival.
 * Pattern: 1000ms vibrate + 250ms pause x 4 times = 5000ms total duration.
 */
export function vibrateArrival5Sec() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([1000, 250, 1000, 250, 1000, 250, 1000, 250, 250]);
    } catch {
      // Ignore vibration errors on unsupported devices
    }
  }
}

/**
 * Play an attention-grabbing alert sound via Web Audio API.
 */
export function playAlertSound(isArrival = true) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const beepTimes = isArrival
      ? [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]
      : [0, 0.3, 0.6];

    beepTimes.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isArrival ? 'square' : 'sine';
      osc.frequency.setValueAtTime(isArrival ? 880 : 660, now + t);
      gain.gain.setValueAtTime(0.4, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.22);
    });
  } catch {
    // Ignore audio errors
  }
}

export function showApproachingNotification(destinationStationName) {
  vibrateApproaching();
  playAlertSound(false);
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }
  try {
    // eslint-disable-new-line no-new
    new Notification('Approaching Metro Station', {
      body: `You are within 500m of ${destinationStationName}. Get ready to disembark!`,
      icon: 'icons/icon-192.png',
      tag: 'metro-alert-approaching'
    });
    return true;
  } catch {
    return false;
  }
}

export function showArrivalNotification(destinationStationName) {
  vibrateArrival5Sec();
  playAlertSound(true);
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }
  try {
    // eslint-disable-new-line no-new
    new Notification('Arrived at Destination! 🚇', {
      body: `You've reached ${destinationStationName}. Exit the train now!`,
      icon: 'icons/icon-192.png',
      tag: 'metro-alert-arrival',
      requireInteraction: true
    });
    return true;
  } catch {
    return false;
  }
}
