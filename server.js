const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

let salas = {};

io.on('connection', (socket) => {
    // Quando um jogador cria uma sala
    socket.on('criar_sala', (codigoSala) => {
        salas[codigoSala] = { jogadores: [{ id: socket.id, nome: 'Host' }] };
        socket.join(codigoSala);
        socket.emit('sala_atualizada', salas[codigoSala]);
    });

    // Quando alguém tenta entrar
    socket.on('entrar_sala', ({ codigoSala, nome }) => {
        if (salas[codigoSala]) {
            salas[codigoSala].jogadores.push({ id: socket.id, nome: nome });
            socket.join(codigoSala);
            io.to(codigoSala).emit('sala_atualizada', salas[codigoSala]);
        } else {
            socket.emit('erro', 'Sala não encontrada!');
        }
    });

    socket.on('disconnect', () => {
        // Lógica simples para limpar salas vazias depois
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
