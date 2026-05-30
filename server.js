import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const server = createServer();
const wss = new WebSocketServer({ server });

const ROOMS = {}; 
const USERS = {}; 

wss.on('connection', (ws) => {
  console.log('Novo dispositivo conectado via WebSocket Puro');

  ws.on('message', (message) => {
    try {
      const packet = JSON.parse(message);
      const { event, data } = packet;

      // 1. LOGIN
      if (event === 'login') {
        USERS[ws.id = Math.random().toString()] = data;
        console.log(`Jogador logado: ${data}`);
      }

      // 2. CRIAR SALA
      if (event === 'create-room') {
        const { roomId, password } = data;
        if (ROOMS[roomId]) {
          return ws.send(JSON.stringify({ event: 'room-error', data: 'Esta sala já existe!' }));
        }

        ws.roomId = roomId;
        ROOMS[roomId] = {
          id: roomId,
          password: password,
          started: false,
          players: [{ id: ws.id, username: USERS[ws.id] || "Anônimo", alive: true, role: "" }]
        };

        ws.send(JSON.stringify({ event: 'room-success', data: `Sala ${roomId} criada!` }));
        broadcastToRoom(roomId, 'room-update', ROOMS[roomId]);
      }

      // 3. ENTRAR NA SALA
      if (event === 'join-room') {
        const { roomId, password } = data;
        const room = ROOMS[roomId];
        if (!room) return ws.send(JSON.stringify({ event: 'room-error', data: 'Sala não encontrada.' }));
        if (room.password !== password) return ws.send(JSON.stringify({ event: 'room-error', data: 'Senha incorreta.' }));

        ws.roomId = roomId;
        if (!room.players.find(p => p.id === ws.id)) {
          room.players.push({ id: ws.id, username: USERS[ws.id] || "Anônimo", alive: true, role: "" });
        }

        ws.send(JSON.stringify({ event: 'room-success', data: `Você entrou na sala ${roomId}!` }));
        broadcastToRoom(roomId, 'room-update', room);
      }

      // 4. INICIAR JOGO
      if (event === 'start-game') {
        const roomId = data;
        const room = ROOMS[roomId];
        if (!room) return;

        room.started = true;
        // Distribuição simples: primeiro assassino, segundo médico, resto cidadão
        room.players.forEach((p, idx) => {
          if (idx === 0) p.role = 'assassino';
          else if (idx === 1) p.role = 'medico';
          else p.role = 'cidadão';
        });

        // Envia as roles individualmente para cada conexão daquela sala
        for (const client of wss.clients) {
          if (client.roomId === roomId) {
            const pData = room.players.find(p => p.id === client.id);
            if (pData) client.send(JSON.stringify({ event: 'receive-role', data: pData.role }));
          }
        }
        broadcastToRoom(roomId, 'room-update', room);
      }

    } catch (err) {
      console.error('Erro ao processar mensagem:', err);
    }
  });

  ws.on('close', () => {
    const roomId = ws.roomId;
    if (roomId && ROOMS[roomId]) {
      ROOMS[roomId].players = ROOMS[roomId].players.filter(p => p.id !== ws.id);
      if (ROOMS[roomId].players.length === 0) {
        delete ROOMS[roomId];
      } else {
        broadcastToRoom(roomId, 'room-update', ROOMS[roomId]);
      }
    }
    delete USERS[ws.id];
  });
});

function broadcastToRoom(roomId, event, data) {
  const payload = JSON.stringify({ event, data });
  for (const client of wss.clients) {
    if (client.roomId === roomId && client.readyState === 1) {
      client.send(payload);
    }
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));