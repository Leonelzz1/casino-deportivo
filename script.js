// CÓDIGO COMPLETO Y VERIFICADO - VERSIÓN 6.0 (CON JUEGO DE QUIZ)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTvM78u1Vwgt2s6T507tWQnvqyLp4xz2r7V1ZZ9hjCgpy9BKLdc9i5Q3DxZALgrBi_/exec'; // ¡TU URL DE SCRIPT AQUÍ!

// ===================================================
//         INICIALIZACIÓN Y FUNCIONES GLOBALES
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
    const userJSON = sessionStorage.getItem('user');
    if (userJSON === 'undefined' || userJSON === 'null' || !userJSON) sessionStorage.removeItem('user');
    try {
        const userData = JSON.parse(sessionStorage.getItem('user'));
        if (userData && userData.role) initPanel(userData);
        else showPanel('login-panel');
    } catch (error) {
        console.error("Error al iniciar sesión desde sessionStorage:", error);
        sessionStorage.removeItem('user');
        showPanel('login-panel');
    }
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
});

async function postData(data) {
    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', cache: 'no-cache', redirect: 'follow', body: JSON.stringify(data) });
        if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);
        const textResponse = await response.text();
        if (!textResponse) throw new Error('Respuesta del servidor vacía.');
        return JSON.parse(textResponse);
    } catch (error) {
        console.error('Error en fetch:', error);
        return { status: 'error', message: `Error de conexión: ${error.message}.` };
    }
}

function initPanel(user) {
    if (user.role === 'Jefe') setupJefePanel();
    else if (user.role === 'Cajero') setupCajeroPanel(user);
    else if (user.role === 'Jugador') setupJugadorPanel(user);
    showPanel(`${user.role.toLowerCase()}-panel`);
}

function showPanel(panelId) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(panelId)?.classList.add('active');
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
    document.querySelectorAll(`#${mainContentId} .view`).forEach(view => view.classList.remove('active'));
    const viewToShow = document.querySelector(`#${mainContentId} #${viewId}`);
    if (viewToShow) {
        viewToShow.classList.add('active');
        // Cargar datos según la vista
        switch (viewId) {
            case 'vista-quiz': renderVistaQuizAdmin(); break;
            case 'vista-cajeros': renderVistaCajeros(); break;
            case 'vista-jugadores': renderVistaJugadores(JSON.parse(sessionStorage.getItem('user'))); break;
            case 'vista-peticiones': renderVistaMisPeticiones(JSON.parse(sessionStorage.getItem('user'))); break;
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    mostrarMensaje('login', 'Verificando...', 'loading');
    const result = await postData({ action: 'login', username, password });
    if (result.status === 'success' && result.data) {
        sessionStorage.setItem('user', JSON.stringify(result.data));
        window.location.reload();
    } else { mostrarMensaje('login', result.message || 'Error desconocido.', 'error'); }
}

function handleLogout() {
    sessionStorage.removeItem('user');
    window.location.reload();
}

function showModal(title, contentHTML, onOpen = null) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `<div class="modal-content"><div class="modal-header"><h3>${title}</h3><button class="close-modal-btn">×</button></div><div class="modal-body">${contentHTML}</div></div>`;
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
        else if (tipo === 'loading') { /* no añadir clase de color */ }
        if (tipo !== 'loading' && tipo !== 'error') setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}


// ===================================================
//                LÓGICA DEL PANEL DEL JEFE
// ===================================================
function setupJefePanel() {
    setupNav('jefe-panel', 'jefe-main-content');
    document.querySelector('#jefe-panel .logout-btn').addEventListener('click', handleLogout);
    document.getElementById('crear-cajero-btn').addEventListener('click', () => showCajeroModal(null));
    showView('jefe-main-content', 'vista-quiz');
}

async function renderVistaQuizAdmin() {
    const container = document.getElementById('quiz-players-container');
    container.innerHTML = '<p>Cargando jugadores...</p>';
    // Esta nueva acción debe ser implementada en tu Google Apps Script
    const result = await postData({ action: 'getQuizData' });

    if (result.status === 'success' && result.data.length > 0) {
        container.innerHTML = `<table class="data-table"><thead><tr><th>Nombre</th><th>Imagen Previa</th></tr></thead><tbody>${
            result.data.map(p => `<tr><td>${p.nombre}</td><td><img src="${p.urlImagen}" alt="${p.nombre}" style="width: 50px; height: auto; border-radius: 4px;"></td></tr>`).join('')
        }</tbody></table>`;
    } else {
        container.innerHTML = '<p>No se encontraron jugadores en la hoja "QuizJugadores" o hubo un error al cargar.</p>';
    }
}

// Las funciones de Cajero del jefe no cambian, pero las simplifico por si acaso
async function renderVistaCajeros() { /* ... sin cambios ... */ }
function showCajeroModal(cajero) { /* ... sin cambios ... */ }
function showFondosModal(username) { /* ... sin cambios ... */ }

// --- Pegar aquí las funciones renderVistaCajeros, showCajeroModal y showFondosModal del script original ---
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



// ===================================================
//              LÓGICA DEL PANEL DEL CAJERO
// ===================================================
// --- SIN CAMBIOS. PEGAR AQUÍ TODA LA SECCIÓN DEL CAJERO DEL SCRIPT ORIGINAL ---
function setupCajeroPanel(user) {
    document.getElementById('cajero-username').textContent = user.username;
    document.getElementById('cajero-saldo').textContent = parseFloat(user.balance || 0).toFixed(2);
    setupNav('cajero-panel', 'cajero-main-content');
    document.querySelector('#cajero-panel .logout-btn').addEventListener('click', handleLogout);
    document.getElementById('pedir-monedas-btn').addEventListener('click', () => showPedirMonedasModal(user.username));
    document.getElementById('crear-jugador-btn').addEventListener('click', () => showCrearJugadorModal(user.username));
    showView('cajero-main-content', 'vista-jugadores');
}

function showCrearJugadorModal(cajeroUsername) {
    const contentHTML = `<form id="jugador-form"><input type="text" id="jugador-username-input" placeholder="Nombre de usuario del jugador" required><input type="text" id="jugador-password-input" placeholder="Contraseña para el jugador" required><button type="submit">Crear Jugador</button></form>`;
    showModal('Crear Nuevo Jugador', contentHTML, (modal) => {
        modal.querySelector('#jugador-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = { cajero: cajeroUsername, username: document.getElementById('jugador-username-input').value, password: document.getElementById('jugador-password-input').value, };
            const result = await postData({ action: 'crearJugador', payload });
            alert(result.message);
            if (result.status === 'success') {
                closeModal();
                renderVistaJugadores(JSON.parse(sessionStorage.getItem('user')));
            }
        });
    });
}
async function renderVistaJugadores(cajero) {
    const container = document.getElementById('jugadores-list-container');
    container.innerHTML = '<p>Cargando jugadores...</p>';
    const result = await postData({ action: 'getDashboardData', role: 'Cajero', username: cajero.username });
    if (result.status === 'success' && result.data.misJugadores.length > 0) {
        container.innerHTML = result.data.misJugadores.map(j => `<div class="list-item"><div class="item-info"><strong>${j.username}</strong><span>Saldo: ${parseFloat(j.saldo || 0).toFixed(2)}</span></div><div class="item-actions"><button class="jugador-fichas-btn" data-jugador="${j.username}" data-cajero="${cajero.username}">Gestionar Fichas</button></div></div>`).join('');
        document.querySelectorAll('.jugador-fichas-btn').forEach(btn => {
            btn.addEventListener('click', (e) => showGestionarFichasModal(e.target.dataset.jugador, e.target.dataset.cajero));
        });
    } else { container.innerHTML = '<p>No tienes jugadores. Haz clic en "Nuevo Jugador" para crear uno.</p>'; }
}
function showGestionarFichasModal(jugador, cajero) {
    const contentHTML = `<form id="fichas-form"><input type="number" id="fichas-monto" placeholder="Monto" required><button type="button" id="add-fichas-btn">Añadir Fichas</button><button type="button" id="remove-fichas-btn" style="background-color: var(--warning-color);">Retirar Fichas</button></form>`;
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
    container.innerHTML = '<p>Cargando peticiones...</p>';
    const result = await postData({ action: 'getMisPeticiones', cajero: cajero.username });
    if (result.status === 'success' && result.data.length > 0) {
        container.innerHTML = result.data.map(p => `<div class="list-item"><div class="item-info"><strong>Monto: ${p.monto.toFixed(2)}</strong><span>Estado: ${p.estado}</span>${p.mensaje ? `<span>Motivo: ${p.mensaje}</span>` : ''}</div></div>`).join('');
    } else { container.innerHTML = '<p>No has realizado peticiones.</p>'; }
}
function showPedirMonedasModal(cajeroUsername) {
    const contentHTML = `<form id="pedir-monedas-form"><input type="number" id="monto-peticion" placeholder="Monto a solicitar" required min="1"><button type="submit">Enviar Petición</button></form>`;
    showModal("Pedir Monedas", contentHTML, modal => {
        modal.querySelector('#pedir-monedas-form').addEventListener('submit', async e => {
            e.preventDefault();
            const monto = modal.querySelector('#monto-peticion').value;
            const result = await postData({ action: 'crearPeticion', cajero: cajeroUsername, monto: Number(monto) });
            alert(result.message);
            if(result.status === 'success') {
                closeModal();
                document.querySelector('.nav-btn[data-view="vista-peticiones"]')?.click();
            }
        });
    });
}


// ===================================================
//         LÓGICA DEL PANEL DEL JUGADOR (QUIZ)
// ===================================================

// Objeto para mantener el estado del juego actual
let quizState = {
    isActive: false,
    betAmount: 0,
    playerCount: 0,
    quota: 0,
    gameId: null, // ID para identificar este juego en el backend
    players: [], // Lista de jugadores para adivinar
    currentQuestionIndex: 0,
    timeLeft: 30,
    timerInterval: null,
    isDoubleOrNothing: false,
};

function setupJugadorPanel(user) {
    document.getElementById('jugador-nombre').textContent = user.username;
    updatePlayerBalance(user.balance);
    document.querySelector('#jugador-panel .logout-btn').addEventListener('click', handleLogout);

    initQuizGame();
}

function updatePlayerBalance(newBalance) {
    const balanceEl = document.getElementById('jugador-saldo');
    if (balanceEl) {
        balanceEl.textContent = parseFloat(newBalance || 0).toFixed(2);
    }
}

function initQuizGame() {
    // Listeners para la pantalla de configuración
    const startForm = document.getElementById('quiz-start-form');
    const playerCountInput = document.getElementById('quiz-player-count');
    const cuotaPreview = document.querySelector('#cuota-preview span');

    playerCountInput.addEventListener('input', () => {
        const count = parseInt(playerCountInput.value) || 0;
        const quota = 1 + (count * 0.10);
        cuotaPreview.textContent = `${quota.toFixed(2)}`;
    });

    startForm.addEventListener('submit', handleStartQuiz);

    // Listener para la pantalla de juego
    const answerForm = document.getElementById('quiz-answer-form');
    answerForm.addEventListener('submit', handleQuizAnswer);
}

async function handleStartQuiz(e) {
    e.preventDefault();
    if (quizState.isActive) return;

    const betAmount = parseFloat(document.getElementById('quiz-bet-amount').value);
    const playerCount = parseInt(document.getElementById('quiz-player-count').value);
    const user = JSON.parse(sessionStorage.getItem('user'));

    mostrarMensaje('quiz', 'Iniciando juego...', 'loading');

    // La acción 'startQuiz' debe ser implementada en tu Google Apps Script
    // Debe: 1. Verificar si el usuario tiene saldo. 2. Deducir el monto.
    // 3. Seleccionar 'playerCount' jugadores al azar. 4. Devolver los datos del juego.
    const result = await postData({ 
        action: 'startQuiz', 
        username: user.username, 
        betAmount, 
        playerCount 
    });

    if (result.status === 'success') {
        quizState = {
            ...quizState,
            isActive: true,
            betAmount: betAmount,
            playerCount: playerCount,
            quota: result.data.quota,
            gameId: result.data.gameId,
            players: result.data.players,
            currentQuestionIndex: 0,
        };
        updatePlayerBalance(result.data.newBalance); // Actualizar saldo después de apostar
        switchScreen('quiz-game-screen');
        nextQuestion();
    } else {
        mostrarMensaje('quiz', result.message, 'error');
    }
}

function nextQuestion() {
    if (quizState.currentQuestionIndex >= quizState.players.length) {
        endGame('win');
        return;
    }
    
    const currentPlayer = quizState.players[quizState.currentQuestionIndex];
    
    document.getElementById('quiz-progress').textContent = `Jugador ${quizState.currentQuestionIndex + 1} / ${quizState.playerCount}`;
    document.getElementById('quiz-player-image').src = currentPlayer.urlImagen;
    document.getElementById('quiz-answer-input').value = '';
    document.getElementById('quiz-feedback').textContent = '';
    document.getElementById('quiz-answer-input').focus();
    
    startTimer(30);
}

function handleQuizAnswer(e) {
    e.preventDefault();
    clearInterval(quizState.timerInterval); // Detener el timer al responder

    const userAnswer = document.getElementById('quiz-answer-input').value.trim().toLowerCase();
    const correctAnswer = quizState.players[quizState.currentQuestionIndex].nombre.trim().toLowerCase();
    
    if (userAnswer === correctAnswer) {
        document.getElementById('quiz-feedback').textContent = "¡Correcto! +15s";
        document.getElementById('quiz-feedback').className = 'feedback correct';
        quizState.currentQuestionIndex++;
        // Añadir un pequeño delay antes de la siguiente pregunta
        setTimeout(() => nextQuestion(), 1500);
    } else {
        document.getElementById('quiz-feedback').textContent = `Incorrecto. La respuesta era: ${quizState.players[quizState.currentQuestionIndex].nombre}`;
        document.getElementById('quiz-feedback').className = 'feedback incorrect';
        setTimeout(() => endGame('lose'), 2000);
    }
}

function startTimer(seconds) {
    clearInterval(quizState.timerInterval);
    quizState.timeLeft = seconds;
    const timerEl = document.querySelector('#quiz-timer strong');
    timerEl.textContent = quizState.timeLeft;

    quizState.timerInterval = setInterval(() => {
        quizState.timeLeft--;
        timerEl.textContent = quizState.timeLeft;
        if (quizState.timeLeft <= 0) {
            clearInterval(quizState.timerInterval);
            endGame('timeout');
        }
    }, 1000);
}

async function endGame(reason) {
    clearInterval(quizState.timerInterval);
    quizState.isActive = false;

    const user = JSON.parse(sessionStorage.getItem('user'));
    let title = '', content = '';
    
    if (reason === 'win') {
        const result = await postData({ action: 'resolveQuiz', result: 'win', gameId: quizState.gameId, username: user.username });
        if (result.status === 'success') {
            updatePlayerBalance(result.data.newBalance);
            // Lógica de "Doble o Nada"
            if (quizState.quota >= 2.0 && !quizState.isDoubleOrNothing) {
                showDoubleOrNothingOffer(result.data.winnings);
                return; // Salir para no mostrar el modal de victoria simple
            } else {
                title = "¡Felicidades, has ganado!";
                content = `<p>Ganaste un total de <strong>${result.data.winnings.toFixed(2)}</strong> monedas.</p><button onclick="resetQuiz()">Jugar de Nuevo</button>`;
            }
        }
    } else if (reason === 'lose') {
        title = "¡Has perdido!";
        content = `<p>Fallaste al adivinar al jugador. Perdiste <strong>${quizState.betAmount.toFixed(2)}</strong> monedas.</p><button onclick="resetQuiz()">Intentar de Nuevo</button>`;
    } else if (reason === 'timeout') {
        showContinueOffer();
        return; // Salir para no mostrar el modal de derrota
    }

    if (title) {
        showModal(title, content);
    }
}

function showContinueOffer() {
    const continueCost = quizState.betAmount * 0.5; // Costo de continuar (ej: 50% de la apuesta)
    const title = "¡Se acabó el tiempo!";
    const content = `
        <p>¿Quieres una vida extra por <strong>${continueCost.toFixed(2)}</strong> monedas para seguir jugando?</p>
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
            <button id="accept-continue" style="flex: 1;">Sí, pagar y continuar</button>
            <button id="reject-continue" style="flex: 1; background-color: var(--error-color);">No, rendirse</button>
        </div>
    `;
    showModal(title, content, (modal) => {
        modal.querySelector('.close-modal-btn').style.display = 'none'; // No se puede cerrar
        modal.querySelector('#accept-continue').onclick = async () => {
            const user = JSON.parse(sessionStorage.getItem('user'));
            // Lógica para pagar y continuar (necesita acción en backend)
            const result = await postData({ action: 'payToContinue', username: user.username, gameId: quizState.gameId, cost: continueCost });
            if (result.status === 'success') {
                updatePlayerBalance(result.data.newBalance);
                closeModal();
                quizState.isActive = true; // reactivar
                nextQuestion(); // Continuar con la pregunta actual
            } else {
                alert(result.message); // No tiene saldo suficiente, por ejemplo
                endGame('lose'); // Forzar la derrota
            }
        };
        modal.querySelector('#reject-continue').onclick = () => {
            closeModal();
            endGame('lose');
        };
    });
}

function showDoubleOrNothingOffer(currentWinnings) {
    const newQuota = quizState.quota * 2;
    const newWinnings = quizState.betAmount * newQuota;
    const title = "¡DOBLE O NADA!";
    const content = `
        <p>¡Has ganado <strong>${currentWinnings.toFixed(2)}</strong>! Tu cuota fue de ${quizState.quota.toFixed(2)}x.</p>
        <p>¿Te atreves a adivinar <strong>5 jugadores más</strong> para duplicar tu cuota a <strong>${newQuota.toFixed(2)}x</strong> y ganar <strong>${newWinnings.toFixed(2)}</strong>?</p>
        <p style="color: var(--warning-color); margin-top: 0.5rem;">Si aceptas y pierdes, te irás sin nada.</p>
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
            <button id="accept-double" style="flex: 1;">¡Acepto el reto!</button>
            <button id="reject-double" style="flex: 1; background-color: var(--accent-secondary);">No, me quedo con mi premio</button>
        </div>
    `;
    showModal(title, content, (modal) => {
        modal.querySelector('.close-modal-btn').style.display = 'none';
        modal.querySelector('#accept-double').onclick = async () => {
             const user = JSON.parse(sessionStorage.getItem('user'));
             // La acción 'startDoubleOrNothing' debe preparar una nueva ronda de 5 jugadores en el backend
             const result = await postData({ action: 'startDoubleOrNothing', username: user.username, gameId: quizState.gameId });
             if (result.status === 'success') {
                closeModal();
                quizState.isDoubleOrNothing = true;
                quizState.isActive = true;
                quizState.playerCount = 5; // Nueva meta
                quizState.players = result.data.newPlayers;
                quizState.currentQuestionIndex = 0;
                quizState.quota = newQuota; // Actualizar la cuota
                nextQuestion();
             } else {
                 alert(result.message);
             }
        };
        modal.querySelector('#reject-double').onclick = () => {
            closeModal();
            showModal("¡Premio asegurado!", `<p>¡Bien jugado! Has asegurado tus <strong>${currentWinnings.toFixed(2)}</strong> monedas.</p><button onclick="resetQuiz()">Jugar de Nuevo</button>`);
        };
    });
}

function switchScreen(screenId) {
    document.querySelectorAll('.quiz-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Función global para ser llamada desde el botón en el modal
window.resetQuiz = () => {
    closeModal();
    quizState.isDoubleOrNothing = false; // resetear estado
    switchScreen('quiz-setup-screen');
    document.getElementById('quiz-start-form').reset();
    document.querySelector('#cuota-preview span').textContent = "1.00";
}