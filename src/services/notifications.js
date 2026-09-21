/**
 * Thin wrapper around the Web Notifications API.
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

export function showArrivalNotification(destinationStationName) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }
  try {
    // eslint-disable-next-line no-new
    new Notification('Metro Alert', {
      body: `You've reached ${destinationStationName}.`,
      icon: 'icons/icon-192.png',
      tag: 'metro-alert-arrival',
      requireInteraction: true
    });
    return true;
  } catch {
    return false;
  }
}
