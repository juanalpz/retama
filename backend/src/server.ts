/**
 * punto de entrada de la api.
 * conecta la base de datos y, recien cuando la conexion esta lista, levanta
 * el servidor http en el puerto configurado. si la base no responde, termina el proceso.
 */

import { ENV } from './config/env.config';
import 'reflect-metadata';
import app from './app';
import { AppDataSource } from './config/data-source';

AppDataSource.initialize()
  .then(() => {
    console.log('base de datos conectada');
    app.listen(ENV.PORT, () => {
      console.log(`api escuchando en http://localhost:${ENV.PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('error al conectar con la base de datos:', error);
    // sin base de datos la api no puede funcionar
    process.exit(1);
  });