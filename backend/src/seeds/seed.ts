import { AppDataSource } from "../config/data-source";
import { Seller } from "../entities/seller.entity";
import { Agency } from "../entities/agency.entity";
import { Property } from "../entities/property.entity";
import { Tag } from "../entities/tag.entity";
import { PropertyTag } from "../entities/property-tag.entity";
import { PropertyQuestion } from "../entities/property-question.entity";
import { Visit } from "../entities/visit.entity";
import { PropertyStatusHistory } from "../entities/property-status-history.entity";
import { hashPassword } from "../utils/auth.utils";

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  console.log("Iniciando inserción masiva de datos de prueba (Seed)...");

  const sellerRepo = AppDataSource.getRepository(Seller);
  const agencyRepo = AppDataSource.getRepository(Agency);
  const propertyRepo = AppDataSource.getRepository(Property);
  const tagRepo = AppDataSource.getRepository(Tag);
  const propertyTagRepo = AppDataSource.getRepository(PropertyTag);
  const questionRepo = AppDataSource.getRepository(PropertyQuestion);
  const visitRepo = AppDataSource.getRepository(Visit);
  const historyRepo = AppDataSource.getRepository(PropertyStatusHistory);

  try {
    // 1. Limpiar base de datos
    console.log("Limpiando tablas...");
    await historyRepo.query('DELETE FROM propiedades_cambios_logs');
    await visitRepo.query('DELETE FROM visitas');
    await questionRepo.query('DELETE FROM preguntas_propiedad');
    await propertyTagRepo.query('DELETE FROM propiedades_tags');
    await propertyRepo.query('DELETE FROM propiedades');
    await tagRepo.query('DELETE FROM tags');
    await agencyRepo.query('DELETE FROM inmobiliarias');
    await sellerRepo.query('DELETE FROM usuarios');

    // 2. Crear Tags (Amenities)
    const tagNombres = ["Cochera", "Apto Mascotas", "Pileta", "Seguridad 24hs", "Balcón", "Gimnasio", "Parrilla"];
    const tagsGuardados: Tag[] = [];
    for (const nombre of tagNombres) {
      const tag = tagRepo.create({ tag: nombre });
      tagsGuardados.push(await tagRepo.save(tag));
    }
    console.log(`✅ Creados ${tagsGuardados.length} tags.`);

    // 3. Crear 5 Agencias con sus respectivos Vendedores
    const passwordHash = await hashPassword("123456");
    const agenciasData = [
      { email: "juan@inmobiliaria.com", nombreUser: "Juan", agencia: "Inmobiliaria del Mar", dir: "Pinamar" },
      { email: "maria@urbana.com", nombreUser: "Maria", agencia: "Urbana Propiedades", dir: "Valeria del Mar" },
      { email: "carlos@century.com", nombreUser: "Carlos", agencia: "Century Brokers", dir: "Valeria del Mar" },
      { email: "lucia@premium.com", nombreUser: "Lucia", agencia: "Premium Real Estate", dir: "Ostende" },
      { email: "roberto@casas.com", nombreUser: "Roberto", agencia: "Casas & Cia", dir: "Mar de las Pampas" }
    ];

    let propCount = 1;
    for (const [index, data] of agenciasData.entries()) {
      // Vendedor
      const vendedor = sellerRepo.create({
        nombre: data.nombreUser,
        apellido: "Pérez",
        email: data.email,
        passwordHash,
        rol: "VENDEDOR"
      });
      await sellerRepo.save(vendedor);

      // Agencia
      const agencia = agencyRepo.create({
        nombreFantasia: data.agencia,
        descripcion: `Agencia líder en ${data.dir}.`,
        direccionLinea1: `Av. Falsa 123, ${data.dir}`,
        seller: vendedor
      });
      await agencyRepo.save(agencia);

      // 2 Propiedades por Agencia
      for (let i = 1; i <= 2; i++) {
        const estado = i === 1 ? "PUBLICADA" : (index % 2 === 0 ? "VENDIDA" : "BORRADOR");
        const propiedad = propertyRepo.create({
          titulo: `Hermosa propiedad ${propCount} en ${data.dir}`,
          descripcion: `Excelente oportunidad de inversión. Propiedad luminosa y bien ubicada en ${data.dir}.`,
          operacion: propCount % 2 === 0 ? "ALQUILER" : "VENTA",
          ambientes: Math.floor(Math.random() * 4) + 1,
          dormitorios: Math.floor(Math.random() * 3) + 1,
          banios: Math.floor(Math.random() * 2) + 1,
          superficieCubiertaM2: Math.floor(Math.random() * 100) + 40,
          precio: Math.floor(Math.random() * 200000) + 50000,
          moneda: "USD",
          barrioZona: data.dir,
          estado: estado,
          agency: agencia
        });
        await propertyRepo.save(propiedad);

        // Logs de historial (simulando que pasó de BORRADOR a PUBLICADA, y luego a VENDIDA)
        if (estado === "PUBLICADA" || estado === "VENDIDA") {
          await historyRepo.save(historyRepo.create({
            property: propiedad,
            estadoViejo: "BORRADOR",
            estadoNuevo: "PUBLICADA",
            // Simulamos hace un mes
            fechaCambio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }));
        }
        if (estado === "VENDIDA") {
          await historyRepo.save(historyRepo.create({
            property: propiedad,
            estadoViejo: "PUBLICADA",
            estadoNuevo: "VENDIDA",
            fechaCambio: new Date()
          }));
        }

        // Asignar 2 Tags aleatorios
        await propertyTagRepo.save(propertyTagRepo.create({ property: propiedad, tag: tagsGuardados[Math.floor(Math.random() * 3)] }));
        await propertyTagRepo.save(propertyTagRepo.create({ property: propiedad, tag: tagsGuardados[Math.floor(Math.random() * 3) + 3] }));

        // Agregar algunas preguntas a las publicadas
        if (estado === "PUBLICADA") {
          await questionRepo.save(questionRepo.create({
            property: propiedad,
            nombreSolicitante: "Interesado Anónimo",
            pregunta: "¿Sigue disponible? ¿Toman auto en parte de pago?",
            respuestaVendedor: index % 2 === 0 ? "Hola, sí sigue disponible. No tomamos autos." : null
          }));

          // Agregar Visitas
          await visitRepo.save(visitRepo.create({
            property: propiedad,
            nombreVisitante: "Visitante",
            apellidoVisitante: "Frecuente",
            telefonoVisitante: "1122334455",
            fechaPropuesta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // En 2 días
            estado: "PENDIENTE"
          }));
        }
        propCount++;
      }
    }

    console.log("✅ Creadas 5 Inmobiliarias con 2 Propiedades cada una.");
    console.log("✅ Creados historiales de estado, tags, preguntas y visitas.");
    console.log("🎉 Seed completado con éxito. Usa juan@inmobiliaria.com / 123456 para probar el Dashboard.");
  } catch (error) {
    console.error("❌ Error insertando datos:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});