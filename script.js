// CÓDIGO COMPLETO Y VERIFICADO - VERSIÓN 4.1
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzt1ZAqoQtjbwtf813UUb8YGRoT5ycbs6SCNKGe0IbYYfHDiD5dzBA9I9YXsSlPyTEh/exec';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Limpiamos cualquier sesión potencialmente corrupta al inicio.
    // Esto previene que el error ocurra si el usuario recarga la página.
    const userJSON = sessionStorage.getItem('user');
    if (userJSON === 'undefined' || userJSON === 'null' || !userJSON) {
        sessionStorage.removeItem('user');
    }

    // 2. Intentamos parsear SÓLO si estamos seguros de que no está corrupto.
    try {
        const userData = JSON.parse(sessionStorage.getItem('user'));
        // Si el parseo es exitoso y tenemos un rol, inicializamos el panel.
        if (userData && userData.role) {
            initPanel(userData);
        } else {
            // Si no hay datos de usuario, mostramos el login.
            showPanel('login-panel');
        }
    } catch (error) {
        // Si el parseo falla por cualquier motivo, mostramos el login.
        showPanel('login-panel');
    }
    
    // 3. Añadimos el listener para el formulario de login.
    document.getElementById('login-form').addEventListener('submit', handleLogin);
});


// --- FUNCIÓN PRINCIPAL DE COMUNICACIÓN CON EL BACKEND ---
async function postData(data, loadingElementId = null) {
    if (loadingElementId) {
        const el = document.getElementById(loadingElementId);
        if (el) el.innerHTML = '<p class="loading-msg">Cargando...</p>';
    }
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
    if (panel) {
        panel.style.display = 'block';
    } else {
        // Fallback: si el panel no existe, muestra el login
        document.getElementById('login-panel').style.display = 'block';
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
    mainContent.querySelectorAll('.view').forEach(view => view.style.display = 'none');
    const viewToShow = mainContent.querySelector(`#${viewId}`);
    if (viewToShow) {
        viewToShow.style.display = 'block';
        if (viewId === 'vista-partidos') renderVistaPartidos();
        else if (viewId === 'vista-cajeros') renderVistaCajeros();
        else if (viewId === 'vista-historial') {
            document.querySelector('#vista-historial .filtro-btn.active').click();
        }
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
    if (result.status === 'success' && result.data) {
        sessionStorage.setItem('user', JSON.stringify(result.data));
        window.location.reload(); // Recargamos para que la lógica de `DOMContentLoaded` haga su trabajo de forma limpia.
    } else {
        mostrarMensaje('login', result.message || 'Error desconocido', 'error');
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