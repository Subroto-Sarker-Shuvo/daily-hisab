import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import { DebtRecord, DebtType, DebtSettlement, PaymentMethod } from '../../types';
import { formatAmount, formatDate } from '../../lib/formatters';
import {
  HandCoins,
  Plus,
  X,
  CheckCircle2,
  Clock,
  Trash2,
  Phone,
  Calendar,
  AlertCircle,
  Check,
  MessageSquare,
  Receipt,
} from 'lucide-react';
import { SmsReminderModal } from './SmsReminderModal';
import { CashMemoModal } from '../common/CashMemoModal';

interface DebtsViewProps {
  debts: DebtRecord[];
}

export const DebtsView: React.FC<DebtsViewProps> = ({ debts }) => {
  const { lang, currencySymbol, currentBookId, t } = useApp();

  const activeKhata = useLiveQuery(
    () => (currentBookId !== 'all' ? db.cashbooks.get(currentBookId) : undefined),
    [currentBookId]
  );

  const [activeDebtType, setActiveDebtType] = useState<DebtType>('RECEIVABLE');
  const [isAddDebtOpen, setIsAddDebtOpen] = useState<boolean>(false);
  const [settlingDebt, setSettlingDebt] = useState<DebtRecord | null>(null);
  const [reminderDebt, setReminderDebt] = useState<DebtRecord | null>(null);
  const [memoDebt, setMemoDebt] = useState<DebtRecord | null>(null);

  // Add Debt Form State
  const [personName, setPersonName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Settlement Form State
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('CASH');
  const [settleNote, setSettleNote] = useState<string>('');

  // Calculations for summary
  const totalPabo = debts
    .filter((d) => d.type === 'RECEIVABLE' && d.status !== 'SETTLED')
    .reduce((acc, curr) => acc + (curr.totalAmount - curr.settledAmount), 0);

  const totalDibo = debts
    .filter((d) => d.type === 'PAYABLE' && d.status !== 'SETTLED')
    .reduce((acc, curr) => acc + (curr.totalAmount - curr.settledAmount), 0);

  const filteredDebts = debts.filter((d) => d.type === activeDebtType);

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(totalAmount);
    if (!personName.trim() || !amountNum || amountNum <= 0) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে ব্যক্তির নাম ও সঠিক টাকার পরিমাণ দিন।' : 'Please enter person name and valid amount.');
      return;
    }

    const newRecord: DebtRecord = {
      id: crypto.randomUUID(),
      bookId: currentBookId !== 'all' ? currentBookId : 'default_personal',
      personName: personName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      type: activeDebtType,
      totalAmount: amountNum,
      settledAmount: 0,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      status: 'PENDING',
      settlements: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.debts.add(newRecord);
    setIsAddDebtOpen(false);
    setPersonName('');
    setPhoneNumber('');
    setTotalAmount('');
    setDueDate('');
    setNotes('');
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingDebt) return;

    const amount = parseFloat(settleAmount);
    const remaining = settlingDebt.totalAmount - settlingDebt.settledAmount;

    if (!amount || amount <= 0 || amount > remaining) {
      alert(lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন (অবশিষ্ট বাকির চেয়ে বেশি হতে পারবে না)।' : 'Please enter valid amount (not exceeding remaining balance).');
      return;
    }

    const newSettlement: DebtSettlement = {
      id: crypto.randomUUID(),
      amount,
      date: new Date().toISOString(),
      paymentMethod: settleMethod,
      note: settleNote.trim() || undefined,
    };

    const newSettledAmount = settlingDebt.settledAmount + amount;
    const newStatus = newSettledAmount >= settlingDebt.totalAmount ? 'SETTLED' : 'PARTIAL';

    // Update debt record
    await db.debts.update(settlingDebt.id, {
      settledAmount: newSettledAmount,
      status: newStatus,
      settlements: [...settlingDebt.settlements, newSettlement],
      updatedAt: Date.now(),
    });

    // Automatically record this as a cash transaction if desired
    await db.transactions.add({
      id: crypto.randomUUID(),
      bookId: settlingDebt.bookId || (currentBookId !== 'all' ? currentBookId : 'default_personal'),
      type: settlingDebt.type === 'RECEIVABLE' ? 'INCOME' : 'EXPENSE',
      amount,
      categoryId: settlingDebt.type === 'RECEIVABLE' ? 'cat_income_other' : 'cat_expense_other',
      paymentMethod: settleMethod,
      date: new Date().toISOString(),
      note: `${lang === 'bn' ? 'দেনা-পাওনা সমন্বয়: ' : 'Debt Settlement: '}${settlingDebt.personName}${settleNote ? ` (${settleNote})` : ''}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    setSettlingDebt(null);
    setSettleAmount('');
    setSettleNote('');
  };

  const handleDeleteDebt = async (id: string) => {
    if (window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে এই দেনা-পাওনা হিসাবটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this debt record?')) {
      await db.debts.delete(id);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Split Balance Strip */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => setActiveDebtType('RECEIVABLE')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            activeDebtType === 'RECEIVABLE'
              ? 'bg-emerald-500/10 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {t.debts.paboTab}
          </span>
          <div className="mt-1 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatAmount(totalPabo, currencySymbol, lang)}
          </div>
        </div>

        <div
          onClick={() => setActiveDebtType('PAYABLE')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            activeDebtType === 'PAYABLE'
              ? 'bg-rose-500/10 border-rose-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            {t.debts.diboTab}
          </span>
          <div className="mt-1 text-xl font-extrabold text-rose-600 dark:text-rose-400">
            {formatAmount(totalDibo, currencySymbol, lang)}
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
          {activeDebtType === 'RECEIVABLE' ? t.debts.paboTab : t.debts.diboTab} ({filteredDebts.length})
        </h3>
        <button
          onClick={() => setIsAddDebtOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
        >
          <Plus size={15} />
          {t.debts.addNewDebt}
        </button>
      </div>

      {/* Debts List */}
      {filteredDebts.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-8 border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2">
            <HandCoins size={22} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t.debts.noDebts}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDebts.map((debt) => {
            const remaining = debt.totalAmount - debt.settledAmount;
            const progress = Math.min(Math.round((debt.settledAmount / debt.totalAmount) * 100), 100);
            const isSettled = debt.status === 'SETTLED';

            return (
              <div
                key={debt.id}
                className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {debt.personName}
                    </h4>
                    {debt.phoneNumber && (
                      <a
                        href={`tel:${debt.phoneNumber}`}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5"
                      >
                        <Phone size={12} />
                        {debt.phoneNumber}
                      </a>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isSettled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                        : debt.status === 'PARTIAL'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {isSettled
                      ? t.debts.fullySettled
                      : debt.status === 'PARTIAL'
                      ? t.debts.partiallySettled
                      : t.debts.pending}
                  </span>
                </div>

                {/* Amount Details */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">{t.debts.totalAmount}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatAmount(debt.totalAmount, currencySymbol, lang)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">{t.debts.remaining}</span>
                    <span
                      className={`font-extrabold ${
                        isSettled ? 'text-emerald-500 line-through' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatAmount(remaining, currencySymbol, lang)}
                    </span>
                  </div>
                </div>

                {/* Settlement Progress Bar */}
                <div className="mt-2.5 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Due Date & Notes */}
                {(debt.dueDate || debt.notes) && (
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                    {debt.dueDate && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Calendar size={12} />
                        <span>
                          {lang === 'bn' ? 'পরিশোধের তারিখ: ' : 'Due: '}
                          {new Date(debt.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {debt.notes && <p className="italic">"{debt.notes}"</p>}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteDebt(debt.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>

                    <button
                      onClick={() => setMemoDebt(debt)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg transition-colors"
                      title={lang === 'bn' ? 'ক্যাশ মেমো প্রিন্ট' : 'Print Cash Memo'}
                    >
                      <Receipt size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {debt.type === 'RECEIVABLE' && !isSettled && (
                      <button
                        onClick={() => setReminderDebt(debt)}
                        className="px-2.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-all flex items-center gap-1"
                      >
                        <MessageSquare size={13} />
                        {lang === 'bn' ? 'রিমাইন্ডার' : 'SMS'}
                      </button>
                    )}

                    {!isSettled && (
                      <button
                        onClick={() => {
                          setSettlingDebt(debt);
                          setSettleAmount(remaining.toString());
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 size={14} />
                        {t.debts.settle}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Debt Modal */}
      {isAddDebtOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {t.debts.addNewDebt}
              </h3>
              <button onClick={() => setIsAddDebtOpen(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDebt} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t.debts.personName} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.debts.enterPersonName}
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t.debts.totalAmount} ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-base font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t.debts.phoneNumber}
                </label>
                <input
                  type="tel"
                  placeholder={t.debts.enterPhone}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t.debts.dueDate}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t.debts.notes}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDebtOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  {t.transaction.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  {t.transaction.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Modal */}
      {settlingDebt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {t.debts.settle}
                </h3>
                <p className="text-xs text-slate-500">{settlingDebt.personName}</p>
              </div>
              <button onClick={() => setSettlingDebt(null)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSettle} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t.debts.settleAmount} ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-base font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t.transaction.paymentMethod}
                </label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="CASH">{t.paymentMethods.CASH}</option>
                  <option value="BKASH">{t.paymentMethods.BKASH}</option>
                  <option value="NAGAD">{t.paymentMethods.NAGAD}</option>
                  <option value="ROCKET">{t.paymentMethods.ROCKET}</option>
                  <option value="BANK">{t.paymentMethods.BANK}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t.transaction.note}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: নগদ পরিশোধ করা হলো' : 'e.g. Paid in cash'}
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSettlingDebt(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600"
                >
                  {t.transaction.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  {lang === 'bn' ? 'নিশ্চিত করুন' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMS & WhatsApp Debt Reminder Modal */}
      <SmsReminderModal
        isOpen={!!reminderDebt}
        onClose={() => setReminderDebt(null)}
        debt={reminderDebt}
        activeKhata={activeKhata}
        currencySymbol={currencySymbol}
        lang={lang}
      />

      {/* Cash Memo / Receipt Print Modal */}
      <CashMemoModal
        isOpen={!!memoDebt}
        onClose={() => setMemoDebt(null)}
        debt={memoDebt}
        activeKhata={activeKhata}
        currencySymbol={currencySymbol}
        lang={lang}
      />
    </div>
  );
};
