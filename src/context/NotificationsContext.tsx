import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { requestAndRegisterToken, initMessaging } from '../lib/firebaseMessaging';
import { onMessage } from 'firebase/messaging';
import { toast } from 'sonner';

interface NotificationsContextType {
  shouldPrompt: boolean;
  setShouldPrompt: (value: boolean) => void;
  triggerPrompt: () => void;
  registerToken: () => Promise<void>;
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
      id = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
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

  const setShouldPrompt = useCallback((value: boolean) => {
    setShouldPromptState(value);
  }, []);

  const triggerPrompt = useCallback(() => {
    if (!user) return;
    if (!browserSupported()) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;
    setShouldPromptState(true);
  }, [user]);

  const registerToken = useCallback(async (): Promise<void> => {
    if (!user) return;

    const sendToken = async (token: string) => {
      try {
        const idToken = await user.getIdToken();
        const deviceId = getOrCreateDeviceId();
        const response = await fetch('/api/users/fcm-token', {
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

    await requestAndRegisterToken(sendToken);
    setShouldPromptState(false);
  }, [user]);

  // Auto-register/refresh FCM token on login/startup if permission is already granted
  useEffect(() => {
    if (user && browserSupported() && Notification.permission === 'granted') {
      try {
        if (sessionStorage.getItem(`fcm_synced_${user.uid}`) === 'true') {
          return;
        }
      } catch {}
      console.log('[FCM] Notification permission is already granted. Auto-registering/refreshing token...');
      registerToken();
    }
  }, [user, registerToken]);

  // Listen for foreground notifications
  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | null = null;

    const setupForegroundListener = async () => {
      try {
        const messaging = await initMessaging();
        if (!messaging) return;

        console.log('[FCM] Registering foreground notification listener.');
        unsubscribe = onMessage(messaging, (payload) => {
          console.log('[FCM] Foreground notification received:', payload);
          const { title, body } = payload.notification || {};
          const toastTitle = title || 'Thunderbold';
          const toastBody = body || '';
          const data = payload.data || {};

          // Trigger a premium custom toast notification
          toast(toastTitle, {
            description: toastBody,
            duration: 8000,
            action: data.orderId ? {
              label: 'View Order',
              onClick: () => {
                window.location.href = `/orders?orderId=${data.orderId}`;
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
    <NotificationsContext.Provider value={{ shouldPrompt, setShouldPrompt, triggerPrompt, registerToken }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextType {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsContext must be used within NotificationsProvider');
  return ctx;
}
