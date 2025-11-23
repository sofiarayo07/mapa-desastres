import 'dotenv/config';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

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
    res.status(201).json({ mensaje: "Reporte guardado correctamente", data: nuevo });
  } catch (err) {
    console.error("Error al guardar:", err.message);
    res.status(500).json({ error: "Error al guardar el reporte", details: err.message });
  }
});

app.get("/api/reportes", async (req, res) => {
  try {
    const reportes = await Reporte.find().sort({ fecha: -1 });
    res.json(reportes);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los reportes" });
  }
});

// --- USUARIOS Y LOGIN ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

app.post("/api/auth/register", async (req, res) => {
  const { correo, contrasena } = req.body;
  try {
    const userExists = await User.findOne({ username: correo });
    if (userExists) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    const newUser = new User({
      username: correo,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ mensaje: "Usuario registrado con éxito" });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar: " + error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { correo, contrasena } = req.body;
  try {
    const user = await User.findOne({ username: correo });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const validPassword = await bcrypt.compare(contrasena, user.password);
    if (!validPassword) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '8h' });

    res.json({ mensaje: "Bienvenido", token: token });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor: " + error.message });
  }
});
// --- Borrar Reporte (Agrega esto para que sirva el panel) ---
app.delete("/api/reportes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Reporte.findByIdAndDelete(id);
    res.json({ mensaje: "Reporte eliminado" });
  } catch (err) {
    res.status(500).json({ error: "No se pudo eliminar" });
  }
});
// --- Actualizar Reporte (PUT) ---
app.put("/api/reportes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // actualizamos con lo que venga en req.body
    const reporteActualizado = await Reporte.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!reporteActualizado) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }
    
    res.json({ mensaje: "Reporte actualizado", data: reporteActualizado });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar" });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor API activo en http://localhost:${PORT}`));