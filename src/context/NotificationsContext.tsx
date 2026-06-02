import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { requestAndRegisterToken } from '../lib/firebaseMessaging';

const STORAGE_KEY = 'notifPromptShown';

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

const alreadyShown = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return true;
  }
};

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shouldPrompt, setShouldPromptState] = useState(false);

  const setShouldPrompt = useCallback((value: boolean) => {
    if (!value) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {}
    }
    setShouldPromptState(value);
  }, []);

  const triggerPrompt = useCallback(() => {
    if (!user) return;
    if (alreadyShown()) return;
    if (!browserSupported()) return;
    if (Notification.permission === 'denied') return;
    setShouldPromptState(true);
  }, [user]);

  const registerToken = useCallback(async (): Promise<void> => {
    if (!user) return;

    const sendToken = async (token: string) => {
      try {
        const idToken = await user.getIdToken();
        await fetch('/api/users/fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token }),
        });
      } catch {}
    };

    await requestAndRegisterToken(sendToken);

    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    setShouldPromptState(false);
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
