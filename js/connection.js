import 'dotenv/config';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import Reporte from "../server/models/Reporte.js";

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(() => console.log(" Conectado a MongoDB Atlas"))
  .catch(err => console.error(" Error de conexión:", err));


// =========================
// RUTAS DE LA API
// =========================

// Crear un nuevo reporte
app.post("/api/reportes", async (req, res) => {

  console.log("===================================");
  console.log("¡Se recibió un intento de POST!");
  console.log("DATOS RECIBIDOS (req.body):", req.body);
  console.log("===================================");

  try {
    const nuevo = new Reporte(req.body);
    await nuevo.save();
    res.status(201).json({
      mensaje: "Reporte guardado correctamente",
      data: nuevo
    });
  } catch (err) {
    console.error("Error al guardar:", err.message);
    res.status(500).json({ error: "Error al guardar el reporte", details: err.message });
  }
});

// Obtener todos los reportes
app.get("/api/reportes", async (req, res) => {
  try {
    const reportes = await Reporte.find().sort({ fecha: -1 });
    res.json(reportes);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los reportes" });
  }
});

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(` Servidor API activo en http://localhost:${PORT}`)
);
