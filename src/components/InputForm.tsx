"use client";

import { useEffect, useMemo, useState } from "react";
import type { Household } from "@/types/domain";
import { defaultIncomeTax } from "@/lib/simulate";

type Props = { onRun: (hh: Household) => void };

// 共通ヘルパー
const asIntState = (v: string) => {
  if (v === "") return "" as const;
  // 文字列→整数、先頭ゼロを排除（045 -> 45）
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? ("" as const) : n;
};
const asFloatState = (v: string) => {
  if (v === "") return "" as const;
  const n = parseFloat(v);
  return Number.isNaN(n) ? ("" as const) : n;
};
// 実行用：空文字なら0
const numOr0 = (v: number | "") => (v === "" ? 0 : v);

export default function InputForm({ onRun }: Props) {
  // 「開始年」→「現在年齢」
  const [currentAge, setCurrentAge] = useState<number | "">(32);
  const startYear = useMemo(() => new Date().getFullYear(), []);

  // 主要入力（すべて number | "" に変更）
  const [horizon, setHorizon] = useState<number | "">(60);
  const [inflation, setInflation] = useState<number | "">(0.02);
  const [base, setBase] = useState<number | "">(6_500_000);
  const [bonus, setBonus] = useState<number | "">(1_000_000);
  const [growth, setGrowth] = useState<number | "">(0.02);
  const [cash, setCash] = useState<number | "">(3_000_000);

  // 住居：賃貸 or ローン
  const [housingType, setHousingType] = useState<"rent" | "loan">("rent");

  // 賃貸
  const [rentAnnual, setRentAnnual] = useState<number | "">(1_800_000);
  const [rentEndYear, setRentEndYear] = useState<number | "">(startYear + 20);

  // ローン
  const [loanPrincipal, setLoanPrincipal] = useState<number | "">(35_000_000);
  const [loanRate, setLoanRate] = useState<number | "">(0.012); // 年1.2%
  const [loanYears, setLoanYears] = useState<number | "">(35);
  const [loanStartYear, setLoanStartYear] = useState<number | "">(startYear);

  // ヘルプ
  const [showHelp, setShowHelp] = useState(false);
  useEffect(() => {
    if (!showHelp) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowHelp(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showHelp]);

  const handleRun = () => {
    const birthYear = startYear - numOr0(currentAge);

    const housing =
      housingType === "rent"
        ? { type: "rent" as const, amount: numOr0(rentAnnual), endYear: rentEndYear === "" ? undefined : rentEndYear }
        : {
            type: "loan" as const,
            principal: numOr0(loanPrincipal),
            rate: numOr0(loanRate),
            years: numOr0(loanYears),
            startYear: numOr0(loanStartYear),
          };

    const hh: Household = {
      members: [{ name: "世帯主", birthYear, retireAge: 65 }],
      settings: {
        startYear,
        horizon: numOr0(horizon),
        inflation: numOr0(inflation),
        tax: {
          incomeTaxRate: defaultIncomeTax,
          socialInsRate: 0.14,
          residentRate: 0.10,
          baseDeduction: 480_000,
          salaryDeductionRate: 0.20,
        },
      },
      income: { salary: [{ base: numOr0(base), bonus: numOr0(bonus), growth: numOr0(growth) }] },
      expenses: {
        living: { method: "fixed", base: 3_600_000 },
        housing,
        education: [],
        insurance: [{ premium: 120_000 }],
      },
      assets: {
        cash: numOr0(cash),
        portfolios: [{ name: "投信", balance: 1_000_000, expReturn: 0.03, annualAdd: 600_000 }],
      },
    };
    onRun(hh);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">入力（デモ）</h2>
        <button type="button" onClick={() => setShowHelp(true)} className="btn btn-ghost">ヘルプ</button>
      </div>

      {/* 基本項目 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <label className="block text-sm">
          現在年齢
          <input
            className="mt-1 input"
            type="number"
            value={currentAge === "" ? "" : currentAge}
            onChange={(e) => setCurrentAge(asIntState(e.target.value))}
            min={0}
          />
          <span className="muted">※ シミュレーション開始時点の年齢</span>
        </label>

        <label className="block text-sm">
          期間（年）
          <input
            className="mt-1 input"
            type="number"
            value={horizon === "" ? "" : horizon}
            onChange={(e) => setHorizon(asIntState(e.target.value))}
            min={1}
          />
        </label>

        <label className="block text-sm">
          物価上昇率
          <input
            className="mt-1 input"
            type="number"
            step="0.01"
            value={inflation === "" ? "" : inflation}
            onChange={(e) => setInflation(asFloatState(e.target.value))}
          />
        </label>

        <label className="block text-sm">
          初年度年収（基本給）
          <input
            className="mt-1 input"
            type="number"
            value={base === "" ? "" : base}
            onChange={(e) => setBase(asIntState(e.target.value))}
          />
          <span className="muted">※ 賞与は下項目で別入力</span>
        </label>

        <label className="block text-sm">
          賞与（年額）
          <input
            className="mt-1 input"
            type="number"
            value={bonus === "" ? "" : bonus}
            onChange={(e) => setBonus(asIntState(e.target.value))}
          />
        </label>

        <label className="block text-sm">
          昇給率
          <input
            className="mt-1 input"
            type="number"
            step="0.01"
            value={growth === "" ? "" : growth}
            onChange={(e) => setGrowth(asFloatState(e.target.value))}
          />
        </label>

        <label className="block text-sm">
          現金残高（開始時点）
          <input
            className="mt-1 input"
            type="number"
            value={cash === "" ? "" : cash}
            onChange={(e) => setCash(asIntState(e.target.value))}
          />
        </label>
      </div>

      {/* 住居 */}
      <div className="mt-6 grid gap-4 md:grid-cols-5 items-start">
        <label className="block text-sm md:col-span-1">
          住居タイプ
          <select
            className="mt-1 input"
            value={housingType}
            onChange={(e) => setHousingType(e.target.value as "rent" | "loan")}
          >
            <option value="rent">賃貸（家賃）</option>
            <option value="loan">住宅ローン</option>
          </select>
        </label>

        {housingType === "rent" ? (
          <>
            <label className="block text-sm md:col-span-2">
              年額家賃
              <input
                className="mt-1 input"
                type="number"
                value={rentAnnual === "" ? "" : rentAnnual}
                onChange={(e) => setRentAnnual(asIntState(e.target.value))}
              />
              <span className="muted">&nbsp;</span>
            </label>
            <label className="block text-sm md:col-span-2">
              家賃終了年（任意）
              <input
                className="mt-1 input"
                type="number"
                value={rentEndYear === "" ? "" : rentEndYear}
                onChange={(e) => setRentEndYear(asIntState(e.target.value))}
              />
              <span className="muted">未入力なら継続支払い</span>
            </label>
          </>
        ) : (
          <>
            <label className="block text-sm md:col-span-2">
              借入元金
              <input
                className="mt-1 input"
                type="number"
                value={loanPrincipal === "" ? "" : loanPrincipal}
                onChange={(e) => setLoanPrincipal(asIntState(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              年利（例 0.012）
              <input
                className="mt-1 input"
                type="number"
                step="0.001"
                value={loanRate === "" ? "" : loanRate}
                onChange={(e) => setLoanRate(asFloatState(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              返済年数
              <input
                className="mt-1 input"
                type="number"
                value={loanYears === "" ? "" : loanYears}
                onChange={(e) => setLoanYears(asIntState(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              返済開始年
              <input
                className="mt-1 input"
                type="number"
                value={loanStartYear === "" ? "" : loanStartYear}
                onChange={(e) => setLoanStartYear(asIntState(e.target.value))}
              />
            </label>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button onClick={handleRun} className="btn btn-primary">試算する</button>
        <span className="muted">開始年：{startYear} / 生年：{startYear - numOr0(currentAge)}</span>
      </div>

      {/* 既存のヘルプモーダルは省略（そのまま） */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowHelp(false)}>
          <div className="card p-6 max-w-md w-full" onClick={(e)=>e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className="text-lg font-semibold mb-4">入力項目の説明</h3>
            {/* 省略 */}
            <div className="mt-4 text-right">
              <button onClick={()=>setShowHelp(false)} className="btn">閉じる（Esc）</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
