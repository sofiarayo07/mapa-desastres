import 'dotenv/config';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { scrapeAlertasExternas } from './scraper.js';
import cron from 'node-cron';


// =============================================================
// CRON JOB: Ejecutar análisis de R cada minuto
// =============================================================
cron.schedule("*/1 * * * *", () => {
    console.log("Ejecutando análisis R...");

    const R_BIN = `"C:\\Program Files\\R\\R-4.5.2\\bin\\Rscript.exe"`;
    const command = `${R_BIN} "${path.join(__dirname, "../analisis.R")}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("Error ejecutando R:", error.message);
            console.error("stderr:", stderr);
        } else {
            console.log("Análisis completado");
        }
    });
});



// Configuración de rutas y servidor
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
// Aumentamos límite para videos pesados
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Carpeta pública para videos e imágenes
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const uri = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro_123";

// Conexión a Base de Datos
mongoose.connect(uri)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch(err => console.error("Error de conexión:", err));

// ==========================================
// 1. REPORTES (Con datos para R)
// ==========================================
const reporteSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  tipo:        { type: String, required: true },
  severidad:   { type: String, required: true },
  fuente:      { type: String, required: true },
  coordenadas: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  fecha: { type: Date, default: Date.now },

  municipio: String,
  colonia: String,

  // NUEVOS CAMPOS OPCIONALES
  origenUrl: String,
  externoId: { type: String, index: true, sparse: true }
});

const Reporte = mongoose.model("Reporte", reporteSchema);

// Middleware: requiere token JWT válido
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No autorizado (falta token)" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id; // por si lo quieres usar después
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

app.post("/api/reportes", async (req, res) => {
  try {
    const nuevo = new Reporte(req.body);
    await nuevo.save();
    res.status(201).json({ mensaje: "Reporte guardado", data: nuevo });
  } catch (err) {
    res.status(500).json({ error: "Error al guardar", details: err.message });
  }
});

app.get("/api/reportes", async (req, res) => {
  try {
    const reportes = await Reporte.find().sort({ fecha: -1 });
    res.json(reportes);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener reportes" });
  }
});

app.delete("/api/reportes/:id", async (req, res) => {
  try {
    await Reporte.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Reporte eliminado" });
  } catch (err) {
    res.status(500).json({ error: "No se pudo eliminar" });
  }
});

// Lanza scraping manualmente desde Protección Civil GTO
app.post("/api/scrape/proteccion-civil", requireAuth, async (req, res) => {
  try {
    // Puedes mandar { "pages": 1 } en el body, por defecto 1 página
    const { pages = 1 } = req.body || {};

    // 1) Scrapeamos boletines
    const alertas = await scrapeProteccionCivilGTO({ pages });

    let insertados = 0;

    for (const a of alertas) {
      // 2) Evitar duplicados: si ya existe un reporte con esa URL de origen, lo saltamos
      const ya = await Reporte.findOne({ origenUrl: a.enlace });
      if (ya) continue;

      // 3) Guardar el reporte en Mongo con tu esquema
      const rep = new Reporte({
        descripcion: a.descripcion || a.titulo,
        tipo: a.tipoDesastre,           // "inundacion", "incendio_forestal", etc.
        severidad: "media",             // por ahora fija; luego la calculas
        fuente: a.fuente,               // "proteccion_civil_gto"
        coordenadas: { lat: null, lng: null }, // luego puedes geocodificar
        fecha: a.fecha || new Date(),
        // campos extra opcionales si los tienes en el esquema:
        municipio: a.zona || null,
        estado: "Guanajuato",
        origenUrl: a.enlace
      });

      await rep.save();
      insertados++;
    }

    res.json({
      ok: true,
      encontrados: alertas.length,
      insertados
    });
  } catch (err) {
    console.error("Error scraping PC GTO:", err);
    res.status(500).json({
      error: "Error en scraping",
      detalle: err.message
    });
  }
});


app.put("/api/reportes/:id", async (req, res) => {
  try {
    const reporteActualizado = await Reporte.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reporteActualizado) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Reporte actualizado", data: reporteActualizado });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar" });
  }
});

// ==========================================
// 2. USUARIOS (Auth)
// ==========================================
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

app.post("/api/auth/register", async (req, res) => {
  const { correo, contrasena } = req.body;
  try {
    const userExists = await User.findOne({ username: correo });
    if (userExists) return res.status(400).json({ error: 'Correo ya registrado' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    const newUser = new User({ username: correo, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ mensaje: "Usuario registrado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { correo, contrasena } = req.body;
  try {
    const user = await User.findOne({ username: correo });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const valid = await bcrypt.compare(contrasena, user.password);
    if (!valid) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ mensaje: "Bienvenido", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. VIDEOS (Multer)
// ==========================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Limpiamos el nombre de caracteres raros
    const nombreLimpio = file.originalname.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9.-]/g, '');
    cb(null, Date.now() + '-' + nombreLimpio);
  }
});
const upload = multer({ storage: storage });

const videoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String },
  url: { type: String, required: true },
  fecha: { type: Date, default: Date.now }
});
const Video = mongoose.model("Video", videoSchema);

app.post("/api/videos", upload.single('videoFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No hay archivo" });
    const nuevoVideo = new Video({
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      url: req.file.path
    });
    await nuevoVideo.save();
    res.status(201).json({ mensaje: "Video subido", data: nuevoVideo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/videos", async (req, res) => {
  try {
    const videos = await Video.find().sort({ fecha: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener videos" });
  }
});

app.delete("/api/videos/:id", async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Video eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

// ==========================================
// 4. INTEGRACIÓN CON R (Gráfica)
// ==========================================
app.get("/api/analytics/grafica", async (req, res) => {
  try {
    const reportes = await Reporte.find();
    
    // Crear CSV temporal
    let csvContent = "tipo,severidad,estado\n"; 
    reportes.forEach(r => {
      const tipo = (r.tipo || "otro").replace(/,/g, '');
      const sev = (r.severidad || "media").replace(/,/g, '');
      const est = (r.estado || "desconocido").replace(/,/g, '');
      csvContent += `${tipo},${sev},${est}\n`;
    });

    const tempCsvPath = path.resolve(__dirname, '../temp_data.csv');
    const imagePath  = path.resolve(__dirname, '../uploads/grafica_r.png');
    const rScriptPath = path.resolve(__dirname, '../analisis.R');

    // Guardar CSV
    fs.writeFileSync(tempCsvPath, csvContent);

    // ⚠️ AJUSTA ESTA RUTA A TU VERSIÓN DE R
    // EJEMPLO: C:\\Program Files\\R\\R-4.4.1\\bin\\Rscript.exe
    const RSCRIPT_BIN = `"C:\\Program Files\\R\\R-4.5.2\\bin\\Rscript.exe"`;

    // 👉 Aquí verificas QUÉ está intentando ejecutar Node
    console.log("Ruta analisis.R:", rScriptPath);
    console.log("CSV temporal:", tempCsvPath);
    console.log("Imagen salida:", imagePath);

    const command = `${RSCRIPT_BIN} "${rScriptPath}" "${tempCsvPath}" "${imagePath}"`;
    console.log("Comando que se ejecuta:", command);

    // Ejecutar R
    exec(command, (error, stdout, stderr) => {
      console.log("stdout R:", stdout);
      console.error("stderr R:", stderr);

      if (error) {
        console.error("Error ejecutando Rscript:", error);
        return res.status(500).json({
          ok: false,
          error: "Error ejecutando R",
          detalle: stderr || error.message,
        });
      }

      // Si todo salió bien:
      return res.json({
        ok: true,
        imagen: "/uploads/grafica_r.png",
      });
  });


  } catch (error) {
    console.error(error);
    res.status(500).send("Error interno");
  }
});


// ==========================================
// SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor API activo en http://localhost:${PORT}`));