# Documentación de la API REST - Retama

URL base: `http://localhost:3000/api`

- Requests listos para ejecutar: [`backend/requests.http`](../backend/requests.http)

## Convenciones generales

### Autenticación

Las rutas privadas (`/vendedor/...` y `/auth/me`) esperan el header:

```
Authorization: Bearer <token>
```

El token se obtiene en `POST /auth/register` o `POST /auth/login` y dura 2 horas.

### Formato de error

Todas las respuestas de error tienen la misma forma:

```json
{ "error": "Datos inválidos", "details": [{ "field": "precio", "message": "El precio debe ser mayor a 0" }] }
```

`details` es opcional. Aparece cuando falla una validación (400) o cuando un dato único ya existe (409), e indica el campo que falló.

### Códigos de estado

| Código | Cuándo |
| --- | --- |
| 200 / 201 | Operación exitosa / recurso creado |
| 400 | Body inválido, id con formato inválido en el panel, o transición de estado no permitida |
| 401 | Falta el token, es inválido o expiró; o credenciales incorrectas |
| 403 | El recurso existe pero pertenece a otro vendedor, o el rol no alcanza |
| 404 | El recurso o la ruta no existen |
| 409 | El pedido es válido pero choca con una regla de negocio (dato único repetido, propiedad cerrada, visitas confirmadas pendientes, etc.) |
| 500 | Error inesperado. Responde un mensaje genérico, nunca el stack trace. |

### Paginación

Los listados aceptan `?page=1&limit=10` (límite máximo 50). En este documento, `Paginado<X>` significa:

```json
{ "data": [X], "total": 37, "page": 1, "limit": 10, "totalPages": 4 }
```

Cantidad por página por defecto: 12 en propiedades, 20 en actividad y 10 en el resto. Un valor inválido en `page` o `limit` no da error: se usa el valor por defecto.

---

## Modelos

Formas de los objetos que devuelve la API. Las fechas son textos en formato ISO.

### Propiedad

```json
{
  "id": 1,
  "titulo": "Depto 2 ambientes con vista al mar",
  "descripcion": "Departamento luminoso a dos cuadras de la playa",
  "tipoPropiedad": "DEPARTAMENTO",
  "idTipoPropiedad": 2,
  "operacion": "ALQUILER",
  "precio": 400,
  "moneda": "USD",
  "direccionLinea1": "Av. del Mar 320",
  "barrioZona": "Centro",
  "superficieTotalM2": 50,
  "superficieCubiertaM2": 45,
  "ambientes": 2,
  "dormitorios": 1,
  "banios": 1,
  "antiguedad": 8,
  "estado": "PUBLICADA",
  "createdAt": "2026-10-07T22:36:37.956Z",
  "updatedAt": "2026-10-07T22:36:37.956Z",
  "fotos": [{ "id": 1, "url": "https://...", "orden": 0, "esPortada": true }],
  "tags": [{ "id": 1, "tag": { "id": 1, "tag": "Cochera" } }],
  "agency": { "id": 1, "nombreFantasia": "Inmobiliaria del Mar" }
}
```

- `tipoPropiedad`: `CASA`, `DEPARTAMENTO`, `TERRENO` o `COMERCIAL`. `idTipoPropiedad` es el mismo dato como número interno.
- `operacion`: `VENTA` o `ALQUILER`. `moneda`: `ARS` o `USD`.
- `estado`: `BORRADOR`, `PUBLICADA`, `PAUSADA`, `RESERVADA`, `VENDIDA`, `ALQUILADA` o `CANCELADA`.
- `superficieCubiertaM2`, `ambientes`, `dormitorios`, `banios` y `antiguedad` pueden ser `null`. En un `TERRENO` los cuatro primeros son siempre `null`.
- `tags`: el nombre de cada amenity está en `tags[i].tag.tag` y su id en `tags[i].tag.id`.
- `agency`: en los listados trae solo los datos básicos de la inmobiliaria. En el detalle trae además `telefonos`, `correos` y `seller: { id }`.
- El listado del panel (`GET /vendedor/propiedades`) no incluye `tags`. El detalle del panel agrega `historialEstados`.

### Inmobiliaria

```json
{
  "id": 1,
  "nombreFantasia": "Inmobiliaria del Mar",
  "descripcion": "Más de 20 años vendiendo y alquilando propiedades en Pinamar.",
  "logoUrl": null,
  "direccionLinea1": "Av. Bunge 1250, Pinamar",
  "direccionLinea2": null,
  "createdAt": "2026-11-18T22:36:37.956Z",
  "telefonos": [{ "id": 1, "telefono": "02254-48-1111", "tipoTelefono": "Principal" }],
  "correos": [{ "id": 1, "correo": "juan@inmobiliaria.com", "tipoCorreo": "Principal" }],
  "calificacionPromedio": 4,
  "cantidadResenias": 3
}
```

- `calificacionPromedio` y `cantidadResenias` vienen en `GET /agencies` y en `GET /agencies/:id`. El promedio es `null` si todavía no hay reseñas.
- Ninguna respuesta pública incluye datos del vendedor.

### Consulta

```json
{ "id": 1, "nombreSolicitante": "Ana", "pregunta": "¿Admite mascotas?", "respuestaVendedor": null, "fechaCreacion": "2026-11-15T22:36:38.000Z" }
```

`respuestaVendedor` es `null` mientras no tenga respuesta. Al crear o responder una consulta viene además `property: { id, titulo }`, y en los listados del panel viene `property` con los datos de la propiedad.

### Visita

```json
{
  "id": 1,
  "nombreVisitante": "María",
  "apellidoVisitante": "López",
  "telefonoVisitante": "011-4444-4444",
  "fechaPropuesta": "2026-11-21T22:36:38.000Z",
  "mensajeAsociado": "Puedo por la tarde.",
  "estado": "PENDIENTE",
  "fechaCreacion": "2026-11-18T22:36:38.000Z"
}
```

`estado`: `PENDIENTE`, `CONFIRMADA`, `REALIZADA`, `CANCELADA` o `RECHAZADA`. `apellidoVisitante` y `mensajeAsociado` pueden ser `null`. Igual que en las consultas, puede venir con `property`.

### Reseña

```json
{ "id": 1, "nombreSolicitante": "Laura", "resenia": "Muy buena atención", "calificacion": 5, "fechaCreacion": "2026-10-29T22:36:37.000Z" }
```

### Actividad

```json
{ "id": 1, "tipo": "COMENTARIO", "referenciaId": 2, "referenciaTipo": "pregunta", "mensaje": "Nueva consulta de Luis en la propiedad: ...", "leido": false, "fechaCreacion": "2026-11-17T22:36:38.000Z" }
```

| `tipo` | `referenciaTipo` | `referenciaId` apunta a |
| --- | --- | --- |
| `COMENTARIO` | `pregunta` | la consulta |
| `SOLICITUD_VISITA` | `visita` | la visita |
| `RESENIA` | `resenia` | la reseña |
| `CAMBIO_ESTADO` | `propiedad` | la propiedad |

### Usuario

```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@inmobiliaria.com",
  "rol": "VENDEDOR",
  "createdAt": "2026-11-18T22:36:37.900Z",
  "inmobiliaria": { "id": 1, "nombreFantasia": "Inmobiliaria del Mar", "descripcion": "...", "logoUrl": null, "direccionLinea1": "...", "direccionLinea2": null }
}
```

---

## 1. Endpoints públicos

### Health y tags

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| GET | `/health` | Confirma que la API responde | 200 `{ "status": "ok" }` |
| GET | `/tags` | Amenities disponibles, ordenados por nombre. Se usan para el filtro del listado y para el formulario de propiedad (que envía los `id`). | 200 `[{ id, tag }]` |

### Propiedades

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| GET | `/properties` | Listado de propiedades `PUBLICADA` | 200 `Paginado<Propiedad>` |
| GET | `/properties/:id` | Detalle con fotos ordenadas, tags e inmobiliaria | 200 `Propiedad` · 404 |
| GET | `/properties/:id/questions` | Consultas de la propiedad, la más reciente primero | 200 `Paginado<Consulta>` · 404 |
| POST | `/properties/:id/questions` | Crea una consulta | 201 `Consulta` · 400 · 404 |
| POST | `/properties/:id/visits` | Pide una visita | 201 `Visita` · 400 · 404 · 409 |

Un `BORRADOR` no es público: su detalle, sus consultas y sus visitas responden 404. Las propiedades en los demás estados siguen teniendo detalle público aunque ya no salgan en el listado.

**Filtros de `GET /properties`** (todos opcionales y combinables):

| Parámetro | Ejemplo | Descripción |
| --- | --- | --- |
| `q` | `q=pileta` | Texto libre en título y descripción |
| `titulo` | `titulo=depto` | Texto solo en el título |
| `tipo` | `tipo=CASA` | `CASA`, `DEPARTAMENTO`, `TERRENO`, `COMERCIAL` (también acepta el número) |
| `operacion` | `operacion=VENTA` | `VENTA` o `ALQUILER` |
| `minPrice`, `maxPrice` | `minPrice=50000` | Rango de precio |
| `barrioZona` | `barrioZona=centro` | Zona o barrio (coincidencia parcial) |
| `ambientes` | `ambientes=2` | Cantidad exacta de ambientes |
| `tags` | `tags=Pileta,Cochera` | Amenities, por nombre o id, separados por coma. La propiedad debe tener todos. |
| `sortBy` | `sortBy=precio` | `precio`, `fecha` o `superficie` |
| `sortOrder` | `sortOrder=ASC` | `ASC` o `DESC` (por defecto `DESC`) |
| `page`, `limit` | `page=2&limit=12` | Paginación |

Los filtros de texto no distinguen mayúsculas. Sin `sortBy`, salen primero las más nuevas.

**`POST /properties/:id/questions`**

```json
{ "nombreSolicitante": "Ana", "pregunta": "¿Admite mascotas?" }
```

- 400 si falta el nombre o el contenido.
- 404 si la propiedad no existe o es un borrador.
- Una propiedad vendida, alquilada o cancelada sigue admitiendo consultas.

**`POST /properties/:id/visits`**

```json
{ "nombreVisitante": "María", "telefonoVisitante": "011-4444-4444", "fechaPropuesta": "2026-12-20T15:00:00.000Z", "mensajeAsociado": "Puedo por la tarde" }
```

- `nombreVisitante`, `telefonoVisitante` y `fechaPropuesta` son obligatorios. `apellidoVisitante` y `mensajeAsociado` son opcionales.
- 400 si la fecha no es válida o no es futura.
- 409 si la propiedad no está `PUBLICADA`.

### Inmobiliarias

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| GET | `/agencies` | Listado ordenado por nombre, con contacto y calificación. Filtro `?nombre=` (coincidencia parcial). | 200 `Paginado<Inmobiliaria>` |
| GET | `/agencies/:id` | Perfil público con contacto, promedio y cantidad de reseñas | 200 `Inmobiliaria` · 404 |
| GET | `/agencies/:id/properties` | Propiedades `PUBLICADA` de la inmobiliaria | 200 `Paginado<Propiedad>` · 404 |
| GET | `/agencies/:id/reviews` | Reseñas, la más reciente primero | 200 `Paginado<Reseña>` · 404 |
| POST | `/agencies/:id/reviews` | Crea una reseña | 201 `Reseña` · 400 · 404 |

**`POST /agencies/:id/reviews`**

```json
{ "nombreSolicitante": "Juan", "resenia": "Muy buena atención", "calificacion": 5 }
```

- 400 si la calificación no es un entero entre 1 y 5, o si falta el nombre o el contenido.

---

## 2. Autenticación

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| POST | `/auth/register` | Registra al vendedor y crea su inmobiliaria en el mismo paso | 201 `{ success, message, token, usuario }` · 400 · 409 |
| POST | `/auth/login` | Inicia sesión | 200 `{ success, message, token, usuario }` · 400 · 401 |
| GET | `/auth/me` | Vendedor del token con su inmobiliaria, para restaurar la sesión | 200 `{ success, usuario }` · 401 |

`usuario` tiene la forma del modelo `Usuario`.

**`POST /auth/register`**

```json
{ "nombre": "Juan", "apellido": "Pérez", "email": "juan@mail.com", "password": "123456", "telefono": "02254-481111", "nombreFantasia": "Inmobiliaria del Mar", "descripcion": "Ventas en Pinamar" }
```

- `telefono` y `descripcion` son opcionales. La contraseña tiene un mínimo de 6 caracteres.
- El email queda como correo de contacto de la inmobiliaria y, si se informa, el teléfono queda como teléfono de contacto.
- 409 si el email o el nombre de fantasía ya existen. `details[0].field` indica cuál (`email` o `nombreFantasia`). El nombre de fantasía se compara sin distinguir mayúsculas.

**`POST /auth/login`**

```json
{ "email": "juan@mail.com", "password": "123456" }
```

- 401 si el email no existe o la contraseña no coincide (el mensaje es el mismo en los dos casos).

---

## 3. Endpoints privados (panel del vendedor)

Requieren token con rol `VENDEDOR` o `ADMIN`. Un vendedor solo accede a los datos de su propia inmobiliaria.

### Inmobiliaria

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| GET | `/vendedor/inmobiliaria` | Inmobiliaria propia con teléfonos y correos | 200 `{ success, inmobiliaria }` · 404 |
| PUT | `/vendedor/inmobiliaria` | Edita `nombreFantasia`, `descripcion`, `logoUrl`, `direccionLinea1`, `direccionLinea2` | 200 `{ success, message, inmobiliaria }` · 400 · 409 |
| DELETE | `/vendedor/inmobiliaria` | Elimina la inmobiliaria con todo su contenido | 200 `{ success, message }` · 409 |
| POST | `/vendedor/inmobiliaria/telefonos` | Body `{ telefono, tipoTelefono? }` | 201 `{ success, message, telefono }` · 400 |
| DELETE | `/vendedor/inmobiliaria/telefonos/:id` | Elimina un teléfono propio | 200 `{ success, message }` · 404 |
| POST | `/vendedor/inmobiliaria/correos` | Body `{ correo, tipoCorreo? }` | 201 `{ success, message, correo }` · 400 |
| DELETE | `/vendedor/inmobiliaria/correos/:id` | Elimina un correo propio | 200 `{ success, message }` · 404 |

- `PUT`: se envían solo los campos que cambian. 400 si llega un campo que no está en la lista. 409 si el nombre de fantasía ya lo usa otra inmobiliaria.
- `DELETE /vendedor/inmobiliaria`: 409 si tiene propiedades `PUBLICADA` o `RESERVADA`. La cuenta del vendedor no se elimina.

### Propiedades

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| GET | `/vendedor/propiedades` | Propiedades propias en cualquier estado. Filtro `?estado=PUBLICADA`. | 200 `Paginado<Propiedad>` |
| GET | `/vendedor/propiedades/:id` | Detalle con `historialEstados` en orden cronológico | 200 `Propiedad` · 404 |
| POST | `/vendedor/propiedades` | Crea una propiedad en `BORRADOR` | 201 `{ success, message, propiedad }` · 400 |
| PUT | `/vendedor/propiedades/:id` | Edición parcial | 200 `{ success, message, propiedad }` · 400 · 404 · 409 |
| PATCH | `/vendedor/propiedades/:id/estado` | Cambia el estado. Body `{ "nuevoEstado": "PUBLICADA" }` | 200 `{ success, message, propiedad }` · 400 · 404 · 409 |
| DELETE | `/vendedor/propiedades/:id` | Da de baja (pasa a `CANCELADA`, no se borra) | 200 `{ success, message }` · 404 · 409 |

Una propiedad de otro vendedor responde 404, igual que una inexistente. Un id que no es un número válido responde 400.

`historialEstados` es una lista de `{ id, estadoViejo, estadoNuevo, fechaCambio }`.

**Body de alta (`POST`)**

```json
{
  "titulo": "Depto 2 ambientes con vista al mar",
  "descripcion": "Departamento luminoso a dos cuadras de la playa",
  "tipoPropiedad": "DEPARTAMENTO",
  "operacion": "ALQUILER",
  "precio": 400,
  "moneda": "USD",
  "direccionLinea1": "Av. del Mar 320",
  "barrioZona": "Centro",
  "superficieTotalM2": 50,
  "superficieCubiertaM2": 45,
  "ambientes": 2,
  "dormitorios": 1,
  "banios": 1,
  "antiguedad": 8,
  "tags": [1, 5]
}
```

- Obligatorios: `titulo`, `descripcion`, `tipoPropiedad`, `operacion`, `precio`, `moneda`, `direccionLinea1`, `barrioZona`, `superficieTotalM2`, y `superficieCubiertaM2` salvo que el tipo sea `TERRENO`.
- `precio` debe ser mayor a 0. Las superficies, ambientes, dormitorios y baños deben ser enteros mayores a 0. `antiguedad` es un entero mayor o igual a 0.
- En un `TERRENO` no se guardan `superficieCubiertaM2`, `ambientes`, `dormitorios` ni `banios`.
- `tags` es una lista de ids de `GET /tags`. Los ids que no existen se ignoran.
- No se aceptan campos fuera de esta lista (400).

**Reglas de edición (`PUT`)**

- Acepta los mismos campos que el alta, todos opcionales. Si llega `tags`, reemplaza la lista completa.
- 409 si la propiedad está `VENDIDA`, `ALQUILADA` o `CANCELADA`.
- 409 si tiene visitas `CONFIRMADA`.

**Máquina de estados (`PATCH .../estado`)**

```
BORRADOR  -> PUBLICADA, CANCELADA
PUBLICADA -> RESERVADA, PAUSADA, CANCELADA
PAUSADA   -> PUBLICADA, CANCELADA
RESERVADA -> VENDIDA, ALQUILADA, CANCELADA
VENDIDA, ALQUILADA, CANCELADA -> (finales)
```

- 400 si la transición no está permitida, o si el cierre no coincide con la operación (`VENDIDA` solo para `VENTA`, `ALQUILADA` solo para `ALQUILER`).
- 409 al publicar sin fotos, o al cancelar con visitas `CONFIRMADA`.
- Cada cambio exitoso agrega un registro al historial y genera una actividad.

**Baja (`DELETE`)**

- 409 si la propiedad está `VENDIDA` o `ALQUILADA`, o si tiene visitas `CONFIRMADA`.
- Si ya estaba `CANCELADA` responde 200 sin hacer nada.

### Fotos

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| GET | `/vendedor/propiedades/:id/fotos` | Fotos ordenadas por `orden` | 200 `{ success, photos }` · 404 |
| POST | `/vendedor/propiedades/:id/fotos` | Body `{ url, orden?, esPortada? }` | 201 `{ success, photo }` · 400 · 404 |
| PATCH | `/vendedor/propiedades/:id/fotos/:photoId` | Body `{ orden?, esPortada? }` | 200 `{ success, message }` · 400 · 404 · 409 |
| DELETE | `/vendedor/propiedades/:id/fotos/:photoId` | Elimina la foto | 200 `{ success, message }` · 404 · 409 |

Cada foto tiene la forma `{ id, url, orden, esPortada }`. La foto se carga por URL; no hay subida de archivos.

- Siempre hay una sola portada: la primera foto queda como portada, al marcar otra se desmarca la anterior, y al borrar la portada pasa a serlo la primera que queda.
- `PATCH`: 409 si se intenta desmarcar la portada sin marcar otra.
- `DELETE`: 409 al eliminar la última foto de una propiedad `PUBLICADA`.

### Consultas

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| GET | `/vendedor/comentarios` | Consultas recibidas. Filtro `?sinResponder=true`. | 200 `Paginado<Consulta>` |
| GET | `/vendedor/propiedades/:id/comentarios` | Consultas de una propiedad propia | 200 `Paginado<Consulta>` |
| PUT | `/vendedor/comentarios/:id/respuesta` | Body `{ "respuestaVendedor": "..." }` | 200 `Consulta` · 400 · 403 · 404 · 409 |

- 403 si la consulta es de otra inmobiliaria.
- 409 si la consulta ya fue respondida (admite una única respuesta).

### Visitas

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| GET | `/vendedor/visitas` | Visitas recibidas, con nombre y teléfono. Filtro `?estado=PENDIENTE`. | 200 `Paginado<Visita>` |
| GET | `/vendedor/propiedades/:id/visitas` | Visitas de una propiedad propia | 200 `Paginado<Visita>` |
| PUT | `/vendedor/visitas/:id/estado` | Body `{ "estado": "CONFIRMADA" }` | 200 `Visita` · 400 · 403 · 404 |

```
PENDIENTE  -> CONFIRMADA, RECHAZADA, CANCELADA
CONFIRMADA -> REALIZADA, CANCELADA, RECHAZADA
REALIZADA, CANCELADA, RECHAZADA -> (finales)
```

- 400 si la transición no está permitida. 403 si la visita es de otra inmobiliaria.

### Actividad

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| GET | `/vendedor/actividad` | Feed, más reciente primero. Filtros `?tipo=COMENTARIO` y `?leido=false`. | 200 `{ success, data, total, page, limit, totalPages }` |
| GET | `/vendedor/actividad/sin-leer` | Cantidad sin leer, para el contador de la navegación | 200 `{ success, sinLeer }` |
| PATCH | `/vendedor/actividad/:id/leer` | Marca una como leída | 200 `{ success, message }` · 400 · 403 · 404 |
| PATCH | `/vendedor/actividad/leer-todas` | Marca todas como leídas | 200 `{ success, message, marcadas }` |

`data` es una lista de `Actividad`.

### Reportes

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| GET | `/vendedor/reportes` | Los tres indicadores juntos | 200 (ver abajo) |
| GET | `/vendedor/reportes/por-estado` | Cantidad de propiedades por estado actual | 200 `{ propiedadesPorEstado }` |
| GET | `/vendedor/reportes/mensual` | Publicaciones y cierres por mes | 200 `{ evolucionMensual }` |
| GET | `/vendedor/reportes/tiempo-en-mercado` | Tiempo promedio en mercado, en días | 200 `{ tiempoPromedioMercadoDias }` |

Hay una ruta por indicador para que el front pueda cargarlos por separado: si uno falla, los otros se muestran igual. Cada una devuelve la misma clave que tiene en la respuesta completa:

```json
{
  "propiedadesPorEstado": [{ "estado": "PUBLICADA", "cantidad": 4 }],
  "evolucionMensual": [{ "mes": "2026-10", "publicaciones": 3, "cierres": 2 }],
  "tiempoPromedioMercadoDias": 55
}
```

- `propiedadesPorEstado` trae siempre los siete estados, con 0 cuando no hay propiedades.
- `evolucionMensual` trae solo los meses con movimiento. Una publicación es el paso de `BORRADOR` a `PUBLICADA` (republicar después de una pausa no cuenta) y un cierre es el paso a `VENDIDA` o `ALQUILADA`.
- `tiempoPromedioMercadoDias` se calcula con el historial de estados: días entre la primera publicación de cada propiedad y su venta o alquiler. Es `null` si todavía no hubo cierres.
