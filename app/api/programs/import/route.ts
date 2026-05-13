import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  structureProgramFromText,
  structureProgramFromImage,
} from "@/lib/geminiProgramStructurer";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdf-parse@2.x exports PDFParse class (not a default function like v1).
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result.text || "").trim();
  } finally {
    await parser.destroy();
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Program import is not configured. Add GEMINI_API_KEY from Google AI Studio (free tier) to your server environment (e.g. Vercel env or .env.local). Optional: GEMINI_PROGRAM_MODEL (default gemini-2.0-flash).",
      },
      { status: 503 },
    );
  }

  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const textField = form.get("text");
      const pasted = typeof textField === "string" ? textField.trim() : "";
      const file = form.get("file");

      if (file instanceof File && file.size > 0) {
        if (file.size > MAX_BYTES) {
          return NextResponse.json(
            { error: "File too large (max 12 MB)." },
            { status: 400 },
          );
        }
        const buf = Buffer.from(await file.arrayBuffer());
        const mime = file.type || "application/octet-stream";

        if (mime === "application/pdf") {
          const extracted = await extractPdfText(buf);
          if (extracted.length < 40) {
            return NextResponse.json(
              {
                error:
                  "Very little text was read from this PDF. If it is a scanned document, upload a clear photo/screenshot (PNG or JPEG) instead, or paste the program as text.",
              },
              { status: 422 },
            );
          }
          const program = await structureProgramFromText(
            "Workout program (extracted from PDF)",
            extracted,
          );
          return NextResponse.json(program);
        }

        if (ALLOWED_IMAGE.has(mime)) {
          const program = await structureProgramFromImage(
            mime,
            buf.toString("base64"),
          );
          return NextResponse.json(program);
        }

        if (
          mime === "text/plain" ||
          mime === "application/json" ||
          file.name?.toLowerCase().endsWith(".txt")
        ) {
          const text = buf.toString("utf8").trim();
          if (text.length < 20) {
            return NextResponse.json(
              { error: "Text file is too short." },
              { status: 400 },
            );
          }
          const program = await structureProgramFromText(
            "Workout program (from text file)",
            text,
          );
          return NextResponse.json(program);
        }

        return NextResponse.json(
          {
            error: `Unsupported file type: ${mime}. Use PDF, PNG, JPEG, WebP, GIF, or .txt.`,
          },
          { status: 400 },
        );
      }

      if (pasted.length >= 20) {
        const program = await structureProgramFromText(
          "Workout program (pasted text)",
          pasted,
        );
        return NextResponse.json(program);
      }

      return NextResponse.json(
        {
          error: "Add a file or paste at least ~20 characters of your program.",
        },
        { status: 400 },
      );
    }

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { text?: string };
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (text.length < 20) {
        return NextResponse.json(
          { error: 'JSON body "text" must be at least ~20 characters.' },
          { status: 400 },
        );
      }
      const program = await structureProgramFromText(
        "Workout program (JSON text field)",
        text,
      );
      return NextResponse.json(program);
    }

    return NextResponse.json(
      {
        error:
          'Use multipart/form-data (fields: text, file) or application/json with { "text": "..." }.',
      },
      { status: 415 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import failed";
    console.error("[programs/import]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
