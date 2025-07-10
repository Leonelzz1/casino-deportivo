// VERSIÓN 3.0 - CASINO PROFESIONAL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzt1ZAqoQtjbwtf813UUb8YGRoT5ycbs6SCNKGe0IbYYfHDiD5dzBA9I9YXsSlPyTEh/exec'; // <-- ¡NO OLVIDES REEMPLAZAR ESTO!

document.addEventListener('DOMContentLoaded', () => {
    // --- MANEJO DE SESIÓN ---
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user) {
        mostrarPanel(user.role, user);
    } else {
        mostrarPanel('Login');
    }

    // --- EVENT LISTENERS ---
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    // Logout buttons
    document.querySelectorAll('.logout-btn').forEach(btn => btn.addEventListener('click', handleLogout));
    // Formularios del Jefe
    document.getElementById('crear-partido-form').addEventListener('submit', handleCrearPartido);
    document.getElementById('cerrar-partido-form').addEventListener('submit', handleCerrarPartido);
    // Formularios del Cajero
    document.getElementById('crear-jugador-form').addEventListener('submit', handleCrearJugador);
    document.getElementById('cargar-fichas-form').addEventListener('submit', handleCargarFichas);
});

async function postData(data) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST', mode: 'no-cors', cache: 'no-cache',
            redirect: 'follow', body: JSON.stringify(data)
        });
        const textResponse = await response.text();
        if (!textResponse) throw new Error('Respuesta del servidor vacía.');
        return JSON.parse(textResponse);
    } catch (error) {
        console.error('Error en fetch:', error);
        return { status: 'error', message: 'Error de conexión. Revisa la consola (F12).' };
    }
}

// --- MANEJADORES DE EVENTOS ---
async function handleLogin(e) { e.preventDefault(); /* ... (código sin cambios) ... */ }
function handleLogout() { sessionStorage.removeItem('user'); window.location.reload(); }
// (Se han acortado manejadores sin cambios para brevedad)
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    mostrarMensaje('login', 'Verificando...', 'loading');
    const result = await postData({ action: 'login', username, password });
    if (result.status === 'success') {
        sessionStorage.setItem('user', JSON.stringify(result.data));
        mostrarPanel(result.data.role, result.data);
    } else {
        mostrarMensaje('login', result.message, 'error');
    }
}

async function handleCrearPartido(e) {
    e.preventDefault();
    const form = e.target;
    const result = await postData({
        action: 'crearPartido',
        local: form.querySelector('#equipo-local').value,
        visitante: form.querySelector('#equipo-visitante').value,
        cuotaL: form.querySelector('#cuota-local').value,
        cuotaE: form.querySelector('#cuota-empate').value,
        cuotaV: form.querySelector('#cuota-visitante').value,
    });
    mostrarMensaje('jefe-crear', result.message || result.data.message, result.status);
    if(result.status === 'success') form.reset();
}

async function handleCerrarPartido(e) {
    e.preventDefault();
    const form = e.target;
    const result = await postData({
        action: 'cerrarPartido',
        partidoId: form.querySelector('#select-partido-cerrar').value,
        resultado: form.querySelector('#select-resultado').value,
    });
    mostrarMensaje('jefe-cerrar', result.message || result.data.message, result.status);
    if(result.status === 'success') {
        cargarDatosJefe();
        form.reset();
    }
}

async function handleCrearJugador(e) {
    e.preventDefault();
    const form = e.target;
    const user = JSON.parse(sessionStorage.getItem('user'));
    const result = await postData({
        action: 'crearJugador',
        nuevoUsuario: form.querySelector('#nuevo-usuario').value,
        nuevaContra: form.querySelector('#nueva-contra').value,
        saldoInicial: form.querySelector('#saldo-inicial').value,
        creador: user.username,
    });
    mostrarMensaje('cajero-crear', result.message || result.data.message, result.status);
    if(result.status === 'success') {
        cargarDatosCajero(user);
        form.reset();
    }
}

async function handleCargarFichas(e) {
    e.preventDefault();
    const form = e.target;
    const user = JSON.parse(sessionStorage.getItem('user'));
    const result = await postData({
        action: 'cargarFichas',
        jugador: form.querySelector('#select-mis-jugadores').value,
        monto: form.querySelector('#monto-carga').value,
        cajero: user.username,
    });
    mostrarMensaje('cajero-cargar', result.message || result.data.message, result.status);
    if(result.status === 'success') form.reset();
}

async function handleRealizarApuesta(partidoId, apuestaA, monto) {
    if (!monto || monto <= 0) {
        mostrarMensaje('jugador', 'Ingresa un monto válido para apostar.', 'error');
        return;
    }
    const user = JSON.parse(sessionStorage.getItem('user'));
    const result = await postData({
        action: 'realizarApuesta',
        username: user.username,
        partidoId,
        apuestaA,
        monto
    });

    if (result.status === 'success') {
        document.getElementById('jugador-saldo').textContent = result.data.nuevoSaldo;
        user.balance = result.data.nuevoSaldo;
        sessionStorage.setItem('user', JSON.stringify(user));
        mostrarMensaje('jugador', result.data.message, 'success');
    } else {
        mostrarMensaje('jugador', result.message, 'error');
    }
}

// --- FUNCIONES DE RENDERIZADO ---
function mostrarPanel(role, user = null) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const panelId = `${role.toLowerCase()}-panel`;
    document.getElementById(panelId)?.classList.add('active');

    if (role === 'Jefe') cargarDatosJefe();
    if (role === 'Cajero') cargarDatosCajero(user);
    if (role === 'Jugador') cargarDatosJugador(user);
}

async function cargarDatosJefe() {
    const result = await postData({ action: 'getDashboardData', role: 'Jefe' });
    if (result.status === 'success') {
        const select = document.getElementById('select-partido-cerrar');
        select.innerHTML = '<option value="" disabled selected>Seleccionar partido...</option>';
        result.data.partidosAbiertos.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `${p.local} vs ${p.visitante}`;
            select.appendChild(option);
        });
    }
}

async function cargarDatosCajero(user) {
    const result = await postData({ action: 'getDashboardData', role: 'Cajero', username: user.username });
    if (result.status === 'success') {
        const select = document.getElementById('select-mis-jugadores');
        select.innerHTML = '<option value="" disabled selected>Seleccionar jugador...</option>';
        result.data.misJugadores.forEach(jugador => {
            const option = document.createElement('option');
            option.value = jugador;
            option.textContent = jugador;
            select.appendChild(option);
        });
    }
}

async function cargarDatosJugador(user) {
    document.getElementById('jugador-nombre').textContent = user.username;
    document.getElementById('jugador-saldo').textContent = parseFloat(user.balance).toFixed(2);
    
    const result = await postData({ action: 'getDashboardData', role: 'Jugador', username: user.username });
    if (result.status === 'success') {
        document.getElementById('jugador-saldo').textContent = parseFloat(result.data.balance).toFixed(2);
        const carousel = document.getElementById('partidos-carousel');
        carousel.innerHTML = result.data.partidos.length ? '' : '<p>No hay partidos disponibles.</p>';

        result.data.partidos.forEach(p => {
            const card = document.createElement('div');
            card.className = 'match-card';
            card.innerHTML = `
                <div class="match-info">
                    <div class="match-teams">${p.local} vs ${p.visitante}</div>
                </div>
                <div class="bet-options">
                    <button class="bet-btn" data-apuesta="Local"><span class="bet-type">1</span><div class="bet-cuota">${p.cuotaL}</div></button>
                    <button class="bet-btn" data-apuesta="Empate"><span class="bet-type">X</span><div class="bet-cuota">${p.cuotaE}</div></button>
                    <button class="bet-btn" data-apuesta="Visitante"><span class="bet-type">2</span><div class="bet-cuota">${p.cuotaV}</div></button>
                </div>
                <input type="number" class="apuesta-monto-input" placeholder="Monto a apostar">
            `;
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
        setTimeout(() => el.style.display = 'none', 5000);
    }
}