import { modalController } from './modalController';

interface StoredAction {
  action: () => void;
  context?: any;
}

let storedAction: StoredAction | null = null;

export function requireAuth<T extends (...args: any[]) => any>(
  action: T,
  user: any | null,
  context?: Parameters<T>[0]
): T {
  return ((...args: any[]) => {
    if (!user) {
      // Store the intended action and context for after login
      storedAction = {
        action: () => action(...args),
        context: context || args[0]
      };
      
      // Use modal controller to show login modal
      modalController.openModal('requireAuth', context);
      return;
    }
    
    // User is logged in, execute the action
    return action(...args);
  }) as T;
}

export function getStoredAction(): StoredAction | null {
  return storedAction;
}

export function clearStoredAction(): void {
  storedAction = null;
}

export function executeStoredAction(): void {
  if (storedAction) {
    const { action } = storedAction;
    action();
    clearStoredAction();
  }
}
