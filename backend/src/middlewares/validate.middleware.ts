/**
 * validacion del body de las peticiones con zod.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * zod trae algunos mensajes por defecto en ingles. aca se pasan a español los
 * casos que no tienen un mensaje propio en el schema.
 *
 * @param issue un error de validacion de zod (trae code, message y, a veces, keys)
 * @returns el mensaje en español para mostrar al usuario
 */
const translateIssue = (issue: any): string => {
  if (!String(issue.message).startsWith('Invalid input') && issue.code !== 'unrecognized_keys') {
    return issue.message;
  }
  if (issue.code === 'unrecognized_keys') {
    return `Campos no permitidos: ${(issue.keys ?? []).join(', ')}`;
  }
  if (String(issue.message).includes('received undefined')) {
    return 'El campo es obligatorio';
  }
  return 'El tipo de dato no es válido';
};

/**
 * arma un middleware que valida req.body contra un schema de zod.
 * si el body es valido lo reemplaza por la version ya parseada (con los trim y
 * valores por defecto aplicados) y sigue. si no, corta el pedido con 400.
 *
 * @param schema schema de zod con las reglas del body
 * @returns un middleware que responde 400 con { error, details: [{ field, message }] } o deja pasar el pedido
 */
export const validateSchema = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // si no llega body se valida un objeto vacio para que zod informe los campos faltantes
      req.body = await schema.parseAsync(req.body ?? {});
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Datos inválidos',
          details: error.issues.map((issue) => ({
            // un error que no pertenece a un campo puntual queda como "body"
            field: issue.path.length > 0 ? String(issue.path[0]) : 'body',
            message: translateIssue(issue),
          })),
        });
      }
      // cualquier otro error sigue al manejador central
      next(error);
    }
  };
};
