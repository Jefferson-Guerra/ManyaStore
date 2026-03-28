//Conexion Base de Datos
let carrito = [];
let listaProductosDB = []; // Nueva libreta para guardar los productos de SQL Server

// --- LÓGICA DE PRODUCTOS Y BÚSQUEDA ---
async function cargarProductos() {
    try {
        const respuesta = await fetch('http://localhost:3000/api/productos');
        listaProductosDB = await respuesta.json(); 
        
        // Dibujamos todos los productos la primera vez
        dibujarProductos(listaProductosDB);
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
        document.getElementById('contenedor-productos').innerHTML = "<h3 style='color:red;'>Error al conectar con el servidor.</h3>";
    }
}

// Esta función recibe una lista y la dibuja en pantalla
function dibujarProductos(lista) {
    const contenedor = document.getElementById('contenedor-productos');
    contenedor.innerHTML = ""; 

    if (lista.length === 0) {
        contenedor.innerHTML = "<h3 style='color: white; text-align: center; width: 100%; grid-column: 1 / -1;'>No se encontraron productos.</h3>";
        return;
    }

    lista.forEach(producto => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'ad-container';

        tarjeta.innerHTML = `
            <img src="${producto.ImagenURL || 'Imagenes/default.jpg'}" class="ad-image">
            <h2 class="ad-title">${producto.Nombre}</h2>
            <p class="ad-description">Stock: ${producto.Stock}</p>
            <div class="ad-price">S/ ${producto.Precio}</div>
            <a href="#" class="ad-button" onclick="agregarAlCarrito(event, ${producto.ProductosID})">Comprar Ahora</a>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// --- EL BUSCADOR EN TIEMPO REAL ---
const buscador = document.getElementById('buscador');

buscador.addEventListener('input', function() {
    // Lo que el usuario escribe, convertido a minúsculas
    const textoBusqueda = buscador.value.toLowerCase();

    // Filtramos la lista original: nos quedamos solo con los que incluyan el texto
    const productosFiltrados = listaProductosDB.filter(producto => {
        return producto.Nombre.toLowerCase().includes(textoBusqueda);
    });

    // Dibujamos la nueva lista filtrada
    dibujarProductos(productosFiltrados);
});

// --- FUNCIÓN PARA FILTRAR POR CATEGORÍA ---
function filtrarPorCategoria(idDeCategoria) {
    // Si el usuario presiona "Todos", dibujamos la lista completa original
    if (idDeCategoria === 'todos') {
        dibujarProductos(listaProductosDB);
        return;
    }

    // Si elige una categoría específica, filtramos la lista usando el CategoriaID
    const productosFiltrados = listaProductosDB.filter(producto => {
        return producto.CategoriaID === idDeCategoria;
    });

    // Dibujamos solo los productos que pasaron el filtro
    dibujarProductos(productosFiltrados);
}

function agregarAlCarrito(evento, id) {
    evento.preventDefault(); 
    
    // Buscamos toda la información del producto usando el ID
    const productoEncontrado = listaProductosDB.find(p => p.ProductosID === id);
    
    if(productoEncontrado) {
        carrito.push(productoEncontrado); // Guardamos todo el producto, no solo el ID
        actualizarCarrito();
    }
}

function actualizarCarrito() {
    // 1. Actualizamos el número rojo arriba
    const badge = document.querySelector('.badge');
    badge.textContent = carrito.length;

    // 2. Preparamos el panel lateral
    const listaCarrito = document.getElementById('lista-carrito');
    const totalCarrito = document.getElementById('total-carrito');

    // Si no hay nada, mostramos mensaje vacío
    if (carrito.length === 0) {
        listaCarrito.innerHTML = '<p class="text-center mt-5 text-secondary">El carrito está vacío.</p>';
        totalCarrito.textContent = 'S/ 0.00';
        return;
    }

    // 3. Dibujamos cada producto en el panel y sumamos el precio
    listaCarrito.innerHTML = ''; 
    let total = 0;

    carrito.forEach((prod, index) => {
        total += prod.Precio;
        listaCarrito.innerHTML += `
            <div class="d-flex justify-content-between align-items-center mb-3 p-2" style="background-color: #1a1a1a; border-radius: 8px;">
                <img src="${prod.ImagenURL}" style="width: 50px; height: 50px; object-fit: contain;">
                <div class="flex-grow-1 ms-3">
                    <h6 class="mb-0 text-white" style="font-size: 0.85rem;">${prod.Nombre}</h6>
                    <span style="color: #00ff88; font-weight: bold;">S/ ${prod.Precio}</span>
                </div>
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="eliminarDelCarrito(${index})">X</button>
            </div>
        `;
    });

    // 4. Mostramos el total sumado
    totalCarrito.textContent = `S/ ${total.toFixed(2)}`;
}

// Nueva función para quitar cosas si el cliente se arrepiente
function eliminarDelCarrito(index) {
    carrito.splice(index, 1); // Cortamos ese elemento de la lista
    actualizarCarrito();      // Redibujamos el carrito
}

// --- LÓGICA FINAL PARA COMPRAR ---
async function procesarCompra() {
    if(carrito.length === 0) {
        alert("Tu carrito está vacío. ¡Agrega algunos productos primero!");
        return;
    }

    // 1. Verificar si el usuario inició sesión
    const usuarioGuardado = localStorage.getItem('usuarioManya');
    if (!usuarioGuardado) {
        alert("¡Debes iniciar sesión en tu cuenta para poder comprar!");
        window.location.href = "login.html"; // Lo mandamos a loguearse
        return;
    }

    const usuario = JSON.parse(usuarioGuardado);

    // 2. Agrupar productos repetidos (Si compró 2 Laptops, ponemos "cantidad: 2")
    let productosAgrupados = [];
    
    carrito.forEach(prod => {
        let item = productosAgrupados.find(p => p.id === prod.ProductosID);
        if (item) {
            item.cantidad += 1; // Ya estaba en la lista, sumamos 1
        } else {
            // Es nuevo en la lista, lo agregamos con cantidad 1
            productosAgrupados.push({ id: prod.ProductosID, cantidad: 1 }); 
        }
    });

    // 3. Enviar todo a SQL Server a través de Node.js
    try {
        const respuesta = await fetch('http://localhost:3000/api/comprar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                usuarioId: usuario.id, 
                productos: productosAgrupados 
            })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Felicidades ' + usuario.nombre + '! ' + resultado.mensaje);
            
            // 4. Limpiamos el carrito como si ya se hubiera cobrado
            carrito = [];
            actualizarCarrito();
            
            // Cerramos el panel lateral automáticamente
            const panel = document.getElementById('panelCarrito');
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(panel);
            if(bsOffcanvas) bsOffcanvas.hide();
            
        } else {
            alert('Error: ' + resultado.error);
        }
    } catch (error) {
        console.error('Error de red:', error);
        alert('No se pudo conectar con el servidor.');
    }
}
// Iniciar cargando la tienda
cargarProductos();


// ==========================================
// --- LÓGICA DE SESIÓN DE USUARIO ---
// ==========================================

function verificarSesion() {
    // 1. Buscamos en la libreta del navegador si hay alguien guardado
    const usuarioGuardado = localStorage.getItem('usuarioManya');
    const menuUsuario = document.getElementById('menu-usuario');

    // 2. Si el usuario existe, cambiamos el HTML de esa sección
    if (usuarioGuardado) {
        // Convertimos el texto a un objeto que JavaScript entienda
        const usuario = JSON.parse(usuarioGuardado);

        // Reemplazamos "Iniciar sesión" por "Hola, [Nombre]" y un botón para salir
        menuUsuario.innerHTML = `
            <span class="nav-link text-white fw-bold" style="font-size: 1.1em;">Hola, ${usuario.nombre}</span>
            <div class="d-flex flex-column align-items-start">
            <a href="pedidos.html" class="small text-success text-decoration-none mb-1">📦 Mis Pedidos</a>
            <a href="#" class="small text-danger text-decoration-none" onclick="cerrarSesion()">Cerrar sesión</a>
            </div>
        `;
    }
}

// Función para cuando el usuario quiera salir de su cuenta
function cerrarSesion() {
    // Borramos su información de la libreta
    localStorage.removeItem('usuarioManya');
    // Recargamos la página para que vuelva a su estado original
    window.location.reload();
}

// 3. Ejecutamos la función apenas cargue la página
verificarSesion();