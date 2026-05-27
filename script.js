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

    // CARTAS
    const roles = [

        {
            nome: "ASSASSINO",
            imagem: "/assassino.png.PNG",
            descricao: "Elimine todos sem ser descoberto."
        },

        {
            nome: "DETETIVE",
            imagem: "/detetive.png.PNG",
            descricao: "Descubra quem é o assassino."
        },

        {
            nome: "MÉDICO",
            imagem: "/medico.png.PNG",
            descricao: "Salve jogadores durante a noite."
        },

        {
            nome: "CIDADÃO",
            imagem: "/cidadão.png.PNG",
            descricao: "Encontre o assassino."
        }

    ];

    // SORTEIA CARTA
    const randomRole =
        roles[Math.floor(Math.random() * roles.length)];

    // TÍTULO
    document.getElementById("roleTitle")
        .innerText = randomRole.nome;

    // DESCRIÇÃO
    document.getElementById("roleDescription")
        .innerText = randomRole.descricao;

    // IMAGEM
    const roleImage =
        document.getElementById("roleImage");

    roleImage.src = randomRole.imagem;
}

function closeRole(){

    document.getElementById("roleScreen")
        .classList.add("hidden");
}