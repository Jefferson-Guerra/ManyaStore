// --- LÓGICA PARA EL BOTÓN DEL OJO ---
const btnOjo = document.getElementById('btnOjo');
const inputPassword = document.getElementById('password');
const iconoOjo = document.getElementById('iconoOjo');

btnOjo.addEventListener('click', function() {
    if (inputPassword.type === 'password') {
        inputPassword.type = 'text';
        iconoOjo.classList.remove('bi-eye');
        iconoOjo.classList.add('bi-eye-slash');
    } else {
        inputPassword.type = 'password';
        iconoOjo.classList.remove('bi-eye-slash');
        iconoOjo.classList.add('bi-eye');
    }
});

// --- LÓGICA PARA EL BOTÓN DEL OJO (LOGIN) ---
const btnOjoLogin = document.getElementById('btnOjoLogin');
const inputLoginPassword = document.getElementById('loginPassword');
const iconoOjoLogin = document.getElementById('iconoOjoLogin');

btnOjoLogin.addEventListener('click', function() {
    if (inputLoginPassword.type === 'password') {
        inputLoginPassword.type = 'text';
        iconoOjoLogin.classList.remove('bi-eye');
        iconoOjoLogin.classList.add('bi-eye-slash');
    } else {
        inputLoginPassword.type = 'password';
        iconoOjoLogin.classList.remove('bi-eye-slash');
        iconoOjoLogin.classList.add('bi-eye');
    }
});

// --- LÓGICA PARA REGISTRAR AL USUARIO ---
document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const correo = document.getElementById('correo').value;
    const password = document.getElementById('password').value;

    try {
        const respuesta = await fetch('http://localhost:3000/api/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, apellido, correo, password })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡' + resultado.mensaje + '!');
            document.getElementById('formRegistro').reset(); 
            inputPassword.type = 'password';
            iconoOjo.className = 'bi bi-eye';
        } else {
            alert('Error del servidor: ' + resultado.error);
        }
    } catch (error) {
        console.error('Error de red:', error);
        alert('No se pudo conectar con el servidor backend.');
    }
});

// --- LÓGICA PARA INICIAR SESIÓN (LOGIN) ---
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = document.getElementById('loginCorreo').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const respuesta = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            // 1. Guardamos los datos del usuario en la "libreta" del navegador
            localStorage.setItem('usuarioManya', JSON.stringify(resultado.usuario));
            
            alert('¡Bienvenido de vuelta, ' + resultado.usuario.nombre + '!');
            
            // 2. Lo redirigimos a la página principal para que empiece a comprar
            window.location.href = 'index.html';
        } else {
            // Mostrará "Correo o contraseña incorrectos"
            alert('Error: ' + resultado.error);
        }
    } catch (error) {
        console.error('Error de red:', error);
        alert('No se pudo conectar con el servidor backend.');
    }
});