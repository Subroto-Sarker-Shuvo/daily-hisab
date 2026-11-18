import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import { Category, TransactionType } from '../../types';
import { CategoryIcon } from './CategoryIcon';
import {
  X,
  Plus,
  Sparkles,
  Check,
  Tag,
} from 'lucide-react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  onSuccess?: (newCategory: Category) => void;
}

const AVAILABLE_ICONS = [
  'ShoppingBag',
  'Utensils',
  'Home',
  'Zap',
  'Bus',
  'Car',
  'Fuel',
  'HeartPulse',
  'Shirt',
  'Coffee',
  'Smartphone',
  'Package',
  'PiggyBank',
  'CreditCard',
  'GraduationCap',
  'Briefcase',
  'Wallet',
  'Laptop',
  'TrendingUp',
  'Gift',
  'Coins',
  'Tag',
  'Sparkles',
  'Wrench',
  'Truck',
  'BookOpen',
  'Film',
  'MoreHorizontal',
];

const AVAILABLE_COLORS = [
  '#10B981', // Emerald
  '#EF4444', // Red
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#84CC16', // Lime
  '#64748B', // Slate
];

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'EXPENSE',
  onSuccess,
}) => {
  const { lang, triggerSync } = useApp();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [nameBn, setNameBn] = useState<string>('');
  const [nameEn, setNameEn] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string>('Tag');
  const [selectedColor, setSelectedColor] = useState<string>('#10B981');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn.trim()) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে ক্যাটাগরির নাম দিন।' : 'Please enter category name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newCat: Category = {
        id: `cat_custom_${Date.now()}`,
        nameBn: nameBn.trim(),
        nameEn: nameEn.trim() || nameBn.trim(),
        type: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
        icon: selectedIcon,
        color: selectedColor,
        isCustom: true,
      };

      await db.categories.add(newCat);
      await triggerSync();

      // Reset
      setNameBn('');
      setNameEn('');
      onSuccess?.(newCat);
      onClose();
    } catch (err) {
      console.error('Failed to add category:', err);
      alert(lang === 'bn' ? 'ক্যাটাগরি যুক্ত করতে সমস্যা হয়েছে।' : 'Failed to add category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: selectedColor }}
            >
              <Tag size={16} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              {lang === 'bn' ? 'নতুন ক্যাটাগরি তৈরি' : 'Add New Category'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Toggle: Expense vs Income */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {lang === 'bn' ? 'ক্যাটাগরির ধরন' : 'Category Type'}
            </label>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {lang === 'bn' ? 'ব্যয় (Expense)' : 'Expense'}
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  type === 'INCOME'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {lang === 'bn' ? 'আয় (Income)' : 'Income'}
              </button>
            </div>
          </div>

          {/* Bengali Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {lang === 'bn' ? 'ক্যাটাগরির নাম (বাংলায়)' : 'Category Name (Bengali)'} *
            </label>
            <input
              type="text"
              required
              placeholder={lang === 'bn' ? 'যেমন: মোবাইল রিচার্জ বা দোকান খরচ' : 'e.g. Mobile Recharge'}
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* English Name (Optional) */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {lang === 'bn' ? 'নাম (ইংরেজি - ঐচ্ছিক)' : 'Name (English - Optional)'}
            </label>
            <input
              type="text"
              placeholder={lang === 'bn' ? 'যেমন: Mobile Recharge' : 'e.g. Mobile Bill'}
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Color Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
              {lang === 'bn' ? 'রং নির্বাচন করুন' : 'Select Color'}
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {AVAILABLE_COLORS.map((c) => {
                const isSelected = selectedColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-xs"
                    style={{ backgroundColor: c }}
                  >
                    {isSelected && <Check size={14} className="text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Selector Grid */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
              {lang === 'bn' ? 'আইকন নির্বাচন করুন' : 'Select Icon'}
            </label>
            <div className="grid grid-cols-7 gap-1.5 max-h-32 overflow-y-auto p-1 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
              {AVAILABLE_ICONS.map((icon) => {
                const isSelected = selectedIcon === icon;
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm scale-105'
                        : 'text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                    }`}
                  >
                    <CategoryIcon iconName={icon} color={isSelected ? selectedColor : undefined} size={16} className="!p-0 !bg-transparent" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {lang === 'bn' ? 'প্রিভিউ' : 'Live Preview'}
            </span>
            <div className="flex items-center gap-2">
              <CategoryIcon iconName={selectedIcon} color={selectedColor} size={18} />
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                {nameBn || (lang === 'bn' ? 'ক্যাটাগরির নাম' : 'Category Name')}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus size={15} />
              {isSubmitting
                ? lang === 'bn' ? 'যুক্ত হচ্ছে...' : 'Adding...'
                : lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
