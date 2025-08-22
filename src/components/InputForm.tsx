"use client";

import { useEffect, useMemo, useState } from "react";
import type { Household } from "@/types/domain";
import { defaultIncomeTax } from "@/lib/simulate";

type Props = { onRun: (hh: Household) => void };

export default function InputForm({ onRun }: Props) {
  // ✅ 「開始年」ではなく「現在年齢」を入力
  // 既存デフォルト（startYear=2025, birthYear=1993）に合わせ 2025年時点で32歳に設定
  const [currentAge, setCurrentAge] = useState<number>(32);

  // シミュレーションの開始年は「今の西暦」に固定（＝ページを開いた年）
  const startYear = useMemo(() => new Date().getFullYear(), []);

  // 期間・前提（従来どおり）
  const [horizon, setHorizon] = useState<number>(60);
  const [inflation, setInflation] = useState<number>(0.02);
  const [base, setBase] = useState<number>(6_500_000);
  const [bonus, setBonus] = useState<number>(1_000_000);
  const [growth, setGrowth] = useState<number>(0.02);
  const [cash, setCash] = useState<number>(3_000_000);

  // 住居：賃貸 or ローン（既存仕様）
  const [housingType, setHousingType] = useState<"rent" | "loan">("rent");

  // 賃貸
  const [rentAnnual, setRentAnnual] = useState<number>(1_800_000);
  const [rentEndYear, setRentEndYear] = useState<number>(startYear + 20);

  // ローン
  const [loanPrincipal, setLoanPrincipal] = useState<number>(35_000_000);
  const [loanRate, setLoanRate] = useState<number>(0.012); // 年1.2%
  const [loanYears, setLoanYears] = useState<number>(35);
  const [loanStartYear, setLoanStartYear] = useState<number>(startYear);

  // currentAge を変更しても startYear は「今年」固定のため、endYear/startYearはそのまま運用。
  // もし「開始年も年齢に連動させたい」場合はここで再計算してください。

  // ヘルプ（既存のモーダル）
  const [showHelp, setShowHelp] = useState(false);
  useEffect(() => {
    if (!showHelp) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowHelp(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showHelp]);

  const toNum = (v: string) => Number(v || 0);

  const handleRun = () => {
    // 年齢→生年へ変換：birthYear = startYear - currentAge
    const birthYear = startYear - currentAge;

    const housing =
      housingType === "rent"
        ? { type: "rent" as const, amount: rentAnnual, endYear: rentEndYear }
        : {
            type: "loan" as const,
            principal: loanPrincipal,
            rate: loanRate,
            years: loanYears,
            startYear: loanStartYear,
          };

    const hh: Household = {
      members: [{ name: "世帯主", birthYear, retireAge: 65 }],
      settings: {
        startYear,          // 今年を開始年として使う
        horizon,
        inflation,
        tax: {
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
        housing,
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

  return (
    <div className="space-y-4">
      {/* 見出しとヘルプ */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">入力（デモ）</h2>
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="btn btn-ghost"
          aria-haspopup="dialog"
          aria-expanded={showHelp}
        >
          ヘルプ
        </button>
      </div>

      {/* 基本項目（開始年→現在年齢へ） */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <label className="block text-sm">
          現在年齢
          <input
            className="mt-1 input"
            type="number"
            value={currentAge}
            min={0}
            onChange={(e) => setCurrentAge(toNum(e.target.value))}
          />
          <span className="muted">※ シミュレーション開始時点の年齢</span>
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
          初年度年収（基本給）
          <input
            className="mt-1 input"
            type="number"
            value={base}
            onChange={(e) => setBase(toNum(e.target.value))}
          />
          <span className="muted">※ 賞与は下項目で別入力</span>
        </label>

        <label className="block text-sm">
          賞与（年額）
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
          現金残高（開始時点）
          <input
            className="mt-1 input"
            type="number"
            value={cash}
            onChange={(e) => setCash(toNum(e.target.value))}
          />
        </label>
      </div>

      {/* 住居の切替＆入力（既存） */}
      <div className="mt-6 grid gap-4 md:grid-cols-5 items-end">
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
                value={rentAnnual}
                onChange={(e) => setRentAnnual(toNum(e.target.value))}
              />
            </label>
            <label className="block text-sm md:col-span-2">
              家賃終了年（任意）
              <input
                className="mt-1 input"
                type="number"
                value={rentEndYear}
                onChange={(e) => setRentEndYear(toNum(e.target.value))}
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
                value={loanPrincipal}
                onChange={(e) => setLoanPrincipal(toNum(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              年利（例 0.012）
              <input
                className="mt-1 input"
                step="0.001"
                type="number"
                value={loanRate}
                onChange={(e) => setLoanRate(Number(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              返済年数
              <input
                className="mt-1 input"
                type="number"
                value={loanYears}
                onChange={(e) => setLoanYears(toNum(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              返済開始年
              <input
                className="mt-1 input"
                type="number"
                value={loanStartYear}
                onChange={(e) => setLoanStartYear(toNum(e.target.value))}
              />
            </label>
          </>
        )}
      </div>

      {/* 実行ボタン */}
      <div className="mt-4 flex items-center gap-3">
        <button onClick={handleRun} className="btn btn-primary">試算する</button>
        <span className="muted">開始年：{startYear} / 生年：{startYear - currentAge}</span>
      </div>

      {/* ヘルプモーダル（説明を年齢ベースに更新） */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
          >
            <h3 id="help-title" className="text-lg font-semibold mb-4">入力項目の説明</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><strong>現在年齢：</strong>シミュレーション開始時点のあなたの年齢。内部で「生年＝開始年−年齢」に変換します。</li>
              <li><strong>期間（年）：</strong>何年間シミュレーションを行うか。</li>
              <li><strong>物価上昇率：</strong>生活費など固定額支出にかかるインフレ率。</li>
              <li><strong>初年度年収（基本給）：</strong>賞与を除く基本給。毎年「昇給率」で増加。</li>
              <li><strong>賞与：</strong>年間のボーナス。基本給に加算されます（昇給率は未適用）。</li>
              <li><strong>現金残高：</strong>開始時点の預貯金。資産の初期値として使われます。</li>
              <li><strong>住居：</strong>賃貸は年額家賃（終了年で支払い停止）。ローンは元利均等・固定金利の簡易モデル。</li>
            </ul>
            <div className="mt-4 text-right">
              <button onClick={() => setShowHelp(false)} className="btn">閉じる（Esc）</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
