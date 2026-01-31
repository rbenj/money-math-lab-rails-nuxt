import { EntityType } from "./types";
import { EntityCategory, type EntityTemplate } from "./entity-template";
import {
  Briefcase,
  Car,
  ChartColumnIncreasing,
  ChartLine,
  ChartSpline,
  CreditCard,
  Diamond,
  GraduationCap,
  HandCoins,
  Home,
  KeyRound,
  KeySquare,
  Landmark,
  PiggyBank,
  Plane,
  ReceiptText,
  Shield,
  ShoppingCart,
  Stethoscope,
  Wallet,
} from "lucide-vue-next";

export const ENTITY_CATEGORY_SORT_ORDER = [
  EntityCategory.Income,
  EntityCategory.Investment,
  EntityCategory.Debt,
  EntityCategory.Expense,
];

const ENTITY_TEMPLATES: EntityTemplate[] = [
  // Debt Templates
  {
    key: "auto-loan",
    name: "Auto Loan",
    icon: KeySquare,
    category: EntityCategory.Debt,
    entityType: EntityType.Debt,
  },
  {
    key: "credit-card",
    name: "Credit Card",
    icon: CreditCard,
    category: EntityCategory.Debt,
    entityType: EntityType.Debt,
  },
  {
    key: "mortgage",
    name: "Mortgage",
    icon: KeyRound,
    category: EntityCategory.Debt,
    entityType: EntityType.Debt,
  },
  {
    key: "student-loan",
    name: "Student Loan",
    icon: GraduationCap,
    category: EntityCategory.Debt,
    entityType: EntityType.Debt,
  },

  // Expense Templates
  {
    key: "bills",
    name: "Bills",
    icon: ReceiptText,
    category: EntityCategory.Expense,
    entityType: EntityType.Expense,
  },
  {
    key: "medical",
    name: "Medical",
    icon: Stethoscope,
    category: EntityCategory.Expense,
    entityType: EntityType.Expense,
  },
  {
    key: "spending",
    name: "Spending",
    icon: ShoppingCart,
    category: EntityCategory.Expense,
    entityType: EntityType.Expense,
  },
  {
    key: "vacation",
    name: "Vacation",
    icon: Plane,
    category: EntityCategory.Expense,
    entityType: EntityType.Expense,
  },

  // Income Templates
  {
    key: "job",
    name: "Job",
    icon: Briefcase,
    category: EntityCategory.Income,
    entityType: EntityType.Income,
  },
  {
    key: "social-security",
    name: "Social Security",
    icon: Shield,
    category: EntityCategory.Income,
    entityType: EntityType.Income,
  },
  {
    key: "windfall",
    name: "Windfall",
    icon: HandCoins,
    category: EntityCategory.Income,
    entityType: EntityType.Income,
  },

  // Investment Templates
  {
    key: "brokerage",
    name: "Brokerage Account",
    icon: Landmark,
    category: EntityCategory.Investment,
    entityType: EntityType.Account,
  },
  {
    key: "checking",
    name: "Checking Account",
    icon: Wallet,
    category: EntityCategory.Investment,
    entityType: EntityType.Account,
  },
  {
    key: "etf",
    name: "ETF",
    icon: ChartSpline,
    category: EntityCategory.Investment,
    entityType: EntityType.Holding,
  },
  {
    key: "house",
    name: "House",
    icon: Home,
    category: EntityCategory.Investment,
    entityType: EntityType.Possession,
  },
  {
    key: "mutual-fund",
    name: "Mutual Fund",
    icon: ChartColumnIncreasing,
    category: EntityCategory.Investment,
    entityType: EntityType.Holding,
  },
  {
    key: "savings",
    name: "Savings",
    icon: PiggyBank,
    category: EntityCategory.Investment,
    entityType: EntityType.Account,
  },
  {
    key: "stock",
    name: "Stock",
    icon: ChartLine,
    category: EntityCategory.Investment,
    entityType: EntityType.Holding,
  },
  {
    key: "valuable",
    name: "Valuable",
    icon: Diamond,
    category: EntityCategory.Investment,
    entityType: EntityType.Possession,
  },
  {
    key: "vehicle",
    name: "Vehicle",
    icon: Car,
    category: EntityCategory.Investment,
    entityType: EntityType.Possession,
  },
];

export function getEntityTemplate(key: string): EntityTemplate | undefined {
  return ENTITY_TEMPLATES.find((t) => t.key === key);
}

export function getTemplatesForEntityType(entityType: EntityType): EntityTemplate[] {
  return ENTITY_TEMPLATES.filter((t) => t.entityType === entityType);
}
