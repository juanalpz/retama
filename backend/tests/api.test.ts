/**
 * tests de integracion de la api.
 *
 * levantan la aplicacion real contra una base de datos de test aparte
 * (DB_NAME_TEST, por defecto "retama_test") y recorren todos los endpoints
 * con sus casos validos y sus errores. la base de test se vacia al empezar,
 * asi que la base de desarrollo nunca se toca.
 *
 * uso: npm test   (necesita postgres levantado y la base de test creada)
 */

// tiene que ir antes de importar la app para que se elija la base de test
process.env.NODE_ENV = 'test';

import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Client } from 'pg';
import app from '../src/app';
import { AppDataSource } from '../src/config/data-source';
import { Tag } from '../src/entities/tag.entity';

let server: Server;
let baseUrl = '';

/**
 * hace una peticion a la api levantada para los tests.
 *
 * @param method metodo http (GET, POST, PUT, PATCH, DELETE)
 * @param path ruta sin el prefijo /api, por ejemplo '/properties?limit=3'
 * @param body objeto a enviar como json, o un texto para enviarlo tal cual (opcional)
 * @param token token jwt para el header authorization (opcional)
 * @returns { status, body, text, headers }: el codigo http, el body ya parseado, el body como texto y los headers
 */
async function api(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }

  return { status: res.status, body: json, text, headers: res.headers };
}

/**
 * arma una fecha relativa a hoy, para pedir visitas.
 *
 * @param dias cantidad de dias hacia adelante (negativo para una fecha pasada)
 * @returns la fecha en formato iso
 */
const enDias = (dias: number) => new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

// datos que se van guardando entre tests
const ctx: any = { tags: {} };

/**
 * arma un body valido para crear una propiedad.
 *
 * @param extra campos que el test quiere pisar o agregar (opcional)
 * @returns el body completo, listo para enviar a POST /vendedor/propiedades
 */
const propiedad = (extra: Record<string, unknown> = {}) => ({
  titulo: 'Depto 2 ambientes con vista',
  descripcion: 'Departamento luminoso cerca de la playa',
  tipoPropiedad: 'DEPARTAMENTO',
  operacion: 'ALQUILER',
  precio: 400,
  moneda: 'USD',
  direccionLinea1: 'Av. del Mar 320',
  barrioZona: 'Centro',
  superficieTotalM2: 50,
  superficieCubiertaM2: 45,
  ambientes: 2,
  dormitorios: 1,
  banios: 1,
  antiguedad: 8,
  ...extra,
});

/**
 * crea la base de test si todavia no existe, conectandose a la base "postgres".
 *
 * @returns una promesa sin valor; resuelve cuando la base de test existe
 */
async function ensureTestDatabase(): Promise<void> {
  const options = AppDataSource.options as any;
  const client = new Client({
    host: options.host, port: options.port, user: options.username, password: options.password, database: 'postgres',
  });
  await client.connect();
  try {
    const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [options.database]);
    if (found.rowCount === 0) {
      await client.query(`CREATE DATABASE "${options.database}"`);
    }
  } finally {
    await client.end();
  }
}

before(async () => {
  await ensureTestDatabase();
  await AppDataSource.initialize();

  // los tags no tienen endpoint de alta, se cargan directo en la base
  const tagRepo = AppDataSource.getRepository(Tag);
  for (const nombre of ['Pileta', 'Cochera', 'Parrilla']) {
    const tag = await tagRepo.save(tagRepo.create({ tag: nombre }));
    ctx.tags[nombre] = tag.id;
  }

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await AppDataSource.destroy();
});

// ---------------------------------------------------------------------
describe('infraestructura', () => {
  it('GET /health responde 200 con status ok', async () => {
    const res = await api('GET', '/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  });

  it('una ruta inexistente responde 404 con el formato { error }', async () => {
    const res = await api('GET', '/no-existe');
    assert.equal(res.status, 404);
    assert.equal(typeof res.body.error, 'string');
  });

  it('un json mal formado responde 400 y no filtra el stack', async () => {
    const res = await api('POST', '/auth/login', '{mal json');
    assert.equal(res.status, 400);
    assert.equal(typeof res.body.error, 'string');
    assert.ok(!res.text.includes('at '), 'no debe incluir el stack trace');
  });

  it('cors habilita el origen del front', async () => {
    const res = await fetch(`${baseUrl}/health`, { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  });
});

// ---------------------------------------------------------------------
describe('modelo de datos', () => {
  it('los tests corren contra una base aparte, nunca la de desarrollo', () => {
    const base = (AppDataSource.options as any).database;
    assert.equal(base, process.env.DB_NAME_TEST || 'retama_test');
    assert.notEqual(base, process.env.DB_NAME);
  });

  it('existen las entidades del dominio', () => {
    const entidades = AppDataSource.entityMetadatas.map((meta) => meta.name);
    // en el codigo, comment es PropertyQuestion y visitrequest es Visit
    for (const nombre of ['Seller', 'Agency', 'Property', 'PropertyStatusHistory', 'Review', 'PropertyQuestion', 'Visit', 'Activity']) {
      assert.ok(entidades.includes(nombre), `falta la entidad ${nombre}`);
    }
  });

  it('todas las relaciones definen onDelete de forma explicita', () => {
    const sinDefinir: string[] = [];
    for (const meta of AppDataSource.entityMetadatas) {
      // solo el lado que tiene la clave foranea decide que pasa al borrar
      for (const relacion of meta.relations.filter((r) => r.isManyToOne || (r.isOneToOne && r.isOwning))) {
        if (!relacion.onDelete) sinDefinir.push(`${meta.name}.${relacion.propertyName}`);
      }
    }
    assert.deepEqual(sinDefinir, []);
  });

  it('las relaciones del enunciado estan modeladas', () => {
    /**
     * busca la entidad a la que apunta una relacion.
     *
     * @param entidad nombre de la entidad que tiene la clave foranea
     * @param propiedad nombre de la propiedad de la relacion
     * @returns el nombre de la entidad destino, o undefined si la relacion no existe
     */
    const destino = (entidad: string, propiedad: string) =>
      AppDataSource.getMetadata(entidad).relations.find((r) => r.propertyName === propiedad)?.inverseEntityMetadata.name;

    assert.equal(destino('Property', 'agency'), 'Agency');
    assert.equal(destino('Review', 'agency'), 'Agency');
    assert.equal(destino('PropertyQuestion', 'property'), 'Property');
    assert.equal(destino('Visit', 'property'), 'Property');
    assert.equal(destino('PropertyStatusHistory', 'property'), 'Property');
  });
});

// ---------------------------------------------------------------------
describe('autenticacion', () => {
  const vendedorA = {
    nombre: 'Ana', apellido: 'Suarez', email: 'ana@test.com', password: 'secreta1',
    telefono: '02254-481111', nombreFantasia: 'Inmobiliaria del Sol', descripcion: 'Ventas en Pinamar',
  };
  const vendedorB = {
    nombre: 'Beto', apellido: 'Lopez', email: 'beto@test.com', password: 'secreta2',
    nombreFantasia: 'Costa Propiedades',
  };

  it('registra un vendedor y crea su inmobiliaria en el mismo paso', async () => {
    const res = await api('POST', '/auth/register', vendedorA);
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.usuario.email, 'ana@test.com');
    assert.equal(res.body.usuario.inmobiliaria.nombreFantasia, 'Inmobiliaria del Sol');
    assert.ok(!res.text.includes('passwordHash'), 'no debe devolver el hash');
    assert.ok(!res.text.includes('secreta1'), 'no debe devolver la contraseña');
    ctx.tokenA = res.body.token;
    ctx.agencyA = res.body.usuario.inmobiliaria.id;

    const resB = await api('POST', '/auth/register', vendedorB);
    assert.equal(resB.status, 201);
    ctx.tokenB = resB.body.token;
    ctx.agencyB = resB.body.usuario.inmobiliaria.id;
  });

  it('la contraseña se guarda hasheada, nunca en texto plano', async () => {
    const rows = await AppDataSource.query(`SELECT password_hash FROM usuarios WHERE email = 'ana@test.com'`);
    assert.notEqual(rows[0].password_hash, 'secreta1');
    assert.ok(rows[0].password_hash.startsWith('$2'), 'debe ser un hash de bcrypt');
  });

  it('un body invalido responde 400 indicando los campos que fallaron', async () => {
    const res = await api('POST', '/auth/register', { email: 'no-es-email', password: '123' });
    assert.equal(res.status, 400);
    const campos = res.body.details.map((d: any) => d.field);
    for (const campo of ['nombre', 'apellido', 'email', 'password', 'nombreFantasia']) {
      assert.ok(campos.includes(campo), `falta el campo ${campo} en details`);
    }
  });

  it('un email repetido responde 409 y señala el campo', async () => {
    const res = await api('POST', '/auth/register', { ...vendedorA, nombreFantasia: 'Otra Inmobiliaria' });
    assert.equal(res.status, 409);
    assert.equal(res.body.details[0].field, 'email');
  });

  it('un nombre de fantasia repetido responde 409 aunque cambien las mayusculas', async () => {
    const res = await api('POST', '/auth/register', { ...vendedorA, email: 'otra@test.com', nombreFantasia: 'INMOBILIARIA DEL SOL' });
    assert.equal(res.status, 409);
    assert.equal(res.body.details[0].field, 'nombreFantasia');
  });

  it('un registro que falla no deja un vendedor a medias', async () => {
    const rows = await AppDataSource.query(`SELECT COUNT(*)::int AS n FROM usuarios WHERE email = 'otra@test.com'`);
    assert.equal(rows[0].n, 0);
  });

  it('login correcto devuelve el token', async () => {
    const res = await api('POST', '/auth/login', { email: 'ANA@test.com', password: 'secreta1' });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.usuario.inmobiliaria.id, ctx.agencyA);
    assert.ok(!res.text.includes('passwordHash'));
  });

  it('contraseña incorrecta o email inexistente responden 401', async () => {
    const mal = await api('POST', '/auth/login', { email: 'ana@test.com', password: 'incorrecta' });
    assert.equal(mal.status, 401);
    const inexistente = await api('POST', '/auth/login', { email: 'nadie@test.com', password: 'secreta1' });
    assert.equal(inexistente.status, 401);
    assert.equal(mal.body.error, inexistente.body.error);
  });

  it('GET /auth/me devuelve el vendedor del token', async () => {
    const res = await api('GET', '/auth/me', undefined, ctx.tokenA);
    assert.equal(res.status, 200);
    assert.equal(res.body.usuario.email, 'ana@test.com');
    assert.equal(res.body.usuario.inmobiliaria.id, ctx.agencyA);
  });

  it('sin token o con un token invalido responde 401', async () => {
    assert.equal((await api('GET', '/auth/me')).status, 401);
    assert.equal((await api('GET', '/auth/me', undefined, 'token.falso.123')).status, 401);
  });

  it('todas las rutas del vendedor exigen token', async () => {
    const rutas: [string, string][] = [
      ['GET', '/vendedor/inmobiliaria'], ['PUT', '/vendedor/inmobiliaria'], ['DELETE', '/vendedor/inmobiliaria'],
      ['POST', '/vendedor/inmobiliaria/telefonos'], ['POST', '/vendedor/inmobiliaria/correos'],
      ['GET', '/vendedor/propiedades'], ['POST', '/vendedor/propiedades'], ['GET', '/vendedor/propiedades/1'],
      ['PUT', '/vendedor/propiedades/1'], ['PATCH', '/vendedor/propiedades/1/estado'], ['DELETE', '/vendedor/propiedades/1'],
      ['GET', '/vendedor/propiedades/1/fotos'], ['POST', '/vendedor/propiedades/1/fotos'],
      ['GET', '/vendedor/comentarios'], ['PUT', '/vendedor/comentarios/1/respuesta'],
      ['GET', '/vendedor/visitas'], ['PUT', '/vendedor/visitas/1/estado'],
      ['GET', '/vendedor/actividad'], ['GET', '/vendedor/actividad/sin-leer'],
      ['PATCH', '/vendedor/actividad/leer-todas'], ['PATCH', '/vendedor/actividad/1/leer'],
      ['GET', '/vendedor/reportes'], ['GET', '/vendedor/reportes/por-estado'],
      ['GET', '/vendedor/reportes/mensual'], ['GET', '/vendedor/reportes/tiempo-en-mercado'],
    ];
    for (const [method, path] of rutas) {
      const res = await api(method, path);
      assert.equal(res.status, 401, `${method} ${path} deberia responder 401`);
    }
  });
});

// ---------------------------------------------------------------------
describe('tags', () => {
  it('GET /tags lista los amenities ordenados', async () => {
    const res = await api('GET', '/tags');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.map((t: any) => t.tag), ['Cochera', 'Parrilla', 'Pileta']);
  });
});

// ---------------------------------------------------------------------
describe('perfil de la inmobiliaria (vendedor)', () => {
  it('devuelve el perfil con el email y el telefono cargados en el registro', async () => {
    const res = await api('GET', '/vendedor/inmobiliaria', undefined, ctx.tokenA);
    assert.equal(res.status, 200);
    assert.equal(res.body.inmobiliaria.nombreFantasia, 'Inmobiliaria del Sol');
    assert.equal(res.body.inmobiliaria.correos[0].correo, 'ana@test.com');
    assert.equal(res.body.inmobiliaria.telefonos[0].telefono, '02254-481111');
  });

  it('edita los datos de la inmobiliaria', async () => {
    const res = await api('PUT', '/vendedor/inmobiliaria', { descripcion: 'Nueva descripcion', direccionLinea1: 'Bunge 100' }, ctx.tokenA);
    assert.equal(res.status, 200);
    assert.equal(res.body.inmobiliaria.descripcion, 'Nueva descripcion');
    assert.equal(res.body.inmobiliaria.direccionLinea1, 'Bunge 100');
  });

  it('no deja usar el nombre de fantasia de otra inmobiliaria (409)', async () => {
    const res = await api('PUT', '/vendedor/inmobiliaria', { nombreFantasia: 'costa propiedades' }, ctx.tokenA);
    assert.equal(res.status, 409);
    assert.equal(res.body.details[0].field, 'nombreFantasia');
  });

  it('rechaza campos que no existen (400)', async () => {
    const res = await api('PUT', '/vendedor/inmobiliaria', { rol: 'ADMIN' }, ctx.tokenA);
    assert.equal(res.status, 400);
  });

  it('agrega y elimina telefonos y correos', async () => {
    const tel = await api('POST', '/vendedor/inmobiliaria/telefonos', { telefono: '011-5555-5555', tipoTelefono: 'WhatsApp' }, ctx.tokenA);
    assert.equal(tel.status, 201);
    const mail = await api('POST', '/vendedor/inmobiliaria/correos', { correo: 'ventas@sol.com', tipoCorreo: 'Ventas' }, ctx.tokenA);
    assert.equal(mail.status, 201);

    assert.equal((await api('POST', '/vendedor/inmobiliaria/telefonos', { telefono: '1' }, ctx.tokenA)).status, 400);
    assert.equal((await api('POST', '/vendedor/inmobiliaria/correos', { correo: 'no-es-mail' }, ctx.tokenA)).status, 400);

    // otro vendedor no puede borrar un telefono ajeno
    assert.equal((await api('DELETE', `/vendedor/inmobiliaria/telefonos/${tel.body.telefono.id}`, undefined, ctx.tokenB)).status, 404);

    assert.equal((await api('DELETE', `/vendedor/inmobiliaria/telefonos/${tel.body.telefono.id}`, undefined, ctx.tokenA)).status, 200);
    assert.equal((await api('DELETE', `/vendedor/inmobiliaria/correos/${mail.body.correo.id}`, undefined, ctx.tokenA)).status, 200);
    assert.equal((await api('DELETE', '/vendedor/inmobiliaria/telefonos/99999', undefined, ctx.tokenA)).status, 404);
    // un id mal formado se responde como inexistente, sin llegar a la base
    assert.equal((await api('DELETE', '/vendedor/inmobiliaria/telefonos/abc', undefined, ctx.tokenA)).status, 404);
    assert.equal((await api('DELETE', '/vendedor/inmobiliaria/correos/abc', undefined, ctx.tokenA)).status, 404);
  });
});

// ---------------------------------------------------------------------
describe('propiedades: abm', () => {
  it('valida precio y superficies mayores a 0', async () => {
    const precio = await api('POST', '/vendedor/propiedades', propiedad({ precio: 0 }), ctx.tokenA);
    assert.equal(precio.status, 400);
    assert.equal(precio.body.details[0].field, 'precio');

    const negativo = await api('POST', '/vendedor/propiedades', propiedad({ precio: -10 }), ctx.tokenA);
    assert.equal(negativo.status, 400);

    const total = await api('POST', '/vendedor/propiedades', propiedad({ superficieTotalM2: 0 }), ctx.tokenA);
    assert.equal(total.status, 400);
    assert.equal(total.body.details[0].field, 'superficieTotalM2');

    const cubierta = await api('POST', '/vendedor/propiedades', propiedad({ superficieCubiertaM2: -5 }), ctx.tokenA);
    assert.equal(cubierta.status, 400);
  });

  it('exige los campos obligatorios y rechaza valores fuera de lista', async () => {
    const vacio = await api('POST', '/vendedor/propiedades', {}, ctx.tokenA);
    assert.equal(vacio.status, 400);
    const campos = vacio.body.details.map((d: any) => d.field);
    for (const campo of ['titulo', 'descripcion', 'tipoPropiedad', 'operacion', 'precio', 'moneda', 'direccionLinea1', 'barrioZona', 'superficieTotalM2']) {
      assert.ok(campos.includes(campo), `falta ${campo}`);
    }

    assert.equal((await api('POST', '/vendedor/propiedades', propiedad({ tipoPropiedad: 'CASTILLO' }), ctx.tokenA)).status, 400);
    assert.equal((await api('POST', '/vendedor/propiedades', propiedad({ moneda: 'EUR' }), ctx.tokenA)).status, 400);
    assert.equal((await api('POST', '/vendedor/propiedades', propiedad({ operacion: 'PERMUTA' }), ctx.tokenA)).status, 400);

    // la superficie cubierta es obligatoria salvo en terrenos
    const sinCubierta = await api('POST', '/vendedor/propiedades', propiedad({ superficieCubiertaM2: undefined }), ctx.tokenA);
    assert.equal(sinCubierta.status, 400);
    assert.equal(sinCubierta.body.details[0].field, 'superficieCubiertaM2');
  });

  it('crea una propiedad en borrador con sus tags y todos sus datos', async () => {
    const res = await api('POST', '/vendedor/propiedades', propiedad({ tags: [ctx.tags.Pileta, ctx.tags.Cochera] }), ctx.tokenA);
    assert.equal(res.status, 201);
    const p = res.body.propiedad;
    assert.equal(p.estado, 'BORRADOR');
    assert.equal(p.tipoPropiedad, 'DEPARTAMENTO');
    assert.equal(p.antiguedad, 8);
    assert.equal(p.superficieTotalM2, 50);
    assert.deepEqual(p.tags.map((t: any) => t.tag.tag).sort(), ['Cochera', 'Pileta']);
    ctx.p1 = p.id;
  });

  it('en un terreno no guarda superficie cubierta, ambientes, dormitorios ni baños', async () => {
    const res = await api('POST', '/vendedor/propiedades', propiedad({
      titulo: 'Terreno en Pinamar Norte', descripcion: 'Lote apto para construir', tipoPropiedad: 'TERRENO',
      operacion: 'VENTA', precio: 65000, barrioZona: 'Pinamar Norte', superficieTotalM2: 800,
    }), ctx.tokenA);
    assert.equal(res.status, 201);
    const p = res.body.propiedad;
    assert.equal(p.tipoPropiedad, 'TERRENO');
    assert.equal(p.superficieCubiertaM2, null);
    assert.equal(p.ambientes, null);
    assert.equal(p.dormitorios, null);
    assert.equal(p.banios, null);
    ctx.p3 = p.id;
  });

  it('crea el resto de las propiedades de prueba', async () => {
    const casa = await api('POST', '/vendedor/propiedades', propiedad({
      titulo: 'Casa con pileta', descripcion: 'Casa con quincho y parque arbolado', tipoPropiedad: 'CASA', operacion: 'VENTA',
      precio: 120000, barrioZona: 'Ostende', superficieTotalM2: 600, superficieCubiertaM2: 140, ambientes: 4,
      tags: [ctx.tags.Pileta],
    }), ctx.tokenA);
    assert.equal(casa.status, 201);
    ctx.p2 = casa.body.propiedad.id;

    const borrador = await api('POST', '/vendedor/propiedades', propiedad({ titulo: 'Duplex en pozo' }), ctx.tokenA);
    assert.equal(borrador.status, 201);
    ctx.p4 = borrador.body.propiedad.id;

    const deB = await api('POST', '/vendedor/propiedades', propiedad({
      titulo: 'Casa en Carilo', descripcion: 'Casa entre pinos', tipoPropiedad: 'CASA', operacion: 'VENTA',
      precio: 200000, barrioZona: 'Carilo', superficieTotalM2: 1000, superficieCubiertaM2: 200, ambientes: 5,
    }), ctx.tokenB);
    assert.equal(deB.status, 201);
    ctx.pB = deB.body.propiedad.id;
  });

  it('lista las propiedades del vendedor y filtra por estado', async () => {
    const todas = await api('GET', '/vendedor/propiedades', undefined, ctx.tokenA);
    assert.equal(todas.status, 200);
    assert.equal(todas.body.total, 4);

    const borradores = await api('GET', '/vendedor/propiedades?estado=borrador', undefined, ctx.tokenA);
    assert.equal(borradores.body.total, 4);

    const publicadas = await api('GET', '/vendedor/propiedades?estado=PUBLICADA', undefined, ctx.tokenA);
    assert.equal(publicadas.body.total, 0);
  });

  it('un vendedor no ve ni modifica propiedades de otro (404)', async () => {
    assert.equal((await api('GET', `/vendedor/propiedades/${ctx.p1}`, undefined, ctx.tokenB)).status, 404);
    assert.equal((await api('PUT', `/vendedor/propiedades/${ctx.p1}`, { precio: 1 }, ctx.tokenB)).status, 404);
    assert.equal((await api('PATCH', `/vendedor/propiedades/${ctx.p1}/estado`, { nuevoEstado: 'CANCELADA' }, ctx.tokenB)).status, 404);
    assert.equal((await api('DELETE', `/vendedor/propiedades/${ctx.p1}`, undefined, ctx.tokenB)).status, 404);
    assert.equal((await api('POST', `/vendedor/propiedades/${ctx.p1}/fotos`, { url: 'https://x.com/a.jpg' }, ctx.tokenB)).status, 404);
  });

  it('edita una propiedad y valida los datos al editar', async () => {
    const ok = await api('PUT', `/vendedor/propiedades/${ctx.p1}`, { precio: 450, titulo: 'Depto 2 ambientes con vista al mar', tags: [ctx.tags.Pileta, ctx.tags.Cochera] }, ctx.tokenA);
    assert.equal(ok.status, 200);
    assert.equal(ok.body.propiedad.precio, 450);
    assert.equal(ok.body.propiedad.tags.length, 2);

    assert.equal((await api('PUT', `/vendedor/propiedades/${ctx.p1}`, { precio: 0 }, ctx.tokenA)).status, 400);
    assert.equal((await api('PUT', `/vendedor/propiedades/${ctx.p1}`, { superficieTotalM2: -1 }, ctx.tokenA)).status, 400);
    assert.equal((await api('PUT', `/vendedor/propiedades/${ctx.p1}`, { estado: 'VENDIDA' }, ctx.tokenA)).status, 400);
    assert.equal((await api('PUT', '/vendedor/propiedades/99999', { precio: 10 }, ctx.tokenA)).status, 404);
    // en el panel un id mal formado o gigante responde 400
    assert.equal((await api('GET', '/vendedor/propiedades/abc', undefined, ctx.tokenA)).status, 400);
    assert.equal((await api('GET', '/vendedor/propiedades/99999999999999999999', undefined, ctx.tokenA)).status, 400);
    assert.equal((await api('PATCH', '/vendedor/actividad/abc/leer', undefined, ctx.tokenA)).status, 400);
  });
});

// ---------------------------------------------------------------------
describe('propiedades: fotos', () => {
  it('no se puede publicar una propiedad sin fotos (409)', async () => {
    const res = await api('PATCH', `/vendedor/propiedades/${ctx.p1}/estado`, { nuevoEstado: 'PUBLICADA' }, ctx.tokenA);
    assert.equal(res.status, 409);
  });

  it('la primera foto queda como portada y siempre hay una sola portada', async () => {
    const f1 = await api('POST', `/vendedor/propiedades/${ctx.p1}/fotos`, { url: 'https://picsum.photos/seed/a/800/600', orden: 1 }, ctx.tokenA);
    assert.equal(f1.status, 201);
    assert.equal(f1.body.photo.esPortada, true);
    ctx.f1 = f1.body.photo.id;

    const f2 = await api('POST', `/vendedor/propiedades/${ctx.p1}/fotos`, { url: 'https://picsum.photos/seed/b/800/600', orden: 0, esPortada: true }, ctx.tokenA);
    assert.equal(f2.status, 201);
    ctx.f2 = f2.body.photo.id;

    const lista = await api('GET', `/vendedor/propiedades/${ctx.p1}/fotos`, undefined, ctx.tokenA);
    assert.equal(lista.status, 200);
    assert.deepEqual(lista.body.photos.map((f: any) => f.id), [ctx.f2, ctx.f1], 'salen ordenadas por el campo orden');
    assert.equal(lista.body.photos.filter((f: any) => f.esPortada).length, 1);
    assert.equal(lista.body.photos.find((f: any) => f.esPortada).id, ctx.f2);
  });

  it('valida la url y edita orden y portada', async () => {
    assert.equal((await api('POST', `/vendedor/propiedades/${ctx.p1}/fotos`, { url: 'no-es-url' }, ctx.tokenA)).status, 400);

    const portada = await api('PATCH', `/vendedor/propiedades/${ctx.p1}/fotos/${ctx.f1}`, { esPortada: true, orden: 0 }, ctx.tokenA);
    assert.equal(portada.status, 200);

    const lista = await api('GET', `/vendedor/propiedades/${ctx.p1}/fotos`, undefined, ctx.tokenA);
    assert.equal(lista.body.photos.filter((f: any) => f.esPortada).length, 1);
    assert.equal(lista.body.photos.find((f: any) => f.esPortada).id, ctx.f1);

    assert.equal((await api('PATCH', `/vendedor/propiedades/${ctx.p1}/fotos/99999`, { orden: 3 }, ctx.tokenA)).status, 404);
    assert.equal((await api('PATCH', `/vendedor/propiedades/${ctx.p1}/fotos/${ctx.f1}`, { esPortada: false }, ctx.tokenA)).status, 409);
  });

  it('elimina una foto', async () => {
    assert.equal((await api('DELETE', `/vendedor/propiedades/${ctx.p1}/fotos/${ctx.f2}`, undefined, ctx.tokenA)).status, 200);
    assert.equal((await api('DELETE', `/vendedor/propiedades/${ctx.p1}/fotos/${ctx.f2}`, undefined, ctx.tokenA)).status, 404);
  });
});

// ---------------------------------------------------------------------
describe('propiedades: maquina de estados', () => {
  /**
   * pide un cambio de estado de una propiedad.
   *
   * @param id id de la propiedad
   * @param nuevoEstado estado al que se quiere pasar
   * @param token token del vendedor (por defecto el del vendedor a)
   * @returns la respuesta de la api
   */
  const cambiar = (id: number, nuevoEstado: string, token = ctx.tokenA) =>
    api('PATCH', `/vendedor/propiedades/${id}/estado`, { nuevoEstado }, token);

  it('rechaza transiciones invalidas y estados que no existen (400)', async () => {
    assert.equal((await cambiar(ctx.p1, 'VENDIDA')).status, 400);
    assert.equal((await cambiar(ctx.p1, 'RESERVADA')).status, 400);
    assert.equal((await cambiar(ctx.p1, 'PAUSADA')).status, 400);
    assert.equal((await cambiar(ctx.p1, 'INVENTADO')).status, 400);
    assert.equal((await api('PATCH', `/vendedor/propiedades/${ctx.p1}/estado`, {}, ctx.tokenA)).status, 400);
  });

  it('publica, pausa y republica guardando cada cambio en el historial', async () => {
    const publicada = await cambiar(ctx.p1, 'PUBLICADA');
    assert.equal(publicada.status, 200);
    assert.equal(publicada.body.propiedad.estado, 'PUBLICADA');

    assert.equal((await cambiar(ctx.p1, 'PAUSADA')).status, 200);
    assert.equal((await cambiar(ctx.p1, 'publicada')).status, 200);

    const detalle = await api('GET', `/vendedor/propiedades/${ctx.p1}`, undefined, ctx.tokenA);
    assert.equal(detalle.status, 200);
    const historial = detalle.body.historialEstados;
    assert.deepEqual(historial.map((h: any) => `${h.estadoViejo}>${h.estadoNuevo}`), [
      'BORRADOR>PUBLICADA', 'PUBLICADA>PAUSADA', 'PAUSADA>PUBLICADA',
    ]);
    const fechas = historial.map((h: any) => new Date(h.fechaCambio).getTime());
    assert.deepEqual(fechas, [...fechas].sort((a, b) => a - b), 'el historial sale en orden cronologico');
  });

  it('una propiedad publicada no puede quedarse sin fotos (409)', async () => {
    const res = await api('DELETE', `/vendedor/propiedades/${ctx.p1}/fotos/${ctx.f1}`, undefined, ctx.tokenA);
    assert.equal(res.status, 409);
  });

  it('publica el resto de las propiedades de prueba', async () => {
    for (const [id, token] of [[ctx.p2, ctx.tokenA], [ctx.p3, ctx.tokenA], [ctx.pB, ctx.tokenB]]) {
      const foto = await api('POST', `/vendedor/propiedades/${id}/fotos`, { url: `https://picsum.photos/seed/p${id}/800/600` }, token);
      assert.equal(foto.status, 201);
      assert.equal((await cambiar(id, 'PUBLICADA', token)).status, 200);
    }
  });
});

// ---------------------------------------------------------------------
describe('catalogo publico de propiedades', () => {
  /**
   * saca los ids de un listado paginado, para comparar resultados sin importar el orden.
   *
   * @param res respuesta de la api con { data }
   * @returns los ids ordenados de menor a mayor
   */
  const ids = (res: any) => res.body.data.map((p: any) => p.id).sort((a: number, b: number) => a - b);

  it('lista solo las publicadas, con metadata de paginacion', async () => {
    const res = await api('GET', '/properties');
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 4);
    assert.equal(res.body.page, 1);
    assert.equal(res.body.limit, 12);
    assert.equal(res.body.totalPages, 1);
    assert.ok(!ids(res).includes(ctx.p4), 'el borrador no aparece');
    assert.ok(res.body.data.every((p: any) => p.estado === 'PUBLICADA'));
    const p1 = res.body.data.find((p: any) => p.id === ctx.p1);
    assert.ok(p1.fotos.some((f: any) => f.esPortada), 'cada resultado trae su foto de portada');
    assert.equal(p1.tipoPropiedad, 'DEPARTAMENTO');
    assert.ok(!res.text.includes('passwordHash'));
  });

  it('pagina los resultados', async () => {
    const pag1 = await api('GET', '/properties?page=1&limit=3');
    assert.equal(pag1.body.data.length, 3);
    assert.equal(pag1.body.total, 4);
    assert.equal(pag1.body.totalPages, 2);

    const pag2 = await api('GET', '/properties?page=2&limit=3');
    assert.equal(pag2.body.data.length, 1);
    assert.ok(!ids(pag1).includes(pag2.body.data[0].id), 'las paginas no repiten resultados');

    // parametros invalidos no rompen: se usan los valores por defecto
    const raro = await api('GET', '/properties?page=abc&limit=-4&minPrice=xyz');
    assert.equal(raro.status, 200);
    assert.equal(raro.body.total, 4);
  });

  it('filtra por tipo, operacion, precio, zona, ambientes y amenities', async () => {
    assert.deepEqual(ids(await api('GET', '/properties?tipo=CASA')), [ctx.p2, ctx.pB].sort((a, b) => a - b));
    assert.deepEqual(ids(await api('GET', '/properties?tipo=terreno')), [ctx.p3]);
    assert.deepEqual(ids(await api('GET', '/properties?tipo=2')), [ctx.p1]);
    assert.deepEqual(ids(await api('GET', '/properties?tipo=NOEXISTE')), []);
    assert.deepEqual(ids(await api('GET', '/properties?operacion=alquiler')), [ctx.p1]);
    assert.deepEqual(ids(await api('GET', '/properties?minPrice=100000&maxPrice=150000')), [ctx.p2]);
    assert.deepEqual(ids(await api('GET', '/properties?maxPrice=1000')), [ctx.p1]);
    assert.deepEqual(ids(await api('GET', '/properties?barrioZona=ostende')), [ctx.p2]);
    assert.deepEqual(ids(await api('GET', '/properties?ambientes=2')), [ctx.p1]);
    assert.deepEqual(ids(await api('GET', '/properties?tags=Pileta')), [ctx.p1, ctx.p2].sort((a, b) => a - b));
    assert.deepEqual(ids(await api('GET', '/properties?tags=pileta,cochera')), [ctx.p1]);
    assert.deepEqual(ids(await api('GET', `/properties?tags=${ctx.tags.Pileta}`)), [ctx.p1, ctx.p2].sort((a, b) => a - b));
  });

  it('combina filtros y busca texto libre en titulo y descripcion', async () => {
    assert.deepEqual(ids(await api('GET', '/properties?tipo=CASA&operacion=VENTA&maxPrice=150000&tags=Pileta')), [ctx.p2]);
    assert.deepEqual(ids(await api('GET', '/properties?tipo=CASA&operacion=ALQUILER')), []);
    // "quincho" solo esta en la descripcion de la casa con pileta
    assert.deepEqual(ids(await api('GET', '/properties?q=QUINCHO')), [ctx.p2]);
    assert.deepEqual(ids(await api('GET', '/properties?q=vista al mar')), [ctx.p1]);
    assert.deepEqual(ids(await api('GET', '/properties?q=zzzzz')), []);
  });

  it('ordena por precio, fecha y superficie', async () => {
    const asc = await api('GET', '/properties?sortBy=precio&sortOrder=asc');
    assert.deepEqual(asc.body.data.map((p: any) => p.precio), [450, 65000, 120000, 200000]);
    const desc = await api('GET', '/properties?sortBy=precio&sortOrder=DESC');
    assert.deepEqual(desc.body.data.map((p: any) => p.precio), [200000, 120000, 65000, 450]);
    const sup = await api('GET', '/properties?sortBy=superficie&sortOrder=ASC');
    assert.deepEqual(sup.body.data.map((p: any) => p.superficieTotalM2), [50, 600, 800, 1000]);
    assert.equal((await api('GET', '/properties?sortBy=fecha&sortOrder=ASC')).status, 200);
  });

  it('el detalle trae galeria, tags e inmobiliaria, sin datos privados del vendedor', async () => {
    const res = await api('GET', `/properties/${ctx.p1}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, ctx.p1);
    assert.equal(res.body.fotos.length, 1);
    assert.equal(res.body.tags.length, 2);
    assert.equal(res.body.agency.nombreFantasia, 'Inmobiliaria del Sol');
    assert.ok(res.body.agency.telefonos.length >= 1, 'el telefono de la inmobiliaria es publico');
    assert.deepEqual(Object.keys(res.body.agency.seller), ['id'], 'del vendedor solo se expone el id');
    assert.ok(!res.text.includes('passwordHash'));
  });

  it('un borrador, un id inexistente o un id invalido responden 404', async () => {
    assert.equal((await api('GET', `/properties/${ctx.p4}`)).status, 404);
    assert.equal((await api('GET', '/properties/99999')).status, 404);
    assert.equal((await api('GET', '/properties/abc')).status, 404);
    // un id que no entra en un entero de la base tampoco rompe
    assert.equal((await api('GET', '/properties/99999999999999999999')).status, 404);
    assert.equal((await api('GET', '/properties/0')).status, 404);
  });
});

// ---------------------------------------------------------------------
describe('consultas sobre una propiedad', () => {
  it('un interesado deja una consulta con su nombre, sin autenticarse', async () => {
    const res = await api('POST', `/properties/${ctx.p1}/questions`, { nombreSolicitante: 'Ana', pregunta: '¿Admite mascotas?' });
    assert.equal(res.status, 201);
    assert.equal(res.body.respuestaVendedor, null);
    assert.ok(!res.text.includes('passwordHash'));
    ctx.q1 = res.body.id;

    const otra = await api('POST', `/properties/${ctx.p1}/questions`, { nombreSolicitante: 'Luis', pregunta: '¿Tiene cochera?' });
    assert.equal(otra.status, 201);
    ctx.q2 = otra.body.id;
  });

  it('una consulta sin contenido o sin nombre responde 400', async () => {
    assert.equal((await api('POST', `/properties/${ctx.p1}/questions`, { nombreSolicitante: 'Ana', pregunta: '   ' })).status, 400);
    assert.equal((await api('POST', `/properties/${ctx.p1}/questions`, { nombreSolicitante: 'Ana' })).status, 400);
    assert.equal((await api('POST', `/properties/${ctx.p1}/questions`, { pregunta: 'hola' })).status, 400);
  });

  it('no se puede consultar sobre una propiedad inexistente o en borrador (404)', async () => {
    assert.equal((await api('POST', '/properties/99999/questions', { nombreSolicitante: 'Ana', pregunta: 'hola' })).status, 404);
    assert.equal((await api('POST', `/properties/${ctx.p4}/questions`, { nombreSolicitante: 'Ana', pregunta: 'hola' })).status, 404);
    assert.equal((await api('GET', '/properties/99999/questions')).status, 404);
  });

  it('el vendedor ve sus consultas y puede filtrar las pendientes', async () => {
    const todas = await api('GET', '/vendedor/comentarios', undefined, ctx.tokenA);
    assert.equal(todas.status, 200);
    assert.equal(todas.body.total, 2);
    assert.equal(todas.body.data[0].property.id, ctx.p1);

    const porPropiedad = await api('GET', `/vendedor/propiedades/${ctx.p1}/comentarios`, undefined, ctx.tokenA);
    assert.equal(porPropiedad.body.total, 2);

    // el otro vendedor no ve consultas ajenas
    assert.equal((await api('GET', '/vendedor/comentarios', undefined, ctx.tokenB)).body.total, 0);
  });

  it('solo el dueño puede responder; otro vendedor recibe 403', async () => {
    const res = await api('PUT', `/vendedor/comentarios/${ctx.q1}/respuesta`, { respuestaVendedor: 'Me meto' }, ctx.tokenB);
    assert.equal(res.status, 403);
  });

  it('el vendedor responde y la respuesta queda en la misma consulta', async () => {
    assert.equal((await api('PUT', `/vendedor/comentarios/${ctx.q1}/respuesta`, { respuestaVendedor: '  ' }, ctx.tokenA)).status, 400);
    assert.equal((await api('PUT', `/vendedor/comentarios/${ctx.q1}/respuesta`, {}, ctx.tokenA)).status, 400);
    assert.equal((await api('PUT', '/vendedor/comentarios/99999/respuesta', { respuestaVendedor: 'hola' }, ctx.tokenA)).status, 404);

    const res = await api('PUT', `/vendedor/comentarios/${ctx.q1}/respuesta`, { respuestaVendedor: 'No, disculpá.' }, ctx.tokenA);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, ctx.q1);
    assert.equal(res.body.respuestaVendedor, 'No, disculpá.');

    const publicas = await api('GET', `/properties/${ctx.p1}/questions`);
    assert.equal(publicas.body.total, 2, 'la respuesta no genera una consulta nueva');
    assert.equal(publicas.body.data.find((q: any) => q.id === ctx.q1).respuestaVendedor, 'No, disculpá.');
  });

  it('una consulta ya respondida no admite una segunda respuesta (409)', async () => {
    const res = await api('PUT', `/vendedor/comentarios/${ctx.q1}/respuesta`, { respuestaVendedor: 'Cambié de idea' }, ctx.tokenA);
    assert.equal(res.status, 409);

    const pendientes = await api('GET', '/vendedor/comentarios?sinResponder=true', undefined, ctx.tokenA);
    assert.equal(pendientes.body.total, 1);
    assert.equal(pendientes.body.data[0].id, ctx.q2);
  });
});

// ---------------------------------------------------------------------
describe('solicitudes de visita', () => {
  /**
   * arma un body valido para pedir una visita.
   *
   * @param extra campos que el test quiere pisar o agregar (opcional)
   * @returns el body completo, listo para enviar a POST /properties/:id/visits
   */
  const visita = (extra: Record<string, unknown> = {}) => ({
    nombreVisitante: 'María', telefonoVisitante: '011-4444-4444', fechaPropuesta: enDias(3), mensajeAsociado: 'Puedo por la tarde', ...extra,
  });

  /**
   * pide un cambio de estado de una visita.
   *
   * @param id id de la visita
   * @param estado estado al que se quiere pasar
   * @param token token del vendedor (por defecto el del vendedor a)
   * @returns la respuesta de la api
   */
  const cambiar = (id: number, estado: string, token = ctx.tokenA) =>
    api('PUT', `/vendedor/visitas/${id}/estado`, { estado }, token);

  it('un interesado pide una visita con nombre y telefono', async () => {
    const res = await api('POST', `/properties/${ctx.p1}/visits`, visita());
    assert.equal(res.status, 201);
    assert.equal(res.body.estado, 'PENDIENTE');
    assert.equal(res.body.telefonoVisitante, '011-4444-4444');
    assert.ok(!res.text.includes('passwordHash'));
    ctx.v1 = res.body.id;

    const otra = await api('POST', `/properties/${ctx.p1}/visits`, visita({ nombreVisitante: 'Pedro', apellidoVisitante: 'Gomez', mensajeAsociado: undefined }));
    assert.equal(otra.status, 201);
    ctx.v2 = otra.body.id;
  });

  it('una fecha pasada, sin telefono o sin nombre responde 400', async () => {
    const pasada = await api('POST', `/properties/${ctx.p1}/visits`, visita({ fechaPropuesta: enDias(-1) }));
    assert.equal(pasada.status, 400);
    assert.equal(pasada.body.details[0].field, 'fechaPropuesta');

    assert.equal((await api('POST', `/properties/${ctx.p1}/visits`, visita({ fechaPropuesta: 'mañana' }))).status, 400);
    assert.equal((await api('POST', `/properties/${ctx.p1}/visits`, visita({ telefonoVisitante: undefined }))).status, 400);
    assert.equal((await api('POST', `/properties/${ctx.p1}/visits`, visita({ nombreVisitante: '' }))).status, 400);
  });

  it('solo se piden visitas a propiedades publicadas', async () => {
    assert.equal((await api('POST', '/properties/99999/visits', visita())).status, 404);
    assert.equal((await api('POST', `/properties/${ctx.p4}/visits`, visita())).status, 404);

    // una propiedad pausada existe pero no acepta visitas
    assert.equal((await api('PATCH', `/vendedor/propiedades/${ctx.p3}/estado`, { nuevoEstado: 'PAUSADA' }, ctx.tokenA)).status, 200);
    assert.equal((await api('POST', `/properties/${ctx.p3}/visits`, visita())).status, 409);
    assert.equal((await api('PATCH', `/vendedor/propiedades/${ctx.p3}/estado`, { nuevoEstado: 'PUBLICADA' }, ctx.tokenA)).status, 200);
  });

  it('el vendedor ve las visitas con los datos de contacto', async () => {
    const res = await api('GET', '/vendedor/visitas', undefined, ctx.tokenA);
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 2);
    assert.ok(res.body.data.every((v: any) => v.telefonoVisitante && v.nombreVisitante));
    assert.equal(res.body.data[0].property.id, ctx.p1);

    assert.equal((await api('GET', `/vendedor/propiedades/${ctx.p1}/visitas`, undefined, ctx.tokenA)).body.total, 2);
    assert.equal((await api('GET', '/vendedor/visitas', undefined, ctx.tokenB)).body.total, 0);
  });

  it('confirmar o rechazar sin ser el dueño responde 403', async () => {
    assert.equal((await cambiar(ctx.v1, 'CONFIRMADA', ctx.tokenB)).status, 403);
    assert.equal((await cambiar(ctx.v1, 'RECHAZADA', ctx.tokenB)).status, 403);
  });

  it('las transiciones siguen pendiente -> confirmada -> realizada', async () => {
    assert.equal((await cambiar(ctx.v1, 'REALIZADA')).status, 400, 'no se puede saltear la confirmacion');
    assert.equal((await cambiar(ctx.v1, 'INVENTADO')).status, 400);
    assert.equal((await api('PUT', `/vendedor/visitas/${ctx.v1}/estado`, {}, ctx.tokenA)).status, 400);
    assert.equal((await cambiar(99999, 'CONFIRMADA')).status, 404);

    const confirmada = await cambiar(ctx.v1, 'confirmada');
    assert.equal(confirmada.status, 200);
    assert.equal(confirmada.body.estado, 'CONFIRMADA');

    const filtro = await api('GET', '/vendedor/visitas?estado=CONFIRMADA', undefined, ctx.tokenA);
    assert.equal(filtro.body.total, 1);
    assert.equal(filtro.body.data[0].id, ctx.v1);
  });

  it('una propiedad con visitas confirmadas no se edita ni se da de baja (409), pero admite consultas', async () => {
    assert.equal((await api('PUT', `/vendedor/propiedades/${ctx.p1}`, { precio: 500 }, ctx.tokenA)).status, 409);
    assert.equal((await api('DELETE', `/vendedor/propiedades/${ctx.p1}`, undefined, ctx.tokenA)).status, 409);
    assert.equal((await api('PATCH', `/vendedor/propiedades/${ctx.p1}/estado`, { nuevoEstado: 'CANCELADA' }, ctx.tokenA)).status, 409);

    const consulta = await api('POST', `/properties/${ctx.p1}/questions`, { nombreSolicitante: 'Sol', pregunta: '¿Sigue disponible?' });
    assert.equal(consulta.status, 201);
  });

  it('una visita realizada, cancelada o rechazada no admite mas cambios', async () => {
    assert.equal((await cambiar(ctx.v1, 'REALIZADA')).status, 200);
    assert.equal((await cambiar(ctx.v1, 'CANCELADA')).status, 400);
    assert.equal((await cambiar(ctx.v1, 'CONFIRMADA')).status, 400);

    assert.equal((await cambiar(ctx.v2, 'RECHAZADA')).status, 200);
    assert.equal((await cambiar(ctx.v2, 'CONFIRMADA')).status, 400);

    // se puede cancelar una visita ya confirmada
    const v3 = await api('POST', `/properties/${ctx.p1}/visits`, visita({ nombreVisitante: 'Rita' }));
    assert.equal((await cambiar(v3.body.id, 'CONFIRMADA')).status, 200);
    assert.equal((await cambiar(v3.body.id, 'CANCELADA')).status, 200);

    // sin visitas confirmadas la propiedad vuelve a ser editable
    assert.equal((await api('PUT', `/vendedor/propiedades/${ctx.p1}`, { precio: 500 }, ctx.tokenA)).status, 200);
  });
});

// ---------------------------------------------------------------------
describe('cierre de la operacion', () => {
  /**
   * pide un cambio de estado de una propiedad con el token del vendedor a.
   *
   * @param id id de la propiedad
   * @param nuevoEstado estado al que se quiere pasar
   * @returns la respuesta de la api
   */
  const cambiar = (id: number, nuevoEstado: string) =>
    api('PATCH', `/vendedor/propiedades/${id}/estado`, { nuevoEstado }, ctx.tokenA);

  it('reserva y cierra un alquiler; el cierre tiene que coincidir con la operacion', async () => {
    assert.equal((await cambiar(ctx.p1, 'ALQUILADA')).status, 400, 'antes hay que reservar');
    assert.equal((await cambiar(ctx.p1, 'RESERVADA')).status, 200);
    assert.equal((await cambiar(ctx.p1, 'PAUSADA')).status, 400);
    assert.equal((await cambiar(ctx.p1, 'VENDIDA')).status, 400, 'un alquiler no se vende');

    const res = await cambiar(ctx.p1, 'ALQUILADA');
    assert.equal(res.status, 200);
    assert.equal(res.body.propiedad.estado, 'ALQUILADA');
  });

  it('cierra una venta', async () => {
    assert.equal((await cambiar(ctx.p2, 'RESERVADA')).status, 200);
    assert.equal((await cambiar(ctx.p2, 'ALQUILADA')).status, 400, 'una venta no se alquila');
    assert.equal((await cambiar(ctx.p2, 'VENDIDA')).status, 200);
  });

  it('una propiedad vendida o alquilada no se edita, no cambia de estado ni se da de baja', async () => {
    assert.equal((await api('PUT', `/vendedor/propiedades/${ctx.p1}`, { precio: 999 }, ctx.tokenA)).status, 409);
    assert.equal((await cambiar(ctx.p1, 'PUBLICADA')).status, 400);
    assert.equal((await cambiar(ctx.p1, 'CANCELADA')).status, 400);
    assert.equal((await api('DELETE', `/vendedor/propiedades/${ctx.p1}`, undefined, ctx.tokenA)).status, 409);
  });

  it('una propiedad cerrada sigue admitiendo consultas pero no visitas', async () => {
    assert.equal((await api('GET', `/properties/${ctx.p1}`)).status, 200);
    assert.equal((await api('POST', `/properties/${ctx.p1}/questions`, { nombreSolicitante: 'Leo', pregunta: '¿Hay otra parecida?' })).status, 201);
    assert.equal((await api('POST', `/properties/${ctx.p1}/visits`, {
      nombreVisitante: 'Leo', telefonoVisitante: '011-1111-1111', fechaPropuesta: enDias(2),
    })).status, 409);
    assert.ok(!(await api('GET', '/properties')).body.data.some((p: any) => p.id === ctx.p1), 'ya no sale en el listado');
  });

  it('dar de baja un borrador lo deja cancelado y no editable', async () => {
    const res = await api('DELETE', `/vendedor/propiedades/${ctx.p4}`, undefined, ctx.tokenA);
    assert.equal(res.status, 200);

    const detalle = await api('GET', `/vendedor/propiedades/${ctx.p4}`, undefined, ctx.tokenA);
    assert.equal(detalle.body.estado, 'CANCELADA');
    assert.equal(detalle.body.historialEstados.at(-1).estadoNuevo, 'CANCELADA');

    assert.equal((await api('PUT', `/vendedor/propiedades/${ctx.p4}`, { precio: 10 }, ctx.tokenA)).status, 409);
    // repetir la baja no falla
    assert.equal((await api('DELETE', `/vendedor/propiedades/${ctx.p4}`, undefined, ctx.tokenA)).status, 200);
  });
});

// ---------------------------------------------------------------------
describe('reseñas e inmobiliarias (publico)', () => {
  it('un interesado deja una reseña sin autenticarse', async () => {
    const res = await api('POST', `/agencies/${ctx.agencyA}/reviews`, { nombreSolicitante: 'Juan', resenia: 'Muy buena atención', calificacion: 5 });
    assert.equal(res.status, 201);
    assert.equal(res.body.calificacion, 5);
    assert.ok(!res.text.includes('passwordHash'));

    assert.equal((await api('POST', `/agencies/${ctx.agencyA}/reviews`, { nombreSolicitante: 'Carla', resenia: 'Tardaron en responder', calificacion: 2 })).status, 201);
  });

  it('valida calificacion entera de 1 a 5 y contenido obligatorio', async () => {
    const base = { nombreSolicitante: 'Juan', resenia: 'Bien' };
    for (const calificacion of [0, 6, -1, 2.5, '5', null]) {
      const res = await api('POST', `/agencies/${ctx.agencyA}/reviews`, { ...base, calificacion });
      assert.equal(res.status, 400, `calificacion ${calificacion} deberia ser invalida`);
    }
    assert.equal((await api('POST', `/agencies/${ctx.agencyA}/reviews`, { nombreSolicitante: 'Juan', calificacion: 4 })).status, 400);
    assert.equal((await api('POST', `/agencies/${ctx.agencyA}/reviews`, { nombreSolicitante: 'Juan', resenia: '  ', calificacion: 4 })).status, 400);
    assert.equal((await api('POST', `/agencies/${ctx.agencyA}/reviews`, { resenia: 'Bien', calificacion: 4 })).status, 400);
    assert.equal((await api('POST', '/agencies/99999/reviews', { ...base, calificacion: 4 })).status, 404);
  });

  it('las reseñas aparecen en el perfil publico, con promedio y cantidad', async () => {
    const lista = await api('GET', `/agencies/${ctx.agencyA}/reviews`);
    assert.equal(lista.status, 200);
    assert.equal(lista.body.total, 2);

    const perfil = await api('GET', `/agencies/${ctx.agencyA}`);
    assert.equal(perfil.status, 200);
    assert.equal(perfil.body.calificacionPromedio, 3.5);
    assert.equal(perfil.body.cantidadResenias, 2);

    const sinResenias = await api('GET', `/agencies/${ctx.agencyB}`);
    assert.equal(sinResenias.body.calificacionPromedio, null);
    assert.equal(sinResenias.body.cantidadResenias, 0);
  });

  it('el perfil publico no expone datos del vendedor', async () => {
    const perfil = await api('GET', `/agencies/${ctx.agencyB}`);
    assert.equal(perfil.body.seller, undefined);
    assert.ok(!perfil.text.includes('passwordHash'));
    assert.ok(!perfil.text.includes('"apellido"'), 'no incluye los datos personales del vendedor');
    assert.ok(!perfil.text.includes('"rol"'));
  });

  it('lista inmobiliarias, busca por nombre y muestra solo sus propiedades publicadas', async () => {
    const todas = await api('GET', '/agencies');
    assert.equal(todas.status, 200);
    assert.equal(todas.body.total, 2);
    assert.ok(!todas.text.includes('passwordHash'));

    // el listado trae la calificacion de cada inmobiliaria, para el directorio del front
    const conResenias = todas.body.data.find((a: any) => a.id === ctx.agencyA);
    assert.equal(conResenias.calificacionPromedio, 3.5);
    assert.equal(conResenias.cantidadResenias, 2);
    const sinResenias = todas.body.data.find((a: any) => a.id === ctx.agencyB);
    assert.equal(sinResenias.calificacionPromedio, null);
    assert.equal(sinResenias.cantidadResenias, 0);

    const busqueda = await api('GET', '/agencies?nombre=costa');
    assert.equal(busqueda.body.total, 1);
    assert.equal(busqueda.body.data[0].id, ctx.agencyB);

    const props = await api('GET', `/agencies/${ctx.agencyA}/properties`);
    assert.equal(props.status, 200);
    assert.deepEqual(props.body.data.map((p: any) => p.id), [ctx.p3], 'solo queda publicado el terreno');
  });

  it('una inmobiliaria inexistente responde 404', async () => {
    assert.equal((await api('GET', '/agencies/99999')).status, 404);
    assert.equal((await api('GET', '/agencies/99999/properties')).status, 404);
    assert.equal((await api('GET', '/agencies/99999/reviews')).status, 404);
    assert.equal((await api('GET', '/agencies/abc')).status, 404);
  });
});

// ---------------------------------------------------------------------
describe('feed de actividad', () => {
  it('cada consulta, visita, reseña y cambio de estado genero su actividad', async () => {
    const res = await api('GET', '/vendedor/actividad?limit=50', undefined, ctx.tokenA);
    assert.equal(res.status, 200);
    const tipos = new Set(res.body.data.map((a: any) => a.tipo));
    for (const tipo of ['COMENTARIO', 'SOLICITUD_VISITA', 'RESENIA', 'CAMBIO_ESTADO']) {
      assert.ok(tipos.has(tipo), `falta una actividad de tipo ${tipo}`);
    }
    assert.equal(res.body.data.filter((a: any) => a.tipo === 'COMENTARIO').length, 4);
    assert.equal(res.body.data.filter((a: any) => a.tipo === 'SOLICITUD_VISITA').length, 3);
    assert.equal(res.body.data.filter((a: any) => a.tipo === 'RESENIA').length, 2);

    const fechas = res.body.data.map((a: any) => new Date(a.fechaCreacion).getTime());
    assert.deepEqual(fechas, [...fechas].sort((a, b) => b - a), 'las mas recientes primero');
    ctx.actividad = res.body.data[0].id;
    ctx.totalActividad = res.body.total;
  });

  it('filtra por tipo', async () => {
    const res = await api('GET', '/vendedor/actividad?tipo=RESENIA', undefined, ctx.tokenA);
    assert.equal(res.body.total, 2);
  });

  it('el contador de no leidas baja al marcar una como leida', async () => {
    const antes = await api('GET', '/vendedor/actividad/sin-leer', undefined, ctx.tokenA);
    assert.equal(antes.status, 200);
    assert.equal(antes.body.sinLeer, ctx.totalActividad);

    assert.equal((await api('PATCH', `/vendedor/actividad/${ctx.actividad}/leer`, undefined, ctx.tokenA)).status, 200);

    const despues = await api('GET', '/vendedor/actividad/sin-leer', undefined, ctx.tokenA);
    assert.equal(despues.body.sinLeer, antes.body.sinLeer - 1);

    const sinLeer = await api('GET', '/vendedor/actividad?leido=false', undefined, ctx.tokenA);
    assert.equal(sinLeer.body.total, despues.body.sinLeer);
    const leidas = await api('GET', '/vendedor/actividad?leido=true', undefined, ctx.tokenA);
    assert.equal(leidas.body.total, 1);
  });

  it('un vendedor no puede marcar actividad ajena (403) ni inexistente (404)', async () => {
    assert.equal((await api('PATCH', `/vendedor/actividad/${ctx.actividad}/leer`, undefined, ctx.tokenB)).status, 403);
    assert.equal((await api('PATCH', '/vendedor/actividad/99999/leer', undefined, ctx.tokenA)).status, 404);
  });

  it('marcar todas deja el contador en cero', async () => {
    const res = await api('PATCH', '/vendedor/actividad/leer-todas', undefined, ctx.tokenA);
    assert.equal(res.status, 200);
    assert.equal((await api('GET', '/vendedor/actividad/sin-leer', undefined, ctx.tokenA)).body.sinLeer, 0);
  });
});

// ---------------------------------------------------------------------
describe('dashboard de reportes', () => {
  it('cuenta las propiedades por estado actual', async () => {
    const res = await api('GET', '/vendedor/reportes', undefined, ctx.tokenA);
    assert.equal(res.status, 200);
    const porEstado = Object.fromEntries(res.body.propiedadesPorEstado.map((e: any) => [e.estado, e.cantidad]));
    assert.deepEqual(porEstado, {
      BORRADOR: 0, PUBLICADA: 1, PAUSADA: 0, RESERVADA: 0, VENDIDA: 1, ALQUILADA: 1, CANCELADA: 1,
    });
    ctx.reporteA = res.body;
  });

  it('informa publicaciones y cierres por mes a partir del historial', async () => {
    const meses = ctx.reporteA.evolucionMensual;
    assert.equal(meses.length, 1);
    assert.match(meses[0].mes, /^\d{4}-\d{2}$/);
    // p1, p2 y p3 se publicaron. republicar despues de una pausa no cuenta como publicacion nueva
    assert.equal(meses[0].publicaciones, 3);
    assert.equal(meses[0].cierres, 2);
  });

  it('calcula el tiempo promedio en mercado, y es null si no hubo cierres', async () => {
    assert.equal(typeof ctx.reporteA.tiempoPromedioMercadoDias, 'number');
    assert.ok(ctx.reporteA.tiempoPromedioMercadoDias >= 0);

    const reporteB = await api('GET', '/vendedor/reportes', undefined, ctx.tokenB);
    assert.equal(reporteB.body.tiempoPromedioMercadoDias, null);
    const porEstadoB = Object.fromEntries(reporteB.body.propiedadesPorEstado.map((e: any) => [e.estado, e.cantidad]));
    assert.equal(porEstadoB.PUBLICADA, 1, 'cada vendedor solo ve los datos de su inmobiliaria');
    assert.equal(porEstadoB.VENDIDA, 0);
  });

  it('cada indicador tiene su propia ruta y coincide con el reporte completo', async () => {
    const completo = (await api('GET', '/vendedor/reportes', undefined, ctx.tokenA)).body;

    const porEstado = await api('GET', '/vendedor/reportes/por-estado', undefined, ctx.tokenA);
    assert.equal(porEstado.status, 200);
    assert.deepEqual(porEstado.body, { propiedadesPorEstado: completo.propiedadesPorEstado });

    const mensual = await api('GET', '/vendedor/reportes/mensual', undefined, ctx.tokenA);
    assert.equal(mensual.status, 200);
    assert.deepEqual(mensual.body, { evolucionMensual: completo.evolucionMensual });

    const tiempo = await api('GET', '/vendedor/reportes/tiempo-en-mercado', undefined, ctx.tokenA);
    assert.equal(tiempo.status, 200);
    assert.deepEqual(tiempo.body, { tiempoPromedioMercadoDias: completo.tiempoPromedioMercadoDias });

    // un vendedor sin cierres recibe null y sus propios numeros
    const tiempoB = await api('GET', '/vendedor/reportes/tiempo-en-mercado', undefined, ctx.tokenB);
    assert.deepEqual(tiempoB.body, { tiempoPromedioMercadoDias: null });
    const porEstadoB = await api('GET', '/vendedor/reportes/por-estado', undefined, ctx.tokenB);
    assert.equal(porEstadoB.body.propiedadesPorEstado.length, 7);
    assert.equal(porEstadoB.body.propiedadesPorEstado.find((e: any) => e.estado === 'VENDIDA').cantidad, 0);
  });

  it('el tiempo en mercado sale del historial de estados', async () => {
    // se corre 10 dias hacia atras la fecha de publicacion de la casa vendida
    await AppDataSource.query(
      `UPDATE propiedades_cambios_logs SET fecha_cambio = fecha_cambio - INTERVAL '10 days'
       WHERE id_propiedad = $1 AND estado_nuevo = 'PUBLICADA'`, [ctx.p2]);

    const res = await api('GET', '/vendedor/reportes', undefined, ctx.tokenA);
    // p1 se cerro en el momento (0 dias) y p2 a los 10 dias: el promedio es 5.
    // p1 se publico dos veces pero entra una sola vez en el promedio.
    assert.ok(Math.abs(res.body.tiempoPromedioMercadoDias - 5) < 0.1, `promedio ${res.body.tiempoPromedioMercadoDias}`);
  });
});

// ---------------------------------------------------------------------
describe('eliminar la inmobiliaria', () => {
  it('no se puede eliminar con propiedades publicadas o reservadas (409)', async () => {
    const res = await api('DELETE', '/vendedor/inmobiliaria', undefined, ctx.tokenA);
    assert.equal(res.status, 409);
    assert.match(res.body.error, /publicadas o reservadas/);
  });

  it('se elimina cuando ya no tiene propiedades activas', async () => {
    assert.equal((await api('DELETE', `/vendedor/propiedades/${ctx.p3}`, undefined, ctx.tokenA)).status, 200);

    const res = await api('DELETE', '/vendedor/inmobiliaria', undefined, ctx.tokenA);
    assert.equal(res.status, 200);

    assert.equal((await api('GET', '/vendedor/inmobiliaria', undefined, ctx.tokenA)).status, 404);
    assert.equal((await api('GET', `/agencies/${ctx.agencyA}`)).status, 404);
    assert.equal((await api('GET', `/properties/${ctx.p1}`)).status, 404, 'sus propiedades se van con ella');
    assert.equal((await api('GET', '/agencies')).body.total, 1);
  });
});
