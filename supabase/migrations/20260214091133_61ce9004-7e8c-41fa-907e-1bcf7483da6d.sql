
-- 1. Add admin role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';

-- 2. Create shared_tests table for shareable test links
CREATE TABLE public.shared_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_code TEXT NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_by UUID NOT NULL,
  topic TEXT NOT NULL,
  questions JSONB NOT NULL,
  question_count INTEGER NOT NULL,
  question_types TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_tests ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can view shared tests (needed to take them via link)
CREATE POLICY "Authenticated users can view shared tests"
  ON public.shared_tests FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can create shared tests
CREATE POLICY "Users can create shared tests"
  ON public.shared_tests FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own shared tests
CREATE POLICY "Users can delete own shared tests"
  ON public.shared_tests FOR DELETE
  USING (auth.uid() = created_by);

-- 3. Admin policies: admins can view all test_results and profiles
CREATE POLICY "Admins can view all test results"
  ON public.test_results FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins can update any profile (e.g. change roles)
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins can view all test questions
CREATE POLICY "Admins can view all test questions"
  ON public.test_questions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins can delete test results (content moderation)
CREATE POLICY "Admins can delete test results"
  ON public.test_results FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins can delete test questions
CREATE POLICY "Admins can delete test questions"
  ON public.test_questions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
