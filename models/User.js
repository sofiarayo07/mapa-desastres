// /models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  primer_apellido: { type: String, required: true },
  segundo_apellido: { type: String },
  rfc: { type: String, unique: true, sparse: true }, // sparse permite nulls
  
  // 'username' guardará el correo. Es el campo principal.
  username: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  
  // Campos para reseteo de contraseña
  resetToken: { type: String },
  resetTokenExpires: { type: Date }
});

// --- Hashear la contraseña ANTES de guardarla ---
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Método para comparar contraseñas ---
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;