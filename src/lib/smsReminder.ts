import { toBengaliDigits } from './formatters';

export interface SmsGatewayConfig {
  provider: 'GREENWEB' | 'ONNOROKOM' | 'BULKSMSBD' | 'CUSTOM';
  apiKey?: string;
  senderId?: string;
  endpointUrl?: string;
}

// Generate a formal, friendly Bengali payment reminder message
export const generateBengaliReminderMessage = (
  storeName: string,
  personName: string,
  dueAmount: number,
  currencySymbol: string = '৳'
): string => {
  const formattedAmount = `${currencySymbol} ${toBengaliDigits(dueAmount.toLocaleString())}`;
  return `সম্মানিত ${personName}, '${storeName}'-এ আপনার বকেয়া পাওনা ${formattedAmount}। অনুগ্রহ করে বকেয়া টাকা পরিশোধের জন্য বিনীত অনুরোধ করা হলো। ধন্যবাদ।`;
};

// Clean and normalize phone number for BD WhatsApp & SMS
export const normalizeBdPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+880')) return cleaned.replace('+', '');
  if (cleaned.startsWith('880')) return cleaned;
  if (cleaned.startsWith('01')) return `88${cleaned}`;
  return cleaned;
};

// Generate WhatsApp deep-link
export const getWhatsAppUrl = (phone: string, message: string): string => {
  const normalized = normalizeBdPhoneNumber(phone);
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encodedMsg}`;
};

// Generate native SMS URL (works on iOS and Android)
export const getNativeSmsUrl = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const encodedMsg = encodeURIComponent(message);
  // Universal SMS link
  return `sms:${cleanPhone}?body=${encodedMsg}`;
};
