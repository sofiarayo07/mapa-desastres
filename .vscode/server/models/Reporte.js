// server/models/Reporte.js
import mongoose from "mongoose";

const reporteSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  tipo:       { type: String, required: true },   // inundacion, incendio, etc.
  severidad:  { type: String, required: true },   // baja, media, alta
  fuente:     { type: String, required: true },   // ciudadano, protección civil, etc.

  fecha: { type: Date, default: Date.now },

  coordenadas: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },

  municipio: String,
  colonia: String,
  personasAfectadas: Number,
  danosEstimados: Number,      // en pesos
  tiempoRespuestaMin: Number,  // minutos
  validado: { type: Boolean, default: false }
});

const Reporte = mongoose.model("Reporte", reporteSchema);
export default Reporte;
