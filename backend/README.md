# Retama - Backend API

API REST del marketplace inmobiliario, hecha con Node.js, Express 5, TypeScript, TypeORM y PostgreSQL.

- Documentación de endpoints: [`../docs/api-documentation.md`](../docs/api-documentation.md)
- Colección de requests lista para ejecutar: [`requests.http`](requests.http)

## Tecnologías

- **Node.js + Express 5**
- **TypeScript**
- **TypeORM** sobre **PostgreSQL**
- **Zod** para validar los datos de entrada
- **bcrypt + JWT** para autenticación

## Cómo levantar el proyecto

Para levantar la aplicación completa con Docker (base, backend y frontend juntos), ver el [README de la raíz](../README.md). Lo que sigue es para desarrollar el backend en la máquina.

Requisitos: Node.js 20 o superior y Docker (o un PostgreSQL propio).

```bash
# 1. instalar dependencias
npm install

# 2. crear el archivo de entorno y completar JWT_SECRET
cp .env.example .env

# 3. levantar postgres (queda en el puerto 15432)
docker compose up -d

# 4. cargar datos de prueba
npm run seed

# 5. iniciar la api en modo desarrollo (http://localhost:3000/api)
npm run dev
```

Las tablas se crean solas al iniciar: TypeORM las genera a partir de las entidades (`synchronize: true`).

Vendedor de prueba que deja el seed: `juan@inmobiliaria.com` / `123456`.

### Variables de entorno

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `PORT` | Puerto de la API | `3000` |
| `DB_HOST`, `DB_PORT` | Servidor de PostgreSQL | `127.0.0.1`, `15432` |
| `DB_USERNAME`, `DB_PASSWORD` | Credenciales de PostgreSQL | `postgres`, `postgres` |
| `DB_NAME` | Base de desarrollo | `retama_db` |
| `DB_NAME_TEST` | Base que usan los tests | `retama_test` |
| `JWT_SECRET` | Clave para firmar los tokens | (definir una propia) |
| `CORS_ORIGIN` | Orígenes del front permitidos, separados por coma | `http://localhost:5173` |

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Inicia la API con recarga automática |
| `npm run seed` | Vacía la base y carga los datos de prueba |
| `npm test` | Corre los tests de integración |
| `npm run build` | Compila a `dist/` |
| `npm start` | Inicia la API compilada (`dist/server.js`) |
| `npm run seed:prod` | Carga los datos de prueba con el código ya compilado (lo usa la imagen de Docker) |

## Tests

```bash
npm test
```

Los tests levantan la aplicación real y recorren todos los endpoints con sus casos válidos y sus errores (registro y login, máquina de estados, filtros de búsqueda, consultas, visitas, reseñas, actividad, reportes y permisos). También revisan el modelo de datos: que existan las entidades del dominio y que cada relación defina su `onDelete`.

Usan una base aparte (`DB_NAME_TEST`), que se crea sola si no existe y se vacía en cada corrida. La base de desarrollo no se toca. Solo hace falta que PostgreSQL esté levantado.

## Funcionalidad

### Autenticación

- Registro del vendedor y de su inmobiliaria en un solo paso, dentro de una transacción.
- Email y nombre de fantasía únicos (409 si se repiten).
- Contraseñas hasheadas con bcrypt; el hash nunca sale en una respuesta.
- Login con token JWT de 2 horas. Las rutas privadas responden 401 sin un token válido.

### Catálogo público

- Listado de propiedades publicadas con filtros combinables (tipo, operación, precio, zona, ambientes, amenities), texto libre, orden y paginado.
- Detalle de propiedad con galería, amenities e inmobiliaria.
- Consultas, solicitudes de visita y reseñas sin necesidad de registrarse.
- Perfil público de la inmobiliaria con contacto, propiedades, reseñas y calificación promedio.

### Panel del vendedor

- Edición y baja de la inmobiliaria (no se puede eliminar con propiedades publicadas o reservadas).
- ABM de propiedades y galería de fotos con una única portada.
- Máquina de estados de la propiedad, con historial de cada cambio.
- Consultas recibidas, con una única respuesta por consulta.
- Solicitudes de visita con su propia máquina de estados.
- Feed de actividad con contador de no leídas.
- Dashboard de reportes: propiedades por estado, evolución mensual y tiempo promedio en mercado.

### Reglas de negocio

```
Propiedad:  BORRADOR -> PUBLICADA -> RESERVADA -> VENDIDA / ALQUILADA
            PUBLICADA <-> PAUSADA
            CANCELADA desde cualquier estado activo

Visita:     PENDIENTE -> CONFIRMADA -> REALIZADA
            CANCELADA / RECHAZADA mientras siga abierta
```

- Una propiedad vendida, alquilada o cancelada no se edita, pero sigue admitiendo consultas.
- Una propiedad con visitas confirmadas pendientes no se edita ni se da de baja.
- Para publicar hace falta al menos una foto.
- Solo se piden visitas a propiedades publicadas, con fecha futura.
- Las transiciones se validan siempre en el servidor.

## Formato de error

Todas las respuestas de error tienen la forma `{ error, details? }`. Ver el detalle, los códigos de estado y la forma de cada respuesta en la [documentación de la API](../docs/api-documentation.md).

## Comentarios del código

Cada función tiene un comentario que dice qué hace, qué recibe (`@param`) y qué retorna (`@returns`). Los comentarios van en minúscula y sin acentos.

## Estructura del proyecto

```text
src/
  config/        # conexión a la base y variables de entorno
  controllers/   # entrada y salida http
  entities/      # modelo de datos (typeorm)
  middlewares/   # autenticación, validación y manejo de errores
  repositories/  # acceso a datos
  routes/        # definición de rutas
  schemas/       # validaciones (zod) y máquinas de estados
  seeds/         # datos de prueba
  services/      # reglas de negocio
  utils/         # helpers (jwt, ids, paginado, tipos de propiedad, resultados)
  app.ts         # configuración de express
  server.ts      # punto de entrada: conecta la base y levanta el servidor
tests/
  api.test.ts    # tests de integración
requests.http    # colección de requests
```

## Modelo de dominio

- `Seller`: vendedor
- `Agency`, `AgencyPhone`, `AgencyEmail`: inmobiliaria y sus datos de contacto
- `Property`, `PropertyPhoto`, `PropertyTag`, `Tag`, `PropertyStatusHistory`: propiedad, galería, amenities e historial de estados
- `PropertyQuestion`: consulta sobre una propiedad
- `Visit`: solicitud de visita
- `Review`: reseña de una inmobiliaria
- `Activity`: feed de actividad del vendedor
