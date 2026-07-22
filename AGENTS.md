# AGENTS.md

Reglas para trabajar en esta demo:

- Trabajar solo dentro de `aguilaresV2`; no tocar `monteros` ni la app raíz salvo pedido explícito.
- El mapa de Aguilares es público. Exigir autenticación únicamente al iniciar la creación de una alerta o al entrar a funciones privadas.
- En este clon, Supabase es la única fuente de identidad y sesiones. Firebase se limita a App Check y notificaciones push; no reintroducir Firebase Auth.
- No rechazar la creación de alertas por límites municipales. El mapa principal sí debe mantener la cámara restringida visualmente a Aguilares.
- Antes de editar, revisar el flujo real con codegraph o búsqueda local. No refactorizar a ciegas.
- Preferir el patrón existente del proyecto antes de crear helpers, tipos o componentes nuevos.
- Al crear código nuevo, empezar en el archivo dueño del flujo. Extraer después solo si ya hay duplicación real o una responsabilidad claramente separada.
- Mantener cada archivo con una responsabilidad principal. Si una vista necesita datos, tabla, acciones y formularios, separar como máximo en hook de datos, vista y formulario/sheet.
- No mezclar acceso a API, estado de UI y render grande en el mismo bloque cuando alguno pueda vivir como hook o componente ya existente.
- No meter mocks nuevos en vistas funcionales. Si falta backend, marcarlo explícitamente y aislarlo en constantes temporales.
- No duplicar labels, opciones o estados si ya existen en `shared`, `constants`, `types` o vienen del endpoint.
- Los nombres visibles deben ser de negocio y en español claro; evitar textos técnicos o inventados.
- Refactorizar solo por responsabilidad clara: hook de datos, vista, formulario, tabla o helper compartido. No crear archivos chicos solo para bajar líneas.
- Mantener componentes relacionados juntos cuando se entienden mejor como una unidad, por ejemplo fila + acciones + filtros de una tabla.
- Evitar abstracciones “para después”. Si tiene un solo uso y no simplifica lectura real, dejarlo inline.
- Para admin, mantener estilos y UX consistentes con las secciones existentes: `AdminDataTable`, `AdminSheetForm`, shadcn y `sonner`.
- Las constantes editables del sistema deben venir del backend cuando ya exista endpoint; no volver a hardcodear categorías/áreas reales en UI.
- Cuando se cambie una acción visible para el usuario, agregar feedback con `sonner`.
- Para tablas admin, usar `AdminDataTable` y sus filtros/paginación antes de crear otra tabla manual.
- Para formularios laterales, usar `AdminSheetForm`; no hacer sheets manuales salvo que el formulario no encaje.
- Para acciones, usar iconos con hover, cursor pointer, tooltip y toast cuando modifiquen datos.
- En popovers admin dentro de tablas o sheets, definir `background`, `color`, `--popover` y `--popover-foreground` en la clase propia del `PopoverContent`; no confiar en tokens heredados ni clases de color no existentes.
- Para fechas visibles, incluir año.
- Después de cambios TypeScript/React, correr `pnpm lint` y `pnpm build`.
