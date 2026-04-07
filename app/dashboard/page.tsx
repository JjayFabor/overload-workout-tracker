'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WorkoutSession } from '@/lib/types';
import { formatDate, isWithinLastWeek } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import { useActiveProgram } from '@/hooks/useActiveProgram';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const { program, loading: programLoading } = useActiveProgram();
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
        setSessionsLoading(false);
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

  const doneThisWeek = (routineId: string): boolean => {
    return sessions.some(
      (s) => s.routine_id === routineId && isWithinLastWeek(s.completed_at)
    );
  };

  const loading = programLoading || sessionsLoading;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Workout</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/programs"
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Active program name */}
      {program && (
        <p className="mb-4 text-sm text-gray-500">
          {program.name}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : !program ? (
        <div className="mb-8 text-center">
          <p className="mb-4 text-gray-500">No active program. Create one to get started!</p>
          <Link
            href="/dashboard/programs/new"
            className="inline-block rounded-xl bg-[#7F77DD] px-6 py-3 font-medium text-white hover:bg-[#6B63C9]"
          >
            Create Program
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3">
            {program.routines.map((routine) => {
              const isDone = doneThisWeek(routine.id);

              return (
                <Link
                  key={routine.id}
                  href={`/dashboard/workout/${routine.id}`}
                  className="relative rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div
                    className="mb-2 text-sm font-medium"
                    style={{ color: routine.accent }}
                  >
                    {routine.label}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {routine.name}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {routine.exercises.length} exercises
                  </div>
                  {isDone && (
                    <div className="absolute right-3 top-3">
                      <Badge variant="success">Done</Badge>
                    </div>
                  )}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl"
                    style={{ backgroundColor: routine.accent }}
                  />
                </Link>
              );
            })}
          </div>

          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Recent Sessions
          </h2>

          {sessions.length === 0 ? (
            <p className="text-gray-500">No workouts yet. Start your first one!</p>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => {
                const routine = program.routines.find((r) => r.id === session.routine_id);
                const accent = routine?.accent || '#7F77DD';
                const short = routine?.short || session.day_name?.charAt(0) || '?';

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
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: accent }}
                    >
                      {short.charAt(0)}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
