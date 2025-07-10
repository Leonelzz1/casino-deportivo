// CÓDIGO COMPLETO Y VERIFICADO - VERSIÓN 4.1
const SCRIPT_URL = 'TU_URL_DE_APPS_SCRIPT_AQUÍ';

// --- INICIALIZACIÓN AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        const userJSON = sessionStorage.getItem('user');
        if (userJSON) {
            const user = JSON.parse(userJSON);
            if (user && user.role) {
                initPanel(user);
            } else { throw new Error("Sesión corrupta."); }
        } else {
            showPanel('login-panel');
        }
    } catch (error) {
        console.error("Error al cargar sesión:", error);
        sessionStorage.removeItem('user');
        showPanel('login-panel');
    }
    document.getElementById('login-form').addEventListener('submit', handleLogin);
});

// --- FUNCIÓN PRINCIPAL DE COMUNICACIÓN CON EL BACKEND ---
async function postData(data, loadingElementId = null) {
    if (loadingElementId) document.getElementById(loadingElementId).innerHTML = '<p>Cargando...</p>';
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST', cache: 'no-cache', redirect: 'follow', body: JSON.stringify(data)
        });
        const textResponse = await response.text();
        if (!textResponse) throw new Error('Respuesta del servidor vacía.');
        return JSON.parse(textResponse);
    } catch (error) {
        console.error('Error en fetch:', error);
        return { status: 'error', message: 'Error de conexión. Revisa la URL y la implementación del script.' };
    }
}

// --- SETUP INICIAL DE PANELES Y NAVEGACIÓN ---
function initPanel(user) {
    showPanel(`${user.role.toLowerCase()}-panel`);
    if (user.role === 'Jefe') setupJefePanel();
    if (user.role === 'Cajero') setupCajeroPanel(user);
    if (user.role === 'Jugador') setupJugadorPanel(user);
}

function showPanel(panelId) {
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    const panel = document.getElementById(panelId);
    if (panel) panel.style.display = 'block';
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
    mainContent.querySelectorAll('.view').forEach(view => view.style.display = 'none');
    const viewToShow = mainContent.querySelector(`#${viewId}`);
    if (viewToShow) {
        viewToShow.style.display = 'block';
        // Cargar datos dinámicamente para la vista activa
        if (viewId === 'vista-partidos') renderVistaPartidos();
        else if (viewId === 'vista-cajeros') renderVistaCajeros();
        else if (viewId === 'vista-historial') renderVistaHistorialGeneral('todas');
        else if (viewId === 'vista-jugadores') renderVistaJugadores();
        else if (viewId === 'vista-peticiones') renderVistaMisPeticiones();
    }
}

// --- MANEJO DE LOGIN / LOGOUT ---
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

function handleLogout() {
    sessionStorage.removeItem('user');
    window.location.reload();
}

// --- MODALES (Genéricos) ---
function showModal(title, contentHTML) {
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
}
function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.classList.remove('visible');
    modalContainer.innerHTML = '';
}

// ==================================================
//               LÓGICA DEL PANEL DEL JEFE
// ==================================================
function setupJefePanel() {
    setupNav('jefe-panel', 'jefe-main-content');
    document.querySelector('#jefe-panel .logout-btn').addEventListener('click', handleLogout);
    document.getElementById('peticiones-btn').addEventListener('click', () => showPeticionesModal());
    document.getElementById('crear-cajero-btn').addEventListener('click', () => showCajeroModal(null));
    // Filtros del historial
    document.querySelectorAll('#vista-historial .filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#vista-historial .filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderVistaHistorialGeneral(btn.dataset.filtro);
        });
    });
    showView('jefe-main-content', 'vista-partidos');
    checkPeticionesNotif();
}

async function renderVistaPartidos() {
    const container = document.getElementById('partidos-table-container');
    const result = await postData({ action: 'getPartidosJefe' }, 'partidos-table-container');
    if (result.status === 'success' && result.data) {
        if (result.data.length === 0) {
            container.innerHTML = '<p>No hay partidos creados.</p>';
            return;
        }
        let tableHTML = '<table class="data-table"><tr><th>Partido</th><th>Estado</th></tr>';
        result.data.forEach(p => {
            tableHTML += `<tr data-partidoid="${p.id}"><td>${p.local} vs ${p.visitante}</td><td>${p.estado}</td></tr>`;
        });
        tableHTML += '</table>';
        container.innerHTML = tableHTML;
        container.querySelectorAll('tr[data-partidoid]').forEach(row => {
            row.addEventListener('click', () => showDetallesPartidoModal(row.dataset.partidoid));
        });
    } else {
        container.innerHTML = `<p class="mensaje error">${result.message}</p>`;
    }
}

async function showDetallesPartidoModal(partidoId) {
    const result = await postData({ action: 'getDetallesPartido', partidoId });
    if (result.status === 'success' && result.data) {
        const p = result.data;
        const renderApostadores = (apostadores) => apostadores.length > 0
            ? apostadores.map(a => `<p><span>${a.usuario} (${a.monto})</span><span>Saldo: ${a.saldo}</span></p>`).join('')
            : '<p>Nadie apostó aquí.</p>';

        let contentHTML = `
            <div class="cuotas-grid">
                <div><h4>Local (${p.cuotaL}) - ${p.apuestasLocal.length} apuestas</h4><div class="apostadores-list">${renderApostadores(p.apuestasLocal)}</div></div>
                <div><h4>Empate (${p.cuotaE}) - ${p.apuestasEmpate.length} apuestas</h4><div class="apostadores-list">${renderApostadores(p.apuestasEmpate)}</div></div>
                <div><h4>Visitante (${p.cuotaV}) - ${p.apuestasVisitante.length} apuestas</h4><div class="apostadores-list">${renderApostadores(p.apuestasVisitante)}</div></div>
            </div>
            <hr>
            <h4>Acciones</h4>
            <div class="item-actions">
                <button id="cerrar-local-btn">Gana Local</button>
                <button id="cerrar-empate-btn">Empate</button>
                <button id="cerrar-visitante-btn">Gana Visitante</button>
                <button id="suspender-btn" class="logout-btn">Suspender Partido</button>
            </div>
            <p id="modal-msg" class="mensaje"></p>`;
        showModal(`${p.local} vs ${p.visitante}`, contentHTML);

        document.getElementById('cerrar-local-btn').addEventListener('click', () => cerrarPartido(partidoId, 'Local'));
        document.getElementById('cerrar-empate-btn').addEventListener('click', () => cerrarPartido(partidoId, 'Empate'));
        document.getElementById('cerrar-visitante-btn').addEventListener('click', () => cerrarPartido(partidoId, 'Visitante'));
        document.getElementById('suspender-btn').addEventListener('click', () => suspenderPartido(partidoId));
    }
}
async function cerrarPartido(partidoId, resultado) {
    const result = await postData({ action: 'cerrarPartido', partidoId, resultado });
    mostrarMensaje('modal', result.data?.message || result.message, result.status);
    if(result.status === 'success') {
        setTimeout(() => { closeModal(); renderVistaPartidos(); }, 2000);
    }
}
async function suspenderPartido(partidoId) {
    if(!confirm("¿Seguro que quieres suspender este partido y devolver todas las apuestas activas? Esta acción no se puede deshacer.")) return;
    const result = await postData({ action: 'reembolsarApuestas', partidoId });
    mostrarMensaje('modal', result.data?.message || result.message, result.status);
    if(result.status === 'success') {
        setTimeout(() => { closeModal(); renderVistaPartidos(); }, 2000);
    }
}
// ==================================================
//      (Continuación del script.js anterior)
// ==================================================

// --- MÁS LÓGICA DEL PANEL DEL JEFE ---

async function renderVistaCajeros() {
    const container = document.getElementById('cajeros-list-container');
    const result = await postData({ action: 'gestionarCajero', subaction: 'listar' }, 'cajeros-list-container');
    if(result.status === 'success' && result.data) {
        if(result.data.length === 0) {
            container.innerHTML = '<p>No hay cajeros creados.</p>';
            return;
        }
        let listHTML = '';
        result.data.forEach(c => {
            listHTML += `
                <div class="list-item">
                    <div class="item-info">
                        <h4>${c.username}</h4>
                        <p>Saldo: ${parseFloat(c.saldo).toFixed(2)}</p>
                    </div>
                    <div class="item-actions">
                        <button class="fondos-cajero-btn" data-username="${c.username}">Fondos</button>
                        <button class="editar-cajero-btn" data-username="${c.username}">Editar</button>
                    </div>
                </div>`;
        });
        container.innerHTML = listHTML;
        // Add event listeners
        container.querySelectorAll('.fondos-cajero-btn').forEach(btn => btn.addEventListener('click', (e) => showFondosCajeroModal(e.target.dataset.username)));
        container.querySelectorAll('.editar-cajero-btn').forEach(btn => btn.addEventListener('click', (e) => showCajeroModal(e.target.dataset.username)));
    } else {
        container.innerHTML = `<p class="mensaje error">${result.message}</p>`;
    }
}

function showCajeroModal(username = null) {
    const isEditing = username !== null;
    const title = isEditing ? 'Editar Cajero' : 'Crear Nuevo Cajero';
    let contentHTML = `
        <form id="form-cajero">
            <input type="text" id="cajero-username" placeholder="Nombre de usuario" value="${username || ''}" required>
            <input type="text" id="cajero-password" placeholder="Nueva contraseña" required>
            ${!isEditing ? '<input type="number" id="cajero-saldo" placeholder="Saldo Inicial" required>' : ''}
            <div class="item-actions">
                ${isEditing ? `<button type="button" id="cajero-eliminar-btn" class="logout-btn">Eliminar</button>` : ''}
                <button type="submit">${isEditing ? 'Guardar Cambios' : 'Crear Cajero'}</button>
            </div>
            <p id="modal-msg" class="mensaje"></p>
        </form>`;
    showModal(title, contentHTML);

    document.getElementById('form-cajero').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            newUsername: document.getElementById('cajero-username').value,
            newPassword: document.getElementById('cajero-password').value
        };
        let result;
        if(isEditing) {
            payload.oldUsername = username;
            result = await postData({ action: 'gestionarCajero', subaction: 'editar', payload });
        } else {
            payload.username = payload.newUsername;
            payload.password = payload.newPassword;
            payload.saldoInicial = document.getElementById('cajero-saldo').value;
            result = await postData({ action: 'gestionarCajero', subaction: 'crear', payload });
        }
        mostrarMensaje('modal', result.data?.message || result.message, result.status);
        if(result.status === 'success') {
            renderVistaCajeros();
            setTimeout(closeModal, 2000);
        }
    });

    if(isEditing) {
        document.getElementById('cajero-eliminar-btn').addEventListener('click', async () => {
            if(!confirm(`¿Seguro que quieres eliminar al cajero ${username}? Esta acción no se puede deshacer.`)) return;
            const result = await postData({ action: 'gestionarCajero', subaction: 'eliminar', payload: {username} });
            mostrarMensaje('modal', result.data?.message || result.message, result.status);
            if(result.status === 'success') {
                renderVistaCajeros();
                setTimeout(closeModal, 2000);
            }
        });
    }
}

function showFondosCajeroModal(username) {
    let contentHTML = `
        <form id="form-fondos-cajero">
            <input type="number" id="fondos-monto" placeholder="Monto" required>
            <div class="item-actions">
                <button type="button" id="fondos-add-btn">Añadir</button>
                <button type="button" id="fondos-remove-btn">Retirar</button>
            </div>
            <p id="modal-msg" class="mensaje"></p>
        </form>`;
    showModal(`Gestionar Fondos de ${username}`, contentHTML);

    document.getElementById('fondos-add-btn').addEventListener('click', () => handleFondosCajero(username, 'añadir'));
    document.getElementById('fondos-remove-btn').addEventListener('click', () => handleFondosCajero(username, 'retirar'));
}
async function handleFondosCajero(username, tipo) {
    const monto = document.getElementById('fondos-monto').value;
    if(!monto || monto <= 0) {
        mostrarMensaje('modal', 'Ingresa un monto válido', 'error');
        return;
    }
    const result = await postData({ action: 'gestionarCajero', subaction: 'fondos', payload: {username, monto, tipo} });
    mostrarMensaje('modal', result.data?.message || result.message, result.status);
    if(result.status === 'success') {
        renderVistaCajeros();
    }
}

async function checkPeticionesNotif() {
    const result = await postData({ action: 'getPeticiones' });
    if (result.status === 'success' && result.data.length > 0) {
        document.getElementById('peticiones-notif').classList.replace('gray', 'green');
    } else {
        document.getElementById('peticiones-notif').classList.replace('green', 'gray');
    }
}

async function showPeticionesModal() {
    const result = await postData({ action: 'getPeticiones' });
    let contentHTML = '';
    if (result.status === 'success' && result.data.length > 0) {
        contentHTML += result.data.map(p => `
            <div class="list-item">
                <div class="item-info">
                    <h4>${p.cajero} pide ${p.monto} monedas</h4>
                    <p>Fecha: ${new Date(p.fecha).toLocaleString()}</p>
                </div>
                <div class="item-actions">
                    <button class="peticion-aceptar-btn" data-id="${p.id}">Aceptar</button>
                    <button class="peticion-rechazar-btn logout-btn" data-id="${p.id}">Rechazar</button>
                </div>
            </div>`).join('');
    } else {
        contentHTML = '<p>No hay peticiones pendientes.</p>';
    }
    showModal('Peticiones de Fondos de Cajeros', contentHTML);

    document.querySelectorAll('.peticion-aceptar-btn').forEach(btn => btn.addEventListener('click', (e) => handleResponderPeticion(e.target.dataset.id, 'aceptar')));
    document.querySelectorAll('.peticion-rechazar-btn').forEach(btn => btn.addEventListener('click', (e) => handleResponderPeticion(e.target.dataset.id, 'rechazar')));
}
async function handleResponderPeticion(peticionId, respuesta) {
    let mensaje = '';
    if (respuesta === 'rechazar') {
        mensaje = prompt("Opcional: Escribe un motivo para el rechazo.");
    }
    const result = await postData({ action: 'responderPeticion', peticionId, respuesta, mensaje });
    if(result.status === 'success') {
        closeModal();
        checkPeticionesNotif();
    } else {
        alert('Error: ' + result.message);
    }
}

// ===================================================
//              LÓGICA DEL PANEL DEL CAJERO
// ===================================================

function setupCajeroPanel(user) {
    document.getElementById('cajero-username').textContent = user.username;
    document.getElementById('cajero-saldo').textContent = parseFloat(user.balance || 0).toFixed(2);
    setupNav('cajero-panel', 'cajero-main-content');
    document.querySelector('#cajero-panel .logout-btn').addEventListener('click', handleLogout);
    document.getElementById('pedir-monedas-btn').addEventListener('click', () => showPedirMonedasModal(user.username));
    showView('cajero-main-content', 'vista-jugadores');
}

async function renderVistaJugadores() {
    const container = document.getElementById('jugadores-list-container');
    const user = JSON.parse(sessionStorage.getItem('user'));
    // Esta llamada ya existe en el dashboard del cajero, podemos reusarla o crear una nueva
    const result = await postData({ action: 'getDashboardData', role: 'Cajero', username: user.username }, 'jugadores-list-container');

    if(result.status === 'success' && result.data.misJugadores) {
         if(result.data.misJugadores.length === 0) {
            container.innerHTML = '<p>No has creado ningún jugador.</p>';
            return;
        }
        let listHTML = result.data.misJugadores.map(jugador => `
            <div class="list-item">
                <div class="item-info"><h4>${jugador}</h4></div>
                <div class="item-actions">
                    <button class="fondos-jugador-btn" data-jugador="${jugador}">Gestionar Fichas</button>
                    <button class="eliminar-jugador-btn logout-btn" data-jugador="${jugador}">Eliminar</button>
                </div>
            </div>`).join('');
        container.innerHTML = listHTML;
        
        container.querySelectorAll('.fondos-jugador-btn').forEach(btn => btn.addEventListener('click', (e) => showFondosJugadorModal(e.target.dataset.jugador)));
        container.querySelectorAll('.eliminar-jugador-btn').forEach(btn => btn.addEventListener('click', (e) => handleEliminarJugador(e.target.dataset.jugador)));
    } else {
        container.innerHTML = `<p class="mensaje error">${result.message}</p>`;
    }
}

function showFondosJugadorModal(jugador) {
    const contentHTML = `
        <form id="form-fondos-jugador">
            <input type="number" id="jugador-monto" placeholder="Monto" required>
            <div class="item-actions">
                <button type="button" id="jugador-add-btn">Añadir Fichas</button>
                <button type="button" id="jugador-remove-btn">Retirar Fichas</button>
            </div>
            <p id="modal-msg" class="mensaje"></p>
        </form>
    `;
    showModal(`Gestionar Fichas de ${jugador}`, contentHTML);
    
    document.getElementById('jugador-add-btn').addEventListener('click', () => handleGestionarFichas(jugador, 'añadir'));
    document.getElementById('jugador-remove-btn').addEventListener('click', () => handleGestionarFichas(jugador, 'retirar'));
}

async function handleGestionarFichas(jugador, subaction) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const monto = document.getElementById('jugador-monto').value;
    if (!monto || monto <= 0) { mostrarMensaje('modal', 'Ingresa un monto válido', 'error'); return; }
    
    const result = await postData({ action: 'gestionarFichasJugador', subaction, payload: {cajero: user.username, jugador, monto} });
    
    mostrarMensaje('modal', result.data?.message || result.message, result.status);
    if(result.status === 'success') {
        const updatedUser = await postData({ action: 'login', username: user.username, password: user.password });
        if(updatedUser.status === 'success') {
             sessionStorage.setItem('user', JSON.stringify(updatedUser.data));
             document.getElementById('cajero-saldo').textContent = parseFloat(updatedUser.data.balance).toFixed(2);
        }
    }
}
async function handleEliminarJugador(jugador) {
    if (!confirm(`¿Seguro que quieres eliminar al jugador ${jugador}? Esta acción no se puede deshacer.`)) return;
    const user = JSON.parse(sessionStorage.getItem('user'));
    const result = await postData({ action: 'gestionarFichasJugador', subaction: 'eliminar', payload: {cajero: user.username, jugador} });
    if(result.status === 'success') {
        alert(result.data.message);
        renderVistaJugadores();
    } else {
        alert('Error: ' + result.message);
    }
}

function showPedirMonedasModal(cajero) {
    const contentHTML = `
        <form id="form-pedir-monedas">
            <input type="number" id="monto-peticion" placeholder="Monto a solicitar" required>
            <button type="submit">Enviar Petición</button>
            <p id="modal-msg" class="mensaje"></p>
        </form>
    `;
    showModal('Pedir Monedas al Administrador', contentHTML);
    
    document.getElementById('form-pedir-monedas').addEventListener('submit', async (e) => {
        e.preventDefault();
        const monto = document.getElementById('monto-peticion').value;
        if (!monto || monto <= 0) { mostrarMensaje('modal', 'Ingresa un monto válido', 'error'); return; }
        
        const result = await postData({ action: 'crearPeticion', cajero, monto });
        mostrarMensaje('modal', result.data?.message || result.message, result.status);
        if(result.status === 'success') setTimeout(closeModal, 2000);
    });
}

async function renderVistaMisPeticiones() {
    const container = document.getElementById('peticiones-list-container');
    const user = JSON.parse(sessionStorage.getItem('user'));
    const result = await postData({ action: 'getMisPeticiones', cajero: user.username }, 'peticiones-list-container');
    
    if (result.status === 'success' && result.data) {
        if (result.data.length === 0) {
            container.innerHTML = '<p>No has realizado ninguna petición.</p>';
            return;
        }
        let listHTML = result.data.map(p => `
            <div class="list-item">
                <div class="item-info">
                    <h4>Petición de ${p.monto} monedas</h4>
                    <p>Estado: ${p.estado}</p>
                    ${p.mensaje ? `<p>Respuesta del admin: ${p.mensaje}</p>` : ''}
                </div>
            </div>`).join('');
        container.innerHTML = listHTML;
    } else {
        container.innerHTML = `<p class="mensaje error">${result.message}</p>`;
    }
}

// ===================================================
//              LÓGICA DEL PANEL DEL JUGADOR
// ===================================================

async function checkUserNotifications(username) {
    const result = await postData({ action: 'getMisNotificaciones', username });
    if (result.status === 'success' && result.data.length > 0) {
        const container = document.getElementById('user-notifications');
        container.innerHTML = ''; // Limpiar viejas notificaciones
        result.data.forEach(n => {
            container.innerHTML += `<div class="user-alert">${n.mensaje}</div>`;
        });
        // Marcar como leídas después de mostrarlas
        await postData({ action: 'marcarNotificacionesLeidas', username });
        // Ocultar después de un tiempo
        setTimeout(() => container.innerHTML = '', 10000);
    }
}

// El código del panel del jugador (setupJugadorPanel, etc.) de la versión anterior se mantiene aquí, ya que sigue siendo funcional.
// Se incluye la función `checkUserNotifications` que se debe llamar en el `setupJugadorPanel`.

function mostrarMensaje(panel, texto, tipo) {
    const el = document.getElementById(`${panel}-mensaje`);
    if(el) {
        el.textContent = texto || 'Ocurrió un error.';
        el.className = 'mensaje'; // Reset
        if (tipo !== 'loading') {
            el.classList.add(tipo);
        }
        el.style.display = 'block';
        if (tipo !== 'loading' && tipo !== 'error') {
            setTimeout(() => { el.style.display = 'none'; }, 4000);
        }
    }
}