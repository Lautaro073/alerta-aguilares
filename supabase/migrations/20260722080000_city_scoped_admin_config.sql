alter table public.incident_categories
  drop constraint incident_categories_default_area_id_fkey;

alter table public.incident_categories
  drop constraint incident_categories_pkey;

alter table public.municipal_areas
  drop constraint municipal_areas_pkey;

alter table public.municipal_areas
  add primary key (city_id, id);

alter table public.incident_categories
  add primary key (city_id, id),
  add constraint incident_categories_city_area_fkey
    foreign key (city_id, default_area_id)
    references public.municipal_areas (city_id, id);

insert into public.municipal_areas
  (id, city_id, label, responsible, is_active, sort_order, updated_at)
values
  ('traffic', 'aguilares-tucuman', 'Transito', 'Transito', true, 10, now()),
  ('public_works', 'aguilares-tucuman', 'Obras Publicas', 'Obras Publicas', true, 20, now()),
  ('lighting', 'aguilares-tucuman', 'Alumbrado', 'Alumbrado', true, 30, now()),
  ('environment', 'aguilares-tucuman', 'Ambiente', 'Ambiente', true, 40, now())
on conflict (city_id, id) do nothing;

insert into public.incident_categories
  (id, city_id, label, name, icon_name, color, default_area_id, priority, is_active, sort_order, updated_at)
values
  ('ACCIDENTE', 'aguilares-tucuman', 'Accidente', 'Accidente de transito', 'AlertTriangle', '#DC2626', 'traffic', 'high', true, 10, now()),
  ('BACHE', 'aguilares-tucuman', 'Bache', 'Bache / Pozo en calzada', 'Cone', '#EF4444', 'public_works', 'medium', true, 20, now()),
  ('SEMAFORO', 'aguilares-tucuman', 'Semaforo', 'Semaforo roto o fuera de servicio', 'TrafficLight', '#F43F5E', 'traffic', 'high', true, 30, now()),
  ('SENALIZACION', 'aguilares-tucuman', 'Senalizacion', 'Senalizacion danada o faltante', 'Signpost', '#F97316', 'traffic', 'medium', true, 40, now()),
  ('VEHICULO_ABANDONADO', 'aguilares-tucuman', 'Vehiculo abandonado', 'Vehiculo abandonado', 'Car', '#7C3AED', 'environment', 'medium', true, 50, now()),
  ('ALUMBRADO', 'aguilares-tucuman', 'Alumbrado', 'Falla de alumbrado publico', 'Lightbulb', '#CA8A04', 'lighting', 'high', true, 60, now())
on conflict (city_id, id) do nothing;
