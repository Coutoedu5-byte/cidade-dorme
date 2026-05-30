/*
Servidor Espelho Oficial Cidade Dorme para Websim
Sincroniza perfeitamente com a lógica nativa do main.js
*/

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

// Libera totalmente o CORS para o Websim conseguir se conectar de fora
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const GLOBAL_ROOMS = {};

io.on('connection', (socket) => {
  console.log('Cliente Websim conectado ao Render:', socket.id);

  // 1. Escuta exatamente o evento de entrar na sala que o seu main.js envia
  socket.on('room:join', (data) => {
    if (!data || !data.roomId) return;
    
    const roomId = data.roomId;
    const player = data.player || { id: socket.id, name: 'Anônimo' };

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
        votes: {},
        roundStage: 'lobby',
        started: false
      };
    }

    const room = GLOBAL_ROOMS[roomId];

    // Evita duplicar o mesmo jogador
    if (!room.players.find(p => p.id === player.id)) {
      room.players.push(player);
    }

    console.log(`Jogador ${player.name} entrou na sala ${roomId}`);

    // Devolve a sala atualizada no formato que o seu main.js espera escutar
    io.to(roomId).emit('room:update', room);
    
    // Dispara o Relay idêntico ao sistema de Broadcast do Websim
    io.to(roomId).emit('game:event:relay', {
      type: 'sync:event',
      name: 'room:join',
      detail: { roomId, player, players: room.players },
      source: 'server'
    });
  });

  // 2. Intercepta todas as jogadas, chat, votos e cliques do seu main.js
  socket.on('game:event', (payload) => {
    if (!payload || !payload.detail) return;
    
    const roomId = payload.detail.roomId || socket._roomId;
    if (!roomId) return;

    // Sincroniza o estado interno da sala no Render para novos jogadores não entrarem perdidos
    if (GLOBAL_ROOMS[roomId]) {
      const room = GLOBAL_ROOMS[roomId];
      
      if (payload.name === 'lobby:chat' && payload.detail.message) {
        room.chat.push(payload.detail.message);
      }
      if (payload.name === 'lobby:start') {
        room.started = true;
        room.roundStage = 'night';
      }
      if (payload.name === 'vote:update' && payload.detail.vote) {
        room.votes = room.votes || {};
        room.votes[payload.detail.vote.voterId] = payload.detail.vote.choice;
      }
    }

    // Envia o exato comando (Relay) para os outros celulares na sala
    socket.to(roomId).emit('game:event:relay', payload);
  });

  // 3. Trata a saída ou queda de conexão do jogador
  socket.on('disconnect', () => {
    const roomId = socket._roomId;
    const playerId = socket._playerId;

    if (roomId && GLOBAL_ROOMS[roomId]) {
      const room = GLOBAL_ROOMS[roomId];
      room.players = room.players.filter(p => p.id !== playerId);
      
      if (room.players.length === 0) {
        delete GLOBAL_ROOMS[roomId];
        console.log(`Sala ${roomId} esvaziou e foi removida.`);
      } else {
        if (room.host && room.host.id === playerId) {
          room.host = room.players[0];
        }
        io.to(roomId).emit('room:update', room);
        io.to(roomId).emit('game:event:relay', {
          type: 'sync:event',
          name: 'room:leave',
          detail: { roomId, playerId },
          source: 'server'
        });
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Espelho sincronizado na porta ${PORT}`);
});