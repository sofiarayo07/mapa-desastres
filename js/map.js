
// map.js — inicializa Leaflet y maneja marcadores
import { labelTipo, sevColors, fmtDateTime } from './utils.js';

export class DisasterMap {
  constructor(containerId, center={lat:20.523,lng:-100.815}, zoom=12){
    this.map = L.map(containerId).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'&copy; OpenStreetMap' }).addTo(this.map);
    // Usar cluster si está disponible
    this.group = (L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup());
    this.group.addTo(this.map);
  }
  pinColor(severidad){
    const color = sevColors[severidad] || '#0ea5e9';
    return L.divIcon({ className:'', html:`<div style="background:${color};width:14px;height:14px;border-radius:9999px;border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,.2)"></div>`, iconSize:[16,16], iconAnchor:[8,8] });
  }
  render(list){
    this.group.clearLayers();
    list.forEach(i=>{
      const m = L.marker([i.coords.lat, i.coords.lng], { icon: this.pinColor(i.severidad) });
      m.bindPopup(`<div style='font-weight:600;text-transform:capitalize'>${labelTipo(i.tipo)} · ${i.severidad}</div>
                   <div style='font-size:14px'>${i.descripcion}</div>
                   <div style='font-size:12px;color:#6b7280'>${fmtDateTime(i.fecha)} · ${i.fuente}</div>`);
      this.group.addLayer(m);
    });
  }
  setView(lat, lng, z=13){ this.map.setView([lat,lng], z); }
}

// Mini mapa para selector de coordenadas
export class MiniPicker {
  constructor(containerId, onPick, initialCenter={lat:20.523, lng:-100.815}, zoom=12){
    this.map = L.map(containerId).setView(initialCenter, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'&copy; OpenStreetMap' }).addTo(this.map);
    this.onPick = onPick;
    this.marker = null;
    this.map.on('click', (e)=>{
      const { lat, lng } = e.latlng;
      if(this.marker) this.marker.remove();
      this.marker = L.circleMarker([lat,lng], { radius:8, color:'#fff', weight:2, fillColor:'#0ea5e9', fillOpacity:1 }).addTo(this.map);
      this.marker._coords = {lat,lng};
      onPick(this.marker._coords);
    });
  }
  setColor(color){ if(this.marker) this.marker.setStyle({ fillColor: color }); }
  getCoords(){ return this.marker? this.marker._coords : null; }
  clear(){ if(this.marker){ this.marker.remove(); this.marker=null; } }
}
