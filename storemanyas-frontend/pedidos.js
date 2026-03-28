// Apenas cargue la página, ejecutamos la función
document.addEventListener('DOMContentLoaded', cargarMisPedidos);

async function cargarMisPedidos() {
    // 1. Verificamos quién es el usuario
    const usuarioGuardado = localStorage.getItem('usuarioManya');
    if (!usuarioGuardado) {
        alert("Debes iniciar sesión para ver tus pedidos.");
        window.location.href = "login.html";
        return;
    }

    const usuario = JSON.parse(usuarioGuardado);
    const contenedor = document.getElementById('contenedor-pedidos');

    try {
        // 2. Le pedimos a Node.js el historial de este usuario específico
        const respuesta = await fetch(`http://localhost:3000/api/mis-pedidos/${usuario.id}`);
        const pedidos = await respuesta.json();

        contenedor.innerHTML = ""; // Limpiamos el mensaje de "Cargando..."

        // 3. Si no ha comprado nada
        if (pedidos.length === 0) {
            contenedor.innerHTML = `
                <div class="text-center mt-5">
                    <h4 class='text-secondary'>Aún no has realizado ninguna compra.</h4>
                    <a href="index.html" class="btn btn-manya mt-3">¡Ir a ver productos!</a>
                </div>`;
            return;
        }

        // 4. Si tiene compras, dibujamos una tarjeta por cada producto
        pedidos.forEach(pedido => {
            // Formatear la fecha para que se vea bien (Ej: 20 mar 2026)
            const fecha = new Date(pedido.FechaCreacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
            
            // Calculamos cuánto pagó en total por ese ítem
            const totalPagado = pedido.Precio * pedido.Cantidad;

            const tarjeta = document.createElement('div');
            tarjeta.className = 'col-md-6 col-lg-4 mb-4';
            tarjeta.innerHTML = `
                <div class="card bg-dark h-100" style="border: 1px solid #333; border-radius: 12px; transition: transform 0.3s;">
                    <div class="row g-0 align-items-center h-100 p-2">
                        <div class="col-4 text-center">
                            <img src="${pedido.ImagenURL}" class="img-fluid rounded" alt="${pedido.Nombre}" style="max-height: 100px; object-fit: contain;">
                        </div>
                        <div class="col-8">
                            <div class="card-body py-2 pe-2 ps-1">
                                <h6 class="card-title text-white mb-1" style="font-size: 0.95rem;">${pedido.Nombre}</h6>
                                <p class="card-text text-secondary small mb-2">📅 ${fecha}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-secondary" style="font-size: 0.8rem;">Cant: ${pedido.Cantidad}</span>
                                    <span class="fw-bold" style="color: #00ff88; font-size: 1.1rem;">S/ ${totalPagado}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        contenedor.innerHTML = "<h4 class='text-center text-danger mt-5'>Error al conectar con el servidor.</h4>";
    }
}