# Documentación de la API REST - Retama

Esta es la documentación oficial de los endpoints de la plataforma Retama.
URL Base de la API: `http://localhost:3000/api`

## 1. Endpoints Públicos

### Health Check
- `GET /health`
  - **Descripción**: Verifica el estado y disponibilidad de la API REST.
  - **Acceso**: Público

### Propiedades (Catálogo Público)
- `GET /properties`
  - **Descripción**: Lista todas las propiedades en estado `PUBLICADA`. Permite filtros por query params (`operacion`, `tipo`, `minPrice`, `maxPrice`, etc.).
  - **Acceso**: Público
- `GET /properties/:id`
  - **Descripción**: Obtiene los detalles de una propiedad pública específica por su ID.
  - **Acceso**: Público
- `GET /properties/:id/questions`
  - **Descripción**: Obtiene las preguntas y respuestas públicas asociadas a una propiedad.
  - **Acceso**: Público
- `POST /properties/:id/questions`
  - **Descripción**: Crea una nueva pregunta para el vendedor de la propiedad.
  - **Body**: `{ "nombreSolicitante", "emailSolicitante", "mensaje" }`
  - **Acceso**: Público
- `POST /properties/:id/visits`
  - **Descripción**: Solicita un turno de visita para una propiedad.
  - **Body**: `{ "nombreVisitante", "apellidoVisitante", "fechaPropuesta" }`
  - **Acceso**: Público

### Inmobiliarias (Catálogo Público)
- `GET /agencies`
  - **Descripción**: Lista de todas las agencias/inmobiliarias.
  - **Acceso**: Público
- `GET /agencies/:id`
  - **Descripción**: Obtiene los detalles de una inmobiliaria específica.
  - **Acceso**: Público
- `GET /agencies/:id/properties`
  - **Descripción**: Obtiene las propiedades de una inmobiliaria específica.
  - **Acceso**: Público
- `GET /agencies/:id/reviews`
  - **Descripción**: Obtiene las reseñas de una inmobiliaria específica.
  - **Acceso**: Público
- `POST /agencies/:id/reviews`
  - **Descripción**: Crea una reseña para una inmobiliaria específica.
  - **Body**: `{ "nombreSolicitante", "emailSolicitante", "calificacion", "comentario" }`
  - **Acceso**: Público

---

## 2. Autenticación

- `POST /auth/register`
  - **Descripción**: Registro de nuevo vendedor y creación simultánea de su perfil de inmobiliaria.
  - **Body**: `{ "nombre", "apellido", "email", "password", "nombreFantasia", "descripcion" }`
  - **Acceso**: Público
- `POST /auth/login`
  - **Descripción**: Inicio de sesión del vendedor para obtener el token JWT.
  - **Body**: `{ "email", "password" }`
  - **Acceso**: Público
- `GET /auth/me`
  - **Descripción**: Obtiene el perfil del vendedor autenticado (incluye su inmobiliaria) para restaurar la sesión en frontend.
  - **Acceso**: Privado (Requiere JWT)

---

## 3. Endpoints Privados (Dashboard Vendedor)

> **Importante**: Todas estas rutas requieren un token JWT válido con rol `VENDEDOR` o `ADMIN` en el Header `Authorization: Bearer <token>`.

### Perfil de la Inmobiliaria
- `GET /vendedor/inmobiliaria`
  - **Descripción**: Obtiene el perfil de la inmobiliaria del vendedor autenticado.
- `PUT /vendedor/inmobiliaria`
  - **Descripción**: Actualiza el perfil de la inmobiliaria.
- `POST /vendedor/inmobiliaria/telefonos`
  - **Descripción**: Agrega un teléfono de contacto.
- `DELETE /vendedor/inmobiliaria/telefonos/:id`
  - **Descripción**: Elimina un teléfono.
- `POST /vendedor/inmobiliaria/correos`
  - **Descripción**: Agrega un correo electrónico de contacto.
- `DELETE /vendedor/inmobiliaria/correos/:id`
  - **Descripción**: Elimina un correo electrónico.
- `DELETE /vendedor/inmobiliaria`
  - **Descripción**: Elimina de forma permanente el perfil de la inmobiliaria.

### Gestión de Propiedades
- `GET /vendedor/propiedades`
  - **Descripción**: Lista las propiedades de la inmobiliaria. Filtros: `?estado=PUBLICADA`.
- `GET /vendedor/propiedades/:id`
  - **Descripción**: Obtiene el detalle privado de una de sus propiedades.
- `POST /vendedor/propiedades`
  - **Descripción**: Crea una nueva propiedad (Inicia en estado `BORRADOR`).
- `PUT /vendedor/propiedades/:id`
  - **Descripción**: Actualiza los datos de la propiedad (No permitido si está Vendida/Alquilada).
- `PATCH /vendedor/propiedades/:id/estado`
  - **Descripción**: Cambia el estado (Ej: `BORRADOR` -> `PUBLICADA`).
  - **Body**: `{ "nuevoEstado": "PUBLICADA" }`
- `DELETE /vendedor/propiedades/:id`
  - **Descripción**: Da de baja (Soft-Delete a `CANCELADA`) una propiedad.

### Gestión de Fotos de Propiedades
- `GET /vendedor/propiedades/:id/fotos`
  - **Descripción**: Obtiene todas las fotos de una propiedad.
- `POST /vendedor/propiedades/:id/fotos`
  - **Descripción**: Agrega una nueva foto.
  - **Body**: `{ "url", "orden", "esPortada" }`
- `PATCH /vendedor/propiedades/:id/fotos/:photoId`
  - **Descripción**: Edita el orden de una foto o la marca como portada.
- `DELETE /vendedor/propiedades/:id/fotos/:photoId`
  - **Descripción**: Elimina una foto.

### Feed de Actividad y Notificaciones
- `GET /vendedor/actividad`
  - **Descripción**: Lista el feed cronológico. Filtros: `?tipo=COMENTARIO`, `?leido=false`.
- `GET /vendedor/actividad/sin-leer`
  - **Descripción**: Obtiene el número total de notificaciones no leídas (para el Badge).
- `PATCH /vendedor/actividad/leer-todas`
  - **Descripción**: Marca todas las notificaciones pendientes como leídas.
- `PATCH /vendedor/actividad/:id/leer`
  - **Descripción**: Marca una notificación individual como leída.

### Gestión de Comentarios y Consultas
- `GET /vendedor/comentarios`
  - **Descripción**: Lista todas las consultas recibidas. Filtro: `?sinResponder=true`.
- `GET /vendedor/propiedades/:id/comentarios`
  - **Descripción**: Lista consultas de una propiedad particular.
- `PUT /vendedor/comentarios/:id/respuesta`
  - **Descripción**: Permite al vendedor responder a una consulta del cliente.
  - **Body**: `{ "respuestaVendedor" }`

### Gestión de Visitas
- `GET /vendedor/visitas`
  - **Descripción**: Lista todas las solicitudes de visitas recibidas. Filtro: `?estado=PENDIENTE`.
- `GET /vendedor/propiedades/:id/visitas`
  - **Descripción**: Lista visitas para una propiedad particular.
- `PUT /vendedor/visitas/:id/estado`
  - **Descripción**: Actualiza el estado de la visita (Ej: PENDIENTE -> CONFIRMADA).
  - **Body**: `{ "estado": "CONFIRMADA" }`

### Analíticas y Reportes
- `GET /vendedor/reportes`
  - **Descripción**: Obtiene estadísticas consolidadas del vendedor (Pipeline de propiedades, tiempos en mercado y tendencias).
