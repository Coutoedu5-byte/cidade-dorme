const socket = io();

let playerName = "";
let roomCode = "";

/* ELEMENTOS */
const menuScreen =
    document.getElementById("menuScreen");

const lobbyScreen =
    document.getElementById("lobbyScreen");

const roleScreen =
    document.getElementById("roleScreen");

/* MOSTRAR TELA */
function showScreen(screen){

    menuScreen.classList.add("hidden");
    lobbyScreen.classList.add("hidden");
    roleScreen.classList.add("hidden");

    screen.classList.remove("hidden");
}

/* CRIAR SALA */
function createRoom(){

    playerName =
        document.getElementById("playerName").value;

    if(!playerName){

        alert("Digite seu nome");
        return;
    }

    socket.emit(
        "createRoom",
        playerName
    );
}

/* ENTRAR SALA */
function joinRoom(){

    playerName =
        document.getElementById("playerName").value;

    if(!playerName){

        alert("Digite seu nome");
        return;
    }

    roomCode =
        prompt("Digite o código da sala");

    if(!roomCode) return;

    socket.emit("joinRoom", {

        roomCode,
        playerName
    });
}

/* SALA CRIADA */
socket.on("roomCreated", (code) => {

    roomCode = code;

    document.getElementById("roomCode")
        .innerText = code;

    showScreen(lobbyScreen);
});

/* ENTROU NA SALA */
socket.on("roomJoined", (code) => {

    roomCode = code;

    document.getElementById("roomCode")
        .innerText = code;

    showScreen(lobbyScreen);
});

/* ATUALIZA JOGADORES */
socket.on("updatePlayers", (players) => {

    const playersList =
        document.getElementById("players");

    playersList.innerHTML = "";

    players.forEach(player => {

        const li =
            document.createElement("li");

        li.innerText = player;

        playersList.appendChild(li);
    });
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

    showScreen(roleScreen);

    const roleTitle =
        document.getElementById("roleTitle");

    const roleDescription =
        document.getElementById("roleDescription");

    const roleImage =
        document.getElementById("roleImage");

    if(role === "assassino"){

        roleTitle.innerText =
            "ASSASSINO";

        roleDescription.innerText =
            "Elimine todos sem ser descoberto.";

        roleImage.src =
            "/assassino.png.PNG";
    }

    else if(role === "detetive"){

        roleTitle.innerText =
            "DETETIVE";

        roleDescription.innerText =
            "Descubra quem é o assassino.";

        roleImage.src =
            "/detetive.png.PNG";
    }

    else if(role === "medico"){

        roleTitle.innerText =
            "MÉDICO";

        roleDescription.innerText =
            "Salve um jogador por noite.";

        roleImage.src =
            "/medico.png.PNG";
    }

    else{

        roleTitle.innerText =
            "CIDADÃO";

        roleDescription.innerText =
            "Encontre o assassino.";

        roleImage.src =
            "/cidadao.png.PNG";
    }
});

/* FECHAR CARTA */
function closeRole(){

    roleScreen.classList.add("hidden");
}