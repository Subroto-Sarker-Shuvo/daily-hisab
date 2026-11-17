import Dexie, { type Table } from 'dexie';
import { Transaction, Category, DebtRecord, UserSettings } from '../types';

export class DailyHisabDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  debts!: Table<DebtRecord, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('DailyHisabDB');
    this.version(1).stores({
      transactions: 'id, type, amount, categoryId, paymentMethod, date, createdAt',
      categories: 'id, type, nameEn, nameBn',
      debts: 'id, type, personName, status, dueDate, createdAt',
      settings: 'key',
    });
  }
}

export const db = new DailyHisabDatabase();

// Default Categories Seed List
export const defaultCategories: Category[] = [
  // Expenses
  { id: 'cat_food', nameEn: 'Food & Dining', nameBn: 'খাবার ও রেস্তোরাঁ', type: 'EXPENSE', icon: 'Utensils', color: '#F97316' },
  { id: 'cat_grocery', nameEn: 'Groceries', nameBn: 'বাজার ও মুদি', type: 'EXPENSE', icon: 'ShoppingBag', color: '#10B981' },
  { id: 'cat_rent', nameEn: 'Rent & Housing', nameBn: 'বাসা ও দোকান ভাড়া', type: 'EXPENSE', icon: 'Home', color: '#6366F1' },
  { id: 'cat_utilities', nameEn: 'Utilities & Bills', nameBn: 'বিল (বিদ্যুৎ/গ্যাস/পানি)', type: 'EXPENSE', icon: 'Zap', color: '#EAB308' },
  { id: 'cat_transport', nameEn: 'Transport & Travel', nameBn: 'যাতায়াত ও ভাড়া', type: 'EXPENSE', icon: 'Bus', color: '#3B82F6' },
  { id: 'cat_medical', nameEn: 'Medical & Healthcare', nameBn: 'চিকিৎসা ও ওষুধ', type: 'EXPENSE', icon: 'HeartPulse', color: '#EF4444' },
  { id: 'cat_shopping', nameEn: 'Shopping & Clothes', nameBn: 'কেনাকাটা ও পোশাক', type: 'EXPENSE', icon: 'Shirt', color: '#EC4899' },
  { id: 'cat_education', nameEn: 'Education & Books', nameBn: 'পড়াশোনা ও বই', type: 'EXPENSE', icon: 'GraduationCap', color: '#8B5CF6' },
  { id: 'cat_entertainment', nameEn: 'Entertainment', nameBn: 'বিনোদন ও ঘোরাঘুরি', type: 'EXPENSE', icon: 'Film', color: '#14B8A6' },
  { id: 'cat_expense_other', nameEn: 'Other Expense', nameBn: 'অন্যান্য খরচ', type: 'EXPENSE', icon: 'MoreHorizontal', color: '#64748B' },

  // Incomes
  { id: 'cat_salary', nameEn: 'Salary', nameBn: 'চাকরির বেতন', type: 'INCOME', icon: 'Wallet', color: '#10B981' },
  { id: 'cat_business', nameEn: 'Business Profit', nameBn: 'ব্যবসার বিক্রি/লাভ', type: 'INCOME', icon: 'Briefcase', color: '#059669' },
  { id: 'cat_freelance', nameEn: 'Freelance & Projects', nameBn: 'ফ্রিল্যান্সিং আয়', type: 'INCOME', icon: 'Laptop', color: '#2563EB' },
  { id: 'cat_investment', nameEn: 'Investment Returns', nameBn: 'বিনিয়োগের লভ্যাংশ', type: 'INCOME', icon: 'TrendingUp', color: '#7C3AED' },
  { id: 'cat_gift', nameEn: 'Gift / Bonus', nameBn: 'উপহার বা বোনাস', type: 'INCOME', icon: 'Gift', color: '#DB2777' },
  { id: 'cat_income_other', nameEn: 'Other Income', nameBn: 'অন্যান্য জমা', type: 'INCOME', icon: 'Coins', color: '#0D9488' },
];

export const defaultSettings: UserSettings = {
  language: 'bn',
  currencySymbol: '৳',
  currencyCode: 'BDT',
  monthlyBudgetLimit: 25000,
  theme: 'light',
  isPinEnabled: false,
};

// Seed database on first run
export const seedDefaultDatabase = async () => {
  const catCount = await db.categories.count();
  if (catCount === 0) {
    await db.categories.bulkAdd(defaultCategories);
  }

  const existingSettings = await (db.settings as any).get('user_preferences');
  if (!existingSettings) {
    await (db.settings as any).put({ ...defaultSettings, key: 'user_preferences' });
  }
};
