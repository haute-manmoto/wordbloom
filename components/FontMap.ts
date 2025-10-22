// components/FontMap.ts
import type { CSSProperties } from "react";

export type FontKey =
  | "強い"
  | "やさしい"
  | "詩的"
  | "静か"
  | "ユーモア"
  | "知的";

type ToneStyle = {
  /** フォントファミリー名（layout.tsx で読み込んだもの） */
  name: string;
  /** Tailwind の補助クラス（太さなど） */
  class: string;
  /** 以下は CSSProperties 準拠の型で定義 */
  weight: CSSProperties["fontWeight"];
  tracking: CSSProperties["letterSpacing"];
  leading: CSSProperties["lineHeight"];
  transform?: CSSProperties["textTransform"];
  italic?: boolean;
};

export const fontMap: Record<FontKey, ToneStyle> = {
  強い: {
    name: "Noto Sans JP",
    class: "font-bold",
    weight: 700,
    tracking: "0.01em",
    leading: 1.3,
  },
  やさしい: {
    name: "Zen Maru Gothic",
    class: "font-light",
    weight: 300,
    tracking: "0.05em",
    leading: 1.8,
  },
  詩的: {
    name: "Shippori Mincho",
    class: "italic",
    weight: 400,
    tracking: "0.03em",
    leading: 1.7,
    italic: false,
  },
  静か: {
    name: "Noto Serif JP",
    class: "font-normal",
    weight: 400,
    tracking: "0.04em",
    leading: 1.5,
  },
  ユーモア: {
    name: "Kosugi Maru",
    class: "font-medium",
    weight: 500,
    tracking: "0.06em",
    leading: 1.4,
  },
  知的: {
    name: "Inter",
    class: "font-semibold",
    weight: 600,
    tracking: "0.01em",
    leading: 1.4,
    transform: "uppercase",
  },
};

// ---- 雰囲気分類（簡易） ----
export function classifyTone(text: string): FontKey {
  const t = text.toLowerCase();

  if (/(挑戦|前進|進め|走|動|勝|未来|突破|強|力|立ち上が)/.test(t)) return "強い";
  if (/(やさし|まる|温|ぬく|包|ほっと|ゆっくり|灯|心|微笑)/.test(t)) return "やさしい";
  if (/(風|光|空|夜|夢|花|海|星|余白|静|透|揺|影|時|記憶|詩)/.test(t)) return "詩的";
  if (/(静|落ち着|穏やか|深|静寂|眠|しずか|淡|澄)/.test(t)) return "静か";
  if (/(笑|楽|おもしろ|ユーモア|遊|ふふ|って|かな|かも|ね)/.test(t)) return "ユーモア";
  if (/(考|思考|分析|構造|仮説|知|論理|設計|抽象|理屈)/.test(t)) return "知的";

  return "強い";
}
