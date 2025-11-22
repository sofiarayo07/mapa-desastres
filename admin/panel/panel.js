// 1. Verificar si hay sesión iniciada
const token = localStorage.getItem('admin_token');
if (!token) {
    window.location.href = '../login/index.html';
}

// 2. Botón de Cerrar Sesión
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    window.location.href = '../login/index.html';
});

// 3. Cargar Reportes
async function cargarReportes() {
    const tbody = document.getElementById('tabla-reportes');
    
    try {
        const res = await fetch('http://localhost:3000/api/reportes');
        const reportes = await res.json();

        tbody.innerHTML = ''; // Limpiar tabla

        if (reportes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay reportes registrados</td></tr>';
            return;
        }

        reportes.forEach(repo => {
            const fecha = new Date(repo.fecha).toLocaleDateString() + ' ' + new Date(repo.fecha).toLocaleTimeString();
            const coords = repo.coordenadas ? `${repo.coordenadas.lat.toFixed(4)}, ${repo.coordenadas.lng.toFixed(4)}` : 'Sin datos';

            const fila = `
                <tr>
                    <td>${fecha}</td>
                    <td><span class="badge bg-secondary">${repo.tipo}</span></td>
                    <td>${repo.severidad}</td>
                    <td>${repo.descripcion}</td>
                    <td><small>${coords}</small></td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="borrarReporte('${repo._id}')">
                            <i class="fa fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += fila;
        });

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-danger text-center">Error al cargar: ${error.message}</td></tr>`;
    }
}

// 4. Borrar Reporte
window.borrarReporte = async (id) => {
    if(!confirm("¿Estás seguro de que quieres eliminar este reporte?")) return;

    try {
        const res = await fetch(`http://localhost:3000/api/reportes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` } // Enviamos el token para permiso (opcional en backend simple)
        });

        if(res.ok) {
            alert("Reporte eliminado");
            cargarReportes(); // Recargar la tabla
        } else {
            alert("Error al eliminar");
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión");
    }
};

// Iniciar carga
cargarReportes();