/**
 * @fileoverview Rutas de ABM y Ciclo de Vida de Propiedades.
 * Define los endpoints correspondientes a las operaciones sobre propiedades
 * del vendedor autenticado: creación, listado, detalle, edición, cambio de
 * estado y eliminación.
 */

import { Router } from 'express';
import {
  createProperty,
  getProperties,
  getPropertyDetail,
  updateProperty,
  changePropertyStatus,
  deleteProperty
} from '../controllers/property.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateSchema } from '../middlewares/validate.middleware';
import { createPropertySchema, updatePropertySchema, changePropertyStatusSchema } from '../schemas/property.schema';

// ==========================================
// 3. ABM Y CICLO DE VIDA DE PROPIEDADES
// ==========================================

const router = Router();

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.1] Crea una nueva propiedad en estado BORRADOR.
 *
 * @route POST /api/vendedor/propiedades
 * @access Privado (Requiere validación de token JWT y rol VENDEDOR o ADMIN)
 *
 * @example
 * POST /api/vendedor/propiedades
 */
router.post('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(createPropertySchema), createProperty);

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.2] Obtiene el listado de todas las propiedades de la inmobiliaria del vendedor.
 *
 * @route GET /api/vendedor/propiedades
 * @access Privado (Requiere validación de token JWT y rol VENDEDOR o ADMIN)
 *
 * @example
 * GET /api/vendedor/propiedades
 */
router.get('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getProperties);

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.3] Obtiene el detalle completo de una propiedad por su ID.
 *
 * @route GET /api/vendedor/propiedades/:id
 * @access Privado (Requiere validación de token JWT y rol VENDEDOR o ADMIN)
 *
 * @example
 * GET /api/vendedor/propiedades/5
 */
router.get('/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getPropertyDetail);

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.4] Edita los datos de una propiedad existente.
 *
 * @route PUT /api/vendedor/propiedades/:id
 * @access Privado (Requiere validación de token JWT y rol VENDEDOR o ADMIN)
 *
 * @example
 * PUT /api/vendedor/propiedades/5
 */
router.put('/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(updatePropertySchema), updateProperty);

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.5] Cambia el estado de una propiedad (máquina de estados).
 *
 * @route PATCH /api/vendedor/propiedades/:id/estado
 * @access Privado (Requiere validación de token JWT y rol VENDEDOR o ADMIN)
 *
 * @example
 * PATCH /api/vendedor/propiedades/5/estado
 */
router.patch('/:id/estado', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(changePropertyStatusSchema), changePropertyStatus);

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.6] Elimina una propiedad.
 *
 * @route DELETE /api/vendedor/propiedades/:id
 * @access Privado (Requiere validación de token JWT y rol VENDEDOR o ADMIN)
 *
 * @example
 * DELETE /api/vendedor/propiedades/5
 */
router.delete('/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deleteProperty);

// ----------------------------------------------------------------------------------------------------

export default router;