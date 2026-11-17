// SHA-256 PIN hashing with salt using browser Web Crypto API
export const hashPin = async (pin: string): Promise<string> => {
  const salt = 'daily_hisab_salt_2026';
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPin = async (enteredPin: string, storedHash: string): Promise<boolean> => {
  const computedHash = await hashPin(enteredPin);
  return computedHash === storedHash;
};
