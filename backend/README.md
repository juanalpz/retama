# Retama - Backend API

API REST del marketplace inmobiliario desarrollada con Node.js, Express 5, TypeScript, TypeORM y PostgreSQL.

## Tecnologías Principales
- **Node.js + Express 5**
- **TypeScript**
- **TypeORM** (ORM para persistencia)
- **PostgreSQL** (Base de datos relacional)
- **Zod** (Validación de esquemas y tipos)
- **Bcrypt / JWT** (Autenticación y Seguridad)

---

## Características Implementadas

### 1. Autenticación y Autorización
- Registro unificado de Vendedores e Inmobiliarias.
- Encriptación de contraseñas con Bcrypt.
- Sistema de login con emisión de tokens JWT.
- Middleware de protección de rutas (`authenticateToken`) y control de roles (`authorizeRoles`).

### 2. Catálogo Público
- **Inmobiliarias**: Listado paginado, búsqueda por nombre de fantasía, perfil detallado, visualización de propiedades asociadas.
- **Propiedades**: Listado paginado con soporte para múltiples filtros (tipo, operación, rango de precios, ambientes, etc.), ordenamiento dinámico.
- **Interacciones Públicas**:
  - Los usuarios pueden dejar reseñas (1 a 5 estrellas) a las inmobiliarias.
  - Los usuarios pueden enviar preguntas a propiedades específicas.
  - Los usuarios pueden solicitar turnos de visitas para propiedades.

### 3. Dashboard Privado (Vendedor)
- **Gestión de la Inmobiliaria**: Edición del perfil, ABM de teléfonos y correos de contacto, opción de baja (soft-delete).
- **Gestión de Propiedades**: ABM completo de propiedades. Las propiedades se crean en estado `BORRADOR`.
- **Máquina de Estados de Propiedades**: Lógica estricta de transición de estados (`BORRADOR` -> `PUBLICADA` -> `RESERVADA` -> `VENDIDA` / `ALQUILADA` / `CANCELADA`).
- **Galería de Fotos**: Subida de fotos, ordenamiento y selección de imagen de portada (Portada única garantizada).
- **Consultas y Visitas**: Visualización de consultas y solicitudes de visitas recibidas. Capacidad para responder a las preguntas y cambiar el estado de las visitas (`PENDIENTE`, `CONFIRMADA`, `REALIZADA`, `CANCELADA`, `RECHAZADA`).
- **Feed de Actividad (Notificaciones)**: Sistema de notificaciones *in-app* alimentado automáticamente por eventos (nuevas preguntas, visitas, reseñas, cambios de estado). Soporte para conteo de no leídos (badge) y marcar como leído.
- **Reportes / Analíticas**: Dashboard estadístico con el pipeline de propiedades por estado, tráfico de los últimos 30 días y métricas de rendimiento (ej. tiempo promedio en mercado).

---

## Modelo de Dominio (Entidades)

- `Seller` (Usuario Vendedor)
- `Agency`, `AgencyPhone`, `AgencyEmail` (Perfil y Contacto de la Inmobiliaria)
- `Property`, `PropertyPhoto`, `PropertyStatusHistory` (Inmuebles)
- `PropertyQuestion` (Consultas de usuarios)
- `Visit` (Solicitudes de turnos de visita)
- `ReviewInmobiliaria` (Calificaciones)
- `Activity` (Feed de Novedades y Notificaciones)

---

## Estructura del Proyecto

```text
src/
  config/        # Configuración (Data Source TypeORM, Variables de Entorno)
  controllers/   # Lógica de entrada/salida HTTP (Controladores)
  entities/      # Definición del modelo relacional (TypeORM)
  middlewares/   # Middlewares globales y de rutas (Auth, Error Handler, Validator)
  repositories/  # Capa de Acceso a Datos (Query Builders, Custom Repos)
  routes/        # Definición de las Rutas de la API agrupadas lógicamente
  schemas/       # Esquemas de Validación (Zod)
  services/      # Capa de Reglas de Negocio (Lógica principal de la aplicación)
  utils/         # Utilidades generales (Hashing, JWT)
  app.ts         # Configuración e instanciación principal de Express
  index.ts       # Punto de entrada de la aplicación
```

---

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Copiar entorno de ejemplo
cp .env.example .env

# Iniciar el servidor en modo desarrollo (Hot-reload)
npm run dev

# Compilar para producción
npm run build
```

> **Nota**: Las tablas deben crearse mediante migraciones. `synchronize` queda desactivado por diseño en el `data-source` para evitar daños accidentales a la base de datos en producción.