import 'dotenv/config';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const uri = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro_123";

mongoose.connect(uri)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch(err => console.error("Error de conexión:", err));

// --- REPORTES ---
const reporteSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  tipo: { type: String, required: true },
  severidad: { type: String, required: true },
  fuente: { type: String, required: true },
  coordenadas: { lat: Number, lng: Number },
  fecha: { type: Date, default: Date.now },
  estado: { type: String },
  municipio: { type: String },
  colonia: { type: String },
  direccion_completa: { type: String }
});

const Reporte = mongoose.model("Reporte", reporteSchema);

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

app.put("/api/reportes/:id", async (req, res) => {
  try {
    const reporteActualizado = await Reporte.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reporteActualizado) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Reporte actualizado", data: reporteActualizado });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar" });
  }
});

// --- USUARIOS ---
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

// --- VIDEOS ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
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

app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en http://localhost:${PORT}`));