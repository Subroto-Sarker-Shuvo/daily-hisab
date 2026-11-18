import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import { Transaction, TransactionType, PaymentMethod, Category } from '../../types';
import { parseVoiceTransaction, ParsedVoiceResult } from '../../lib/voiceParser';
import { formatAmount } from '../../lib/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Volume2,
  RefreshCw,
  Plus,
} from 'lucide-react';

interface VoiceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

export const VoiceEntryModal: React.FC<VoiceEntryModalProps> = ({
  isOpen,
  onClose,
  categories,
}) => {
  const { lang, currencySymbol, currentBookId, triggerSync } = useApp();

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedVoiceResult | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'bn-BD'; // Bangla (Bangladesh)

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // Parse result dynamically
        if (currentTranscript.trim()) {
          const res = parseVoiceTransaction(currentTranscript, categories);
          setParsed(res);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage(
            lang === 'bn'
              ? 'মাইক্রোফোনের অনুমতি প্রয়োজন। ব্রাউজার সেটিংসে গিয়ে পারমিশন এলাউ করুন।'
              : 'Microphone permission denied. Please allow microphone access.'
          );
        } else if (event.error === 'no-speech') {
          // No speech detected, quietly pause
        } else {
          setErrorMessage(
            lang === 'bn'
              ? 'কথা পরিষ্কার বোঝা যায়নি, আবার চেষ্টা করুন।'
              : 'Could not recognize speech clearly, please try again.'
          );
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition initialization error:', err);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [categories, lang]);

  // Start / Stop Listening Toggle
  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      setErrorMessage(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Restart if already running
        try {
          recognitionRef.current.abort();
          recognitionRef.current.start();
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  // Run NLP on custom or test phrase
  const handleTestPhrase = (phrase: string) => {
    setTranscript(phrase);
    setManualInput(phrase);
    const res = parseVoiceTransaction(phrase, categories);
    setParsed(res);
  };

  // Save parsed entry into Dexie
  const handleSaveTransaction = async () => {
    if (!parsed || parsed.amount <= 0) {
      alert(lang === 'bn' ? 'টাকার পরিমাণ শূন্য হতে পারে না!' : 'Amount cannot be zero!');
      return;
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      const newTx: Transaction = {
        id: crypto.randomUUID(),
        bookId: currentBookId !== 'all' ? currentBookId : 'default_personal',
        type: parsed.type,
        amount: parsed.amount,
        categoryId: parsed.categoryId,
        paymentMethod: parsed.paymentMethod,
        date: new Date().toISOString(),
        note: parsed.note,
        createdAt: now,
        updatedAt: now,
      };

      await db.transactions.add(newTx);
      await triggerSync();

      // Reset & Close
      setTranscript('');
      setParsed(null);
      onClose();
    } catch (err) {
      console.error('Failed to save voice transaction:', err);
      alert(lang === 'bn' ? 'সংরক্ষণে সমস্যা হয়েছে।' : 'Failed to save transaction.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const samplePhrases = [
    'আজকে দোকানে বিক্রি ৩৫০০ টাকা',
    'কাঁচাবাজারে খরচ ৭৫০ টাকা',
    'রিকশা ভাড়া ৫০ টাকা নগদ',
    'বিদ্যুৎ বিল ১২০০ টাকা বিকাশ',
  ];

  const matchedCat = categories.find((c) => c.id === parsed?.categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                {lang === 'bn' ? 'ভয়েস দিয়ে আয়-ব্যয় এন্ট্রি' : 'AI Voice Expense Entry'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'বাংলায় মুখে বলুন, বাকিটা অ্যাপ করে নেবে' : 'Speak in Bengali, AI does the rest'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mic Activation Area */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="relative">
            {/* Pulsing ring when listening */}
            {isListening && (
              <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
            )}
            <button
              onClick={toggleListening}
              disabled={!speechSupported}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                isListening
                  ? 'bg-rose-500 text-white scale-110 shadow-rose-500/40 animate-pulse'
                  : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 hover:scale-105 active:scale-95'
              } ${!speechSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isListening ? <Mic size={36} /> : <Mic size={36} />}
            </button>
          </div>

          <p className="mt-3 text-xs font-bold text-slate-700 dark:text-slate-300">
            {isListening
              ? lang === 'bn'
                ? '🎙️ শুনছি... বাংলায় বলুন'
                : '🎙️ Listening... Speak now'
              : lang === 'bn'
              ? 'মাইকে চাপ দিয়ে কথা বলুন'
              : 'Tap microphone to speak'}
          </p>

          {errorMessage && (
            <div className="mt-2 text-center text-xs text-rose-500 font-medium px-4">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Live Transcript / Speech Display */}
        {transcript && (
          <div className="mb-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              {lang === 'bn' ? 'আপনার কথা (রেকর্ডেড):' : 'Spoken Text:'}
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-100 font-medium italic">
              "{transcript}"
            </p>
          </div>
        )}

        {/* AI Parsed Result Preview Card */}
        {parsed && parsed.amount > 0 ? (
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {lang === 'bn' ? 'স্বয়ংক্রিয়ভাবে শনাক্তকৃত তথ্য' : 'AI Detected Details'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  parsed.confidence === 'HIGH'
                    ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                }`}
              >
                {parsed.confidence === 'HIGH'
                  ? lang === 'bn' ? 'উচ্চ নির্ভুলতা' : 'High Accuracy'
                  : lang === 'bn' ? 'মাঝারি' : 'Medium'}
              </span>
            </div>

            {/* Editable summary inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  {lang === 'bn' ? 'ধরন' : 'Type'}
                </label>
                <div className="flex rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setParsed({ ...parsed, type: 'EXPENSE' })}
                    className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      parsed.type === 'EXPENSE'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    {lang === 'bn' ? 'ব্যয়' : 'Expense'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setParsed({ ...parsed, type: 'INCOME' })}
                    className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      parsed.type === 'INCOME'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    {lang === 'bn' ? 'আয়' : 'Income'}
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  {lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount'}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={parsed.amount}
                    onChange={(e) =>
                      setParsed({ ...parsed, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-6 pr-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-extrabold text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                </label>
                <select
                  value={parsed.categoryId}
                  onChange={(e) => setParsed({ ...parsed, categoryId: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-[11px] text-slate-800 dark:text-slate-100"
                >
                  {categories
                    .filter((c) => c.type === parsed.type)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {lang === 'bn' ? c.nameBn : c.nameEn}
                      </option>
                    ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  {lang === 'bn' ? 'মাধ্যম' : 'Method'}
                </label>
                <select
                  value={parsed.paymentMethod}
                  onChange={(e) =>
                    setParsed({ ...parsed, paymentMethod: e.target.value as PaymentMethod })
                  }
                  className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-[11px] text-slate-800 dark:text-slate-100"
                >
                  <option value="CASH">ক্যাশ / নগদ</option>
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="NAGAD">নগদ (Nagad)</option>
                  <option value="ROCKET">রকেট (Rocket)</option>
                  <option value="BANK">ব্যাংক (Bank)</option>
                </select>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">
                {lang === 'bn' ? 'বিবরণ' : 'Note'}
              </label>
              <input
                type="text"
                value={parsed.note}
                onChange={(e) => setParsed({ ...parsed, note: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveTransaction}
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
            >
              <CheckCircle2 size={16} />
              {isSaving
                ? lang === 'bn'
                  ? 'সংরক্ষণ হচ্ছে...'
                  : 'Saving...'
                : lang === 'bn'
                ? 'এন্ট্রি সংরক্ষণ করুন'
                : 'Confirm & Save Entry'}
            </button>
          </div>
        ) : null}

        {/* Quick Testing Example Chips */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
            <Volume2 size={13} />
            {lang === 'bn' ? 'উদাহরণ বাক্য (ক্লিক করে টেস্ট করুন):' : 'Sample Phrases (Click to test):'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {samplePhrases.map((phrase, i) => (
              <button
                key={i}
                onClick={() => handleTestPhrase(phrase)}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors text-left"
              >
                "{phrase}"
              </button>
            ))}
          </div>
        </div>

        {/* Fallback Manual Text Input for non-speech browsers */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">
            {lang === 'bn'
              ? 'অথবা বাংলায় লিখে টেস্ট করুন:'
              : 'Or type naturally in Bengali:'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={lang === 'bn' ? 'যেমন: বাজারে খরচ ৮০০ টাকা' : 'e.g. Spent 800 in grocery'}
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualInput.trim()) {
                  handleTestPhrase(manualInput);
                }
              }}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
            <button
              onClick={() => manualInput.trim() && handleTestPhrase(manualInput)}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              {lang === 'bn' ? 'পার্স করুন' : 'Parse'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
