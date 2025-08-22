import type { Household, YearRow } from "@/types/domain";

/** 所得税（簡易近似） */
export function defaultIncomeTax(taxable: number): number {
  if (taxable <= 0) return 0;
  if (taxable < 1_950_000) return taxable * 0.05;
  if (taxable < 3_300_000) return taxable * 0.10 - 97_500;
  if (taxable < 6_950_000) return taxable * 0.20 - 427_500;
  if (taxable < 9_000_000) return taxable * 0.23 - 636_000;
  if (taxable < 18_000_000) return taxable * 0.33 - 1_536_000;
  if (taxable < 40_000_000) return taxable * 0.40 - 2_796_000;
  return taxable * 0.45 - 4_796_000;
}

/** 元利均等の年額返済（固定金利・年払い） */
function annualAnnuityPayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  if (annualRate <= 0) return principal / years;
  const r = annualRate;
  const n = years;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function simulate(hh: Household): YearRow[] {
  const years = Array.from({ length: hh.settings.horizon }, (_, i) => hh.settings.startYear + i);

  // 期首残高（現金＋ポートフォリオ合計）
  let balance =
    (hh.assets.cash ?? 0) +
    (hh.assets.portfolios?.reduce((s, p) => s + (p.balance ?? 0), 0) ?? 0);

  // ポートフォリオはローカルコピーして年次更新
  let portfolios = (hh.assets.portfolios ?? []).map((p) => ({ ...p }));

  const rows: YearRow[] = [];

  for (const year of years) {
    const yearsFromStart = year - hh.settings.startYear;

    // --- 収入 ---
    const salary = hh.income.salary.reduce((s, job) => {
      if (job.endYear && year > job.endYear) return s;
      const baseYear =
        (job.base ?? 0) * Math.pow(1 + (job.growth ?? 0), Math.max(0, yearsFromStart));
      return s + baseYear + (job.bonus ?? 0);
    }, 0);

    const side =
      hh.income.sideJobs?.reduce(
        (s, v) => s + (year >= v.start && year <= v.end ? (v.amount ?? 0) : 0),
        0
      ) ?? 0;

    const pension =
      hh.income.pension?.reduce((s, p) => {
        const age = year - hh.members[0].birthYear;
        return s + (age >= p.startAge ? (p.estAnnual ?? 0) : 0);
      }, 0) ?? 0;

    const severance =
      hh.income.severance?.reduce((s, v) => s + (v.year === year ? (v.amount ?? 0) : 0), 0) ??
      0;

    const gross = salary + side + pension + severance;

    // --- 税・社保 ---
    const { salaryDeductionRate, baseDeduction, residentRate, socialInsRate } = hh.settings.tax;
    const taxableBase = gross * (1 - (salaryDeductionRate ?? 0));
    const taxable = Math.max(0, taxableBase - (baseDeduction ?? 0));

    const it = hh.settings.tax.incomeTaxRate(taxable);
    const incomeTax = Number.isFinite(it) ? it : 0;

    const residentTaxRaw = taxable * (residentRate ?? 0);
    const residentTax = Number.isFinite(residentTaxRaw) ? residentTaxRaw : 0;

    const socialInsRaw = gross * (socialInsRate ?? 0);
    const socialIns = Number.isFinite(socialInsRaw) ? socialInsRaw : 0;

    // --- 支出（インフレ） ---
    const infl = Math.pow(1 + (hh.settings.inflation ?? 0), yearsFromStart);
    const takeHome = Math.max(0, gross - incomeTax - residentTax - socialIns);

    const living =
      (hh.expenses.living as any).method === "fixed"
        ? (hh.expenses.living as any).base * infl
        : takeHome * ((hh.expenses.living as any).ratioOfNet ?? 0.6);

    // 住居：タイプ別に型を絞り込む（ここが今回の修正ポイント）
    let housing = 0;
    if (hh.expenses.housing) {
      if (hh.expenses.housing.type === "rent") {
        const rent = hh.expenses.housing; // 型: { type:"rent"; amount; endYear? }
        const stillPaying = (rent.endYear ?? 9999) >= year;
        housing = stillPaying ? (rent.amount ?? 0) * infl : 0;
      } else if (hh.expenses.housing.type === "loan") {
        const loan = hh.expenses.housing; // 型: { type:"loan"; principal; rate; years; startYear }
        const start = loan.startYear ?? hh.settings.startYear;
        const end = start + (loan.years ?? 0) - 1;
        if (year >= start && year <= end) {
          housing = annualAnnuityPayment(loan.principal ?? 0, loan.rate ?? 0, loan.years ?? 0);
        } else {
          housing = 0;
        }
      }
    }

    const education =
      (hh.expenses.education ?? []).reduce(
        (s, e) => s + (((e.profile.find((p) => p.year === year)?.amount) ?? 0) * infl),
        0
      );

    const insurance =
      (hh.expenses.insurance ?? []).reduce(
        (s, i) => s + ((i.untilYear && year > i.untilYear) ? 0 : (i.premium ?? 0) * infl),
        0
      );

    // --- 投資 ---
    const annualAdd = portfolios.reduce((s, p) => s + (p.annualAdd ?? 0), 0);
    const expRet = portfolios.reduce(
      (s, p) => s + ((p.balance ?? 0) * (p.expReturn ?? 0)),
      0
    );

    // --- キャッシュフロー・残高 ---
    const cashflow = takeHome - (living + housing + education + insurance);
    balance = balance + cashflow + annualAdd + expRet;

    // 翌年のポートフォリオ更新
    if (portfolios.length) {
      const total = portfolios.reduce((s, p) => s + (p.balance ?? 0), 0);
      const weights = portfolios.map((p) => (total > 0 ? (p.balance ?? 0) / total : 0));
      const addEach = portfolios.map((p, i) => (p.annualAdd ?? 0) * (weights[i] || 0));
      portfolios = portfolios.map((p, i) => ({
        ...p,
        balance:
          (p.balance ?? 0) +
          (p.balance ?? 0) * (p.expReturn ?? 0) +
          (addEach[i] ?? 0),
      }));
    }

    rows.push({
      year,
      gross,
      incomeTax,
      residentTax,
      socialIns,
      living,
      housing,
      education,
      insurance,
      expRet,
      annualAdd,
      cashflow,
      balance,
    });
  }

  return rows;
}
