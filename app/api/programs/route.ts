import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('programs')
    .select('*, routines(*, routine_exercises(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sort routines and exercises by sort_order
  const programs = (data || []).map((p: Record<string, unknown>) => ({
    ...p,
    routines: ((p.routines as Record<string, unknown>[]) || [])
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.sort_order as number) - (b.sort_order as number))
      .map((r: Record<string, unknown>) => ({
        ...r,
        exercises: ((r.routine_exercises as Record<string, unknown>[]) || [])
          .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.sort_order as number) - (b.sort_order as number)),
      })),
  }));

  return NextResponse.json(programs);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, description, routines } = body as {
    name: string;
    description?: string;
    routines: Array<{
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
    }>;
  };

  // Deactivate all other programs
  await supabase
    .from('programs')
    .update({ is_active: false })
    .eq('user_id', user.id);

  // Create program
  const { data: program, error: programError } = await supabase
    .from('programs')
    .insert({ user_id: user.id, name, description: description || null, is_active: true })
    .select()
    .single();

  if (programError) return NextResponse.json({ error: programError.message }, { status: 500 });

  // Create routines and exercises
  for (let i = 0; i < routines.length; i++) {
    const routine = routines[i];
    const { data: routineRow, error: routineError } = await supabase
      .from('routines')
      .insert({
        program_id: program.id,
        sort_order: i,
        label: routine.label,
        short: routine.short,
        name: routine.name,
        accent: routine.accent,
      })
      .select()
      .single();

    if (routineError) return NextResponse.json({ error: routineError.message }, { status: 500 });

    if (routine.exercises.length > 0) {
      const exercises = routine.exercises.map((ex, j) => ({
        routine_id: routineRow.id,
        sort_order: j,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
      }));

      const { error: exError } = await supabase
        .from('routine_exercises')
        .insert(exercises);

      if (exError) return NextResponse.json({ error: exError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: program.id });
}
