
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

export const fuenteOptions = [
  { id: 'ciudadano',        label: 'Ciudadano' },
  { id: 'proteccion_civil', label: 'Protección civil' },
  { id: 'medio',            label: 'Medio' },
  { id: 'red_social',       label: 'Red social' },
];

export const labelFuente = (id) =>
  (fuenteOptions.find(f => f.id === id)?.label || id);

/*
export function trustScore(item){
  // Base por fuente
  const bySource = (src)=>{
    if(!src) return 0.5;
    const s = src.toLowerCase();
    if (s.includes('protección civil')) return 0.9;
    if (s.includes('pc')) return 0.85;
    if (s.includes('estación meteo') || s.includes('meteor')) return 0.8;
    if (s.includes('ciudadanía') || s.includes('ciudadano') || s.includes('ciudadana')) return 0.55;
    return 0.6;
  };
  let score = bySource(item.fuente);

  // + contexto en descripción
  const len = (item.descripcion||'').length;
  if (len >= 140) score += 0.10;
  else if (len >= 40) score += 0.05;
  else if (len < 15) score -= 0.05;

  // Recencia
  const ageMin = (Date.now() - new Date(item.fecha).getTime())/60000;
  if (ageMin <= 60) score += 0.05;
  else if (ageMin > 24*60) score -= 0.05;

  // Penaliza “alta” si la fuente no es sólida
  if (item.severidad === 'alta' && score < 0.7) score -= 0.05;

  return Math.max(0, Math.min(1, score));
}
*/