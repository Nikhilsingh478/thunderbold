import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const isNativePlatform = () => Capacitor.isNativePlatform();

export async function initNativePush(
  onTokenReceived: (token: string) => void,
  onNotificationReceived: (notification: any) => void,
  onNotificationActionPerformed: (action: any) => void,
) {
  if (!Capacitor.isNativePlatform()) return;

  // Request permission
  const permStatus = await PushNotifications.requestPermissions();

  if (permStatus.receive !== 'granted') {
    console.log('[Push] Permission not granted');
    return;
  }

  // Register with FCM
  await PushNotifications.register();

  // Listen for FCM token
  PushNotifications.addListener(
    'registration',
    (token) => {
      console.log('[Push] FCM Token:', token.value);
      onTokenReceived(token.value);
    }
  );

  // Registration error
  PushNotifications.addListener(
    'registrationError',
    (error) => {
      console.error('[Push] Registration error:', error);
    }
  );

  // Foreground notification received
  PushNotifications.addListener(
    'pushNotificationReceived',
    (notification) => {
      console.log('[Push] Received:', notification);
      // Vibrate on notification
      Haptics.impact({ style: ImpactStyle.Medium })
        .catch(() => {});
      onNotificationReceived(notification);
    }
  );

  // User tapped notification
  PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (action) => {
      console.log('[Push] Action:', action);
      onNotificationActionPerformed(action);
    }
  );
}

export async function requestVibrateOnNotification() {
  try {
    await Haptics.impact({
      style: ImpactStyle.Medium,
    });
  } catch (e) {
    // Haptics not available, ignore
  }
}
