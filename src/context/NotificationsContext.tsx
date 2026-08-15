import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './AuthContext';
import { initNativePush } from '../lib/nativePushNotifications';
import { toast } from 'sonner';
import { apiUrl } from '../lib/apiBase';

export const isStandaloneApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    Capacitor.isNativePlatform() ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://') ||
    window.location.search.includes('utm_source=twa')
  );
};

interface NotificationsContextType {
  shouldPrompt: boolean;
  setShouldPrompt: (value: boolean) => void;
  triggerPrompt: () => void;
  registerToken: () => Promise<void>;
  isApp: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

const browserSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userRef = useRef(user);
  const [shouldPrompt, setShouldPromptState] = useState(false);
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    setIsApp(isStandaloneApp());
  }, []);

  const setShouldPrompt = useCallback((value: boolean) => {
    setShouldPromptState(value);
  }, []);

  const triggerPrompt = useCallback(() => {
    if (Capacitor.isNativePlatform()) return;
    if (!browserSupported()) return;
    if (!isStandaloneApp()) return;
    if (Notification.permission === 'granted') return;

    try {
      const dismissedAt = localStorage.getItem('tb_notif_prompt_dismissed');
      if (dismissedAt) {
        const diffDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
        if (diffDays < 3) return;
      }
    } catch {}

    setShouldPromptState(true);
  }, []);

  const sendTokenToBackend = useCallback(async (fcmToken: string) => {
    const currentUser = userRef.current;
    try {
      let deviceId = localStorage.getItem('thunderbold_device_id');
      if (!deviceId) {
        deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('thunderbold_device_id', deviceId);
      }

      localStorage.setItem('thunderbold_pending_fcm_token', fcmToken);

      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        const endpoint = apiUrl('/api/users/fcm-token');
        console.log(`[Push] Registering token for user ${currentUser.email} to ${endpoint}`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token: fcmToken, deviceId }),
        });

        if (response.ok) {
          console.log('[Push] FCM token stored in backend database successfully.');
          localStorage.removeItem('thunderbold_pending_fcm_token');
          try {
            sessionStorage.setItem(`fcm_synced_${currentUser.uid}`, 'true');
          } catch {}
        } else {
          const errData = await response.json().catch(() => ({}));
          console.error('[Push] Backend failed to store FCM token:', errData.error || response.statusText);
        }
      } else {
        console.log('[Push] User not logged in yet. Token stored in pending state.');
      }
    } catch (err) {
      console.error('[Push] Error storing FCM token on backend:', err);
    }
  }, []);

  const registerNativeFcmToken = useCallback(async (fcmToken: string) => {
    console.log('[Push] Token callback fired');
    console.log('[Push] Token received, length:', fcmToken.length);
    console.log('[Push] Current user:', userRef.current?.email);

    localStorage.setItem('thunderbold_native_fcm_token', fcmToken);
    localStorage.removeItem('thunderbold_token_registered');

    let deviceId = localStorage.getItem('thunderbold_device_id');
    if (!deviceId) {
      deviceId = 'android_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('thunderbold_device_id', deviceId);
    }

    const registerTokenWithRetry = async (attempt: number = 1): Promise<void> => {
      const currentUser = userRef.current;

      if (!currentUser) {
        if (attempt <= 5) {
          console.log(`[Push] User not ready, retry ${attempt}/5 in ${attempt * 2}s`);
          setTimeout(() => registerTokenWithRetry(attempt + 1), attempt * 2000);
        }
        return;
      }

      try {
        console.log('[Push] Calling backend...');
        const idToken = await currentUser.getIdToken(true);
        console.log('[Push] Registering token with backend, attempt:', attempt);

        const response = await fetch(apiUrl('/api/users/fcm-token'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token: fcmToken, deviceId }),
        });

        console.log('[Push] Backend response status:', response.status);
        const responseText = await response.text();
        console.log('[Push] Backend response:', responseText);

        if (response.ok) {
          console.log('[Push] Token registered successfully');
          localStorage.setItem('thunderbold_token_registered', 'true');
        } else {
          console.error('[Push] Registration failed:', response.status, responseText);
          if (response.status >= 500 && attempt <= 5) {
            setTimeout(() => registerTokenWithRetry(attempt + 1), attempt * 2000);
          }
        }
      } catch (error) {
        console.error('[Push] Registration error:', error);
        if (attempt <= 5) {
          setTimeout(() => registerTokenWithRetry(attempt + 1), attempt * 2000);
        }
      }
    };

    await registerTokenWithRetry();
  }, []);

  const registerToken = useCallback(async (): Promise<void> => {
    if (!user) return;

    if (Capacitor.isNativePlatform()) {
      return;
    }

    // Web-only: dynamic import to avoid bundling firebase/messaging on native
    const { requestAndRegisterToken } = await import('../lib/firebaseMessaging');
    await requestAndRegisterToken((token) => sendTokenToBackend(token));
    setShouldPromptState(false);
  }, [user, sendTokenToBackend]);

  // Native Push Setup (runs on native platforms)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupNativePush = async () => {
      await initNativePush(
        (fcmToken: string) => {
          registerNativeFcmToken(fcmToken);
        },

        // FOREGROUND NOTIFICATION RECEIVED
        (notification) => {
          const title = notification.title || 'Thunderbold';
          const body = notification.body || '';

          toast(title, {
            description: body,
            duration: 5000,
            action: notification.data?.orderId ? {
              label: 'View Order',
              onClick: () => {
                const orderId = notification.data.orderId;
                if (/^[a-f0-9]{24}$/i.test(orderId)) {
                  window.location.href = `/orders?orderId=${orderId}`;
                }
              }
            } : undefined,
          });
        },

        // NOTIFICATION TAPPED (background/killed)
        (action) => {
          const data = action.notification.data;
          if (data?.orderId && /^[a-f0-9]{24}$/i.test(data.orderId)) {
            window.location.href = `/orders?orderId=${data.orderId}`;
          } else if (data?.link) {
            window.location.href = data.link;
          } else {
            window.location.href = '/orders';
          }
        }
      );
    };

    setupNativePush();
  }, [registerNativeFcmToken]);

  // Re-register stored FCM token after user login
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    const storedToken = localStorage.getItem('thunderbold_native_fcm_token');
    const alreadyRegistered = localStorage.getItem('thunderbold_token_registered');

    if (storedToken && !alreadyRegistered) {
      console.log('[Push] Re-registering stored token after login');

      let deviceId = localStorage.getItem('thunderbold_device_id');
      if (!deviceId) {
        deviceId = 'android_' + Math.random().toString(36).substring(2);
        localStorage.setItem('thunderbold_device_id', deviceId);
      }

      user.getIdToken(true)
        .then((idToken) => fetch(apiUrl('/api/users/fcm-token'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token: storedToken, deviceId }),
        }))
        .then((r) => {
          if (r.ok) {
            console.log('[Push] Token re-registered after login');
            localStorage.setItem('thunderbold_token_registered', 'true');
          }
        })
        .catch((e) => console.error('[Push] Re-registration error:', e));
    }
  }, [user]);

  // Web FCM auto-register and foreground listener
  useEffect(() => {
    if (!user || Capacitor.isNativePlatform()) return;

    if (browserSupported() && Notification.permission === 'granted') {
      try {
        if (sessionStorage.getItem(`fcm_synced_${user.uid}`) === 'true') {
          return;
        }
      } catch {}
      console.log('[FCM] Notification permission is already granted. Auto-registering/refreshing token...');
      registerToken();
    }
  }, [user, registerToken]);

  useEffect(() => {
    if (!user || Capacitor.isNativePlatform()) return;

    let unsubscribe: (() => void) | null = null;

    const setupForegroundListener = async () => {
      try {
        const { initMessaging } = await import('../lib/firebaseMessaging');
        const { onMessage } = await import('firebase/messaging');
        const messaging = await initMessaging();
        if (!messaging) return;

        console.log('[FCM] Registering foreground notification listener.');
        unsubscribe = onMessage(messaging, (payload) => {
          console.log('[FCM] Foreground notification received:', payload);
          const { title, body } = payload.notification || {};
          const toastTitle = title || 'Thunderbold';
          const toastBody = body || '';
          const data = payload.data || {};

          toast(toastTitle, {
            description: toastBody,
            duration: 8000,
            action: data.orderId ? {
              label: 'View Order',
              onClick: () => {
                const isValidObjectId = /^[a-f0-9]{24}$/i.test(data.orderId);
                if (isValidObjectId) {
                  window.location.href = `/orders?orderId=${data.orderId}`;
                } else if (data.link) {
                  window.location.href = data.link;
                } else {
                  window.location.href = '/orders';
                }
              }
            } : undefined,
          });
        });
      } catch (err) {
        console.error('[FCM] Error setting up foreground message listener:', err);
      }
    };

    setupForegroundListener();

    return () => {
      if (unsubscribe) {
        console.log('[FCM] Unsubscribing foreground notification listener.');
        unsubscribe();
      }
    };
  }, [user]);

  return (
    <NotificationsContext.Provider value={{ shouldPrompt, setShouldPrompt, triggerPrompt, registerToken, isApp }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextType {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsContext must be used within NotificationsProvider');
  return ctx;
}
