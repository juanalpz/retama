# Retama - Frontend

Aplicación cliente del marketplace inmobiliario, hecha con React 19, TypeScript, Vite y Tailwind CSS.

## Cómo levantarlo

Necesita el backend corriendo (ver [`../backend/README.md`](../backend/README.md)).

```bash
# 1. instalar dependencias
npm install

# 2. crear el archivo de entorno
cp .env.example .env

# 3. iniciar en modo desarrollo (http://localhost:5173)
npm run dev
```

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `VITE_API_URL` | URL base de la API | `http://localhost:3000/api` |

`npm run build` compila la app y verifica los tipos.

## Tests

```bash
npm test
```

Los tests corren con Vitest y Testing Library en un navegador simulado (jsdom): no hace falta tener el backend ni la base levantados, porque la capa de servicios se reemplaza por respuestas simuladas. Cada test monta la aplicación completa parada en una URL y la usa como lo haría una persona (escribir, hacer click, leer lo que aparece).

| Archivo | Qué cubre |
| --- | --- |
| `tests/api-client.test.ts` | Cliente de API: URL base, token en el header, normalización de errores, cierre de sesión ante un 401, rutas de cada servicio y que ningún componente use axios directo |
| `tests/routing-auth.test.tsx` | Ruteo y layouts, rutas protegidas, registro, login y sesión |
| `tests/public.test.tsx` | Inicio (filtros en la URL, búsqueda, orden, paginado), detalle, consultas, pedido de visita, sitio de la inmobiliaria y reseñas |
| `tests/panel.test.tsx` | Mis propiedades, ciclo de vida, formulario y fotos, datos de la inmobiliaria, visitas, consultas, actividad y reportes |
| `tests/utils.test.ts` | Acciones por estado, validación del formulario de propiedad, formato y los hooks `usePolling` y `useSubmitLock` |

`npm run test:watch` los deja corriendo y repite los afectados al guardar un archivo. `npx tsc -p tests/tsconfig.json` verifica los tipos de los tests.

## Pantallas

| Pantalla | Ruta | Sesión |
| --- | --- | --- |
| Listado de propiedades | `/` | no |
| Detalle de propiedad, consultas y pedido de visita | `/propiedades/:id` | no |
| Directorio de inmobiliarias | `/inmobiliarias` | no |
| Sitio de la inmobiliaria y reseñas | `/inmobiliarias/:id` | no |
| Ingreso y registro | `/login`, `/registro` | no |
| Mis propiedades (listado y ciclo de vida) | `/panel/propiedades` | sí |
| Alta y edición de propiedad, con fotos | `/panel/propiedades/nueva`, `/panel/propiedades/:id/editar` | sí |
| Datos de la inmobiliaria | `/panel/inmobiliaria` | sí |
| Solicitudes de visita | `/panel/visitas` | sí |
| Consultas recibidas | `/panel/consultas` | sí |
| Actividad | `/panel/actividad` | sí |
| Reportes | `/panel/reportes` | sí |

Las rutas de `/panel` redirigen a `/login` si no hay sesión y, después de ingresar, vuelven a la pantalla pedida. Para probar: `juan@inmobiliaria.com` / `123456` (lo crea el seed del backend).

## Estructura

```text
public/
  fotos/         # fotos de las propiedades del seed (el backend guarda la ruta /fotos/foto-NN.jpg)
src/
  components/
    agency/      # formulario de reseña
    layout/      # layout público, layout del panel y ruta protegida
    panel/       # piezas del panel: fila de propiedad, formulario, gestor de fotos
    properties/  # tarjeta, filtros, galería, consultas y pedido de visita
    ui/          # piezas reutilizables: botón, campos, modal, confirmación, paginador, estados
  config/        # variables de entorno
  context/       # sesión (AuthContext) y contador de actividad sin leer (UnreadContext)
  hooks/         # useAuth, useApi, usePolling, useProperties, useTags, usePropertySearchParams
  pages/         # una página por ruta; las del panel están en pages/panel
  services/      # única capa que habla con la API (http, session, auth, properties, agencies, panel)
  types/         # tipos de las respuestas de la API
  utils/         # formato, fechas, estados y lógica del formulario de propiedad
  App.tsx        # ruteo
  index.css      # Tailwind y tema (paleta del sitio)
tests/           # tests de la aplicación (ver la sección Tests)
```

## Convenciones

- Ningún componente llama a axios directamente: todo pasa por `services/`.
- Los errores de la API llegan normalizados como `{ status, message, fields }`.
- Los filtros del listado viven en la URL, así un link se puede compartir.
- Las acciones destructivas pasan siempre por un diálogo de confirmación.
- La interfaz ofrece solo las transiciones de estado válidas (`utils/status.ts`), pero quien decide es el backend: si rechaza, se muestra el error y el estado en pantalla no cambia.
- El contador de actividad se consulta cada 15 segundos mientras se está en el panel.
- Estilos con clases de Tailwind. La paleta `brand` está definida en `index.css`.
- Cada función tiene un comentario que dice qué hace, qué recibe y qué retorna.
