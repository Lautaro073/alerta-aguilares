ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS citizen_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_citizen_status_check,
  ADD CONSTRAINT users_citizen_status_check
    CHECK (citizen_status IN ('active', 'blocked'));

CREATE INDEX IF NOT EXISTS idx_users_role_citizen_status_created
  ON public.users (role, citizen_status, created_at DESC);
