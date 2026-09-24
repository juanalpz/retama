const http = require('http');

async function fetchAPI(path, options = {}) {
  const url = `http://localhost:3000${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    
    return { status: res.status, data };
  } catch (err) {
    return { status: 500, error: err.message };
  }
}

async function runTests() {
  console.log('🚀 Iniciando Pruebas Integrales...\n');

  // 1. Health check
  console.log('1. Probando Health Check...');
  let res = await fetchAPI('/api/health');
  console.log(`[${res.status}] ${JSON.stringify(res.data).substring(0, 50)}...\n`);

  // 2. Login
  console.log('2. Probando Login (Vendedor)...');
  res = await fetchAPI('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'juan@inmobiliaria.com', password: '123456' })
  });
  console.log(`[${res.status}] Login ${res.status === 200 ? 'Exitoso' : 'Fallido'}`);
  const token = res.data.token;
  if (!token) {
    console.error('No se pudo obtener el token. Abortando pruebas privadas.');
    return;
  }
  console.log('');

  const authHeaders = { 'Authorization': `Bearer ${token}` };

  // 3. Catálogo Público (Filtros)
  console.log('3. Probando Catálogo Público (con filtro de ambientes)...');
  res = await fetchAPI('/properties?ambientes=3');
  console.log(`[${res.status}] Propiedades encontradas: ${res.data?.data?.length || 0}\n`);

  const propertyId = res.data?.data?.[0]?.id || 1;

  // 4. Dejar una pregunta
  console.log(`4. Dejando una pregunta en la propiedad ${propertyId}...`);
  res = await fetchAPI(`/properties/${propertyId}/questions`, {
    method: 'POST',
    body: JSON.stringify({
      nombreSolicitante: 'Aron Test',
      pregunta: 'Hola, ¿sigue disponible?'
    })
  });
  console.log(`[${res.status}] Pregunta creada: ${res.data?.id}\n`);

  // 5. Agendar una visita
  console.log(`5. Agendando una visita en la propiedad ${propertyId}...`);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  res = await fetchAPI(`/properties/${propertyId}/visits`, {
    method: 'POST',
    body: JSON.stringify({
      nombreVisitante: 'Aron',
      apellidoVisitante: 'Tester',
      telefonoVisitante: '1122334455',
      fechaPropuesta: tomorrow.toISOString()
    })
  });
  console.log(`[${res.status}] Visita agendada: ${res.data?.id}\n`);

  // 6. Dashboard: Preguntas del Vendedor
  console.log('6. Obteniendo Preguntas del Vendedor...');
  res = await fetchAPI('/api/vendedor/comentarios', { headers: authHeaders });
  console.log(`[${res.status}] Preguntas pendientes: ${res.data?.total || 0}\n`);

  // 7. Dashboard: Visitas del Vendedor
  console.log('7. Obteniendo Visitas del Vendedor...');
  res = await fetchAPI('/api/vendedor/visitas', { headers: authHeaders });
  console.log(`[${res.status}] Visitas totales: ${res.data?.total || 0}\n`);

  // 8. Dashboard: Reportes Analíticos
  console.log('8. Obteniendo Reportes Analíticos...');
  res = await fetchAPI('/api/vendedor/reportes', { headers: authHeaders });
  console.log(`[${res.status}] Datos del reporte:`);
  console.log(` - Estados: ${res.data?.propiedadesPorEstado?.length || 0}`);
  console.log(` - Evolución (meses): ${res.data?.evolucionMensual?.length || 0}`);
  console.log(` - Tiempo Promedio (días): ${res.data?.tiempoPromedioMercadoDias || 'N/A'}\n`);

  console.log('✅ Pruebas Integrales Finalizadas.');
}

runTests();
