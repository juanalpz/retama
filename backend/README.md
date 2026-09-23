# Backend

API REST del marketplace inmobiliario con Node.js, Express 5, TypeScript,
TypeORM y PostgreSQL.

## Comandos

```bash
npm install
cp .env.example .env
npm run dev
npm run build
```

Las tablas deben crearse mediante migraciones. `synchronize` queda desactivado
por diseño.

## Capas

```text
src/
  config/        DataSource y configuracion
  controllers/   Entrada HTTP
  entities/      Modelo persistente del dominio
  migrations/    Cambios versionados de base de datos
  repositories/  Acceso a datos
  routes/        Rutas HTTP
  seeds/         Datos iniciales de desarrollo
  services/      Reglas de negocio
```