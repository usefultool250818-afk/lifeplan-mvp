import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "ライフプランMVP", template: "%s | ライフプランMVP" },
  description: "個人プロジェクトのライフプラン・シミュレーター",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={inter.variable}>
      {/* 背景の淡いグラデ */}
      <body className="min-h-dvh bg-[radial-gradient(900px_600px_at_85%_-10%,#dbeafe_0%,transparent_60%),radial-gradient(800px_500px_at_-10%_0%,#f5d0fe_0%,transparent_55%)]">
        {/* ====== ヘッダー：バー型（全幅） ====== */}
        <div className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50">
          <div className="mx-auto max-w-6xl h-14 px-4 flex items-center justify-between">
            {/* 左：サービス名（小さめ・太字） */}
            <div className="text-sm md:text-base font-semibold tracking-tight">
              ライフプランMVP
            </div>

            {/* 右：軽いリンク群＋小バッジ（必要に応じて差し替え） */}
            <nav className="flex items-center gap-4 text-sm text-gray-600">
              <a
                href="https://github.com/yourname/lifeplan-app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black transition"
              >
                GitHub
              </a>
              <a href="#" className="hover:text-black transition">
                使い方
              </a>
              <span className="px-2 py-0.5 rounded-full border bg-white/70 text-[10px] md:text-xs">
                β版
              </span>
            </nav>
          </div>
        </div>

        {/* ====== コンテンツ ====== */}
        <div className="mx-auto max-w-6xl px-4 py-8">
          {children}
          <footer className="mt-10 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} ライフプランMVP
          </footer>
        </div>
      </body>
    </html>
  );
}
