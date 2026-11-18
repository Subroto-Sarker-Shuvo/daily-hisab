import React, { useState, useMemo } from 'react';
import { DebtRecord, Cashbook } from '../../types';
import { AggregatedParty, PartyLedgerModal } from './PartyLedgerModal';
import { formatAmount } from '../../lib/formatters';
import { getWhatsAppUrl } from '../../lib/smsReminder';
import {
  Search,
  Users,
  Phone,
  MessageSquare,
  ChevronRight,
  UserCheck,
  Building2,
  Filter,
  X,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface PartyDirectoryViewProps {
  debts: DebtRecord[];
  activeKhata?: Cashbook;
  currencySymbol: string;
  lang: 'bn' | 'en';
  onSettleDebt: (debt: DebtRecord) => void;
  onSendSms: (debt: DebtRecord) => void;
}

export const PartyDirectoryView: React.FC<PartyDirectoryViewProps> = ({
  debts,
  activeKhata,
  currencySymbol,
  lang,
  onSettleDebt,
  onSendSms,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER'>('ALL');
  const [selectedParty, setSelectedParty] = useState<AggregatedParty | null>(null);

  // Group debts by personName
  const parties: AggregatedParty[] = useMemo(() => {
    const map = new Map<string, AggregatedParty>();

    debts.forEach((debt) => {
      const key = debt.personName.trim().toLowerCase();
      const existing = map.get(key);

      const isReceivable = debt.type === 'RECEIVABLE';
      const receivableAmt = isReceivable ? debt.totalAmount : 0;
      const payableAmt = !isReceivable ? debt.totalAmount : 0;
      const settledAmt = debt.settledAmount;

      if (existing) {
        existing.totalReceivable += receivableAmt;
        existing.totalPayable += payableAmt;
        existing.totalSettled += settledAmt;
        existing.records.push(debt);
        if (debt.phoneNumber && !existing.phone) {
          existing.phone = debt.phoneNumber;
        }
        if (debt.createdAt > existing.lastDate) {
          existing.lastDate = debt.createdAt;
        }
      } else {
        map.set(key, {
          name: debt.personName.trim(),
          phone: debt.phoneNumber,
          role: isReceivable ? 'CUSTOMER' : 'SUPPLIER',
          totalReceivable: receivableAmt,
          totalPayable: payableAmt,
          totalSettled: settledAmt,
          netDue: 0, // will compute below
          records: [debt],
          lastDate: debt.createdAt,
        });
      }
    });

    // Compute netDue and final roles
    const list = Array.from(map.values()).map((p) => {
      const recDue = p.records
        .filter((r) => r.type === 'RECEIVABLE')
        .reduce((sum, r) => sum + (r.totalAmount - r.settledAmount), 0);

      const payDue = p.records
        .filter((r) => r.type === 'PAYABLE')
        .reduce((sum, r) => sum + (r.totalAmount - r.settledAmount), 0);

      p.netDue = recDue - payDue; // Positive = Customer owes us; Negative = We owe supplier

      const hasReceivable = p.records.some((r) => r.type === 'RECEIVABLE');
      const hasPayable = p.records.some((r) => r.type === 'PAYABLE');
      if (hasReceivable && hasPayable) p.role = 'BOTH';
      else if (hasReceivable) p.role = 'CUSTOMER';
      else p.role = 'SUPPLIER';

      return p;
    });

    // Sort by largest outstanding due first, then recent
    return list.sort((a, b) => Math.abs(b.netDue) - Math.abs(a.netDue) || b.lastDate - a.lastDate);
  }, [debts]);

  // Filter parties by search & role
  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      if (roleFilter !== 'ALL' && p.role !== roleFilter && p.role !== 'BOTH') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchPhone = p.phone?.includes(q);
        if (!matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [parties, roleFilter, searchQuery]);

  // Totals for directory
  const totalCustomerDue = parties
    .filter((p) => p.netDue > 0)
    .reduce((sum, p) => sum + p.netDue, 0);

  const totalSupplierDue = parties
    .filter((p) => p.netDue < 0)
    .reduce((sum, p) => sum + Math.abs(p.netDue), 0);

  return (
    <div className="space-y-3.5">
      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              lang === 'bn'
                ? 'কাস্টমার বা মহাজনের নাম/ফোন দিয়ে খুঁজুন...'
                : 'Search party by name or phone...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Role Filter Chips */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
              roleFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            {lang === 'bn' ? 'সব' : 'All'}
          </button>
          <button
            onClick={() => setRoleFilter('CUSTOMER')}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
              roleFilter === 'CUSTOMER'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            {lang === 'bn' ? 'গ্রাহক' : 'Customers'}
          </button>
          <button
            onClick={() => setRoleFilter('SUPPLIER')}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
              roleFilter === 'SUPPLIER'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            {lang === 'bn' ? 'মহাজন' : 'Suppliers'}
          </button>
        </div>
      </div>

      {/* Directory Quick Overview */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">
              {lang === 'bn' ? 'মোট কাস্টমার বাকি (পাবো)' : 'Customer Due (To Receive)'}
            </span>
            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
              {formatAmount(totalCustomerDue, currencySymbol, lang)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft size={16} />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">
              {lang === 'bn' ? 'মোট মহাজন বাকি (দিবো)' : 'Supplier Due (To Pay)'}
            </span>
            <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
              {formatAmount(totalSupplierDue, currencySymbol, lang)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <ArrowUpRight size={16} />
          </div>
        </div>
      </div>

      {/* Parties Cards List */}
      {filteredParties.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2">
            <Users size={22} />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'bn' ? 'কোনো কাস্টমার বা মহাজন পাওয়া যায়নি' : 'No parties found'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
          {filteredParties.map((party) => {
            const isCustomerDue = party.netDue > 0;
            const isSupplierDue = party.netDue < 0;

            return (
              <div
                key={party.name}
                onClick={() => setSelectedParty(party)}
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {party.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {party.name}
                      </p>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                          party.role === 'CUSTOMER'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : party.role === 'SUPPLIER'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        }`}
                      >
                        {party.role === 'CUSTOMER'
                          ? lang === 'bn' ? 'গ্রাহক' : 'Cust'
                          : party.role === 'SUPPLIER'
                          ? lang === 'bn' ? 'মহাজন' : 'Supp'
                          : 'উভয়'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      {party.phone && <span>{party.phone}</span>}
                      <span>•</span>
                      <span>
                        {party.records.length} {lang === 'bn' ? 'টি হিসাব' : 'entries'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Due & Actions */}
                <div className="flex items-center gap-2.5 flex-shrink-0 ml-2">
                  <div className="text-right">
                    <span
                      className={`text-xs font-extrabold block ${
                        isCustomerDue
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isSupplierDue
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {party.netDue === 0
                        ? lang === 'bn' ? 'পরিশোধিত' : 'Settled'
                        : `${isCustomerDue ? '+' : '-'}${formatAmount(Math.abs(party.netDue), currencySymbol, lang)}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isCustomerDue
                        ? lang === 'bn' ? 'পাবো' : 'Owed'
                        : isSupplierDue
                        ? lang === 'bn' ? 'দিতে হবে' : 'Payable'
                        : '০ বাকি'}
                    </span>
                  </div>

                  {/* 1-tap Phone Call */}
                  {party.phone && (
                    <a
                      href={`tel:${party.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                      title="Call"
                    >
                      <Phone size={14} />
                    </a>
                  )}

                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Party Ledger Detail & Statement Modal */}
      <PartyLedgerModal
        party={selectedParty}
        activeKhata={activeKhata}
        currencySymbol={currencySymbol}
        lang={lang}
        isOpen={!!selectedParty}
        onClose={() => setSelectedParty(null)}
        onSettleDebt={onSettleDebt}
        onSendSms={onSendSms}
      />
    </div>
  );
};
