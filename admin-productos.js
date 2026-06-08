// ============================================================
//  GESTIÓN DE PRODUCTOS - ADMIN   (Integrante 5)
//  Inventario con alerta de stock bajo, alta y baja de productos.
// ============================================================

// Inventario (vista Administrador de productos)
function renderInventarioAdmin() {
    const cont = $('stockAdmin');
    if (!cont) return;

    if (productos.length === 0) {
        cont.innerHTML = '<p>No hay productos cargados.</p>';
        return;
    }

    const STOCK_MINIMO = 5; // umbral de stock bajo

    cont.innerHTML = productos.map(p => {
        let claseStock = '';
        let icono = '';
        if (p.stock <= 0) {
            claseStock = 'sin-stock';
            icono = ' ⚠️';
        } else if (p.stock < STOCK_MINIMO) {
            claseStock = 'stock-bajo';
            icono = ' ⚠️';
        }
        return `
        <div class="inv-item ${claseStock}">
            <span class="inv-nombre">${escapeHtml(p.nombre)} — ${dinero(p.precio)}</span>
            <span class="inv-stock">Stock: ${p.stock}${icono}</span>
            <button class="btn-danger" onclick="eliminarProducto(${p.id})">Eliminar</button>
        </div>`;
    }).join('');
}

async function crearProducto() {
    const nombre = $('nuevoNombre').value.trim();
    const precio = parseFloat($('nuevoPrecio').value);
    const stock = parseInt($('nuevoStock').value, 10);
    const imagen = $('nuevaImagen').value.trim();

    if (!nombre || isNaN(precio) || isNaN(stock)) {
        return mostrarMensaje('admin', 'Debes completar nombre, precio y stock', 'error');
    }
    if (precio <= 0) {
        return mostrarMensaje('admin', 'El precio debe ser mayor a 0', 'error');
    }
    if (stock <= 0) {
        return mostrarMensaje('admin', 'El stock inicial debe ser mayor a 0', 'error');
    }

    const { error } = await db.from('productos').insert([{ nombre, precio, stock, imagen }]);
    if (error) { console.error(error); return mostrarMensaje('admin', 'Error creando producto', 'error'); }

    mostrarMensaje('admin', 'Producto creado exitosamente', 'success');
    $('nuevoNombre').value = '';
    $('nuevoPrecio').value = '';
    $('nuevoStock').value = '';
    $('nuevaImagen').value = '';
    await cargarProductos();
}

async function eliminarProducto(id) {
    if (!confirm('¿Eliminar producto?')) return;

    const { error } = await db.from('productos').delete().eq('id', id);
    if (error) { console.error(error); return mostrarMensaje('admin', 'Error eliminando', 'error'); }

    mostrarMensaje('admin', 'Producto eliminado', 'success');
    await cargarProductos();
}
