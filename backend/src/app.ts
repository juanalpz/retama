import express, { Request, Response } from 'express';
import authRoutes from './routes/auth.routes';
import { router as apiRoutes } from './routes/index';
import { errorHandler } from './middlewares/errorHandler.middleware';

const app = express();

// Middleware para entender JSON en las peticiones
app.use(express.json());

// Registrar el módulo de rutas de Autenticación
app.use('/api/auth', authRoutes);

// Registrar todas las rutas públicas (properties, agencies, health)
// Se montan en la raíz para que /properties y /agencies funcionen directamente
app.use('/', apiRoutes);

// Middleware global de captura de errores (SIEMPRE AL FINAL)
app.use(errorHandler);

export default app;