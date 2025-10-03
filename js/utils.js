
// utils.js
export const nowIso = () => new Date().toISOString();
export const debounce = (fn, ms=200) => {
  let t; 
  return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
};
export const fmtDateTime = (iso) => new Date(iso).toLocaleString();
export const sevColors = { baja: '#22c55e', media: '#eab308', alta: '#ef4444' };
export const tipoOptions = [
  { id: 'inundacion', label: 'Inundación' },
  { id: 'incendio', label: 'Incendio' },
  { id: 'ola_calor', label: 'Ola de calor' },
  { id: 'deslave', label: 'Deslave' },
  { id: 'tormenta', label: 'Tormenta' },
];
export const labelTipo = (id) => (tipoOptions.find(t=>t.id===id)?.label || id);
