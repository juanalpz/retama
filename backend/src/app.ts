import express from 'express';
import { router as apiRoutes } from './routes/index';
import { errorHandler } from './middlewares/errorHandler.middleware';

const app = express();

// Middleware para entender JSON en las peticiones
app.use(express.json());

// Registrar TODAS las rutas (Públicas, Auth y Privadas) bajo el prefijo /api
// Ver src/routes/index.ts para el mapa completo de rutas.
app.use('/api', apiRoutes);

// Middleware global de captura de errores (SIEMPRE AL FINAL)
app.use(errorHandler);

export default app;