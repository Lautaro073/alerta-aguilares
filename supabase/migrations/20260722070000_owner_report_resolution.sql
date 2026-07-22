ALTER TABLE public.report_events
  DROP CONSTRAINT IF EXISTS report_events_event_type_check;

ALTER TABLE public.report_events
  ADD CONSTRAINT report_events_event_type_check CHECK (
    event_type IN (
      'created',
      'status_changed',
      'area_changed',
      'hidden',
      'restored',
      'duplicate_marked',
      'owner_feedback'
    )
  );
