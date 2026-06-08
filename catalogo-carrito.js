// ============================================================
//  CATÁLOGO Y CARRITO   
//  Carga de productos, vista del catálogo y manejo del carrito.
// ============================================================

async function cargarProductos() {
    const { data, error } = await db.from('productos').select('*').order('id');
    if (error) { console.error(error); return; }
    productos = data || [];
    if (rolActual === 'cliente') mostrarProductos();
    if (rolActual === 'admin') renderInventarioAdmin();
}

// Catálogo de compra (vista Cliente)
function mostrarProductos() {
    const contenedor = $('productos');
    if (!contenedor) return;

    const disponibles = productos.filter(p => p.stock > 0);

    if (disponibles.length === 0) {
        contenedor.innerHTML = '<p>No hay productos disponibles.</p>';
        mostrarCarrito();
        return;
    }

    contenedor.innerHTML = disponibles.map(p => {
        const cantidad = carrito[p.id] || 0;
        const img = (p.imagen && p.imagen.trim() !== '')
            ? escapeHtml(p.imagen)
            : 'https://placehold.co/300x200?text=Producto';
        return `
            <div class="producto-card">
                <img src="${img}" alt="${escapeHtml(p.nombre)}"
                     onerror="this.src='https://placehold.co/300x200?text=Sin+Imagen'">
                <h4>${escapeHtml(p.nombre)}</h4>
                <p class="precio">${dinero(p.precio)}</p>
                <div class="producto-controles">
                    <button onclick="quitar(${p.id})" ${cantidad === 0 ? 'disabled' : ''}>-</button>
                    <span class="cantidad-display">${cantidad}</span>
                    <button onclick="agregar(${p.id})" ${cantidad >= p.stock ? 'disabled' : ''}>+</button>
                </div>
            </div>`;
    }).join('');

    mostrarCarrito();
}

function agregar(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    const actual = carrito[id] || 0;
    if (actual >= prod.stock) return mostrarMensaje('carrito', 'Sin stock disponible', 'error');

    carrito[id] = actual + 1;
    mostrarProductos();
}

function quitar(id) {
    if (!carrito[id]) return;
    carrito[id]--;
    if (carrito[id] <= 0) delete carrito[id];
    mostrarProductos();
}

function calcularTotalBruto() {
    return Object.keys(carrito).reduce((sum, id) => {
        const prod = productos.find(p => p.id == id);
        return prod ? sum + carrito[id] * prod.precio : sum;
    }, 0);
}

function renderLineasCarrito(contenedorId, totalId) {
    let totalBruto = 0;
    const lineas = Object.keys(carrito).map(id => {
        const prod = productos.find(p => p.id == id);
        if (!prod) return '';
        const subtotal = carrito[id] * prod.precio;
        totalBruto += subtotal;
        return `
            <div class="carrito-item">
                <span>${escapeHtml(prod.nombre)} x${carrito[id]}</span>
                <span>${dinero(subtotal)}</span>
            </div>`;
    }).join('');

    $(contenedorId).innerHTML = lineas || '<p>Carrito vacío</p>';

    if (cuponAplicado && !(totalBruto > cuponAplicado.descuento)) {
        cuponAplicado = null;
    }

    const totalEl = $(totalId);
    if (totalBruto > 0) {
        if (cuponAplicado) {
            const totalFinal = totalBruto - cuponAplicado.descuento;
            totalEl.innerHTML = `
                <div class="total-linea">Subtotal: ${dinero(totalBruto)}</div>
                <div class="total-linea cupon-descuento">Cupón ${escapeHtml(cuponAplicado.codigo)}: -${dinero(cuponAplicado.descuento)}</div>
                <div class="total-linea">Total: ${dinero(totalFinal)}</div>`;
        } else {
            totalEl.innerHTML = `Total: ${dinero(totalBruto)}`;
        }
        totalEl.style.display = 'block';
    } else {
        totalEl.style.display = 'none';
    }
    return totalBruto;
}

function mostrarCarrito() { renderLineasCarrito('itemsCarrito', 'totalCarrito'); }
function mostrarResumen() { renderLineasCarrito('resumenPedido', 'totalPedido'); }
