import { getSupabase } from './supabase';
import { db } from '../db/db';
import { Transaction, DebtRecord, Category, UserSettings } from '../types';

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

    const [transactions, debts, categories, settings] = await Promise.all([
      db.transactions.toArray(),
      db.debts.toArray(),
      db.categories.toArray(),
      (db.settings as any).get('user_preferences'),
    ]);

    let count = 0;

    // 1. Transactions
    if (transactions.length > 0) {
      const txRows = transactions.map((t) => ({
        id: t.id,
        user_id: userId,
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

    // 2. Debts (দেনা-পাওনা)
    if (debts.length > 0) {
      const debtRows = debts.map((d) => ({
        id: d.id,
        user_id: userId,
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

    // 3. Categories
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

    // 4. User Settings
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

    // 1. Fetch Cloud Transactions
    const { data: cloudTxs, error: txErr } = await supabase
      .from('cloud_transactions')
      .select('*')
      .eq('user_id', userId);

    if (!txErr && cloudTxs && cloudTxs.length > 0) {
      const localTxs: Transaction[] = cloudTxs.map((row: any) => ({
        id: row.id,
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

    // 2. Fetch Cloud Debts
    const { data: cloudDebts, error: debtErr } = await supabase
      .from('cloud_debts')
      .select('*')
      .eq('user_id', userId);

    if (!debtErr && cloudDebts && cloudDebts.length > 0) {
      const localDebts: DebtRecord[] = cloudDebts.map((row: any) => ({
        id: row.id,
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

    // 3. Fetch Cloud Settings
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
