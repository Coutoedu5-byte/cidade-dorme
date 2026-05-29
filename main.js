/* Cidade Dorme - Cliente Unificado Socket.io
  Contém todas as lógicas visuais, ciclos, regras de eliminação e modais originais.
*/

const nameBtn = document.getElementById('nameBtn');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const muteBtn = document.getElementById('muteBtn');
const startScreen = document.getElementById('start-screen');

let playerName = '';
window._localPlayerId = window._localPlayerId || 'p-' + Math.random().toString(36).slice(2,8);
window._lobbies = window._lobbies || {};
window._currentActiveRoomId = null;

// Conecta ao servidor hospedado no Render automaticamente
const socket = io(window.location.origin);

socket.on('game:event:relay', (packet) => {
  handleIncomingSync(packet);
});

socket.on('room:update', (room) => {
  if (room && room.id) {
    window._lobbies[room.id] = Object.assign({}, window._lobbies[room.id], room);
    window.dispatchEvent(new Event('lobbies:updated'));
  }
});

// Redireciona o sistema de emissão do jogo original para o Socket.io
function emit(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
  
  const payload = {
    type: 'sync:event',
    name,
    detail,
    source: window._localPlayerId,
    ts: Date.now()
  };

  if (socket && socket.connected) {
    socket.emit('game:event', payload);
  }
}
window.emit = emit;

function handleIncomingSync(packet) {
  if (!packet || packet.source === window._localPlayerId) return;
  
  const name = packet.name;
  const detail = packet.detail || {};
  
  if (detail.roomId) {
    if (!window._lobbies[detail.roomId]) {
      window._lobbies[detail.roomId] = { id: detail.roomId, chat: [], players: [], votes: {} };
    }
    const l = window._lobbies[detail.roomId];

    switch (name) {
      case 'room:join':
        if (detail.player && !l.players.find(p => p.id === detail.player.id)) {
          l.players.push(detail.player);
        }
        break;
      case 'lobby:chat':
        if (detail.message) {
          l.chat = l.chat || [];
          if (!l.chat.find(m => m.id === detail.message.id)) l.chat.push(detail.message);
        }
        break;
      case 'lobby:start':
        l.started = true;
        l.roundStage = 'night';
        l.isNight = true;
        break;
      case 'vote:update':
        if (detail.vote) {
          l.votes = l.votes || {};
          l.votes[detail.vote.voterId] = detail.vote.choice;
        }
        break;
      case 'daynight:toggle':
        if (typeof detail.isNight !== 'undefined') {
          l.isNight = detail.isNight;
          l.roundStage = detail.isNight ? 'night' : 'day';
        }
        break;
      case 'action:assassin':
        l.nightActions = l.nightActions || {};
        l.nightActions.killed = detail.targetId;
        break;
      case 'action:doctor':
        l.nightActions = l.nightActions || {};
        l.nightActions.saved = detail.targetId;
        break;
    }
    window.dispatchEvent(new Event('lobbies:updated'));
  }
}

// Lógicas de interface, criação e entrada de salas originais
function generateRoomCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function showModal(html) {
  const antigo = document.getElementById('modal-sheet');
  if (antigo) antigo.remove();
  const sheet = document.createElement('div');
  sheet.id = 'modal-sheet';
  Object.assign(sheet.style, {
    position: 'fixed', left: '12px', right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.95)', borderRadius: '12px', zIndex: 60, padding: '16px', color: '#fff'
  });
  sheet.innerHTML = `<div class="modal-body">${html}</div>`;
  document.body.appendChild(sheet);
  return { sheet, close: () => sheet.remove() };
}

nameBtn.addEventListener('click', () => {
  const { sheet, close } = showModal(`
    <h3>Seu Nome</h3>
    <input id="pName" placeholder="Digite seu nome" style="padding:10px; width:100%; margin:10px 0; color:#000; border-radius:6px; border:0;"/>
    <button id="btnSalvar" style="background:var(--accent); color:#fff; padding:10px; border:0; border-radius:6px; width:100%;">Salvar</button>
  `);
  sheet.querySelector('#btnSalvar').onclick = () => {
    const val = sheet.querySelector('#pName').value.trim();
    if (val) { playerName = val; close(); }
  };
});

createRoomBtn.addEventListener('click', () => {
  if (!playerName) { alert('Defina seu nome primeiro!'); return; }
  const code = generateRoomCode();
  window._currentActiveRoomId = code;
  
  const playerObj = { id: window._localPlayerId, name: playerName };
  const lobby = {
    id: code,
    name: 'Sala ' + code,
    host: playerObj,
    players: [playerObj],
    chat: [], votes: {}, roundStage: 'lobby', isNight: false, started: false
  };

  window._lobbies[code] = lobby;
  if (startScreen) startScreen.style.display = 'none';
  
  socket.emit('room:join', { roomId: code, player: playerObj });
  window.dispatchEvent(new Event('lobbies:updated'));
});

joinRoomBtn.addEventListener('click', () => {
  if (!playerName) { alert('Defina seu nome primeiro!'); return; }
  const { sheet, close } = showModal(`
    <h3>Código da Sala</h3>
    <input id="rCode" placeholder="Ex: ABCD" style="padding:10px; width:100%; margin:10px 0; color:#000; border-radius:6px; border:0; text-transform: uppercase;"/>
    <button id="btnEntrar" style="background:var(--accent); color:#fff; padding:10px; border:0; border-radius:6px; width:100%;">Entrar</button>
  `);
  
  sheet.querySelector('#btnEntrar').onclick = () => {
    const code = sheet.querySelector('#rCode').value.trim().toUpperCase();
    if (code) {
      window._currentActiveRoomId = code;
      const playerObj = { id: window._localPlayerId, name: playerName };
      
      socket.emit('room:join', { roomId: code, player: playerObj });
      if (startScreen) startScreen.style.display = 'none';
      close();
    }
  };
});

// Tela de Morte Original
function showDeathScreen(reason) {
  const overlay = document.createElement('div');
  overlay.id = 'death-overlay';
  Object.assign(overlay.style, {
    position:'fixed', inset:0, background:'#000', color:'#fff', zIndex:9999,
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px'
  });
  overlay.innerHTML = `
    <div style="text-align:center; max-width:400px">
      <h1 style="color:#d90429; font-size:42px; margin-bottom:10px">VOCÊ MORREU</h1>
      <p style="font-size:18px; color:#ccc; margin-bottom:30px">${reason || 'A cidade decidiu o seu destino.'}</p>
      <div style="display:flex; gap:10px; justify-content:center">
        <button id="deathBackLobby" style="padding:10px 14px; border-radius:10px; border:0; background:#ff6b35; color:#fff; font-weight:700">Voltar ao Lobby</button>
        <button id="deathClose" style="padding:10px 14px; border-radius:10px; border:0; background:#444; color:#fff">Fechar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#deathClose').onclick = () => overlay.remove();
}

window.addEventListener('player:eliminated', (ev) => {
  const d = ev.detail || {}; 
  if (d.playerId === window._localPlayerId) showDeathScreen(d.reason || '');
});
