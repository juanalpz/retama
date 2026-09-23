import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ENV } from './env.config';

/**
 * Configuración principal de TypeORM para conectar Express con PostgreSQL.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: '127.0.0.1',
  port: 5433,
  username: 'postgres',
  password: 'postgres',
  database: 'retama_db',
  synchronize: true, // Recrea las tablas automáticamente en desarrollo a partir de las entidades
  logging: false,
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
});