import type { Household, YearRow } from "@/types/domain";

/**
 * 日本の所得税率（簡易近似版）
 * 必ず number を返します
 */
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

/**
 * 家計シミュレーション本体
 * 引数 hh は破壊せず、内部でローカルコピー／一時変数のみ更新します
 */
export function simulate(hh: Household): YearRow[] {
  const years = Array.from({ length: hh.settings.horizon }, (_, i) => hh.settings.startYear + i);

  // 期首残高（現金＋ポートフォリオ残高の合計）
  let balance =
    (hh.assets.cash ?? 0) +
    (hh.assets.portfolios?.reduce((s, p) => s + (p.balance ?? 0), 0) ?? 0);

  // ポートフォリオはローカルでコピーして毎年ロール
  let portfolios = (hh.assets.portfolios ?? []).map(p => ({ ...p }));

  const rows: YearRow[] = [];

  for (const year of years) {
    const yearsFromStart = year - hh.settings.startYear;

    // 収入
    const salary = hh.income.salary.reduce((s, job) => {
      if (job.endYear && year > job.endYear) return s;
      const baseYear = (job.base ?? 0) * Math.pow(1 + (job.growth ?? 0), Math.max(0, yearsFromStart));
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
      hh.income.severance?.reduce((s, v) => s + (v.year === year ? (v.amount ?? 0) : 0), 0) ?? 0;

    const gross = salary + side + pension + severance;

    // 税・社保（近似＋NaNガード）
    const { salaryDeductionRate, baseDeduction, residentRate, socialInsRate } = hh.settings.tax;
    const taxableBase = gross * (1 - (salaryDeductionRate ?? 0));
    const taxable = Math.max(0, taxableBase - (baseDeduction ?? 0));

    const it = hh.settings.tax.incomeTaxRate(taxable);
    const incomeTax = Number.isFinite(it) ? it : 0;

    const residentTaxRaw = taxable * (residentRate ?? 0);
    const residentTax = Number.isFinite(residentTaxRaw) ? residentTaxRaw : 0;

    const socialInsRaw = gross * (socialInsRate ?? 0);
    const socialIns = Number.isFinite(socialInsRaw) ? socialInsRaw : 0;

    // 支出（インフレ調整）
    const infl = Math.pow(1 + (hh.settings.inflation ?? 0), yearsFromStart);

    const takeHome = Math.max(0, gross - incomeTax - residentTax - socialIns);
    const living =
      hh.expenses.living.method === "fixed"
        ? (hh.expenses.living.base ?? 0) * infl
        : takeHome * (hh.expenses.living.ratioOfNet ?? 0.6);

    const housing =
      hh.expenses.housing && (hh.expenses.housing.endYear ?? 9999) >= year
        ? (hh.expenses.housing.amount ?? 0) * infl
        : 0;

    const education =
      (hh.expenses.education ?? []).reduce(
        (s, e) => s + (((e.profile.find(p => p.year === year)?.amount) ?? 0) * infl),
        0
      );

    const insurance =
      (hh.expenses.insurance ?? []).reduce(
        (s, i) => s + (((i.untilYear && year > i.untilYear) ? 0 : (i.premium ?? 0) * infl)),
        0
      );

    // 投資（ローカルコピーで計算）
    const annualAdd = portfolios.reduce((s, p) => s + (p.annualAdd ?? 0), 0);
    const expRet = portfolios.reduce((s, p) => s + ((p.balance ?? 0) * (p.expReturn ?? 0)), 0);

    // キャッシュフロー・残高
    const cashflow = takeHome - (living + housing + education + insurance);
    balance = balance + cashflow + annualAdd + expRet;

    // 翌年のためにポートフォリオ残高をロール（ローカル変数のみ更新）
    if (portfolios.length) {
      const total = portfolios.reduce((s, p) => s + (p.balance ?? 0), 0);
      const weights = portfolios.map(p => (total > 0 ? (p.balance ?? 0) / total : 0));
      const addEach = portfolios.map((p, i) => (p.annualAdd ?? 0) * (weights[i] || 0));
      portfolios = portfolios.map((p, i) => ({
        ...p,
        balance: (p.balance ?? 0) + (p.balance ?? 0) * (p.expReturn ?? 0) + (addEach[i] ?? 0),
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
