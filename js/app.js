import { addRiskLayer } from './risk-layer.js';
const F = (k)=> (window.FEATURES && window.FEATURES[k]) === true;


// app.js — orquesta todo
import { tipoOptions, sevColors, debounce, nowIso } from './utils.js';
import { all, add, exportGeoJSON } from './store.js';
import { DisasterMap, MiniPicker } from './map.js';
import { renderBadgesTipos, renderList, renderKpis } from './components.js';

// Estado
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
    const byTipo = (filtro.tipo==='todos') || (i.tipo===filtro.tipo);
    const bySev  = (filtro.sev==='todas') || (i.severidad===filtro.sev);
    const byFuente = (filtro.fuente==='todas') || (i.fuente===filtro.fuente);
    const byText = (`${i.descripcion} ${i.fuente}`.toLowerCase().includes(filtro.search.toLowerCase()));
    const byFrom = !filtro.from || (new Date(i.fecha) >= new Date(filtro.from));
    const byTo   = !filtro.to   || (new Date(i.fecha) <= new Date(filtro.to));
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
renderAll();

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

// Fuente filtro
$('#fFuente').addEventListener('change', e=>{ filtro.fuente = e.target.value; renderAll(); });

// Inputs filtro
$('#fSearch').addEventListener('input', debounce(e=>{ filtro.search = e.target.value; renderAll(); }, 200));
$('#fTipo').addEventListener('change', e=>{ filtro.tipo = e.target.value; renderAll(); });
$('#fSev').addEventListener('change', e=>{ filtro.sev = e.target.value; renderAll(); });
$('#fFrom').addEventListener('change', e=>{ filtro.from = e.target.value; renderAll(); });
$('#fTo').addEventListener('change', e=>{ filtro.to = e.target.value; renderAll(); });

// Panel de filtros
$('#btnFilters').addEventListener('click', ()=>{
  filtersPanel.classList.toggle('open');
  const open = filtersPanel.classList.contains('open');
  $('#btnFilters').setAttribute('aria-expanded', String(open));
  filtersPanel.setAttribute('aria-hidden', String(!open));
});
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') { filtersPanel.classList.remove('open'); filtersPanel.setAttribute('aria-hidden', 'true'); } });

// Export GeoJSON
$('#btnExport').addEventListener('click', ()=>{
  const list = applyFilter(all());
  const geo = exportGeoJSON(list);
  const blob = new Blob([JSON.stringify(geo, null, 2)], { type:'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'incidentes.geojson';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// Limpiar filtros
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

formNuevo.addEventListener('submit', (e)=>{
  e.preventDefault();
  const coords = mini?.getCoords();
  const desc = nDesc.value.trim();
  if(!coords || desc.length < 10){ return; }
  const item = {
    id: Math.random().toString(36).slice(2),
    tipo: nTipo.value,
    severidad: nSev.value,
    descripcion: desc,
    fuente: (nFuente.value.trim() || 'Ciudadanía'),
    coords, fecha: nowIso()
  };
  add(item);
  renderAll();
  map.setView(coords.lat, coords.lng, 13);
  closeDialog();
});

