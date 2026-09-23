import { prisma } from './prisma.client';

export async function initDatabase() {
  try {
    // Intenta conectar con el contenedor de Docker
    await prisma.$connect();
    console.log('✅ Conexión con PostgreSQL en Docker establecida exitosamente.');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  }
}