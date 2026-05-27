const socket = io();

let playerName = "";
let roomCode = "";

function createRoom() {
    playerName = document.getElementById("playerName").value;

    if (!playerName) {
        alert("Digite seu nome");
        return;
    }

    socket.emit("createRoom", playerName);
}

function joinRoom() {
    playerName = document.getElementById("playerName").value;

    if (!playerName) {
        alert("Digite seu nome");
        return;
    }

    roomCode = prompt("Digite o código da sala");

    if (!roomCode) return;

    socket.emit("joinRoom", {
        roomCode,
        playerName
    });
}

socket.on("roomCreated", (code) => {
    roomCode = code;

    document.body.innerHTML = `
        <div style="padding:20px;color:white">
            <h1>Sala criada</h1>
            <h2>Código: ${code}</h2>
            <p>Aguardando jogadores...</p>
        </div>
    `;
});

socket.on("roomJoined", (players) => {
    document.body.innerHTML = `
        <div style="padding:20px;color:white">
            <h1>Sala: ${roomCode}</h1>
            <h2>Jogadores:</h2>
            ${players.map(p => `<p>${p}</p>`).join("")}
        </div>
    `;
});

socket.on("errorMessage", (msg) => {
    alert(msg);
});
function startGame(){
    alert("Partida iniciada!");
}