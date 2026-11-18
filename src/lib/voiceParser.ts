import { TransactionType, PaymentMethod, Category } from '../types';

export interface ParsedVoiceResult {
  type: TransactionType;
  amount: number;
  categoryId: string;
  paymentMethod: PaymentMethod;
  note: string;
  rawText: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

// Convert Bengali numeric digits to standard ASCII digits
export const bengaliToAsciiDigits = (str: string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[০-৯]/g, (match) => bnDigits.indexOf(match).toString());
};

// Common Bengali number words parser
const parseSpokenBengaliAmount = (text: string): number | null => {
  const clean = text.toLowerCase();

  // Check composite phrases first
  if (clean.includes('দেড় হাজার') || clean.includes('দেড়হাজার')) return 1500;
  if (clean.includes('আড়াই হাজার') || clean.includes('আড়াইহাজার')) return 2500;
  if (clean.includes('সাড়ে তিন হাজার')) return 3500;
  if (clean.includes('সাড়ে চার হাজার')) return 4500;
  if (clean.includes('দেড়শ') || clean.includes('দেড় শত') || clean.includes('দেড়শো')) return 150;
  if (clean.includes('আড়াইশ') || clean.includes('আড়াই শত') || clean.includes('আড়াইশো')) return 250;

  // Spoken number words map
  const baseWords: Record<string, number> = {
    'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5,
    'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'দশ': 10,
    'এগার': 11, 'বার': 12, 'তের': 13, 'চৌদ্দ': 14, 'পনের': 15,
    'ষোল': 16, 'সতের': 17, 'আঠার': 18, 'উনিশ': 19, 'বিশ': 20,
    'ত্রিশ': 30, 'চল্লিশ': 40, 'পঞ্চাশ': 50, 'ষাট': 60,
    'সত্তর': 70, 'আশি': 80, 'নব্বই': 90,
  };

  // Check pattern: [word/number] হাজার (e.g. "পাঁচ হাজার", "10 হাজার", "২০ হাজার")
  const hazarMatch = clean.match(/([০-৯0-9]+|[^\s]+)\s*(?:হাজার|hazar|k)/);
  if (hazarMatch) {
    const prefix = hazarMatch[1];
    const num = baseWords[prefix] || parseFloat(bengaliToAsciiDigits(prefix));
    if (!isNaN(num) && num > 0) {
      return num * 1000;
    }
  }

  // Check pattern: [word/number] শত / শ (e.g. "পাঁচশ", "দুই শত", "৮০০")
  const shoMatch = clean.match(/([০-৯0-9]+|[^\s]+)\s*(?:শত|শ|শো)/);
  if (shoMatch) {
    const prefix = shoMatch[1];
    const num = baseWords[prefix] || parseFloat(bengaliToAsciiDigits(prefix));
    if (!isNaN(num) && num > 0) {
      return num * 100;
    }
  }

  // Check pattern: [word/number] লাখ (e.g. "এক লাখ", "২ লাখ")
  const lakhMatch = clean.match(/([০-৯0-9]+|[^\s]+)\s*(?:লাখ|লক্ষ|lakh)/);
  if (lakhMatch) {
    const prefix = lakhMatch[1];
    const num = baseWords[prefix] || parseFloat(bengaliToAsciiDigits(prefix));
    if (!isNaN(num) && num > 0) {
      return num * 100000;
    }
  }

  return null;
};

// Extract numerical amount from speech
export const extractAmount = (text: string): number => {
  // 1. Try spoken number parser
  const spokenAmount = parseSpokenBengaliAmount(text);
  if (spokenAmount && spokenAmount > 0) return spokenAmount;

  // 2. Normalize Bengali digits to ASCII
  const ascii = bengaliToAsciiDigits(text);

  // 3. Match explicit number patterns (e.g. 500 টাকা, ৳ 1200, 250.50)
  // Look for number preceded or followed by currency terms or freestanding
  const match = ascii.match(/(?:৳|tk|bdt)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)\s*(?:টাকা|tk|bdt)?/i);
  if (match && match[1]) {
    const cleanNum = match[1].replace(/,/g, '');
    const val = parseFloat(cleanNum);
    if (!isNaN(val) && val > 0) return val;
  }

  // Freestanding digit sequence
  const anyDigits = ascii.match(/\b([0-9]{1,9}(?:\.[0-9]{1,2})?)\b/);
  if (anyDigits && anyDigits[1]) {
    const val = parseFloat(anyDigits[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  return 0;
};

// Keyword dictionary for categorizing
const CATEGORY_RULES: { catId: string; type: TransactionType; keywords: string[] }[] = [
  // Income
  {
    catId: 'cat_business',
    type: 'INCOME',
    keywords: ['বিক্রি', 'বেচা', 'ক্যাশ সেল', 'দোকানের বিক্রি', 'ব্যবসা', 'সেলস', 'লাভ', 'profit', 'sale', 'sales'],
  },
  {
    catId: 'cat_salary',
    type: 'INCOME',
    keywords: ['বেতন', 'স্যালারি', 'মাসিক বেতন', 'salary', 'honorarium', 'ভাতা'],
  },
  {
    catId: 'cat_freelance',
    type: 'INCOME',
    keywords: ['ফ্রিল্যান্সিং', 'প্রজেক্ট', 'ক্লায়েন্ট', 'আপওয়ার্ক', 'ফাইভার', 'freelance'],
  },
  {
    catId: 'cat_gift',
    type: 'INCOME',
    keywords: ['উপহার', 'বোনাস', 'বকশিশ', 'টিপস', 'gift', 'bonus'],
  },

  // Expense
  {
    catId: 'cat_grocery',
    type: 'EXPENSE',
    keywords: ['বাজার', 'মুদি', 'চাল', 'ডাল', 'তেল', 'মাছ', 'মাংস', 'সবজি', 'তরকারি', 'কাঁচাবাজার', 'ফল', 'grocery', 'bazaar'],
  },
  {
    catId: 'cat_food',
    type: 'EXPENSE',
    keywords: ['খাবার', 'হোটেল', 'রেস্টুরেন্ট', 'নাস্তা', 'চা', 'কফি', 'বিরিয়ানি', 'বার্গার', 'লাঞ্চ', 'ডিনার', 'food', 'restaurant', 'snack'],
  },
  {
    catId: 'cat_transport',
    type: 'EXPENSE',
    keywords: ['ভাড়া', 'রিকশা', 'বাস', 'সিএনজি', 'উবার', 'পাঠাও', 'তেল', 'পেট্রোল', 'অকটেন', 'গ্যাস', 'ট্রেন', 'টিকেট', 'transport', 'rickshaw', 'uber'],
  },
  {
    catId: 'cat_utilities',
    type: 'EXPENSE',
    keywords: ['বিল', 'বিদ্যুৎ বিল', 'কারেন্ট বিল', 'কারেন্ট', 'গ্যাস বিল', 'পানি বিল', 'ওয়াইফাই', 'ইন্টারনেট', 'রিচার্জ', 'ফ্লেক্সিলোড', 'utilities', 'bill', 'wifi', 'recharge'],
  },
  {
    catId: 'cat_rent',
    type: 'EXPENSE',
    keywords: ['বাসা ভাড়া', 'দোকান ভাড়া', 'অফিস ভাড়া', 'ভাড়া পরিশোধ', 'rent'],
  },
  {
    catId: 'cat_medical',
    type: 'EXPENSE',
    keywords: ['ওষুধ', 'ঔষধ', 'মেডিসিন', 'ডাক্তার', 'চিকিৎসা', 'হাসপাতাল', 'টেস্ট', 'প্রেসক্রিপশন', 'medical', 'medicine', 'doctor', 'hospital'],
  },
  {
    catId: 'cat_shopping',
    type: 'EXPENSE',
    keywords: ['কেনাকাটা', 'শপিং', 'জামাকাপড়', 'কাপড়', 'শার্ট', 'প্যান্ট', 'জুতা', 'ঘড়ি', 'shopping', 'clothes'],
  },
  {
    catId: 'cat_education',
    type: 'EXPENSE',
    keywords: ['পড়াশোনা', 'বই', 'খাতা', 'স্কুল', 'কলেজ', 'টিউশন', 'ভর্তি ফি', 'education', 'books', 'school', 'college', 'tuition'],
  },
  {
    catId: 'cat_entertainment',
    type: 'EXPENSE',
    keywords: ['বিনোদন', 'সিনেমা', 'মুভি', 'ঘোরাঘুরি', 'ট্যুর', 'পার্ক', 'entertainment', 'movie', 'tour'],
  },
];

export const parseVoiceTransaction = (
  text: string,
  categories: Category[]
): ParsedVoiceResult => {
  const lower = text.toLowerCase().trim();
  const amount = extractAmount(lower);

  // 1. Determine Type
  const incomeKeywords = [
    'আয়', 'ইনকাম', 'বিক্রি', 'বেচা', 'পেলাম', 'পেলুম', 'আসলো', 'জমা', 'বোনাস', 'বেতন', 'লাভ', 'profit', 'income', 'sale', 'sales', 'salary', 'received'
  ];
  const expenseKeywords = [
    'খরচ', 'ব্যয়', 'কিনলাম', 'দিলাম', 'দিছি', 'কাটা', 'বিল', 'ভাড়া', 'পেমেন্ট', 'দিয়াছি', 'খাইলাম', 'expense', 'spent', 'cost', 'buy', 'paid'
  ];

  let detectedType: TransactionType = 'EXPENSE';
  let matchedRuleCatId = '';

  // Check matching category rules first
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      detectedType = rule.type;
      matchedRuleCatId = rule.catId;
      break;
    }
  }

  // Override if explicit income/expense keywords are strong
  if (incomeKeywords.some((w) => lower.includes(w))) {
    detectedType = 'INCOME';
  } else if (expenseKeywords.some((w) => lower.includes(w))) {
    detectedType = 'EXPENSE';
  }

  // 2. Select Category
  let categoryId = '';
  if (matchedRuleCatId) {
    const exists = categories.find((c) => c.id === matchedRuleCatId);
    if (exists) categoryId = exists.id;
  }

  if (!categoryId) {
    // Default fallback category for the detected type
    const defaultCat = categories.find(
      (c) => c.type === detectedType && (c.id === (detectedType === 'INCOME' ? 'cat_income_other' : 'cat_grocery') || c.id.includes('other'))
    ) || categories.find((c) => c.type === detectedType);
    categoryId = defaultCat ? defaultCat.id : 'cat_expense_other';
  }

  // 3. Detect Payment Method
  let paymentMethod: PaymentMethod = 'CASH';
  if (lower.includes('বিকাশ') || lower.includes('bkash')) {
    paymentMethod = 'BKASH';
  } else if (lower.includes('নগদ অ্যাপ') || lower.includes('নগদে') || lower.includes('nagad')) {
    paymentMethod = 'NAGAD';
  } else if (lower.includes('রকেট') || lower.includes('rocket')) {
    paymentMethod = 'ROCKET';
  } else if (lower.includes('ব্যাংক') || lower.includes('bank') || lower.includes('কার্ড') || lower.includes('card')) {
    paymentMethod = 'BANK';
  }

  // 4. Construct clean note from speech
  // Remove amounts, currency words, and generic filler
  let cleanNote = text
    .replace(/[০-৯0-9,.]+/g, '')
    .replace(/(?:টাকা|টাকার|৳|tk|bdt)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanNote || cleanNote.length < 2) {
    const cat = categories.find((c) => c.id === categoryId);
    cleanNote = cat?.nameBn || (detectedType === 'INCOME' ? 'আয়' : 'খরচ');
  }

  const confidence = amount > 0 && matchedRuleCatId ? 'HIGH' : amount > 0 ? 'MEDIUM' : 'LOW';

  return {
    type: detectedType,
    amount,
    categoryId,
    paymentMethod,
    note: cleanNote,
    rawText: text,
    confidence,
  };
};
