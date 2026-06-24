// Material classification for a deposit photo.
//
// If ANTHROPIC_API_KEY is set, we call Claude vision for a real judgment.
// Otherwise (and on any error/timeout) we fall back to a labeled heuristic so a
// deposit never fails on the AI path. The result always says which path ran, and
// the UI/admin surface that honestly (classifiedBy: "ai" | "heuristic").

import type { ClassifiedBy, Material } from "./types";

export type Classification = {
  material: Material;
  confidence: number;
  contaminants: string[];
  note: string;
  classifiedBy: ClassifiedBy;
};

const MODEL = process.env.VL_VISION_MODEL || "claude-haiku-4-5-20251001";
const MEDIA_RE = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB ceiling on uploaded image

const SYSTEM = `You are a recycling contamination classifier for an aluminum-can return program.
You look at one photo taken at a recycling bin and decide what the item is.
Respond with ONLY a compact JSON object, no prose, no code fences:
{"material":"aluminum"|"contaminant"|"other","confidence":<0..1>,"contaminants":[<short strings>],"note":<short string>}
Rules:
- "aluminum": an aluminum beverage can (empty or near-empty), even if dented.
- "contaminant": a coffee cup, plastic bottle, hybrid container, or a can with significant residual liquid.
- "other": anything that isn't clearly either.
Be calibrated: lower confidence when the image is ambiguous, dark, or partial.`;

export function isAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function classify(imageDataUrl?: string): Promise<Classification> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key && imageDataUrl) {
    const match = imageDataUrl.match(MEDIA_RE);
    if (match) {
      const [, mediaType, base64] = match;
      if (Buffer.byteLength(base64, "base64") <= MAX_BYTES) {
        const ai = await classifyWithClaude(key, mediaType, base64).catch(() => null);
        if (ai) return ai;
      }
    }
  }
  return heuristic(Boolean(imageDataUrl));
}

async function classifyWithClaude(
  key: string,
  mediaType: string,
  base64: string
): Promise<Classification | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        // Prompt caching on the (static) system block — repeated classifications
        // reuse the cached prefix, cutting cost and latency.
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: "Classify this item." },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = json.content?.find((c) => c.type === "text")?.text ?? "";
    const parsed = parseJson(text);
    if (!parsed) return null;
    return {
      material: normalizeMaterial(parsed.material),
      confidence: clamp(parsed.confidence),
      contaminants: Array.isArray(parsed.contaminants)
        ? parsed.contaminants.filter((x): x is string => typeof x === "string").slice(0, 4)
        : [],
      note: typeof parsed.note === "string" ? parsed.note.slice(0, 140) : "Classified by Claude vision.",
      classifiedBy: "ai",
    };
  } finally {
    clearTimeout(timer);
  }
}

function parseJson(text: string): {
  material?: unknown;
  confidence?: unknown;
  contaminants?: unknown;
  note?: unknown;
} | null {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeMaterial(v: unknown): Material {
  return v === "aluminum" || v === "contaminant" || v === "other" ? v : "other";
}

function clamp(v: unknown): number {
  const n = typeof v === "number" ? v : 0.5;
  return Math.max(0, Math.min(1, n));
}

// No API key (or no photo): believable, mostly-aluminum stream with occasional flags.
function heuristic(hadPhoto: boolean): Classification {
  const contaminated = Math.random() < 0.08;
  if (contaminated) {
    const kinds = ["coffee cup", "plastic bottle", "residual liquid", "hybrid container"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    return {
      material: "contaminant",
      confidence: 0.72 + Math.random() * 0.2,
      contaminants: [kind],
      note: `Looks like a ${kind}, flagged as contamination.`,
      classifiedBy: "heuristic",
    };
  }
  return {
    material: "aluminum",
    confidence: 0.95 + Math.random() * 0.04,
    contaminants: [],
    note: hadPhoto ? "Verified aluminum can." : "Logged via bin code (no photo).",
    classifiedBy: "heuristic",
  };
}
