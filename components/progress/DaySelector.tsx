'use client';

import { DAYS, DAY_KEYS } from '@/lib/program';
import { DayKey } from '@/lib/types';

interface DaySelectorProps {
  selectedDay: DayKey;
  onSelectDay: (day: DayKey) => void;
}

export function DaySelector({ selectedDay, onSelectDay }: DaySelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {DAY_KEYS.map((key) => {
        const day = DAYS[key];
        const isSelected = selectedDay === key;

        return (
          <button
            key={key}
            onClick={() => onSelectDay(key)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={
              isSelected
                ? { backgroundColor: day.accent }
                : undefined
            }
          >
            {day.short} - {day.name}
          </button>
        );
      })}
    </div>
  );
}
