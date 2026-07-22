ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operator';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'brigadier';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'viewer';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS shift TEXT,
  ADD COLUMN IF NOT EXISTS employee_status TEXT,
  ADD COLUMN IF NOT EXISTS employee_created_by TEXT REFERENCES users(uid) ON DELETE SET NULL;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_employee_status_check,
  ADD CONSTRAINT users_employee_status_check
    CHECK (employee_status IS NULL OR employee_status IN ('pending', 'active', 'disabled'));
