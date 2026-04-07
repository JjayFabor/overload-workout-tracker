'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DAYS } from '@/lib/program';
import { DayKey, WorkoutSession } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const data = await res.json();
          setSessions(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, []);

  // Group sessions by month
  const groupedSessions = sessions.reduce(
    (groups, session) => {
      const date = new Date(session.completed_at);
      const monthYear = date.toLocaleDateString('en-PH', {
        month: 'long',
        year: 'numeric',
      });

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(session);
      return groups;
    },
    {} as Record<string, WorkoutSession[]>
  );

  return (
    <>
      <PageHeader title="History" />

      <div className="mx-auto max-w-lg px-4 py-4">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="text-center text-gray-500">No workout history yet</p>
        ) : (
          Object.entries(groupedSessions).map(([monthYear, monthSessions]) => (
            <div key={monthYear} className="mb-6">
              <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
                {monthYear}
              </h2>
              <div className="space-y-3">
                {monthSessions.map((session) => {
                  const day = DAYS[session.day_key as DayKey];
                  return (
                    <Link
                      key={session.id}
                      href={`/dashboard/history/${session.id}`}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: day?.accent || '#7F77DD' }}
                        >
                          {day?.short.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {session.day_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(session.completed_at)}
                          </div>
                        </div>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
