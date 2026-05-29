/*
Servidor Privado Cidade Dorme para Websim
Apenas gerencia as salas, chat e votos via Socket.io.
*/

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

// Configuração de CORS vital para o Websim conseguir se conectar de fora
const io = new Server(server, {
  cors: {
    origin: "*", // Permite que o Websim acesse o servidor
    methods: ["GET", "POST"]
  }
});

const GLOBAL_ROOMS = {};

io.on('connection', (socket) => {
  console.log('Websim se conectou:', socket.id);

  // Quando um jogador entra ou cria uma sala pelo Websim
  socket.on('room:join', ({ roomId, player }) => {
    if (!roomId || !player) return;
    
    socket.join(roomId);
    socket._roomId = roomId;
    socket._playerId = player.id;

    if (!GLOBAL_ROOMS[roomId]) {
      GLOBAL_ROOMS[roomId] = {
        id: roomId,
        name: 'Sala ' + roomId,
        players: [],
        host: player,
        chat: [],
        started: false
      };
    }

    const room = GLOBAL_ROOMS[roomId];

    if (!room.players.find(p => p.id === player.id)) {
      room.players.push(player);
    }

    // Atualiza a sala no Websim
    io.to(roomId).emit('room:update', room);
    
    // Envia o evento de sincronização
    io.to(roomId).emit('game:event:relay', {
      type: 'sync:event',
      name: 'room:join',
      detail: { roomId, player, players: room.players },
      source: 'server'
    });
  });

  // Escuta o chat e ações vindas do Websim e retransmite
  socket.on('game:event', (payload) => {
    if (!payload || !payload.detail || !payload.detail.roomId) return;
    const roomId = payload.detail.roomId;

    if (GLOBAL_ROOMS[roomId]) {
      const room = GLOBAL_ROOMS[roomId];
      if (payload.name === 'lobby:chat' && payload.detail.message) {
        room.chat.push(payload.detail.message);
      }
    }

    // Retransmite para os outros jogadores no Websim
    socket.to(roomId).emit('game:event:relay', payload);
  });

  socket.on('disconnect', () => {
    const roomId = socket._roomId;
    const playerId = socket._playerId;

    if (roomId && GLOBAL_ROOMS[roomId]) {
      const room = GLOBAL_ROOMS[roomId];
      room.players = room.players.filter(p => p.id !== playerId);
      
      io.to(roomId).emit('room:update', room);
      io.to(roomId).emit('game:event:relay', {
        type: 'sync:event',
        name: 'room:leave',
        detail: { roomId, playerId },
        source: 'server'
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor do Websim rodando na porta ${PORT}`);
});