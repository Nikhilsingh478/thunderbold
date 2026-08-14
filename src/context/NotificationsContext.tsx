import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
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

function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem('thunderbold_device_id');
    if (!id) {
      id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('thunderbold_device_id', id);
    }
    return id;
  } catch {
    return 'temp_device_' + Date.now();
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shouldPrompt, setShouldPromptState] = useState(false);
  const [isApp, setIsApp] = useState(false);

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

  const registerToken = useCallback(async (): Promise<void> => {
    if (!user) return;

    const sendToken = async (token: string) => {
      try {
        const idToken = await user.getIdToken();
        const deviceId = getOrCreateDeviceId();
        const response = await fetch('https://thunderbold.shop/api/users/fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token, deviceId }),
        });
        
        if (response.ok) {
          console.log('[FCM] Token stored in database successfully.');
          try {
            sessionStorage.setItem(`fcm_synced_${user.uid}`, 'true');
          } catch {}
        } else {
          const errData = await response.json().catch(() => ({}));
          console.error('[FCM] Backend failed to store token:', errData.error || response.statusText);
        }
      } catch (err) {
        console.error('[FCM] Error storing token on backend:', err);
      }
    };

    if (Capacitor.isNativePlatform()) {
      return;
    }

    // Web-only: dynamic import to avoid bundling firebase/messaging on native
    const { requestAndRegisterToken } = await import('../lib/firebaseMessaging');
    await requestAndRegisterToken(sendToken);
    setShouldPromptState(false);
  }, [user]);

  // Native Push Setup (runs once on mount on native platforms)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupNativePush = async () => {
      await initNativePush(
        // TOKEN RECEIVED — register with backend
        async (fcmToken: string) => {
          try {
            let deviceId = localStorage.getItem('thunderbold_device_id');
            if (!deviceId) {
              deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
              localStorage.setItem('thunderbold_device_id', deviceId);
            }

            localStorage.setItem('thunderbold_pending_fcm_token', fcmToken);

            if (user) {
              const idToken = await user.getIdToken();
              await fetch('https://thunderbold.shop/api/users/fcm-token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ token: fcmToken, deviceId }),
              });
              console.log('[Push] FCM token registered');
            }
          } catch (error) {
            console.error('[Push] Token registration error:', error);
          }
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
  }, [user]);

  // ALSO — register pending token when user logs in
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    const registerPendingToken = async () => {
      const pendingToken = localStorage.getItem('thunderbold_pending_fcm_token');
      if (!pendingToken) return;

      try {
        let deviceId = localStorage.getItem('thunderbold_device_id');
        if (!deviceId) {
          deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
          localStorage.setItem('thunderbold_device_id', deviceId);
        }

        const idToken = await user.getIdToken();
        await fetch('https://thunderbold.shop/api/users/fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token: pendingToken, deviceId }),
        });
        console.log('[Push] Pending token registered');
      } catch (error) {
        console.error('[Push] Pending token error:', error);
      }
    };

    registerPendingToken();
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
