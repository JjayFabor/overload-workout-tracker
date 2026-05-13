import { GoogleGenAI } from "@google/genai";
import {
  importedProgramSchema,
  SYSTEM_PROMPT,
  buildUserPrompt,
  type ImportedProgram,
} from "@/lib/programImport";

const DEFAULT_MODEL = "gemini-2.0-flash";

function workoutProgramJsonSchema(): Record<string, unknown> {
  const raw = importedProgramSchema.toJSONSchema({
    target: "draft-07",
  }) as Record<string, unknown>;
  delete raw.$schema;
  return raw;
}

function getModel(): string {
  return process.env.GEMINI_PROGRAM_MODEL?.trim() || DEFAULT_MODEL;
}

function parseProgramJson(text: string): ImportedProgram {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }
  const parsed = importedProgramSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Program structure validation failed: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }
  return parsed.data;
}

export async function structureProgramFromText(
  sourceLabel: string,
  rawText: string,
): Promise<ImportedProgram> {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: getModel(),
    contents: buildUserPrompt(sourceLabel, rawText),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: workoutProgramJsonSchema(),
    },
  });
  const text = response.text;
  if (!text?.trim()) throw new Error("Empty response from Gemini");
  return parseProgramJson(text);
}

export async function structureProgramFromImage(
  mimeType: string,
  base64Data: string,
): Promise<ImportedProgram> {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: getModel(),
    contents: [
      "Read this workout program image and extract every training day and exercise. Infer rest_seconds and reps when not shown.",
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: workoutProgramJsonSchema(),
    },
  });
  const text = response.text;
  if (!text?.trim()) throw new Error("Empty response from Gemini");
  return parseProgramJson(text);
}
