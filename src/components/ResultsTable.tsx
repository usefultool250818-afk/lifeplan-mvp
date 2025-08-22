"use client";
import type { YearRow } from "@/types/domain";
import { yen } from "@/lib/format";

/** NaN/undefined安全な円フォーマッタ */
const yenSafe = (n: number | null | undefined) =>
  yen.format(Math.round(typeof n === "number" && Number.isFinite(n) ? n : 0));

export default function ResultsTable({ rows }: { rows: YearRow[] }) {
  if (!rows?.length) return null;

  const headers = [
    "年",
    "総収入",
    "所得税",
    "住民税",
    "社保",
    "生活費",
    "住居",
    "教育",
    "保険",
    "投資収益",
    "積立",
    "可処分CF",
    "期末残高",
  ];

  return (
    <table className="table" aria-label="シミュレーション結果テーブル">
      <caption className="sr-only">年次の収支・残高一覧</caption>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.year}
            className={`border-t ${
              r.balance < 0 ? "bg-red-50" : "bg-white hover:bg-gray-50"
            }`}
          >
            <td>{r.year}</td>
            <td>{yenSafe(r.gross)}</td>
            <td>{yenSafe(r.incomeTax)}</td>
            <td>{yenSafe(r.residentTax)}</td>
            <td>{yenSafe(r.socialIns)}</td>
            <td>{yenSafe(r.living)}</td>
            <td>{yenSafe(r.housing)}</td>
            <td>{yenSafe(r.education)}</td>
            <td>{yenSafe(r.insurance)}</td>
            <td>{yenSafe(r.expRet)}</td>
            <td>{yenSafe(r.annualAdd)}</td>
            <td>{yenSafe(r.cashflow)}</td>
            <td className="font-semibold">{yenSafe(r.balance)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
