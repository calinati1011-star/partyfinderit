const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let lobbies = [];
let userStats = {}; // { nickname: { lobbies: x, messages: y } }

io.on("connection", socket => {
  let currentUser = null;

  socket.on("registerUser", name => {
    currentUser = name;
    if (!userStats[name]) userStats[name] = { lobbies: 0, messages: 0 };
  });

  socket.on("createLobby", (data, cb) => {
    const id = Math.random().toString(36).substr(2, 9);
    const lobby = { id, game: data.game, host: data.host, maxPlayers: data.maxPlayers, private: data.private, players: [{ name: data.host }], messages: [] };
    lobbies.push(lobby);
    if (!userStats[data.host]) userStats[data.host] = { lobbies: 0, messages: 0 };
    userStats[data.host].lobbies++;
    cb(id);
    io.emit("lobbyList", lobbies.filter(l => l.game === data.game));
    socket.join(id);
    socket.emit("joinedLobby", lobby);
  });

  socket.on("getLobbies", game => {
    io.to(socket.id).emit("lobbyList", lobbies.filter(l => l.game === game));
  });

  socket.on("joinLobby", (lobbyId, name) => {
    const lobby = lobbies.find(l => l.id === lobbyId);
    if (!lobby) return;
    if (lobby.players.find(p => p.name === name)) return;
    if (lobby.players.length >= lobby.maxPlayers) return;
    lobby.players.push({ name });
    if (!userStats[name]) userStats[name] = { lobbies: 0, messages: 0 };
    userStats[name].lobbies++;
    socket.join(lobbyId);
    io.to(lobbyId).emit("joinedLobby", lobby);
    io.to(lobbyId).emit("lobbyUpdate", lobby);
    io.emit("lobbyList", lobbies.filter(l => l.game === lobby.game));
  });

  socket.on("chatMessage", ({ lobbyId, nickname, msg }) => {
    const lobby = lobbies.find(l => l.id === lobbyId);
    if (!lobby) return;
    lobby.messages.push({ nickname, msg });
    if (!userStats[nickname]) userStats[nickname] = { lobbies: 0, messages: 0 };
    userStats[nickname].messages++;
    io.to(lobbyId).emit("chatMessage", { nickname, msg });
  });

  socket.on("getProfile", (name, cb) => {
    if (!userStats[name]) userStats[name] = { lobbies: 0, messages: 0 };
    cb(userStats[name]);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
