-- ========================================================
-- Daily Hisab (দৈনিক হিসাব খাতা) - Supabase Cloud Schema
-- Copy and paste this script into your Supabase SQL Editor
-- ========================================================

-- 1. Profiles Table (tied to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Cloud Cashbooks Table (একাধিক খাতা)
CREATE TABLE IF NOT EXISTS public.cloud_cashbooks (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'PERSONAL', -- 'PERSONAL', 'BUSINESS', 'FAMILY', 'OTHER'
  icon TEXT DEFAULT 'Book',
  color TEXT DEFAULT '#10B981',
  is_default BOOLEAN DEFAULT false,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (id, user_id)
);

-- 3. Cloud Transactions Table
CREATE TABLE IF NOT EXISTS public.cloud_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT DEFAULT 'default_personal',
  type TEXT NOT NULL, -- 'INCOME', 'EXPENSE', 'TRANSFER'
  amount NUMERIC NOT NULL,
  category_id TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  note TEXT,
  receipt_image TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 4. Cloud Debts Table (দেনা-পাওনা)
CREATE TABLE IF NOT EXISTS public.cloud_debts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT DEFAULT 'default_personal',
  person_name TEXT NOT NULL,
  phone_number TEXT,
  type TEXT NOT NULL, -- 'RECEIVABLE', 'PAYABLE'
  total_amount NUMERIC NOT NULL,
  settled_amount NUMERIC NOT NULL DEFAULT 0,
  due_date TEXT,
  notes TEXT,
  status TEXT NOT NULL, -- 'PENDING', 'PARTIAL', 'SETTLED'
  settlements JSONB DEFAULT '[]'::jsonb,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 5. Cloud Custom Categories Table
CREATE TABLE IF NOT EXISTS public.cloud_categories (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  monthly_budget NUMERIC,
  PRIMARY KEY (id, user_id)
);

-- 6. Cloud User Settings Table
CREATE TABLE IF NOT EXISTS public.cloud_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'bn',
  currency_symbol TEXT DEFAULT '৳',
  currency_code TEXT DEFAULT 'BDT',
  monthly_budget_limit NUMERIC DEFAULT 25000,
  theme TEXT DEFAULT 'light',
  is_pin_enabled BOOLEAN DEFAULT false,
  pin_hash TEXT,
  active_book_id TEXT DEFAULT 'default_personal',
  updated_at BIGINT NOT NULL
);

-- ========================================================
-- Row Level Security (RLS) - Users only see their own data
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_cashbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Cashbooks Policies
CREATE POLICY "Users can manage own cashbooks" ON public.cloud_cashbooks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can manage own transactions" ON public.cloud_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Debts Policies
CREATE POLICY "Users can manage own debts" ON public.cloud_debts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Categories Policies
CREATE POLICY "Users can manage own categories" ON public.cloud_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Settings Policies
CREATE POLICY "Users can manage own settings" ON public.cloud_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Automatic Profile Creation Trigger on Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
