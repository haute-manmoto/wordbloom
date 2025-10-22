// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Zen_Kaku_Gothic_New } from "next/font/google";

const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-zenkaku",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ひとこと",
  description: "ひとつの言葉から、100のひらめきを。",
  metadataBase:
    typeof process !== "undefined" && process.env.VERCEL_URL
      ? new URL(`https://${process.env.VERCEL_URL}`)
      : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className={`${zenKaku.variable} bg-neutral-950 text-neutral-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
