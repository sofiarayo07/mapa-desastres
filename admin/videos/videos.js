// 1. Seguridad básica
const token = localStorage.getItem('admin_token');
if (!token) window.location.href = '../login/index.html';

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    window.location.href = '../login/index.html';
});

// 2. Cargar Videos (VERSIÓN DIAGNÓSTICO)
async function cargarVideos() {
    const grid = document.getElementById('video-grid');
    
    try {
        console.log("Intentando cargar videos..."); // DEBUG
        const res = await fetch('http://localhost:3000/api/videos?t=' + Date.now());
        
        if (!res.ok) {
            throw new Error(`Error del servidor: ${res.status}`);
        }

        const videos = await res.json();
        console.log("Videos recibidos:", videos); // DEBUG: Mira esto en la consola (F12)

        grid.innerHTML = ''; // Limpiar

        if (videos.length === 0) {
            grid.innerHTML = '<div class="col-12 text-center text-muted">No hay videos subidos aún.</div>';
            return;
        }

        // Generamos el HTML
        const videosHTML = videos.map(vid => {
            // 1. Si no tiene URL, lo saltamos
            if (!vid.url) {
                console.warn("Video ignorado (sin URL):", vid);
                return ''; 
            }

            // 2. Arreglar la ruta: quitamos 'uploads' duplicado si existe y corregimos barras
            // Queremos que quede: /uploads/archivo.mp4
            let rutaLimpia = vid.url.replace(/\\/g, '/'); // Cambiar \ por /
            
            // Si la ruta ya empieza con "uploads/", le agregamos la barra inicial
            if (!rutaLimpia.startsWith('/')) {
                rutaLimpia = '/' + rutaLimpia;
            }
            
            // Si por alguna razón se guardó la ruta absoluta completa, intentamos limpiarla
            if (rutaLimpia.includes('uploads/')) {
                // Asegurarnos de que apunte a la carpeta estática
                // Esto maneja si se guardó como "uploads/video.mp4" -> "/uploads/video.mp4"
                if(!rutaLimpia.startsWith('/uploads/')) {
                     rutaLimpia = '/uploads/' + rutaLimpia.split('uploads/')[1];
                }
            }

            console.log(`Video: ${vid.titulo} | Ruta final: http://localhost:3000${rutaLimpia}`); // DEBUG

            return `
                <div class="col-md-4 col-lg-3">
                    <div class="card video-card h-100 shadow-sm">
                        <div class="ratio ratio-16x9 bg-dark rounded-top">
                            <video controls preload="metadata">
                                <source src="http://localhost:3000${rutaLimpia}" type="video/mp4">
                                Tu navegador no soporta videos.
                            </video>
                        </div>
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title text-truncate" title="${vid.titulo}">${vid.titulo}</h5>
                            <p class="card-text small text-muted flex-grow-1">${vid.descripcion || 'Sin descripción'}</p>
                            <p class="card-text"><small class="text-muted">📅 ${new Date(vid.fecha).toLocaleDateString()}</small></p>
                            <button class="btn btn-outline-danger btn-sm w-100 mt-2" onclick="borrarVideo('${vid._id}')">
                                <i class="fa fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        grid.innerHTML = videosHTML;

    } catch (error) {
        console.error("ERROR GRAVE:", error);
        grid.innerHTML = `<div class="alert alert-danger">
            Error al cargar: ${error.message}. <br>
            <small>Abre la consola (F12) para ver más detalles.</small>
        </div>`;
    }
}

// 3. Subir Video (USAMOS FORMDATA)
document.getElementById('form-upload').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const titulo = document.getElementById('vid-titulo').value;
    const desc = document.getElementById('vid-desc').value;
    const fileInput = document.getElementById('vid-file');
    const status = document.getElementById('upload-status');
    const btn = document.getElementById('btn-subir');

    if(fileInput.files.length === 0) return alert("Selecciona un archivo");

    // Preparamos los datos como 'FormData' (necesario para archivos)
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', desc);
    formData.append('videoFile', fileInput.files[0]); // 'videoFile' debe coincidir con el backend

    btn.disabled = true;
    btn.textContent = "Subiendo... (Espere)";
    status.textContent = "Cargando archivo...";

    try {
        const res = await fetch('http://localhost:3000/api/videos', {
            method: 'POST',
            // NO ponemos Header 'Content-Type', el navegador lo pone solo para FormData
            body: formData 
        });

        const data = await res.json();

        if(res.ok) {
            alert("¡Video subido con éxito!");
            // Limpiar form y cerrar modal
            document.getElementById('form-upload').reset();
            const modalEl = document.getElementById('modalVideo');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            
            cargarVideos(); // Recargar lista
        } else {
            throw new Error(data.error);
        }

    } catch (error) {
        status.textContent = "Error: " + error.message;
        status.style.color = "red";
    } finally {
        btn.disabled = false;
        btn.textContent = "Publicar Video";
    }
});

// 4. Borrar Video
window.borrarVideo = async (id) => {
    if(!confirm("¿Seguro que quieres borrar este video?")) return;

    try {
        const res = await fetch(`http://localhost:3000/api/videos/${id}`, {
            method: 'DELETE'
        });

        if(res.ok) {
            cargarVideos();
        } else {
            alert("Error al borrar");
        }
    } catch (error) {
        console.error(error);
    }
};

// Iniciar
cargarVideos();