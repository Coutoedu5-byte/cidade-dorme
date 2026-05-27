const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname));

const rooms = {};

function generateCode() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

io.on("connection", (socket) => {

    socket.on("createRoom", (playerName) => {

        const code = generateCode();

        rooms[code] = {
            players: [playerName]
        };

        socket.join(code);

        socket.roomCode = code;

        io.to(socket.id).emit("roomCreated", code);
    });

    socket.on("joinRoom", ({ roomCode, playerName }) => {

        if (!rooms[roomCode]) {
            io.to(socket.id).emit("errorMessage", "Sala não encontrada");
            return;
        }

        rooms[roomCode].players.push(playerName);

        socket.join(roomCode);

        io.to(roomCode).emit(
            "roomJoined",
            rooms[roomCode].players
        );
    });

});

http.listen(process.env.PORT || 3000, () => {
    console.log("Servidor rodando");
});