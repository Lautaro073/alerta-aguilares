CREATE OR REPLACE FUNCTION public.toggle_report_confirmation(
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
