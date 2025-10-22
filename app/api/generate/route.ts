import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const word: string = String(body?.word || '').trim();
    const count: number = Math.max(1, Math.min(200, Number(body?.count || 100)));
    const minLen: number = Math.max(4, Math.min(40, Number(body?.minLen || 10)));
    const maxLen: number = Math.max(minLen, Math.min(48, Number(body?.maxLen || 22)));
    const language: string = body?.language === 'en' ? 'en' : 'ja';

    if (!word || word.length > 64) {
      return NextResponse.json({ error: 'invalid input' }, { status: 400 });
    }

    const sys = language === 'ja'
  ? `あなたは一流の日本語コピーライターです。
短く強い言葉だけを作ります。説明口調・会話調・提案文は禁止。
禁止: 「ですが」「ですね」「〜しましょう」「…」「...」「。。」「!!」「??」など。
句読点は0または1つ。使うなら文末の「。」のみ。絵文字・顔文字・記号多用は禁止。
出力は改行区切りで100行、各行はおよそ10〜20文字。入力語に触発された連想を、比喩や体言止めで表現。`
  : `You are a master copywriter. No dialogue, no explanations, no ellipses or repeated punctuation. Each line stands alone. 100 lines, short, evocative, newline-separated only.`;

const user = language === 'ja'
  ? `単語: ${word}
条件: 100行 / 改行区切り / 重複禁止 / 会話調禁止 / 句読点は文末の「。」のみ（任意） / 強いコピー。`
  : `Seed: ${word}
Rules: 100 lines / newline-separated / unique / no dialogue / no ellipses / at most one end period.`;



    const r = await client.responses.create({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
    });

    const raw = (r as any).output_text as string;
    const lines = parse100(raw, count, language, minLen, maxLen);
    return NextResponse.json({ lines });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'generation failed' }, { status: 500 });
  }
}

function parse100(text: string, want: number, lang: string, minLen: number, maxLen: number): string[] {
  if (!text) return [];
  const rows = text
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*\d+\s*[\.|．]\s*/, '').trim())
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
      const t = e.replace(/^\d+\s*[\.|．]\s*/, '').trim();
      const s = clampLen(t, minLen, maxLen, lang);
      if (!out.includes(s)) out.push(s);
      if (out.length >= want) break;
    }
  }
  return out.slice(0, want);
}

function normalizeJa(s: string) {
  let t = s;

  // 連続句読点・三点リーダなどを除去/単一化
  t = t.replace(/[.…]{2,}/g, "");      // …や..の連続を削除
  t = t.replace(/[。．｡]{2,}/g, "。");   // 句点の連続 → 1つ
  t = t.replace(/[、，]{2,}/g, "、");   // 読点の連続 → 1つ

  // 文中の不要記号連打を落とす（!?や!!??など）
  t = t.replace(/[!?！？]{2,}/g, "");

  // 余分な空白を整理
  t = t.replace(/\s+/g, " ").trim();

  // 文末は「。」1つか、無くてもOK（会話風になりにくい）
  t = t.replace(/[。．｡!！?？]+$/g, "。"); // 終端記号をまとめて「。」に
  // 体言止めも許す場合は↑をコメントアウトして下を使う：
  // t = t.replace(/[。．｡!！?？]+$/g, "");

  return t;
}

function clampLen(s: string, min: number, max: number, lang: string) {
  // まず正規化
  let t = lang === 'ja' ? normalizeJa(s) : s.trim();

  // 長すぎるときはスマートに切る（句読点・空白の手前で）
  if (t.length > max) {
    const cut = t.slice(0, max);
    const m = cut.match(/.*[。．！!？?・、,ー\-\s]/);
    t = (m ? m[0] : cut).replace(/[\s、,]+$/g, "");
  }

  // 短すぎる場合は「埋めない」→ 句点水増し禁止
  // そのまま返してOK（短い強いコピーを許容）
  return t;
}
