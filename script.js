// CÓDIGO COMPLETO Y VERIFICADO - VERSIÓN 3.2 (CON HISTORIAL)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzt1ZAqoQtjbwtf813UUb8YGRoT5ycbs6SCNKGe0IbYYfHDiD5dzBA9I9YXsSlPyTEh/exec'; // <-- ¡NO OLVIDES REEMPLAZAR ESTO!

document.addEventListener('DOMContentLoaded', () => {
    // --- MANEJO DE SESIÓN ROBUSTO ---
    try {
        const userJSON = sessionStorage.getItem('user');
        if (userJSON) {
            const user = JSON.parse(userJSON);
            if (user && user.role) {
                mostrarPanel(user.role, user);
            } else { throw new Error("Sesión corrupta."); }
        } else {
            mostrarPanel('Login');
        }
    } catch (error) {
        console.error("Error al cargar sesión:", error);
        sessionStorage.removeItem('user');
        mostrarPanel('Login');
    }

    // --- EVENT LISTENERS ---
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.querySelectorAll('.logout-btn').forEach(btn => btn.addEventListener('click', handleLogout));
    document.getElementById('crear-partido-form')?.addEventListener('submit', handleCrearPartido);
    document.getElementById('cerrar-partido-form')?.addEventListener('submit', handleCerrarPartido);
    document.getElementById('crear-jugador-form')?.addEventListener('submit', handleCrearJugador);
    document.getElementById('cargar-fichas-form')?.addEventListener('submit', handleCargarFichas);
    document.getElementById('ver-historial-btn')?.addEventListener('click', handleMostrarHistorial);
    document.getElementById('cerrar-historial-btn')?.addEventListener('click', handleCerrarHistorial);
});

async function postData(data) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST', cache: 'no-cache', redirect: 'follow', body: JSON.stringify(data)
        });
        const textResponse = await response.text();
        if (!textResponse) throw new Error('Respuesta del servidor vacía.');
        return JSON.parse(textResponse);
    } catch (error) {
        console.error('Error en fetch:', error);
        return { status: 'error', message: 'Error de conexión.' };
    }
}

// --- MANEJADORES DE EVENTOS ---
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    mostrarMensaje('login', 'Verificando...', 'loading');
    const result = await postData({ action: 'login', username, password });
    if (result.status === 'success') {
        sessionStorage.setItem('user', JSON.stringify(result.data));
        window.location.reload();
    } else {
        mostrarMensaje('login', result.message, 'error');
    }
}

function handleLogout() { sessionStorage.removeItem('user'); window.location.reload(); }

async function handleCrearPartido(e) { e.preventDefault();
    const form = e.target;
    const result = await postData({
        action: 'crearPartido', local: form.querySelector('#equipo-local').value,
        visitante: form.querySelector('#equipo-visitante').value, cuotaL: form.querySelector('#cuota-local').value,
        cuotaE: form.querySelector('#cuota-empate').value, cuotaV: form.querySelector('#cuota-visitante').value,
    });
    mostrarMensaje('jefe-crear', result.data?.message || result.message, result.status);
    if(result.status === 'success') { cargarDatosJefe(); form.reset(); }
}

async function handleCerrarPartido(e) { e.preventDefault();
    const form = e.target;
    const result = await postData({
        action: 'cerrarPartido', partidoId: form.querySelector('#select-partido-cerrar').value,
        resultado: form.querySelector('#select-resultado').value,
    });
    mostrarMensaje('jefe-cerrar', result.data?.message || result.message, result.status);
    if(result.status === 'success') { cargarDatosJefe(); form.reset(); }
}

async function handleCrearJugador(e) { e.preventDefault();
    const form = e.target; const user = JSON.parse(sessionStorage.getItem('user'));
    const result = await postData({
        action: 'crearJugador', nuevoUsuario: form.querySelector('#nuevo-usuario').value,
        nuevaContra: form.querySelector('#nueva-contra').value, saldoInicial: form.querySelector('#saldo-inicial').value,
        creador: user.username,
    });
    mostrarMensaje('cajero-crear', result.data?.message || result.message, result.status);
    if(result.status === 'success') { cargarDatosCajero(user); form.reset(); }
}

async function handleCargarFichas(e) { e.preventDefault();
    const form = e.target; const user = JSON.parse(sessionStorage.getItem('user'));
    const result = await postData({
        action: 'cargarFichas', jugador: form.querySelector('#select-mis-jugadores').value,
        monto: form.querySelector('#monto-carga').value, cajero: user.username,
    });
    mostrarMensaje('cajero-cargar', result.data?.message || result.message, result.status);
    if(result.status === 'success') form.reset();
}

async function handleRealizarApuesta(partidoId, apuestaA, monto) {
    if (!monto || monto <= 0) { mostrarMensaje('jugador', 'Ingresa un monto válido.', 'error'); return; }
    const user = JSON.parse(sessionStorage.getItem('user'));
    const result = await postData({
        action: 'realizarApuesta', username: user.username, partidoId, apuestaA, monto
    });
    if (result.status === 'success') {
        document.getElementById('jugador-saldo').textContent = parseFloat(result.data.nuevoSaldo).toFixed(2);
        user.balance = result.data.nuevoSaldo; sessionStorage.setItem('user', JSON.stringify(user));
        mostrarMensaje('jugador', result.data.message, 'success');
    } else { mostrarMensaje('jugador', result.message, 'error'); }
}

// --- FUNCIONES DE UI Y RENDERIZADO ---
function mostrarPanel(role, user = null) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const panelId = `${role ? role.toLowerCase() : 'login'}-panel`;
    const panelToShow = document.getElementById(panelId);
    if (panelToShow) { panelToShow.classList.add('active'); } 
    else { document.getElementById('login-panel').classList.add('active'); }

    if (role === 'Jefe') cargarDatosJefe();
    if (role === 'Cajero') cargarDatosCajero(user);
    if (role === 'Jugador') cargarDatosJugador(user);
}

async function cargarDatosJefe() {
    const result = await postData({ action: 'getDashboardData', role: 'Jefe' });
    if (result.status === 'success' && result.data.partidosAbiertos) {
        const select = document.getElementById('select-partido-cerrar');
        select.innerHTML = '<option value="" disabled selected>Seleccionar partido...</option>';
        result.data.partidosAbiertos.forEach(p => {
            select.innerHTML += `<option value="${p.id}">${p.local} vs ${p.visitante}</option>`;
        });
    }
}
async function cargarDatosCajero(user) {
    const result = await postData({ action: 'getDashboardData', role: 'Cajero', username: user.username });
    if (result.status === 'success' && result.data.misJugadores) {
        const select = document.getElementById('select-mis-jugadores');
        select.innerHTML = '<option value="" disabled selected>Seleccionar jugador...</option>';
        result.data.misJugadores.forEach(jugador => {
            select.innerHTML += `<option value="${jugador}">${jugador}</option>`;
        });
    }
}
async function cargarDatosJugador(user) {
    document.getElementById('jugador-nombre').textContent = user.username;
    document.getElementById('jugador-saldo').textContent = parseFloat(user.balance).toFixed(2);
    const result = await postData({ action: 'getDashboardData', role: 'Jugador', username: user.username });
    if (result.status === 'success' && result.data.partidos) {
        document.getElementById('jugador-saldo').textContent = parseFloat(result.data.balance).toFixed(2);
        const carousel = document.getElementById('partidos-carousel');
        carousel.innerHTML = result.data.partidos.length ? '' : '<p class="mensaje">No hay partidos disponibles.</p>';
        result.data.partidos.forEach(p => {
            const card = document.createElement('div');
            card.className = 'match-card';
            card.innerHTML = `<div class="match-info"><div class="match-teams">${p.local} vs ${p.visitante}</div></div><div class="bet-options"><button class="bet-btn" data-apuesta="Local"><span class="bet-type">1</span><div class="bet-cuota">${p.cuotaL}</div></button><button class="bet-btn" data-apuesta="Empate"><span class="bet-type">X</span><div class="bet-cuota">${p.cuotaE}</div></button><button class="bet-btn" data-apuesta="Visitante"><span class="bet-type">2</span><div class="bet-cuota">${p.cuotaV}</div></button></div><input type="number" class="apuesta-monto-input" placeholder="Monto">`;
            carousel.appendChild(card);
            card.querySelectorAll('.bet-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const monto = card.querySelector('.apuesta-monto-input').value;
                    handleRealizarApuesta(p.id, btn.dataset.apuesta, monto);
                });
            });
        });
    }
}

function mostrarMensaje(panel, texto, tipo) {
    const el = document.getElementById(`${panel}-mensaje`);
    if(el) {
        el.textContent = texto || 'Ocurrió un error.';
        el.className = `mensaje ${tipo}`;
        el.style.display = 'block';
        if (tipo !== 'loading') { setTimeout(() => {el.style.display = 'none';}, 5000); }
    }
}

async function handleMostrarHistorial() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const historialSection = document.getElementById('historial-section');
    const lista = document.getElementById('historial-lista');
    lista.innerHTML = '<p>Cargando historial...</p>';
    historialSection.classList.add('visible');
    const result = await postData({ action: 'getHistorial', username: user.username });
    if (result.status === 'success' && result.data) {
        lista.innerHTML = '';
        if (result.data.length === 0) { lista.innerHTML = '<p>No has realizado ninguna apuesta todavía.</p>'; return; }
        result.data.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'historial-item';
            const cuotaL_class = item.apuestaHecha === 'Local' ? item.status.toLowerCase() : '';
            const cuotaE_class = item.apuestaHecha === 'Empate' ? item.status.toLowerCase() : '';
            const cuotaV_class = item.apuestaHecha === 'Visitante' ? item.status.toLowerCase() : '';
            const gananciaTexto = item.status === 'Ganada' ? `+${item.ganancia.toFixed(2)}` : `${item.ganancia.toFixed(2)}`;
            itemDiv.innerHTML = `<div class="historial-info"><h4>${item.partido}</h4><p>Apostaste: ${item.monto} monedas</p><div class="historial-cuotas"><span class="cuota ${cuotaL_class}">1: ${item.cuotas.L}</span><span class="cuota ${cuotaE_class}">X: ${item.cuotas.E}</span><span class="cuota ${cuotaV_class}">2: ${item.cuotas.V}</span></div></div><div class="historial-resultado"><span class="status-indicator ${item.status.toLowerCase()}"></span><span>${item.status}</span>${item.status !== 'Pendiente' ? `<div class="ganancia-valor ${item.status.toLowerCase()}">${gananciaTexto}</div>` : ''}</div>`;
            lista.appendChild(itemDiv);
        });
    } else { lista.innerHTML = `<p class="mensaje error">Error al cargar el historial.</p>`; }
}

function handleCerrarHistorial() {
    document.getElementById('historial-section').classList.remove('visible');
}