'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { V_TAPER_TEMPLATE, ACCENT_COLORS } from '@/lib/program';

interface RoutineForm {
  label: string;
  short: string;
  name: string;
  accent: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    rest_seconds: number;
  }>;
}

export default function NewProgramPage() {
  const router = useRouter();
  const [programName, setProgramName] = useState('');
  const [description, setDescription] = useState('');
  const [routines, setRoutines] = useState<RoutineForm[]>([]);
  const [saving, setSaving] = useState(false);

  const handleUseTemplate = () => {
    setProgramName(V_TAPER_TEMPLATE.name);
    setDescription(V_TAPER_TEMPLATE.description);
    setRoutines(V_TAPER_TEMPLATE.routines.map((r) => ({ ...r, exercises: [...r.exercises] })));
  };

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
    if (!programName.trim() || routines.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: programName, description, routines }),
      });

      if (res.ok) {
        router.push('/dashboard/programs');
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to create program:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="New Program" showBack />

      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Template button */}
        <button
          onClick={handleUseTemplate}
          className="mb-6 w-full rounded-xl border border-[#7F77DD] bg-[#7F77DD]/5 py-3 text-sm font-medium text-[#7F77DD] hover:bg-[#7F77DD]/10"
        >
          Use V-Taper Template
        </button>

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
              key={rIdx}
              className="rounded-xl border border-gray-200 bg-white p-4"
              style={{ borderLeftColor: routine.accent, borderLeftWidth: 4 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex flex-1 gap-2">
                  <input
                    type="text"
                    placeholder="Label (e.g. Monday)"
                    value={routine.label}
                    onChange={(e) => updateRoutine(rIdx, 'label', e.target.value)}
                    className="w-1/3 rounded border border-gray-200 px-2 py-1 text-sm focus:border-[#7F77DD] focus:outline-none"
                  />
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
          disabled={saving || !programName.trim() || routines.length === 0}
          className="mt-6 w-full rounded-xl bg-[#7F77DD] py-4 text-lg font-semibold text-white transition-opacity hover:bg-[#6B63C9] disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Program'}
        </button>
      </div>
    </>
  );
}
