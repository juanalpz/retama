# retama
Plataforma integral y marketplace inmobiliario enfocado en la gestión, publicación y comercialización de propiedades en Pinamar.

## Correr con Docker

Con Docker Desktop instalado y abierto, desde la carpeta del repositorio:

```bash
# 1. construir y levantar la base de datos, el backend y el frontend
docker compose up --build -d

# 2. cargar los datos de prueba (solo la primera vez, o para reiniciarlos)
docker compose exec api npm run seed:prod
```

La aplicación queda en **http://localhost:8080**. Para entrar al panel del vendedor: `juan@inmobiliaria.com` / `123456`.

| Comando | Qué hace |
| --- | --- |
| `docker compose ps` | Muestra el estado de los tres contenedores |
| `docker compose logs -f api` | Muestra los mensajes del backend |
| `docker compose down` | Apaga todo. Los datos se conservan. |
| `docker compose down -v` | Apaga todo y borra los datos |

Cómo está armado:

- `db`: PostgreSQL. Guarda los datos en un volumen y no publica ningún puerto.
- `api`: el backend compilado. Espera a que la base esté lista y crea las tablas al iniciar.
- `web`: nginx con el frontend compilado. Reenvía todo lo que empieza con `/api` al backend, así el navegador habla siempre con un solo servidor.

Opcional: copiar `.env.example` como `.env` para cambiar la clave de los tokens (`JWT_SECRET`), la contraseña de la base o el puerto (`WEB_PORT`). Sin ese archivo se usan los valores por defecto.

La primera construcción necesita internet para descargar las imágenes base y las dependencias. Después la app funciona sin conexión: las fotos de los datos de prueba están dentro del frontend (`frontend/public/fotos`).

Para desarrollar sin Docker, ver [`backend/README.md`](backend/README.md) y [`frontend/README.md`](frontend/README.md).

## Estructura del repositorio

| Carpeta | Contenido |
| --- | --- |
| [`backend/`](backend) | API REST (Node.js, Express, TypeScript, TypeORM, PostgreSQL). Ver [`backend/README.md`](backend/README.md) para levantarla. |
| [`frontend/`](frontend) | Aplicación cliente (React, Vite y Tailwind). En desarrollo: ver [`frontend/README.md`](frontend/README.md). |
| [`docs/`](docs) | Consigna del trabajo y documentación de la API. |

## Tests

Cada parte tiene su propia suite y se corre con `npm test` desde su carpeta:

| Carpeta | Qué prueba | Qué necesita |
| --- | --- | --- |
| `backend/` | La API real contra una base de test aparte: todos los endpoints con sus casos válidos y sus errores | PostgreSQL levantado |
| `frontend/` | Las pantallas montadas en un navegador simulado, con la API simulada | Nada más que `npm install` |

## Documentación

- [Consigna del TPO](docs/consigna-tpo.md)
- [Documentación de la API](docs/api-documentation.md): endpoints, cuerpos de los pedidos y forma de las respuestas
- [Cómo levantar el backend](backend/README.md)
