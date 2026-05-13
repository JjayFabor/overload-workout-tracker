import { z } from "zod";

/** Structured program import — matches POST /api/programs body shape (routines[].exercises). */
export const importedExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.number().int().min(1).max(20),
  reps: z.string().min(1),
  rest_seconds: z.number().int().min(0).max(900),
});

export const importedRoutineSchema = z.object({
  label: z.string().min(1),
  short: z.string().min(1).max(12),
  name: z.string().min(1),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  exercises: z.array(importedExerciseSchema),
});

export const importedProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  routines: z.array(importedRoutineSchema).min(1).max(14),
});

export type ImportedProgram = z.infer<typeof importedProgramSchema>;

const SYSTEM_PROMPT = `You convert workout program descriptions into structured JSON for a training app.

Rules:
- Each "routine" is one training day (e.g. Monday Upper, Push Day). Use clear label (e.g. "Monday") and short code (e.g. "Mon", max 12 chars).
- "name" for the routine is the workout focus (e.g. "Upper", "Push", "Legs").
- accent must be a 6-digit hex color like #7F77DD (vary colors across days if possible).
- exercises: use the exact exercise names from the source when possible.
- sets: integer number of working sets.
- reps: a short string like "8-12", "10", "6-10", "12 each", "AMRAP".
- rest_seconds: rest between sets in seconds (typical: 90 for isolation, 120-150 semi-compound, 180 compounds).

If the source is ambiguous, infer reasonable defaults. Output only valid JSON matching the schema.`;

export { SYSTEM_PROMPT };

export function buildUserPrompt(sourceLabel: string, rawText: string): string {
  return `${sourceLabel}:\n\n"""${rawText.slice(0, 120_000)}"""`;
}
