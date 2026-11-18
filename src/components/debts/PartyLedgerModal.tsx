import React, { useRef } from 'react';
import { DebtRecord, Cashbook } from '../../types';
import { formatAmount, formatDate } from '../../lib/formatters';
import { getWhatsAppUrl, getNativeSmsUrl } from '../../lib/smsReminder';
import {
  X,
  Phone,
  MessageSquare,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Store,
} from 'lucide-react';

export interface AggregatedParty {
  name: string;
  phone?: string;
  role: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  totalReceivable: number;
  totalPayable: number;
  totalSettled: number;
  netDue: number;
  records: DebtRecord[];
  lastDate: number;
}

interface PartyLedgerModalProps {
  party: AggregatedParty | null;
  activeKhata?: Cashbook;
  currencySymbol: string;
  lang: 'bn' | 'en';
  isOpen: boolean;
  onClose: () => void;
  onSettleDebt: (debt: DebtRecord) => void;
  onSendSms: (debt: DebtRecord) => void;
}

export const PartyLedgerModal: React.FC<PartyLedgerModalProps> = ({
  party,
  activeKhata,
  currencySymbol,
  lang,
  isOpen,
  onClose,
  onSettleDebt,
  onSendSms,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !party) return null;

  const storeName = activeKhata?.name || (lang === 'bn' ? 'ডেইলি হিসাব খাতা' : 'Daily Hisab');

  const handlePrintStatement = () => {
    window.print();
  };

  // Compile all settlements across all records
  const allSettlements = party.records.flatMap((r) =>
    r.settlements.map((s) => ({
      ...s,
      debtNotes: r.notes,
      debtType: r.type,
      parentRecordId: r.id,
    }))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 font-bold text-base">
              {party.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                  {party.name}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    party.role === 'CUSTOMER'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : party.role === 'SUPPLIER'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                  }`}
                >
                  {party.role === 'CUSTOMER'
                    ? lang === 'bn' ? 'কাস্টমার / গ্রাহক' : 'Customer'
                    : party.role === 'SUPPLIER'
                    ? lang === 'bn' ? 'মহাজন / সাপ্লায়ার' : 'Supplier'
                    : lang === 'bn' ? 'উভয় খাতা' : 'Both'}
                </span>
              </div>
              {party.phone && (
                <p className="text-xs text-slate-400 font-medium">{party.phone}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Contact & Action Buttons */}
        <div className="py-2.5 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 print:hidden flex-wrap">
          {party.phone && (
            <>
              <a
                href={`tel:${party.phone}`}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Phone size={14} />
                {lang === 'bn' ? 'সরাসরি কল' : 'Call'}
              </a>

              <a
                href={getWhatsAppUrl(party.phone, `সালাম, ${storeName} থেকে আপনার খতিয়ান হিসাব পাঠানো হলো।`)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare size={14} />
                {lang === 'bn' ? 'WhatsApp' : 'WhatsApp'}
              </a>
            </>
          )}

          <button
            onClick={handlePrintStatement}
            className="ml-auto px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Printer size={14} />
            {lang === 'bn' ? 'স্টেটমেন্ট প্রিন্ট / PDF' : 'Print Statement'}
          </button>
        </div>

        {/* Printable Statement & Scrollable Content */}
        <div ref={printRef} className="overflow-y-auto py-3 space-y-4 print:p-0">
          {/* Print Only Header Banner */}
          <div className="hidden print:block text-center pb-3 border-b-2 border-slate-800 mb-3">
            <h1 className="font-extrabold text-lg text-black font-sans">{storeName}</h1>
            <p className="text-xs text-slate-600">
              {lang === 'bn' ? 'কাস্টমার / মহাজন হিসাব বিবরণী ও লেজার' : 'Party Ledger Statement'}
            </p>
            <div className="flex justify-between text-[11px] text-slate-500 mt-2">
              <span>{lang === 'bn' ? 'নাম: ' : 'Party: '}{party.name}</span>
              <span>{party.phone && `ফোন: ${party.phone}`}</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Balance Summary Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block mb-0.5">
                {lang === 'bn' ? 'মোট কারবার / বাকি' : 'Total Given / Taken'}
              </span>
              <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                {formatAmount(
                  party.totalReceivable + party.totalPayable,
                  currencySymbol,
                  lang
                )}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mb-0.5">
                {lang === 'bn' ? 'মোট পরিশোধিত / আদায়' : 'Total Settled'}
              </span>
              <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                {formatAmount(party.totalSettled, currencySymbol, lang)}
              </span>
            </div>
          </div>

          {/* Current Outstanding Status */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              party.netDue > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/30 text-rose-700 dark:text-rose-300'
                : party.netDue < 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider block">
                {party.netDue > 0
                  ? lang === 'bn' ? 'বর্তমান নিট বাকি (পাবো)' : 'Net Outstanding (Receivable)'
                  : party.netDue < 0
                  ? lang === 'bn' ? 'বর্তমান দেনা (দিতে হবে)' : 'Net Payable (To Supplier)'
                  : lang === 'bn' ? 'সম্পূর্ণ পরিশোধিত (০ বাকি)' : 'Fully Settled (Nil)'}
              </span>
              <p className="text-base font-extrabold mt-0.5">
                {formatAmount(Math.abs(party.netDue), currencySymbol, lang)}
              </p>
            </div>
            {party.netDue > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white text-[11px] font-bold shadow-xs">
                {lang === 'bn' ? 'বকেয়া' : 'Due'}
              </span>
            )}
          </div>

          {/* Itemized Invoices & Debts List */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
              <span>{lang === 'bn' ? 'বকেয়া এন্ট্রি ও ভাউচার' : 'Invoices & Debt Records'}</span>
              <span className="text-[11px] text-slate-400 font-medium">
                {party.records.length} {lang === 'bn' ? 'টি এন্ট্রি' : 'entries'}
              </span>
            </h4>

            <div className="space-y-2">
              {party.records.map((rec) => {
                const isPaid = rec.status === 'SETTLED';
                const remaining = rec.totalAmount - rec.settledAmount;

                return (
                  <div
                    key={rec.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            rec.type === 'RECEIVABLE' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {rec.notes || (rec.type === 'RECEIVABLE' ? 'পাওনা বাকি' : 'দেনা বাকি')}
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">
                        {formatAmount(rec.totalAmount, currencySymbol, lang)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{formatDate(rec.createdAt, lang)}</span>
                      <div className="flex items-center gap-2">
                        <span>
                          {lang === 'bn' ? 'আদায়: ' : 'Paid: '}
                          <span className="font-bold text-emerald-600">
                            {formatAmount(rec.settledAmount, currencySymbol, lang)}
                          </span>
                        </span>
                        {!isPaid && (
                          <span className="font-bold text-rose-600">
                            ({lang === 'bn' ? 'বাকি: ' : 'Due: '}
                            {formatAmount(remaining, currencySymbol, lang)})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons inside party ledger */}
                    {!isPaid && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end gap-1.5 print:hidden">
                        {rec.type === 'RECEIVABLE' && (
                          <button
                            onClick={() => onSendSms(rec)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-100"
                          >
                            {lang === 'bn' ? 'তাগাদা SMS' : 'SMS Reminder'}
                          </button>
                        )}
                        <button
                          onClick={() => onSettleDebt(rec)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[11px] font-bold hover:scale-[1.02]"
                        >
                          {lang === 'bn' ? 'টাকা আদায় / পরিশোধ' : 'Settle'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settlement / Payment History Timeline */}
          {allSettlements.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                {lang === 'bn' ? 'পরিশোধ ও কিস্তির ইতিহাস' : 'Settlement & Payment Log'}
              </h4>
              <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {allSettlements.map((st) => (
                  <div key={st.id} className="pt-1.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
                        {st.note || (lang === 'bn' ? 'কিস্তি পরিশোধ' : 'Installment')}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(st.date, lang)} • {st.paymentMethod}
                      </span>
                    </div>
                    <span className="font-extrabold text-emerald-600 text-xs">
                      +{formatAmount(st.amount, currencySymbol, lang)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
