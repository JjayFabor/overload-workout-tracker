'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DAYS, DAY_KEYS } from '@/lib/program';
import { DayKey, WorkoutSession } from '@/lib/types';
import { formatDate, isWithinLastWeek } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const data = await res.json();
          setSessions((data || []).slice(0, 10));
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, []);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const doneThisWeek = (dayKey: DayKey): boolean => {
    return sessions.some(
      (s) => s.day_key === dayKey && isWithinLastWeek(s.completed_at)
    );
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Workout</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3">
        {DAY_KEYS.map((key) => {
          const day = DAYS[key];
          const isDone = doneThisWeek(key);

          return (
            <Link
              key={key}
              href={`/dashboard/workout/${key}`}
              className="relative rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div
                className="mb-2 text-sm font-medium"
                style={{ color: day.accent }}
              >
                {day.label}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {day.name}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {day.exercises.length} exercises
              </div>
              {isDone && (
                <div className="absolute right-3 top-3">
                  <Badge variant="success">Done</Badge>
                </div>
              )}
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl"
                style={{ backgroundColor: day.accent }}
              />
            </Link>
          );
        })}
      </div>

      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Recent Sessions
      </h2>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : sessions.length === 0 ? (
        <p className="text-gray-500">No workouts yet. Start your first one!</p>
      ) : (
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session) => {
            const day = DAYS[session.day_key as DayKey];
            return (
              <Link
                key={session.id}
                href={`/dashboard/history/${session.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {session.day_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(session.completed_at)}
                  </div>
                </div>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: day?.accent || '#7F77DD' }}
                >
                  {day?.short.charAt(0)}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
