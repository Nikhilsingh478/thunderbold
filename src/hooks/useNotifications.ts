import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestAndRegisterToken } from '../lib/firebaseMessaging';

const STORAGE_KEY = 'notifPromptShown';

/**
 * Manages the push notification permission prompt lifecycle.
 *
 * - `shouldPrompt`: true when the user is authenticated, has not dismissed the
 *   prompt before, and the browser supports Notifications.
 * - `setShouldPrompt`: lets the calling component dismiss the prompt.
 * - `registerToken`: requests browser permission, gets the FCM token, and
 *   persists it to the backend via POST /api/users/fcm-token.
 */
export function useNotifications() {
  const { user } = useAuth();

  const alreadyShown = (): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return true;
    }
  };

  const browserSupported = (): boolean =>
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator;

  const [shouldPrompt, setShouldPromptState] = useState<boolean>(() => {
    if (!browserSupported()) return false;
    if (alreadyShown()) return false;
    return false;
  });

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

  return { shouldPrompt, setShouldPrompt, triggerPrompt, registerToken };
}
