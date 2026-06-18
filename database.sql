-- ==========================================
-- Supabase Database Schema
-- 用于「课堂反馈系统」开源部署
-- ==========================================

-- 1. 创建 user_settings 表
-- 此表用于在云端持久化存储用户的 DeepSeek API Key
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  api_key text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 启用行级安全策略 (RLS)
-- 这是保证数据不外泄的关键配置
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 3. 创建访问策略
-- 允许用户仅能查看自己的 API Key
CREATE POLICY "Users can view their own settings"
  ON public.user_settings
  FOR SELECT
  USING ( auth.uid() = user_id );

-- 允许用户仅能插入自己的 API Key
CREATE POLICY "Users can insert their own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- 允许用户更新自己的 API Key
CREATE POLICY "Users can update their own settings"
  ON public.user_settings
  FOR UPDATE
  USING ( auth.uid() = user_id );

-- ==========================================
-- 4. 创建 user_data 表 (用于下拉表单同步)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, key)
);

ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON public.user_data FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own data"
  ON public.user_data FOR INSERT WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own data"
  ON public.user_data FOR UPDATE USING ( auth.uid() = user_id );

-- ==========================================
-- 5. 创建 user_api_usage 表 (用于API用量同步)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_api_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_tokens integer NOT NULL,
  completion_tokens integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON public.user_api_usage FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own usage"
  ON public.user_api_usage FOR INSERT WITH CHECK ( auth.uid() = user_id );
