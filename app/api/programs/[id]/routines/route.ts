import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: programId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { label, short, name, accent, exercises } = body as {
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
  };

  // Get next sort_order
  const { data: existing } = await supabase
    .from('routines')
    .select('sort_order')
    .eq('program_id', programId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .insert({
      program_id: programId,
      sort_order: nextOrder,
      label,
      short,
      name,
      accent,
    })
    .select()
    .single();

  if (routineError) return NextResponse.json({ error: routineError.message }, { status: 500 });

  if (exercises && exercises.length > 0) {
    const exerciseRows = exercises.map((ex, i) => ({
      routine_id: routine.id,
      sort_order: i,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.rest_seconds,
    }));

    const { error: exError } = await supabase
      .from('routine_exercises')
      .insert(exerciseRows);

    if (exError) return NextResponse.json({ error: exError.message }, { status: 500 });
  }

  return NextResponse.json({ id: routine.id });
}
