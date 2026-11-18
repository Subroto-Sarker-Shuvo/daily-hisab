import React, { useRef } from 'react';
import { Transaction, DebtRecord, Cashbook, Category } from '../../types';
import { formatAmount, formatDate } from '../../lib/formatters';
import { X, Printer, Receipt, CheckCircle } from 'lucide-react';

interface CashMemoModalProps {
  transaction?: Transaction | null;
  debt?: DebtRecord | null;
  activeKhata?: Cashbook;
  category?: Category;
  currencySymbol: string;
  lang: 'bn' | 'en';
  isOpen: boolean;
  onClose: () => void;
}

export const CashMemoModal: React.FC<CashMemoModalProps> = ({
  transaction,
  debt,
  activeKhata,
  category,
  currencySymbol,
  lang,
  isOpen,
  onClose,
}) => {
  if (!isOpen || (!transaction && !debt)) return null;

  const memoRef = useRef<HTMLDivElement>(null);

  const storeName = activeKhata?.name || (lang === 'bn' ? 'ডেইলি হিসাব খাতা' : 'Daily Hisab');
  const dateStr = transaction ? transaction.date : debt?.dueDate || new Date().toISOString();
  const memoNo = `MEMO-${(transaction ? transaction.createdAt : debt?.createdAt || Date.now()).toString().slice(-6)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt size={18} />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {lang === 'bn' ? 'ক্যাশ মেমো / ভাউচার' : 'Cash Memo Slip'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Printable Memo Slip Body */}
        <div
          ref={memoRef}
          className="overflow-y-auto py-4 px-2 font-mono text-xs text-slate-800 dark:text-slate-200 select-all print:p-0 print:text-black print:dark:text-black print:m-0"
        >
          {/* Slip Container with classic thermal receipt border */}
          <div className="border border-dashed border-slate-300 dark:border-slate-700 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 print:border-none print:bg-transparent">
            {/* Store Title */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
              <h2 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 font-sans">
                {storeName}
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                {lang === 'bn' ? 'ক্যাশ মেমো / রশিদ' : 'CASH MEMO / RECEIPT'}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                <span>{memoNo}</span>
                <span>{formatDate(dateStr, lang)}</span>
              </div>
            </div>

            {/* Customer Details if Debt */}
            {debt && (
              <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">{lang === 'bn' ? 'গ্রাহক:' : 'Customer:'}</span>
                  <span className="font-bold">{debt.personName}</span>
                </div>
                {debt.phoneNumber && (
                  <div className="flex justify-between mt-0.5">
                    <span className="text-slate-400">{lang === 'bn' ? 'ফোন:' : 'Phone:'}</span>
                    <span>{debt.phoneNumber}</span>
                  </div>
                )}
              </div>
            )}

            {/* Transaction / Line Item */}
            <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span>{lang === 'bn' ? 'বিবরণ' : 'Description'}</span>
                <span>{lang === 'bn' ? 'পরিমাণ' : 'Amount'}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                <span className="truncate max-w-[170px]">
                  {transaction
                    ? transaction.note || (lang === 'bn' ? category?.nameBn : category?.nameEn) || 'General'
                    : debt?.notes || (lang === 'bn' ? 'বকেয়া হিসাব' : 'Debt Entry')}
                </span>
                <span className="font-bold">
                  {formatAmount(
                    transaction ? transaction.amount : debt?.totalAmount || 0,
                    currencySymbol,
                    lang
                  )}
                </span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-xs">
              {transaction && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Method:'}</span>
                  <span className="font-semibold uppercase">{transaction.paymentMethod}</span>
                </div>
              )}

              {debt && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === 'bn' ? 'পরিশোধিত:' : 'Paid:'}</span>
                    <span className="font-semibold text-emerald-600">
                      {formatAmount(debt.settledAmount, currencySymbol, lang)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-600">
                    <span>{lang === 'bn' ? 'অবশিষ্ট বকেয়া:' : 'Due Balance:'}</span>
                    <span>
                      {formatAmount(debt.totalAmount - debt.settledAmount, currencySymbol, lang)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>{lang === 'bn' ? 'মোট টাকা:' : 'TOTAL:'}</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatAmount(
                    transaction ? transaction.amount : debt?.totalAmount || 0,
                    currencySymbol,
                    lang
                  )}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600 dark:text-slate-300 font-sans">
                {lang === 'bn' ? 'ধন্যবাদ, আবার আসবেন!' : 'Thank you, visit again!'}
              </p>
              <p>{lang === 'bn' ? 'কম্পিউটারাইজড ডিজিটাল রসিদ' : 'Computer Generated Receipt'}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 print:hidden">
          <button
            onClick={handlePrint}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow hover:scale-[1.01] active:scale-98 transition-all"
          >
            <Printer size={15} />
            {lang === 'bn' ? 'মেমো প্রিন্ট করুন (POS / Paper)' : 'Print Memo / POS Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
};
