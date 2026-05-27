const socket = io();

let playerName = "";
let roomCode = "";

function createRoom() {

    playerName =
        document.getElementById("playerName").value;

    if (!playerName) {
        alert("Digite seu nome");
        return;
    }

    socket.emit("createRoom", playerName);
}

function joinRoom() {

    playerName =
        document.getElementById("playerName").value;

    if (!playerName) {
        alert("Digite seu nome");
        return;
    }

    roomCode =
        prompt("Digite o código da sala");

    if (!roomCode) return;

    socket.emit("joinRoom", {
        roomCode,
        playerName
    });
}

socket.on("roomCreated", (code) => {

    roomCode = code;

    document.getElementById("menuScreen")
        .classList.add("hidden");

    document.getElementById("lobbyScreen")
        .classList.remove("hidden");

    document.getElementById("roomCode")
        .innerText = code;

    updatePlayers([playerName]);
});

socket.on("roomJoined", (players) => {

    document.getElementById("menuScreen")
        .classList.add("hidden");

    document.getElementById("lobbyScreen")
        .classList.remove("hidden");

    updatePlayers(players);
});

function updatePlayers(players){

    const playersList =
        document.getElementById("players");

    playersList.innerHTML = "";

    players.forEach(player => {

        const li =
            document.createElement("li");

        li.innerText = player;

        playersList.appendChild(li);
    });
}

socket.on("updatePlayers", (players) => {
    updatePlayers(players);
});

socket.on("errorMessage", (msg) => {
    alert(msg);
});

function startGame(){

    alert("Partida iniciada!");

    document.getElementById("roleScreen")
        .classList.remove("hidden");

    document.getElementById("roleTitle")
        .innerText = "CIDADÃO";

    document.getElementById("roleDescription")
        .innerText =
            "Descubra quem é o assassino.";
}

function closeRole(){

    document.getElementById("roleScreen")
        .classList.add("hidden");
}