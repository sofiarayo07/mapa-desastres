import 'dotenv/config'; // <-- 1. LÍNEA NUEVA: Carga las variables de .env
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
app.use(cors());
app.use(express.json());

//  Conexión a MongoDB Atlas
// v-- 2. LÍNEA MODIFICADA: Lee la URI desde las variables de entorno
const uri = process.env.MONGO_URI; 

mongoose.connect(uri)
  .then(() => console.log(" Conectado a MongoDB Atlas"))
  .catch(err => console.error(" Error de conexión:", err));

//  Esquema y modelo del reporte
const reporteSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  tipo: { type: String, required: true },
  severidad: { type: String, required: true },
  fuente: { type: String, required: true },
  coordenadas: {
    lat: Number,
    lng: Number
  },
  fecha: { type: Date, default: Date.now }
});

// Mongoose crea la colección 'reportes' (plural)
const Reporte = mongoose.model("Reporte", reporteSchema); 

// Ruta para recibir reportes desde el formulario
app.post("/api/reportes", async (req, res) => {
  
  // ----- INICIO DE DEBUGGING -----
  console.log("===================================");
  console.log("¡Se recibió un intento de POST!");
  console.log("DATOS RECIBIDOS (req.body):", req.body);
  console.log("===================================");
  // ----- FIN DE DEBUGGING -----

  try {
    const nuevo = new Reporte(req.body);
    await nuevo.save();
    res.status(201).json({ mensaje: "Reporte guardado correctamente", data: nuevo });
  } catch (err) {
    // Mostramos el error de validación de Mongoose
    console.error("Error al guardar:", err.message); 
    res.status(500).json({ error: "Error al guardar el reporte", details: err.message });
  }
});

//Ruta para obtener los reportes
app.get("/api/reportes", async (req, res) => {
  try {
    const reportes = await Reporte.find().sort({ fecha: -1 });
    res.json(reportes);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los reportes" });
  }
});

// Servidor
// v-- 3. LÍNEA MODIFICADA: Lee el puerto de .env o usa 3000 como respaldo
const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => console.log(` Servidor API activo en http://localhost:${PORT}`));