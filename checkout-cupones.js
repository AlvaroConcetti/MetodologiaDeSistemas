// ============================================================
//  CHECKOUT, MIS PEDIDOS Y CUPONES   
//  Confirmación de pedido, historial del cliente y cupones.
// ============================================================

function mostrarInfoDomicilio() {
    const box = $('infoDomicilioPedido');
    if (!box || !clienteLogueado) return;
    box.innerHTML = `<strong>Domicilio registrado:</strong><br>${escapeHtml(direccionCompleta(clienteLogueado))}`;
}

async function confirmarPedido() {
    const pago = $('pago').value;
    if (!pago) return mostrarMensaje('pedido', 'Seleccioná una forma de pago', 'error');

    if (Object.keys(carrito).length === 0) {
        return mostrarMensaje('pedido', 'El carrito está vacío', 'error');
    }

    const domicilioAlt = $('domicilio').value.trim();
    const direccion = domicilioAlt || direccionCompleta(clienteLogueado);

    const items = Object.keys(carrito).map(id => {
        const prod = productos.find(p => p.id == id);
        return { producto_id: prod.id, nombre: prod.nombre, cantidad: carrito[id], precio: prod.precio };
    });
    const totalBruto = items.reduce((s, i) => s + i.cantidad * i.precio, 0);

    let descuento = 0;
    let cuponCodigo = null;
    if (cuponAplicado) {
        const { data, error: errCup } = await db.from('cupones').select('*').eq('codigo', cuponAplicado.codigo);
        if (errCup) { console.error(errCup); return mostrarMensaje('pedido', 'Error verificando el cupón', 'error'); }
        const cupon = data && data[0];
        const hoy = new Date().toISOString().slice(0, 10);
        const vigente = cupon && cupon.estado !== 'usado'
            && !(cupon.valido_desde && hoy < cupon.valido_desde)
            && !(cupon.valido_hasta && hoy > cupon.valido_hasta);

        if (!vigente) {
            cuponAplicado = null;
            mostrarCarrito(); mostrarResumen();
            return mostrarMensaje('pedido', 'El cupón ya no es válido y fue removido', 'error');
        }
        if (!(totalBruto > cupon.descuento)) {
            return mostrarMensaje('pedido', 'El total debe ser mayor al descuento del cupón', 'error');
        }
        descuento = cupon.descuento;
        cuponCodigo = cupon.codigo;
    }

    const total = totalBruto - descuento;

    const { error } = await db.from('pedidos').insert([{
        cliente_id: clienteLogueado.id,
        total,
        metodo_pago: pago,
        direccion_envio: direccion,
        estado: 'sin confirmar',
        items,
        cupon_codigo: cuponCodigo,
        descuento
    }]);
    if (error) { console.error(error); return mostrarMensaje('pedido', 'Error al generar el pedido', 'error'); }

    for (const it of items) {
        const prod = productos.find(p => p.id === it.producto_id);
        await db.from('productos').update({ stock: prod.stock - it.cantidad }).eq('id', it.producto_id);
    }

    if (cuponCodigo) {
        await db.from('cupones').update({ estado: 'usado' }).eq('codigo', cuponCodigo);
    }

    carrito = {};
    cuponAplicado = null;
    if ($('codigoCupon')) $('codigoCupon').value = '';
    await cargarProductos();
    mostrarCarrito();
    mostrarResumen();
    mostrarMensaje('pedido', 'Pedido realizado con éxito', 'success');
}

async function cargarMisPedidos() {
    const cont = $('listaMisPedidos');
    cont.innerHTML = '<p>Cargando pedidos...</p>';

    const { data, error } = await db.from('pedidos').select('*')
        .eq('cliente_id', clienteLogueado.id).order('id', { ascending: false });

    if (error) { console.error(error); cont.innerHTML = '<p>Error cargando pedidos</p>'; return; }
    if (!data || data.length === 0) { cont.innerHTML = '<p>No tenés pedidos</p>'; return; }

    cont.innerHTML = data.map(p => pedidoCard(p)).join('');
}

// ---------- Cupones ----------
async function aplicarCupon() {
    const codigo = $('codigoCupon').value.trim();
    if (!codigo) return mostrarMensaje('carrito', 'Ingresá un código de cupón', 'error');

    const totalBruto = calcularTotalBruto();
    if (totalBruto <= 0) return mostrarMensaje('carrito', 'El carrito está vacío', 'error');

    const { data, error } = await db.from('cupones').select('*').eq('codigo', codigo);
    if (error) { console.error(error); return mostrarMensaje('carrito', 'Error verificando el cupón', 'error'); }
    if (!data || data.length === 0) return mostrarMensaje('carrito', 'Cupón inexistente', 'error');

    const cupon = data[0];

    if (cupon.estado === 'usado') return mostrarMensaje('carrito', 'Este cupón ya fue utilizado', 'error');

    const hoy = new Date().toISOString().slice(0, 10);
    if ((cupon.valido_desde && hoy < cupon.valido_desde) || (cupon.valido_hasta && hoy > cupon.valido_hasta)) {
        return mostrarMensaje('carrito', 'El cupón está fuera de su período de validez', 'error');
    }

    if (!(totalBruto > cupon.descuento)) {
        return mostrarMensaje('carrito',
            `El total (${dinero(totalBruto)}) debe ser mayor al descuento del cupón (${dinero(cupon.descuento)})`, 'error');
    }

    cuponAplicado = { codigo: cupon.codigo, descuento: cupon.descuento };
    mostrarCarrito();
    mostrarResumen();
    mostrarMensaje('carrito', `Cupón aplicado: -${dinero(cupon.descuento)}`, 'success');
}

function quitarCupon() {
    cuponAplicado = null;
    if ($('codigoCupon')) $('codigoCupon').value = '';
    mostrarCarrito();
    mostrarResumen();
}
