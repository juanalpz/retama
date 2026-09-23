import { AppDataSource } from "../config/data-source";

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  console.log("Seed pendiente: agregar datos de desarrollo para el dominio.");
  await AppDataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});