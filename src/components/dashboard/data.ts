/* ============================================================
 *  FiscalFlow — Mock data (frontend only)
 * ============================================================ */

export type FlowRange = "weekly" | "monthly" | "yearly";

export interface FlowPoint {
  label: string;
  title: string;
  income: number;
  expense: number;
}

export const flowDatasets: Record<
  FlowRange,
  { pinnedIndex: number; points: FlowPoint[] }
> = {
  weekly: {
    pinnedIndex: 4,
    points: [
      { label: "Mon", title: "12 August 2024", income: 320, expense: 510 },
      { label: "Tue", title: "13 August 2024", income: 478, expense: 432 },
      { label: "Wed", title: "14 August 2024", income: 390, expense: 618 },
      { label: "Thu", title: "15 August 2024", income: 610, expense: 384 },
      { label: "Fri", title: "16 August 2024", income: 892, expense: 374 },
      { label: "Sat", title: "17 August 2024", income: 542, expense: 462 },
      { label: "Sun", title: "18 August 2024", income: 706, expense: 412 },
    ],
  },
  monthly: {
    pinnedIndex: 3,
    points: [
      { label: "May", title: "18 May 2024", income: 342, expense: 524 },
      { label: "June", title: "18 June 2024", income: 462, expense: 386 },
      { label: "July", title: "18 July 2024", income: 618, expense: 472 },
      { label: "August", title: "18 August 2024", income: 892, expense: 374 },
      { label: "September", title: "18 September 2024", income: 540, expense: 688 },
      { label: "October", title: "18 October 2024", income: 626, expense: 482 },
      { label: "November", title: "18 November 2024", income: 762, expense: 566 },
    ],
  },
  yearly: {
    pinnedIndex: 2,
    points: [
      { label: "2019", title: "Fiscal Year 2019", income: 384, expense: 462 },
      { label: "2020", title: "Fiscal Year 2020", income: 422, expense: 508 },
      { label: "2021", title: "Fiscal Year 2021", income: 612, expense: 392 },
      { label: "2022", title: "Fiscal Year 2022", income: 722, expense: 484 },
      { label: "2023", title: "Fiscal Year 2023", income: 892, expense: 374 },
      { label: "2024", title: "Fiscal Year 2024", income: 682, expense: 524 },
    ],
  },
};

/* ------------------------- KPI cards ------------------------ */

export type KpiIcon = "wallet" | "piggy" | "coins" | "card";

export interface Kpi {
  id: string;
  label: string;
  value: string;
  cents: string;
  delta: string;
  trend: "up" | "down";
  icon: KpiIcon;
}

export const kpis: Kpi[] = [
  {
    id: "balance",
    label: "Total Balance",
    value: "$16,745",
    cents: ".00",
    delta: "+6%",
    trend: "up",
    icon: "wallet",
  },
  {
    id: "saving",
    label: "Total Saving",
    value: "$5,981",
    cents: ".00",
    delta: "-2.8%",
    trend: "down",
    icon: "piggy",
  },
  {
    id: "revenue",
    label: "Revenue",
    value: "$9,116",
    cents: ".00",
    delta: "+1.3%",
    trend: "up",
    icon: "coins",
  },
  {
    id: "credit",
    label: "Credit",
    value: "$4,872",
    cents: ".00",
    delta: "+1.3%",
    trend: "up",
    icon: "card",
  },
];

/* ---------------------- Transactions ------------------------ */

export type TransactionStatus = "Paid" | "Pending";

export interface Transaction {
  id: string;
  date: string;
  status: TransactionStatus;
  amount: string;
}

export const transactions: Transaction[] = [
  { id: "SPD-0051", date: "12/12/24", status: "Paid", amount: "$137.000" },
  { id: "SPD-0052", date: "10/12/24", status: "Pending", amount: "$432.100" },
  { id: "SPD-0053", date: "09/12/24", status: "Paid", amount: "$200.000" },
  { id: "SPD-0054", date: "06/12/24", status: "Paid", amount: "$365.000" },
];

/* --------------------- Tax liabilities ---------------------- */

export type TaxTone = "strong" | "medium" | "soft";

export interface TaxItem {
  label: string;
  percent: number;
  tone: TaxTone;
}

export const taxes: TaxItem[] = [
  { label: "Value Added Tax", percent: 44, tone: "strong" },
  { label: "Employee Income Tax", percent: 36, tone: "medium" },
  { label: "Tax on Service", percent: 20, tone: "soft" },
];

/* --------------------- Financial balance -------------------- */

export interface BalanceSegment {
  id: string;
  label: string;
  value: number;
  color: string;
}

export const balanceSegments: BalanceSegment[] = [
  { id: "profit", label: "Total Profit", value: 45, color: "#22c55e" },
  { id: "today", label: "Profit Today", value: 33, color: "#f59e0b" },
  { id: "week", label: "For Week", value: 22, color: "#c084fc" },
];
