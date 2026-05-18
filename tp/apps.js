// ==========================================
// CONFIGURACIÓN SUPABASE
// ==========================================
const supabaseUrl =
    'https://vhstnvksqkwtkhlmvjpx.supabase.co';

const supabaseKey =
    'sb_publishable_PbRyBysvqfnzEGddsJ4l_w_1siFwxt5';

const db =
    window.supabase.createClient(
        supabaseUrl,
        supabaseKey
    );

// ==========================================
// ESTADO APP
// ==========================================
let rolActual = 'cliente';

let clientes = [];

let productos = [];

let carrito = {};

let clienteLogueado = null;

// ==========================================
// INICIO
// ==========================================
document.addEventListener(
    'DOMContentLoaded',
    inicializarApp
);

async function inicializarApp() {

    await cargarProductos();

    await cargarClientes();

    actualizarVistaCuenta();
}

// ==========================================
// PRODUCTOS
// ==========================================
async function cargarProductos() {

    const { data, error } =
        await db
            .from('productos')
            .select('*')
            .order('id');

    if (error) {

        console.error(error);

        return;
    }

    productos = data || [];

    mostrarProductos();
}

// ==========================================
// CLIENTES
// ==========================================
async function cargarClientes() {

    const { data, error } =
        await db
            .from('clientes')
            .select('*');

    if (error) {

        console.error(error);

        return;
    }

    clientes = data || [];
}

// ==========================================
// LOGIN
// ==========================================
async function intentarIngresar() {

    const email =
        document
            .getElementById('emailSimple')
            .value
            .trim();

    const passwordAdmin =
        document
            .getElementById('passwordAdmin')
            ?.value || '';

    if (!email) {

        mostrarMensaje(
            'acceso',
            'Ingresa un email',
            'error'
        );

        return;
    }

    const { data, error } =
        await db
            .from('clientes')
            .select('*')
            .eq('email', email);

    if (error) {

        console.error(error);

        mostrarMensaje(
            'acceso',
            'Error conexión',
            'error'
        );

        return;
    }

    if (!data || data.length === 0) {

        mostrarMensaje(
            'acceso',
            'Email no registrado',
            'error'
        );

        return;
    }

    clienteLogueado = data[0];

    // ADMIN
    if (
        email === 'admin@admin.com' &&
        passwordAdmin === '1234'
    ) {

        rolActual = 'admin';

    } else {

        rolActual = 'cliente';
    }

    actualizarVistaCuenta();

    cambiarRol();

    mostrarMensaje(
        'acceso',
        'Bienvenido',
        'success'
    );

    mostrarSeccion('carrito');
}

// ==========================================
// REGISTRO
// ==========================================
document.getElementById(
    'formCliente'
).onsubmit = async function (e) {

    e.preventDefault();

    const email =
        document
            .getElementById('email')
            .value
            .trim();

    const { data: existe } =
        await db
            .from('clientes')
            .select('email')
            .eq('email', email);

    if (existe.length > 0) {

        mostrarMensaje(
            'cliente',
            'Email ya registrado',
            'error'
        );

        return;
    }

    // ==========================================
    // NUEVA VALIDACIÓN: NOMBRE SIN NÚMEROS
    // ==========================================
    const valorNombre = document.getElementById('nombre').value;
    const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    
    if (!regexSoloLetras.test(valorNombre)) {
        mostrarMensaje('cliente', 'El nombre solo puede contener letras y espacios', 'error');
        return;
    }
    // ==========================================

    const nuevoCliente = {

        nombre:
            valorNombre, // <-- Acá pasamos la variable ya validada

        email:
            email,

        pais:
            document.getElementById('pais').value,

        provincia:
            document.getElementById('provincia').value,

        localidad:
            document.getElementById('localidad').value,

        calle:
            document.getElementById('calle').value,

        numero:
            parseInt(
                document.getElementById('numero').value
            )
    };

    const { data, error } =
        await db
            .from('clientes')
            .insert([nuevoCliente])
            .select();

    if (error) {

        console.error(error);

        mostrarMensaje(
            'cliente',
            error.message,
            'error'
        );

        return;
    }

    clienteLogueado = data[0];

    this.reset();

    actualizarVistaCuenta();

    mostrarMensaje(
        'cliente',
        'Registro exitoso',
        'success'
    );
};

// ==========================================
// VISTA
// ==========================================
function actualizarVistaCuenta() {

    const headerRol =
        document.getElementById('headerRol');

    const nav =
        document.getElementById('navPrincipal');

    const vistaAuth =
        document.getElementById('vistaAuth');

    const vistaRegistro =
        document.getElementById('vistaRegistro');

    const panelUsuario =
        document.getElementById('panelUsuario');

    if (clienteLogueado) {

        nav.style.display = 'block';

        panelUsuario.style.display = 'block';

        vistaAuth.style.display = 'none';

        vistaRegistro.style.display = 'none';

        document.getElementById(
            'nombreUsuarioLogueado'
        ).textContent =
            clienteLogueado.nombre;

        if (rolActual === 'admin') {

            headerRol.style.display =
                'block';

        } else {

            headerRol.style.display =
                'none';
        }

    } else {

        headerRol.style.display =
            'none';

        nav.style.display =
            'none';

        panelUsuario.style.display =
            'none';

        vistaAuth.style.display =
            'block';

        vistaRegistro.style.display =
            'none';
    }
}

// ==========================================
// ROL
// ==========================================
function cambiarRol() {

    const selectRol =
        document.getElementById('rol');

    if (selectRol) {

        selectRol.value =
            rolActual;
    }

    const rolActualText =
        document.getElementById(
            'rolActual'
        );

    if (rolActualText) {

        rolActualText.textContent =
            rolActual;
    }

    const adminBtns =
        document.querySelectorAll(
            '.admin-only'
        );

    adminBtns.forEach(btn => {

        btn.style.display =
            rolActual === 'admin'
                ? 'inline-block'
                : 'none';
    });
}

// ==========================================
// CERRAR SESIÓN
// ==========================================
function cerrarSesion() {

    clienteLogueado = null;

    carrito = {};

    rolActual = 'cliente';

    actualizarVistaCuenta();

    mostrarSeccion('clientes');
}

// ==========================================
// PRODUCTOS
// ==========================================
function mostrarProductos() {

    const contenedor =
        document.getElementById(
            'productos'
        );

    let html = '';

    const productosMostrar =
        rolActual === 'admin'
            ? productos
            : productos.filter(
                p => p.stock > 0
            );

    if (productosMostrar.length === 0) {

        contenedor.innerHTML =
            '<p>No hay productos</p>';

        return;
    }

    productosMostrar.forEach(p => {

        const cantidad =
            carrito[p.id] || 0;

        html += `
            <div class="producto-card">

                <img
                    src="${p.imagen &&
                p.imagen.trim() !== ''
                ? p.imagen
                : 'https://via.placeholder.com/300x200?text=Producto'
            }"

                    alt="${p.nombre}"

                    onerror="
                        this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'
                    "

                    style="
                        width:100%;
                        height:220px;
                        object-fit:cover;
                        border-radius:10px;
                        margin-bottom:10px;
                    "
                >

                <h4>${p.nombre}</h4>

                <p class="precio">
                    $${p.precio}
                </p>

                ${rolActual === 'admin'
                ? `
                    <p class="stock">
                        Stock:
                        ${p.stock}
                    </p>
                    `
                : ''
            }

                <div class="producto-controles">

                    <button
                        onclick="quitar(${p.id})"
                        ${cantidad === 0
                ? 'disabled'
                : ''
            }
                    >
                        -
                    </button>

                    <span class="cantidad-display">
                        ${cantidad}
                    </span>

                    <button
                        onclick="agregar(${p.id})"
                        ${cantidad >= p.stock
                ? 'disabled'
                : ''
            }
                    >
                        +
                    </button>

                </div>

                ${rolActual === 'admin'
                ? `
                    <button
                        class="danger"
                        onclick="eliminarProducto(${p.id})"
                        style="
                            margin-top:10px;
                            width:100%;
                        "
                    >
                        Eliminar
                    </button>
                    `
                : ''
            }

            </div>
        `;
    });

    contenedor.innerHTML = html;

    mostrarCarrito();
}

// ==========================================
// CREAR PRODUCTO (CON VALIDACIÓN DE STOCK Y PRECIO)
// ==========================================
async function crearProducto() {

    const nombre = document.getElementById('nuevoNombre').value;
    const precio = parseFloat(document.getElementById('nuevoPrecio').value);
    const stock = parseInt(document.getElementById('nuevoStock').value);
    const imagen = document.getElementById('nuevaImagen').value;

    // 1. Validar que no haya campos vacíos
    if (!nombre || isNaN(precio) || isNaN(stock)) {
        mostrarMensaje('admin', 'Debes completar todos los campos', 'error');
        return; // Corta la ejecución acá, no va a la base de datos
    }

    // 2. Validar regla de negocio (MDS-5): Precio mayor a 0
    if (precio <= 0) {
        mostrarMensaje('admin', 'El precio debe ser mayor a 0', 'error');
        return;
    }

    // 3. Validar regla de negocio (MDS-5): Stock mayor a 0 (No negativos)
    if (stock <= 0) {
        mostrarMensaje('admin', 'El stock inicial debe ser mayor a 0', 'error');
        return;
    }

    // Si pasa todas las validaciones, recién ahí inserta en Supabase
    const { error } = await db.from('productos').insert([{
        nombre,
        precio,
        stock,
        imagen
    }]);

    if (error) {
        console.error(error);
        mostrarMensaje('admin', 'Error creando producto', 'error');
        return;
    }

    mostrarMensaje('admin', 'Producto creado exitosamente', 'success');

    // Limpiar los inputs para que queden listos para otro producto
    document.getElementById('nuevoNombre').value = '';
    document.getElementById('nuevoPrecio').value = '';
    document.getElementById('nuevoStock').value = '';
    document.getElementById('nuevaImagen').value = '';

    cargarProductos();
}
// ==========================================
// ELIMINAR PRODUCTO
// ==========================================
async function eliminarProducto(id) {

    const confirmar =
        confirm(
            'Eliminar producto?'
        );

    if (!confirmar) return;

    const { error } =
        await db
            .from('productos')
            .delete()
            .eq('id', id);

    if (error) {

        console.error(error);

        mostrarMensaje(
            'admin',
            'Error eliminando',
            'error'
        );

        return;
    }

    mostrarMensaje(
        'admin',
        'Producto eliminado',
        'success'
    );

    cargarProductos();
}

// ==========================================
// CARRITO
// ==========================================
function agregar(id) {

    const prod =
        productos.find(
            p => p.id === id
        );

    if (!carrito[id]) {

        carrito[id] = 0;
    }

    if (
        carrito[id] >= prod.stock
    ) {

        mostrarMensaje(
            'carrito',
            'Sin stock',
            'error'
        );

        return;
    }

    carrito[id]++;

    mostrarProductos();
}

function quitar(id) {

    if (!carrito[id]) return;

    carrito[id]--;

    if (carrito[id] <= 0) {

        delete carrito[id];
    }

    mostrarProductos();
}

// ==========================================
// MOSTRAR CARRITO
// ==========================================
function mostrarCarrito() {

    let html = '';

    let total = 0;

    for (let id in carrito) {

        const prod =
            productos.find(
                p => p.id == id
            );

        const subtotal =
            carrito[id] *
            prod.precio;

        total += subtotal;

        html += `
            <div class="carrito-item">

                <span>
                    ${prod.nombre}
                    x${carrito[id]}
                </span>

                <span>
                    $${subtotal}
                </span>

            </div>
        `;
    }

    document.getElementById(
        'itemsCarrito'
    ).innerHTML =
        html ||
        '<p>Carrito vacío</p>';

    const totalEl =
        document.getElementById(
            'totalCarrito'
        );

    if (total > 0) {

        totalEl.innerHTML =
            `Total: $${total}`;

        totalEl.style.display =
            'block';

    } else {

        totalEl.style.display =
            'none';
    }
}

// ==========================================
// RESUMEN
// ==========================================
function mostrarResumen() {

    let html = '';

    let total = 0;

    for (let id in carrito) {

        const prod =
            productos.find(
                p => p.id == id
            );

        const subtotal =
            carrito[id] *
            prod.precio;

        total += subtotal;

        html += `
            <div class="carrito-item">

                <span>
                    ${prod.nombre}
                    x${carrito[id]}
                </span>

                <span>
                    $${subtotal}
                </span>

            </div>
        `;
    }

    document.getElementById(
        'resumenPedido'
    ).innerHTML =
        html;

    const totalPedido =
        document.getElementById(
            'totalPedido'
        );

    if (total > 0) {

        totalPedido.innerHTML =
            `Total: $${total}`;

        totalPedido.style.display =
            'block';

    } else {

        totalPedido.style.display =
            'none';
    }
}

// ==========================================
// CONFIRMAR PEDIDO
// ==========================================
async function confirmarPedido() {

    const domicilio =
        document.getElementById(
            'domicilio'
        ).value;

    const pago =
        document.getElementById(
            'pago'
        ).value;

    if (!domicilio || !pago) {

        mostrarMensaje(
            'pedido',
            'Completa domicilio y pago',
            'error'
        );

        return;
    }

    if (
        Object.keys(carrito).length === 0
    ) {

        mostrarMensaje(
            'pedido',
            'Carrito vacío',
            'error'
        );

        return;
    }

    let total = 0;

    for (let id in carrito) {

        const prod =
            productos.find(
                p => p.id == id
            );

        total +=
            carrito[id] *
            prod.precio;
    }

    const { error } =
        await db
            .from('pedidos')
            .insert([{
                cliente_id:
                    clienteLogueado.id,

                total:
                    total,

                metodo_pago:
                    pago,

                direccion_envio:
                    domicilio,

                estado:
                    'sin confirmar'
            }]);

    if (error) {

        console.error(error);

        mostrarMensaje(
            'pedido',
            'Error pedido',
            'error'
        );

        return;
    }

    // DESCONTAR STOCK
    for (let id in carrito) {

        const prod =
            productos.find(
                p => p.id == id
            );

        const nuevoStock =
            prod.stock -
            carrito[id];

        await db
            .from('productos')
            .update({
                stock:
                    nuevoStock
            })
            .eq(
                'id',
                Number(id)
            );
    }

    carrito = {};

    mostrarCarrito();

    mostrarResumen();

    await cargarProductos();

    mostrarMensaje(
        'pedido',
        'Pedido realizado',
        'success'
    );
}

// ==========================================
// PEDIDOS ADMIN
// ==========================================
async function cargarPedidosAdmin() {

    const contenedor =
        document.getElementById(
            'listaPedidos'
        );

    contenedor.innerHTML =
        '<p>Cargando pedidos...</p>';

    const { data, error } =
        await db
            .from('pedidos')
            .select('*')
            .order('id', {
                ascending: false
            });

    if (error) {

        contenedor.innerHTML =
            `
            <p style="color:red;">
                ${error.message}
            </p>
            `;

        return;
    }

    if (!data || data.length === 0) {

        contenedor.innerHTML =
            '<p>No hay pedidos</p>';

        return;
    }

    // ==========================================
    // SEPARAR PEDIDOS
    // ==========================================
    const pedidosSinConfirmar =
        data.filter(
            p =>
                !p.estado ||
                p.estado === 'sin confirmar'
        );

    const pedidosPendientes =
        data.filter(
            p =>
                p.estado === 'pendiente' ||
                p.estado === 'entregado'
        );

    let html = '';

    // ==========================================
    // PEDIDOS NUEVOS
    // ==========================================
    html += `
        <h2 style="
            margin-top:20px;
            margin-bottom:20px;
        ">
            🛒 Pedidos Nuevos
        </h2>
    `;

    if (pedidosSinConfirmar.length === 0) {

        html += `
            <p>
                No hay pedidos nuevos
            </p>
        `;

    } else {

        pedidosSinConfirmar.forEach(pedido => {

            html += `
                <div
                    style="
                        border:1px solid #ccc;
                        padding:15px;
                        margin-bottom:15px;
                        border-radius:10px;
                        background:white;
                    "
                >

                    <h3>
                        Pedido #${pedido.id}
                    </h3>

                    <p>
                        <strong>Cliente:</strong>
                        ${pedido.cliente_id}
                    </p>

                    <p>
                        <strong>Total:</strong>
                        $${pedido.total}
                    </p>

                    <p>
                        <strong>Pago:</strong>
                        ${pedido.metodo_pago}
                    </p>

                    <p>
                        <strong>Dirección:</strong>
                        ${pedido.direccion_envio}
                    </p>

                    <p>
                        <strong>Estado:</strong>
                        Sin confirmar
                    </p>

                    <div style="
                        margin-top:15px;
                        display:flex;
                        gap:10px;
                        flex-wrap:wrap;
                    ">

                        <button
                            onclick="
                                confirmarPedidoAdmin(${pedido.id})
                            "
                        >
                            ✅ Confirmar
                        </button>

                        <button
                            class="danger"
                            onclick="
                                cancelarPedido(${pedido.id})
                            "
                        >
                            ❌ Cancelar
                        </button>

                    </div>

                </div>
            `;
        });
    }

    // ==========================================
    // PENDIENTES DE ENTREGA
    // ==========================================
    html += `
        <h2 style="
            margin-top:40px;
            margin-bottom:20px;
        ">
            🚚 Pendientes de Entrega
        </h2>
    `;

    if (pedidosPendientes.length === 0) {

        html += `
            <p>
                No hay pedidos pendientes
            </p>
        `;

    } else {

        pedidosPendientes.forEach(pedido => {

            html += `
                <div
                    style="
                        border:1px solid #ccc;
                        padding:15px;
                        margin-bottom:15px;
                        border-radius:10px;
                        background:white;
                    "
                >

                    <h3>
                        Pedido #${pedido.id}
                    </h3>

                    <p>
                        <strong>Cliente:</strong>
                        ${pedido.cliente_id}
                    </p>

                    <p>
                        <strong>Total:</strong>
                        $${pedido.total}
                    </p>

                    <p>
                        <strong>Pago:</strong>
                        ${pedido.metodo_pago}
                    </p>

                    <p>
                        <strong>Dirección:</strong>
                        ${pedido.direccion_envio}
                    </p>

                    <p>
                        <strong>Estado actual:</strong>
                        ${pedido.estado}
                    </p>

                    <div style="
                        margin-top:15px;
                        display:flex;
                        gap:10px;
                        flex-wrap:wrap;
                    ">

                        <button
                            onclick="
                                cambiarEstadoPedido(
                                    ${pedido.id},
                                    'pendiente'
                                )
                            "
                        >
                            ⏳ Pendiente
                        </button>

                        <button
                            onclick="
                                cambiarEstadoPedido(
                                    ${pedido.id},
                                    'entregado'
                                )
                            "
                        >
                            ✅ Entregado
                        </button>

                    </div>

                </div>
            `;
        });
    }

    contenedor.innerHTML = html;
}
// ==========================================
// CONFIRMAR PEDIDO ADMIN
// ==========================================
async function confirmarPedidoAdmin(id) {

    const { error } =
        await db
            .from('pedidos')
            .update({
                estado: 'pendiente'
            })
            .eq('id', id);

    if (error) {

        console.error(error);

        alert(
            'Error al confirmar pedido'
        );

        return;
    }

    cargarPedidosAdmin();
}

// ==========================================
// CAMBIAR ESTADO
// ==========================================
async function cambiarEstadoPedido(
    id,
    estado
) {

    const { error } =
        await db
            .from('pedidos')
            .update({
                estado: estado
            })
            .eq('id', id);

    if (error) {

        console.error(error);

        alert(
            'Error cambiando estado'
        );

        return;
    }

    cargarPedidosAdmin();
}

// ==========================================
// CANCELAR PEDIDO
// ==========================================
// ==========================================
// CANCELAR PEDIDO (CON MOTIVO OBLIGATORIO)
// ==========================================
async function cancelarPedido(id) {

    // 1. Usamos prompt() para pedirle al usuario que escriba el motivo
    const motivo = prompt('¿Por qué motivo deseas cancelar este pedido? (Es obligatorio)');

    // 2. Validamos: Si presiona "Cancelar" en el cuadro o lo deja vacío, frenamos el proceso
    if (motivo === null || motivo.trim() === '') {
        alert('Cancelación abortada: Es obligatorio ingresar un motivo.');
        return; // Corta la ejecución, el pedido no se borra
    }

    // 3. Si escribió un motivo válido, procedemos a borrar el pedido de la base de datos
    const { error } =
        await db
            .from('pedidos')
            .delete()
            .eq('id', id);

    if (error) {
        console.error(error);
        alert('Error cancelando pedido');
        return;
    }

    // Dejamos un registro en la consola del navegador por las dudas
    console.log(`El pedido #${id} fue cancelado exitosamente. Motivo: "${motivo}"`);

    // Refrescamos la lista
    cargarPedidosAdmin();
}
async function cargarMisPedidos() {

    const contenedor =
        document.getElementById(
            'listaMisPedidos'
        );

    contenedor.innerHTML =
        '<p>Cargando pedidos...</p>';

    const { data, error } =
        await db
            .from('pedidos')
            .select('*')
            .eq(
                'cliente_id',
                clienteLogueado.id
            )
            .order('id', {
                ascending: false
            });

    if (error) {

        console.error(error);

        contenedor.innerHTML =
            '<p>Error cargando pedidos</p>';

        return;
    }

    if (!data || data.length === 0) {

        contenedor.innerHTML =
            '<p>No tienes pedidos</p>';

        return;
    }

    let html = '';

    data.forEach(pedido => {

        let colorEstado = '#999';

        if (
            pedido.estado === 'sin confirmar'
        ) {

            colorEstado = 'orange';

        } else if (
            pedido.estado === 'pendiente'
        ) {

            colorEstado = '#007bff';

        } else if (
            pedido.estado === 'entregado'
        ) {

            colorEstado = 'green';
        }

        html += `
            <div
                style="
                    background:white;
                    border:1px solid #ddd;
                    border-radius:10px;
                    padding:15px;
                    margin-bottom:15px;
                "
            >

                <h3>
                    Pedido #${pedido.id}
                </h3>

                <p>
                    <strong>Total:</strong>
                    $${pedido.total}
                </p>

                <p>
                    <strong>Pago:</strong>
                    ${pedido.metodo_pago}
                </p>

                <p>
                    <strong>Dirección:</strong>
                    ${pedido.direccion_envio}
                </p>

                <p>
                    <strong>Estado:</strong>

                    <span style="
                        color:${colorEstado};
                        font-weight:bold;
                    ">
                        ${pedido.estado}
                    </span>
                </p>

            </div>
        `;
    });

    contenedor.innerHTML = html;
}
// ==========================================
// NAVEGACIÓN
// ==========================================
function mostrarSeccion(seccion) {

    // BLOQUEAR ADMIN
    if (
        (
            seccion === 'admin' ||
            seccion === 'pedidosAdmin'
        ) &&
        rolActual !== 'admin'
    ) {

        alert('Acceso denegado');

        return;
    }
    if (
        seccion === 'misPedidos'
    ) {

        cargarMisPedidos();
    }

    // OCULTAR TODAS
    document
        .querySelectorAll('.section')
        .forEach(sec => {

            sec.classList.remove(
                'active'
            );
        });

    // SACAR ACTIVE BOTONES
    document
        .querySelectorAll('.nav button')
        .forEach(btn => {

            btn.classList.remove(
                'active'
            );
        });

    // MOSTRAR SECCIÓN
    const seccionHTML =
        document.getElementById(
            seccion
        );

    if (seccionHTML) {

        seccionHTML.classList.add(
            'active'
        );
    }

    // ACTIVAR BOTÓN
    document
        .querySelectorAll('.nav button')
        .forEach(btn => {

            const onclick =
                btn.getAttribute(
                    'onclick'
                );

            if (
                onclick &&
                onclick.includes(
                    seccion
                )
            ) {

                btn.classList.add(
                    'active'
                );
            }
        });

    // CARRITO
    if (seccion === 'carrito') {

        mostrarProductos();
    }

    // PEDIDO
    if (seccion === 'pedido') {

        mostrarResumen();
    }

    // ADMIN PEDIDOS
    if (
        seccion === 'pedidosAdmin'
    ) {

        cargarPedidosAdmin();
    }
}
// ==========================================
// FORMULARIOS
// ==========================================
function alternarFormulario(destino) {

    document.getElementById(
        'vistaAuth'
    ).style.display =
        destino === 'registro'
            ? 'none'
            : 'block';

    document.getElementById(
        'vistaRegistro'
    ).style.display =
        destino === 'registro'
            ? 'block'
            : 'none';
}

// ==========================================
// MENSAJES
// ==========================================
function mostrarMensaje(
    seccion,
    texto,
    tipo
) {

    const msg =
        document.getElementById(
            'mensaje' +
            seccion
                .charAt(0)
                .toUpperCase() +
            seccion.slice(1)
        );

    if (!msg) return;

    msg.textContent =
        texto;

    msg.className =
        'message ' + tipo;

    msg.style.display =
        'block';

    setTimeout(() => {

        msg.style.display =
            'none';

    }, 4000);
}
// ==========================================
// MOSTRAR DATOS BANCARIOS AL ELEGIR TRANSFERENCIA
// ==========================================
function mostrarDatosTransferencia() {
    const metodoPago = document.getElementById('pago').value;
    const recuadroBanco = document.getElementById('datosBanco');
    
    if (recuadroBanco) {
        if (metodoPago === 'transferencia') {
            recuadroBanco.style.display = 'block';
        } else {
            recuadroBanco.style.display = 'none';
        }
    }
}