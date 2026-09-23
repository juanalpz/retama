import express, { Request, Response } from 'express';
import authRoutes from './routes/auth.routes';
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

// Registrar el módulo de rutas de Autenticación[cite: 2, 5]
app.use('/api/auth', authRoutes);

// Middleware global de captura de errores (SIEMPRE AL FINAL)[cite: 2]
app.use(errorHandler);

export default app;