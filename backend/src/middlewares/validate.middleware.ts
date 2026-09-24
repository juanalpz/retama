import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Middleware generador para la validación y sanitización de esquemas con Zod (OWASP).
 * 
 * Recibe un esquema de validación y comprueba que los datos del cuerpo de la petición (`req.body`)
 * cumplan estrictamente con las reglas definidas antes de pasar al controlador.
 * 
 * @param schema - Esquema de validación instanciado desde Zod.
 * @returns Middleware de Express que procesa la validación del request.
 */
export const validateSchema = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Intenta validar y formatear req.body según la estructura esperada
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      // Si el error pertenece al formateador de Zod, estructuramos una respuesta HTTP 400
      if (error instanceof ZodError) {
        const zodError = error as ZodError & {
          issues?: Array<{
            path: Array<string | number>;
            message: string;
          }>;
        };

        if (Array.isArray(zodError.issues)) {
          return res.status(400).json({
            success: false,
            errors: zodError.issues.map((e) => ({
              field: e.path[0],
              message: e.message,
            })),
          });
        }
      }
      // Para cualquier otro error inesperado, lo derivamos al middleware de errores global
      next(error);
    }
  };
};