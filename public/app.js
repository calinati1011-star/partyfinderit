const socket = io();
let nickname = "player-" + Math.floor(1000 + Math.random() * 9000);
let currentLobby = null;
let gameToCreate = null;
let lobbyIsPrivate = false;

const allGames = [
  "Fortnite","Minecraft","Valorant","FIFA 17","FIFA 18","FIFA 19","FIFA 20","FIFA 21",
  "FIFA 22","FIFA 23","FIFA 24","FC25","Counter-Strike 2","Rainbow Six Siege","League of Legends",
  "Overwatch","GTA V","Among Us","PUBG","Apex Legends","Call of Duty: Warzone",
  "Rocket League","Dota 2","Starcraft II","World of Warcraft","Hearthstone",
  "Diablo IV","Elden Ring","The Witcher 3","Cyberpunk 2077","Red Dead Redemption 2",
  "Assassin’s Creed Valhalla","Far Cry 6","Battlefield V","Battlefield 2042",
  "Halo Infinite","Destiny 2","Fall Guys","TFT","Clash Royale","Clash of Clans",
  "Brawl Stars","Pokemon Unite","Monster Hunter World","Tekken 7","Street Fighter 6",
  "Mortal Kombat 11","Gran Turismo 7","Forza Horizon 5","Need for Speed Heat",
  "NBA 2K24","Madden NFL 24","Starfield","Skyrim","DayZ","Rust","ARK: Survival Evolved",
  "Sea of Thieves","Palworld","Terraria","Stardew Valley","Hollow Knight",
  "Celeste","Cuphead","Ori and the Will of the Wisps","Valheim","Escape from Tarkov"
];
const mainGames = ["Fortnite","Minecraft","Valorant"];
const gameList = document.getElementById("game-list");
const searchInput = document.getElementById("search");
const suggestions = document.getElementById("search-suggestions");
const playerListDiv = document.getElementById("player-list");
const messagesDiv = document.getElementById("messages");

function renderGameList(games) {
  gameList.innerHTML = "";
  games.forEach(game => {
    const li = document.createElement("li");
    li.dataset.game = game;
    li.className = "flex items-center justify-between bg-panelBg rounded-xl p-2 hover:bg-panelHover transition";
    li.innerHTML = `
      <span>${game}</span>
      <div class="flex gap-2">
        <button class="see-lobbies bg-neonBlue px-2 py-1 rounded-lg">Lobby</button>
        <button class="create-lobby bg-neonPink px-2 py-1 rounded-lg">+ Lobby</button>
      </div>
    `;
    gameList.appendChild(li);

    li.querySelector(".create-lobby").addEventListener("click", () => {
      gameToCreate = game;
      document.getElementById("lobby-modal").classList.remove("hidden");
      document.getElementById("max-players").value = 4;
    });

    li.querySelector(".see-lobbies").addEventListener("click", () => {
      if(currentLobby){
        alert("Sei già in una lobby! Esci prima di entrare in un'altra.");
        return;
      }
      socket.emit("getLobbies", game);
    });
  });
}
renderGameList(mainGames);

searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  suggestions.innerHTML = "";
  if (!q) {
    suggestions.classList.add("hidden");
    renderGameList(mainGames);
    return;
  }
  const filtered = allGames.filter(g => g.toLowerCase().includes(q));
  if (filtered.length === 0) {
    suggestions.classList.add("hidden");
    renderGameList([]);
    return;
  }
  filtered.forEach(game => {
    const li = document.createElement("li");
    li.className = "px-3 py-2 hover:bg-panelHover cursor-pointer rounded-xl";
    li.innerText = game;
    li.addEventListener("click", () => {
      searchInput.value = game;
      suggestions.classList.add("hidden");
      renderGameList([game]);
    });
    suggestions.appendChild(li);
  });
  suggestions.classList.remove("hidden");
});

document.addEventListener("click", e => {
  if (!searchInput.contains(e.target)) suggestions.classList.add("hidden");
});

const privateBtn = document.getElementById("private-toggle-btn");
const privateIcon = document.getElementById("private-icon");
const privateLabel = document.getElementById("private-label");
privateBtn.addEventListener("click", () => {
  lobbyIsPrivate = !lobbyIsPrivate;
  if (lobbyIsPrivate) {
    privateBtn.classList.remove("bg-slate-700","hover:bg-slate-600");
    privateBtn.classList.add("bg-red-600","hover:bg-red-500");
    privateIcon.innerText = "🔒";
    privateLabel.innerText = "Lobby privata";
  } else {
    privateBtn.classList.remove("bg-red-600","hover:bg-red-500");
    privateBtn.classList.add("bg-slate-700","hover:bg-slate-600");
    privateIcon.innerText = "🔓";
    privateLabel.innerText = "Lobby pubblica";
  }
});

document.getElementById("cancel-lobby").addEventListener("click", () => {
  document.getElementById("lobby-modal").classList.add("hidden");
  gameToCreate = null;
  lobbyIsPrivate = false;
});

document.getElementById("confirm-lobby").addEventListener("click", () => {
  const maxPlayers = parseInt(document.getElementById("max-players").value);
  if (!maxPlayers || maxPlayers < 1 || maxPlayers > 8) {
    alert("Numero giocatori non valido (1-8)");
    return;
  }
  socket.emit("createLobby", {
    game: gameToCreate,
    maxPlayers,
    host: nickname,
    private: lobbyIsPrivate
  }, lobbyId => { currentLobby = lobbyId; });
  document.getElementById("lobby-modal").classList.add("hidden");
  gameToCreate = null;
  lobbyIsPrivate = false;
});

socket.on("lobbyList", lobbies => {
  const list = document.getElementById("lobby-list");
  list.innerHTML = "";
  list.classList.remove("hidden");
  if (lobbies.length === 0) {
    list.innerHTML = "<p class='text-sm text-slate-400'>Nessuna lobby disponibile.</p>";
    return;
  }
  lobbies.forEach(lobby => {
    const div = document.createElement("div");
    div.className = "p-3 bg-panelBg rounded-xl flex justify-between items-center transition hover:bg-panelHover";
    const lockIcon = lobby.private ? "🔒 " : "";
    div.innerHTML = `
      <span>${lockIcon}${lobby.host}'s Lobby — ${lobby.players.length}/${lobby.maxPlayers}</span>
      <button class="px-3 py-1 rounded-xl bg-neonBlue hover:bg-neonPink">Entra</button>
    `;
    div.querySelector("button").addEventListener("click", () => {
      if(currentLobby){
        alert("Sei già in una lobby! Esci prima di entrare in un'altra.");
        return;
      }
      socket.emit("joinLobby", lobby.id, nickname);
    });
    list.appendChild(div);
  });
});

socket.on("joinedLobby", lobby => {
  currentLobby = lobby.id;
  document.getElementById("room-title").innerText = `Lobby di ${lobby.host} — ${lobby.game}`;
  document.getElementById("messages").innerHTML = "";
  if (lobby.messages) lobby.messages.forEach(m => appendMessage(m.nickname, m.msg));
  document.getElementById("msg").disabled = false;
  document.querySelector("#send-form button").disabled = false;
  document.getElementById("leave-lobby").classList.remove("hidden");
  document.getElementById("user-count").innerText = `${lobby.players.length}/${lobby.maxPlayers}`;
  updatePlayerList(lobby);
  document.getElementById("sound-join").play();
});

document.getElementById("leave-lobby").addEventListener("click", () => {
  if (!currentLobby) return;
  socket.emit("leaveLobby", currentLobby, nickname);
  currentLobby = null;
  document.getElementById("room-title").innerText = "Nessuna stanza";
  document.getElementById("messages").innerHTML = "";
  document.getElementById("msg").disabled = true;
  document.querySelector("#send-form button").disabled = true;
  document.getElementById("leave-lobby").classList.add("hidden");
  document.getElementById("user-count").innerText = "";
  playerListDiv.innerHTML = "";
});

function updatePlayerList(lobby) {
  playerListDiv.innerHTML = "";
  lobby.players.forEach(p => {
    const span = document.createElement("span");
    span.className = "px-3 py-1 bg-panelHover rounded-full flex items-center gap-2 cursor-pointer";
    span.innerHTML = p.name || "Anonimo";
    if (lobby.host === p.name) {
      span.innerHTML += " <span class='text-yellow-400 font-bold'>👑 Host</span>";
    }
    span.addEventListener("click", () => showProfile(p.name));
    playerListDiv.appendChild(span);
  });
}

function showProfile(name) {
  socket.emit("getProfile", name, data => {
    document.getElementById("profile-nickname").innerText = name;
    document.getElementById("profile-lobbies").innerText = `Lobby partecipate: ${data.lobbies}`;
    document.getElementById("profile-messages").innerText = `Messaggi inviati: ${data.messages}`;
    document.getElementById("profile-modal").classList.remove("hidden");
  });
}

document.getElementById("close-profile").addEventListener("click", () => {
  document.getElementById("profile-modal").classList.add("hidden");
});

document.getElementById("send-form").addEventListener("submit", e => {
  e.preventDefault();
  const msg = document.getElementById("msg").value.trim();
  if (!msg || !currentLobby) return;
  socket.emit("chatMessage", { lobbyId: currentLobby, nickname, msg });
  document.getElementById("msg").value = "";
});

function appendMessage(nick, msg) {
  const div = document.createElement("div");
  div.className = "bg-panelHover px-3 py-2 rounded-xl";
  div.innerHTML = `<b>${nick || "Anonimo"}:</b> ${msg}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  document.getElementById("sound-message").play();
}

socket.on("chatMessage", data => {
  appendMessage(data.nickname, data.msg);
});

socket.on("lobbyUpdate", lobby => {
  if (currentLobby === lobby.id) {
    document.getElementById("user-count").innerText =
      `${lobby.players.length}/${lobby.maxPlayers}`;
    updatePlayerList(lobby);
  }
  socket.emit("getLobbies", lobby.game);
});

// registra nickname al login
socket.emit("registerUser", nickname);
