
// components.js — render de KPIs, lista y badges
import { tipoOptions, fmtDateTime, sevColors, labelTipo } from './utils.js';

export function renderBadgesTipos(container, list){
  const tally = {};
  list.forEach(i => tally[i.tipo] = (tally[i.tipo]||0)+1);
  container.innerHTML = '';
  tipoOptions.forEach(t => {
    const span = document.createElement('span');
    span.className = 'badge';
    span.textContent = `${t.label} ${tally[t.id] ? `(${tally[t.id]})` : '(0)'}`;
    container.appendChild(span);
  });
}

export function renderList(container, list){
  container.innerHTML = '';
  if(list.length===0){
    container.innerHTML = `<div class="content small">No hay reportes con los filtros actuales.</div>`;
    return;
  }
  list.forEach(i=>{
    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML = `
      <span class='dot' style='background:${sevColors[i.severidad]}'></span>
      <div class='flex-1'>
        <div style='font-weight:600;text-transform:capitalize'>${labelTipo(i.tipo)} · <span style='font-weight:400'>${i.severidad}</span></div>
        <div class='small' style='color:#111827'>${i.descripcion}</div>
        <div class='small'>${fmtDateTime(i.fecha)} · Fuente: ${i.fuente}</div>
      </div>`;
    container.appendChild(row);
  });
}

export function renderKpis(kTotal, k24, kTipos, list){
  kTotal.textContent = list.length;
  const now = Date.now();
  const last24 = list.filter(i => now - (new Date(i.fecha)).getTime() <= 24*3600*1000).length;
  k24.textContent = last24;
  const tally = {};
  list.forEach(i => tally[i.tipo] = (tally[i.tipo]||0)+1);
  kTipos.textContent = Object.keys(tally).length;
}
