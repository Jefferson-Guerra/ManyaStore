USE ManyaStore;
GO

-- 1. Limpiamos los productos de prueba viejos
DELETE FROM Productos;
GO

-- 2. Insertamos tus 5 productos reales
-- (Asignamos CategoriaID 1: Gráficas, 2: Monitores, 3: Periféricos basándonos en tu primer script)
INSERT INTO Productos (CategoriaID, Nombre, Descripcion, Precio, Stock, ImagenURL) 
VALUES 
    (1, 'TARJETA GRAFICA RTX 3050', 'NVIDIA RTX 3050 4GB', 899.00, 10, 'Imagenes/TJGR1.jpg'),
    (3, 'TECLADO REDRAGON KUMARA', 'Teclado Inalambrico', 899.00, 15, 'Imagenes/TCLD1.jpg'),
    (3, 'MOUSE AQUILA AIR', 'Mouse Inalambrico', 899.00, 20, 'Imagenes/MOUSE2.jpg'),
    (2, 'MONITOR TEROS 165HZ', 'Monitor 165HZ', 899.00, 5, 'Imagenes/MNTR1.jpg'),
    (3, 'LAPTOP GAMER VICTUS RYZEN7 RTX3050', 'Laptop Gama Alta', 899.00, 8, 'Imagenes/LAPTOP2.webp');
GO

SELECT * FROM Usuarios