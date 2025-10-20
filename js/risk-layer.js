// js/risk-layer.js
export async function addRiskLayer(map){
  try {
    const res = await fetch('/data/zonas_riesgo.geojson', { mode:'cors' });
    if (!res.ok) throw new Error('No pude descargar GeoJSON');
    const data = await res.json();
    const style = f => {
      const tipo = f.properties?.tipo || 'general';
      const color = tipo === 'inundacion' ? '#3b82f6' :
                    tipo === 'incendio'   ? '#ef4444' : '#10b981';
      return { color, weight: 1.5, fillOpacity: 0.15 };
    };
    const layer = L.geoJSON(data, { style });
    layer.addTo(map);
    return layer;
  } catch (err) {
    console.warn('RiskLayer desactivada:', err.message);
    return null;
  }
}
