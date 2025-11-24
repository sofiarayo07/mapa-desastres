document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const correo = document.getElementById('correo').value;
    const contrasena = document.getElementById('contrasena').value;
    const errorDiv = document.getElementById('error-message');
    
    errorDiv.textContent = 'Verificando...';
    errorDiv.style.color = 'white';
  
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Datos incorrectos');
      }
  
      // ¡Login correcto!
      errorDiv.textContent = '¡Bienvenido!';
      errorDiv.style.color = '#00ff00';
      
      // Guardamos el token de seguridad
      localStorage.setItem('admin_token', data.token);
  
      // REDIRECCIÓN: Vamos a la carpeta del panel (crea esta carpeta después)
      setTimeout(() => {
          window.location.href = '../panelprincipal/index.html'; 
      }, 1000);
  
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.color = '#ff4444'; 
    }
  });