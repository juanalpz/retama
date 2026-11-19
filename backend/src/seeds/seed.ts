/**
 * carga datos de prueba en la base.
 * borra todo lo que haya y deja tres inmobiliarias con propiedades en todos
 * los estados, fotos, tags, consultas, visitas, reseñas, actividad e historial,
 * para que cada pantalla tenga algo para mostrar.
 *
 * uso: npm run seed
 * vendedor de prueba: juan@inmobiliaria.com / 123456
 */

import { AppDataSource } from "../config/data-source";
import { Seller } from "../entities/seller.entity";
import { Agency } from "../entities/agency.entity";
import { AgencyPhone } from "../entities/agency-phone.entity";
import { AgencyEmail } from "../entities/agency-email.entity";
import { Property } from "../entities/property.entity";
import { PropertyPhoto } from "../entities/property-photo.entity";
import { Tag } from "../entities/tag.entity";
import { PropertyTag } from "../entities/property-tag.entity";
import { PropertyQuestion } from "../entities/property-question.entity";
import { Visit } from "../entities/visit.entity";
import { Review } from "../entities/review.entity";
import { Activity } from "../entities/activity.entity";
import { PropertyStatusHistory } from "../entities/property-status-history.entity";
import { hashPassword } from "../utils/auth.utils";
import { tipoToId } from "../utils/property-type.utils";

const DIA = 24 * 60 * 60 * 1000;

/**
 * calcula una fecha relativa a hoy.
 *
 * @param n cantidad de dias hacia atras (negativo para una fecha futura)
 * @returns la fecha resultante
 */
const haceDias = (n: number): Date => new Date(Date.now() - n * DIA);

// cantidad de fotos que hay en frontend/public/fotos (foto-01.jpg a foto-20.jpg)
const FOTOS_LOCALES = 20;

const TAGS = ["Cochera", "Apto mascotas", "Pileta", "Seguridad 24hs", "Balcón", "Gimnasio", "Parrilla", "Apto profesional"];

interface PropiedadSeed {
  titulo: string;
  descripcion: string;
  tipo: string;
  operacion: string;
  precio: number;
  moneda: string;
  direccion: string;
  zona: string;
  total: number;
  cubierta?: number;
  ambientes?: number;
  dormitorios?: number;
  banios?: number;
  antiguedad?: number;
  tags: string[];
  // recorrido de estados: cada paso es [estado nuevo, hace cuantos dias ocurrio]
  historial: [string, number][];
  // hace cuantos dias se creo
  creada: number;
}

interface InmobiliariaSeed {
  nombre: string;
  apellido: string;
  email: string;
  fantasia: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  propiedades: PropiedadSeed[];
  resenias: { nombre: string; texto: string; calificacion: number; hace: number }[];
}

const INMOBILIARIAS: InmobiliariaSeed[] = [
  {
    nombre: "Juan", apellido: "Pérez", email: "juan@inmobiliaria.com",
    fantasia: "Inmobiliaria del Mar",
    descripcion: "Más de 20 años vendiendo y alquilando propiedades en Pinamar.",
    direccion: "Av. Bunge 1250, Pinamar", telefono: "02254-48-1111",
    propiedades: [
      { titulo: "Depto 2 ambientes con vista al mar", descripcion: "Departamento luminoso a dos cuadras de la playa, con balcón al frente y cochera cubierta.", tipo: "DEPARTAMENTO", operacion: "ALQUILER", precio: 400, moneda: "USD", direccion: "Av. del Mar 320", zona: "Centro", total: 50, cubierta: 45, ambientes: 2, dormitorios: 1, banios: 1, antiguedad: 8, tags: ["Balcón", "Cochera"], historial: [["PUBLICADA", 40]], creada: 42 },
      { titulo: "Casa con pileta en Ostende", descripcion: "Casa de tres dormitorios sobre lote arbolado, con pileta, parrilla y quincho.", tipo: "CASA", operacion: "VENTA", precio: 120000, moneda: "USD", direccion: "Cairo 845", zona: "Ostende", total: 600, cubierta: 140, ambientes: 4, dormitorios: 3, banios: 2, antiguedad: 15, tags: ["Pileta", "Parrilla", "Cochera", "Apto mascotas"], historial: [["PUBLICADA", 25]], creada: 27 },
      { titulo: "Local comercial sobre Bunge", descripcion: "Local a la calle en plena zona comercial, con vidriera de 6 metros y baño.", tipo: "COMERCIAL", operacion: "ALQUILER", precio: 900000, moneda: "ARS", direccion: "Av. Bunge 980", zona: "Centro", total: 70, cubierta: 70, ambientes: 1, banios: 1, antiguedad: 20, tags: ["Apto profesional", "Seguridad 24hs"], historial: [["PUBLICADA", 12]], creada: 14 },
      { titulo: "Terreno en Pinamar Norte", descripcion: "Lote de 800 m² en zona residencial, a 400 metros del mar. Apto para construir.", tipo: "TERRENO", operacion: "VENTA", precio: 65000, moneda: "USD", direccion: "De las Gaviotas 1500", zona: "Pinamar Norte", total: 800, tags: [], historial: [["PUBLICADA", 5]], creada: 6 },
      { titulo: "Casa 4 ambientes con parrilla", descripcion: "Casa en dos plantas con jardín, parrilla y cochera doble. Lista para habitar.", tipo: "CASA", operacion: "VENTA", precio: 185000, moneda: "USD", direccion: "Del Tuyú 410", zona: "Valeria del Mar", total: 450, cubierta: 160, ambientes: 4, dormitorios: 3, banios: 2, antiguedad: 5, tags: ["Parrilla", "Cochera"], historial: [["PUBLICADA", 60], ["RESERVADA", 8]], creada: 62 },
      { titulo: "Monoambiente a estrenar", descripcion: "Monoambiente en edificio nuevo con gimnasio y seguridad las 24 horas.", tipo: "DEPARTAMENTO", operacion: "VENTA", precio: 58000, moneda: "USD", direccion: "Shaw 150", zona: "Centro", total: 32, cubierta: 30, ambientes: 1, banios: 1, antiguedad: 0, tags: ["Gimnasio", "Seguridad 24hs"], historial: [["PUBLICADA", 95], ["RESERVADA", 50], ["VENDIDA", 35]], creada: 97 },
      { titulo: "Depto 3 ambientes frente al golf", descripcion: "Tres ambientes con dos baños, balcón terraza y cochera. Alquiler anual.", tipo: "DEPARTAMENTO", operacion: "ALQUILER", precio: 650, moneda: "USD", direccion: "Júpiter 700", zona: "Golf", total: 85, cubierta: 78, ambientes: 3, dormitorios: 2, banios: 2, antiguedad: 12, tags: ["Balcón", "Cochera"], historial: [["PUBLICADA", 70], ["PAUSADA", 55], ["PUBLICADA", 48], ["RESERVADA", 30], ["ALQUILADA", 20]], creada: 72 },
      { titulo: "Casa quinta en Mar de las Pampas", descripcion: "Casa de madera entre los pinos, ideal para descanso. Publicación en pausa por refacciones.", tipo: "CASA", operacion: "ALQUILER", precio: 800, moneda: "USD", direccion: "Los Incas 220", zona: "Mar de las Pampas", total: 900, cubierta: 110, ambientes: 3, dormitorios: 2, banios: 1, antiguedad: 18, tags: ["Parrilla", "Apto mascotas"], historial: [["PUBLICADA", 30], ["PAUSADA", 10]], creada: 31 },
      { titulo: "Dúplex en construcción", descripcion: "Dúplex de dos dormitorios en pozo. Todavía sin publicar.", tipo: "CASA", operacion: "VENTA", precio: 95000, moneda: "USD", direccion: "Totoras 60", zona: "Ostende", total: 180, cubierta: 90, ambientes: 3, dormitorios: 2, banios: 2, tags: [], historial: [], creada: 2 },
      { titulo: "PH antiguo a refaccionar", descripcion: "PH al fondo con patio. La publicación fue dada de baja.", tipo: "CASA", operacion: "VENTA", precio: 70000, moneda: "USD", direccion: "Rivadavia 330", zona: "Centro", total: 120, cubierta: 75, ambientes: 3, dormitorios: 2, banios: 1, antiguedad: 45, tags: [], historial: [["PUBLICADA", 80], ["CANCELADA", 45]], creada: 82 },
    ],
    resenias: [
      { nombre: "Laura", texto: "Muy buena atención, nos acompañaron en todo el proceso.", calificacion: 5, hace: 20 },
      { nombre: "Martín", texto: "Respondieron rápido y la visita fue puntual.", calificacion: 4, hace: 9 },
      { nombre: "Sofía", texto: "Buenas propiedades, aunque tardaron en confirmar el turno.", calificacion: 3, hace: 2 },
    ],
  },
  {
    nombre: "María", apellido: "Gómez", email: "maria@urbana.com",
    fantasia: "Urbana Propiedades",
    descripcion: "Especialistas en alquileres temporarios y anuales en Valeria del Mar.",
    direccion: "Espora 1410, Valeria del Mar", telefono: "02254-48-2222",
    propiedades: [
      { titulo: "Depto 1 dormitorio a metros de la playa", descripcion: "Departamento en planta baja con patio propio y parrilla.", tipo: "DEPARTAMENTO", operacion: "ALQUILER", precio: 350, moneda: "USD", direccion: "Azopardo 210", zona: "Valeria del Mar", total: 48, cubierta: 40, ambientes: 2, dormitorios: 1, banios: 1, antiguedad: 10, tags: ["Parrilla", "Apto mascotas"], historial: [["PUBLICADA", 18]], creada: 19 },
      { titulo: "Chalet clásico con jardín", descripcion: "Chalet de ladrillo a la vista con amplio jardín y cochera.", tipo: "CASA", operacion: "VENTA", precio: 210000, moneda: "USD", direccion: "Corbeta Uruguay 950", zona: "Valeria del Mar", total: 700, cubierta: 180, ambientes: 5, dormitorios: 4, banios: 3, antiguedad: 30, tags: ["Cochera", "Pileta"], historial: [["PUBLICADA", 33]], creada: 35 },
      { titulo: "Oficina en planta alta", descripcion: "Oficina de dos ambientes con recepción, apta profesional.", tipo: "COMERCIAL", operacion: "ALQUILER", precio: 450000, moneda: "ARS", direccion: "Espora 1200", zona: "Valeria del Mar", total: 45, cubierta: 45, ambientes: 2, banios: 1, antiguedad: 6, tags: ["Apto profesional"], historial: [["PUBLICADA", 100], ["RESERVADA", 65], ["ALQUILADA", 58]], creada: 101 },
    ],
    resenias: [
      { nombre: "Diego", texto: "Excelente trato y mucha claridad con los gastos.", calificacion: 5, hace: 15 },
      { nombre: "Carla", texto: "Todo en orden, recomendable.", calificacion: 4, hace: 4 },
    ],
  },
  {
    nombre: "Carlos", apellido: "Díaz", email: "carlos@century.com",
    fantasia: "Century Brokers",
    descripcion: "Venta de terrenos y casas en Ostende y Cariló.",
    direccion: "Av. Víctor Hugo 500, Ostende", telefono: "02254-48-3333",
    propiedades: [
      { titulo: "Lote en Cariló entre pinos", descripcion: "Terreno de 1200 m² sobre calle de arena, con mensura al día.", tipo: "TERRENO", operacion: "VENTA", precio: 150000, moneda: "USD", direccion: "Cerezo 800", zona: "Cariló", total: 1200, tags: [], historial: [["PUBLICADA", 22]], creada: 24 },
      { titulo: "Casa moderna con pileta climatizada", descripcion: "Casa minimalista de cuatro dormitorios con pileta climatizada y gimnasio.", tipo: "CASA", operacion: "VENTA", precio: 390000, moneda: "USD", direccion: "Avutarda 300", zona: "Cariló", total: 1000, cubierta: 260, ambientes: 6, dormitorios: 4, banios: 4, antiguedad: 3, tags: ["Pileta", "Gimnasio", "Seguridad 24hs", "Cochera"], historial: [["PUBLICADA", 9]], creada: 10 },
    ],
    resenias: [
      { nombre: "Pablo", texto: "Conocen muy bien la zona.", calificacion: 4, hace: 6 },
    ],
  },
];

/**
 * vacia la base y carga los datos de prueba dentro de una sola corrida.
 * si algo falla lo informa por consola y deja el proceso con codigo de error.
 *
 * @returns una promesa sin valor; resuelve cuando termino la carga y se cerro la conexion
 */
async function seed(): Promise<void> {
  await AppDataSource.initialize();
  console.log("iniciando carga de datos de prueba...");

  const manager = AppDataSource.manager;

  try {
    // 1. se vacian todas las tablas y se reinician los ids para arrancar siempre igual
    await AppDataSource.query(`
      TRUNCATE TABLE actividades, propiedades_cambios_logs, visitas, preguntas_propiedad,
        propiedades_tags, propiedades_fotos, propiedades, tags, resenias_inmobiliaria,
        inmobiliarias_telefonos, inmobiliarias_correos, inmobiliarias, usuarios
      RESTART IDENTITY CASCADE
    `);

    // 2. tags (amenities)
    const tags = new Map<string, Tag>();
    for (const nombre of TAGS) {
      tags.set(nombre, await manager.save(manager.create(Tag, { tag: nombre })));
    }

    // todos los vendedores de prueba usan la misma contraseña
    const passwordHash = await hashPassword("123456");
    let totalPropiedades = 0;

    for (const data of INMOBILIARIAS) {
      // 3. vendedor e inmobiliaria con sus datos de contacto
      const seller = await manager.save(manager.create(Seller, {
        nombre: data.nombre, apellido: data.apellido, email: data.email, passwordHash, rol: "VENDEDOR",
      }));

      const agency = await manager.save(manager.create(Agency, {
        nombreFantasia: data.fantasia, descripcion: data.descripcion, direccionLinea1: data.direccion, seller,
      }));

      await manager.save(manager.create(AgencyPhone, { agency, telefono: data.telefono, tipoTelefono: "Principal" }));
      await manager.save(manager.create(AgencyEmail, { agency, correo: data.email, tipoCorreo: "Principal" }));

      // 4. reseñas, con su aviso en el feed de actividad
      for (const r of data.resenias) {
        const review = await manager.save(manager.create(Review, {
          agency, nombreSolicitante: r.nombre, resenia: r.texto, calificacion: r.calificacion, fechaCreacion: haceDias(r.hace),
        }));
        await manager.save(manager.create(Activity, {
          seller, tipo: "RESENIA", referenciaId: review.id, referenciaTipo: "resenia",
          mensaje: `Nueva reseña de ${r.nombre} (${r.calificacion} estrellas)`,
          leido: r.hace > 5, fechaCreacion: haceDias(r.hace),
        }));
      }

      // 5. propiedades
      for (const p of data.propiedades) {
        const estadoActual = p.historial.length > 0 ? p.historial[p.historial.length - 1][0] : "BORRADOR";

        const property = await manager.save(manager.create(Property, {
          agency,
          titulo: p.titulo,
          descripcion: p.descripcion,
          idTipoPropiedad: tipoToId(p.tipo),
          operacion: p.operacion,
          precio: p.precio,
          moneda: p.moneda,
          direccionLinea1: p.direccion,
          barrioZona: p.zona,
          superficieTotalM2: p.total,
          superficieCubiertaM2: p.cubierta ?? null,
          ambientes: p.ambientes ?? null,
          dormitorios: p.dormitorios ?? null,
          banios: p.banios ?? null,
          antiguedad: p.antiguedad ?? null,
          estado: estadoActual,
          createdAt: haceDias(p.creada),
        }));
        totalPropiedades++;

        // tres fotos por propiedad, la primera es la portada. son archivos locales
        // que sirve el front (frontend/public/fotos), asi se ven sin internet.
        // cada propiedad arranca en una foto distinta y despues se repite el ciclo.
        for (let orden = 0; orden < 3; orden++) {
          const numero = ((totalPropiedades - 1 + orden * 7) % FOTOS_LOCALES) + 1;
          await manager.save(manager.create(PropertyPhoto, {
            property,
            url: `/fotos/foto-${String(numero).padStart(2, "0")}.jpg`,
            orden,
            esPortada: orden === 0,
          }));
        }

        for (const nombre of p.tags) {
          await manager.save(manager.create(PropertyTag, { property, tag: tags.get(nombre)! }));
        }

        // historial de estados: una fila por cada cambio, en orden
        let estadoViejo = "BORRADOR";
        for (const [estadoNuevo, hace] of p.historial) {
          await manager.save(manager.create(PropertyStatusHistory, {
            property, estadoViejo, estadoNuevo, fechaCambio: haceDias(hace),
          }));
          await manager.save(manager.create(Activity, {
            seller, tipo: "CAMBIO_ESTADO", referenciaId: property.id, referenciaTipo: "propiedad",
            mensaje: `El estado de la propiedad "${p.titulo}" cambió de ${estadoViejo} a ${estadoNuevo}`,
            leido: true, fechaCreacion: haceDias(hace),
          }));
          estadoViejo = estadoNuevo;
        }

        // consultas y visitas solo en las publicadas
        if (estadoActual === "PUBLICADA") {
          const respondida = await manager.save(manager.create(PropertyQuestion, {
            property, nombreSolicitante: "Ana", pregunta: "¿Admite mascotas?",
            respuestaVendedor: "Sí, se aceptan mascotas chicas.", fechaCreacion: haceDias(3),
          }));
          const pendiente = await manager.save(manager.create(PropertyQuestion, {
            property, nombreSolicitante: "Luis", pregunta: "¿Tiene gastos de expensas?",
            respuestaVendedor: null, fechaCreacion: haceDias(1),
          }));

          for (const [consulta, hace] of [[respondida, 3], [pendiente, 1]] as [PropertyQuestion, number][]) {
            await manager.save(manager.create(Activity, {
              seller, tipo: "COMENTARIO", referenciaId: consulta.id, referenciaTipo: "pregunta",
              mensaje: `Nueva consulta de ${consulta.nombreSolicitante} en la propiedad: ${p.titulo}`,
              leido: hace > 1, fechaCreacion: haceDias(hace),
            }));
          }

          const visita = await manager.save(manager.create(Visit, {
            property, nombreVisitante: "María", apellidoVisitante: "López", telefonoVisitante: "011-4444-4444",
            fechaPropuesta: haceDias(-3), mensajeAsociado: "Puedo por la tarde.", estado: "PENDIENTE",
          }));
          await manager.save(manager.create(Activity, {
            seller, tipo: "SOLICITUD_VISITA", referenciaId: visita.id, referenciaTipo: "visita",
            mensaje: `Nueva solicitud de visita de María López en la propiedad: ${p.titulo}`,
            leido: false, fechaCreacion: haceDias(0),
          }));
        }

        // visitas en el resto de los estados, para probar cada caso del listado
        if (estadoActual === "RESERVADA") {
          await manager.save(manager.create(Visit, {
            property, nombreVisitante: "Pedro", apellidoVisitante: "Suárez", telefonoVisitante: "011-3333-3333",
            fechaPropuesta: haceDias(-1), estado: "CONFIRMADA",
          }));
        }
        if (estadoActual === "VENDIDA" || estadoActual === "ALQUILADA") {
          await manager.save(manager.create(Visit, {
            property, nombreVisitante: "Elena", telefonoVisitante: "011-2222-2222",
            fechaPropuesta: haceDias(40), estado: "REALIZADA",
          }));
          await manager.save(manager.create(Visit, {
            property, nombreVisitante: "Jorge", telefonoVisitante: "011-5555-5555",
            fechaPropuesta: haceDias(38), estado: "RECHAZADA",
          }));
        }
      }
    }

    console.log(`creadas ${INMOBILIARIAS.length} inmobiliarias, ${totalPropiedades} propiedades y ${TAGS.length} tags.`);
    console.log("seed completado. vendedor de prueba: juan@inmobiliaria.com / 123456");
  } catch (error) {
    console.error("error cargando los datos de prueba:", error);
    process.exitCode = 1;
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
