import * as XLSX from 'xlsx';
import { Transaction, DebtRecord, Category } from '../types';

export const exportToExcel = (
  transactions: Transaction[],
  debts: DebtRecord[],
  categoriesMap: Record<string, Category>,
  lang: 'bn' | 'en' = 'bn'
) => {
  // Format transaction rows
  const txRows = transactions.map((t) => {
    const cat = categoriesMap[t.categoryId];
    const catName = lang === 'bn' ? cat?.nameBn || 'অন্যান্য' : cat?.nameEn || 'Other';
    return {
      Date: new Date(t.date).toLocaleDateString(),
      Time: new Date(t.date).toLocaleTimeString(),
      Type: t.type,
      Category: catName,
      Amount: t.amount,
      PaymentMethod: t.paymentMethod,
      Note: t.note || '',
    };
  });

  // Format debt rows
  const debtRows = debts.map((d) => ({
    Person: d.personName,
    Phone: d.phoneNumber || '',
    Type: d.type === 'RECEIVABLE' ? 'Receivable (পাবো)' : 'Payable (দিতে হবে)',
    TotalAmount: d.totalAmount,
    SettledAmount: d.settledAmount,
    RemainingAmount: d.totalAmount - d.settledAmount,
    Status: d.status,
    DueDate: d.dueDate || '',
    Notes: d.notes || '',
  }));

  const wb = XLSX.utils.book_new();
  const txSheet = XLSX.utils.json_to_sheet(txRows);
  const debtSheet = XLSX.utils.json_to_sheet(debtRows);

  XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');
  XLSX.utils.book_append_sheet(wb, debtSheet, 'Debts');

  const filename = `DailyHisab_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
};
