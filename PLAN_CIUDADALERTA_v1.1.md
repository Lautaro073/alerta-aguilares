# 🗺️ CiudadAlerta — Plan Maestro del Proyecto
**Ciudad:** Aguilares, Tucumán, Argentina  
**Stack:** Next.js 15 · TypeScript Strict · Firebase · Leaflet.js  
**Versión del plan:** 1.1 (post-revisión crítica)  
**Target:** Mobile-first  

---

## 📋 Índice
1. [Visión General](#1-visión-general)
2. [Stack Tecnológico Definitivo](#2-stack-tecnológico-definitivo)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura de Carpetas](#4-estructura-de-carpetas)
5. [Schema de Firebase Firestore](#5-schema-de-firebase-firestore)
6. [Reglas Estrictas del Proyecto](#6-reglas-estrictas-del-proyecto)
7. [Convenciones TypeScript](#7-convenciones-typescript)
8. [Skills de IA del Proyecto](#8-skills-de-ia-del-proyecto)
9. [Gestión de Tokens por Modelo](#9-gestión-de-tokens-por-modelo)
10. [FASE 0 — Setup & Fundamentos](#10-fase-0--setup--fundamentos)
11. [FASE 1 — MVP Core](#11-fase-1--mvp-core)
12. [FASE 2 — Cuentas & Avanzado](#12-fase-2--cuentas--avanzado)
13. [Variables de Entorno](#13-variables-de-entorno)
14. [Checklist de Lanzamiento MVP](#14-checklist-de-lanzamiento-mvp)

---

## Changelog v1.0 → v1.1

| # | Cambio | Motivo |
|---|--------|--------|
| 1 | Firestore rules → `allow read, write: if false` total | Seguridad: toda lectura/escritura pasa por API Routes |
| 2 | Schema `Report` separado en `Report` (público) + `ReportPrivateMeta` (privado) | No exponer ipHash/fingerprint en documentos públicos |
| 3 | Cliente envía `fingerprintVisitorId`, server lo hashea | El cliente no puede controlar el hash que se usa para rate limiting |
| 4 | Rate limiting dual: por fingerprint (5/día) + por IP (10/día) | Un solo vector es bypasseable |
| 5 | Botón "Confirmar" eliminado del MVP | No tenía endpoint ni modelo de datos. Se mueve a Fase 2 |
| 6 | Tiles de OSM: nota de política de uso justo | OSM no es "ilimitado", tiene fair use policy |
| 7 | Nueva TAREA-1.X: integración del mapa | Faltaba tarea que conectara todos los componentes del mapa |
| 8 | Nueva TAREA-0.5: Firebase Emulator Suite | Necesario para desarrollar sin tocar producción |
| 9 | Nueva TAREA-0.9: validación de env vars con Zod | Fallar rápido si falta una variable de entorno |
| 10 | Nueva TAREA-0.10: helpers de error response | Formato común de errores en todas las API Routes |
| 11 | Reordenamiento: utils antes que endpoints | `rateLimit.ts` y `geoUtils.ts` deben existir antes del POST |
| 12 | Límite default en GET /api/reports (500 markers, 1000 heatmap) | Evitar leer toda la colección sin límite |
| 13 | Opus retirado de tareas de implementación | Solo para revisión arquitectónica. Sonnet para implementación |
| 14 | "Tiempo real" corregido a "actualización cada 30 segundos" | Polling ≠ tiempo real |
| 15 | PWA cambiado a "PWA-ready (Fase 2)" | El manifest solo no hace una PWA |
| 16 | `cityId` agregado al schema de `Report` | Campo simple para escalabilidad futura |
| 17 | Vista lista de reportes marcada como opcional del MVP | Mejora de accesibilidad, sin bloquear el lanzamiento |
| 18 | Fase de QA explícita antes del deploy | El plan anterior pasaba directo de desarrollo a deploy |

---

## 1. Visión General

**CiudadAlerta** es una plataforma web ciudadana para reportar y visualizar problemas urbanos en Aguilares, Tucumán. Cualquier vecino puede marcar un punto en el mapa con el problema, clasificarlo por categoría, y verlo reflejado para toda la comunidad. El mapa se actualiza cada 30 segundos automáticamente.

### Categorías de Reporte (MVP)

| ID | Emoji | Nombre | Color |
|----|-------|--------|-------|
| `ALUMBRADO` | 🔦 | Falta de alumbrado público | `#F59E0B` |
| `BACHE` | 🕳️ | Bache / Pozo en calzada | `#EF4444` |
| `INSEGURIDAD` | ⚠️ | Zona insegura | `#8B5CF6` |
| `BASURA` | 🗑️ | Basura / Escombros | `#6B7280` |
| `INUNDACION` | 🌊 | Inundación / Anegamiento | `#3B82F6` |
| `OBRA_PELIGROSA` | 🚧 | Obra peligrosa sin señalizar | `#F97316` |
| `AGUA_CLOACA` | 💧 | Pérdida de agua / Rotura de cloaca | `#06B6D4` |
| `ARBOL` | 🌳 | Árbol peligroso / Caído | `#22C55E` |
| `OTRO` | 📌 | Otro problema | `#9CA3AF` |

### Límites Geográficos de Aguilares

```typescript
const AGUILARES_BOUNDS = {
  center: { lat: -27.4333, lng: -65.6167 },
  bbox: {
    south: -27.470,
    north: -27.400,
    west:  -65.650,
    east:  -65.580,
  },
  defaultZoom: 14,
  minZoom: 13,
  maxZoom: 19,
}
```

---

## 2. Stack Tecnológico Definitivo

### Frontend / Full-Stack
| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 15.x (App Router) | Framework principal |
| **TypeScript** | 5.x (strict: true) | Tipado completo |
| **Tailwind CSS** | 4.x | Estilos utilitarios |
| **Leaflet.js** | 1.9.x | Mapa interactivo (OSM tiles) |
| **Leaflet.heat** | 0.2.x | Plugin de mapa de calor |
| **react-leaflet** | 4.x ⚠️ | Wrapper React para Leaflet — usar v4, no v5 (ver nota) |
| **react-leaflet-cluster** | compatible con v4 | Clustering de markers |
| **FingerprintJS** | 4.x (OSS) | visitorId del navegador |
| **Zod** | 3.x | Validación de schemas |
| **SWR** | 2.x | Fetching y polling cada 30s |

> ⚠️ **react-leaflet v5** requiere React 19. Next.js 15 puede usar React 18 o 19.  
> Verificar en `package.json` qué versión de React está instalada antes de decidir.  
> Si hay conflictos, usar `react-leaflet@4` con React 18. Si el proyecto usa React 19, v5 está bien.

### Backend (Next.js API Routes)
| Tecnología | Rol |
|---|---|
| **Next.js API Routes** (App Router) | Endpoints REST |
| **Firebase Admin SDK** | Acceso a Firestore desde server |
| **Firebase Firestore** | Base de datos |

### Servicios Externos
| Servicio | Uso | Costo / Límite |
|---|---|---|
| **OpenStreetMap** | Tiles del mapa (via Leaflet) | Fair use policy — ver nota |
| **Google Maps Static API** | Street View por coordenada | $200 crédito/mes ≈ 28.000 req/mes gratis |
| **Firebase Firestore** | BD | Spark plan: 50k reads/day, 20k writes/day |
| **Vercel** | Deploy | Hobby plan gratis |

> ⚠️ **Nota sobre tiles de OpenStreetMap:**  
> OSM tiene una [política de uso justo](https://operations.osmfoundation.org/policies/tiles/) para sus servidores de tiles.  
> Para producción con tráfico real, usar un proveedor de tiles alternativo:
> - **Stadia Maps** (plan gratuito generoso, tiles de OSM)  
> - **Maptiler** (free tier disponible)  
> - **Carto** (free tier disponible)  
> Para el MVP con tráfico bajo de una sola ciudad, los tiles de OSM están bien. Monitorear y migrar si hay problemas.

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                      │
│                                                               │
│  ┌─────────────────┐    ┌──────────────────────────────┐    │
│  │   Mapa Leaflet   │    │     Form de Reporte           │    │
│  │   + HeatLayer    │    │  (mini-mapa para marcar punto)│    │
│  │   + Markers      │    │  + Categoría + Descripción    │    │
│  └────────┬─────────┘    └──────────────┬───────────────┘    │
│           │ SWR polling (30s)            │ POST /api/reports  │
│           │                             │ body: { ...data,   │
│           │                             │   fingerprintVisitorId }│
└───────────┼─────────────────────────────┼───────────────────┘
            │                             │
┌───────────┼─────────────────────────────┼───────────────────┐
│           │      NEXT.JS SERVER         │                    │
│   GET /api/reports?filter=BACHE         │                    │
│   ┌───────▼──────────────────────────▼──┐                   │
│   │          API Route Handlers          │                   │
│   │  GET /api/reports  (con filtros)     │                   │
│   │  POST /api/reports (nuevo report)    │                   │
│   │  GET /api/streetview?lat&lng         │                   │
│   └────────────────┬─────────────────────┘                   │
│                    │ Firebase Admin SDK                       │
└────────────────────┼─────────────────────────────────────────┘
                     │
┌────────────────────┼─────────────────────────────────────────┐
│                    │  FIREBASE (Firestore)                    │
│   ┌────────────────▼──────────────────────────────────────┐  │
│   │  /reports/{id}            — Datos públicos del reporte │  │
│   │  /report_private_meta/{id} — ipHash, fingerprint, UA  │  │
│   │  /rate_limits/{key}       — Control de rate limiting  │  │
│   └───────────────────────────────────────────────────────┘  │
│                                                               │
│   Reglas: allow read, write: if false  (total)               │
│   → Solo Firebase Admin SDK puede leer/escribir              │
└───────────────────────────────────────────────────────────────┘
```

### Flujo de Seguridad: Rate Limiting Dual

```
Usuario envía POST /api/reports
         │
         ▼
[Server] Extraer IP del request (headers: x-forwarded-for, x-real-ip)
[Server] Extraer fingerprintVisitorId del body
         │
         ▼
[Server] ipHash        = SHA256(ip + HASH_SALT)
[Server] fingerprintHash = SHA256(fingerprintVisitorId + HASH_SALT)
         │
         ▼
[Firestore] Verificar rate_limits/{fp:fingerprintHash}
         ├── count >= 5 → 429 ❌
         └── OK → continuar
         │
         ▼
[Firestore] Verificar rate_limits/{ip:ipHash}
         ├── count >= 10 → 429 ❌
         └── OK → continuar
         │
         ▼
[Server] Validar que coordenadas estén dentro del bbox de Aguilares
[Server] Validar schema Zod completo
         │
         ▼
[Firestore] Transacción atómica:
         ├── Incrementar count en rate_limits/{fp:fingerprintHash}
         ├── Incrementar count en rate_limits/{ip:ipHash}
         ├── Crear /reports/{newId} con datos públicos
         └── Crear /report_private_meta/{newId} con datos privados
         │
         ▼
201 { success: true, id: newId } ✅
```

### Notas de Seguridad
- El cliente **nunca** calcula ni controla el hash usado para rate limiting.
- El servidor siempre valida el header `Origin` en producción.
- IPs y fingerprints **nunca** se almacenan en texto plano.
- La colección `report_private_meta` no está en ninguna respuesta pública de la API.

---

## 4. Estructura de Carpetas

```
ciudadalerta/
├── .env.local                    # Variables de entorno (nunca al repo)
├── .env.example                  # Template público
├── .agents/
│   └── skills/
│       ├── frontend-design.md          # Guía visual del proyecto
│       ├── ciudadalerta-conventions.md # Reglas y convenciones
│       └── leaflet-nextjs-patterns.md  # Patrones técnicos de Leaflet
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
│
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx              # Home = mapa principal
    │   ├── globals.css
    │   └── api/
    │       ├── reports/
    │       │   └── route.ts      # GET + POST
    │       └── streetview/
    │           └── route.ts      # Proxy Street View
    │
    ├── components/
    │   ├── map/
    │   │   ├── MapView.tsx           # Contenedor principal del mapa (ssr:false)
    │   │   ├── HeatmapLayer.tsx
    │   │   ├── ReportMarkers.tsx
    │   │   ├── ReportPopup.tsx       # Popup al tocar marker (sin botón Confirmar)
    │   │   └── MapControls.tsx       # Filtros flotantes
    │   ├── report/
    │   │   ├── ReportDrawer.tsx      # Orquestador del formulario (Bottom Sheet)
    │   │   ├── ReportMiniMap.tsx     # Mini mapa para seleccionar punto exacto
    │   │   ├── CategoryPicker.tsx    # Grid de categorías paso 1
    │   │   └── ReportFormFields.tsx  # Inputs de texto paso 3
    │   ├── ui/
    │   │   ├── BottomSheet.tsx
    │   │   ├── FilterChip.tsx
    │   │   ├── Toast.tsx
    │   │   └── StreetViewImage.tsx
    │   └── layout/
    │       ├── TopBar.tsx
    │       └── FAB.tsx
    │
    ├── lib/
    │   ├── firebase/
    │   │   └── admin.ts              # Firebase Admin SDK init (server only)
    │   ├── constants/
    │   │   ├── categories.ts
    │   │   └── map.ts                # AGUILARES_BOUNDS
    │   ├── validators/
    │   │   └── report.schema.ts      # Zod schemas
    │   ├── server/
    │   │   ├── env.ts                # Validación de variables de entorno
    │   │   └── response.ts           # Helpers: badRequest, tooManyRequests, serverError
    │   └── utils/
    │       ├── fingerprint.ts        # Wrapper FingerprintJS (cliente)
    │       ├── rateLimit.ts          # Lógica rate limiting (servidor)
    │       └── geoUtils.ts           # isWithinAguilares, hashValue
    │
    ├── hooks/
    │   ├── useReports.ts
    │   ├── useMapFilter.ts
    │   └── useGeolocation.ts
    │
    └── types/
        ├── report.ts
        ├── category.ts
        └── api.ts
```

---

## 5. Schema de Firebase Firestore

### Colección: `reports` (datos públicos)

```typescript
interface Report {
  id: string;                      // Firestore auto-ID

  cityId: 'aguilares-tucuman';     // Para escalabilidad futura

  // Geo
  lat: number;
  lng: number;

  // Categorización
  category: CategoryId;

  // Descripción
  title: string;                   // Max 80 chars, requerido
  description: string | null;      // Max 500 chars, opcional

  // Estado
  status: 'ACTIVE' | 'RESOLVED' | 'DUPLICATE';

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt: Timestamp | null;
}
```

> `verifiedCount` y el botón "Confirmar" se mueven a **Fase 2**. El MVP no tiene ese endpoint.

### Colección: `report_private_meta` (datos privados — nunca expuestos en la API)

```typescript
interface ReportPrivateMeta {
  reportId: string;                // = ID del reporte en /reports
  ipHash: string;                  // SHA256(ip + HASH_SALT)
  fingerprintHash: string;         // SHA256(visitorId + HASH_SALT)
  userAgent: string;
  origin: string | null;
  createdAt: Timestamp;
}
```

### Colección: `rate_limits`

```typescript
interface RateLimit {
  // Document ID = 'fp:{fingerprintHash}' o 'ip:{ipHash}'
  type: 'fp' | 'ip';
  hash: string;
  count: number;
  windowStart: Timestamp;          // Inicio de la ventana rolling 24h
  lastReportAt: Timestamp;
}
```

### Índices Firestore (`firestore.indexes.json`)

```json
{
  "indexes": [
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Reglas de Seguridad (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

> **IMPORTANTE:** Firestore está completamente cerrado al cliente.  
> Toda lectura y escritura ocurre desde el server mediante Firebase Admin SDK.  
> Esto incluye la lectura de reportes para el mapa, que pasa por `/api/reports`.

---

## 6. Reglas Estrictas del Proyecto

### Reglas de Arquitectura

```
REGLA-001: Toda escritura Y lectura a Firestore pasa por una API Route de Next.js.
           El cliente NUNCA accede a Firestore directamente.

REGLA-002: Toda API Route valida el request body con Zod ANTES de cualquier lógica.
           Si falla → 400 con los errores de Zod usando badRequest().

REGLA-003: Las claves de API (Firebase Admin, Google Maps) NUNCA van al client bundle.
           Solo se usan en server-side code.

REGLA-004: Leaflet se importa SIEMPRE con dynamic import y ssr: false.

REGLA-005: El mapa SIEMPRE tiene maxBounds = AGUILARES_BOUNDS.bbox.
           El usuario no puede hacer scroll fuera de Aguilares.

REGLA-006: IPs y fingerprintVisitorId NUNCA se almacenan en texto plano.
           Siempre se guarda SHA256(valor + HASH_SALT).

REGLA-007: TypeScript strict: true. Sin 'any'. unknown + narrowing explícito.

REGLA-008: No hay console.log en producción.
           Solo console.error estructurado en bloques catch de server:
           console.error('[POST /api/reports]', { error, context })

REGLA-009: Cada API Route usa los helpers de src/lib/server/response.ts.
           No hay Response.json() inline con status codes hardcodeados.

REGLA-010: El cliente envía fingerprintVisitorId (string de FingerprintJS).
           El SERVER calcula el hash. Nunca al revés.

REGLA-011: GET /api/reports siempre tiene un límite máximo de resultados.
           DEFAULT: 500 markers, 1000 heatmap. Nunca leer toda la colección.

REGLA-012: Toda lectura pública de reportes NO incluye campos de report_private_meta.
           Esos campos nunca aparecen en ningún response de la API.
```

### Reglas de UX/UI

```
UI-001: Mobile-first siempre. Breakpoint base = 375px.
UI-002: El FAB es el único entry point para crear reportes. Siempre visible.
UI-003: El formulario de reporte abre como Bottom Sheet. Nunca como página aparte.
UI-004: Feedback inmediato: loading state → success toast o error toast.
UI-005: El mapa ocupa 100dvh. Los controles flotan sobre el mapa.
UI-006: Al seleccionar categoría, el emoji y color de esa categoría se reflejan en la UI.
UI-007: Touch targets mínimo 44x44px en todos los controles (WCAG 2.5.8).
UI-008: El popup de un reporte NO tiene botón "Confirmar" en MVP.
        Solo muestra: Street View, categoría, título, descripción, fecha.
```

---

## 7. Convenciones TypeScript

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

```typescript
// ✅ API response con tipo discriminado
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

// ✅ Zod schema como fuente de verdad del tipo
const CreateReportSchema = z.object({
  lat: z.number().min(-27.47).max(-27.40),
  lng: z.number().min(-65.65).max(-65.58),
  category: z.enum(CATEGORY_IDS),
  title: z.string().min(5).max(80),
  description: z.string().max(500).optional(),
  fingerprintVisitorId: z.string().min(10).max(128), // visitorId de FingerprintJS
});
type CreateReportInput = z.infer<typeof CreateReportSchema>;

// ✅ Error responses centralizados
// src/lib/server/response.ts
export function badRequest(message: string, details?: unknown) {
  return Response.json({ success: false, error: message, details }, { status: 400 });
}
export function tooManyRequests(message: string, resetAt: Date) {
  return Response.json(
    { success: false, error: message, resetAt: resetAt.toISOString() },
    { status: 429 }
  );
}
export function serverError(context?: string) {
  console.error('[serverError]', context);
  return Response.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
}

// ✅ Validación de env vars en src/lib/server/env.ts
import { z } from 'zod';
const EnvSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  HASH_SALT: z.string().min(32),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  MAX_REPORTS_PER_DAY_FP: z.coerce.number().default(5),
  MAX_REPORTS_PER_DAY_IP: z.coerce.number().default(10),
  RATE_LIMIT_WINDOW_HOURS: z.coerce.number().default(24),
  ALLOWED_ORIGIN: z.string().url(),
});
export const env = EnvSchema.parse(process.env);
// Si falta una variable → el proceso falla en startup con mensaje claro.
```

---

## 8. Skills de IA del Proyecto

Las skills son archivos `SKILL.md` que el agente lee antes de ejecutar una tarea para tener contexto sin repetirlo en cada prompt. Se ubican en `.agents/skills/<nombre>/SKILL.md` en la raíz del proyecto.

**Cómo se crean:** simplemente creás el archivo `SKILL.md` dentro de la carpeta correspondiente. No hay script de instalación — OpenCode las lee directamente de esa ruta. Son parte del repositorio del proyecto (committearlas).

```
ciudadalerta/
└── .agents/
    └── skills/
        ├── frontend-design/
        │   └── SKILL.md
        ├── ciudadalerta-conventions/
        │   └── SKILL.md
        └── leaflet-nextjs-patterns/
            └── SKILL.md
```

### SKILL-001 — `frontend-design/SKILL.md`
**Crear en:** TAREA-0.0 (placeholder) → completar después de TAREA-1.1  
Contenido: paleta de colores con CSS variables, tipografías elegidas, principios mobile-first, touch targets 44px mínimo, estilo del FAB, BottomSheet, FilterChip y markers del mapa.  
En TAREA-0.0 se crea con el contenido base del punto 6 (reglas UI-001 a UI-008). Después de ejecutar TAREA-1.1 se actualiza con los tokens reales que definió el agente.

### SKILL-002 — `ciudadalerta-conventions/SKILL.md`
**Crear en:** TAREA-0.0 (completo desde el inicio)  
Contenido: todas las REGLAS del punto 6 (REGLA-001 a REGLA-012, UI-001 a UI-008), convenciones TypeScript del punto 7, `AGUILARES_BOUNDS`, lista de categorías con IDs/colores/emojis, patrón `ApiResponse<T>`, límites de rate limiting (FP=5, IP=10, ventana 24h), estructura de colecciones Firestore (`/reports`, `/report_private_meta`, `/rate_limits`).

### SKILL-003 — `leaflet-nextjs-patterns/SKILL.md`
**Crear en:** TAREA-0.0 (completo desde el inicio)  
Contenido: patrón canónico `dynamic(() => import('./MapViewInner'), { ssr: false })`, configuración de `maxBounds` con `maxBoundsViscosity: 1.0`, cómo importar `leaflet.heat` sin errores de SSR, cómo crear `DivIcon` custom con emoji + color, cómo evitar colisión entre el mapa principal y el mini mapa del formulario usando `key` único y montaje/desmontaje controlado.

> **Flujo de uso en cada tarea:**  
> Indicar al agente qué skill leer al inicio del prompt.  
> Ejemplo: *"Leé `.agents/skills/leaflet-nextjs-patterns/SKILL.md` y luego implementá el componente MapView según la TAREA-0.11 del plan."*

---

## 9. Gestión de Tokens por Modelo

| Modelo | Uso ideal | Costo |
|---|---|---|
| **Opus 4.6** | Revisión crítica de arquitectura, tradeoffs de seguridad. **NO para generar componentes.** | $$$$$ |
| **Sonnet 4.6** | Componentes React complejos, API Routes con lógica de seguridad, hooks con estado | $$$ |
| **Gemini 2.5 Pro (High)** | Contexto largo: revisar varios archivos, refactors, TS types complejos | $$$ |
| **Gemini 2.5 Pro (Low)** | Hooks medianos, schemas Zod, utilidades de servidor | $$ |
| **Gemini Flash** | Types simples, constantes, configs, boilerplate, docs | $ |
| **Codex** | Autocompletar, snippets repetitivos, archivos de config | $ |

### Regla de asignación

```
Revisión de arquitectura / seguridad             → Opus 4.6 (solo revisión)
Componente UI con estado complejo                → Sonnet 4.6
API Route + validación Zod + lógica de negocio   → Sonnet 4.6
Hook de React (useReports, useMapFilter)         → Gemini Pro (Low)
Utilidades de servidor (rateLimit, geoUtils)     → Gemini Pro (Low)
Type/Interface TS                                → Gemini Flash
Schema Zod simple                                → Gemini Flash
Config files (tailwind, next, tsconfig)          → Codex
Constantes (categorías, bounds)                  → Gemini Flash
```

---

## 10. FASE 0 — Setup & Fundamentos

> **Objetivo:** Proyecto corriendo en local con mapa visible y fundamentos de seguridad en su lugar.  
> **Resultado de la fase:** Mapa de Aguilares funcional, Firebase conectado, Emulator corriendo, todos los schemas y utils creados.

---

### TAREA-0.0 — Crear skills del agente
**Modelo:** `Gemini Flash`  
Crear los tres archivos `.md` en `.agents/skills/` con el contenido base.  
`ciudadalerta-conventions.md` y `leaflet-nextjs-patterns.md` se pueden completar ya.  
`frontend-design.md` se completa parcialmente (placeholder para tokens de diseño).

---

### TAREA-0.1 — Inicializar proyecto Next.js
**Modelo:** `Codex`

```bash
npx create-next-app@latest ciudadalerta \
  --typescript --tailwind --app --src-dir \
  --import-alias "@/*"
```

Luego en `tsconfig.json` agregar:
```json
"noUncheckedIndexedAccess": true,
"exactOptionalPropertyTypes": true,
"noImplicitReturns": true
```

---

### TAREA-0.2 — Configurar Tailwind 4 y tokens base mínimos
**Modelo:** `Codex`  
Configurar `tailwind.config.ts` con los paths correctos para App Router.  
Agregar en `globals.css` los tokens de colores de las categorías como CSS variables (placeholder hasta TAREA-1.1).

---

### TAREA-0.3 — Crear constantes: categorías y bounds
**Modelo:** `Gemini Flash`  
**Skill:** `ciudadalerta-conventions.md`

- `src/lib/constants/categories.ts` — CATEGORY_IDS, Category interface, CATEGORIES record
- `src/lib/constants/map.ts` — AGUILARES_BOUNDS

---

### TAREA-0.4 — Configurar Firebase Admin SDK
**Modelo:** `Gemini Flash`

```bash
npm install firebase-admin
```

Crear `src/lib/firebase/admin.ts` con inicialización del Admin SDK y export de `adminDb`.

---

### TAREA-0.5 — Configurar Firebase Emulator Suite
**Modelo:** `Gemini Pro (Low)`

```bash
npm install -g firebase-tools
firebase init emulators
# Seleccionar: Firestore Emulator (puerto 8080)
```

Configurar en `admin.ts` para conectar al emulador cuando `NODE_ENV === 'development'`:
```typescript
if (process.env.NODE_ENV === 'development') {
  adminDb.settings({ host: 'localhost:8080', ssl: false });
}
```

Agregar script en `package.json`:
```json
"emulator": "firebase emulators:start --only firestore"
```

---

### TAREA-0.6 — Crear Zod schemas de validación
**Modelo:** `Gemini Pro (Low)`  
**Skill:** `ciudadalerta-conventions.md`

Crear `src/lib/validators/report.schema.ts`:
- `CreateReportSchema` con todas las validaciones (lat/lng dentro del bbox, title/description max chars, fingerprintVisitorId)
- `GetReportsQuerySchema` para validar query params del GET

---

### TAREA-0.7 — Crear types principales
**Modelo:** `Gemini Flash`

- `src/types/report.ts` — `Report`, `ReportPrivateMeta`
- `src/types/category.ts` — `CategoryId`, `Category`
- `src/types/api.ts` — `ApiResponse<T>`

---

### TAREA-0.8 — Crear validación de variables de entorno
**Modelo:** `Gemini Flash`  
**Skill:** `ciudadalerta-conventions.md`

Crear `src/lib/server/env.ts` con el `EnvSchema` de Zod del punto 7.  
Este archivo se importa al inicio de cada API Route. Si una variable falta → el servidor falla en startup con mensaje claro.

---

### TAREA-0.9 — Crear helpers de error response
**Modelo:** `Gemini Flash`

Crear `src/lib/server/response.ts` con `badRequest`, `tooManyRequests`, `serverError` del punto 7.

---

### TAREA-0.10 — Crear utils de servidor
**Modelo:** `Gemini Pro (Low)`  
**Skill:** `ciudadalerta-conventions.md`

Crear `src/lib/utils/geoUtils.ts`:
```typescript
// isWithinAguilares(lat: number, lng: number): boolean
// hashValue(value: string): string — SHA256(value + HASH_SALT) usando crypto nativo de Node
```

Crear `src/lib/utils/rateLimit.ts`:
```typescript
// checkRateLimit(keys: { fpHash: string; ipHash: string }): Promise<RateLimitResult>
// RateLimitResult = { allowed: true; remaining: number } | { allowed: false; resetAt: Date }
// Usa dos documentos: rate_limits/{fp:fpHash} y rate_limits/{ip:ipHash}
// Ventana rolling 24h. Máximo: FP=5, IP=10
// Implementar con runTransaction de Firestore Admin para atomicidad
```

---

### TAREA-0.11 — Instalar Leaflet y verificar que carga en Next.js
**Modelo:** `Sonnet 4.6`  
**Skill:** `leaflet-nextjs-patterns.md`

```bash
npm install leaflet react-leaflet leaflet.heat react-leaflet-cluster
npm install -D @types/leaflet
```

Crear `src/components/map/MapView.tsx` básico:
- `dynamic(() => import('./MapViewInner'), { ssr: false })`
- MapViewInner: `MapContainer` con tiles OSM, bounds de Aguilares, zoom, maxBounds
- Verificar que carga sin errores en `http://localhost:3000`

---

## 11. FASE 1 — MVP Core

> **Objetivo:** App completamente funcional: mapa, filtros, crear reportes, Street View en popup.  
> **Resultado de la fase:** Deploy en Vercel accesible públicamente.

---

### TAREA-1.1 — Sistema visual completo (design tokens)
**Modelo:** `Sonnet 4.6`  
**Skill:** `frontend-design.md`

Definir y documentar:
- Paleta de colores con CSS variables en `globals.css`
- Tipografía: 2 Google Fonts distintivos (no Inter, no Roboto). Actualizar `frontend-design.md` con la elección.
- Tokens: espaciado, border-radius, sombras
- Estilo del FAB: tamaño, color, sombra, animación de entrada
- Estilo del Bottom Sheet: handle, fondo, border-radius superior
- Estilo de los FilterChips: activo vs inactivo, scroll horizontal
- Estilo de los markers del mapa: DivIcon con emoji + color de categoría

> El output de esta tarea actualiza `frontend-design.md` con los valores reales. Todas las tareas UI siguientes leen esa skill.

---

### TAREA-1.2 — API Route: GET /api/reports
**Modelo:** `Sonnet 4.6`  
**Skills:** `ciudadalerta-conventions.md`

Handler GET en `src/app/api/reports/route.ts`:

Query params:
- `?category=BACHE` (puede repetirse para múltiples)
- `?view=markers` (default) → devuelve `Report[]` completo
- `?view=heatmap` → devuelve `{ lat: number; lng: number }[]` (más liviano)
- `?limit=500` (default markers) / `?limit=1000` (default heatmap)

Lógica:
1. Importar `env` de `src/lib/server/env.ts`
2. Validar query params con `GetReportsQuerySchema`
3. Query Firestore: `where('status', '==', 'ACTIVE')`, aplicar filtros de categoría, `.limit(DEFAULT_LIMIT)`
4. Si `view=heatmap` → mapear a `{ lat, lng }` solo
5. Retornar con `Cache-Control: s-maxage=30, stale-while-revalidate=60`

> Esta ruta **no expone** ningún campo de `report_private_meta`.

---

### TAREA-1.3 — Utilidades del cliente: fingerprint
**Modelo:** `Gemini Flash`

```bash
npm install @fingerprintjs/fingerprintjs
```

Crear `src/lib/utils/fingerprint.ts`:
```typescript
// getVisitorId(): Promise<string>
// Carga FingerprintJS OSS, obtiene el visitorId, lo cachea en sessionStorage
```

---

### TAREA-1.4 — API Route: POST /api/reports
**Modelo:** `Sonnet 4.6`  
**Skills:** `ciudadalerta-conventions.md`

Handler POST en `src/app/api/reports/route.ts`:

Lógica (en orden):
1. Importar `env`
2. Validar `Origin` header: si es producción y no coincide con `env.ALLOWED_ORIGIN` → 403
3. Parsear body con `CreateReportSchema` → si falla: `badRequest()`
4. Extraer IP del header `x-forwarded-for` o `x-real-ip`
5. Calcular `ipHash = hashValue(ip)` y `fpHash = hashValue(body.fingerprintVisitorId)`
6. `checkRateLimit({ fpHash, ipHash })` → si falla: `tooManyRequests()`
7. Verificar `isWithinAguilares(body.lat, body.lng)` → si falla: `badRequest()`
8. Transacción Firestore:
   - Crear `/reports/{newId}` con datos públicos + `cityId: 'aguilares-tucuman'`
   - Crear `/report_private_meta/{newId}` con ipHash, fpHash, userAgent, origin
   - Actualizar contadores de rate limit (ya incluido en `checkRateLimit` si usa transaction)
9. Retornar `201 { success: true, id: newId }`
10. En catch: `serverError('[POST /api/reports]')`

---

### TAREA-1.5 — API Route: GET /api/streetview
**Modelo:** `Gemini Pro (Low)`

Crear `src/app/api/streetview/route.ts`:
- Validar query params `lat` y `lng` con Zod (dentro del bbox de Aguilares)
- Construir URL de Google Maps Static Street View API (key en `env.GOOGLE_MAPS_API_KEY`)
- Si la key no está configurada → retornar 404 (permitir que el frontend muestre placeholder)
- Proxear la imagen con `Cache-Control: public, max-age=86400`
- Manejar el caso donde Google devuelve una imagen de "no disponible" → retornar 204 para que el frontend muestre placeholder

---

### TAREA-1.6 — Hook: useReports
**Modelo:** `Gemini Pro (Low)`

Crear `src/hooks/useReports.ts`:
- Parámetros: `{ categories?: CategoryId[]; view: 'markers' | 'heatmap' }`
- SWR con `refreshInterval: 30_000`
- Construir URL con query params
- Retornar `{ reports, isLoading, error, mutate }`
- Tipo de retorno diferenciado según `view`

---

### TAREA-1.7 — Hook: useMapFilter
**Modelo:** `Gemini Flash`

Crear `src/hooks/useMapFilter.ts`:
- Estado: `{ activeCategories: Set<CategoryId>; viewMode: 'markers' | 'heatmap' }`
- Acciones: `toggleCategory`, `setViewMode`, `clearFilters`, `isActive`
- Persistir en `sessionStorage` (sobrevive refresh pero no nueva pestaña)

---

### TAREA-1.8 — Componente: MapControls
**Modelo:** `Sonnet 4.6`  
**Skills:** `frontend-design.md`, `ciudadalerta-conventions.md`

`src/components/map/MapControls.tsx`:
- Chips en scroll horizontal (una por categoría) — emoji + label corto
- Toggle "Puntos" / "Calor" con switch
- Posición: overlay flotante en la parte superior del mapa
- Al seleccionar → `useMapFilter.toggleCategory()`
- Chip activo muestra el color de la categoría

---

### TAREA-1.9 — Componente: ReportMarkers
**Modelo:** `Sonnet 4.6`  
**Skill:** `leaflet-nextjs-patterns.md`

`src/components/map/ReportMarkers.tsx`:
- Consume `useReports({ view: 'markers', categories: activeCategories })`
- Renderiza `<MarkerClusterGroup>` de react-leaflet-cluster
- Cada marker: `DivIcon` custom con emoji + color de la categoría (ver skill)
- Al click → setea el reporte seleccionado en estado del padre (MapView)

---

### TAREA-1.10 — Componente: HeatmapLayer
**Modelo:** `Gemini Pro (Low)`  
**Skill:** `leaflet-nextjs-patterns.md`

`src/components/map/HeatmapLayer.tsx`:
- Solo se monta cuando `viewMode === 'heatmap'`
- Consume `useReports({ view: 'heatmap', categories: activeCategories })`
- Importar `leaflet.heat` dinámicamente (ver skill para evitar errores SSR)
- Configuración: `radius: 25, blur: 15, gradient: { 0.4: '#3B82F6', 0.65: '#F59E0B', 1: '#EF4444' }`

---

### TAREA-1.11 — Componente: ReportPopup
**Modelo:** `Sonnet 4.6`  
**Skills:** `frontend-design.md`

`src/components/map/ReportPopup.tsx`:

Contenido del popup (sin botón Confirmar en MVP):
- Imagen de Street View via `GET /api/streetview?lat=&lng=` con skeleton loader
- Si Street View no disponible (204) → placeholder con el emoji de la categoría
- Badge de categoría: emoji + nombre + color
- Título del reporte
- Descripción (si existe)
- Fecha en formato relativo: "hace 2 días"

En móvil: bottom sheet parcial (no popup nativo de Leaflet).  
En desktop: popup Leaflet estilizado.

---

### TAREA-1.12 — Componente: StreetViewImage
**Modelo:** `Gemini Pro (Low)`  
**Skill:** `frontend-design.md`

`src/components/ui/StreetViewImage.tsx`:
- Recibe `lat` y `lng`
- Fetch a `/api/streetview?lat=&lng=`
- Estados: loading (skeleton) / loaded (img) / error (placeholder con emoji)
- La imagen tiene `loading="lazy"` y dimensiones fijas (400x200 en móvil)

---

### TAREA-1.13 — Componente: ReportDrawer (formulario de 3 pasos)
**Modelo:** `Sonnet 4.6` (dividido en subtareas)  
**Skills:** `frontend-design.md`, `leaflet-nextjs-patterns.md`, `ciudadalerta-conventions.md`

Dividir en:

**1.13a — CategoryPicker** (`Gemini Pro (Low)`)
- Grid 3x3 de categorías
- Cada card: emoji grande + nombre + color de fondo
- Al seleccionar → callback con `CategoryId`

**1.13b — ReportMiniMap** (`Sonnet 4.6`)
- Mini mapa Leaflet (`ssr: false`, `key` único para evitar colisión con el mapa principal)
- Bounds bloqueados a Aguilares
- Al tocar → coloca marker arrastrable
- Instrucción: "Tocá el punto exacto del problema"
- Muestra coordenadas en texto debajo

**1.13c — ReportFormFields** (`Gemini Flash`)
- Input title: max 80 chars con contador
- Textarea description: max 500 chars con contador, opcional

**1.13d — ReportDrawer orquestador** (`Sonnet 4.6`)
- Bottom Sheet con 3 pasos: CategoryPicker → ReportMiniMap → ReportFormFields
- Indicador de paso (step dots)
- Navegación atrás/adelante entre pasos
- En "Enviar": obtener `fingerprintVisitorId` via `getVisitorId()`, POST a `/api/reports`
- Loading state mientras se envía
- Éxito → toast + cerrar drawer + `mutate()` para refrescar el mapa
- Error → toast con mensaje (incluyendo "Límite diario alcanzado")

---

### TAREA-1.14 — Componentes: TopBar y FAB
**Modelo:** `Gemini Pro (Low)`  
**Skill:** `frontend-design.md`

`TopBar`: logo/nombre + "Aguilares, Tucumán" + contador de reportes activos  
`FAB`: botón circular fijo, esquina inferior derecha, z-index sobre el mapa, animación de escala al aparecer

---

### TAREA-1.15 — Integración del mapa principal
**Modelo:** `Sonnet 4.6`  
**Skills:** `leaflet-nextjs-patterns.md`, `ciudadalerta-conventions.md`

`src/components/map/MapView.tsx` — integrar todo:
- `MapControls` flotante sobre el mapa
- Condicional: si `viewMode === 'markers'` → `<ReportMarkers>` ; si `'heatmap'` → `<HeatmapLayer>`
- `useMapFilter` conectado a ambas capas
- Estado del reporte seleccionado → abre `ReportPopup` (bottom sheet en móvil)
- Estado de apertura del `ReportDrawer` manejado desde acá
- Forzar remount del mini mapa con `key` cuando el drawer se cierra

---

### TAREA-1.16 — Page principal y layout
**Modelo:** `Sonnet 4.6`  
**Skill:** `frontend-design.md`

`src/app/page.tsx`: Server Component que renderiza `TopBar` + `MapView` (dynamic) + `FAB`  
`src/app/layout.tsx`: Metadata, Google Fonts, `viewport-fit=cover`, `theme-color` para barra del navegador móvil

---

### TAREA-1.17 — Vista lista de reportes (OPCIONAL MVP)
**Modelo:** `Gemini Pro (Low)`  
**Skill:** `frontend-design.md`

Panel deslizable desde la parte inferior: lista de reportes activos ordenados por fecha.  
Cada tarjeta: emoji + categoría + título + fecha relativa.  
Toggle: "Ver mapa / Ver lista" en la TopBar.

> Marcar como opcional. Si el tiempo aprieta, se puede posponer a Fase 2.

---

### TAREA-1.18 — QA y verificaciones antes del deploy
**Modelo:** `Gemini Pro (Low)` para checklist / manual para ejecución

```
QA de API:
- POST con body inválido → 400 con errores Zod
- POST con coordenadas fuera del bbox → 400
- POST 6 veces con mismo fingerprint → 429 en el 6° request
- POST 11 veces desde misma IP → 429 en el 11° request
- GET /api/reports → solo reportes ACTIVE, sin campos privados
- GET /api/streetview sin API key configurada → 404 limpio

QA Mobile (375px):
- Mapa ocupa toda la pantalla sin scroll externo
- FAB visible y no tapado por la barra del navegador
- Bottom Sheet no tapa el mini mapa del formulario
- Chips de filtro hacen scroll horizontal sin romper el layout
- Touch targets >= 44px en todos los controles

QA Seguridad:
- Abrir DevTools → Network → verificar que /api/reports no retorna ipHash ni fingerprintHash
- Verificar en Firestore Console que report_private_meta no se puede leer desde el browser
- Verificar que env vars no aparecen en el bundle (Sources → js files)

QA Build:
- npm run build sin errores de TypeScript
- npm run build sin warnings de tipos
```

---

### TAREA-1.19 — Deploy en Vercel
**Modelo:** `Gemini Flash`

1. Push a GitHub (repositorio privado)
2. Conectar con Vercel, configurar variables de entorno
3. Verificar `firestore.rules` con `allow read, write: if false` deployadas
4. Verificar `firestore.indexes.json` deployados
5. Primera carga en producción: verificar que el mapa carga correctamente
6. Probar crear un reporte real desde un celular

---

## 12. FASE 2 — Cuentas & Avanzado

> Planificar solo después de que el MVP esté en producción y con usuarios reales.

- **Autenticación**: Firebase Auth (Google + email)
- **Botón Confirmar / verifiedCount**: endpoint seguro, solo usuarios autenticados
- **Panel de moderación**: `/admin` para resolver/duplicar reportes
- **Subida de fotos**: Firebase Storage, adjuntar foto al reporte
- **Firebase App Check**: protección adicional contra abuso de la API
- **Geohash para queries geoespaciales**: optimización de performance si hay miles de reportes
- **Filtro temporal**: última semana / mes
- **Notificaciones push**: Firebase Cloud Messaging
- **PWA completa**: service worker, offline fallback, iconos completos

---

## 13. Variables de Entorno

```bash
# .env.example

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Maps Static Street View API
# Habilitar en Google Cloud Console → APIs & Services → Street View Static API
# Restringir a tu dominio de Vercel
GOOGLE_MAPS_API_KEY=AIzaSy...

# Salt para hashing (generar: openssl rand -hex 32)
HASH_SALT=your-64-char-random-hex-string

# Rate limiting
MAX_REPORTS_PER_DAY_FP=5
MAX_REPORTS_PER_DAY_IP=10
RATE_LIMIT_WINDOW_HOURS=24

# CORS / Origin validation
ALLOWED_ORIGIN=https://ciudadalerta.vercel.app
```

---

## 14. Checklist de Lanzamiento MVP

### Funcional
- [ ] Mapa carga con Aguilares centrado y maxBounds activo
- [ ] No se puede hacer scroll fuera del bbox de Aguilares
- [ ] Se pueden crear reportes de las 9 categorías
- [ ] El mini mapa del formulario permite marcar el punto exacto
- [ ] Los markers aparecen en el mapa tras crear un reporte (en el siguiente poll de 30s)
- [ ] El mapa de calor funciona con filtros de categorías
- [ ] El popup muestra Street View o placeholder si no hay imagen
- [ ] Rate limiting funciona: 6° reporte desde mismo navegador → rechazado
- [ ] Rate limiting por IP: 11° reporte desde misma IP → rechazado
- [ ] Filtros de categoría funcionan en modo markers y heatmap

### Seguridad
- [ ] `firestore.rules` deployadas con `allow read, write: if false` total
- [ ] Las API keys no aparecen en el bundle del cliente (DevTools → Sources)
- [ ] El response de GET /api/reports no contiene ipHash, fingerprintHash ni userAgent
- [ ] La colección `report_private_meta` no es accesible desde el browser
- [ ] Validación de Origin activa en producción

### Performance
- [ ] Lighthouse Mobile Performance Score > 75
- [ ] Leaflet y plugins cargan como code-split (no bloquean LCP)
- [ ] GET /api/reports tiene `s-maxage=30` en el response
- [ ] Street View images tienen `max-age=86400`

### UX / Mobile
- [ ] Funciona en iPhone SE (375px)
- [ ] Touch targets >= 44px
- [ ] Bottom Sheet no tapa el mini mapa
- [ ] Toasts visibles y se auto-cierran
- [ ] Fallo de Street View (sin API key o sin cobertura) → placeholder elegante, no error visible

### Antes del lanzamiento público
- [ ] Página `/privacidad` con: qué datos se guardan, para qué se usan, que no se muestra identidad
- [ ] Probar en Android (Chrome) y iOS (Safari) en dispositivos reales
- [ ] Crear al menos 5 reportes de prueba para que el mapa no esté vacío al lanzar

---

*CiudadAlerta — Plan Maestro v1.1*  
*Revisado y corregido post-análisis crítico. Listo para ejecutar.*
