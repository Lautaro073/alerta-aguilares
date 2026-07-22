CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('ACTIVE', 'RESOLVED', 'DUPLICATE', 'PENDING', 'VERIFYING', 'IN_PROGRESS', 'DISMISSED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'operator', 'brigadier', 'viewer');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_limit_type') THEN
    CREATE TYPE rate_limit_type AS ENUM ('fp', 'ip');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  photo_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  area TEXT,
  shift TEXT,
  employee_status TEXT CHECK (employee_status IS NULL OR employee_status IN ('pending', 'active', 'disabled')),
  employee_created_by TEXT REFERENCES users(uid) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  city_id TEXT NOT NULL DEFAULT 'aguilares-tucuman',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location_label TEXT,
  location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  ) STORED,
  category TEXT NOT NULL CHECK (
    category IN (
      'BACHE',
      'SEMAFORO',
      'OBRA_PELIGROSA',
      'INUNDACION',
      'ANIMALES',
      'VEREDA',
      'CABLES_POSTES',
      'TRANSPORTE'
    )
  ),
  title TEXT NOT NULL,
  description TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  status report_status NOT NULL DEFAULT 'PENDING',
  priority TEXT CHECK (priority IS NULL OR priority IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  verified_count INTEGER NOT NULL DEFAULT 0,
  user_id TEXT REFERENCES users(uid) ON DELETE SET NULL,
  user_display_name TEXT,
  duplicate_of_report_id TEXT REFERENCES reports(id) ON DELETE SET NULL
);

ALTER TABLE reports ADD COLUMN IF NOT EXISTS location_label TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS duplicate_of_report_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reports_duplicate_of_report_id_fkey'
  ) THEN
    ALTER TABLE reports
    ADD CONSTRAINT reports_duplicate_of_report_id_fkey
    FOREIGN KEY (duplicate_of_report_id)
    REFERENCES reports(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS report_private_meta (
  report_id UUID PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  user_agent TEXT NOT NULL DEFAULT 'unknown',
  origin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_confirmations (
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  uid TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (report_id, uid)
);

CREATE TABLE IF NOT EXISTS report_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id TEXT NOT NULL DEFAULT 'aguilares-tucuman',
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  actor_uid TEXT REFERENCES users(uid) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('created', 'status_changed', 'area_changed', 'hidden', 'restored', 'duplicate_marked', 'owner_feedback')
  ),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fcm_tokens (
  token TEXT PRIMARY KEY,
  uid TEXT REFERENCES users(uid) ON DELETE SET NULL,
  city_id TEXT NOT NULL DEFAULT 'aguilares-tucuman',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fcm_tokens_city_id_idx
ON fcm_tokens (city_id);

CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  type rate_limit_type NOT NULL,
  hash TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_report_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public_feeds (
  city_id TEXT PRIMARY KEY,
  report_version BIGINT NOT NULL DEFAULT 0,
  last_report_id TEXT,
  last_report_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_category_status_created ON reports (category, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_duplicate_of_report_id ON reports (duplicate_of_report_id);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_report_confirmations_uid ON report_confirmations (uid);
CREATE INDEX IF NOT EXISTS idx_report_events_report_created ON report_events (report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_events_city_created ON report_events (city_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_type_hash ON rate_limits (type, hash);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_private_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_feeds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_feeds_select ON public_feeds;
CREATE POLICY public_feeds_select
ON public_feeds
FOR SELECT
TO anon, authenticated
USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public_feeds TO anon, authenticated;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS reports_set_updated_at ON reports;
CREATE TRIGGER reports_set_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS fcm_tokens_set_updated_at ON fcm_tokens;
CREATE TRIGGER fcm_tokens_set_updated_at
BEFORE UPDATE ON fcm_tokens
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION bump_public_feed(
  p_city_id TEXT,
  p_report_id TEXT,
  p_happened_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public_feeds (
    city_id,
    report_version,
    last_report_id,
    last_report_at,
    updated_at
  )
  VALUES (
    p_city_id,
    1,
    p_report_id,
    p_happened_at,
    NOW()
  )
  ON CONFLICT (city_id)
  DO UPDATE SET
    report_version = public_feeds.report_version + 1,
    last_report_id = EXCLUDED.last_report_id,
    last_report_at = EXCLUDED.last_report_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION create_report_with_rate_limit(
  p_city_id TEXT,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_category TEXT,
  p_title TEXT,
  p_description TEXT,
  p_images TEXT[],
  p_location_label TEXT,
  p_user_id TEXT,
  p_user_display_name TEXT,
  p_ip_hash TEXT,
  p_fingerprint_hash TEXT,
  p_user_agent TEXT,
  p_origin TEXT,
  p_max_reports_fp INTEGER,
  p_max_reports_ip INTEGER,
  p_window_hours INTEGER,
  p_priority TEXT DEFAULT NULL
)
RETURNS TABLE(
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ,
  report_id TEXT
) AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_interval INTERVAL := make_interval(hours => p_window_hours);
  v_fp rate_limits%ROWTYPE;
  v_ip rate_limits%ROWTYPE;
  v_fp_next_count INTEGER;
  v_ip_next_count INTEGER;
  v_fp_reset_at TIMESTAMPTZ;
  v_ip_reset_at TIMESTAMPTZ;
  v_report_id TEXT;
  v_remaining INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_priority TEXT := COALESCE(
    p_priority,
    CASE
      WHEN p_category IN ('ACCIDENTE', 'SEMAFORO', 'ALUMBRADO') THEN 'high'
      WHEN p_category IN ('BACHE', 'SENALIZACION', 'VEHICULO_ABANDONADO') THEN 'medium'
      ELSE 'low'
    END
  );
BEGIN
  INSERT INTO rate_limits (id, type, hash, count, window_start, last_report_at)
  VALUES
    ('fp:' || p_fingerprint_hash, 'fp', p_fingerprint_hash, 0, v_now, v_now),
    ('ip:' || p_ip_hash, 'ip', p_ip_hash, 0, v_now, v_now)
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO v_fp
  FROM rate_limits
  WHERE id = 'fp:' || p_fingerprint_hash
  FOR UPDATE;

  SELECT * INTO v_ip
  FROM rate_limits
  WHERE id = 'ip:' || p_ip_hash
  FOR UPDATE;

  IF v_fp.window_start + v_window_interval <= v_now THEN
    v_fp_next_count := 1;
    v_fp_reset_at := v_now + v_window_interval;
  ELSE
    IF v_fp.count >= p_max_reports_fp THEN
      RETURN QUERY SELECT FALSE, 0, v_fp.window_start + v_window_interval, NULL::TEXT;
      RETURN;
    END IF;
    v_fp_next_count := v_fp.count + 1;
    v_fp_reset_at := v_fp.window_start + v_window_interval;
  END IF;

  IF v_ip.window_start + v_window_interval <= v_now THEN
    v_ip_next_count := 1;
    v_ip_reset_at := v_now + v_window_interval;
  ELSE
    IF v_ip.count >= p_max_reports_ip THEN
      RETURN QUERY SELECT FALSE, 0, v_ip.window_start + v_window_interval, NULL::TEXT;
      RETURN;
    END IF;
    v_ip_next_count := v_ip.count + 1;
    v_ip_reset_at := v_ip.window_start + v_window_interval;
  END IF;

  UPDATE rate_limits
  SET count = v_fp_next_count,
      window_start = CASE WHEN v_fp.window_start + v_window_interval <= v_now THEN v_now ELSE window_start END,
      last_report_at = v_now
  WHERE id = v_fp.id;

  UPDATE rate_limits
  SET count = v_ip_next_count,
      window_start = CASE WHEN v_ip.window_start + v_window_interval <= v_now THEN v_now ELSE window_start END,
      last_report_at = v_now
  WHERE id = v_ip.id;

  INSERT INTO reports (
    city_id,
    lat,
    lng,
    category,
    title,
    description,
    images,
    location_label,
    user_id,
    user_display_name,
    status,
    priority
  )
  VALUES (
    p_city_id,
    p_lat,
    p_lng,
    p_category,
    p_title,
    p_description,
    COALESCE(p_images, '{}'),
    NULLIF(TRIM(p_location_label), ''),
    p_user_id,
    p_user_display_name,
    'PENDING'::report_status,
    v_priority
  )
  RETURNING id INTO v_report_id;

  INSERT INTO report_private_meta (
    report_id,
    ip_hash,
    fingerprint_hash,
    user_agent,
    origin
  )
  VALUES (
    v_report_id,
    p_ip_hash,
    p_fingerprint_hash,
    COALESCE(p_user_agent, 'unknown'),
    p_origin
  );

  PERFORM bump_public_feed(p_city_id, v_report_id, NOW());

  v_remaining := LEAST(
    GREATEST(0, p_max_reports_fp - v_fp_next_count),
    GREATEST(0, p_max_reports_ip - v_ip_next_count)
  );
  v_reset_at := GREATEST(v_fp_reset_at, v_ip_reset_at);

  RETURN QUERY SELECT TRUE, v_remaining, v_reset_at, v_report_id;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION toggle_report_confirmation(
  p_report_id TEXT,
  p_uid TEXT
)
RETURNS TABLE(verified_count INTEGER, confirmed BOOLEAN) AS $$
DECLARE
  v_status report_status;
  v_count INTEGER;
  v_confirmed BOOLEAN;
  v_city_id TEXT;
BEGIN
  SELECT status, city_id INTO v_status, v_city_id
  FROM reports
  WHERE id = p_report_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  IF v_status NOT IN ('ACTIVE', 'PENDING', 'VERIFYING', 'IN_PROGRESS') THEN
    RAISE EXCEPTION 'REPORT_NOT_ACTIVE';
  END IF;

  DELETE FROM report_confirmations
  WHERE report_id = p_report_id
    AND uid = p_uid;

  IF FOUND THEN
    v_confirmed := FALSE;
  ELSE
    INSERT INTO report_confirmations (report_id, uid)
    VALUES (p_report_id, p_uid);
    v_confirmed := TRUE;
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_count
  FROM report_confirmations
  WHERE report_id = p_report_id;

  UPDATE reports
  SET verified_count = v_count
  WHERE id = p_report_id;

  PERFORM bump_public_feed(v_city_id, p_report_id, NOW());

  RETURN QUERY SELECT v_count, v_confirmed;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'public_feeds'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public_feeds;
  END IF;
END $$;
