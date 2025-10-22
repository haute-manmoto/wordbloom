"use client";

import React, { useMemo, useState } from "react";
import { classifyTone, fontMap, type FontKey } from "../components/FontMap";

/** 助詞・接続語（軽量レンダリング） */
const PARTICLES = [
  "は","が","を","に","で","と","へ","も","から","まで","より","や","の",
  "ね","よ","ぞ","か","さ","しか","だけ","など","って"
] as const;
const CONNECTIVES = [
  "そして","でも","ただ","しかし","だから","けれど","けど","なのに","それでも","ところで"
] as const;

/** 句読点や連続記号の整形（安全側） */
function normalizePunct(s: string) {
  return s
    .replace(/[.…]{2,}/g, "")        // …や..の連続は削除
    .replace(/[。．｡]{2,}/g, "。")    // 句点の連続は1つ
    .replace(/[、，]{2,}/g, "、")     // 読点の連続は1つ
    .replace(/[!?！？]{2,}/g, "")     // ！や？の連続は削除
    .replace(/\s+/g, " ")             // 連続空白整理
    .trim();
}

/** キーワード抽出：漢字2字以上 or カタカナ3字以上（最大2語） */
function pickKeywords(text: string): string[] {
  const tokens = text.match(/[一-龥]{2,}|[ァ-ヺー]{3,}/g) || [];
  // 重複排除＆長い順で上位を選ぶ
  const uniq = Array.from(new Set(tokens)).sort((a, b) => b.length - a.length);
  return uniq.slice(0, 2);
}

/** 本文レンダラー：助詞/接続語軽量＋キーワード強調 */
function renderLineStylized(textRaw: string): React.ReactNode[] {
  const text = normalizePunct(textRaw);
  const keywords = pickKeywords(text);
  const tokenRe = new RegExp(
    `(${[...CONNECTIVES, ...PARTICLES, ...keywords]
      .map((s) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&"))
      .join("|")})`,
    "g"
  );

  const chunks = text.split(tokenRe).filter(Boolean);
  const out: React.ReactNode[] = [];
  chunks.forEach((ch, i) => {
    if (CONNECTIVES.includes(ch as any)) {
      out.push(<span key={`c-${i}`} className="cnj">{ch}</span>);
    } else if (PARTICLES.includes(ch as any)) {
      out.push(<span key={`p-${i}`} className="prt">{ch}</span>);
    } else if (keywords.includes(ch)) {
      // 上位キーワードは少しだけ大きく
      const rank = keywords.indexOf(ch) === 0 ? "kw-2" : "kw-1";
      out.push(<span key={`k-${i}`} className={`kw ${rank}`}>{ch}</span>);
    } else {
      out.push(<span key={`t-${i}`} className="font-medium">{ch}</span>);
    }
  });
  return out;
}

export default function Page() {
  const [word, setWord] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ベースのフォントサイズ（Naoya指定）
  const [fontSize, setFontSize] = useState<number>(42); // 初期32
  const minSize = 18;
  const maxSize = 100;

  const showControls = results.length > 0;

  async function onGenerate() {
    if (!word.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setResults(Array.isArray(data.lines) ? data.lines : []);
    } catch (err) {
      console.error(err);
      alert("生成に失敗しました。サーバーを確認してください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={`min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center p-6 ${
        showControls ? "" : "justify-center"
      }`}
    >
      <div className="w-full max-w-3xl text-center">
        {/* タイトル */}
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          WordBloom <span className="text-neutral-400">— 1→100 Copywriter</span>
        </h1>
        <p className="text-neutral-400 mt-2">ワードを入力して「100語を生成」を押すだけ。</p>

        {/* 入力 */}
        <div className="mt-6 flex gap-2">
          <input
            className="flex-1 bg-neutral-900 rounded-xl px-4 py-3 ring-1 ring-neutral-800 focus:outline-none focus:ring-neutral-600"
            placeholder="例）季節／未来／希望 など"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onGenerate()}
          />
          <button
            onClick={onGenerate}
            disabled={!word || loading}
            className="px-5 py-3 rounded-xl bg-white text-neutral-900 font-medium disabled:opacity-50"
          >
            {loading ? "生成中…" : "100語を生成"}
          </button>
        </div>

        {/* 文字サイズ（生成後のみ・控えめ） */}
        {showControls && (
          <div className="mt-4 flex items-center gap-2 justify-end text-sm text-neutral-400">
            <label className="whitespace-nowrap">文字サイズ</label>
            <input
              type="range"
              min={minSize}
              max={maxSize}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="w-40 accent-neutral-500"
            />
            <span className="text-neutral-500 w-12 text-right">{fontSize}px</span>
          </div>
        )}

        {/* 結果 */}
        {results.length > 0 && (
          <div className="mt-8 grid gap-3">
            {results.map((raw, i) => {
              const line = normalizePunct(raw);
              const toneKey: FontKey = classifyTone(line);
              const tone = fontMap[toneKey];

              return (
                <div
                  key={i}
                  className="line-card fade-up"
                  style={{ animationDelay: `${Math.min(i, 40) * 25}ms` }} // 最大1s弱
                >
                  <div className={`flex items-start gap-3 ${tone.class}`}>
                    <span className="text-neutral-500 text-xs w-6 text-right mt-1">
                      {i + 1}
                    </span>
                    <p
  className="jp-typeset tracking-wide"
  style={{
    fontSize: fontSize,                 // ← 修正：数値でOK
    letterSpacing: tone.tracking,
    lineHeight: tone.leading,
    fontWeight: tone.weight,
    textTransform: tone.transform,
    fontStyle: tone.italic ? "italic" : "normal",
    fontFamily: tone.name,
  }}
>
  {renderLineStylized(line)}
</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
