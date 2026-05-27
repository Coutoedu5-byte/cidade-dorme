const express = require("express");

const app = express();

const http =
require("http").createServer(app);

const io =
require("socket.io")(http);

app.use(express.static(__dirname));

const rooms = {};

/* GERAR CÓDIGO */
function generateCode(){

    return Math.random()
        .toString(36)
        .substring(2,7)
        .toUpperCase();
}

/* EMBARALHAR */
function shuffle(array){

    for(let i = array.length - 1; i > 0; i--){

        const j =
            Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] =
            [array[j], array[i]];
    }

    return array;
}

io.on("connection", (socket) => {

    /* CRIAR SALA */
    socket.on("createRoom", (playerName) => {

        const code = generateCode();

        rooms[code] = {
            players: []
        };

        rooms[code].players.push({
            id: socket.id,
            name: playerName
        });

        socket.join(code);

        socket.roomCode = code;

        /* AVISA HOST */
        io.to(socket.id)
            .emit("roomCreated", code);

        /* ATUALIZA JOGADORES */
        io.to(code)
            .emit(
                "updatePlayers",
                rooms[code].players.map(
                    p => p.name
                )
            );
    });

    /* ENTRAR SALA */
    socket.on("joinRoom", ({
        roomCode,
        playerName
    }) => {

        roomCode =
            roomCode.toUpperCase();

        /* SALA NÃO EXISTE */
        if(!rooms[roomCode]){

            io.to(socket.id)
                .emit(
                    "errorMessage",
                    "Sala não encontrada"
                );

            return;
        }

        /* ADICIONA JOGADOR */
        rooms[roomCode].players.push({
            id: socket.id,
            name: playerName
        });

        socket.join(roomCode);

        socket.roomCode = roomCode;

        /* AVISA O JOGADOR */
        io.to(socket.id)
            .emit("roomJoined");

        /* ATUALIZA TODOS */
        io.to(roomCode)
            .emit(
                "updatePlayers",
                rooms[roomCode].players.map(
                    p => p.name
                )
            );
    });

    /* INICIAR PARTIDA */
    socket.on("startGame", () => {

        const roomCode =
            socket.roomCode;

        const room =
            rooms[roomCode];

        if(!room) return;

        const totalPlayers =
            room.players.length;

        /* MÍNIMO */
        if(totalPlayers < 4){

            io.to(socket.id)
                .emit(
                    "errorMessage",
                    "Mínimo de 4 jogadores"
                );

            return;
        }

        /* CARGOS */
        const roles = [

            "assassino",
            "assassino",
            "medico",
            "detetive"

        ];

        /* RESTO = CIDADÃO */
        while(roles.length < totalPlayers){

            roles.push("cidadao");
        }

        /* EMBARALHA */
        shuffle(roles);

        /* ENTREGA CARTAS */
        room.players.forEach((player, index) => {

            io.to(player.id)
                .emit(
                    "receiveRole",
                    roles[index]
                );
        });
    });

    /* DESCONECTAR */
    socket.on("disconnect", () => {

        for(const code in rooms){

            rooms[code].players =
                rooms[code].players.filter(
                    p => p.id !== socket.id
                );

            /* ATUALIZA */
            io.to(code)
                .emit(
                    "updatePlayers",
                    rooms[code].players.map(
                        p => p.name
                    )
                );

            /* REMOVE SALA VAZIA */
            if(
                rooms[code].players.length === 0
            ){
                delete rooms[code];
            }
        }
    });

});

http.listen(
    process.env.PORT || 3000,
    () => {
        console.log("Servidor rodando");
    }
);