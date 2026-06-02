/**
 * Thin wrapper around NotificationsContext.
 * All notification state lives in the context provider so that
 * any component (e.g. Checkout, NotificationPermissionPrompt)
 * shares the same `shouldPrompt` state instance.
 */
export { useNotificationsContext as useNotifications } from '../context/NotificationsContext';
