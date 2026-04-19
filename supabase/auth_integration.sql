-- =====================================================
-- Supabase Auth Integration Migration
-- Run this in the Supabase SQL Editor
-- =====================================================

-- 1. Modify users table to work with Supabase Auth
-- We don't need the password column anymore since Supabase handles auth
ALTER TABLE public.users DROP COLUMN IF EXISTS password;

-- If a user signs in with Google, they might not have a username right away, 
-- or we can auto-generate it. Let's make it nullable or generate a random one.
-- Actually, we can keep it NOT NULL but handle it in the trigger.

-- 2. Create a trigger to sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  generated_username TEXT;
BEGIN
  -- Extract username from email or metadata, or fallback to a random string
  generated_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4)
  );

  INSERT INTO public.users (id, email, username)
  VALUES (NEW.id, NEW.email, generated_username);
  
  -- Also create the initial recovery state for the user
  INSERT INTO public.recovery_states (user_id, start_time)
  VALUES (NEW.id, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Fix Row Level Security (RLS)
-- Ensure RLS is disabled on these tables so your backend APIs can freely modify them,
-- or enable them and use the service_role key. 
-- Since we are sticking to our API routes for now, we will make sure RLS is disabled
-- on users to avoid the "new row violates row-level security policy" error.
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
