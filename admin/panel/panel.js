// admin/panel/panel.js

// 1. Verificar Sesión
const token = localStorage.getItem('admin_token');
if (!token) {
    window.location.href = '../login/index.html';
}

// 2. Cerrar Sesión
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    window.location.href = '../login/index.html';
});

// Variable global para el modal
let modalBootstrap;

// --- NUEVA FUNCIÓN: Traducir Coordenadas a Dirección ---
async function obtenerDireccion(lat, lng, elementoId) {
    try {
        // Usamos la API gratuita de OpenStreetMap (Nominatim)
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        
        // Hacemos la petición
        const res = await fetch(url, {
            headers: { 'User-Agent': 'MapaDesastresApp/1.0' } // Es buena práctica identificarse
        });
        const data = await res.json();

        // Construimos una dirección bonita
        const addr = data.address;
        // Intentamos obtener: Calle, Colonia/Barrio, Ciudad/Municipio, Estado
        const calle = addr.road || addr.pedestrian || '';
        const colonia = addr.neighbourhood || addr.suburb || addr.quarter || '';
        const ciudad = addr.city || addr.town || addr.village || '';
        const estado = addr.state || '';

        // Formato final
        let direccionTexto = `${calle} ${colonia}, ${ciudad}, ${estado}`;
        
        // Limpiamos comas extra si faltan datos
        direccionTexto = direccionTexto.replace(/^ ,/, '').replace(/, ,/g, ',').trim();

        // Actualizamos el texto en la tabla
        const elemento = document.getElementById(elementoId);
        if(elemento) {
            elemento.textContent = direccionTexto || data.display_name;
            elemento.title = data.display_name; // Tooltip con dirección completa
        }

    } catch (error) {
        console.error("Error geocodificando:", error);
        const elemento = document.getElementById(elementoId);
        if(elemento) elemento.textContent = "Dirección no disponible";
    }
}

// 3. Cargar Reportes (MODIFICADA)
async function cargarReportes() {
    const tbody = document.getElementById('tabla-reportes');
    
    try {
        const res = await fetch('http://localhost:3000/api/reportes');
        const reportes = await res.json();

        tbody.innerHTML = ''; 

        if (reportes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay reportes registrados</td></tr>';
            return;
        }

        // Usamos un bucle for...of para poder manejar índices si fuera necesario
        for (const repo of reportes) {
            const fecha = new Date(repo.fecha).toLocaleDateString();
            const dataStr = JSON.stringify(repo).replace(/"/g, '&quot;');
            
            // Creamos un ID único para la celda de ubicación
            const ubicacionId = `ubicacion-${repo._id}`;

            // Preparamos el contenido inicial de la ubicación
            let ubicacionHTML = '<span class="text-muted">Sin coordenadas</span>';
            
            if (repo.coordenadas && repo.coordenadas.lat) {
                // Si tiene coordenadas, ponemos "Cargando..." y llamamos a la API
                ubicacionHTML = `
                    <small id="${ubicacionId}" class="d-block text-truncate" style="max-width: 200px;">
                        ⏳ <em>${repo.coordenadas.lat.toFixed(4)}, ${repo.coordenadas.lng.toFixed(4)}</em>
                    </small>
                `;
            }

            const fila = `
                <tr>
                    <td>${fecha}</td>
                    <td><span class="badge bg-secondary">${repo.tipo}</span></td>
                    <td>${repo.severidad}</td>
                    <td>${repo.descripcion}</td>
                    <td>${ubicacionHTML}</td> <td>
                        <button class="btn btn-warning btn-sm me-1" onclick="abrirEditar(${dataStr})">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="borrarReporte('${repo._id}')">🗑️</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += fila;

            // --- LLAMADA MÁGICA ---
            // Si hay coordenadas, llamamos a la función para traducir
            // Lo hacemos DESPUÉS de agregar la fila al HTML
            if (repo.coordenadas && repo.coordenadas.lat) {
                // Pequeño retardo aleatorio para no saturar la API gratuita si son muchos
                setTimeout(() => {
                    obtenerDireccion(repo.coordenadas.lat, repo.coordenadas.lng, ubicacionId);
                }, Math.random() * 1000); 
            }
        }

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-danger text-center">Error: ${error.message}</td></tr>`;
    }
}

// 4. FUNCION: Abrir Modal de Edición (Igual que antes)
window.abrirEditar = (reporte) => {
    document.getElementById('edit-id').value = reporte._id;
    document.getElementById('edit-tipo').value = reporte.tipo;
    document.getElementById('edit-sev').value = reporte.severidad;
    document.getElementById('edit-desc').value = reporte.descripcion;

    const modalEl = document.getElementById('modalEditar');
    modalBootstrap = new bootstrap.Modal(modalEl);
    modalBootstrap.show();
};

// 5. FUNCION: Guardar Cambios (Igual que antes)
window.guardarCambios = async () => {
    const id = document.getElementById('edit-id').value;
    const tipo = document.getElementById('edit-tipo').value;
    const sev = document.getElementById('edit-sev').value;
    const desc = document.getElementById('edit-desc').value;

    try {
        const res = await fetch(`http://localhost:3000/api/reportes/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ tipo, severidad: sev, descripcion: desc })
        });

        if(res.ok) {
            alert("Reporte actualizado con éxito");
            modalBootstrap.hide();
            cargarReportes();
        } else {
            alert("Error al actualizar");
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión");
    }
};

// 6. Borrar Reporte (Igual que antes)
window.borrarReporte = async (id) => {
    if(!confirm("¿Eliminar este reporte permanentemente?")) return;

    try {
        const res = await fetch(`http://localhost:3000/api/reportes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if(res.ok) {
            cargarReportes();
        } else {
            alert("Error al eliminar");
        }
    } catch (error) {
        alert("Error de conexión");
    }
};

// Iniciar
cargarReportes();