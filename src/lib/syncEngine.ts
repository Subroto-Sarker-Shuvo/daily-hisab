import { getSupabase } from './supabase';
import { db } from '../db/db';
import { Transaction, DebtRecord, Category, UserSettings, Cashbook } from '../types';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  lastSyncedAt?: string;
  error?: string;
}

export const syncEngine = {
  // Push all local Dexie data to Supabase Cloud
  async pushLocalToCloud(userId: string): Promise<number> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase is not configured');

    const [transactions, debts, categories, cashbooks, settings] = await Promise.all([
      db.transactions.toArray(),
      db.debts.toArray(),
      db.categories.toArray(),
      db.cashbooks.toArray(),
      (db.settings as any).get('user_preferences'),
    ]);

    let count = 0;

    // 1. Cashbooks (Khatas)
    if (cashbooks.length > 0) {
      const bookRows = cashbooks.map((b) => ({
        id: b.id,
        user_id: userId,
        name: b.name,
        type: b.type,
        icon: b.icon || 'Book',
        color: b.color || '#10B981',
        is_default: Boolean(b.isDefault),
        created_at: b.createdAt,
        updated_at: b.updatedAt,
      }));

      const { error } = await supabase.from('cloud_cashbooks').upsert(bookRows);
      if (error) console.error('Error syncing cashbooks to cloud:', error);
      else count += cashbooks.length;
    }

    // 2. Transactions
    if (transactions.length > 0) {
      const txRows = transactions.map((t) => ({
        id: t.id,
        user_id: userId,
        book_id: t.bookId || 'default_personal',
        type: t.type,
        amount: t.amount,
        category_id: t.categoryId,
        payment_method: t.paymentMethod,
        date: t.date,
        note: t.note || null,
        receipt_image: t.receiptImage || null,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      }));

      const { error } = await supabase.from('cloud_transactions').upsert(txRows);
      if (error) console.error('Error syncing transactions to cloud:', error);
      else count += transactions.length;
    }

    // 3. Debts (দেনা-পাওনা)
    if (debts.length > 0) {
      const debtRows = debts.map((d) => ({
        id: d.id,
        user_id: userId,
        book_id: d.bookId || 'default_personal',
        person_name: d.personName,
        phone_number: d.phoneNumber || null,
        type: d.type,
        total_amount: d.totalAmount,
        settled_amount: d.settledAmount,
        due_date: d.dueDate || null,
        notes: d.notes || null,
        status: d.status,
        settlements: d.settlements || [],
        created_at: d.createdAt,
        updated_at: d.updatedAt,
      }));

      const { error } = await supabase.from('cloud_debts').upsert(debtRows);
      if (error) console.error('Error syncing debts to cloud:', error);
      else count += debts.length;
    }

    // 4. Categories
    if (categories.length > 0) {
      const catRows = categories.map((c) => ({
        id: c.id,
        user_id: userId,
        name_en: c.nameEn,
        name_bn: c.nameBn,
        type: c.type,
        icon: c.icon,
        color: c.color,
        monthly_budget: c.monthlyBudget || null,
      }));

      const { error } = await supabase.from('cloud_categories').upsert(catRows);
      if (error) console.error('Error syncing categories to cloud:', error);
    }

    // 5. User Settings
    if (settings) {
      const settingsRow = {
        user_id: userId,
        language: settings.language || 'bn',
        currency_symbol: settings.currencySymbol || '৳',
        currency_code: settings.currencyCode || 'BDT',
        monthly_budget_limit: settings.monthlyBudgetLimit || 25000,
        theme: settings.theme || 'light',
        is_pin_enabled: settings.isPinEnabled || false,
        pin_hash: settings.pinHash || null,
        active_book_id: settings.activeBookId || 'default_personal',
        updated_at: Date.now(),
      };
      await supabase.from('cloud_settings').upsert(settingsRow);
    }

    return count;
  },

  // Pull cloud data down into local Dexie database
  async pullCloudToLocal(userId: string): Promise<number> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase is not configured');

    let count = 0;

    // 1. Fetch Cloud Cashbooks
    const { data: cloudBooks, error: bookErr } = await supabase
      .from('cloud_cashbooks')
      .select('*')
      .eq('user_id', userId);

    if (!bookErr && cloudBooks && cloudBooks.length > 0) {
      const localBooks: Cashbook[] = cloudBooks.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        icon: row.icon || 'Book',
        color: row.color || '#10B981',
        isDefault: Boolean(row.is_default),
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
      }));
      await db.cashbooks.bulkPut(localBooks);
      count += localBooks.length;
    }

    // 2. Fetch Cloud Transactions
    const { data: cloudTxs, error: txErr } = await supabase
      .from('cloud_transactions')
      .select('*')
      .eq('user_id', userId);

    if (!txErr && cloudTxs && cloudTxs.length > 0) {
      const localTxs: Transaction[] = cloudTxs.map((row: any) => ({
        id: row.id,
        bookId: row.book_id || 'default_personal',
        type: row.type,
        amount: Number(row.amount),
        categoryId: row.category_id,
        paymentMethod: row.payment_method,
        date: row.date,
        note: row.note || undefined,
        receiptImage: row.receipt_image || undefined,
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
      }));
      await db.transactions.bulkPut(localTxs);
      count += localTxs.length;
    }

    // 3. Fetch Cloud Debts
    const { data: cloudDebts, error: debtErr } = await supabase
      .from('cloud_debts')
      .select('*')
      .eq('user_id', userId);

    if (!debtErr && cloudDebts && cloudDebts.length > 0) {
      const localDebts: DebtRecord[] = cloudDebts.map((row: any) => ({
        id: row.id,
        bookId: row.book_id || 'default_personal',
        personName: row.person_name,
        phoneNumber: row.phone_number || undefined,
        type: row.type,
        totalAmount: Number(row.total_amount),
        settledAmount: Number(row.settled_amount),
        dueDate: row.due_date || undefined,
        notes: row.notes || undefined,
        status: row.status,
        settlements: row.settlements || [],
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
      }));
      await db.debts.bulkPut(localDebts);
      count += localDebts.length;
    }

    // 4. Fetch Cloud Settings
    const { data: cloudSettings, error: setErr } = await supabase
      .from('cloud_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!setErr && cloudSettings) {
      const localSettings: UserSettings = {
        language: cloudSettings.language || 'bn',
        currencySymbol: cloudSettings.currency_symbol || '৳',
        currencyCode: cloudSettings.currency_code || 'BDT',
        monthlyBudgetLimit: Number(cloudSettings.monthly_budget_limit) || 25000,
        theme: cloudSettings.theme || 'light',
        isPinEnabled: cloudSettings.is_pin_enabled || false,
        pinHash: cloudSettings.pin_hash || undefined,
        activeBookId: cloudSettings.active_book_id || 'default_personal',
      };
      await (db.settings as any).put({ ...localSettings, key: 'user_preferences' });
    }

    return count;
  },

  // Perform a full bi-directional sync
  async performFullSync(userId: string): Promise<SyncResult> {
    try {
      const pushedCount = await this.pushLocalToCloud(userId);
      const pulledCount = await this.pullCloudToLocal(userId);

      const timestamp = new Date().toISOString();
      localStorage.setItem('daily_hisab_last_synced', timestamp);

      return {
        success: true,
        syncedCount: Math.max(pushedCount, pulledCount),
        lastSyncedAt: timestamp,
      };
    } catch (err: any) {
      console.error('Full Sync Failed:', err);
      return {
        success: false,
        syncedCount: 0,
        error: err.message || 'Sync failed',
      };
    }
  },
};
