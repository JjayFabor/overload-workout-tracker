'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProgramWithRoutines } from '@/lib/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramWithRoutines[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch('/api/programs');
        if (res.ok) setPrograms(await res.json());
      } catch (err) {
        console.error('Failed to fetch programs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, []);

  const handleActivate = async (id: string) => {
    await fetch(`/api/programs/${id}/activate`, { method: 'POST' });
    setPrograms((prev) =>
      prev.map((p) => ({ ...p, is_active: p.id === id }))
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this program? This cannot be undone.')) return;
    await fetch(`/api/programs/${id}`, { method: 'DELETE' });
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <>
      <PageHeader title="Programs" showBack />

      <div className="mx-auto max-w-lg px-4 py-4">
        <Link
          href="/dashboard/programs/new"
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-4 font-medium text-gray-600 hover:border-[#7F77DD] hover:text-[#7F77DD]"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Program
        </Link>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : programs.length === 0 ? (
          <p className="text-center text-gray-500">No programs yet. Create one to get started!</p>
        ) : (
          <div className="space-y-4">
            {programs.map((program) => (
              <div
                key={program.id}
                className={`rounded-xl border bg-white p-4 ${
                  program.is_active ? 'border-[#7F77DD] ring-1 ring-[#7F77DD]' : 'border-gray-200'
                }`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{program.name}</h3>
                      {program.is_active && <Badge variant="accent" accentColor="#7F77DD">Active</Badge>}
                    </div>
                    {program.description && (
                      <p className="mt-1 text-sm text-gray-500">{program.description}</p>
                    )}
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  {program.routines.map((routine) => (
                    <span
                      key={routine.id}
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: `${routine.accent}20`, color: routine.accent }}
                    >
                      {routine.short} - {routine.name}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/programs/${program.id}`)}
                    className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  {!program.is_active && (
                    <button
                      onClick={() => handleActivate(program.id)}
                      className="flex-1 rounded-lg bg-[#7F77DD] py-2 text-sm font-medium text-white hover:bg-[#6B63C9]"
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(program.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
