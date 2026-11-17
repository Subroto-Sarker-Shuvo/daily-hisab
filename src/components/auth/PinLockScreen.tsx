import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import { verifyPin } from '../../lib/crypto';
import { Lock, Delete, ShieldCheck } from 'lucide-react';
import { toBengaliDigits } from '../../lib/formatters';

export const PinLockScreen: React.FC = () => {
  const { setIsPinLocked, lang, t } = useApp();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const handleKeyPress = async (num: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + num;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      // Validate
      try {
        const settings = (await (db.settings as any).get('user_preferences')) as any;
        if (settings?.pinHash) {
          const isValid = await verifyPin(newPin, settings.pinHash);
          if (isValid) {
            setIsPinLocked(false);
          } else {
            setError(true);
            setTimeout(() => setPin(''), 500);
          }
        }
      } catch (err) {
        console.error('PIN verification error:', err);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col items-center justify-between py-12 px-6 select-none">
      {/* Top Branding & Lock Icon */}
      <div className="flex flex-col items-center mt-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">{t.appName}</h2>
        <p className="text-xs text-slate-400 mt-1">{t.pin.enterTitle}</p>
      </div>

      {/* 4 Dots Indicator */}
      <div className="my-8">
        <div className={`flex items-center gap-4 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? error
                      ? 'bg-rose-500 scale-125'
                      : 'bg-emerald-500 scale-110'
                    : 'bg-slate-700'
                }`}
              />
            );
          })}
        </div>
        {error && (
          <p className="text-center text-xs text-rose-400 font-semibold mt-3">
            {t.pin.wrongPin}
          </p>
        )}
      </div>

      {/* Numeric Keypad Grid */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-4 mb-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleKeyPress(digit)}
            className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-600 text-xl font-bold transition-all flex items-center justify-center shadow"
          >
            {lang === 'bn' ? toBengaliDigits(digit) : digit}
          </button>
        ))}

        <div />
        <button
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-600 text-xl font-bold transition-all flex items-center justify-center shadow"
        >
          {lang === 'bn' ? '০' : '0'}
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 mx-auto rounded-full bg-slate-800/40 hover:bg-slate-700 active:bg-slate-600 text-slate-400 hover:text-white transition-all flex items-center justify-center"
        >
          <Delete size={22} />
        </button>
      </div>
    </div>
  );
};
