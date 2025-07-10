// CÓDIGO COMPLETO Y VERIFICADO - VERSIÓN 5.2 (CON PROTECCIÓN ANTI-NULL)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTvM78u1Vwgt2s6T507tWQnvqyLp4xz2r7V1ZZ9hjCgpy9BKLdc9i5Q3DxZALgrBi_/exec';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Limpiamos cualquier sesión potencialmente corrupta al inicio.
    const userJSON = sessionStorage.getItem('user');
    if (userJSON === 'undefined' || userJSON === 'null' || !userJSON) {
        sessionStorage.removeItem('user');
    }

    // 2. Intentamos parsear SÓLO si estamos seguros de que no está corrupto.
    try {
        const userData = JSON.parse(sessionStorage.getItem('user'));
        if (userData && userData.role) {
            initPanel(userData);
        } else {
            showPanel('login-panel');
        }
    } catch (error) {
        console.error("Error al iniciar sesión desde sessionStorage:", error);
        sessionStorage.removeItem('user');
        showPanel('login-panel');
    }
    
    // 3. Añadimos el listener para el formulario de login.
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});


// --- FUNCIÓN PRINCIPAL DE COMUNICACIÓN CON EL BACKEND ---
async function postData(data) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            cache: 'no-cache',
            redirect: 'follow',
            body: JSON.stringify(data)
        });
        const textResponse = await response.text();
        if (!textResponse) throw new Error('Respuesta del servidor vacía.');
        return JSON.parse(textResponse);
    } catch (error) {
        console.error('Error en fetch:', error);
        return { status: 'error', message: `Error de conexión: ${error.message}. Revisa la URL y la implementación del script.` };
    }
}

// --- SETUP INICIAL DE PANELES Y NAVEGACIÓN ---
function initPanel(user) {
    if (user.role === 'Jefe') setupJefePanel();
    else if (user.role === 'Cajero') setupCajeroPanel(user);
    else if (user.role === 'Jugador') setupJugadorPanel(user);
    
    showPanel(`${user.role.toLowerCase()}-panel`);
}

function showPanel(panelId) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.add('active');
    } else {
        document.getElementById('login-panel').classList.add('active');
    }
}

function setupNav(panelId, mainContentId) {
    const navButtons = document.querySelectorAll(`#${panelId} .nav-btn`);
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewId = btn.dataset.view;
            showView(mainContentId, viewId);
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function showView(mainContentId, viewId) {
    const mainContent = document.getElementById(mainContentId);
    if (!mainContent) return;
    
    mainContent.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    const viewToShow = mainContent.querySelector(`#${viewId}`);
    
    if (viewToShow) {
        viewToShow.classList.add('active');
        const user = JSON.parse(sessionStorage.getItem('user'));
        switch (viewId) {
            case 'vista-partidos': renderVistaPartidos(); break;
            case 'vista-cajeros': renderVistaCajeros(); break;
            case 'vista-historial': document.querySelector('#vista-historial .filtro-btn.active').click(); break;
            case 'vista-jugadores': renderVistaJugadores(user); break;
            case 'vista-peticiones': renderVistaMisPeticiones(user); break;
        }
    }
}

// --- MANEJO DE LOGIN / LOGOUT ---
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    mostrarMensaje('login', 'Verificando...', 'loading');
    
    const result = await postData({ action: 'login', username, password });
    
    const loginMsgEl = document.getElementById('login-mensaje');
    if (result.status === 'success' && result.data) {
        loginMsgEl.style.display = 'none';
        sessionStorage.setItem('user', JSON.stringify(result.data));
        window.location.reload();
    } else {
        mostrarMensaje('login', result.message || 'Error desconocido al iniciar sesión.', 'error');
    }
}

function handleLogout() {
    sessionStorage.removeItem('user');
    window.location.reload();
}

// --- MODALES (Genéricos) ---
function showModal(title, contentHTML, onOpen = null) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-modal-btn">×</button>
            </div>
            <div class="modal-body">${contentHTML}</div>
        </div>
    `;
    modalContainer.classList.add('visible');
    modalContainer.querySelector('.close-modal-btn').addEventListener('click', closeModal);
    if (onOpen) onOpen(modalContainer);
}

function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.classList.remove('visible');
    modalContainer.innerHTML = '';
}

function mostrarMensaje(context, texto, tipo) {
    const el = document.getElementById(`${context}-mensaje`);
    if(el) {
        el.textContent = texto || 'Ocurrió un error.';
        el.className = 'mensaje'; 
        el.style.display = 'block';

        if (tipo === 'success') el.classList.add('success');
        else if (tipo === 'error') el.classList.add('error');
        
        if (tipo !== 'loading' && tipo !== 'error') {
            setTimeout(() => { el.style.display = 'none'; }, 4000);
        }
    }
}

// ==================================================
//               LÓGICA DEL PANEL DEL JEFE
// ==================================================
function setupJefePanel() {
    setupNav('jefe-panel', 'jefe-main-content');
    
    // Listeners con protección
    const logoutBtn = document.querySelector('#jefe-panel .logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const peticionesBtn = document.getElementById('peticiones-btn');
    if (peticionesBtn) peticionesBtn.addEventListener('click', showPeticionesModal);

    const crearCajeroBtn = document.getElementById('crear-cajero-btn');
    if (crearCajeroBtn) crearCajeroBtn.addEventListener('click', () => showCajeroModal(null));

    document.querySelectorAll('#vista-historial .filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#vista-historial .filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderVistaHistorialGeneral(btn.dataset.filtro);
        });
    });
    
    showView('jefe-main-content', 'vista-partidos');
    checkPeticionesNotif();
    setInterval(checkPeticionesNotif, 30000);
}

async function renderVistaPartidos() {
    const container = document.getElementById('partidos-table-container');
    if (!container) return;
    container.innerHTML = '<p>Cargando partidos...</p>';
    const result = await postData({ action: 'getPartidosJefe' });
    if (result.status === 'success' && result.data.length > 0) {
        container.innerHTML = `<table class="data-table"><thead><tr><th>ID</th><th>Local</th><th>Visitante</th><th>Estado</th></tr></thead><tbody>${result.data.map(p => `<tr data-partido-id="${p.id}" title="Clic para ver detalles"><td>${p.id}</td><td>${p.local}</td><td>${p.visitante}</td><td>${p.estado}</td></tr>`).join('')}</tbody></table>`;
        container.querySelectorAll('tr[data-partido-id]').forEach(row => {
            row.addEventListener('click', () => showPartidoModal(row.dataset.partidoId));
        });
    } else { container.innerHTML = '<p>No hay partidos creados.</p>'; }
}

async function showPartidoModal(partidoId) {
    const result = await postData({ action: 'getDetallesPartido', partidoId });
    if (result.status !== 'success') { alert(result.message); return; }
    const partido = result.data;
    const renderApostadores = (lista, titulo) => `<h4>${titulo} (${lista.length})</h4>${lista.length > 0 ? lista.map(a => `<p><span>${a.usuario}</span><span>${a.monto.toFixed(2)}</span></p>`).join('') : '<p>Nadie</p>'}`;
    const contentHTML = `<div class="apostadores-list">${renderApostadores(partido.apuestasLocal, 'Apostaron por Local')}</div><div class="apostadores-list">${renderApostadores(partido.apuestasEmpate, 'Apostaron por Empate')}</div><div class="apostadores-list">${renderApostadores(partido.apuestasVisitante, 'Apostaron por Visitante')}</div>${partido.estado === 'Abierto' ? `<div class="modal-actions" style="margin-top: 20px;"><h4>Cerrar Partido</h4><select id="resultado-final"><option value="Local">${partido.local} (Gana Local)</option><option value="Empate">Empate</option><option value="Visitante">${partido.visitante} (Gana Visitante)</option></select><button id="cerrar-partido-btn">Confirmar Resultado y Pagar</button><button id="reembolsar-partido-btn" style="background-color: var(--warning-color); margin-top: 10px;">Suspender y Reembolsar Todo</button></div>` : `<p style="margin-top: 20px;">Este partido ya está ${partido.estado}.</p>`}`;
    showModal(`Detalles Partido: ${partido.local} vs ${partido.visitante}`, contentHTML, (modal) => {
        if (partido.estado === 'Abierto') {
            modal.querySelector('#cerrar-partido-btn').addEventListener('click', async () => {
                const resultado = modal.querySelector('#resultado-final').value;
                if (confirm(`¿Seguro que quieres cerrar el partido con resultado: ${resultado}? Esta acción es irreversible.`)) { const res = await postData({ action: 'cerrarPartido', partidoId, resultado }); alert(res.message); closeModal(); renderVistaPartidos(); }
            });
            modal.querySelector('#reembolsar-partido-btn').addEventListener('click', async () => {
                 if (confirm(`¿Seguro que quieres SUSPENDER el partido y REEMBOLSAR todas las apuestas? Esta acción es irreversible.`)) { const res = await postData({ action: 'reembolsarApuestas', partidoId }); alert(res.message); closeModal(); renderVistaPartidos(); }
            });
        }
    });
}

async function renderVistaCajeros() {
    const container = document.getElementById('cajeros-list-container');
    if (!container) return;
    container.innerHTML = '<p>Cargando cajeros...</p>';
    const result = await postData({ action: 'gestionarCajero', subaction: 'listar' });

    if (result.status === 'success' && result.data.length > 0) {
        container.innerHTML = result.data.map(c => `<div class="list-item"><div class="item-info"><strong>${c.username}</strong><span>Saldo: ${parseFloat(c.saldo || 0).toFixed(2)}</span></div><div class="item-actions"><button class="edit-cajero-btn" data-username="${c.username}">Editar</button><button class="fondos-cajero-btn" data-username="${c.username}">Fondos</button></div></div>`).join('');
        document.querySelectorAll('.edit-cajero-btn').forEach(btn => btn.addEventListener('click', (e) => showCajeroModal({username: e.target.dataset.username})));
        document.querySelectorAll('.fondos-cajero-btn').forEach(btn => btn.addEventListener('click', (e) => showFondosModal(e.target.dataset.username)));
    } else {
        container.innerHTML = '<p>No hay cajeros registrados.</p>';
    }
}

function showCajeroModal(cajero) {
    const isEditing = cajero !== null;
    const title = isEditing ? `Editar Cajero: ${cajero.username}` : 'Crear Nuevo Cajero';
    const contentHTML = `<form id="cajero-form"><input type="text" id="cajero-username-input" placeholder="Nombre de usuario" value="${isEditing ? cajero.username : ''}" required><input type="text" id="cajero-password-input" placeholder="Nueva Contraseña (o dejar en blanco para no cambiar)" required>${!isEditing ? '<input type="number" id="cajero-saldo-input" placeholder="Saldo Inicial" value="0" required>' : ''}<button type="submit">${isEditing ? 'Guardar Cambios' : 'Crear Cajero'}</button><p id="cajero-modal-mensaje" class="mensaje"></p></form>`;
    
    showModal(title, contentHTML, (modal) => {
        modal.querySelector('#cajero-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = modal.querySelector('#cajero-username-input').value;
            const passwordInput = modal.querySelector('#cajero-password-input').value;
            const msgEl = modal.querySelector('#cajero-modal-mensaje');
            msgEl.textContent = 'Procesando...';
            msgEl.style.display = 'block';
            let result;
            if (isEditing) {
                result = await postData({ action: 'gestionarCajero', subaction: 'editar', payload: { oldUsername: cajero.username, newUsername: usernameInput, newPassword: passwordInput } });
            } else {
                const saldoInput = modal.querySelector('#cajero-saldo-input').value;
                result = await postData({ action: 'gestionarCajero', subaction: 'crear', payload: { username: usernameInput, password: passwordInput, saldoInicial: Number(saldoInput) } });
            }
            if (result.status === 'success') { closeModal(); renderVistaCajeros(); } else { msgEl.textContent = result.message; msgEl.className = 'mensaje error'; }
        });
    });
}

function showFondosModal(username) {
    const contentHTML = `<form id="fondos-form"><input type="number" id="fondos-monto-input" placeholder="Monto" required step="0.01"><select id="fondos-tipo-select"><option value="añadir">Añadir Fondos</option><option value="retirar">Retirar Fondos</option></select><button type="submit">Confirmar</button></form>`;
    
    showModal(`Gestionar Fondos de ${username}`, contentHTML, (modal) => {
        modal.querySelector('#fondos-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const monto = modal.querySelector('#fondos-monto-input').value;
            const tipo = modal.querySelector('#fondos-tipo-select').value;
            const result = await postData({ action: 'gestionarCajero', subaction: 'fondos', payload: { username, monto: Number(monto), tipo } });
            alert(result.message);
            if (result.status === 'success') { closeModal(); renderVistaCajeros(); }
        });
    });
}

async function renderVistaHistorialGeneral(filtro) {
    const container = document.getElementById('historial-general-container');
    if (!container) return;
    container.innerHTML = '<p>Cargando historial...</p>';
    const result = await postData({ action: 'getHistorialGeneral', filtro });
    if (result.status === 'success' && result.data.length > 0) {
        container.innerHTML = `<table class="data-table"><thead><tr><th>ID Apuesta</th><th>Usuario</th><th>Partido ID</th><th>Apostó a</th><th>Monto</th><th>Estado</th></tr></thead><tbody>${result.data.map(a => `<tr><td>${a.id}</td><td>${a.usuario}</td><td>${a.partidoId}</td><td>${a.apuestaA}</td><td>${a.monto.toFixed(2)}</td><td>${a.estado}</td></tr>`).join('')}</tbody></table>`;
    } else { container.innerHTML = '<p>No hay apuestas en esta categoría.</p>'; }
}

async function checkPeticionesNotif() {
    const result = await postData({ action: 'getPeticiones' });
    const notifEl = document.getElementById('peticiones-notif');
    if (notifEl) {
        if (result.status === 'success' && result.data.length > 0) {
            notifEl.classList.remove('gray'); notifEl.classList.add('green'); notifEl.textContent = result.data.length;
        } else {
            notifEl.classList.add('gray'); notifEl.classList.remove('green'); notifEl.textContent = '';
        }
    }
}

async function showPeticionesModal() {
    const result = await postData({ action: 'getPeticiones' });
    let contentHTML;
    if (result.status === 'success' && result.data.length > 0) {
        contentHTML = result.data.map(p => `<div class="list-item"><div class="item-info"><strong>Cajero: ${p.cajero}</strong><span>Pide: ${p.monto.toFixed(2)}</span><span>Fecha: ${new Date(p.fecha).toLocaleString()}</span></div><div class="item-actions"><button class="peticion-accept-btn" data-id="${p.id}">Aceptar</button><button class="peticion-reject-btn" data-id="${p.id}" style="background-color: var(--error-color);">Rechazar</button></div></div>`).join('');
    } else {
        contentHTML = "<p>No hay peticiones pendientes.</p>";
    }
    showModal("Peticiones de Fondos de Cajeros", contentHTML, (modal) => {
        modal.querySelectorAll('.peticion-accept-btn').forEach(btn => btn.addEventListener('click', async (e) => {
            const res = await postData({ action: 'responderPeticion', peticionId: e.target.dataset.id, respuesta: 'aceptar' });
            alert(res.message); closeModal(); showPeticionesModal(); checkPeticionesNotif();
        }));
        modal.querySelectorAll('.peticion-reject-btn').forEach(btn => btn.addEventListener('click', async (e) => {
            const motivo = prompt("Motivo del rechazo (opcional):");
            const res = await postData({ action: 'responderPeticion', peticionId: e.target.dataset.id, respuesta: 'rechazar', mensaje: motivo });
            alert(res.message); closeModal(); showPeticionesModal(); checkPeticionesNotif();
        }));
    });
}


// ===================================================
//              LÓGICA DEL PANEL DEL CAJERO
// ===================================================
function setupCajeroPanel(user) {
    const usernameEl = document.getElementById('cajero-username');
    if (usernameEl) usernameEl.textContent = user.username;
    
    const saldoEl = document.getElementById('cajero-saldo');
    if(saldoEl) saldoEl.textContent = parseFloat(user.balance || 0).toFixed(2);
    
    setupNav('cajero-panel', 'cajero-main-content');
    
    const logoutBtn = document.querySelector('#cajero-panel .logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const pedirMonedasBtn = document.getElementById('pedir-monedas-btn');
    if (pedirMonedasBtn) pedirMonedasBtn.addEventListener('click', () => showPedirMonedasModal(user.username));
    
    showView('cajero-main-content', 'vista-jugadores');
}

async function renderVistaJugadores(cajero) {
    const container = document.getElementById('jugadores-list-container');
    if (!container) return;
    container.innerHTML = '<p>Cargando jugadores...</p>';
    const result = await postData({ action: 'getDashboardData', role: 'Cajero', username: cajero.username });

    if (result.status === 'success' && result.data.misJugadores.length > 0) {
        container.innerHTML = result.data.misJugadores.map(j => `<div class="list-item"><div class="item-info"><strong>${j.username}</strong><span>Saldo: ${parseFloat(j.saldo || 0).toFixed(2)}</span></div><div class="item-actions"><button class="jugador-fichas-btn" data-jugador="${j.username}" data-cajero="${cajero.username}">Gestionar Fichas</button></div></div>`).join('');
        document.querySelectorAll('.jugador-fichas-btn').forEach(btn => {
            btn.addEventListener('click', (e) => showGestionarFichasModal(e.target.dataset.jugador, e.target.dataset.cajero));
        });
    } else {
        container.innerHTML = '<p>No tienes jugadores asignados.</p>';
    }
}

function showGestionarFichasModal(jugador, cajero) {
    const contentHTML = `<form id="fichas-form"><input type="number" id="fichas-monto" placeholder="Monto" required><button type="button" id="add-fichas-btn">Añadir Fichas a Jugador</button><button type="button" id="remove-fichas-btn" style="background-color: var(--warning-color);">Retirar Fichas de Jugador</button></form>`;
    showModal(`Gestionar Fichas de ${jugador}`, contentHTML, modal => {
        const montoEl = modal.querySelector('#fichas-monto');
        modal.querySelector('#add-fichas-btn').addEventListener('click', async () => {
            const payload = { cajero, jugador, monto: Number(montoEl.value) };
            const result = await postData({ action: 'gestionarFichasJugador', subaction: 'añadir', payload });
            alert(result.message); if(result.status === 'success') { closeModal(); window.location.reload(); }
        });
         modal.querySelector('#remove-fichas-btn').addEventListener('click', async () => {
            const payload = { cajero, jugador, monto: Number(montoEl.value) };
            const result = await postData({ action: 'gestionarFichasJugador', subaction: 'retirar', payload });
            alert(result.message); if(result.status === 'success') { closeModal(); window.location.reload(); }
        });
    });
}


async function renderVistaMisPeticiones(cajero) {
    const container = document.getElementById('peticiones-list-container');
    if(!container) return;
    container.innerHTML = '<p>Cargando peticiones...</p>';
    const result = await postData({ action: 'getMisPeticiones', cajero: cajero.username });

    if (result.status === 'success' && result.data.length > 0) {
        container.innerHTML = result.data.map(p => `<div class="list-item"><div class="item-info"><strong>Monto: ${p.monto.toFixed(2)}</strong><span>Estado: ${p.estado}</span>${p.mensaje ? `<span>Motivo: ${p.mensaje}</span>` : ''}</div></div>`).join('');
    } else { container.innerHTML = '<p>No has realizado peticiones.</p>'; }
}

function showPedirMonedasModal(cajeroUsername) {
    const contentHTML = `<form id="pedir-monedas-form"><input type="number" id="monto-peticion" placeholder="Monto a solicitar" required min="1"><button type="submit">Enviar Petición</button></form>`;
    showModal("Pedir Monedas al Administrador", contentHTML, modal => {
        modal.querySelector('#pedir-monedas-form').addEventListener('submit', async e => {
            e.preventDefault();
            const monto = modal.querySelector('#monto-peticion').value;
            const result = await postData({ action: 'crearPeticion', cajero: cajeroUsername, monto: Number(monto) });
            alert(result.message);
            if(result.status === 'success') {
                closeModal();
                const btn = document.querySelector('.nav-btn[data-view="vista-peticiones"]');
                if(btn) btn.click();
            }
        });
    });
}


// ===================================================
//        LÓGICA DEL PANEL DEL JUGADOR (RENOVADA)
// ===================================================

function setupJugadorPanel(user) {
    // 1. Llenar la información estática del usuario (con protección)
    const nombreEl = document.getElementById('jugador-nombre');
    if (nombreEl) nombreEl.textContent = user.username;
    
    const saldoEl = document.getElementById('jugador-saldo');
    if (saldoEl) saldoEl.textContent = parseFloat(user.balance || 0).toFixed(2);
    
    // 2. Configurar botón de logout (con protección)
    const logoutBtn = document.querySelector('#jugador-panel .logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    } else {
        console.error("Elemento no encontrado: Botón de logout del jugador");
    }
    
    // 3. Configurar la navegación para móviles
    setupJugadorMobileNav();

    // 4. Cargar el contenido dinámico inicial
    renderPartidosDisponibles(user);
    renderHistorialJugador(user.username);

    // 5. Iniciar la comprobación de notificaciones
    checkUserNotifications(user.username);
    setInterval(() => checkUserNotifications(user.username), 60000);
}

function setupJugadorMobileNav() {
    const navButtons = document.querySelectorAll('.mobile-nav-btn');
    const views = document.querySelectorAll('.jugador-view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewId = btn.dataset.view;
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            views.forEach(view => {
                view.classList.toggle('active', view.id === viewId);
            });
        });
    });
}

async function renderPartidosDisponibles(user) {
    const container = document.getElementById('partidos-disponibles-container');
    if (!container) return;
    container.innerHTML = '<p>Cargando partidos...</p>';
    const result = await postData({ action: 'getDashboardData', role: 'Jugador', username: user.username });
    
    if (result.status === 'success' && result.data.partidos.length > 0) {
        container.innerHTML = result.data.partidos.map(p => `
            <div class="partido-card-v2">
                <h4>${p.local} vs ${p.visitante}</h4>
                <form class="apuesta-form-v2" data-partido-id="${p.id}">
                    <div class="cuotas-v2">
                        <div><input type="radio" name="apuesta" value="Local" id="p${p.id}-local" required><label for="p${p.id}-local">${p.local}<span>${p.cuotaL.toFixed(2)}</span></label></div>
                        <div><input type="radio" name="apuesta" value="Empate" id="p${p.id}-empate"><label for="p${p.id}-empate">Empate<span>${p.cuotaE.toFixed(2)}</span></label></div>
                        <div><input type="radio" name="apuesta" value="Visitante" id="p${p.id}-visitante"><label for="p${p.id}-visitante">${p.visitante}<span>${p.cuotaV.toFixed(2)}</span></label></div>
                    </div>
                    <input type="number" name="monto" placeholder="Monto" required min="1" step="0.01"><button type="submit">Apostar</button>
                </form>
            </div>`).join('');

        container.querySelectorAll('.apuesta-form-v2').forEach(form => {
            form.addEventListener('submit', (e) => handleApuesta(e, user.username));
        });
    } else {
        container.innerHTML = '<p>No hay partidos disponibles para apostar en este momento.</p>';
    }
}

async function handleApuesta(e, username) {
    e.preventDefault();
    const form = e.target;
    const partidoId = form.dataset.partidoId;
    const apuestaA = form.querySelector('input[name="apuesta"]:checked').value;
    const monto = form.querySelector('input[name="monto"]').value;
    
    mostrarMensaje('jugador', 'Procesando apuesta...', 'loading');
    const result = await postData({ action: 'realizarApuesta', username, partidoId, apuestaA, monto: Number(monto) });

    if (result.status === 'success') {
        mostrarMensaje('jugador', result.data.message, 'success');
        const saldoEl = document.getElementById('jugador-saldo');
        if (saldoEl) saldoEl.textContent = parseFloat(result.data.nuevoSaldo).toFixed(2);
        form.reset();
        renderHistorialJugador(username);
    } else {
        mostrarMensaje('jugador', result.message, 'error');
    }
}

async function renderHistorialJugador(username) {
    const container = document.getElementById('jugador-historial-container');
    if (!container) return;
    container.innerHTML = '<p>Cargando historial...</p>';
    const result = await postData({ action: 'getHistorial', username });

    if (result.status === 'success' && result.data.length > 0) {
        container.innerHTML = result.data.map(h => `
            <div class="historial-item-v2 ${h.status.toLowerCase()}">
                <p><strong>${h.partido}</strong></p>
                <p>Apostaste ${h.monto.toFixed(2)} a <strong>${h.apuestaHecha}</strong></p>
                <p>Estado: <span class="status">${h.status}</span></p>
                ${h.status !== 'Pendiente' ? `<p>Resultado: ${h.ganancia.toFixed(2)}</p>` : ''}
            </div>`).join('');
    } else {
        container.innerHTML = '<p>No tienes apuestas en tu historial.</p>';
    }
}

async function checkUserNotifications(username) {
    const result = await postData({ action: 'getMisNotificaciones', username });
    if (result.status === 'success' && result.data.length > 0) {
        const container = document.getElementById('user-notifications');
        if (!container) return;
        result.data.forEach(n => {
            const notifDiv = document.createElement('div');
            notifDiv.className = 'user-alert';
            notifDiv.textContent = n.mensaje;
            container.appendChild(notifDiv);
            setTimeout(() => {
                notifDiv.style.opacity = '0';
                setTimeout(() => notifDiv.remove(), 500);
            }, 10000);
        });
        await postData({ action: 'marcarNotificacionesLeidas', username });
    }
}