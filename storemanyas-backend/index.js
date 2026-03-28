const express = require('express');
const sql = require('mssql/msnodesqlv8'); // <-- Cambiamos esto para usar el puente de Windows
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración usando Autenticación de Windows
const dbConfig = {
    server: 'localhost\\SQLEXPRESS', // Cambia a 'localhost' o '.' si ese fue el que te funcionó en VS Code
    database: 'ManyaStore',
    driver: 'msnodesqlv8',
    options: {
        trustedConnection: true, // Esto le dice que use tu cuenta de Windows actual
        trustServerCertificate: true 
    }
};

// Ruta para ver el catálogo
app.get('/api/productos', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query('SELECT * FROM Productos');
        res.json(result.recordset);
    } catch (err) {
        console.error("Error conectando a la base de datos: ", err);
        res.status(500).send("Error del servidor");
    }
});

// --- 2. NUEVA RUTA PARA REGISTRAR USUARIOS ---
app.post('/api/registro', async (req, res) => {
    // Recibimos los datos que nos enviará la página web
    const { nombre, apellido, correo, password } = req.body;

    try {
        // Encriptamos la contraseña por seguridad
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Conectamos a SQL Server
        let pool = await sql.connect(dbConfig);
        
        // Insertamos el usuario de forma segura usando parámetros (@) para evitar hackeos (SQL Injection)
        await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('correo', sql.VarChar, correo)
            .input('password', sql.VarChar, passwordHash)
            .query('INSERT INTO Usuarios (Nombre, Apellido, Correo, PasswordHash) VALUES (@nombre, @apellido, @correo, @password)');

        res.status(201).json({ mensaje: '¡Usuario registrado con éxito!' });
    } catch (error) {
        console.error("Error al registrar:", error);
        res.status(500).json({ error: 'Hubo un error al registrar el usuario' });
    }
});

// --- 3. NUEVA RUTA PARA INICIAR SESIÓN (LOGIN) ---
app.post('/api/login', async (req, res) => {
    const { correo, password } = req.body;

    try {
        let pool = await sql.connect(dbConfig);
        
        // 1. Buscamos en la base de datos si existe alguien con ese correo
        let result = await pool.request()
            .input('correo', sql.VarChar, correo)
            .query('SELECT * FROM Usuarios WHERE Correo = @correo');

        // Si la lista está vacía, el usuario no existe
        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        const usuario = result.recordset[0];

        // 2. Comparamos la contraseña que escribió con la encriptada en SQL Server
        const passwordValida = await bcrypt.compare(password, usuario.Passwordhash);

        if (!passwordValida) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        // 3. ¡Login exitoso! Devolvemos los datos del usuario (pero NUNCA la contraseña)
        res.status(200).json({ 
            mensaje: 'Inicio de sesión exitoso',
            usuario: {
                id: usuario.UsuarioID,
                nombre: usuario.Nombre,
                apellido: usuario.Apellido,
                correo: usuario.Correo
            }
        });

    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        res.status(500).json({ error: 'Hubo un error en el servidor' });
    }
});

// --- NUEVA RUTA PARA PROCESAR LA COMPRA (INTELIGENTE) ---
app.post('/api/comprar', async (req, res) => {
    const { usuarioId, productos } = req.body;

    try {
        let pool = await sql.connect(dbConfig);
        let carritoId;

        // 1. Preguntamos a SQL Server si este usuario ya tiene un carrito guardado
        let checkCarrito = await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .query('SELECT CarritoID FROM Carrito WHERE UsuarioID = @usuarioId');

        // 2. Tomamos una decisión basada en la respuesta
        if (checkCarrito.recordset.length > 0) {
            // ¡Ya tiene un carrito! Atrapamos el ID de ese carrito viejo
            carritoId = checkCarrito.recordset[0].CarritoID;
        } else {
            // No tiene carrito. Le creamos uno completamente nuevo
            let resultCarrito = await pool.request()
                .input('usuarioId', sql.Int, usuarioId)
                .query('INSERT INTO Carrito (UsuarioID, FechaCreacion) OUTPUT INSERTED.CarritoID VALUES (@usuarioId, GETDATE())');
            carritoId = resultCarrito.recordset[0].CarritoID;
        }

        // 3. Guardamos los productos elegidos dentro de su carrito (sea viejo o nuevo)
        for (let item of productos) {
            await pool.request()
                .input('carritoId', sql.Int, carritoId)
                .input('productoId', sql.Int, item.id) 
                .input('cantidad', sql.Int, item.cantidad)
                .query('INSERT INTO CarritoDetalle (CarritoID, ProductoID, Cantidad) VALUES (@carritoId, @productoId, @cantidad)');
        }

        res.status(201).json({ mensaje: 'Tu pedido se guardó correctamente en la base de datos' });
    } catch (error) {
        console.error("Error al procesar compra:", error);
        res.status(500).json({ error: 'Hubo un error al guardar tu pedido' });
    }
});

// --- NUEVA RUTA PARA VER EL HISTORIAL DE PEDIDOS ---
app.get('/api/mis-pedidos/:usuarioId', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        
        // Buscamos los carritos del usuario y los cruzamos con los productos
        let result = await pool.request()
            .input('usuarioId', sql.Int, req.params.usuarioId)
            .query(`
                SELECT 
                    c.CarritoID, 
                    c.FechaCreacion, 
                    p.Nombre, 
                    p.Precio, 
                    cd.Cantidad, 
                    p.ImagenURL
                FROM Carrito c
                INNER JOIN CarritoDetalle cd ON c.CarritoID = cd.CarritoID
                INNER JOIN Productos p ON cd.ProductoID = p.ProductosID
                WHERE c.UsuarioID = @usuarioId
                ORDER BY c.FechaCreacion DESC
            `);
            
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error al obtener el historial:", error);
        res.status(500).json({ error: 'Hubo un error al buscar tus pedidos' });
    }
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor de StoreManyas corriendo en http://localhost:${PORT}`);
});