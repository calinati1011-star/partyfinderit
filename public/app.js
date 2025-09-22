const socket = io();
let nickname = "player-" + Math.floor(1000 + Math.random() * 9000);
let currentLobby = null;
let gameToCreate = null;

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

const els = {
  gameList: document.getElementById("game-list"),
  search: document.getElementById("search"),
  suggestions: document.getElementById("search-suggestions"),
  playerList: document.getElementById("player-list"),
  messages: document.getElementById("messages"),
  lobbyModal: document.getElementById("lobby-modal"),
  lobbyGameInput: document.getElementById("lobby-game"),
  maxPlayers: document.getElementById("max-players"),
  cancelLobby: document.getElementById("cancel-lobby"),
  confirmLobby: document.getElementById("confirm-lobby"),
  createLobbyGlobal: document.getElementById("create-lobby-global"),
  sendForm: document.getElementById("send-form"),
  msgInput: document.getElementById("msg"),
  sendBtn: document.getElementById("send-btn"),
  leaveBtn: document.getElementById("leave-lobby"),
  roomTitle: document.getElementById("room-title"),
  userCount: document.getElementById("user-count"),
  profileModal: document.getElementById("profile-modal"),
  profileNickname: document.getElementById("profile-nickname"),
  profileLobbies: document.getElementById("profile-lobbies"),
  profileMessages: document.getElementById("profile-messages"),
  closeProfile: document.getElementById("close-profile")
};

function escapeHTML(str = "") {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderGameList(games) {
  els.gameList.innerHTML = "";
  games.forEach(game => {
    const li = document.createElement("li");
    li.className = "flex items-center justify-between bg-panelSoft rounded-xl p-2 hover:bg-slate-800 transition cursor-default";
    li.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-gradient-to-br from-neonCyan to-neonMagenta rounded-md flex items-center justify-center text-black font-semibold">${escapeHTML(game[0] || "?")}</div>
        <div>
          <div class="text-sm font-semibold">${escapeHTML(game)}</div>
          <div class="text-xs text-slate-400"></div>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="see-lobbies px-3 py-1 rounded-lg bg-transparent hover:bg-neonCyan/6 text-xs">Lobby</button>
        <button class="create-lobby px-3 py-1 rounded-lg bg-neonMagenta text-black font-semibold text-xs">+Lobby</button>
      </div>
    `;
    els.gameList.appendChild(li);

    li.querySelector(".create-lobby").addEventListener("click", () => {
      gameToCreate = game;
      els.lobbyGameInput.value = game;
      els.maxPlayers.value = 4;
      els.lobbyModal.classList.remove("hidden");
    });

    li.querySelector(".see-lobbies").addEventListener("click", () => {
      if (currentLobby) return alert("Sei già in una lobby! Esci prima di entrare in un'altra.");
      socket.emit("getLobbies", game);
    });
  });
}

renderGameList(mainGames);

els.search.addEventListener("input", () => {
  const q = els.search.value.trim().toLowerCase();
  els.suggestions.innerHTML = "";
  if (!q) {
    els.suggestions.classList.add("hidden");
    renderGameList(mainGames);
    return;
  }
  const filtered = allGames.filter(g => g.toLowerCase().includes(q));
  if (!filtered.length) {
    els.suggestions.classList.add("hidden");
    renderGameList([]);
    return;
  }
  filtered.slice(0, 30).forEach(game => {
    const li = document.createElement("li");
    li.className = "px-3 py-2 hover:bg-panel rounded-lg cursor-pointer text-sm";
    li.textContent = game;
    li.addEventListener("click", () => {
      els.search.value = game;
      els.suggestions.classList.add("hidden");
      renderGameList([game]);
    });
    els.suggestions.appendChild(li);
  });
  els.suggestions.classList.remove("hidden");
});

document.addEventListener("click", e => {
  if (!els.search.contains(e.target) && !els.suggestions.contains(e.target)) els.suggestions.classList.add("hidden");
});

els.cancelLobby.addEventListener("click", () => {
  els.lobbyModal.classList.add("hidden");
  gameToCreate = null;
});

els.confirmLobby.addEventListener("click", () => {
  const max = parseInt(els.maxPlayers.value, 10);
  if (!max || max < 1 || max > 8) return alert("Numero giocatori non valido (1-8)");
  socket.emit("createLobby", { game: gameToCreate, maxPlayers: max, host: nickname }, lobbyId => {
    currentLobby = lobbyId;
  });
  els.lobbyModal.classList.add("hidden");
  gameToCreate = null;
});

els.createLobbyGlobal.addEventListener("click", () => {
  gameToCreate = "Custom Game";
  els.lobbyGameInput.value = "Seleziona un gioco dalla sidebar";
  els.maxPlayers.value = 4;
  els.lobbyModal.classList.remove("hidden");
});

socket.on("lobbyList", lobbies => {
  let list = document.getElementById("lobby-list");
  if (!list) {
    const sidebar = document.querySelector('aside');
    const div = document.createElement('div');
    div.id = 'lobby-list';
    div.className = 'mt-3 space-y-2';
    sidebar.appendChild(div);
    list = div;
  }
  list.innerHTML = "";
  list.classList.remove("hidden");
  if (!lobbies.length) return list.innerHTML = "<p class='text-sm text-slate-400'>Nessuna lobby disponibile.</p>";
  lobbies.forEach(lobby => {
    const div = document.createElement("div");
    div.className = "p-3 bg-panel rounded-xl flex justify-between items-center transition hover:bg-slate-800";
    div.innerHTML = `
      <div class="text-sm">
        <div class="font-semibold">${escapeHTML(lobby.host)}'s Lobby</div>
        <div class="text-xs text-slate-400">${lobby.game} • ${lobby.players.length}/${lobby.maxPlayers}</div>
      </div>
      <div>
        <button class="join-lobby px-3 py-1 rounded-full bg-neonCyan text-black text-sm font-medium">Entra</button>
      </div>
    `;
    div.querySelector(".join-lobby").addEventListener("click", () => {
      if (currentLobby) return alert("Sei già in una lobby! Esci prima di entrare in un'altra.");
      socket.emit("joinLobby", lobby.id, nickname);
    });
    list.appendChild(div);
  });
});

socket.on("joinedLobby", lobby => {
  currentLobby = lobby.id;
  els.roomTitle.textContent = `Lobby di ${lobby.host} — ${lobby.game}`;
  els.messages.innerHTML = "";
  if (lobby.messages) lobby.messages.forEach(m => appendMessage(m.nickname, m.msg));
  els.msgInput.disabled = false;
  els.sendBtn.disabled = false;
  els.leaveBtn.classList.remove("hidden");
  els.userCount.textContent = `${lobby.players.length}/${lobby.maxPlayers}`;
  updatePlayerList(lobby);
  try { document.getElementById("sound-join").play(); } catch(e){}
  els.msgInput.focus();
});

els.leaveBtn.addEventListener("click", () => {
  if (!currentLobby) return;
  socket.emit("leaveLobby", currentLobby, nickname);
  clearLobbyState();
});

function clearLobbyState(){
  currentLobby = null;
  els.roomTitle.textContent = "Nessuna stanza";
  els.messages.innerHTML = "";
  els.msgInput.disabled = true;
  els.sendBtn.disabled = true;
  els.leaveBtn.classList.add("hidden");
  els.userCount.textContent = "";
  els.playerList.innerHTML = "";
}

function updatePlayerList(lobby) {
  els.playerList.innerHTML = "";
  (lobby.players || []).forEach(p => {
    const span = document.createElement("button");
    span.className = "px-3 py-1 bg-panel rounded-full flex items-center gap-2 text-xs text-slate-200 hover:bg-slate-800";
    span.innerHTML = `<span class="font-medium">${escapeHTML(p.name || "Anonimo")}</span>`;
    if (lobby.host === p.name) {
      const crown = document.createElement("span");
      crown.className = "ml-2 text-yellow-400 text-xs";
      crown.textContent = "👑";
      span.appendChild(crown);
    }
    span.addEventListener("click", () => showProfile(p.name));
    els.playerList.appendChild(span);
  });
}

function showProfile(name){
  if(!name) return;
  socket.emit("getProfile", name, data => {
    els.profileNickname.textContent = name;
    els.profileLobbies.textContent = `Lobby partecipate: ${data?.lobbies ?? 0}`;
    els.profileMessages.textContent = `Messaggi inviati: ${data?.messages ?? 0}`;
    els.profileModal.classList.remove("hidden");
  });
}
els.closeProfile.addEventListener("click", () => els.profileModal.classList.add("hidden"));

els.sendForm.addEventListener("submit", e => {
  e.preventDefault();
  const msg = els.msgInput.value.trim();
  if (!msg || !currentLobby) return;
  socket.emit("chatMessage", { lobbyId: currentLobby, nickname, msg });
  els.msgInput.value = "";
});

function appendMessage(nick, msg) {
  const wrap = document.createElement("div");
  wrap.className = "msg-bubble p-3 rounded-xl bg-gradient-to-r from-slate-800/50 to-transparent";
  wrap.innerHTML = `<div class="text-xs text-slate-400 mb-1">${escapeHTML(nick || "Anonimo")}</div>
                    <div class="text-sm">${escapeHTML(msg)}</div>`;
  els.messages.appendChild(wrap);
  els.messages.scrollTo({ top: els.messages.scrollHeight, behavior: "smooth" });
  try { document.getElementById("sound-message").play(); } catch(e){}
}

socket.on("chatMessage", data => {
  if (!data) return;
  appendMessage(data.nickname, data.msg);
});

socket.on("lobbyUpdate", lobby => {
  if (!lobby) return;
  if (currentLobby === lobby.id) {
    els.userCount.textContent = `${lobby.players.length}/${lobby.maxPlayers}`;
    updatePlayerList(lobby);
  }
  socket.emit("getLobbies", lobby.game);
});

socket.emit("registerUser", nickname);

window.addEventListener("resize", () => {
  if (window.innerWidth < 640 && currentLobby) els.msgInput.focus();
});
