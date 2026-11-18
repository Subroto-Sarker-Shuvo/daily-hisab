import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Cashbook, CashbookType } from '../../types';
import {
  BookOpen,
  Plus,
  X,
  Check,
  Store,
  User,
  Users,
  Briefcase,
  Trash2,
  Layers,
} from 'lucide-react';

interface KhataSelectorModalProps {
  cashbooks: Cashbook[];
  isOpen: boolean;
  onClose: () => void;
}

export const KhataSelectorModal: React.FC<KhataSelectorModalProps> = ({
  cashbooks,
  isOpen,
  onClose,
}) => {
  const { lang, currentBookId, setCurrentBookId, addCashbook, deleteCashbook } = useApp();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CashbookType>('BUSINESS');
  const [color, setColor] = useState('#10B981');

  if (!isOpen) return null;

  const colorOptions = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6'];

  const handleSelectBook = async (id: string) => {
    await setCurrentBookId(id);
    onClose();
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addCashbook(name.trim(), type, type === 'BUSINESS' ? 'Store' : 'Book', color);
    setName('');
    setIsCreating(false);
    onClose();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (
      window.confirm(
        lang === 'bn'
          ? 'এই খাতাটি মুছে ফেলতে চান? এর সমস্ত লেনদেন প্রধান ব্যক্তিগত খাতায় যুক্ত হবে।'
          : 'Delete this cashbook? Its transactions will be moved to the default personal book.'
      )
    ) {
      await deleteCashbook(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              {isCreating
                ? lang === 'bn' ? 'নতুন খাতা খুলুন' : 'New Cashbook'
                : lang === 'bn' ? 'হিসাব খাতা নির্বাচন করুন' : 'Select Cashbook'}
            </h3>
          </div>
          <button
            onClick={() => {
              setIsCreating(false);
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {!isCreating ? (
          <div className="overflow-y-auto py-3 space-y-2 flex-1">
            {/* View All Option */}
            <div
              onClick={() => handleSelectBook('all')}
              className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                currentBookId === 'all'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold">
                    {lang === 'bn' ? 'সব খাতার হিসাব একসাথে' : 'All Khatas Combined'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'একসাথে সামগ্রিক ব্যালেন্স দেখুন' : 'Overview of all cashbooks'}
                  </p>
                </div>
              </div>
              {currentBookId === 'all' && (
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Individual Khatas */}
            {cashbooks.map((book) => {
              const isSelected = currentBookId === book.id;
              const IconComp =
                book.type === 'BUSINESS'
                  ? Store
                  : book.type === 'FAMILY'
                  ? Users
                  : book.type === 'PERSONAL'
                  ? User
                  : Briefcase;

              return (
                <div
                  key={book.id}
                  onClick={() => handleSelectBook(book.id)}
                  className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all group ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${book.color || '#10B981'}20`, color: book.color || '#10B981' }}
                    >
                      <IconComp size={18} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {book.name}
                        </h4>
                        {book.isDefault && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                            {lang === 'bn' ? 'মূল' : 'Default'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize block mt-0.5">
                        {book.type === 'BUSINESS'
                          ? lang === 'bn' ? 'দোকান / ব্যবসা' : 'Business'
                          : book.type === 'FAMILY'
                          ? lang === 'bn' ? 'পরিবার / মেস' : 'Family'
                          : lang === 'bn' ? 'ব্যক্তিগত' : 'Personal'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!book.isDefault && (
                      <button
                        onClick={(e) => handleDelete(e, book.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Khata"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add New Khata Button */}
            <div className="pt-2">
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus size={16} />
                {lang === 'bn' ? '+ নতুন খাতা খুলুন' : '+ Create New Khata'}
              </button>
            </div>
          </div>
        ) : (
          /* Create Khata Form */
          <form onSubmit={handleCreateBook} className="py-4 space-y-3.5 flex-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {lang === 'bn' ? 'খাতার নাম (দোকান বা বিষয়ের নাম)' : 'Khata Name'} *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder={lang === 'bn' ? 'যেমন: মেসার্স রহিম স্টোর, মেস বাজার...' : 'e.g., Grocery Shop, Family Expenses'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {lang === 'bn' ? 'খাতার ধরন (Type)' : 'Khata Type'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'BUSINESS', label: lang === 'bn' ? 'ব্যবসা' : 'Business' },
                  { id: 'PERSONAL', label: lang === 'bn' ? 'ব্যক্তিগত' : 'Personal' },
                  { id: 'FAMILY', label: lang === 'bn' ? 'মেস/পরিবার' : 'Family' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as CashbookType)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                      type === item.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {lang === 'bn' ? 'রং নির্বাচন (Color Tag)' : 'Color Tag'}
              </label>
              <div className="flex items-center gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      color === c ? 'scale-125 border-slate-800 dark:border-white shadow-sm' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                {lang === 'bn' ? 'খাতা খুলুন' : 'Create Khata'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
