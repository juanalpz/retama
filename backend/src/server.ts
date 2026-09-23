import 'reflect-metadata';
import app from './app';
import { AppDataSource } from './config/data-source';
import { ENV } from './config/env.config';

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Base de Datos PostgreSQL conectada con éxito vía TypeORM');
    app.listen(ENV.PORT, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${ENV.PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error al conectar con la Base de Datos:', error);
  });