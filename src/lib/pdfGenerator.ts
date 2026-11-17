import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Category } from '../types';

export const exportToPdf = (
  transactions: Transaction[],
  categoriesMap: Record<string, Category>,
  totalIncome: number,
  totalExpense: number,
  currencySymbol: string = 'BDT',
  lang: 'bn' | 'en' = 'en'
) => {
  const doc = new jsPDF();
  const netSavings = totalIncome - totalExpense;

  // Title & Header
  doc.setFontSize(20);
  doc.setTextColor(5, 150, 105); // Emerald Green
  doc.text('Daily Hisab - Financial Statement', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

  // Summary Box
  doc.setDrawColor(220, 225, 230);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 34, 182, 28, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(`Total Income: ${currencySymbol} ${totalIncome.toLocaleString()}`, 20, 44);
  doc.text(`Total Expense: ${currencySymbol} ${totalExpense.toLocaleString()}`, 20, 54);

  doc.setFont('helvetica', 'bold');
  if (netSavings >= 0) {
    doc.setTextColor(5, 150, 105);
  } else {
    doc.setTextColor(225, 29, 72);
  }
  doc.text(`Net Balance: ${currencySymbol} ${netSavings.toLocaleString()}`, 110, 49);
  doc.setFont('helvetica', 'normal');

  // Transactions Table
  const tableData = transactions.map((t) => {
    const cat = categoriesMap[t.categoryId];
    const catName = cat?.nameEn || 'Other';
    const dateFormatted = new Date(t.date).toLocaleDateString();
    return [
      dateFormatted,
      t.type,
      catName,
      t.paymentMethod,
      t.note || '-',
      `${t.type === 'INCOME' ? '+' : '-'} ${t.amount.toLocaleString()}`,
    ];
  });

  autoTable(doc, {
    startY: 68,
    head: [['Date', 'Type', 'Category', 'Method', 'Note', `Amount (${currencySymbol})`]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(`DailyHisab_Statement_${new Date().toISOString().slice(0, 10)}.pdf`);
};
