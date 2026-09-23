# Rutas

Cada recurso tiene su propio router (`<recurso>.routes.ts`). Un router **no**
valida ni contiene lógica de negocio: solo mapea `metodo + path` a un método
de un controller. Todos los routers se agregan en `index.ts`, que expone el
router raíz que usa `src/index.ts`.

Usá `property.routes.ts` / `property.controller.ts` / `property.service.ts` /
`property.repository.ts` como referencia: es el flujo completo ya andando.

## Cómo agregar un recurso nuevo (ej. `foo`)

1. **Entidad** — `src/entities/foo.entity.ts` (si el dominio ya la define).
2. **Repository** — `src/repositories/foo.repository.ts`: una clase `FooRepository`
   con un getter/campo privado que resuelve `AppDataSource.getRepository(Foo)`
   y métodos propios que delegan ahí. No llames a `AppDataSource.getRepository`
   a nivel de módulo (fuera de un método) — el `DataSource` todavía no está
   inicializado cuando se importan los archivos de rutas.
3. **Service** — `src/services/foo.service.ts`: una clase `FooService` con la
   lógica de negocio, que llama al repository.
4. **Controller** — `src/controllers/foo.controller.ts`: una clase `FooController`
   con métodos `async (request, response) => void` que llaman al service y
   deciden status codes / forma de la respuesta.
5. **Router** — `src/routes/foo.routes.ts`: `export const fooRouter = Router()`
   mapeando rutas a métodos del controller.
6. **Montaje** — en `src/routes/index.ts`, importar `fooRouter` y agregar
   `router.use("/foos", fooRouter)`.

## Convenciones

- Un router por recurso, montado bajo su propio prefijo (`/properties`, `/foos`, ...).
- Id inválido (formato) o inexistente → mismo resultado: `404 { message }`
  (ver `property.controller.ts`).
- Cada capa exporta una única instancia (singleton): `export const fooRepository = new FooRepository()`,
  no funciones sueltas.