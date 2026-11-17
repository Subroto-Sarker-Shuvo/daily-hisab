// Number conversion to Bengali numerals if language is 'bn'
export const toBengaliDigits = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .replace(/[0-9]/g, (digit) => bnDigits[parseInt(digit, 10)]);
};

// Format currency according to current app settings
export const formatAmount = (
  amount: number,
  currencySymbol: string = '৳',
  lang: 'bn' | 'en' = 'bn'
): string => {
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  if (lang === 'bn') {
    return `${currencySymbol} ${toBengaliDigits(formattedNumber)}`;
  }
  return `${currencySymbol} ${formattedNumber}`;
};

// Format date nicely
export const formatDate = (
  dateStr: string,
  lang: 'bn' | 'en' = 'bn'
): string => {
  const date = new Date(dateStr);
  const now = new Date();
  
  // Check if today
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    const label = lang === 'bn' ? 'আজ' : 'Today';
    return `${label}, ${lang === 'bn' ? toBengaliDigits(timeStr) : timeStr}`;
  }

  if (isYesterday) {
    const label = lang === 'bn' ? 'গতকাল' : 'Yesterday';
    return `${label}, ${lang === 'bn' ? toBengaliDigits(timeStr) : timeStr}`;
  }

  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const formatted = date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', options);

  return `${formatted}, ${lang === 'bn' ? toBengaliDigits(timeStr) : timeStr}`;
};

// Format short date for charts and tables
export const formatShortDate = (dateStr: string, lang: 'bn' | 'en' = 'bn'): string => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const formatted = date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', options);
  return formatted;
};
