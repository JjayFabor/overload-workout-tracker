'use client';

import { useEffect } from 'react';
import { CircleProgress } from '@/components/ui/CircleProgress';
import { formatTime } from '@/lib/utils';

interface RestTimerProps {
  seconds: number;
  totalSeconds: number;
  onSkip: () => void;
  onDone: () => void;
  onAdjustTime: (delta: number) => void;
  accentColor: string;
}

export function RestTimer({
  seconds,
  totalSeconds,
  onSkip,
  onDone,
  onAdjustTime,
  accentColor,
}: RestTimerProps) {
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;
  const isWarning = seconds <= 10;
  const ringColor = isWarning ? '#E24B4A' : accentColor;

  useEffect(() => {
    if (seconds === 0) {
      onDone();
    }
  }, [seconds, onDone]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <p className="mb-6 text-lg font-medium text-gray-600">Rest Time</p>

        <CircleProgress
          progress={progress}
          size={200}
          strokeWidth={12}
          color={ringColor}
          backgroundColor="#E5E7EB"
        >
          <span
            className={`text-4xl font-bold ${isWarning ? 'text-red-500' : 'text-gray-900'}`}
          >
            {formatTime(seconds)}
          </span>
        </CircleProgress>

        {/* Time adjustment buttons */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={() => onAdjustTime(-30)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 text-xl font-bold text-gray-600 hover:bg-gray-100"
          >
            -30
          </button>
          <button
            onClick={() => onAdjustTime(-10)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-lg font-medium text-gray-600 hover:bg-gray-100"
          >
            -10
          </button>
          <button
            onClick={() => onAdjustTime(10)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-lg font-medium text-gray-600 hover:bg-gray-100"
          >
            +10
          </button>
          <button
            onClick={() => onAdjustTime(30)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 text-xl font-bold text-gray-600 hover:bg-gray-100"
          >
            +30
          </button>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={onSkip}
            className="rounded-full border border-gray-300 px-8 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Skip
          </button>
          <button
            onClick={onDone}
            className="rounded-full px-8 py-3 font-medium text-white"
            style={{ backgroundColor: accentColor }}
          >
            Done early
          </button>
        </div>
      </div>
    </div>
  );
}
