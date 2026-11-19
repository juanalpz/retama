# Rutas

Cada recurso tiene su propio archivo de rutas (`<recurso>.routes.ts`). Un router
no contiene lógica de negocio: asocia `método + path` con los middlewares que
correspondan (autenticación y validación del body) y con una función de un
controller. Todos los routers se juntan en `index.ts`, que expone el router raíz
que `src/app.ts` monta bajo `/api`.

## Mapa de routers

| Prefijo | Router | Archivo | Token |
| --- | --- | --- | --- |
| `/health` | `healthRouter` | `health.routes.ts` | no |
| `/properties` | `propertyRouter` | `property.routes.ts` | no |
| `/tags` | `tagRouter` | `property.routes.ts` | no |
| `/agencies` | `agencyRouter` | `agency.routes.ts` | no |
| `/auth` | `router` (default) | `auth.routes.ts` | solo `/auth/me` |
| `/vendedor/inmobiliaria` | `router` (default) | `agency.routes.ts` | sí |
| `/vendedor/propiedades` | `privateRouter` (default) | `property.routes.ts` | sí |
| `/vendedor/actividad` | `activityRouter` | `activity.routes.ts` | sí |
| `/vendedor` | `sellerCommentRouter` | `seller-comment.routes.ts` | sí |
| `/vendedor` | `sellerVisitRouter` | `seller-visit.routes.ts` | sí |
| `/vendedor` | `sellerReportRouter` | `seller-report.routes.ts` | sí |

Los tres últimos se montan en `/vendedor` y definen el resto del path adentro
(`/comentarios`, `/visitas`, `/reportes`, `/propiedades/:id/comentarios`, etc.).

## Cómo se arma una ruta

```ts
privateRouter.patch(
  '/:id/estado',
  authenticateToken,                           // 401 si no hay token válido
  authorizeRoles('VENDEDOR', 'ADMIN'),         // 403 si el rol no alcanza
  validateSchema(changePropertyStatusSchema),  // 400 si el body no cumple el schema
  changePropertyStatus                         // función del controller
);
```

Los middlewares se ejecutan de izquierda a derecha y cualquiera puede cortar el
pedido. Algunos routers aplican la autenticación una sola vez para todas sus
rutas con `router.use(authenticateToken, authorizeRoles(...))`.

## Cómo agregar un recurso nuevo (ej. `foo`)

1. **Entidad** — `src/entities/foo.entity.ts`. Como la conexión usa
   `synchronize: true`, la tabla se crea sola al reiniciar.
2. **Schema** — `src/schemas/foo.schema.ts`: las reglas del body con Zod.
3. **Repository** — `src/repositories/foo.repository.ts`: una clase `FooRepository`
   con un getter privado que resuelve `AppDataSource.getRepository(Foo)` y
   métodos con las consultas. No llames a `AppDataSource.getRepository` a nivel
   de módulo (fuera de un método o función): la conexión todavía no está
   inicializada cuando se importan los archivos.
4. **Service** — `src/services/foo.service.ts`: las reglas de negocio. Llama al
   repository y, cuando algo no se puede hacer, devuelve `fail(status, mensaje)`
   de `src/utils/result.utils.ts`.
5. **Controller** — `src/controllers/foo.controller.ts`: lee el request, llama
   al service y arma la respuesta HTTP.
6. **Router** — `src/routes/foo.routes.ts`: `export const fooRouter = Router()`
   con las rutas, sus middlewares y la función del controller.
7. **Montaje** — en `src/routes/index.ts`, importar `fooRouter` y agregar
   `router.use("/foos", fooRouter)`.
8. **Documentación y pruebas** — sumar los endpoints a `docs/api-documentation.md`,
   a `backend/requests.http` y a `backend/tests/api.test.ts`.

Usá `property.routes.ts` → `property.controller.ts` → `property.service.ts` →
`property.repository.ts` como referencia: es el flujo completo.

## Convenciones

- Un router por recurso, montado bajo su propio prefijo.
- Toda respuesta de error tiene la forma `{ error, details? }`.
- En las rutas públicas, un id con formato inválido responde igual que uno
  inexistente: `404 { error }`. En las del panel, un id inválido responde 400.
- En el panel, un recurso de otro vendedor responde 404 (propiedades, fotos,
  teléfonos y correos) o 403 (consultas, visitas y actividad).
- El id del vendedor siempre sale del token (`req.user.id`), nunca del body ni
  de la URL.
- Conviven dos estilos de controller y de service: una clase con una única
  instancia exportada (`export const propertyController = new PropertyController()`)
  para lo público, y funciones exportadas sueltas para el panel del vendedor
  (`export const createProperty = async (req, res, next) => ...`). Los
  repositories son siempre clases.
- Un error inesperado no se resuelve en el controller: llega al manejador
  central (`errorHandler.middleware.ts`), que responde 500 sin detalles.
