// app.js

import { addRiskLayer } from './risk-layer.js';
const F = (k)=> (window.FEATURES && window.FEATURES[k]) === true;


import { tipoOptions, sevColors, debounce, nowIso } from './utils.js';
// ----- 1. IMPORTAMOS clearAll JUNTO CON EL RESTO -----
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
    // --- (Protección contra datos malos) ---
    if (!i.coords) {
      console.warn("Item sin coords:", i);
      return false;
    }
    // ------------------------------------
    const byTipo = (filtro.tipo==='todos') || (i.tipo===filtro.tipo);
    const bySev  = (filtro.sev==='todas') || (i.severidad===filtro.sev);
    const byFuente = (filtro.fuente==='todas') || (i.fuente===filtro.fuente);
    const byText = (`${i.descripcion} ${i.fuente}`.toLowerCase().includes(filtro.search.toLowerCase()));
    const byFrom = !filtro.from || (new Date(i.fecha) >= new Date(i.fecha));
    const byTo   = !filtro.to   || (new Date(i.fecha) <= new Date(i.fecha));
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
  // Tipos
  tipoOptions.forEach(t => {
    const opt1 = document.createElement('option'); opt1.value = t.id; opt1.textContent = t.label; fTipo.appendChild(opt1);
    const opt2 = document.createElement('option'); opt2.value = t.id; opt2.textContent = t.label; nTipo.appendChild(opt2);
  });
}
initSelects();

// (Aquí no hay cambios... Fuente, Search, Tipo, Sev, From, To, Panel de filtros...)
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
// (Aquí no hay cambios: dlg, formNuevo, btnNuevo, openDialog, closeDialog, etc...)
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

// ----- Lógica de guardado (Esta ya estaba bien) -----
formNuevo.addEventListener('submit', async (e) => {
  e.preventDefault();
  const coords = mini?.getCoords();
  const desc = nDesc.value.trim();
  
  if (!coords || !coords.lat || desc.length < 10) { 
    alert("Por favor, añade una descripción (mín. 10 caracteres) y selecciona un punto en el mapa.");
    return;
  }

  const itemParaBackend = {
    tipo: nTipo.value,
    severidad: nSev.value,
    descripcion: desc,
    fuente: (nFuente.value.trim() || 'Ciudadanía'),
    coordenadas: coords 
  };

  let dataGuardada;
  try {
    btnSave.disabled = true; 
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

  try {
    const itemParaLocal = {
      ...dataGuardada.data,
      id: dataGuardada.data._id,
      coords: dataGuardada.data.coordenadas
    };
    add(itemParaLocal); // Añadimos el item a tu store.js local
    renderAll();      // Refrescamos la UI
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

// ----- Lógica de Recomendaciones (sin cambios) -----
const fTipo = document.getElementById("fTipo");
const recomMount = document.getElementById("recomContent");
ensureTipoOptions(fTipo);
renderRecommendations(fTipo.value, recomMount);
fTipo.addEventListener("change", () => {
  renderRecommendations(fTipo.value, recomMount);
});

// ----- 2. ¡BLOQUE DE CARGA INICIAL CORREGIDO! -----
async function cargarDatosIniciales() {
  try {
    const response = await fetch('http://localhost:3000/api/reportes');
    if (!response.ok) {
      throw new Error('No se pudieron cargar los reportes iniciales');
    }
    const reportesDeDB = await response.json();

    // Filtramos los reportes que NO tengan coordenadas
    const reportesValidos = reportesDeDB.filter(r => r.coordenadas && r.coordenadas.lat);

    // "Traducimos" los datos de la DB al formato que tu app local espera
    const reportesLocales = reportesValidos.map(r => ({
      ...r,
      id: r._id,                 // Tu app usa 'id'
      coords: r.coordenadas,     // Tu app usa 'coords'
      fecha: r.fecha || new Date().toISOString()
    }));

    // ----- ¡AQUÍ ESTÁ EL CAMBIO! -----
    clearAll(); // Limpiamos los datos 'seed' o 'localStorage'
    
    // Ahora 'add' solo añade los reportes limpios de la DB
    reportesLocales.forEach(reporte => add(reporte));
    // --------------------------------

    // ¡Ahora sí, renderizamos todo!
    renderAll();

  } catch (error) {
    console.error("Error al cargar datos:", error);
    alert("No se pudo conectar al servidor para cargar los reportes.");
  }
}
// ----- FIN DEL BLOQUE CORREGIDO -----


// ----- Llamar a la función de inicio! -----
cargarDatosIniciales();