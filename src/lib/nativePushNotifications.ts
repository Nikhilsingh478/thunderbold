import { 
  PushNotifications,
  PushNotificationSchema,
  ActionPerformed,
  Token
} from '@capacitor/push-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

let isInitialized = false;
let registeredTokenCallback: ((token: string) => void) | null = null;
let notificationReceivedCallback: ((notification: PushNotificationSchema) => void) | null = null;
let notificationActionCallback: ((action: ActionPerformed) => void) | null = null;

export const isNativePlatform = () => Capacitor.isNativePlatform();

export async function initNativePush(
  onToken: (token: string) => void,
  onNotification: (n: PushNotificationSchema) => void,
  onAction: (a: ActionPerformed) => void,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  
  registeredTokenCallback = onToken;
  notificationReceivedCallback = onNotification;
  notificationActionCallback = onAction;

  if (isInitialized) {
    // If already initialized, trigger registration to ensure token listener receives token
    try {
      await PushNotifications.register();
    } catch {}
    return;
  }

  // Remove any existing listeners to prevent duplicates
  await PushNotifications.removeAllListeners();

  // CRITICAL: Attach listeners BEFORE calling PushNotifications.register()
  // Otherwise, the native registration event fires before the JS listener is registered!

  // FCM Token received listener
  await PushNotifications.addListener(
    'registration',
    (token: Token) => {
      console.log('[Push] Step 4: TOKEN RECEIVED:', token.value);
      const existingToken = localStorage.getItem('thunderbold_native_fcm_token');
      if (existingToken !== token.value) {
        console.log('[Push] Token refreshed');
        localStorage.setItem('thunderbold_native_fcm_token', token.value);
        localStorage.removeItem('thunderbold_token_registered');
      }
      if (registeredTokenCallback) {
        registeredTokenCallback(token.value);
      }
    }
  );

  // Registration error listener
  await PushNotifications.addListener(
    'registrationError',
    (error: any) => {
      console.log('[Push] Step 4 ERROR:', JSON.stringify(error));
    }
  );

  // Foreground notification received listener
  await PushNotifications.addListener(
    'pushNotificationReceived',
    async (notification: PushNotificationSchema) => {
      console.log('[Push] Foreground notification:', JSON.stringify(notification));
      
      // Haptic vibration
      try {
        await Haptics.impact({ 
          style: ImpactStyle.Medium 
        });
        await new Promise(r => setTimeout(r, 200));
        await Haptics.impact({ 
          style: ImpactStyle.Light 
        });
      } catch (e) {
        console.warn('[Push] Haptics failed:', e);
      }
      
      if (notificationReceivedCallback) {
        notificationReceivedCallback(notification);
      }
    }
  );

  // User tapped notification listener
  await PushNotifications.addListener(
    'pushNotificationActionPerformed',
    async (action: ActionPerformed) => {
      console.log('[Push] Action performed:', JSON.stringify(action));
      
      try {
        await Haptics.impact({ 
          style: ImpactStyle.Light 
        });
      } catch (e) {}
      
      if (notificationActionCallback) {
        notificationActionCallback(action);
      }
    }
  );

  // Request permission
  console.log('[Push] Step 1: Requesting permissions');
  const permission = await PushNotifications.requestPermissions();
  console.log('[Push] Step 2: Permission result:', JSON.stringify(permission));

  if (permission.receive === 'denied') {
    console.log('[Push] Permission denied');
    return;
  }

  // Register NOW that listeners are attached
  console.log('[Push] Step 3: Calling register()');
  await PushNotifications.register();
  console.log('[Push] register() called');

  isInitialized = true;
  console.log('[Push] Native push initialized successfully');
}

export async function vibrateOnNotification() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ 
      style: ImpactStyle.Medium 
    });
  } catch (e) {}
}

export async function getNativeFCMToken(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const permission = await PushNotifications.checkPermissions();
    if (permission.receive !== 'granted') return null;
    return new Promise((resolve) => {
      PushNotifications.addListener(
        'registration',
        (token: Token) => {
          resolve(token.value);
        }
      );
      PushNotifications.register();
    });
  } catch {
    return null;
  }
}
