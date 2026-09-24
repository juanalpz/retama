import express, { Request, Response } from 'express';
import authRoutes from './routes/auth.routes';
import { router as apiRoutes } from './routes/index';
import agencyRoutes from './routes/agency.routes';
import propertyRoutes from './routes/property.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';

const app = express();

// Middleware para entender JSON en las peticiones
app.use(express.json());

// Ruta de prueba (Health Check)
app.get('/api/health', (req: Request, res: Response) => {
  return res.json({
    status: 'OK',
    message: 'El servidor de Retama está corriendo correctamente 🚀'
  });
});

// Registrar el módulo de rutas de Autenticación
app.use('/api/auth', authRoutes);

// Registrar rutas privadas de agencia (Dashboard Vendedor)
app.use('/api/vendedor/inmobiliaria', agencyRoutes);
app.use('/api/vendedor/propiedades', propertyRoutes);

// Registrar todas las rutas públicas (properties, agencies, health)
// Se montan en la raíz para que /properties y /agencies funcionen directamente
app.use('/', apiRoutes);

// Middleware global de captura de errores (SIEMPRE AL FINAL)
app.use(errorHandler);

export default app;