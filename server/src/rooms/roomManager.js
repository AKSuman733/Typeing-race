const {
  MAX_PLAYERS,
  DISCONNECT_GRACE_MS,
  scaleRoomHP,
} = require("../config/gameConfig");

const rooms = {};

function createEmptyPlayer({ socketId, username }) {
  return {
    socketId,
    username,
    team: null,
    combo: 0,
    ready: false,
    disconnected: false,
    stats: {
      wpm: 0,
      bestWpm: 0,
      correct: 0,
      wrong: 0,
      roundsWon: 0,
    },
  };
}

function createRoom(roomId) {
  rooms[roomId] = {
    id: roomId,
    host: null,
    players: [],
    gameState: {
      redHP: 200,
      blueHP: 200,
      maxRedHP: 200,
      maxBlueHP: 200,
      currentWord: "",
      wordStartedAt: null,
      status: "waiting",
      countdown: null,
      countdownValue: null,
      countdownInterval: null,
      answeredPlayers: [],
      roundWinner: null,
      roundWinnerName: "",
      comboMessage: "",
      winner: "",
      gameLoop: null,
    },
  };
}

function getRoom(roomId) {
  return rooms[roomId];
}

function clearPlayerRemovalTimer(player) {
  if (player?.removalTimer) {
    clearTimeout(player.removalTimer);
    player.removalTimer = null;
  }
}

function clearRoomTimers(room) {
  if (!room) return;

  if (room.gameState.gameLoop) {
    clearTimeout(room.gameState.gameLoop);
    room.gameState.gameLoop = null;
  }

  if (room.gameState.countdownInterval) {
    clearInterval(room.gameState.countdownInterval);
    room.gameState.countdownInterval = null;
  }

  if (room.gameState.countdownTimeout) {
    clearTimeout(room.gameState.countdownTimeout);
    room.gameState.countdownTimeout = null;
  }

  room.gameState.countdown = null;
  room.gameState.countdownValue = null;
}

function assignTeam(room) {
  const redPlayers = room.players.filter((p) => p.team === "red").length;
  const bluePlayers = room.players.filter((p) => p.team === "blue").length;
  return redPlayers <= bluePlayers ? "red" : "blue";
}

function findPlayerByUsername(room, username) {
  const normalized = username.toLowerCase();
  return room.players.find(
    (player) => player.username.toLowerCase() === normalized
  );
}

function activePlayers(room) {
  return room.players.filter((player) => !player.disconnected);
}

function addPlayer(roomId, player, onDisconnectExpired) {
  if (!rooms[roomId]) {
    createRoom(roomId);
  }

  const room = rooms[roomId];
  const existing = findPlayerByUsername(room, player.username);

  if (existing) {
    if (!existing.disconnected) {
      return { error: "Username already taken in this room" };
    }

    clearPlayerRemovalTimer(existing);
    existing.socketId = player.socketId;
    existing.disconnected = false;
    existing.disconnectedAt = null;

    if (!room.host || room.players.every((p) => p.disconnected)) {
      room.host = existing.socketId;
    }

    return { room, reconnected: true };
  }

  if (room.players.length >= MAX_PLAYERS) {
    return { error: "Room full" };
  }

  if (
    room.gameState.status === "playing" ||
    room.gameState.status === "countdown"
  ) {
    return { error: "Game already in progress" };
  }

  player.team = assignTeam(room);
  player.ready = false;
  player.disconnected = false;
  player.stats = {
    wpm: 0,
    bestWpm: 0,
    correct: 0,
    wrong: 0,
    roundsWon: 0,
  };

  if (!room.host) {
    room.host = player.socketId;
  }

  room.players.push(player);
  return { room, reconnected: false };
}

function disconnectPlayer(socketId, roomId, onExpired) {
  const room = rooms[roomId];
  if (!room) return null;

  const player = room.players.find((p) => p.socketId === socketId);
  if (!player) return null;

  // Lobby / post-game: remove immediately so ready checks aren't blocked
  if (room.gameState.status !== "playing") {
    clearPlayerRemovalTimer(player);
    removePlayer(socketId, roomId);
    return getRoom(roomId);
  }

  player.disconnected = true;
  player.disconnectedAt = Date.now();
  player.ready = false;

  if (room.host === socketId) {
    const replacement = room.players.find(
      (p) => p.socketId !== socketId && !p.disconnected
    );
    room.host = replacement ? replacement.socketId : room.host;
  }

  clearPlayerRemovalTimer(player);
  player.removalTimer = setTimeout(() => {
    const latestRoom = rooms[roomId];
    if (!latestRoom) return;

    const stillGone = latestRoom.players.find(
      (p) => p.socketId === socketId && p.disconnected
    );

    if (!stillGone) return;

    removePlayer(socketId, roomId);
    if (onExpired) onExpired(roomId);
  }, DISCONNECT_GRACE_MS);

  return room;
}

function removePlayer(socketId, roomId) {
  const roomIds = roomId ? [roomId] : Object.keys(rooms);

  for (const id of roomIds) {
    const room = rooms[id];
    if (!room) continue;

    const leavingPlayer = room.players.find(
      (player) => player.socketId === socketId
    );

    if (!leavingPlayer) continue;

    clearPlayerRemovalTimer(leavingPlayer);

    room.players = room.players.filter(
      (player) => player.socketId !== socketId
    );

    if (room.host === socketId && room.players.length > 0) {
      const nextHost = room.players.find((p) => !p.disconnected) || room.players[0];
      room.host = nextHost.socketId;
    }

    if (room.players.length === 0) {
      clearRoomTimers(room);
      delete rooms[id];
    }

    return id;
  }

  return null;
}

function toggleReady(socketId, roomId) {
  const room = rooms[roomId];
  if (!room) return { error: "Room not found" };

  if (room.gameState.status !== "waiting") {
    return { error: "Can only ready up in the lobby" };
  }

  const player = room.players.find((p) => p.socketId === socketId);
  if (!player || player.disconnected) {
    return { error: "Player not found" };
  }

  player.ready = !player.ready;
  return { room };
}

function allPlayersReady(room) {
  const online = activePlayers(room);
  return online.length >= 2 && online.every((player) => player.ready);
}

function serializePlayer(player) {
  return {
    socketId: player.socketId,
    username: player.username,
    team: player.team,
    ready: player.ready,
    disconnected: player.disconnected,
    combo: player.combo,
    stats: player.stats,
  };
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  createEmptyPlayer,
  addPlayer,
  disconnectPlayer,
  removePlayer,
  toggleReady,
  allPlayersReady,
  activePlayers,
  clearRoomTimers,
  serializePlayer,
  scaleRoomHP,
};
