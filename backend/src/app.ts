import express, { Request, Response } from 'express';
import authRoutes from './routes/auth.routes';
import agencyRoutes from './routes/agency.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';

const app = express();

// Middleware para entender JSON en las peticiones[cite: 5]
app.use(express.json());

// Ruta de prueba (Health Check)[cite: 5]
app.get('/api/health', (req: Request, res: Response) => {
  return res.json({
    status: 'OK',
    message: 'El servidor de Retama está corriendo correctamente 🚀'
  });
});

// Registrar los módulos de rutas
app.use('/api/auth', authRoutes);
app.use('/api/vendedor/inmobiliaria', agencyRoutes);

// Middleware global de captura de errores (SIEMPRE AL FINAL)[cite: 2]
app.use(errorHandler);

export default app;