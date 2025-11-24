// admin/panelprincipal/dashboard.js

// 1. Verificar Sesión (Seguridad básica)
const token = localStorage.getItem('admin_token');
if (!token) {
    // Si no hay token, mandar al login
    window.location.href = '../login/index.html';
}

// 2. Botón de Cerrar Sesión
document.getElementById('btn-logout').addEventListener('click', () => {
    // Borrar token
    localStorage.removeItem('admin_token');
    // Redirigir al login
    window.location.href = '../login/index.html';
});