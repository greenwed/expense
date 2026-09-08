import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';

const BackHandlerContext = createContext({
  registerHandler: () => () => {},
  exitApp: async () => {}
});

export function BackHandlerProvider({ children }) {
  const handlersRef = useRef([]);
  const orderRef = useRef(0);

  const exitApp = useCallback(async () => {
    try {
      await CapApp.exitApp();
    } catch (e) {
      console.warn('Capacitor App.exitApp not supported on this platform:', e);
      if (typeof window !== 'undefined') {
        if (window.navigator?.app?.exitApp) {
          window.navigator.app.exitApp();
        } else {
          window.close();
        }
      }
    }
  }, []);

  const registerHandler = useCallback((fn, priority = 0) => {
    const id = Symbol('backHandler');
    const order = orderRef.current++;
    handlersRef.current.push({ id, fn, priority, order });

    return () => {
      handlersRef.current = handlersRef.current.filter((h) => h.id !== id);
    };
  }, []);

  useEffect(() => {
    let capListener = null;

    const triggerBack = () => {
      const handlers = [...handlersRef.current];
      if (handlers.length === 0) return;

      // Sort handlers: higher priority first; for same priority, newer registration (LIFO) first
      handlers.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return b.order - a.order;
      });

      for (const h of handlers) {
        try {
          const handled = h.fn();
          // If handler returns false, continue to next handler; otherwise consider consumed.
          if (handled !== false) {
            break;
          }
        } catch (err) {
          console.error('Error executing back button handler:', err);
        }
      }
    };

    // 1. Capacitor Native Back Button listener (Android Activity level)
    try {
      CapApp.addListener('backButton', () => {
        triggerBack();
      })
        .then((handle) => {
          capListener = handle;
        })
        .catch((err) => {
          console.warn('CapApp.addListener backButton not available:', err);
        });
    } catch (err) {
      console.warn('CapApp.addListener error:', err);
    }

    // 2. Document backbutton event (Android bridge fallback)
    const handleDocBack = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      triggerBack();
    };
    document.addEventListener('backbutton', handleDocBack);

    return () => {
      if (capListener && capListener.remove) {
        capListener.remove();
      }
      document.removeEventListener('backbutton', handleDocBack);
    };
  }, []);

  return (
    <BackHandlerContext.Provider value={{ registerHandler, exitApp }}>
      {children}
    </BackHandlerContext.Provider>
  );
}

export function useBackHandler() {
  return useContext(BackHandlerContext);
}

export function useBackButton(callback, isActive = true, priority = 10) {
  const { registerHandler } = useBackHandler();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!registerHandler || !isActive) return;

    return registerHandler(() => {
      if (callbackRef.current) {
        return callbackRef.current();
      }
    }, priority);
  }, [registerHandler, isActive, priority]);
}
