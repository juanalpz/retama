/**
 * conexion a postgres con typeorm.
 * exporta AppDataSource, que es el objeto que usan todos los repositorios
 * para hablar con la base. con NODE_ENV=test apunta a la base de test.
 */

import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
import './env.config';

// cuando se corren los tests se usa otra base (DB_NAME_TEST) para no pisar
// los datos de desarrollo. esa base se vacia en cada corrida.
const isTest = process.env.NODE_ENV === 'test';
const database = isTest
  ? process.env.DB_NAME_TEST || 'retama_test'
  : process.env.DB_NAME || 'retama_db';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 15432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database,
  // synchronize crea y actualiza las tablas a partir de las entidades al iniciar
  synchronize: true,
  // en test se borra el esquema al conectar para arrancar siempre de cero
  dropSchema: isTest,
  logging: false,
  // la ruta se arma con __dirname para que funcione igual con ts-node (src)
  // que con el build compilado (dist)
  entities: [path.join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
});
