update public.incident_categories
set
  label = 'Zona insegura',
  name = 'Lugar percibido como inseguro o peligroso',
  updated_at = now()
where city_id = 'aguilares-tucuman'
  and id = 'SEGURIDAD_URBANA';
