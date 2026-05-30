  /*
Servidor Oficial Cidade Dorme para Websim
Feito sob medida para sincronizar com o seu main.js original.
*/

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

// Libera o CORS para o Websim se conectar de fora
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const ROOMS = {}; // Banco de dados das salas em memória
const USERS = {}; // Mapeia o socket.id para o username do jogador

io.on('connection', (socket) => {
  console.log('Novo jogador conectado ao servidor:', socket.id);

  // 1. Evento de Login
  socket.on('login', (username) => {
    USERS[socket.id] = username;
    console.log(`Jogador logado: ${username}`);
  });

  // 2. Evento de Criar Sala
  socket.on('create-room', ({ roomId, password }) => {
    if (!roomId) return socket.emit('room-error', 'ID da sala inválido.');

    if (ROOMS[roomId]) {
      return socket.emit('room-error', 'Esta sala já existe!');
    }

    const username = USERS[socket.id] || "Anônimo";

    ROOMS[roomId] = {
      id: roomId,
      password: password,
      started: false,
      players: [{ id: socket.id, username: username, alive: true, role: "" }],
      nightActions: { killed: null, saved: null, readyCount: 0 }
    };

    socket.join(roomId);
    socket.emit('room-success', `Sala ${roomId} criada com sucesso!`);
    io.to(roomId).emit('room-update', ROOMS[roomId]);
    console.log(`Sala ${roomId} criada por ${username}`);
  });

  // 3. Evento de Entrar na Sala
  socket.on('join-room', ({ roomId, password }) => {
    const room = ROOMS[roomId];
    if (!room) return socket.emit('room-error', 'Sala não encontrada.');
    if (room.password !== password) return socket.emit('room-error', 'Senha incorreta.');
    if (room.started) return socket.emit('room-error', 'O jogo já começou nesta sala.');

    const username = USERS[socket.id] || "Anônimo";

    // Evita duplicar o mesmo socket na sala
    if (!room.players.find(p => p.id === socket.id)) {
      room.players.push({ id: socket.id, username: username, alive: true, role: "" });
    }

    socket.join(roomId);
    socket.emit('room-success', `Você entrou na sala ${roomId}!`);
    io.to(roomId).emit('room-update', room);
    console.log(`${username} entrou na sala ${roomId}`);
  });

  // 4. Evento de Iniciar o Jogo (Distribui as Roles)
  socket.on('start-game', (roomId) => {
    const room = ROOMS[roomId];
    if (!room) return;

    room.started = true;
    const players = room.players.filter(p => p.alive);

    if (players.length < 2) {
      return io.to(roomId).emit('room-error', 'Jogadores insuficientes para iniciar.');
    }

    // Lógica simples de distribuição de papéis (1 assassino, 1 médico, o resto cidadão)
    // Sorteia o Assassino
    const assassinIndex = Math.floor(Math.random() * players.length);
    players[assassinIndex].role = 'assassino';

    // Sorteia o Médico (garantindo que não seja o mesmo assassino se houver mais jogadores)
    let doctorIndex = Math.floor(Math.random() * players.length);
    if (players.length > 1) {
      while (doctorIndex === assassinIndex) {
        doctorIndex = Math.floor(Math.random() * players.length);
      }
    }
    players[doctorIndex].role = 'medico';

    // Define o resto como cidadão
    players.forEach((p, idx) => {
      if (idx !== assassinIndex && idx !== doctorIndex) {
        p.role = 'cidadão';
      }
    });

    // Envia a role privada para cada jogador conectado
    room.players.forEach(p => {
      io.to(p.id).emit('receive-role', p.role);
    });

    io.to(roomId).emit('room-update', room);
    console.log(`Jogo iniciado na sala ${roomId}. Roles distribuídas.`);
  });

  // 5. Ação do Assassino
  socket.on('kill-player', ({ roomId, target }) => {
    const room = ROOMS[roomId];
    if (room) room.nightActions.killed = target;
  });

  // 6. Ação do Médico
  socket.on('save-player', ({ roomId, target }) => {
    const room = ROOMS[roomId];
    if (room) room.nightActions.saved = target;
  });

  // 7. Fim da Noite (Processa os resultados)
  socket.on('finish-night', (roomId) => {
    const room = ROOMS[roomId];
    if (!room) return;

    room.nightActions.readyCount++;

    // Aguarda todos os jogadores ativos enviarem o término da animação/timeout da noite
    const activePlayersCount = room.players.filter(p => p.alive).length;
    if (room.nightActions.readyCount >= activePlayersCount) {
      const killed = room.nightActions.killed;
      const saved = room.nightActions.saved;

      // Se o alvo do assassino NÃO foi salvo pelo médico
      if (killed && killed !== saved) {
        const victim = room.players.find(p => p.username === killed);
        if (victim) victim.alive = false;
        io.to(roomId).emit('player-killed', killed);
      } else if (killed && killed === saved) {
        io.to(roomId).emit('player-saved', killed);
      }

      // Reseta ações da noite para a próxima rodada
      room.nightActions = { killed: null, saved: null, readyCount: 0 };
      io.to(roomId).emit('room-update', room);

      // Verifica condições de vitória
      checkGameOver(roomId);
    }
  });

  // Desconexão do jogador
  socket.on('disconnect', () => {
    console.log('Jogador desconectado:', socket.id);
    delete USERS[socket.id];

    // Remove o jogador de qualquer sala ativa
    for (const roomId in ROOMS) {
      const room = ROOMS[roomId];
      const index = room.players.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        room.players.splice(index, 1);
        if (room.players.length === 0) {
          delete ROOMS[roomId];
        } else {
          io.to(roomId).emit('room-update', room);
          checkGameOver(roomId);
        }
      }
    }
  });
});

// Função para validar se o jogo acabou
function checkGameOver(roomId) {
  const room = ROOMS[roomId];
  if (!room || !room.started) return;

  const alivePlayers = room.players.filter(p => p.alive);
  const assassins = alivePlayers.filter(p => p.role === 'assassino');
  const citizens = alivePlayers.filter(p => p.role !== 'assassino');

  if (assassins.length === 0) {
    io.to(roomId).emit('game-over', 'cidadão');
    room.started = false;
  } else if (assassins.length >= citizens.length) {
    io.to(roomId).emit('game-over', 'assassino');
    room.started = false;
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Cidade Dorme rodando na porta ${PORT}`);
});