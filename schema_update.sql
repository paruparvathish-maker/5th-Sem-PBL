-- Run this in your Supabase SQL Editor to support cross-device passwords
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_first_login boolean DEFAULT true;
