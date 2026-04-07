'use client';

import { useState, useEffect, useCallback } from 'react';

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

export function useTimer(): UseTimerReturn {
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0 && isRunning) {
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds]);

  const start = useCallback((durationSeconds: number = DEFAULT_REST_SECONDS) => {
    setSeconds(durationSeconds);
    setTotalSeconds(durationSeconds);
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
    setTotalSeconds(0);
  }, []);

  const reset = useCallback(() => {
    setSeconds(totalSeconds);
    setIsRunning(true);
  }, [totalSeconds]);

  const adjustTime = useCallback((delta: number) => {
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
