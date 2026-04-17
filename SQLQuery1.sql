create database StoreManyas

use StoreManyas

-- 1. Tabla de Usuarios (Para el Login y Registro)
create table Usuarios(
UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
Nombre varchar (50)NOT NULL,
Apellido varchar (50)NOT NULL,
Correo varchar (100)NOT NULL,
Passwordhash varchar (100)NOT NULL,
FechaRegistro DATETIME DEFAULT GETDATE()
);

-- 2. Tabla de Categorías (Para filtrar por Mouse, Teclado, Gráficas, etc.)
create table Categorias(
CategoriaID INT IDENTITY(1,1) PRIMARY KEY,
NombreCategoria varchar (100)NOT NULL,
Descripcion varchar (500),
);

-- 3. Tabla de Productos (El catálogo)
create table Productos(
ProductosID INT IDENTITY(1,1) PRIMARY KEY,
CategoriaID INT FOREIGN KEY REFERENCES Categorias(CategoriaID),
Nombre VARCHAR(100)NOT NULL,
Descripcion TEXT,
Precio DECIMAL(10,2)NOT NULL,
Stock INT NOT NULL,
ImagenURL VARCHAR(400)
);

-- 4. Tabla de Carrito de Compras (Cabecera)
create table Carrito(
CarritoID INT IDENTITY(1,1) PRIMARY KEY,
UsuarioID INT FOREIGN KEY REFERENCES Usuarios(UsuarioID) UNIQUE, -- Un carrito activo por usuario
FechaCreacion DATETIME DEFAULT GETDATE()
);

-- 5. Detalles del Carrito (Los periféricos dentro del carrito)
create table CarritoDetalle(
DetalleID INT IDENTITY(1,1) PRIMARY KEY,
CarritoID INT FOREIGN KEY REFERENCES Carrito(CarritoID),
ProductoID INT FOREIGN KEY REFERENCES Productos(ProductosID),
Cantidad INT NOT NULL
);

-- Insertamos algunas categorías de ejemplo
INSERT INTO Categorias (NombreCategoria) VALUES ('Tarjetas Gráficas'), ('Monitores'), ('Periféricos');

-- Insertamos un producto de ejemplo (Ej: Una tarjeta de video)
INSERT INTO Productos (CategoriaID, Nombre, Precio, Stock) 
VALUES (1, 'NVIDIA RTX 4070 Ti', 799.99, 15),
       (3, 'Mouse Logitech G Pro X Superlight', 150.00, 30);
