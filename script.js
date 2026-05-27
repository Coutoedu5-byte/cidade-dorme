
const socket = io();

let currentRoom = "";
let currentRole = "";
let isDead = false;

function createRoom(){
const name = document.getElementById("playerName").value;

if(!name) return alert("Digite seu nome");

socket.emit("createRoom",name);
}

function joinRoom(){
const room = prompt("Digite o código da sala");
const name = document.getElementById("playerName").value;

socket.emit("joinRoom",{room,name});
}

socket.on("roomCreated",(room)=>{
currentRoom = room;

document.getElementById("menuScreen").classList.add("hidden");
document.getElementById("lobbyScreen").classList.remove("hidden");

document.getElementById("roomCode").innerText = room;
});

socket.on("updatePlayers",(players)=>{

const ul = document.getElementById("players");
ul.innerHTML = "";

const voteArea = document.getElementById("votePlayers");
voteArea.innerHTML = "";

players.forEach(player=>{

const li = document.createElement("li");
li.innerText = player.name + (player.dead ? " 💀":"");
ul.appendChild(li);

if(!player.dead){
const div = document.createElement("div");
div.className = "player-card";

div.innerHTML = `
<h3>${player.name}</h3>
<button class="vote-btn" onclick="votePlayer('${player.id}')">Votar</button>
`;

voteArea.appendChild(div);
}

});
});

function startGame(){
socket.emit("startGame",currentRoom);
}

socket.on("roleAssigned",(role)=>{

currentRole = role.name;

document.getElementById("roleScreen").classList.remove("hidden");

document.getElementById("roleTitle").innerText = role.name;
document.getElementById("roleDescription").innerText = role.description;
});

function closeRole(){
document.getElementById("roleScreen").classList.add("hidden");
}

socket.on("nightPhase",(data)=>{

document.getElementById("nightScreen").classList.remove("hidden");

const actions = document.getElementById("nightActions");
actions.innerHTML = "";

if(data.role === "Assassino"){
actions.innerHTML = "<p>Escolha alguém para eliminar.</p>";
}

if(data.role === "Médico"){
actions.innerHTML = "<p>Escolha alguém para salvar.</p>";
}

if(data.role === "Detetive"){
actions.innerHTML = "<p>Escolha alguém para investigar.</p>";
}
});

socket.on("dayPhase",()=>{
document.getElementById("nightScreen").classList.add("hidden");
document.getElementById("dayScreen").classList.remove("hidden");
});

function sendMessage(){

if(isDead) return alert("Mortos não podem conversar.");

const input = document.getElementById("messageInput");

socket.emit("sendMessage",{
room:currentRoom,
message:input.value
});

input.value = "";
}

socket.on("receiveMessage",(data)=>{
const div = document.createElement("div");
div.innerText = data.player + ": " + data.message;

document.getElementById("messages").appendChild(div);
});

function votePlayer(target){
socket.emit("votePlayer",{
room:currentRoom,
target
});
}

socket.on("eliminated",(id)=>{

if(socket.id === id){
isDead = true;

document.getElementById("eliminatedScreen").classList.remove("hidden");
}
});

socket.on("winner",(text)=>{
document.getElementById("winnerScreen").classList.remove("hidden");

document.getElementById("winnerText").innerText = text;
});
