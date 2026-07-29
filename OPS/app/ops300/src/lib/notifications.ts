// Browser notification service for 300 OPS
const APP_ICON = '/300-logo-192.png';

export type NotificationPermission = 'default' | 'granted' | 'denied';

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission as NotificationPermission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

export function showNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;

  const notification = new Notification(title, {
    icon: APP_ICON,
    badge: APP_ICON,
    tag: '300-ops',
    requireInteraction: true,
    ...options,
  });

  return notification;
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}
