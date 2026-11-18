import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Mail, Lock, User, LogIn, UserPlus, Cloud, CheckCircle, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { lang, loginWithEmail, signUpWithEmail, loginWithGoogle } = useApp();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        const res = await loginWithEmail(email, password);
        if (res.error) {
          setMessage({ text: res.error, type: 'error' });
        } else {
          setMessage({
            text: lang === 'bn' ? 'লগইন সফল হয়েছে! ক্লাউড সিঙ্ক চালু হচ্ছে...' : 'Login successful! Syncing cloud...',
            type: 'success',
          });
          setTimeout(onClose, 1200);
        }
      } else {
        const res = await signUpWithEmail(email, password, fullName);
        if (res.error) {
          setMessage({ text: res.error, type: 'error' });
        } else {
          setMessage({
            text: lang === 'bn' ? 'অ্যাকাউন্ট তৈরি হয়েছে! আপনার ইমেইল চেক করুন।' : 'Account created! Please check your email.',
            type: 'success',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setMessage(null);
    const res = await loginWithGoogle();
    if (res.error) {
      setMessage({ text: res.error, type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cloud size={18} />
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              {lang === 'bn' ? 'ক্লাউড সিঙ্ক ও ব্যাকআপ' : 'Cloud Sync & Backup'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Google One-Click Login */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {lang === 'bn' ? 'Google দিয়ে চালিয়ে যান' : 'Continue with Google'}
          </button>
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 uppercase font-semibold tracking-wider absolute">
            {lang === 'bn' ? 'অথবা ইমেইল' : 'or email'}
          </span>
        </div>

        {/* Tab Switcher (Login vs Sign Up) */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setMessage(null);
            }}
            className={`py-1.5 rounded-lg transition-all ${
              mode === 'LOGIN'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            {lang === 'bn' ? 'লগইন' : 'Login'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('SIGNUP');
              setMessage(null);
            }}
            className={`py-1.5 rounded-lg transition-all ${
              mode === 'SIGNUP'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            {lang === 'bn' ? 'রেজিস্ট্রেশন' : 'Sign Up'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'SIGNUP' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {lang === 'bn' ? 'আপনার নাম' : 'Full Name'}
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: রহিম আহমেদ' : 'e.g. Rahim Ahmed'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              {lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'error'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {message.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
              <span className="font-medium text-[11px]">{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {mode === 'LOGIN' ? <LogIn size={15} /> : <UserPlus size={15} />}
            {loading
              ? lang === 'bn' ? 'অপেক্ষা করুন...' : 'Processing...'
              : mode === 'LOGIN'
              ? lang === 'bn' ? 'লগইন করুন' : 'Sign In'
              : lang === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}
          </button>
        </form>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
          >
            {lang === 'bn' ? 'অফলাইনে হিসেবে চালিয়ে যান' : 'Continue as Guest (Offline)'}
          </button>
        </div>
      </div>
    </div>
  );
};
