// js/scraper.js
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Devuelve una lista de "alertas externas" normalizadas
 * para que se puedan guardar como Reporte en Mongo.
 */
export async function scrapeAlertasExternas() {
  const url = 'https://ejemplo.gob.mx/alertas'; // TODO: cambia a tu fuente real

  const { data: html } = await axios.get(url, {
    // Opcional: headers para parecer navegador normal
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MapaDesastresBot/1.0)'
    },
    timeout: 15000
  });

  const $ = cheerio.load(html);
  const resultados = [];

  // Ejemplo de estructura de la página:
  // <div class="alerta-item">
  //   <h3 class="titulo">Inundación en Celaya</h3>
  //   <span class="nivel">Alta</span>
  //   <span class="fecha">2025-12-02</span>
  //   <span class="municipio">Celaya</span>
  //   <span class="lat">20.52</span>
  //   <span class="lng">-100.81</span>
  //   <p class="detalle">Descripción...</p>
  // </div>

  $('.alerta-item').each((i, el) => {
    const $el = $(el);

    const titulo = $el.find('.titulo').text().trim();
    const severidad = $el.find('.nivel').text().trim().toLowerCase(); // baja | media | alta
    const fechaTxt = $el.find('.fecha').text().trim();
    const municipio = $el.find('.municipio').text().trim();
    const latTxt = $el.find('.lat').text().trim();
    const lngTxt = $el.find('.lng').text().trim();
    const detalle = $el.find('.detalle').text().trim();

    // Normalización a tu esquema
    const item = {
      descripcion: detalle || titulo,
      tipo: detectarTipoDesdeTexto(titulo + ' ' + detalle), // función auxiliar
      severidad: normalizarSeveridad(severidad),
      fuente: 'web_scraping',          // distinguirla de "ciudadano", "PC", etc.
      fecha: fechaTxt || new Date().toISOString(),
      municipio,
      coordenadas: {
        lat: latTxt ? parseFloat(latTxt) : null,
        lng: lngTxt ? parseFloat(lngTxt) : null
      },
      // campos extra que podrías agregar en tu esquema:
      // origenUrl: url,
      // externoId: generar un id único si la página lo tiene
    };

    // Solo agregamos si al menos tenemos descripción y algo de ubicación
    if (item.descripcion && item.coordenadas.lat && item.coordenadas.lng) {
      resultados.push(item);
    }
  });

  return resultados;
}

function detectarTipoDesdeTexto(texto) {
  const t = texto.toLowerCase();
  if (t.includes('inund') || t.includes('lluvia')) return 'inundacion';
  if (t.includes('incend') || t.includes('fuego')) return 'incendio';
  if (t.includes('ola de calor') || t.includes('calor')) return 'ola_calor';
  if (t.includes('contaminación') || t.includes('derrames')) return 'contaminacion';
  return 'otro';
}

function normalizarSeveridad(sev) {
  if (sev.includes('alta') || sev.includes('roja')) return 'alta';
  if (sev.includes('media') || sev.includes('naranja')) return 'media';
  if (sev.includes('baja') || sev.includes('amarilla')) return 'baja';
  return 'baja';
}
