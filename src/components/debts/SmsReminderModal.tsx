import React, { useState } from 'react';
import { DebtRecord, Cashbook } from '../../types';
import { generateBengaliReminderMessage, getWhatsAppUrl, getNativeSmsUrl } from '../../lib/smsReminder';
import { formatAmount } from '../../lib/formatters';
import { X, MessageSquare, Send, Copy, Check, ExternalLink } from 'lucide-react';

interface SmsReminderModalProps {
  debt: DebtRecord | null;
  activeKhata?: Cashbook;
  currencySymbol: string;
  lang: 'bn' | 'en';
  isOpen: boolean;
  onClose: () => void;
}

export const SmsReminderModal: React.FC<SmsReminderModalProps> = ({
  debt,
  activeKhata,
  currencySymbol,
  lang,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !debt) return null;

  const storeName = activeKhata?.name || (lang === 'bn' ? 'ডেইলি হিসাব' : 'Daily Hisab');
  const remainingDue = debt.totalAmount - debt.settledAmount;

  const defaultMessage = generateBengaliReminderMessage(
    storeName,
    debt.personName,
    remainingDue,
    currencySymbol
  );

  const [message, setMessage] = useState<string>(defaultMessage);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!debt.phoneNumber) {
      alert(lang === 'bn' ? 'মোবাইল নম্বর দেওয়া নেই!' : 'No phone number provided!');
      return;
    }
    const url = getWhatsAppUrl(debt.phoneNumber, message);
    window.open(url, '_blank');
  };

  const handleSendSms = () => {
    if (!debt.phoneNumber) {
      alert(lang === 'bn' ? 'মোবাইল নম্বর দেওয়া নেই!' : 'No phone number provided!');
      return;
    }
    const url = getNativeSmsUrl(debt.phoneNumber, message);
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {lang === 'bn' ? 'বকেয়া আদায়ের রিমাইন্ডার' : 'Payment Reminder'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {debt.personName} {debt.phoneNumber ? `(${debt.phoneNumber})` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Due Summary Card */}
        <div className="mt-3.5 p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
            {lang === 'bn' ? 'অবশিষ্ট বকেয়া পাওনা:' : 'Remaining Due:'}
          </span>
          <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
            {formatAmount(remainingDue, currencySymbol, lang)}
          </span>
        </div>

        {/* Message Editor */}
        <div className="mt-3">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            {lang === 'bn' ? 'এসএমএস / হোয়াটসঅ্যাপ মেসেজ:' : 'Message Text:'}
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none leading-relaxed font-sans"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          {/* WhatsApp Button */}
          <button
            onClick={handleSendWhatsApp}
            disabled={!debt.phoneNumber}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Send size={15} />
            {lang === 'bn' ? 'WhatsApp-এ সরাসরি পাঠান' : 'Send via WhatsApp'}
          </button>

          {/* Native SMS App Button */}
          <button
            onClick={handleSendSms}
            disabled={!debt.phoneNumber}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <MessageSquare size={15} className="text-teal-600" />
            {lang === 'bn' ? 'মোবাইল SMS অ্যাপে পাঠান' : 'Open in Phone SMS App'}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="w-full py-2 px-4 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {copied
              ? lang === 'bn' ? 'মেসেজ কপি হয়েছে!' : 'Copied!'
              : lang === 'bn' ? 'মেসেজ কপি করুন' : 'Copy Message Text'}
          </button>
        </div>
      </div>
    </div>
  );
};
