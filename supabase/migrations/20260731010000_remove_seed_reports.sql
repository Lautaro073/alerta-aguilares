delete from public.reports
where id in (
  select report_id
  from public.report_private_meta
  where user_agent = 'system-seeder'
);
