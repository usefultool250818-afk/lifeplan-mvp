"use client";

import { useState, useEffect } from "react";
import type { Household } from "@/types/domain";
import { defaultIncomeTax } from "@/lib/simulate";

type Props = { onRun: (hh: Household) => void };

export default function InputForm({ onRun }: Props) {
  const [startYear, setStartYear] = useState<number>(2025);
  const [horizon, setHorizon] = useState<number>(60);
  const [inflation, setInflation] = useState<number>(0.02);
  const [base, setBase] = useState<number>(6_500_000);
  const [bonus, setBonus] = useState<number>(1_000_000);
  const [growth, setGrowth] = useState<number>(0.02);
  const [cash, setCash] = useState<number>(3_000_000);

  // ヘルプモーダル表示フラグ
  const [showHelp, setShowHelp] = useState(false);

  // Escキーでモーダルを閉じる
  useEffect(() => {
    if (!showHelp) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowHelp(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showHelp]);

  const handleRun = () => {
    const hh: Household = {
      members: [{ name: "世帯主", birthYear: 1993, retireAge: 65 }],
      settings: {
        startYear,
        horizon,
        inflation,
        tax: {
          // 数値を返す関数をそのまま渡す
          incomeTaxRate: defaultIncomeTax,
          socialInsRate: 0.14,
          residentRate: 0.10,
          baseDeduction: 480_000,
          salaryDeductionRate: 0.20,
        },
      },
      income: { salary: [{ base, bonus, growth }] },
      expenses: {
        living: { method: "fixed", base: 3_600_000 },
        housing: { type: "rent", amount: 1_800_000, endYear: startYear + 20 },
        education: [],
        insurance: [{ premium: 120_000 }],
      },
      assets: {
        cash,
        portfolios: [{ name: "投信", balance: 1_000_000, expReturn: 0.03, annualAdd: 600_000 }],
      },
    };
    onRun(hh);
  };

  // 入力→数値変換のヘルパ
  const toNum = (v: string) => Number(v || 0);

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">入力（デモ）</h2>
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="text-sm text-blue-600 underline"
          aria-haspopup="dialog"
          aria-expanded={showHelp}
        >
          ヘルプ
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <label className="block text-sm">
          開始年
          <input
            className="mt-1 input"
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(toNum(e.target.value))}
          />
        </label>

        <label className="block text-sm">
          期間（年）
          <input
            className="mt-1 input"
            type="number"
            value={horizon}
            onChange={(e) => setHorizon(toNum(e.target.value))}
          />
        </label>

        <label className="block text-sm">
          物価上昇率
          <input
            className="mt-1 input"
            step="0.01"
            type="number"
            value={inflation}
            onChange={(e) => setInflation(Number(e.target.value))}
          />
        </label>

        <label className="block text-sm">
          初年度年収
          <input
            className="mt-1 input"
            type="number"
            value={base}
            onChange={(e) => setBase(toNum(e.target.value))}
          />
        </label>

        <label className="block text-sm">
          賞与
          <input
            className="mt-1 input"
            type="number"
            value={bonus}
            onChange={(e) => setBonus(toNum(e.target.value))}
          />
        </label>

        <label className="block text-sm">
          昇給率
          <input
            className="mt-1 input"
            step="0.01"
            type="number"
            value={growth}
            onChange={(e) => setGrowth(Number(e.target.value))}
          />
        </label>

        <label className="block text-sm">
          現金残高
          <input
            className="mt-1 input"
            type="number"
            value={cash}
            onChange={(e) => setCash(toNum(e.target.value))}
          />
        </label>
      </div>

      <button
        onClick={handleRun}
        className="px-4 py-2 rounded bg-black text-white"
      >
        試算する
      </button>

      {/* ヘルプモーダル */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="help-title" className="text-lg font-bold mb-4">入力項目の説明</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><strong>開始年：</strong>シミュレーションを始める年。</li>
              <li><strong>期間（年）：</strong>何年間シミュレーションを行うか。</li>
              <li><strong>物価上昇率：</strong>生活費・住居費・保険料など固定額支出にかかるインフレ率（例 0.02 = 年2%）。</li>
              <li><strong>初年度年収：</strong>基本給。毎年「昇給率」で増加。賞与は含まず。</li>
              <li><strong>賞与：</strong>毎年のボーナス（固定額）。総収入に基本給と合算。</li>
              <li><strong>昇給率：</strong>基本給の年次増加率（例 0.02 = 年2%）。賞与には適用しない。</li>
              <li><strong>現金残高：</strong>開始時点の貯金・預金。資産残高の初期値。</li>
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                閉じる（Esc）
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input { @apply w-full border rounded px-2 py-1; }
      `}</style>
    </div>
  );
}
