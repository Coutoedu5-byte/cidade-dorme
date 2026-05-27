const socket = io();

let playerName = "";
let roomCode = "";
let isDead = false;

const app = document.getElementById("app");

function createHome() {
    app.innerHTML = `
        <div class="home">
            <h1>CIDADE<br>DORME</h1>

            <input id="nameInput" placeholder="Nome do jogador">

            <div class="buttons">
                <button onclick="createRoom()">Criar Sala</button>
                <button onclick="joinRoom()">Entrar Sala</button>
            </div>
        </div>
    `;
}

createHome();

function createRoom() {
    playerName = document.getElementById("nameInput").value;

    if (!playerName) {
        alert("Digite seu nome");
        return;
    }

    socket.emit("createRoom", playerName);
}

function joinRoom() {
    playerName = document.getElementById("nameInput").value;

    if (!playerName) {
        alert("Digite seu nome");
        return;
    }

    const code = prompt("Digite o código da sala");

    if (!code) return;

    socket.emit("joinRoom", {
        room: code,
        name: playerName
    });
}

socket.on("roomCreated", (room) => {
    roomCode = room;
    renderLobby([]);
});

socket.on("roomJoined", (data) => {
    roomCode = data.room;
    renderLobby(data.players);
});

socket.on("updatePlayers", (players) => {
    updatePlayerList(players);
});

function renderLobby(players) {
    app.innerHTML = `
        <div class="lobby">
            <h2>Sala: ${roomCode}</h2>

            <div id="players"></div>

            <button onclick="startGame()">Iniciar Partida</button>

            <div id="chat"></div>

            <input id="chatInput" placeholder="Mensagem">
            <button onclick="sendMessage()">Enviar</button>
        </div>
    `;

    updatePlayerList(players);
}

function updatePlayerList(players) {
    const div = document.getElementById("players");

    div.innerHTML = `
        <h3>Jogadores</h3>
        ${players.map(p => `
            <div>${p.name} ${p.dead ? "☠️" : ""}</div>
        `).join("")}
    `;
}

function startGame() {
    socket.emit("startGame", roomCode);
}

socket.on("role", (role) => {
    showRole(role);
});

function showRole(role) {

    let color = "#fff";

    if(role === "Assassino") color = "red";
    if(role === "Detetive") color = "skyblue";
    if(role === "Médico") color = "lime";

    app.innerHTML = `
        <div class="roleScreen">
            <h1 style="color:${color}">${role}</h1>

            <button onclick="backToLobby()">Continuar</button>
        </div>
    `;
}

function backToLobby() {
    renderLobby([]);
}

function sendMessage() {

    if(isDead) {
        alert("Jogadores mortos não podem falar.");
        return;
    }

    const input = document.getElementById("chatInput");

    socket.emit("chat", {
        room: roomCode,
        player: playerName,
        message: input.value
    });

    input.value = "";
}

socket.on("chat", (data) => {

    const chat = document.getElementById("chat");

    if(!chat) return;

    chat.innerHTML += `
        <div>
            <b>${data.player}:</b> ${data.message}
        </div>
    `;
});

socket.on("playerEliminated", (player) => {

    if(player === playerName) {

        isDead = true;

        app.innerHTML = `
            <div class="deathScreen">
                <h1>VOCÊ MORREU ☠️</h1>

                <button onclick="backToLobby()">
                    Assistir Partida
                </button>
            </div>
        `;
    }
});

socket.on("voting", (players) => {

    app.innerHTML = `
        <div class="voting">
            <h1>VOTAÇÃO</h1>

            ${players.map(p => `
                <button onclick="votePlayer('${p.name}')">
                    ${p.name}
                </button>
            `).join("")}
        </div>
    `;
});

function votePlayer(name) {
    socket.emit("vote", {
        room: roomCode,
        target: name
    });
}