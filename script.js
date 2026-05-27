const socket = io();

let playerName = "";
let roomCode = "";
let isHost = false;

/* CRIAR SALA */
function createRoom() {

    playerName =
        document.getElementById("playerName").value;

    if (!playerName) {

        alert("Digite seu nome");
        return;
    }

    socket.emit("createRoom", playerName);
}

/* ENTRAR SALA */
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

/* SALA CRIADA */
socket.on("roomCreated", (code) => {

    isHost = true;

    roomCode = code;

    document.getElementById("menuScreen")
        .classList.add("hidden");

    document.getElementById("lobbyScreen")
        .classList.remove("hidden");

    document.getElementById("roomCode")
        .innerText = code;
});

/* ENTROU NA SALA */
socket.on("roomJoined", () => {

    document.getElementById("menuScreen")
        .classList.add("hidden");

    /* CRIADOR */
    if(isHost){

        document.getElementById("lobbyScreen")
            .classList.remove("hidden");
    }

    /* JOGADOR */
    else{

        document.getElementById("waitingScreen")
            .classList.remove("hidden");
    }
});

/* ATUALIZA JOGADORES */
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

/* ERRO */
socket.on("errorMessage", (msg) => {

    alert(msg);
});

/* INICIAR PARTIDA */
function startGame(){

    socket.emit("startGame");
}

/* RECEBER CARGO */
socket.on("receiveRole", (role) => {

    /* ESCONDE TELAS */
    document.getElementById("waitingScreen")
        .classList.add("hidden");

    document.getElementById("lobbyScreen")
        .classList.add("hidden");

    /* MOSTRA CARTA */
    document.getElementById("roleScreen")
        .classList.remove("hidden");

    const roleTitle =
        document.getElementById("roleTitle");

    const roleDescription =
        document.getElementById("roleDescription");

    const roleImage =
        document.getElementById("roleImage");

    /* ASSASSINO */
    if(role === "assassino"){

        roleTitle.innerText =
            "ASSASSINO";

        roleDescription.innerText =
            "Elimine todos sem ser descoberto.";

        roleImage.src =
            "/public/assassino.png.PNG";
    }

    /* DETETIVE */
    else if(role === "detetive"){

        roleTitle.innerText =
            "DETETIVE";

        roleDescription.innerText =
            "Descubra quem é o assassino.";

        roleImage.src =
            "/public/detetive.png.PNG";
    }

    /* MÉDICO */
    else if(role === "medico"){

        roleTitle.innerText =
            "MÉDICO";

        roleDescription.innerText =
            "Salve um jogador por noite.";

        roleImage.src =
            "/public/medico.png.PNG";
    }

    /* CIDADÃO */
    else{

        roleTitle.innerText =
            "CIDADÃO";

        roleDescription.innerText =
            "Encontre o assassino.";

        roleImage.src =
            "/public/cidadao.png.PNG";
    }
});

/* FECHAR CARTA */
function closeRole(){

    document.getElementById("roleScreen")
        .classList.add("hidden");
}