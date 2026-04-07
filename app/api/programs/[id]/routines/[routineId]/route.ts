import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; routineId: string }> }
) {
  const { routineId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { label, short, name, accent, exercises } = body as {
    label?: string;
    short?: string;
    name?: string;
    accent?: string;
    exercises?: Array<{
      name: string;
      sets: number;
      reps: string;
      rest_seconds: number;
    }>;
  };

  // Update routine metadata
  const updates: Record<string, unknown> = {};
  if (label !== undefined) updates.label = label;
  if (short !== undefined) updates.short = short;
  if (name !== undefined) updates.name = name;
  if (accent !== undefined) updates.accent = accent;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('routines')
      .update(updates)
      .eq('id', routineId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Replace exercises if provided
  if (exercises) {
    await supabase
      .from('routine_exercises')
      .delete()
      .eq('routine_id', routineId);

    if (exercises.length > 0) {
      const exerciseRows = exercises.map((ex, i) => ({
        routine_id: routineId,
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
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; routineId: string }> }
) {
  const { routineId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', routineId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
