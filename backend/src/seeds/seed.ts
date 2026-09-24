import { AppDataSource } from "../config/data-source";
import { Seller } from "../entities/seller.entity";
import { Agency } from "../entities/agency.entity";
import { Property } from "../entities/property.entity";
import { hashPassword } from "../utils/auth.utils";

async function seed(): Promise<void> {
  // 1. Nos conectamos a la base de datos
  await AppDataSource.initialize();
  console.log("Iniciando inserción de datos de prueba...");

  const sellerRepo = AppDataSource.getRepository(Seller);
  const agencyRepo = AppDataSource.getRepository(Agency);
  const propertyRepo = AppDataSource.getRepository(Property);

  try {
    // IMPORTANTE: Limpiamos datos viejos (opcional, cuidado en producción)
    // Usamos DELETE FROM en el orden correcto para respetar las foreign keys
    await propertyRepo.query('DELETE FROM propiedades');
    await agencyRepo.query('DELETE FROM inmobiliarias');
    await sellerRepo.query('DELETE FROM usuarios');

    // 2. Creamos un Usuario Vendedor
    const passwordEncriptada = await hashPassword("123456");
    const vendedor = sellerRepo.create({
      nombre: "Juan",
      apellido: "Pérez",
      email: "juan@inmobiliaria.com",
      passwordHash: passwordEncriptada,
      rol: "VENDEDOR"
    });
    await sellerRepo.save(vendedor);
    console.log("✅ Vendedor creado: Juan Pérez");

    // 3. Creamos su Inmobiliaria asociada
    const inmobiliaria = agencyRepo.create({
      nombreFantasia: "Inmobiliaria del Mar",
      descripcion: "Especialistas en la costa atlántica.",
      direccionLinea1: "Av. Bunge 123, Pinamar",
      seller: vendedor // Vinculamos la inmobiliaria al vendedor
    });
    await agencyRepo.save(inmobiliaria);
    console.log("✅ Inmobiliaria creada: Inmobiliaria del Mar");

    // 4. Creamos una Propiedad para esa Inmobiliaria
    const propiedad = propertyRepo.create({
      titulo: "Hermoso Chalet a 2 cuadras del mar",
      descripcion: "Cuenta con parque amplio, parrilla y cochera cubierta.",
      operacion: "VENTA",
      ambientes: 4,
      dormitorios: 3,
      banios: 2,
      superficieCubiertaM2: 150,
      superficieTotalM2: 300,
      precio: 125000,
      moneda: "USD",
      barrioZona: "Pinamar Norte",
      estado: "PUBLICADA",
      agency: inmobiliaria // Vinculamos la propiedad a la inmobiliaria
    });
    await propertyRepo.save(propiedad);
    console.log("✅ Propiedad creada: Hermoso Chalet");


    console.log("🎉 Seed completado con éxito.");
  } catch (error) {
    console.error("❌ Error insertando datos:", error);
  } finally {
    // 5. Cerramos la conexión
    await AppDataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});