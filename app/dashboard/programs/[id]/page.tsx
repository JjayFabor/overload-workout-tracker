'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProgramWithRoutines } from '@/lib/types';
import { ACCENT_COLORS, DAY_OPTIONS } from '@/lib/program';
import { PageHeader } from '@/components/layout/PageHeader';

interface ExerciseForm {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
}

interface RoutineForm {
  id?: string;
  label: string;
  short: string;
  name: string;
  accent: string;
  exercises: ExerciseForm[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProgramPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [programName, setProgramName] = useState('');
  const [description, setDescription] = useState('');
  const [routines, setRoutines] = useState<RoutineForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProgram() {
      try {
        const res = await fetch(`/api/programs/${id}`);
        if (res.ok) {
          const program: ProgramWithRoutines = await res.json();
          setProgramName(program.name);
          setDescription(program.description || '');
          setRoutines(
            program.routines.map((r) => ({
              id: r.id,
              label: r.label,
              short: r.short,
              name: r.name,
              accent: r.accent,
              exercises: r.exercises.map((ex) => ({
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                rest_seconds: ex.rest_seconds,
              })),
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch program:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProgram();
  }, [id]);

  const handleAddRoutine = () => {
    setRoutines([
      ...routines,
      {
        label: `Day ${routines.length + 1}`,
        short: `D${routines.length + 1}`,
        name: '',
        accent: ACCENT_COLORS[routines.length % ACCENT_COLORS.length],
        exercises: [],
      },
    ]);
  };

  const handleRemoveRoutine = (index: number) => {
    const routine = routines[index];
    if (routine.id) {
      if (!confirm('Delete this routine? Exercises inside will also be deleted.')) return;
    }
    setRoutines(routines.filter((_, i) => i !== index));
  };

  const updateRoutine = (index: number, field: keyof RoutineForm, value: string) => {
    setRoutines((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const addExercise = (routineIndex: number) => {
    setRoutines((prev) =>
      prev.map((r, i) =>
        i === routineIndex
          ? { ...r, exercises: [...r.exercises, { name: '', sets: 2, reps: '8-12', rest_seconds: 90 }] }
          : r
      )
    );
  };

  const removeExercise = (routineIndex: number, exIndex: number) => {
    setRoutines((prev) =>
      prev.map((r, i) =>
        i === routineIndex
          ? { ...r, exercises: r.exercises.filter((_, j) => j !== exIndex) }
          : r
      )
    );
  };

  const updateExercise = (
    routineIndex: number,
    exIndex: number,
    field: string,
    value: string | number
  ) => {
    setRoutines((prev) =>
      prev.map((r, i) =>
        i === routineIndex
          ? {
              ...r,
              exercises: r.exercises.map((ex, j) =>
                j === exIndex ? { ...ex, [field]: value } : ex
              ),
            }
          : r
      )
    );
  };

  const handleSave = async () => {
    if (!programName.trim()) return;
    setSaving(true);

    try {
      // Update program metadata
      await fetch(`/api/programs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: programName, description }),
      });

      // For each routine: update existing or create new
      for (const routine of routines) {
        if (routine.id) {
          // Update existing routine
          await fetch(`/api/programs/${id}/routines/${routine.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              label: routine.label,
              short: routine.short,
              name: routine.name,
              accent: routine.accent,
              exercises: routine.exercises,
            }),
          });
        } else {
          // Create new routine
          await fetch(`/api/programs/${id}/routines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              label: routine.label,
              short: routine.short,
              name: routine.name,
              accent: routine.accent,
              exercises: routine.exercises,
            }),
          });
        }
      }

      // Delete routines that were removed (compare with fetched data)
      const res = await fetch(`/api/programs/${id}`);
      if (res.ok) {
        const current: ProgramWithRoutines = await res.json();
        const keptIds = routines.filter((r) => r.id).map((r) => r.id);
        for (const existing of current.routines) {
          if (!keptIds.includes(existing.id)) {
            await fetch(`/api/programs/${id}/routines/${existing.id}`, {
              method: 'DELETE',
            });
          }
        }
      }

      router.push('/dashboard/programs');
      router.refresh();
    } catch (err) {
      console.error('Failed to save program:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Edit Program" showBack />
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Edit Program" showBack />

      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Program info */}
        <div className="mb-6 space-y-3">
          <input
            type="text"
            placeholder="Program name"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#7F77DD] focus:outline-none focus:ring-1 focus:ring-[#7F77DD]"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#7F77DD] focus:outline-none focus:ring-1 focus:ring-[#7F77DD]"
          />
        </div>

        {/* Routines */}
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Routines</h2>

        <div className="space-y-4">
          {routines.map((routine, rIdx) => (
            <div
              key={routine.id || rIdx}
              className="rounded-xl border border-gray-200 bg-white p-4"
              style={{ borderLeftColor: routine.accent, borderLeftWidth: 4 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex flex-1 gap-2">
                  <select
                    value={routine.label}
                    onChange={(e) => {
                      const day = DAY_OPTIONS.find((d) => d.label === e.target.value);
                      if (day) {
                        updateRoutine(rIdx, 'label', day.label);
                        updateRoutine(rIdx, 'short', day.short);
                      }
                    }}
                    className="w-1/3 rounded border border-gray-200 px-2 py-1 text-sm focus:border-[#7F77DD] focus:outline-none"
                  >
                    {DAY_OPTIONS.map((day) => (
                      <option key={day.label} value={day.label}>{day.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Name (e.g. Push)"
                    value={routine.name}
                    onChange={(e) => updateRoutine(rIdx, 'name', e.target.value)}
                    className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:border-[#7F77DD] focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => handleRemoveRoutine(rIdx)}
                  className="ml-2 text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Color picker */}
              <div className="mb-3 flex gap-1.5">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateRoutine(rIdx, 'accent', color)}
                    className={`h-6 w-6 rounded-full border-2 ${
                      routine.accent === color ? 'border-gray-900' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Exercises */}
              <div className="space-y-2">
                {routine.exercises.map((ex, eIdx) => (
                  <div key={eIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Exercise name"
                      value={ex.name}
                      onChange={(e) => updateExercise(rIdx, eIdx, 'name', e.target.value)}
                      className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:border-[#7F77DD] focus:outline-none"
                    />
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => updateExercise(rIdx, eIdx, 'sets', parseInt(e.target.value) || 2)}
                      className="w-12 rounded border border-gray-200 px-1 py-1 text-center text-sm focus:border-[#7F77DD] focus:outline-none"
                      min={1}
                    />
                    <span className="text-xs text-gray-400">sets</span>
                    <input
                      type="text"
                      placeholder="8-12"
                      value={ex.reps}
                      onChange={(e) => updateExercise(rIdx, eIdx, 'reps', e.target.value)}
                      className="w-16 rounded border border-gray-200 px-1 py-1 text-center text-sm focus:border-[#7F77DD] focus:outline-none"
                    />
                    <button
                      onClick={() => removeExercise(rIdx, eIdx)}
                      className="text-red-300 hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addExercise(rIdx)}
                className="mt-2 w-full rounded-lg border border-dashed border-gray-300 py-1.5 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
              >
                + Add Exercise
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddRoutine}
          className="mt-4 w-full rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 hover:border-[#7F77DD] hover:text-[#7F77DD]"
        >
          + Add Routine Day
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !programName.trim()}
          className="mt-6 w-full rounded-xl bg-[#7F77DD] py-4 text-lg font-semibold text-white transition-opacity hover:bg-[#6B63C9] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </>
  );
}
