"use client";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, type ChartData, type ChartOptions } from "chart.js";
import type { YearRow } from "@/types/domain";
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function BalanceChart({ rows }: { rows: YearRow[] }) {
  if (!rows?.length) return null;

  const data: ChartData<"line"> = {
    labels: rows.map(r => r.year),
    datasets: [{ label: "資産残高", data: rows.map(r => Math.round(r.balance)), tension: 0.2 }]
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: {
      y: { ticks: { callback: (v) => (typeof v === "number" ? v.toLocaleString() : String(v)) } }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-2">資産残高の推移</h2>
      <Line data={data} options={options} />
    </div>
  );
}
