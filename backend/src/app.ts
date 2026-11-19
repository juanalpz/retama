/**
 * arma la aplicacion de express: cors, lectura de json, rutas y manejo de errores.
 * no abre el puerto (eso lo hace server.ts), asi los tests pueden importar la app
 * y levantarla en un puerto propio.
 */

import express from 'express';
import cors from 'cors';
import { router as apiRoutes } from './routes/index';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import { ENV } from './config/env.config';

const app = express();

// habilita cors para que el front (vite en el puerto 5173) pueda llamar a la api.
// los origenes permitidos salen de la variable CORS_ORIGIN, separados por coma.
app.use(cors({ origin: ENV.CORS_ORIGINS }));

// permite leer json en el body de las peticiones
app.use(express.json());

// todas las rutas (publicas, auth y privadas) cuelgan de /api.
// el mapa completo esta en src/routes/index.ts
app.use('/api', apiRoutes);

// cualquier ruta que no exista responde 404 con el formato de error de la api
app.use(notFoundHandler);

// manejo central de errores, siempre va al final
app.use(errorHandler);

export default app;
