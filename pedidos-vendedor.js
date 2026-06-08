// ============================================================
//  GESTIÓN DE PEDIDOS - VENDEDOR   (Integrante 4)
//  Listado, tarjetas, cambios de estado y cancelación.
// ============================================================

async function cargarPedidosAdmin() {
    const cont = $('listaPedidos');
    cont.innerHTML = '<p>Cargando pedidos...</p>';

    const { data, error } = await db.from('pedidos').select('*').order('id', { ascending: false });
    if (error) { console.error(error); cont.innerHTML = `<p class="text-error">${escapeHtml(error.message)}</p>`; return; }
    if (!data || data.length === 0) { cont.innerHTML = '<p>No hay pedidos</p>'; return; }

    const nuevos = data.filter(p => !p.estado || p.estado === 'sin confirmar');
    const enProceso = data.filter(p => p.estado === 'pendiente' || p.estado === 'entregado');
    const cancelados = data.filter(p => p.estado === 'cancelado');

    let html = '<h2 class="grupo-pedidos-titulo">🛒 Pedidos Nuevos</h2>';
    html += nuevos.length
        ? nuevos.map(p => pedidoCard(p, `
            <div class="acciones-pedido">
                <button onclick="confirmarPedidoAdmin(${p.id})">✅ Confirmar</button>
                <button class="btn-danger" onclick="cancelarPedido(${p.id})">❌ Cancelar</button>
            </div>`)).join('')
        : '<p>No hay pedidos nuevos</p>';

    html += '<h2 class="grupo-pedidos-titulo">🚚 En Proceso</h2>';
    html += enProceso.length
        ? enProceso.map(p => pedidoCard(p, `
            <div class="acciones-pedido">
                <button onclick="cambiarEstadoPedido(${p.id}, 'pendiente')">⏳ Pendiente</button>
                <button onclick="cambiarEstadoPedido(${p.id}, 'entregado')">✅ Entregado</button>
                <button class="btn-danger" onclick="cancelarPedido(${p.id})">❌ Cancelar</button>
            </div>`)).join('')
        : '<p>No hay pedidos en proceso</p>';

    if (cancelados.length) {
        html += '<h2 class="grupo-pedidos-titulo">❌ Cancelados</h2>';
        html += cancelados.map(p => pedidoCard(p)).join('');
    }

    cont.innerHTML = html;
}

function pedidoCard(pedido, acciones = '') {
    const estado = pedido.estado || 'sin confirmar';
    const claseEstado = 'estado-' + estado.replace(/\s+/g, '-');

    const lineas = (pedido.items || []).map(i =>
        `<div class="pedido-linea"><span>${escapeHtml(i.nombre)} x${i.cantidad}</span><span>${dinero(i.cantidad * i.precio)}</span></div>`
    ).join('');

    return `
        <div class="pedido-card ${claseEstado}">
            <h3>Pedido #${pedido.id}</h3>
            ${lineas ? `<div class="pedido-lineas">${lineas}</div>` : ''}
            <p><strong>Total:</strong> ${dinero(pedido.total)}</p>
            ${pedido.cupon_codigo ? `<p><strong>Cupón:</strong> ${escapeHtml(pedido.cupon_codigo)} (-${dinero(pedido.descuento)})</p>` : ''}
            <p><strong>Pago:</strong> ${escapeHtml(pedido.metodo_pago)}</p>
            <p><strong>Dirección:</strong> ${escapeHtml(pedido.direccion_envio)}</p>
            <p><strong>Estado:</strong> <span class="badge-estado">${escapeHtml(estado)}</span></p>
            ${pedido.motivo_cancelacion ? `<p><strong>Motivo cancelación:</strong> ${escapeHtml(pedido.motivo_cancelacion)}</p>` : ''}
            ${acciones}
        </div>`;
}

async function confirmarPedidoAdmin(id) {
    const { error } = await db.from('pedidos').update({ estado: 'pendiente' }).eq('id', id);
    if (error) { console.error(error); return mostrarMensaje('pedidosAdmin', 'Error al confirmar pedido', 'error'); }
    cargarPedidosAdmin();
}

async function cambiarEstadoPedido(id, estado) {
    const { error } = await db.from('pedidos').update({ estado }).eq('id', id);
    if (error) { console.error(error); return mostrarMensaje('pedidosAdmin', 'Error cambiando estado', 'error'); }
    cargarPedidosAdmin();
}

async function cancelarPedido(id) {
    const motivo = prompt('Motivo de cancelación (obligatorio):');
    if (motivo === null) return;
    if (!motivo.trim()) { alert('Es obligatorio ingresar un motivo.'); return; }

    const { data: pedido, error: errGet } = await db.from('pedidos').select('*').eq('id', id).single();
    if (errGet) { console.error(errGet); return mostrarMensaje('pedidosAdmin', 'Error al leer el pedido', 'error'); }

    if (pedido && pedido.estado !== 'cancelado' && Array.isArray(pedido.items)) {
        for (const it of pedido.items) {
            const { data: prod } = await db.from('productos').select('stock').eq('id', it.producto_id).single();
            if (prod) {
                await db.from('productos').update({ stock: prod.stock + it.cantidad }).eq('id', it.producto_id);
            }
        }
    }

    const { error } = await db.from('pedidos')
        .update({ estado: 'cancelado', motivo_cancelacion: motivo.trim() }).eq('id', id);
    if (error) { console.error(error); return mostrarMensaje('pedidosAdmin', 'Error cancelando pedido', 'error'); }

    await cargarProductos();
    cargarPedidosAdmin();
}
