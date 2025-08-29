import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { analyzeResponseSchema } from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    if (!(image instanceof File)) return NextResponse.json({ error: "Missing image" }, { status: 400 });
    if (image.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });

    const b64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const model = process.env.OPENAI_MODEL || "gpt-5-nano";
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = "You are a culinary assistant. Given a food photo, identify items, estimate expiration windows, and propose simple recipes. Return only strict JSON in the provided schema. No extra text.";
    const schemaHint = `Schema:
{
  "detectedItems": [{"name": string, "quantity"?: string}],
  "expirationEstimates": [{"item": string, "daysUntilExpiry": number}],
  "recipes": [{"title": string, "ingredients": string[], "steps": string[], "estimatedTimeMinutes"?: number}]
}`;

    const res = await openai.chat.completions.create(
      {
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: schemaHint },
              { type: "input_image", image_url: { url: `data:${image.type};base64,${b64}` } },
            ],
          } as any,
        ],
      },
      { timeout: 30000 }
    );

    const content = res.choices?.[0]?.message?.content || "";
    const data = tryFixJSON(content);
    if (!data) return NextResponse.json({ error: "Invalid JSON from model" }, { status: 500 });
    const validated = analyzeResponseSchema.safeParse(data);
    if (!validated.success) return NextResponse.json({ error: "Response validation failed" }, { status: 500 });
    return NextResponse.json(validated.data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

function tryFixJSON(text: string) {
  try { return JSON.parse(text); } catch {}
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  try { return JSON.parse(trimmed); } catch {}
  return null;
}


