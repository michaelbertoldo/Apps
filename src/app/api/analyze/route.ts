import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { analyzeResponseSchema } from "@/lib/schema";

// Vercel/Next.js route handler hints
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // allow longer model processing on Vercel

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    if (!(image instanceof File)) return NextResponse.json({ error: "Missing image" }, { status: 400 });
    if (!image.type.startsWith("image/")) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    if (image.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });

    const b64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini"; // vision-capable default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = "You are a culinary assistant. Given a food photo, identify items, estimate expiration windows, and propose simple recipes. Return only strict JSON in the provided schema. No extra text.";
    const schemaHint = `Schema:\n{\n  "detectedItems": [{"name": string, "quantity"?: string}],\n  "expirationEstimates": [{"item": string, "daysUntilExpiry": number}],\n  "recipes": [{"title": string, "ingredients": string[], "steps": string[], "estimatedTimeMinutes"?: number}]\n}`;

    const completion = await openai.chat.completions.create(
      {
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: schemaHint },
              { type: "image_url", image_url: { url: `data:${image.type};base64,${b64}` } },
            ],
          },
        ],
      },
      { timeout: 30000 }
    );

    const content = completion.choices?.[0]?.message?.content || "";
    const json = coerceJson(content);
    if (!json) return NextResponse.json({ error: "Invalid JSON from model" }, { status: 500 });
    const validated = analyzeResponseSchema.safeParse(json);
    if (!validated.success) return NextResponse.json({ error: "Response validation failed" }, { status: 500 });
    return NextResponse.json(validated.data, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const err = e as { message?: string; status?: number };
    const msg = err?.message || "Server error";
    const status = /timeout/i.test(msg) ? 504 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

function coerceJson(text: string) {
  try { return JSON.parse(text); } catch {}
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  try { return JSON.parse(trimmed); } catch {}
  return null;
}


