import type { LucideIcon } from 'lucide-vue-next';
import type { EntityType } from './types';

export enum EntityCategory {
  Debt = 'debt',
  Expense = 'expense',
  Income = 'income',
  Investment = 'investment',
}

export interface EntityTemplate {
  key: string;
  name: string;
  icon: LucideIcon;
  category: EntityCategory;
  entityType: EntityType;
}
