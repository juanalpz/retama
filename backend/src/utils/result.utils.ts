/**
 * resultado comun de las operaciones de los servicios.
 * cuando algo falla el servicio devuelve el codigo http que corresponde y un
 * mensaje, y el controlador solo tiene que pasarlo a la respuesta.
 *
 * codigos que se usan:
 *   400 dato o transicion invalida
 *   403 el recurso existe pero es de otro vendedor
 *   404 el recurso no existe
 *   409 el pedido es valido pero choca con el estado actual (regla de negocio)
 */

export interface ServiceError {
  success: false;
  status: number;
  message: string;
}

export type ServiceResult<T = {}> = ({ success: true; message?: string } & T) | ServiceError;

/**
 * atajo para armar un resultado de error.
 *
 * @param status codigo http que tiene que responder el controlador
 * @param message mensaje para mostrar al usuario
 * @returns el objeto { success: false, status, message }
 */
export const fail = (status: number, message: string): ServiceError => ({
  success: false,
  status,
  message,
});
