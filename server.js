const express = require("express");
const app = express();

const http = require("http").createServer(app);

const io = require("socket.io")(http);

app.use(express.static("./"));

const rooms = {};

function randomRole() {

    const roles = [
        "Assassino",
        "Detetive",
        "Médico",
        "Cidadão"
    ];

    return roles[Math.floor(Math.random() * roles.length)];
}

io.on("connection", (socket) => {

    socket.on("createRoom", (name) => {

        const room = Math.random()
            .toString(36)
            .substring(2, 7);

        rooms[room] = {
            players: []
        };

        rooms[room].players.push({
            id: socket.id,
            name,
            dead: false
        });

        socket.join(room);

        socket.emit("roomCreated", room);

        io.to(room).emit(
            "updatePlayers",
            rooms[room].players
        );
    });

    socket.on("joinRoom", (data) => {

        if(!rooms[data.room]) {
            return;
        }

        rooms[data.room].players.push({
            id: socket.id,
            name: data.name,
            dead: false
        });

        socket.join(data.room);

        socket.emit("roomJoined", {
            room: data.room,
            players: rooms[data.room].players
        });

        io.to(data.room).emit(
            "updatePlayers",
            rooms[data.room].players
        );
    });

    socket.on("chat", (data) => {
        io.to(data.room).emit("chat", data);
    });

    socket.on("startGame", (room) => {

        const players = rooms[room].players;

        players.forEach((player) => {

            let role = randomRole();

            io.to(player.id).emit("role", role);
        });
    });

    socket.on("vote", (data) => {

        const room = rooms[data.room];

        if(!room) return;

        const target = room.players.find(
            p => p.name === data.target
        );

        if(target) {

            target.dead = true;

            io.to(data.room).emit(
                "playerEliminated",
                target.name
            );

            io.to(data.room).emit(
                "updatePlayers",
                room.players
            );
        }
    });

    socket.on("disconnect", () => {

        for(const room in rooms) {

            rooms[room].players =
                rooms[room].players.filter(
                    p => p.id !== socket.id
                );

            io.to(room).emit(
                "updatePlayers",
                rooms[room].players
            );
        }
    });
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log("Servidor rodando");
});