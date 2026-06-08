// ============================================================
//  CORE + AUTENTICACIÓN Y ROLES   
//  Config Supabase, estado global, helpers, login, registro,
//  roles, navegación y mensajes.
// ============================================================

// ---------- CONFIGURACIÓN SUPABASE ----------
const supabaseUrl = 'https://vhstnvksqkwtkhlmvjpx.supabase.co';
const supabaseKey = 'sb_publishable_PbRyBysvqfnzEGddsJ4l_w_1siFwxt5';
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

// ---------- ESTADO GLOBAL ----------
let rolActual = 'cliente';     // 'cliente' | 'vendedor' | 'admin'
let productos = [];
let carrito = {};              // { productoId: cantidad }
let clienteLogueado = null;
let cuponAplicado = null;      // { codigo, descuento }

// ---------- HELPERS ----------
const $ = (id) => document.getElementById(id);

function escapeHtml(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function dinero(n) {
    return '$' + Number(n || 0).toLocaleString('es-AR');
}

function direccionCompleta(c) {
    return `${c.calle} ${c.numero}, ${c.localidad}, ${c.provincia}, ${c.pais}`;
}

// ---------- INICIO ----------
document.addEventListener('DOMContentLoaded', inicializarApp);

async function inicializarApp() {
    await cargarProductos();
    actualizarVistaCuenta();
    $('formCliente').addEventListener('submit', registrarCliente);
}

// ============================================================
//  AUTENTICACIÓN / REGISTRO
// ============================================================
async function intentarIngresar() {
    const email = $('emailSimple').value.trim();
    const password = $('passwordLogin').value;
    if (!email) return mostrarMensaje('acceso', 'Ingresá un email', 'error');

    const { data, error } = await db.from('clientes').select('*').eq('email', email);
    if (error) { console.error(error); return mostrarMensaje('acceso', 'Error de conexión', 'error'); }
    if (!data || data.length === 0) return mostrarMensaje('acceso', 'Email no registrado', 'error');

    const usuario = data[0];
    const rol = usuario.rol || 'cliente';

    // El admin y el vendedor requieren contraseña (el cliente no).
    const passwordsRol = { admin: 'admin', vendedor: 'vendedor' };
    if (passwordsRol[rol] && password !== passwordsRol[rol]) {
        return mostrarMensaje('acceso', 'Contraseña incorrecta', 'error');
    }

    clienteLogueado = usuario;
    rolActual = rol;

    $('passwordLogin').value = '';
    actualizarVistaCuenta();
    mostrarMensaje('acceso', 'Bienvenido', 'success');

    const inicio = { cliente: 'carrito', vendedor: 'pedidosAdmin', admin: 'admin' }[rolActual] || 'clientes';
    await cargarProductos();
    mostrarSeccion(inicio);
}

async function registrarCliente(e) {
    e.preventDefault();

    const email = $('email').value.trim();
    const valorNombre = $('nombre').value.trim();

    const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regexSoloLetras.test(valorNombre)) {
        return mostrarMensaje('cliente', 'El nombre solo puede contener letras y espacios', 'error');
    }

    const { data: existe, error: errExiste } = await db
        .from('clientes').select('email').eq('email', email);
    if (errExiste) { console.error(errExiste); return mostrarMensaje('cliente', 'Error de conexión', 'error'); }
    if (existe && existe.length > 0) return mostrarMensaje('cliente', 'Email ya registrado', 'error');

    const nuevoCliente = {
        nombre: valorNombre,
        email,
        pais: $('pais').value.trim(),
        provincia: $('provincia').value.trim(),
        localidad: $('localidad').value.trim(),
        calle: $('calle').value.trim(),
        numero: parseInt($('numero').value, 10),
        rol: 'cliente'
    };

    const { data, error } = await db.from('clientes').insert([nuevoCliente]).select();
    if (error) { console.error(error); return mostrarMensaje('cliente', error.message, 'error'); }

    clienteLogueado = data[0];
    rolActual = 'cliente';
    e.target.reset();
    actualizarVistaCuenta();
    mostrarMensaje('cliente', 'Registro exitoso', 'success');
    mostrarSeccion('carrito');
}

function cerrarSesion() {
    clienteLogueado = null;
    carrito = {};
    cuponAplicado = null;
    rolActual = 'cliente';
    actualizarVistaCuenta();
    mostrarSeccion('clientes');
}

// ============================================================
//  VISTA / ROLES
// ============================================================
function actualizarVistaCuenta() {
    const logueado = !!clienteLogueado;

    $('navPrincipal').style.display = logueado ? 'block' : 'none';
    $('panelUsuario').style.display = logueado ? 'block' : 'none';
    $('vistaAuth').style.display = logueado ? 'none' : 'block';
    $('vistaRegistro').style.display = 'none';

    if (logueado) {
        $('nombreUsuarioLogueado').textContent = clienteLogueado.nombre;
        $('rolActual').textContent = rolActual;
    }

    aplicarRolUI();
}

function aplicarRolUI() {
    const mapa = { 'cliente-only': 'cliente', 'vendedor-only': 'vendedor', 'admin-only': 'admin' };
    for (const clase in mapa) {
        document.querySelectorAll('.' + clase).forEach(el => {
            el.style.display = (rolActual === mapa[clase]) ? 'inline-block' : 'none';
        });
    }
}

// ============================================================
//  NAVEGACIÓN / MENSAJES
// ============================================================
function mostrarSeccion(seccion) {
    const permisos = {
        carrito: 'cliente', pedido: 'cliente', misPedidos: 'cliente',
        admin: 'admin', pedidosAdmin: 'vendedor'
    };
    if (permisos[seccion] && permisos[seccion] !== rolActual) {
        alert('Acceso denegado');
        return;
    }

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));

    const el = $(seccion);
    if (el) el.classList.add('active');

    document.querySelectorAll('.nav button').forEach(btn => {
        const oc = btn.getAttribute('onclick');
        if (oc && oc.includes(`'${seccion}'`)) btn.classList.add('active');
    });

    if (seccion === 'carrito') mostrarProductos();
    if (seccion === 'pedido') { mostrarResumen(); mostrarInfoDomicilio(); }
    if (seccion === 'misPedidos') cargarMisPedidos();
    if (seccion === 'admin') renderInventarioAdmin();
    if (seccion === 'pedidosAdmin') cargarPedidosAdmin();
}

function alternarFormulario(destino) {
    $('vistaAuth').style.display = destino === 'registro' ? 'none' : 'block';
    $('vistaRegistro').style.display = destino === 'registro' ? 'block' : 'none';
}

function mostrarMensaje(seccion, texto, tipo) {
    const msg = $('mensaje' + seccion.charAt(0).toUpperCase() + seccion.slice(1));
    if (!msg) return;
    msg.textContent = texto;
    msg.className = 'message ' + tipo;
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 4000);
}
