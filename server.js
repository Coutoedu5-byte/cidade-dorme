/*
Servidor Unificado Cidade Dorme (Socket.io + Express)
Hospeda o jogo visual e sincroniza os celulares em tempo real usando ES Modules.
*/

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// Entrega os arquivos visuais (index.html, main.js, styles.css) automaticamente
app.use(express.static(__dirname));

// Banco de dados em memória para as salas
const GLOBAL_ROOMS = {};

io.on('connection', (socket) => {
  console.log('Novo dispositivo conectado:', socket.id);

  // Quando um jogador entra ou cria uma sala
  socket.on('room:join', ({ roomId, player }) => {
    if (!roomId || !player) return;
    
    socket.join(roomId);
    socket._roomId = roomId;
    socket._playerId = player.id;

    // Se a sala não existe no servidor, cria ela
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

    // Adiciona o jogador se ele não estiver lá
    if (!room.players.find(p => p.id === player.id)) {
      room.players.push(player);
    }

    console.log(`Jogador ${player.name} entrou na sala ${roomId}`);

    // Avisa todo mundo da sala sobre a atualização do lobby
    io.to(roomId).emit('room:update', room);
    
    // Envia um evento em formato relay para compatibilidade do main.js
    io.to(roomId).emit('game:event:relay', {
      type: 'sync:event',
      name: 'room:join',
      detail: { roomId, player, players: room.players },
      source: 'server'
    });
  });

  // Escuta os eventos gerais enviados pelos botões e ações do jogo (chat, votos, iniciar)
  socket.on('game:event', (payload) => {
    if (!payload || !payload.detail || !payload.detail.roomId) return;
    const roomId = payload.detail.roomId;

    // Atualiza o estado do servidor dependendo do evento
    if (GLOBAL_ROOMS[roomId]) {
      const room = GLOBAL_ROOMS[roomId];
      
      if (payload.name === 'lobby:chat' && payload.detail.message) {
        room.chat.push(payload.detail.message);
      }
      if (payload.name === 'lobby:start') {
        room.started = true;
      }
    }

    // Retransmite o evento em tempo real para todos os outros celulares na sala
    socket.to(roomId).emit('game:event:relay', payload);
  });

  socket.on('disconnect', () => {
    console.log('Dispositivo desconectado:', socket.id);
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});