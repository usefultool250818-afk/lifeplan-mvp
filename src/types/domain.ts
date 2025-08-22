// src/types/domain.ts

/** 住居費：賃貸 or 住宅ローン */
export type Housing =
  | { type: "rent"; amount: number; endYear?: number } // 年額家賃・終了年（任意）
  | { type: "loan"; principal: number; rate: number; years: number; startYear: number }; // 元利均等（年払い）

/** 支出定義 */
export type Expenses = {
  living:
    | { method: "fixed"; base: number }               // 固定額（インフレ連動）
    | { method: "ratio"; ratioOfNet: number };        // 手取り比率
  housing?: Housing;
  education?: { profile: { year: number; amount: number }[] }[];
  insurance?: { premium: number; untilYear?: number }[];
};

/** 世帯全体 */
export type Household = {
  members: { name: string; birthYear: number; retireAge: number }[];
  settings: {
    startYear: number;
    horizon: number;
    inflation: number;
    tax: {
      incomeTaxRate: (taxable: number) => number;
      socialInsRate: number;
      residentRate: number;
      baseDeduction: number;
      salaryDeductionRate: number;
    };
  };
  income: {
    salary: { base: number; bonus?: number; growth: number; endYear?: number }[];
    sideJobs?: { start: number; end: number; amount: number }[];
    pension?: { startAge: number; estAnnual: number }[];
    severance?: { year: number; amount: number }[];
  };
  expenses: Expenses;
  assets: {
    cash: number;
    portfolios?: { name: string; balance: number; expReturn: number; annualAdd?: number }[];
  };
};

/** 年ごとの出力行 */
export type YearRow = {
  year: number;
  gross: number;
  incomeTax: number;
  residentTax: number;
  socialIns: number;
  living: number;
  housing: number;
  education: number;
  insurance: number;
  expRet: number;
  annualAdd: number;
  cashflow: number;
  balance: number;
};
