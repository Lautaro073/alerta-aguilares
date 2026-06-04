# Plan de Migracion: Firestore -> Supabase PostgreSQL + PostGIS + Realtime

## Decision final

La app deja de usar Firestore para datos y para realtime.

Firebase se conserva solo para:

- Firebase Auth: login Google/email y verificacion de ID tokens.
- Firebase App Check: validacion anti-bots en API routes.
- Firebase Cloud Messaging: envio de push notifications.

Supabase queda como capa completa de datos:

- `reports`
- `report_private_meta`
- `report_confirmations`
- `users`
- `fcm_tokens`
- `rate_limits`
- `public_feeds`

El realtime del mapa usa Supabase Realtime sobre `public_feeds`, no Firestore. El patron se mantiene: el cliente escucha un "timbre" liviano y cuando cambia `report_version` refresca `/api/reports` con SWR.

## Por que no conservar `public_feeds` en Firestore

Aunque era practico, cada cliente conectado al documento Firestore genera lecturas cuando hay cambios. Si el techo esperado es ciudad/provincia con muchas sesiones simultaneas, no conviene dejar una pieza que sabemos que despues habria que migrar.

## Arquitectura final

```text
Cliente
  - Firebase Auth para sesion
  - Supabase Realtime escucha public_feeds:{city_id}
  - SWR consulta /api/reports

API Routes Next.js
  - Verifican Firebase Auth/App Check
  - Usan Supabase service role server-side
  - Ejecutan queries/RPC transaccionales
  - En cambios de reportes actualizan public_feeds en Supabase
  - En creacion de reportes disparan FCM

Supabase
  - PostgreSQL + PostGIS
  - RPC atomicas para rate limit + creacion
  - Tabla normalizada para confirmaciones
  - Realtime solo para public_feeds

Firebase
  - Auth
  - App Check
  - FCM
```

## Cambios principales

1. Crear cliente Supabase server con `SUPABASE_SERVICE_ROLE_KEY`.
2. Crear cliente Supabase browser con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Crear schema SQL versionado en `supabase/schema.sql`.
4. Migrar queries server de reportes a Supabase/PostGIS.
5. Migrar creacion de reportes a RPC atomica:
   - evalua rate limit por fingerprint e IP,
   - inserta `reports`,
   - inserta `report_private_meta`,
   - toca `public_feeds`,
   - todo falla o completa junto.
6. Migrar confirmaciones a `report_confirmations`, no `confirmed_by TEXT[]`.
7. Migrar users/admin roles, FCM tokens y rate limits a Supabase.
8. Reemplazar `useRealtimeReports` para escuchar Supabase Realtime en `public_feeds`.
9. Eliminar Firestore del cliente y del admin SDK.

## Variables requeridas

```bash
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` nunca se expone al cliente. Las `NEXT_PUBLIC_*` son necesarias para Supabase Realtime en el navegador.

## Orden de ejecucion

1. Infraestructura: dependencias, env, clientes Supabase y schema SQL.
2. Server data layer: report queries, mapper, public feed, admin auth, notifications.
3. API routes: users, notifications, auth elevate, reports, report status/delete, confirmations, seed.
4. Cliente realtime: `useRealtimeReports` con Supabase Realtime.
5. Limpieza Firebase: remover Firestore client/admin exports y geohash utilities no usadas.
6. Verificacion: lint, build, busqueda de imports Firestore, pruebas manuales.

## Verificacion esperada

- `npm run lint`
- `npm run build`
- `rg "adminDb|firebase/firestore|onSnapshot|public_feeds.*Firestore" src`
- Crear reporte y ver refresco realtime por Supabase.
- Confirmar reporte y verificar contador.
- Moderar/delete desde admin.
- Registrar FCM token y enviar notificacion al crear reporte.

