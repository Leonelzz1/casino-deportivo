// PEGA AQUÍ LA URL DE TU APLICACIÓN WEB DE GOOGLE APPS SCRIPT
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzh5xySSXogMWMKYmKrjfCbOZ6YigapdN3ma0PXL-7-ih9uMpml8N3GoLArJyB_5FU/exec';

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const loginPanel = document.getElementById('login-panel');
    const jefePanel = document.getElementById('jefe-panel');
    const cajeroPanel = document.getElementById('cajero-panel');
    const jugadorPanel = document.getElementById('jugador-panel');
    const logoutBtn = document.getElementById('logout-btn');

    // Formularios
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('crear-partido-form').addEventListener('submit', handleCrearPartido);
    document.getElementById('crear-jugador-form').addEventListener('submit', handleCrearJugador);
    logoutBtn.addEventListener('click', handleLogout);

    // Función para enviar datos al backend
    async function postData(data) {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            // Google Apps Script a veces redirige, así que manejamos eso
            if (response.redirected) {
                const textResponse = await (await fetch(response.url)).text();
                return JSON.parse(textResponse);
            }
            return await response.json();
        } catch (error) {
            console.error('Error en fetch:', error);
            return { status: 'error', message: 'Error de conexión con el servidor.' };
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
            mostrarPanel(result.data.role);
        } else {
            mostrarMensaje('login', result.message, 'error');
        }
    }

    function handleLogout() {
        sessionStorage.removeItem('user');
        window.location.reload();
    }

    async function handleCrearPartido(e) {
        e.preventDefault();
        const local = document.getElementById('equipo-local').value;
        const visitante = document.getElementById('equipo-visitante').value;
        mostrarMensaje('jefe', 'Creando partido...', 'loading');
        
        const result = await postData({ action: 'crearPartido', local, visitante });
        
        if (result.status === 'success') {
            mostrarMensaje('jefe', result.data.message, 'success');
            document.getElementById('crear-partido-form').reset();
            cargarDatosJefe(); // Recargar partidos
        } else {
            mostrarMensaje('jefe', result.message, 'error');
        }
    }

    async function handleCrearJugador(e) {
        e.preventDefault();
        const username = document.getElementById('nuevo-usuario').value;
        const password = document.getElementById('nueva-contra').value;
        const saldoInicial = document.getElementById('saldo-inicial').value;
        mostrarMensaje('cajero', 'Creando jugador...', 'loading');

        const result = await postData({ action: 'crearJugador', username, password, saldoInicial });

        if (result.status === 'success') {
            mostrarMensaje('cajero', result.data.message, 'success');
            document.getElementById('crear-jugador-form').reset();
        } else {
            mostrarMensaje('cajero', result.message, 'error');
        }
    }
    
    async function handleRealizarApuesta(e) {
        e.preventDefault();
        const form = e.target;
        const partidoId = form.dataset.partidoid;
        const equipo = form.querySelector('select[name="equipo"]').value;
        const monto = form.querySelector('input[name="monto"]').value;
        const user = JSON.parse(sessionStorage.getItem('user'));
        
        mostrarMensaje('jugador', 'Realizando apuesta...', 'loading');
        
        const result = await postData({
            action: 'realizarApuesta',
            username: user.username,
            partidoId: partidoId,
            equipo: equipo,
            monto: monto
        });

        if(result.status === 'success'){
            mostrarMensaje('jugador', result.data.message, 'success');
            document.getElementById('jugador-saldo').textContent = result.data.nuevoSaldo;
            // Actualizar saldo en sessionStorage
            user.balance = result.data.nuevoSaldo;
            sessionStorage.setItem('user', JSON.stringify(user));
        } else {
            mostrarMensaje('jugador', result.message, 'error');
        }
    }


    // --- FUNCIONES DE UI ---
    function mostrarPanel(role) {
        loginPanel.classList.remove('active');
        logoutBtn.style.display = 'block';

        if (role === 'Jefe') {
            jefePanel.classList.add('active');
            cargarDatosJefe();
        } else if (role === 'Cajero') {
            cajeroPanel.classList.add('active');
        } else if (role === 'Jugador') {
            jugadorPanel.classList.add('active');
            cargarDatosJugador();
        }
    }

    async function cargarDatosJefe() {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const result = await postData({ action: 'getDashboardData', role: user.role, username: user.username });
        if (result.status === 'success') {
            const lista = document.getElementById('jefe-lista-partidos');
            lista.innerHTML = result.data.partidos.length ? '' : '<p>No hay partidos activos.</p>';
            result.data.partidos.forEach(p => {
                lista.innerHTML += `<div class="partido-item"><h4>${p.local} vs ${p.visitante} (ID: ${p.id})</h4></div>`;
            });
        }
    }
    
    async function cargarDatosJugador() {
        const user = JSON.parse(sessionStorage.getItem('user'));
        document.getElementById('jugador-nombre').textContent = user.username;
        document.getElementById('jugador-saldo').textContent = user.balance;

        const result = await postData({ action: 'getDashboardData', role: user.role, username: user.username });
        if (result.status === 'success') {
            document.getElementById('jugador-saldo').textContent = result.data.balance;
            const lista = document.getElementById('jugador-lista-partidos');
            lista.innerHTML = result.data.partidos.length ? '' : '<p>No hay partidos disponibles para apostar.</p>';
            
            result.data.partidos.forEach(p => {
                const partidoDiv = document.createElement('div');
                partidoDiv.className = 'partido-item';
                partidoDiv.innerHTML = `
                    <h4>${p.local} vs ${p.visitante}</h4>
                    <form class="apuesta-form" data-partidoid="${p.id}">
                        <select name="equipo" required>
                            <option value="${p.local}">${p.local}</option>
                            <option value="Empate">Empate</option>
                            <option value="${p.visitante}">${p.visitante}</option>
                        </select>
                        <input type="number" name="monto" placeholder="Monto" required min="1">
                        <button type="submit">Apostar</button>
                    </form>
                `;
                partidoDiv.querySelector('.apuesta-form').addEventListener('submit', handleRealizarApuesta);
                lista.appendChild(partidoDiv);
            });
        }
    }

    function mostrarMensaje(panel, texto, tipo) {
        const el = document.getElementById(`${panel}-mensaje`);
        el.textContent = texto;
        el.className = `mensaje ${tipo}`;
    }

    // Comprobar si ya hay una sesión iniciada al cargar la página
    const user = sessionStorage.getItem('user');
    if(user){
        mostrarPanel(JSON.parse(user).role);
    }
});