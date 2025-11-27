// app.js
import { renderCharts } from "./charts.js";
import { addRiskLayer } from './risk-layer.js';
const F = (k)=> (window.FEATURES && window.FEATURES[k]) === true;

import { tipoOptions, sevColors, debounce, nowIso } from './utils.js';
import { all, add, clearAll, exportGeoJSON } from './store.js'; 
import { DisasterMap, MiniPicker } from './map.js';
import { renderBadgesTipos, renderList, renderKpis } from './components.js';
import { renderRecommendations, ensureTipoOptions } from "./recommendations.js";

let filtro = { search:'', tipo:'todos', sev:'todas', from:'', to:'', fuente:'todas' };

// DOM refs
const $ = (s)=>document.querySelector(s);
const map = new DisasterMap('map');
const badgesTipos = $('#badgesTipos');
const listEl = $('#list');
const kTotal = $('#kTotal'), k24 = $('#k24'), kTipos = $('#kTipos');
const filtersPanel = $('#filtersPanel');

function applyFilter(list){
  return list.filter(i=>{
    if (!i.coords) {
      console.warn("Item sin coords:", i);
      return false;
    }
    const byTipo = (filtro.tipo==='todos') || (i.tipo===filtro.tipo);
    const bySev  = (filtro.sev==='todas') || (i.severidad===filtro.sev);
    const byFuente = (filtro.fuente==='todas') || (i.fuente===filtro.fuente);
    const byText = (`${i.descripcion} ${i.fuente}`.toLowerCase().includes(filtro.search.toLowerCase()));
    const byFrom = !filtro.from || (new Date(i.fecha) >= new Date(i.fecha));
    const byTo   = !filtro.to   || (new Date(i.fecha) <= new Date(i.fecha));
    return byTipo && bySev && byFuente && byText && byFrom && byTo;
  });
}

function renderAll(){
  const list = applyFilter(all());
  map.render(list);
  renderList(listEl, list);
  renderBadgesTipos(badgesTipos, list);
  renderKpis(kTotal, k24, kTipos, list);
}

// ======= Filtros =======
function initSelects(){
  const fTipo = $('#fTipo');
  const nTipo = $('#nTipo');
  tipoOptions.forEach(t => {
    const opt1 = document.createElement('option'); opt1.value = t.id; opt1.textContent = t.label; fTipo.appendChild(opt1);
    const opt2 = document.createElement('option'); opt2.value = t.id; opt2.textContent = t.label; nTipo.appendChild(opt2);
  });
}
initSelects();

$('#fFuente').addEventListener('change', e=>{ filtro.fuente = e.target.value; renderAll(); });
$('#fSearch').addEventListener('input', debounce(e=>{ filtro.search = e.target.value; renderAll(); }, 200));
$('#fTipo').addEventListener('change', e=>{ filtro.tipo = e.target.value; renderAll(); });
$('#fSev').addEventListener('change', e=>{ filtro.sev = e.target.value; renderAll(); });
$('#fFrom').addEventListener('change', e=>{ filtro.from = e.target.value; renderAll(); });
$('#fTo').addEventListener('change', e=>{ filtro.to = e.target.value; renderAll(); });

$('#btnFilters').addEventListener('click', ()=>{
  filtersPanel.classList.toggle('open');
  const open = filtersPanel.classList.contains('open');
  $('#btnFilters').setAttribute('aria-expanded', String(open));
  filtersPanel.setAttribute('aria-hidden', String(!open));
});
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') { filtersPanel.classList.remove('open'); filtersPanel.setAttribute('aria-hidden', 'true'); } });

const btnCloseFilters = $('#btnCloseFilters');
if (btnCloseFilters) {
  btnCloseFilters.addEventListener('click', () => {
    filtersPanel.classList.remove('open');
    filtersPanel.setAttribute('aria-hidden', 'true');
    $('#btnFilters').setAttribute('aria-expanded', 'false');
  });
}

$('#btnClear').addEventListener('click', ()=>{
  filtro = { search:'', tipo:'todos', sev:'todas', from:'', to:'', fuente:'todas' };
  $('#fSearch').value = ''; $('#fTipo').value = 'todos'; $('#fSev').value = 'todas';
  $('#fFrom').value=''; $('#fTo').value=''; $('#fFuente').value='todas';
  renderAll();
});


// ======= Nuevo reporte (diálogo) =======
const dlg = $('#dlgNuevo');
const formNuevo = $('#formNuevo');
const btnNuevo = $('#btnNuevo');
const btnCloseDlg = $('#btnCloseDlg');
const btnCancel = $('#btnCancel');
const btnSave = $('#btnSave');
const nDesc = $('#nDesc'); const nTipo = $('#nTipo'); const nSev = $('#nSev'); const nFuente = $('#nFuente'); const nCoord = $('#nCoord');

let mini = null;
function openDialog(){
  dlg.showModal();
  if(!mini){
    mini = new MiniPicker('mapMini', (coords)=>{
      nCoord.textContent = `📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
      btnSave.disabled = false;
    });
  }
}
function closeDialog(){
  dlg.close();
  if(mini){ mini.clear(); }
  nCoord.textContent = 'Sin coordenadas';
  nDesc.value=''; nFuente.value=''; nSev.value='media';
  btnSave.disabled = true;
}

btnNuevo.addEventListener('click', openDialog);
btnCloseDlg.addEventListener('click', closeDialog);
btnCancel.addEventListener('click', closeDialog);
nSev.addEventListener('change', ()=>{ if(mini){ mini.setColor(sevColors[nSev.value]); } });


// ----- Lógica de guardado (Con Geocodificación para R) -----
formNuevo.addEventListener('submit', async (e) => {
  e.preventDefault();
  const coords = mini?.getCoords();
  const desc = nDesc.value.trim();
  
  if (!coords || !coords.lat || desc.length < 10) { 
    alert("Por favor, añade una descripción (mín. 10 caracteres) y selecciona un punto en el mapa.");
    return;
  }

  // 1. Obtener dirección automática (Estado, Municipio)
  let datosDireccion = { estado: '', municipio: '', colonia: '', texto: '' };
  
  btnSave.disabled = true; 
  btnSave.textContent = "Obteniendo ubicación...";

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`;
    const resGeo = await fetch(url, { headers: { 'User-Agent': 'MapaDesastresApp/1.0' } });
    const dataGeo = await resGeo.json();
    
    if(dataGeo && dataGeo.address) {
        datosDireccion.estado = dataGeo.address.state || 'Desconocido';
        datosDireccion.municipio = dataGeo.address.city || dataGeo.address.town || dataGeo.address.village || dataGeo.address.county || 'Desconocido';
        datosDireccion.colonia = dataGeo.address.neighbourhood || dataGeo.address.suburb || '';
        datosDireccion.texto = dataGeo.display_name;
    }
  } catch (errGeo) {
    console.warn("No se pudo obtener la dirección", errGeo);
  }

  // 2. Preparar objeto para el Backend
  const itemParaBackend = {
    tipo: nTipo.value,
    severidad: nSev.value,
    descripcion: desc,
    fuente: (nFuente.value.trim() || 'Ciudadanía'),
    coordenadas: coords,
    // Campos extra para análisis en R
    estado: datosDireccion.estado,
    municipio: datosDireccion.municipio,
    colonia: datosDireccion.colonia,
    direccion_completa: datosDireccion.texto
  };

  let dataGuardada;
  try {
    btnSave.textContent = "Guardando...";
    const response = await fetch('http://localhost:3000/api/reportes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemParaBackend)
    });
    dataGuardada = await response.json();
    if (!response.ok) {
      throw new Error(dataGuardada.error || dataGuardada.details || 'Falló el guardado en la API');
    }
  } catch (error) {
    console.error("Error al guardar:", error);
    alert("No se pudo guardar el reporte en el servidor: " + error.message);
    btnSave.disabled = false;
    btnSave.textContent = "Guardar Reporte";
    return; 
  }

  // 3. Actualizar UI
  try {
    const itemParaLocal = {
      ...dataGuardada.data,
      id: dataGuardada.data._id,
      coords: dataGuardada.data.coordenadas
    };
    add(itemParaLocal);
    renderAll();
    map.setView(coords.lat, coords.lng, 13); 
    closeDialog();
  } catch (renderError) {
    console.error("Error al refrescar la UI:", renderError);
    alert("¡Reporte guardado con éxito! Pero ocurrió un error al refrescar la lista.");
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = "Guardar Reporte";
  }
});

// ----- Recomendaciones -----
const fTipo = document.getElementById("fTipo");
const recomMount = document.getElementById("recomContent");
ensureTipoOptions(fTipo);
renderRecommendations(fTipo.value, recomMount);
fTipo.addEventListener("change", () => {
  renderRecommendations(fTipo.value, recomMount);
});

// ----- Carga Inicial -----
async function cargarDatosIniciales() {
  try {
    const response = await fetch('http://localhost:3000/api/reportes');
    if (!response.ok) {
      throw new Error('No se pudieron cargar los reportes iniciales');
    }
    const reportesDeDB = await response.json();

    const reportesValidos = reportesDeDB.filter(r => r.coordenadas && r.coordenadas.lat);

    const reportesLocales = reportesValidos.map(r => ({
      ...r,
      id: r._id,
      coords: r.coordenadas,
      fecha: r.fecha || new Date().toISOString()
    }));

    clearAll(); 
    reportesLocales.forEach(reporte => add(reporte));
    renderAll();

  } catch (error) {
    console.error("Error al cargar datos:", error);
    alert("No se pudo conectar al servidor para cargar los reportes.");
  }
}
async function cargarVideosSlider() {
    const sliderContainer = document.getElementById('videoSlider');
    if (!sliderContainer) return;

    try {
        // 1. Pedimos los videos (con truco anti-caché ?t=)
        const res = await fetch('http://localhost:3000/api/videos?t=' + Date.now());
        const videos = await res.json();

        // 2. Si no hay videos, mostramos mensaje
        if (videos.length === 0) {
            sliderContainer.innerHTML = '<p style="padding:1rem; color:#666;">No hay evidencias multimedia disponibles.</p>';
            return;
        }

        // 3. Creamos el HTML con la estructura para el CSS de tarjetas
        const cardsHTML = videos.map(vid => {
            // Validamos que tenga URL
            if(!vid.url) return '';
            
            // Corregimos la ruta para web
            const rutaWeb = '/' + vid.url.replace(/\\/g, '/');

            return `
                <div class="video-card">
                    <div class="video-wrapper">
                        <video controls preload="metadata">
                            <source src="http://localhost:3000${rutaWeb}#t=1.0" type="video/mp4">
                            Tu navegador no soporta videos.
                        </video>
                    </div>
                    
                    <div class="video-info">
                        <div class="video-title" title="${vid.titulo}">${vid.titulo}</div>
                        <div class="video-desc">${vid.descripcion || 'Sin descripción disponible'}</div>
                    </div>
                </div>
            `;
        }).join('');

        // 4. Insertamos las tarjetas en el slider
        sliderContainer.innerHTML = cardsHTML;

    } catch (error) {
        console.error("Error cargando videos slider:", error);
        sliderContainer.innerHTML = '<p style="color:red; padding:1rem;">Error de conexión con videos.</p>';
    }
}
// Controles de Flechas (Scroll Horizontal)
document.getElementById('prevVideo')?.addEventListener('click', () => {
    document.getElementById('videoSlider').scrollBy({ left: -300, behavior: 'smooth' });
});

document.getElementById('nextVideo')?.addEventListener('click', () => {
    document.getElementById('videoSlider').scrollBy({ left: 300, behavior: 'smooth' });
});

// Llamar a la función al iniciar
cargarVideosSlider();
cargarDatosIniciales();