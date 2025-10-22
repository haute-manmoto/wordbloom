import "./globals.css";
import type { Metadata } from "next";

// 🎨 Google Fonts Import
import {
  Noto_Sans_JP,
  Noto_Serif_JP,
  Zen_Maru_Gothic,
  Shippori_Mincho,
  Kosugi_Maru,
  Inter,
} from "next/font/google";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-serif",
  display: "swap",
});

const zenMaru = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-zen-maru",
  display: "swap",
});

const shippori = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-shippori",
  display: "swap",
});

const kosugi = Kosugi_Maru({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-kosugi",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WordBloom — Copywriter Prototype",
  description: "1ワードから100の言葉を生み出す、AIコピーライター。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body
        className={`
          ${notoSans.variable}
          ${notoSerif.variable}
          ${zenMaru.variable}
          ${shippori.variable}
          ${kosugi.variable}
          ${inter.variable}
          bg-neutral-950 text-neutral-100 antialiased
        `}
      >
        {children}
      </body>
    </html>
  );
}
