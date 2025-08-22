"use client";

import { useState } from "react";
import InputForm from "@/components/InputForm";
import BalanceChart from "@/components/BalanceChart";
import ResultsTable from "@/components/ResultsTable";
import type { Household, YearRow } from "@/types/domain";
import { simulate } from "@/lib/simulate";

export default function Page() {
  const [rows, setRows] = useState<YearRow[] | null>(null);

  const handleRun = (hh: Household) => {
    const result = simulate(hh); // structuredClone は不要
    setRows(result);
  };

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">ライフプラン・シミュレーター（MVP）</h1>
      <InputForm onRun={handleRun} />

      {/* 破綻年バナー */}
      {rows && (() => {
        const firstDeficit = rows.find(r => r.balance < 0)?.year;
        return firstDeficit ? (
          <div className="p-3 rounded bg-red-100 text-red-800">
            資産残高がマイナスになる最初の年: <strong>{firstDeficit}年</strong>
          </div>
        ) : (
          <div className="p-3 rounded bg-green-100 text-green-800">
            期間内に資産残高のマイナスは発生しません。
          </div>
        );
      })()}

      {rows && (
        <>
          <BalanceChart rows={rows} />
          <ResultsTable rows={rows} />
        </>
      )}

      <p className="text-xs text-gray-500">
        ※税・社会保険は<em>近似</em>です。前提は後で細分化可能（Pro対応）。
      </p>
    </main>
  );
}
