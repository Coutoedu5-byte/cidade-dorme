const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("./"));

io.on("connection", (socket) => {
    console.log("Jogador conectado");

    socket.on("chat", (msg) => {
        io.emit("chat", msg);
    });

    socket.on("disconnect", () => {
        console.log("Jogador desconectado");
    });
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log("Servidor rodando");
});