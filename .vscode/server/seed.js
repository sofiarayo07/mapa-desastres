import 'dotenv/config';
import mongoose from 'mongoose';
import Reporte from './models/Reporte.js';  // Ajusta la ruta si tu modelo está en otra carpeta

const TIPOS = ['inundacion', 'incendio', 'ola_calor', 'deslave', 'tormenta'];
const SEVERIDADES = ['baja', 'media', 'alta'];
const FUENTES = ['ciudadano', 'proteccion_civil', 'medio', 'red_social'];
const MUNICIPIOS = ['Celaya', 'Salamanca', 'Irapuato', 'Cortazar', 'Villagrán'];
const COLONIAS = ['Centro', 'Girasoles', 'La Misión', 'Los Olivos', 'San Juanico'];

function random(min, max) {
  return Math.random() * (max - min) + min;
}

async function runSeed() {
  console.log("Conectando a Mongo...");
  await mongoose.connect(process.env.MONGO_URI);

  const docs = [];

  for (let i = 0; i < 250; i++) {
    const tipo = TIPOS[Math.floor(Math.random() * TIPOS.length)];
    const severidad = SEVERIDADES[Math.floor(Math.random() * SEVERIDADES.length)];
    const fuente = FUENTES[Math.floor(Math.random() * FUENTES.length)];

    const municipio = MUNICIPIOS[Math.floor(Math.random() * MUNICIPIOS.length)];
    const colonia = COLONIAS[Math.floor(Math.random() * COLONIAS.length)];

    const personasAfectadas = Math.floor(random(0, 300));
    const danosEstimados = Math.floor(random(1000, 200000));
    const tiempoRespuestaMin = Math.floor(random(5, 120));

    // Fecha aleatoria (últimos 8 meses)
    const fecha = new Date(Date.now() - Math.floor(random(0, 240)) * 24 * 60 * 60 * 1000);

    docs.push({
      tipo,
      severidad,
      descripcion: `Simulación de ${tipo}`,
      fuente,
      fecha,
      coordenadas: {
        lat: 20.52 + random(-0.12, 0.12),
        lng: -100.82 + random(-0.12, 0.12),
      },
      municipio,
      colonia,
      personasAfectadas,
      danosEstimados,
      tiempoRespuestaMin,
    });
  }

  await Reporte.insertMany(docs);
  console.log("Seed completado con 250 reportes");
  await mongoose.disconnect();
  process.exit();
}

runSeed().catch(e => console.error(e));
