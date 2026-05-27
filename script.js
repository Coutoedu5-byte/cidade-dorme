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

    document.getElementById("roleScreen")
        .classList.remove("hidden");

    const roleTitle =
        document.getElementById("roleTitle");

    const roleDescription =
        document.getElementById("roleDescription");

    const roleImage =
        document.getElementById("roleImage");

    // LISTA DE CARTAS
    const roles = [

        {
            nome: "ASSASSINO",
            imagem: "/public/assassino.png.PNG",
            descricao:
            "Elimine todos sem ser descoberto."
        },

        {
            nome: "DETETIVE",
            imagem: "/public/detetive.png.PNG",
            descricao:
            "Descubra quem é o assassino."
        },

        {
            nome: "MÉDICO",
            imagem: "/public/medico.png.PNG",
            descricao:
            "Salve um jogador por noite."
        },

        {
            nome: "CIDADÃO",
            imagem: "/public/cidadão.png.PNG",
            descricao:
            "Encontre o assassino."
        }

    ];

    // SORTEIA UMA CARTA
    const randomRole =
        roles[Math.floor(Math.random() * roles.length)];

    // MOSTRA NOME
    roleTitle.innerText =
        randomRole.nome;

    // MOSTRA DESCRIÇÃO
    roleDescription.innerText =
        randomRole.descricao;

    // MOSTRA IMAGEM
    roleImage.src =
        randomRole.imagem;
}

function closeRole(){

    document.getElementById("roleScreen")
        .classList.add("hidden");
}