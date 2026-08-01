alter table public.reports
  drop constraint if exists reports_category_check;

alter table public.reports
  add constraint reports_category_check check (category in (
    'ACCIDENTE',
    'BACHE',
    'SEMAFORO',
    'SENALIZACION',
    'VEHICULO_ABANDONADO',
    'ALUMBRADO',
    'SEGURIDAD_URBANA',
    'RESIDUOS',
    'AGUA_CLOACAS',
    'ANEGAMIENTO',
    'ARBOLADO_PUBLICO',
    'CABLES_POSTES',
    'ESPACIOS_PUBLICOS',
    'VEREDAS_ACCESIBILIDAD'
  ));

insert into public.municipal_areas
  (id, city_id, label, responsible, is_active, sort_order, updated_at)
values
  ('security', 'aguilares-tucuman', 'Seguridad', 'Seguridad', true, 50, now())
on conflict (city_id, id) do update set
  label = excluded.label,
  responsible = excluded.responsible,
  is_active = true,
  updated_at = now();

insert into public.incident_categories
  (id, city_id, label, name, icon_name, color, default_area_id, priority, is_active, sort_order, updated_at)
values
  ('SEGURIDAD_URBANA', 'aguilares-tucuman', 'Seguridad urbana', 'Situacion de seguridad urbana', 'ShieldAlert', '#2563EB', 'security', 'high', true, 70, now()),
  ('RESIDUOS', 'aguilares-tucuman', 'Residuos', 'Residuos o microbasural', 'Trash2', '#16A34A', 'environment', 'low', true, 80, now()),
  ('AGUA_CLOACAS', 'aguilares-tucuman', 'Agua y cloacas', 'Perdida de agua o problema cloacal', 'Droplets', '#0891B2', 'public_works', 'high', true, 90, now()),
  ('ANEGAMIENTO', 'aguilares-tucuman', 'Desagües y anegamientos', 'Desague obstruido o anegamiento', 'Waves', '#0284C7', 'public_works', 'high', true, 100, now()),
  ('ARBOLADO_PUBLICO', 'aguilares-tucuman', 'Arbolado público', 'Arbol o rama con riesgo en la via publica', 'TreePine', '#15803D', 'environment', 'high', true, 110, now()),
  ('CABLES_POSTES', 'aguilares-tucuman', 'Cables y postes', 'Cable o poste dañado', 'Cable', '#9333EA', 'lighting', 'high', true, 120, now()),
  ('ESPACIOS_PUBLICOS', 'aguilares-tucuman', 'Espacios públicos', 'Daño en plaza o mobiliario urbano', 'Landmark', '#DB2777', 'public_works', 'medium', true, 130, now()),
  ('VEREDAS_ACCESIBILIDAD', 'aguilares-tucuman', 'Veredas y accesibilidad', 'Vereda dañada o problema de accesibilidad', 'Accessibility', '#EA580C', 'public_works', 'medium', true, 140, now())
on conflict (city_id, id) do update set
  label = excluded.label,
  name = excluded.name,
  icon_name = excluded.icon_name,
  color = excluded.color,
  default_area_id = excluded.default_area_id,
  priority = excluded.priority,
  is_active = true,
  sort_order = excluded.sort_order,
  updated_at = now();
