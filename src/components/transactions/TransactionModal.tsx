import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import { Transaction, TransactionType, PaymentMethod, Category } from '../../types';
import { compressImage } from '../../lib/imageCompressor';
import { CategoryIcon } from '../common/CategoryIcon';
import { X, Trash2, Camera, Calendar, FileText, Check, Plus } from 'lucide-react';
import { toBengaliDigits } from '../../lib/formatters';

interface TransactionModalProps {
  categories: Category[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ categories }) => {
  const {
    isAddModalOpen,
    setIsAddModalOpen,
    editingTransaction,
    setEditingTransaction,
    currencySymbol,
    currentBookId,
    lang,
    t,
  } = useApp();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter categories matching current type
  const filteredCategories = categories.filter((c) => c.type === (type === 'INCOME' ? 'INCOME' : 'EXPENSE'));

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.categoryId);
      setPaymentMethod(editingTransaction.paymentMethod);
      setDate(new Date(editingTransaction.date).toISOString().slice(0, 16));
      setNote(editingTransaction.note || '');
      setReceiptImage(editingTransaction.receiptImage);
    } else {
      setType('EXPENSE');
      setAmount('');
      const defaultCat = categories.find((c) => c.type === 'EXPENSE');
      setCategoryId(defaultCat ? defaultCat.id : '');
      setPaymentMethod('CASH');
      setDate(new Date().toISOString().slice(0, 16));
      setNote('');
      setReceiptImage(undefined);
    }
  }, [editingTransaction, isAddModalOpen, categories]);

  // Adjust category when type changes
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const targetType = newType === 'INCOME' ? 'INCOME' : 'EXPENSE';
    const firstCat = categories.find((c) => c.type === targetType);
    if (firstCat) setCategoryId(firstCat.id);
  };

  const handleQuickAddAmount = (addVal: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addVal).toString());
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.7);
      setReceiptImage(compressed);
    } catch (err) {
      console.error('Failed to compress image:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে সঠিক টাকার পরিমাণ দিন।' : 'Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = Date.now();
      const txData: Transaction = {
        id: editingTransaction ? editingTransaction.id : crypto.randomUUID(),
        bookId: editingTransaction?.bookId || (currentBookId !== 'all' ? currentBookId : 'default_personal'),
        type,
        amount: numAmount,
        categoryId: categoryId || 'cat_expense_other',
        paymentMethod,
        date: new Date(date).toISOString(),
        note: note.trim() || undefined,
        receiptImage,
        createdAt: editingTransaction ? editingTransaction.createdAt : now,
        updatedAt: now,
      };

      if (editingTransaction) {
        await db.transactions.put(txData);
      } else {
        await db.transactions.add(txData);
      }

      setIsAddModalOpen(false);
      setEditingTransaction(null);
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert(t.common.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTransaction) return;
    if (window.confirm(t.transaction.confirmDelete)) {
      await db.transactions.delete(editingTransaction.id);
      setIsAddModalOpen(false);
      setEditingTransaction(null);
    }
  };

  if (!isAddModalOpen) return null;

  const paymentOptions: PaymentMethod[] = ['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {editingTransaction ? t.transaction.editTitle : t.transaction.addTitle}
          </h2>
          <button
            onClick={() => {
              setIsAddModalOpen(false);
              setEditingTransaction(null);
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Transaction Type Segmented Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('EXPENSE')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.transaction.expense}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('INCOME')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.transaction.income}
            </button>
          </div>

          {/* Amount Input with Currency Symbol */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {t.transaction.amount} ({currencySymbol})
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xl font-bold text-slate-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-2xl font-extrabold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Quick Amount Presets (+50, +100, +500, +1000) */}
            <div className="flex items-center gap-1.5 mt-2">
              {[50, 100, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleQuickAddAmount(preset)}
                  className="flex-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  +{lang === 'bn' ? toBengaliDigits(preset) : preset}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {t.transaction.category}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
              {filteredCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                const catName = lang === 'bn' ? cat.nameBn : cat.nameEn;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <CategoryIcon iconName={cat.icon} color={cat.color} size={18} />
                    <span className="text-[10px] mt-1 line-clamp-1 leading-tight">{catName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {t.transaction.paymentMethod}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {paymentOptions.map((pm) => {
                const isSelected = paymentMethod === pm;
                return (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {t.paymentMethods[pm]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date and Time Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} />
              {t.transaction.date}
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FileText size={14} />
              {t.transaction.note}
            </label>
            <input
              type="text"
              placeholder={t.transaction.notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Receipt Image Upload & Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Camera size={14} />
              {t.transaction.receipt}
            </label>
            {receiptImage ? (
              <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                <img src={receiptImage} alt="Receipt preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setReceiptImage(undefined)}
                  className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full shadow hover:bg-rose-700"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 w-fit">
                <Camera size={16} />
                <span>{t.transaction.uploadReceipt}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Actions Bottom Bar */}
          <div className="pt-2 flex items-center gap-2">
            {editingTransaction && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                title={t.transaction.delete}
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {t.transaction.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
