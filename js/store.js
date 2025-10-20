
// store.js — capa de datos (mock + localStorage). Reemplazar por fetch('/api/...') cuando tengas backend.
import { nowIso } from './utils.js';

const KEY = 'md_incidentes_v1';

const seed = [
  { id:'a1', tipo:'inundacion', severidad:'alta', descripcion:'Río Laja se desborda en zona baja.', fuente:'Ciudadanía', coords:{lat:20.525,lng:-100.81}, fecha: nowIso() },
  { id:'b2', tipo:'incendio', severidad:'media', descripcion:'Incendio de pastizal controlado.', fuente:'Protección Civil', coords:{lat:20.532,lng:-100.825}, fecha: nowIso() },
  { id:'c3', tipo:'ola_calor', severidad:'baja', descripcion:'Temperaturas >38°C reportadas.', fuente:'Estación Meteo', coords:{lat:20.518,lng:-100.8}, fecha: nowIso() },
];

function readLS(){
  try{ return JSON.parse(localStorage.getItem(KEY)) || seed; }catch(e){ return seed; }
}
function writeLS(list){ localStorage.setItem(KEY, JSON.stringify(list)); }

let data = readLS();

export function all(){ return [...data]; }
export function add(item){
  data = [item, ...data];
  writeLS(data);
  return item;
}
export function clearAll(){
  data = [];
  writeLS(data);
}
export function exportGeoJSON(list){
  return {
    type: "FeatureCollection",
    features: list.map(i => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [i.coords.lng, i.coords.lat] },
      properties: { id: i.id, tipo: i.tipo, severidad: i.severidad, descripcion: i.descripcion, fuente: i.fuente, fecha: i.fecha }
    }))
  };
}

/*
export function update(id, patch){
  data = data.map(i => i.id===id ? { ...i, ...patch } : i);
  localStorage.setItem(KEY, JSON.stringify(data));
  return data.find(i => i.id===id);
}

export function remove(id){
  data = data.filter(i => i.id!==id);
  localStorage.setItem(KEY, JSON.stringify(data));
  return true;
}

// En exportGeoJSON agrega trust en properties:
export function exportGeoJSON(list){
  return {
    type: "FeatureCollection",
    features: list.map(i => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [i.coords.lng, i.coords.lat] },
      properties: {
        id: i.id,
        tipo: i.tipo,
        severidad: i.severidad,
        descripcion: i.descripcion,
        fuente: i.fuente,
        fecha: i.fecha,
        trust: i.trust // 👈 esta línea nueva
      }
    }))
  };
}
*/