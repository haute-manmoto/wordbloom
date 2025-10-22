// app/api/generate/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const word: string = String(body?.word || "").trim();
    const count: number = Math.max(1, Math.min(200, Number(body?.count || 100)));
    const minLen: number = Math.max(4, Math.min(40, Number(body?.minLen || 10)));
    const maxLen: number = Math.max(minLen, Math.min(48, Number(body?.maxLen || 22)));
    const language: string = body?.language === "en" ? "en" : "ja";

    if (!word || word.length > 64) {
      return NextResponse.json({ error: "invalid input" }, { status: 400 });
    }

    // 🔑 環境変数が無い場合はフロントのローカル生成に任せる
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ lines: [] }, { status: 200 });
    }

    // クライアントは関数内部で生成（ビルド時に例外を出さない）
    const client = new OpenAI({ apiKey });

    const sys =
      language === "ja"
        ? "あなたは世界最高の日本語コピーライターです。与えられた単語から、直接その語を使わない『連想表現』を中心に、短いコピーを正確に100行出力します。説明や前置きは禁止。各行は10〜20文字程度、多様なトーン。出力は改行のみ。"
        : "You are a world-class copywriter. From the given seed, craft 100 short associative taglines, mostly WITHOUT using the seed explicitly. Diverse tones. No explanations. Newline-separated.";

    const user =
      language === "ja"
        ? `単語: ${word}\n条件: 100行/短文/改行区切り/重複禁止/連想中心。`
        : `Seed: ${word}\nRules: 100 lines / short / newline-separated / no duplicates / associative`;

    const r = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    });

    const raw = (r as any).output_text as string;
    const lines = parse100(raw, count, language, minLen, maxLen);
    return NextResponse.json({ lines });
  } catch (err) {
    // APIエラー時もフロント側フォールバックに任せる
    console.error(err);
    return NextResponse.json({ lines: [] }, { status: 200 });
  }
}

function parse100(text: string, want: number, lang: string, minLen: number, maxLen: number): string[] {
  if (!text) return [];
  const rows = text
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*\d+\s*[\.|．]\s*/, "").trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const r of rows) {
    const s = clampLen(r, minLen, maxLen, lang);
    if (!out.includes(s)) out.push(s);
    if (out.length >= want) break;
  }
  if (out.length < want) {
    const extra = text.match(/\d+\s*[\.|．]\s*([^\n]+)/g) || [];
    for (const e of extra) {
      const t = e.replace(/^\d+\s*[\.|．]\s*/, "").trim();
      const s = clampLen(t, minLen, maxLen, lang);
      if (!out.includes(s)) out.push(s);
      if (out.length >= want) break;
    }
  }
  return out.slice(0, want);
}

function clampLen(s: string, min: number, max: number, lang: string) {
  let t = s;
  if (t.length > max) t = t.slice(0, max).replace(/[\s、,.]+$/g, "");
  while (t.length < min) t += lang === "ja" ? "。" : ".";
  return t;
}
