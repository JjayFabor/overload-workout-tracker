'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_REST_SECONDS = 180; // 3 minutes

interface UseTimerReturn {
  seconds: number;
  isRunning: boolean;
  totalSeconds: number;
  start: (durationSeconds?: number) => void;
  stop: () => void;
  reset: () => void;
  adjustTime: (delta: number) => void;
}

function notifyTimerDone() {
  // Vibrate if supported (mobile)
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }

  // Send a notification if permission was granted
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification('Rest Timer Done', {
      body: 'Time to start your next set!',
      icon: '/icons/overload-logo.png',
      tag: 'rest-timer', // replaces previous timer notifications
    });
  }
}

export function requestNotificationPermission() {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function useTimer(): UseTimerReturn {
  // Store the absolute end time so background tabs compute the correct remaining time
  const endTimeRef = useRef<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!isRunning || endTimeRef.current === null) return;

    const tick = () => {
      const remaining = Math.round((endTimeRef.current! - Date.now()) / 1000);
      if (remaining <= 0) {
        setSeconds(0);
        setIsRunning(false);
        endTimeRef.current = null;
        if (!notifiedRef.current) {
          notifiedRef.current = true;
          notifyTimerDone();
        }
      } else {
        setSeconds(remaining);
      }
    };

    // Immediately sync on mount / visibility change (catches background → foreground)
    tick();

    const interval = setInterval(tick, 1000);

    // Also re-sync when the tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isRunning]);

  const start = useCallback((durationSeconds: number = DEFAULT_REST_SECONDS) => {
    endTimeRef.current = Date.now() + durationSeconds * 1000;
    notifiedRef.current = false;
    setSeconds(durationSeconds);
    setTotalSeconds(durationSeconds);
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
    setSeconds(0);
    setTotalSeconds(0);
  }, []);

  const reset = useCallback(() => {
    endTimeRef.current = Date.now() + totalSeconds * 1000;
    notifiedRef.current = false;
    setSeconds(totalSeconds);
    setIsRunning(true);
  }, [totalSeconds]);

  const adjustTime = useCallback((delta: number) => {
    if (endTimeRef.current !== null) {
      endTimeRef.current += delta * 1000;
    }
    setSeconds((prev) => Math.max(0, prev + delta));
    setTotalSeconds((prev) => Math.max(0, prev + delta));
  }, []);

  return {
    seconds,
    isRunning,
    totalSeconds,
    start,
    stop,
    reset,
    adjustTime,
  };
}

export { DEFAULT_REST_SECONDS };
