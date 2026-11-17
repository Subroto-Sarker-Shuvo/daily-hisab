# Master Prompt: Complete Daily Expense & Income Tracker Web App (দৈনিক হিসাব খাতা)

> **Role & Persona**: You are an expert Principal Full-Stack Software Architect and UI/UX Designer.
> **Task**: Build a fully functional, production-ready, beautiful, and mobile-friendly Daily Expense & Income Tracker (দৈনন্দিন আয়-ব্যয় ও দেনা-পাওনা হিসাব খাতা) Progressive Web Application (PWA).

---

## 1. Project Overview & Vision

Build a modern, lightning-fast, offline-first personal & small business finance tracker designed specifically for daily budgeting, tracking cash flow, monitoring debts (দেনা-পাওনা), and visualizing expenses.

### Key Goals:
- **Offline-First & PWA**: Works 100% offline in browser/mobile without mandatory server setup; installable on mobile homescreen.
- **Bilingual (English & বাংলা)**: Full support for English and Bengali language switching, with beautiful Bengali typography (e.g. Hind Siliguri font).
- **Currencies**: Default to Bangladeshi Taka (৳ BDT) with support for USD ($), EUR (€), INR (₹), etc.
- **Simplicity & Speed**: Adding a transaction must take less than 5 seconds.

---

## 2. Recommended Tech Stack

- **Framework**: React 18+ / Next.js 14+ (App Router) or Vite + React with TypeScript
- **Styling**: Tailwind CSS + Lucide React (Icons) + Framer Motion (Smooth animations)
- **UI Components**: Radix UI / Shadcn UI patterns (Dialogs, Dropdowns, Date Pickers, Tabs)
- **Data Persistence**: IndexedDB via `Dexie.js` (for zero-latency offline storage) + LocalStorage fallback
- **State Management**: Zustand or TanStack Query (React Query)
- **Data Visualization**: Recharts or Chart.js (clean, responsive, interactive charts)
- **Exporting**: `jspdf` & `jspdf-autotable` (for PDF reports), `xlsx` (for Excel export)
- **Internationalization (i18n)**: Lightweight custom React Context or `i18next` for instant EN/BN toggle.

---

## 3. Core Features & Functional Requirements

### 3.1. Dashboard (হোম স্ক্রিন)
- **Balance Overview Cards**:
  - **Total Cash In / Income (মোট জমা / আয়)**: Green badge/card.
  - **Total Cash Out / Expense (মোট খরচ / ব্যয়)**: Red badge/card.
  - **Net Balance (অবশিষ্ট ক্যাশ / বর্তমান ব্যালেন্স)**: Primary highlight card.
- **Quick Timeframe Filters**: Today (আজ), Yesterday (গতকাল), This Week (এই সপ্তাহ), This Month (এই মাস), Custom Range.
- **Monthly Budget Progress Bar**: Shows "% of budget used" with visual warning if > 80% (yellow) or > 100% (red).
- **Recent Transactions List**: Shows the last 5-10 transactions with category badge, payment mode, date, and amount.
- **Quick Action FAB (Floating Action Button)**: Large '+' button to instantly open the transaction modal.

### 3.2. Transaction Management (লেনদেন পরিচালনা)
- **Transaction Types**:
  - `Expense` (খরচ / ব্যয়)
  - `Income` (জমা / আয়)
  - `Transfer` (এক অ্যাকাউন্ট থেকে অন্য অ্যাকাউন্টে স্থানান্তর - e.g. Cash to bKash)
- **Required Fields**:
  - Amount (টাকার পরিমাণ) - Large numeric keypad friendly input with quick preset buttons (+50, +100, +500, +1000).
  - Category (ক্যাটাগরি) - Selectable icons (Food, Grocery, Rent, Utilities, Transport, Salary, Business, etc.).
  - Date & Time - Defaults to `Now`, easily customizable.
  - Payment Method (পেমেন্ট মাধ্যম): Cash (ক্যাশ), bKash (বিকাশ), Nagad (নগদ), Rocket (রকেট), Bank Card (ব্যাংক), etc.
  - Note / Description (বিবরণ / নোট) - Optional text description.
  - Receipt Image (ভাউচার / রসিদের ছবি) - Upload image/camera capture stored in IndexedDB.
- **Actions**: Add, Edit, Delete (with confirmation modal), Duplicate transaction.

### 3.3. Dena-Paona / Debt Khata (দেনা-পাওনা / বাকি খাতা)
- Separate dedicated tab for tracking personal loans & credits:
  - **Pabo / Receivable (আমি পাবো / পাওনা)**: Money lent to others.
  - **Dibo / Payable (আমাকে দিতে হবে / দেনা)**: Money borrowed from others.
- Fields: Person Name, Phone Number, Amount, Due Date, Notes.
- Status: Pending (বাকি), Partially Paid (আংশিক পরিশোধিত), Settled (সম্পূর্ণ পরিশোধিত).
- Single-click action to record partial or full settlements directly linked to cash balance.

### 3.4. Category & Budget Management
- **Predefined Categories** (with default emojis/icons):
  - *Expense*: Food & Dining (খাবার), Groceries (বাজার), House Rent (বাসা ভাড়া), Utility Bills (বিদ্যুৎ/গ্যাস/পানি/ইন্টারনেট বিল), Transport (যাতায়াত), Medical (চিকিৎসা), Shopping (কেনাকাটা), Education (শিক্ষা), Entertainment (বিনোদন), Others (অন্যান্য).
  - *Income*: Salary (বেতন), Business Profit (ব্যবসার লাভ), Freelancing (ফ্রিল্যান্সিং), Investment Return (বিনিয়োগ), Gift (উপহার), Others.
- **Custom Categories**: Ability to create custom categories with custom icons and colors.
- **Category Monthly Limits**: Set monthly budget caps per category.

### 3.5. Analytics & Reports (চার্ট ও অ্যানালিটিক্স)
- **Visual Analytics**:
  - Expense by Category (Donut/Pie Chart with percentage breakdown).
  - Daily/Weekly Spending Trend (Bar Chart / Area Chart).
  - Income vs Expense comparison over months.
- **Top Spending Highlights**: Displays top 3 biggest expense categories of the month.
- **Export & Share**:
  - **Export PDF Report**: Formatted printable statement with summary & tabular breakdown.
  - **Export Excel / CSV**: Complete raw transaction export.
  - **Backup & Restore**: Download all app data as an encrypted or JSON backup file, with single-click restore.

### 3.6. Settings & Security
- **Bilingual Switcher**: Instant switch between Bangla (বাংলা) and English.
- **Currency Picker**: ৳ BDT, $ USD, € EUR, ₹ INR, £ GBP, etc.
- **Theme Support**: Dark Mode (ডার্ক মোড) & Light Mode with high contrast.
- **App Lock**: Optional 4-digit PIN security to lock the app on startup.
- **Data Reset**: Safe option to clear demo or existing data with double confirmation.

---

## 4. UI/UX Design System & Layout Guidelines

- **Mobile-First Layout**: Optimized for mobile screens (360px - 430px) while maintaining a clean, centered desktop layout.
- **Bottom Navigation Bar (Mobile)**:
  1. `হোম (Home)` - Dashboard, summaries, recent records.
  2. `লেনদেন (Transactions)` - Filterable list of all records with search bar.
  3. `[+] যোগ করুন (Add Button)` - Central raised floating action trigger.
  4. `দেনা-পাওনা (Debts)` - Ledger for loans and credit.
  5. `রিপোর্ট (Reports)` - Charts, insights, export to PDF/Excel.
- **Color Palette**:
  - Primary / Brand: Emerald Green / Teal (`#059669` or `#10B981`) - symbolizes financial health.
  - Expense / Danger: Rose / Crimson (`#E11D48` or `#EF4444`).
  - Income / Success: Emerald (`#10B981`).
  - Background: Slate / Zinc neutral palette (`#F8FAFC` light, `#0F172A` dark).
- **Typography**: Clean sans-serif with seamless Bengali font support (Inter / Plus Jakarta Sans + Hind Siliguri).

---

## 5. Data Schema Design (IndexedDB / TypeScript Models)

```typescript
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'OTHER';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  paymentMethod: PaymentMethod;
  date: string; // ISO string
  note?: string;
  receiptImage?: string; // Base64 or Blob URL
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  nameEn: string;
  nameBn: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
  monthlyBudget?: number;
}

export interface DebtRecord {
  id: string;
  personName: string;
  phoneNumber?: string;
  type: 'RECEIVABLE' | 'PAYABLE'; // পাবো vs দিবো
  amount: number;
  paidAmount: number;
  dueDate?: string;
  notes?: string;
  status: 'PENDING' | 'PARTIAL' | 'SETTLED';
  createdAt: number;
}

export interface UserSettings {
  language: 'bn' | 'en';
  currencySymbol: string;
  currencyCode: string;
  monthlyBudgetLimit: number;
  darkMode: boolean;
  pinLockEnabled: boolean;
  pinCode?: string;
}
```

---

## 6. Step-by-Step Implementation Instructions

When building this application, follow these precise implementation phases:

### Phase 1: Setup & Foundations
1. Initialize the project with Next.js 14 (App router) or Vite + React with TypeScript and Tailwind CSS.
2. Setup Lucide icons, Framer Motion, and Tailwind theme configuration.
3. Configure Bengali font support (`Hind Siliguri` or Google Font CDN).

### Phase 2: Database & State Architecture
1. Setup `Dexie.js` database schema (`DailyHisabDB`) with tables: `transactions`, `categories`, `debts`, `settings`.
2. Seed initial realistic default categories in both Bengali & English.
3. Implement custom hooks (`useTransactions`, `useDebts`, `useSettings`, `useAnalytics`) for reactive state.

### Phase 3: Core Transaction Logic & Quick-Add Modal
1. Create the Quick Add Transaction Modal with high-usability numeric inputs, preset amount chips, and category selectors.
2. Build transaction editing, deletion, and search/filter list (by date, category, payment method).

### Phase 4: Dashboard & Analytics
1. Implement the top balance summary cards with dynamic calculations.
2. Implement Recharts visualizations (Monthly spending breakdown, Income vs Expense, Top Categories).
3. Add date range filter (Today, This Week, This Month, Custom).

### Phase 5: Debt / Dena-Paona Module
1. Build the Dena-Paona management screen with tabs for "পাবো" (Receivable) and "দিতে হবে" (Payable).
2. Add partial settlement modal with real-time balance sync.

### Phase 6: Export, Backup & Settings
1. Build PDF report generator using `jspdf` and `jspdf-autotable`.
2. Build Excel/CSV export and JSON Backup & Restore importer.
3. Build Settings page with language toggle (বাংলা / English), currency selector, and optional PIN lock.

### Phase 7: Polish & PWA Manifest
1. Add PWA manifest and service worker configuration so users can install it as a native app on Android & iOS.
2. Ensure responsive touch-first UI with smooth micro-interactions and empty state illustrations.

---

## 7. Execution Directive
Please build this application completely. Do not leave placeholder comments like `// TODO: Implement later`. All components, calculations, state persistence, forms, and translations must be fully implemented, bug-free, and styled to perfection.
