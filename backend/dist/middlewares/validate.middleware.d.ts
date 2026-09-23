import { Request, Response, NextFunction } from 'express';
/**
 * Middleware generador para la validación y sanitización de esquemas con Zod (OWASP).
 *
 * Recibe un esquema de validación y comprueba que los datos del cuerpo de la petición (`req.body`)
 * cumplan estrictamente con las reglas definidas antes de pasar al controlador.
 *
 * @param schema - Esquema de validación instanciado desde Zod.
 * @returns Middleware de Express que procesa la validación del request.
 */
export declare const validateSchema: (schema: any) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
