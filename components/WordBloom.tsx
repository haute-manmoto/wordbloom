"use client";
import React, { useMemo, useState, useRef } from "react";

// WordBloom – 1→100 Copywriter (Prototype)
// Single-file React app (TailwindCSS ready). No external UI libs required.
// ✅ Works fully client-side (demo generator).
// 🔌 Optional server/API mode scaffold included in comments at the bottom.

export default function App() {
  // ---------------- State ----------------
  const [word, setWord] = useState("");
  const [count, setCount] = useState(100);
  const [length, setLength] = useState<[number, number]>([10, 22]); // min, max characters
  const [language, setLanguage] = useState("ja");
  const [tones, setTones] = useState<string[]>([
    "力強い",
    "やさしい",
    "ミニマル",
    "詩的",
    "ユーモア",
    "知的",
  ]);
  const [styles, setStyles] = useState<string[]>([
    "タグライン",
    "キャッチ",
    "宣言",
    "問いかけ",
    "比喩",
    "リズム",
  ]);
  const [seed, setSeed] = useState(42);
  const [results, setResults] = useState<string[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // --- Simple Mode Toggle ---
  // true = ミニマルUI（中央に入力 + 100語生成のみ） / false = 拡張UI
  const SIMPLE = true;

  const toneOptions = [
    "力強い",
    "やさしい",
    "ミニマル",
    "詩的",
    "ユーモア",
    "知的",
    "高揚",
    "静寂",
    "未来的",
    "人間味",
  ];
  const styleOptions = [
    "タグライン",
    "キャッチ",
    "宣言",
    "問いかけ",
    "比喩",
    "リズム",
    "箇条書き",
    "二語",
    "三段階",
    "対比",
  ];

  function toggle(list: string[], item: string, setter: (v: string[]) => void) {
    if (list.includes(item)) setter(list.filter((x) => x !== item));
    else setter([...list, item]);
  }

  // ---------------- Utilities ----------------
  function mulberry32(a: number) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick<T>(rng: () => number, arr: T[]): T {
    return arr[Math.floor(rng() * arr.length)];
  }

  function clampByLength(s: string, min: number, max: number) {
    // Prefer within bounds; if too long, smart-trim punctuation-aware
    if (s.length <= max && s.length >= min) return s;
    if (s.length > max) {
      const cut = s.slice(0, max);
      // avoid cutting in the middle of punctuation
      const m = cut.match(/.*[。．！!？?・、,.ー\-\s]/);
      return (m ? m[0] : cut).replace(/[\s、,]+$/g, "");
    }
    // too short: pad with subtle emphasis
    while (s.length < min) s += "。";
    return s;
  }

  // ------ Demo Generator (no API key required) ------
  function generateLocalCopies(base: string, n: number, rngSeed: number) {
    const rng = mulberry32(rngSeed ^ hashCode(base));

    const joiners = [
      "を",
      "で",
      "から",
      "と",
      "へ",
      "が",
      "に",
      "から始める",
      "を超える",
      "をほどく",
    ];
    const verbs = [
      "動かす",
      "解き放つ",
      "磨く",
      "更新する",
      "始める",
      "選ぶ",
      "届ける",
      "跳ね上げる",
      "繋ぐ",
      "育てる",
      "燃やす",
      "描く",
      "耕す",
      "咲かせる",
      "進める",
      "加速する",
      "設計する",
      "編む",
      "跳ぶ",
      "灯す",
    ];
    const feels = [
      "静かに",
      "確かに",
      "大胆に",
      "しなやかに",
      "粛々と",
      "一瞬で",
      "本質的に",
      "あなたらしく",
      "今日から",
      "ここから",
    ];
    const poetic = [
      "未完成の星",
      "余白の光",
      "朝焼けの予感",
      "揺れる輪郭",
      "透明な熱",
      "やわらかな刃",
      "夜明けの手触り",
      "風の背中",
      "まぶたの内側",
      "まだ見ぬ地図",
    ];
    const endings = ["。", "。", "。", "", "", "！", "。"]; // bias to "。"

    // 抽象的なモチーフ（入力語を含めない連想出力で使用）
    const abstracts = [
      "朝焼け", "余白", "輪郭", "透明な熱", "追い風", "小さな火", "静かな海", "はじまりの鐘",
      "雨上がり", "息遣い", "地図", "扉", "足あと", "手触り", "光の粒", "影のない場所",
      "青いノート", "砂時計", "伸びる影", "深呼吸", "微熱", "まばたき", "灯り", "土曜日",
    ];

    const toneMap: Record<string, (s: string) => string[]> = {
      力強い: (w) => [
        `${w}を、動かす。`,
        `${w}で、突破する。`,
        `${w}を武器に。`,
        `${w}は、待たない。`,
      ],
      やさしい: (w) => [
        `そっと、${w}へ。`,
        `${w}に寄りそう。`,
        `${w}がほどける日。`,
        `${w}を、あなたに。`,
      ],
      ミニマル: (w) => [
        `${w}だけ。`,
        `${w}、要る。`,
        `${w}で足りる。`,
        `${w}—それだけ。`,
      ],
      詩的: (w) => [
        `${w}は未完成の星。`,
        `${w}、朝焼けの予感。`,
        `余白に${w}が咲く。`,
        `${w}の向こうに風。`,
      ],
      ユーモア: (w) => [
        `${w}、それっておいしいの？`,
        `${w}待ちの私、早い。`,
        `${w}しないと、寝れないかも。`,
        `${w}は3分でOK。`,
      ],
      知的: (w) => [
        `${w}を仮説から実装へ。`,
        `${w}の要件定義。`,
        `${w}は構造からはじまる。`,
        `${w}の本質、要約すると。`,
      ],
      高揚: (w) => [
        `上げていこう、${w}。`,
        `${w}、ここから最大出力！`,
        `${w}、ボリューム全開。`,
        `${w}の鼓動を上げる。`,
      ],
      静寂: (w) => [
        `音を消して、${w}だけ。`,
        `${w}は小さく強い。`,
        `${w}、静かに確かに。`,
        `黙って${w}する。`,
      ],
      未来的: (w) => [
        `${w}OS 起動。`,
        `Hello, ${w} v2.`,
        `量子${w}をどうぞ。`,
        `${w}の次世代プロトコル。`,
      ],
      人間味: (w) => [
        `${w}って、結局ひとだよね。`,
        `${w}の前に深呼吸。`,
        `泣いて笑って、${w}。`,
        `${w}を手でやる意味。`,
      ],
    };

    const styleMap: Record<string, (w: string, r: () => number) => string[]> = {
      タグライン: (w) => [
        `${w}で、はじまる。`,
        `${w}のある暮らし。`,
        `${w}の答えは、ここに。`,
        `世界を${w}で塗り替える。`,
      ],
      キャッチ: (w) => [
        `${w}したら、世界が速い。`,
        `${w}は正義じゃない、選択だ。`,
        `うまくいく人は、${w}が短い。`,
        `${w}は、迷ったらやる。`,
      ],
      宣言: (w) => [
        `私は${w}を約束する。`,
        `${w}主義を宣言する。`,
        `${w}至上。`,
        `全員、${w}へ。`,
      ],
      問いかけ: (w) => [
        `${w}、本当に足りてる？`,
        `${w}って、いつから始まる？`,
        `その${w}、誰のため？`,
        `${w}に、理由はいる？`,
      ],
      比喩: (w) => [
        `${w}は火。小さく強く燃える。`,
        `${w}は道。足あとが地図になる。`,
        `${w}は雨。乾いた心に降る。`,
        `${w}は糸。今日と明日を編む。`,
      ],
      リズム: (w) => [
        `${w}して、進んで、また${w}。`,
        `やって、試して、${w}する。`,
        `${w}・${w}・ジャンプ。`,
        `${w}、そして前へ。`,
      ],
      箇条書き: (w) => [
        `まず${w}。次に深呼吸。最後に笑う。`,
        `${w}。整える。始める。`,
        `観察→${w}→反省。`,
        `${w}→共有→改善。`,
      ],
      二語: (w) => [
        `${w}、最短。`,
        `${w}、確信。`,
        `${w}、突破。`,
        `${w}、日常。`,
      ],
      三段階: (w) => [
        `${w}を知る。${w}をやる。${w}で変わる。`,
        `${w}の準備。${w}の実行。${w}の継続。`,
        `見る。考える。${w}。`,
        `迷う。決める。${w}。`,
      ],
      対比: (w) => [
        `${w}より速く、丁寧に。`,
        `大胆に${w}、繊細に仕上げる。`,
        `静かに${w}、強く響く。`,
        `${w}と休む、どちらも正解。`,
      ],
    };

    const setOut = new Set<string>();
    const out: string[] = [];

    // seed-based shufflers
    const tSel = [...tones];
    const sSel = [...styles];
    // ensure at least one if user cleared all
    if (tSel.length === 0) tSel.push("ミニマル");
    if (sSel.length === 0) sSel.push("タグライン");

    // Core combinator
    while (out.length < n && setOut.size < n * 3) {
      const t = pick(rng, tSel);
      const s = pick(rng, sSel);
      const includeWord = rng() < 0.25; // 25%だけ入力語を含める
      const baseLine = includeWord
        ? pick(rng, [
            ...toneMap[t](base),
            ...styleMap[s](base, rng),
            `${pick(rng, feels)}${base}${pick(rng, joiners)}${pick(rng, verbs)}${pick(rng, endings)}`,
            `${base}、${pick(rng, poetic)}。`,
          ])
        : pick(rng, [
            `${pick(rng, abstracts)}を${pick(rng, verbs)}${pick(rng, endings)}`,
            `${pick(rng, feels)}${pick(rng, abstracts)}${pick(rng, endings)}`,
            `${pick(rng, poetic)}${pick(rng, endings)}`,
            `まずは${pick(rng, abstracts)}。次に深呼吸。`,
            `黙って進む。${pick(rng, abstracts)}だけを見て。`,
            `ここからだ。${pick(rng, abstracts)}が合図。`,
          ]);

      const variant = mutate(baseLine, rng);
      if (!setOut.has(variant)) {
        setOut.add(variant);
        out.push(variant);
      }
    }

    return out;

    function mutate(line: string, r: () => number) {
      // subtle mutations: swap punctuation, add emphasis, reorder particles
      const altPunc = ["。", "！", "", "。", "。", "。"];
      const addKagi = r() < 0.15;
      let s = line.trim();
      if (addKagi) s = `「${s.replace(/[。！!]$/, "")}」`;
      if (r() < 0.25) s = s.replace(/は/g, "は、");
      if (r() < 0.25) s = s.replace(/、。/g, "。");
      if (r() < 0.2) s = s.replace(/[。！!]?$/, pick(r, altPunc));
      // collapse spaces
      s = s.replace(/\s+/g, " ").trim();
      // length control
      s = clampByLength(s, length[0], length[1]);
      return s;
    }
  }

  function hashCode(str: string) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h >>> 0;
  }

  // ---------------- Actions ----------------
  async function onGenerate() {
    if (!word.trim()) return;
    setLoading(true);

    const qty = Math.max(1, Math.min(200, count));

    // --- Try API first (associative 100 lines) ---
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim(), count: qty, minLen: length[0], maxLen: length[1], language }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.lines) && data.lines.length > 0) {
          setResults(data.lines.slice(0, qty));
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // fall through to local
    }

    // --- Fallback: Local demo generation (associative; word may be omitted) ---
    const local = generateLocalCopies(word.trim(), qty, seed);
    setResults(local);
    setLoading(false);
  }

  function copyAll() {
    const text = results.join("\n");
    navigator.clipboard.writeText(text);
  }

  function downloadFile(type: "txt" | "csv") {
    const content =
      type === "txt"
        ? results.join("\n")
        : `index,text\n${results
            .map((r, i) => `${i + 1},"${r.replace(/"/g, '""')}"`)
            .join("\n")}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${word || "wordbloom"}.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleFav(line: string) {
    const next = new Set(favs);
    if (next.has(line)) next.delete(line);
    else next.add(line);
    setFavs(next);
  }

  const filtered = useMemo(() => {
    const q = searchRef.current?.value?.trim();
    if (!q) return results;
    return results.filter((r) => r.includes(q));
  }, [results, searchRef.current?.value]);

  // ---------------- Render ----------------
  if (SIMPLE) {
    // --- Minimal UI (centered input -> 100 lines) ---
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center">
            WordBloom <span className="text-neutral-400">— 1→100 Copywriter</span>
          </h1>
          <p className="text-neutral-400 mt-2 text-center">ワードを入力して「100語を生成」を押すだけ。</p>

          <div className="mt-6 flex gap-2">
            <input
              className="flex-1 bg-neutral-900 rounded-xl px-4 py-3 ring-1 ring-neutral-800 focus:outline-none focus:ring-neutral-600"
              placeholder="例）季節／未来／革新 など"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onGenerate();
              }}
            />
            <button
              onClick={onGenerate}
              disabled={!word || loading}
              className="px-5 py-3 rounded-xl bg-white text-neutral-900 font-medium disabled:opacity-50"
            >
              {loading ? "生成中…" : "100語を生成"}
            </button>
          </div>

          {results.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-neutral-300 text-sm">
                  生成結果 <span className="text-neutral-500">({results.length})</span>
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(results.join("\n"))}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 text-sm"
                  >
                    すべてコピー
                  </button>
                  <button
                    onClick={() => {
                      setResults([]);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 text-sm"
                  >
                    クリア
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                {results.map((line, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-neutral-900/60 ring-1 ring-neutral-800 flex gap-3"
                  >
                    <span className="text-neutral-500 text-xs w-6 text-right">{i + 1}</span>
                    <p className="text-[15px] leading-relaxed">{line}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Full UI (advanced controls) ---
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          WordBloom <span className="text-neutral-400">— 1→100 Copywriter</span>
        </h1>
        <p className="text-neutral-400 mt-2">
          一つのワードから、100のことば。デモ生成はローカルで即動作。API接続で本番品質へ。
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-24">
        {/* Controls */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 bg-neutral-900/60 rounded-2xl p-4 ring-1 ring-neutral-800">
            <label className="block text-sm text-neutral-400 mb-2">ワード</label>
            <input
              className="w-full bg-neutral-950 rounded-xl px-4 py-3 ring-1 ring-neutral-800 focus:outline-none focus:ring-neutral-600"
              placeholder="例）未来／革新／走る など"
              value={word}
              onChange={(e) => setWord(e.target.value)}
            />

            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">数量</label>
                <input
                  type="range"
                  min={10}
                  max={200}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-neutral-300">{count} 行</div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">文字数レンジ</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={4}
                    max={40}
                    value={length[0]}
                    onChange={(e) =>
                      setLength([parseInt(e.target.value || "10"), length[1]])
                    }
                    className="w-20 bg-neutral-950 rounded-lg px-3 py-2 ring-1 ring-neutral-800"
                  />
                  <span>〜</span>
                  <input
                    type="number"
                    min={length[0]}
                    max={48}
                    value={length[1]}
                    onChange={(e) =>
                      setLength([length[0], parseInt(e.target.value || "22")])
                    }
                    className="w-20 bg-neutral-950 rounded-lg px-3 py-2 ring-1 ring-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">言語</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-neutral-950 rounded-xl px-3 py-2 ring-1 ring-neutral-800"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English (demo)</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">トーン</label>
                <div className="flex flex-wrap gap-2">
                  {toneOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggle(tones, t, setTones)}
                      className={`px-3 py-1.5 rounded-full text-sm ring-1 ${
                        tones.includes(t)
                          ? "bg-neutral-200 text-neutral-900 ring-neutral-200"
                          : "bg-neutral-950 ring-neutral-800 text-neutral-300 hover:ring-neutral-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">スタイル</label>
                <div className="flex flex-wrap gap-2">
                  {styleOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggle(styles, t, setStyles)}
                      className={`px-3 py-1.5 rounded-full text-sm ring-1 ${
                        styles.includes(t)
                          ? "bg-neutral-200 text-neutral-900 ring-neutral-200"
                          : "bg-neutral-950 ring-neutral-800 text-neutral-300 hover:ring-neutral-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">シード（再現性）</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value || "42"))}
                  className="w-full bg-neutral-950 rounded-xl px-3 py-2 ring-1 ring-neutral-800"
                />
              </div>

              <div className="sm:col-span-2 flex items-end gap-2">
                <button
                  onClick={onGenerate}
                  disabled={!word || loading}
                  className="px-4 py-3 rounded-xl bg-white text-neutral-900 font-medium disabled:opacity-50"
                >
                  {loading ? "生成中…" : "100語を生成"}
                </button>
                <button
                  onClick={() => {
                    setResults([]);
                    setFavs(new Set());
                  }}
                  className="px-4 py-3 rounded-xl bg-neutral-800 text-neutral-100"
                >
                  クリア
                </button>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/60 rounded-2xl p-4 ring-1 ring-neutral-800">
            <label className="block text-sm text-neutral-400 mb-2">検索 / フィルタ</label>
            <input
              ref={searchRef}
              onChange={() => {
                // trigger rerender via state flip
                setSeed((s) => s);
              }}
              className="w-full bg-neutral-950 rounded-xl px-3 py-2 ring-1 ring-neutral-800"
              placeholder="キーワードでしぼる"
            />

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={copyAll}
                disabled={results.length === 0}
                className="px-3 py-2 rounded-lg bg-neutral-800"
              >
                すべてコピー
              </button>
              <button
                onClick={() => downloadFile("txt")}
                disabled={results.length === 0}
                className="px-3 py-2 rounded-lg bg-neutral-800"
              >
                TXT保存
              </button>
              <button
                onClick={() => downloadFile("csv")}
                disabled={results.length === 0}
                className="px-3 py-2 rounded-lg bg-neutral-800"
              >
                CSV保存
              </button>
              <button
                onClick={() => setResults(shuffle([...results]))}
                disabled={results.length === 0}
                className="px-3 py-2 rounded-lg bg-neutral-800"
              >
                並び替え
              </button>
            </div>

            <div className="mt-6 text-xs text-neutral-400 space-y-2">
              <p>・本デモはローカル生成（テンプレ×確率変異）です。</p>
              <p>・本番は /api/generate を接続し、LLMで高品質出力に置換してください。</p>
              <p>・公開時はレート制限／APIキー保護／NGワードフィルタを実装推奨。</p>
            </div>
          </div>
        </div>

        {/* Results */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg text-neutral-300">
              生成結果 <span className="text-neutral-500">({filtered.length} / {results.length})</span>
            </h2>
            {favs.size > 0 && (
              <div className="text-sm text-neutral-400">お気に入り: {favs.size}件</div>
            )}
          </div>

          {results.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {filtered.map((line, i) => (
                <Card
                  key={i}
                  index={i + 1}
                  text={line}
                  fav={favs.has(line)}
                  onCopy={() => navigator.clipboard.writeText(line)}
                  onFav={() => toggleFav(line)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 pb-10 text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} WordBloom. Prototype for Naoya. Built with ❤️</p>
      </footer>
    </div>
  );
}

function Card({
  index,
  text,
  fav,
  onCopy,
  onFav,
}: {
  index: number;
  text: string;
  fav: boolean;
  onCopy: () => void;
  onFav: () => void;
}) {
  return (
    <div className="group relative p-4 rounded-2xl bg-neutral-900/60 ring-1 ring-neutral-800 hover:ring-neutral-600 transition">
      <div className="absolute -top-2 -left-2 bg-neutral-800 text-neutral-200 text-xs px-2 py-1 rounded-full">{index}</div>
      <p className="text-[15px] leading-relaxed pr-16">{text}</p>
      <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
        <button onClick={onCopy} className="text-xs px-2 py-1 rounded-lg bg-neutral-800">
          コピー
        </button>
        <button
          onClick={onFav}
          className={`text-xs px-2 py-1 rounded-lg ${fav ? "bg-amber-300 text-neutral-900" : "bg-neutral-800"}`}
        >
          {fav ? "★ お気に入り" : "☆ 保存"}
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-10 text-center">
      <div className="text-2xl">🌱</div>
      <p className="mt-2 text-neutral-300">ワードを入れて「100語を生成」を押してください。</p>
      <p className="text-neutral-500 text-sm mt-1">例：未来 / 革新 / 走る / 透明 など</p>
    </div>
  );
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/*
==========================================
🔌 Server/API mode (example, Next.js route)
------------------------------------------
// pages/api/generate.ts (or app/api/generate/route.ts)
import type { NextApiRequest, NextApiResponse } from 'next';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { word, tones, styles, count, length, seed } = req.body;
  // Call your LLM provider here (OpenAI, etc.). Keep keys on server only.
  // Example (pseudo):
  // const prompt = buildPrompt({ word, tones, styles, count, length, seed });
  // const lines = await callOpenAI(prompt);
  // res.json({ lines });
  res.json({ lines: [] });
}

🛡️ 本番チェックリスト
- レート制限（IP／ユーザー）
- 入力バリデーション（NGワード／最大長）
- キャッシュ（seed + params で再利用）
- 監視（ログ、失敗率、レイテンシ）
- 利用規約／著作権ガイドライン
==========================================
*/
