ALTER TABLE public.reports
  ALTER COLUMN status SET DEFAULT 'PENDING'::report_status;

UPDATE public.reports
SET status = 'PENDING'::report_status,
    updated_at = NOW()
WHERE city_id = 'aguilares-tucuman'
  AND status = 'ACTIVE'::report_status;

DROP FUNCTION IF EXISTS public.create_report_with_rate_limit(
  TEXT,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  TEXT,
  TEXT,
  TEXT,
  TEXT[],
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  INTEGER,
  INTEGER
);

DROP FUNCTION IF EXISTS public.create_report_with_rate_limit(
  TEXT,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  TEXT,
  TEXT,
  TEXT,
  TEXT[],
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  INTEGER,
  INTEGER,
  TEXT
);

CREATE FUNCTION public.create_report_with_rate_limit(
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
      window_start = CASE
        WHEN v_fp.window_start + v_window_interval <= v_now THEN v_now
        ELSE window_start
      END,
      last_report_at = v_now
  WHERE id = v_fp.id;

  UPDATE rate_limits
  SET count = v_ip_next_count,
      window_start = CASE
        WHEN v_ip.window_start + v_window_interval <= v_now THEN v_now
        ELSE window_start
      END,
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
