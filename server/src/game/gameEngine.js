const { getRoom, clearRoomTimers, serializePlayer, scaleRoomHP, allPlayersReady } =
  require("../rooms/roomManager");
const words = require("./words");
const {
  MIN_PLAYERS,
  COUNTDOWN_SECONDS,
  PENALTY,
  calculateDamage,
  getWordInterval,
} = require("../config/gameConfig");

function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

function updateWpm(player, word, startedAt) {
  if (!startedAt) return;

  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs <= 0) return;

  const wpm = Math.round((word.length / 5) / (elapsedMs / 60000));
  player.stats.wpm = wpm;
  player.stats.bestWpm = Math.max(player.stats.bestWpm, wpm);
}

function buildPublicState(room, viewerSocketId) {
  const viewer = room.players.find((p) => p.socketId === viewerSocketId);
  const viewerTeam = viewer?.team;

  const online = room.players.filter((p) => !p.disconnected);
  const teammates = viewerTeam
    ? room.players.filter((p) => p.team === viewerTeam)
    : online;

  return {
    players: teammates.map(serializePlayer),
    host: room.host,
    currentWord: room.gameState.currentWord,
    redHP: room.gameState.redHP,
    blueHP: room.gameState.blueHP,
    maxRedHP: room.gameState.maxRedHP,
    maxBlueHP: room.gameState.maxBlueHP,
    status: room.gameState.status,
    countdown: room.gameState.countdownValue ?? null,
    winner: room.gameState.winner || "",
    roundWinner: room.gameState.roundWinnerName || "",
    comboMessage: room.gameState.comboMessage || "",
    readyCount: online.filter((p) => p.ready).length,
    playerCount: online.length,
    teamPlayerCount: teammates.filter((p) => !p.disconnected).length,
    opponentCount: viewerTeam
      ? online.filter((p) => p.team !== viewerTeam).length
      : 0,
  };
}

function emitGameState(io, roomId) {
  const room = getRoom(roomId);
  if (!room) return;

  if (room.gameState.status === "waiting") {
    scaleRoomHP(room);
  }

  for (const player of room.players) {
    if (player.disconnected) continue;
    io.to(player.socketId).emit(
      "game_state",
      buildPublicState(room, player.socketId)
    );
  }
}

function emitGameDelta(io, roomId, patch) {
  io.to(roomId).emit("game_delta", patch);
}

function startGameLoop(io, roomId) {
  const room = getRoom(roomId);
  if (!room) return;

  if (room.gameState.gameLoop) {
    clearTimeout(room.gameState.gameLoop);
  }

  room.gameState.status = "playing";
  const intervalMs = getWordInterval(room.players.length);

  function nextWord() {
    const currentRoom = getRoom(roomId);
    if (!currentRoom || currentRoom.gameState.status !== "playing") return;

    currentRoom.gameState.currentWord = getRandomWord();
    currentRoom.gameState.wordStartedAt = Date.now();
    currentRoom.gameState.answeredPlayers = [];
    currentRoom.gameState.roundWinner = null;
    currentRoom.gameState.roundWinnerName = "";

    emitGameDelta(io, roomId, {
      currentWord: currentRoom.gameState.currentWord,
      roundWinner: "",
      comboMessage: currentRoom.gameState.comboMessage,
    });
    emitGameState(io, roomId);

    currentRoom.gameState.gameLoop = setTimeout(() => {
      const latestRoom = getRoom(roomId);
      if (!latestRoom || latestRoom.gameState.status !== "playing") return;
      nextWord();
    }, intervalMs);
  }

  nextWord();
}

function startCountdown(io, roomId) {
  const room = getRoom(roomId);
  if (!room || room.gameState.status === "countdown") return;

  clearRoomTimers(room);

  let timeLeft = COUNTDOWN_SECONDS;

  room.gameState.status = "countdown";
  room.gameState.countdown = true;
  room.gameState.countdownValue = timeLeft;

  emitGameState(io, roomId);

  const tick = () => {
    const currentRoom = getRoom(roomId);
    if (!currentRoom || currentRoom.gameState.status !== "countdown") return;

    timeLeft -= 1;

    if (timeLeft <= 0) {
      clearRoomTimers(currentRoom);
      currentRoom.gameState.status = "playing";
      currentRoom.gameState.countdown = false;
      currentRoom.gameState.countdownValue = null;
      startGameLoop(io, roomId);
      return;
    }

    currentRoom.gameState.countdownValue = timeLeft;
    emitGameDelta(io, roomId, { countdown: timeLeft, status: "countdown" });
    currentRoom.gameState.countdownTimeout = setTimeout(tick, 1000);
  };

  room.gameState.countdownTimeout = setTimeout(tick, 1000);
}

function resetRoomState(room) {
  clearRoomTimers(room);

  room.gameState.currentWord = "";
  room.gameState.wordStartedAt = null;
  room.gameState.status = "waiting";
  room.gameState.answeredPlayers = [];
  room.gameState.roundWinner = null;
  room.gameState.roundWinnerName = "";
  room.gameState.comboMessage = "";
  room.gameState.winner = "";

  room.players.forEach((player) => {
    player.combo = 0;
    player.ready = false;
    player.stats = {
      wpm: 0,
      bestWpm: 0,
      correct: 0,
      wrong: 0,
      roundsWon: 0,
    };
  });

  scaleRoomHP(room);
}

function checkAndStartGame(io, roomId) {
  const room = getRoom(roomId);
  if (!room) return false;

  if (room.gameState.status !== "waiting") return false;
  if (room.players.filter((p) => !p.disconnected).length < MIN_PLAYERS) {
    return false;
  }
  if (!allPlayersReady(room)) return false;

  scaleRoomHP(room);
  startCountdown(io, roomId);
  return true;
}

function restartGame(io, roomId) {
  const room = getRoom(roomId);
  if (!room || room.gameState.status !== "finished") return;

  resetRoomState(room);

  if (room.players.filter((p) => !p.disconnected).length >= MIN_PLAYERS) {
    if (allPlayersReady(room)) {
      startCountdown(io, roomId);
    } else {
      emitGameState(io, roomId);
    }
  } else {
    emitGameState(io, roomId);
  }
}

function handleWordSubmission(io, roomId, socketId, typedWord) {
  const room = getRoom(roomId);
  if (!room || room.gameState.status !== "playing") return;

  const player = room.players.find((p) => p.socketId === socketId);
  if (!player || player.disconnected) return;

  if (room.gameState.answeredPlayers.includes(socketId)) return;

  const correctWord = room.gameState.currentWord;
  const roundAlreadyWon = room.gameState.roundWinner !== null;
  const wordStartedAt = room.gameState.wordStartedAt;

  room.gameState.answeredPlayers.push(socketId);

  if (
    typedWord.trim().toLowerCase() === correctWord.toLowerCase() &&
    !roundAlreadyWon
  ) {
    room.gameState.roundWinner = socketId;
    room.gameState.roundWinnerName = `${player.username} attacked first!`;
    player.combo += 1;
    player.stats.correct += 1;
    player.stats.roundsWon += 1;
    updateWpm(player, correctWord, wordStartedAt);

    room.gameState.comboMessage =
      player.combo >= 2
        ? `${player.username} is on ${player.combo} streak!`
        : "";

    const damage = calculateDamage(player.combo);

    if (player.team === "red") {
      room.gameState.blueHP -= damage;
    } else {
      room.gameState.redHP -= damage;
    }

    emitGameState(io, roomId);

    io.to(roomId).emit("game_update", {
      type: "correct",
      player: player.username,
      combo: player.combo,
      team: player.team,
      redHP: room.gameState.redHP,
      blueHP: room.gameState.blueHP,
    });
  } else {
    player.combo = 0;
    player.stats.wrong += 1;

    if (player.team === "red") {
      room.gameState.redHP -= PENALTY;
    } else {
      room.gameState.blueHP -= PENALTY;
    }

    emitGameState(io, roomId);
    io.to(socketId).emit("game_update", { type: "wrong" });
  }

  checkWinner(io, roomId);
}

function checkWinner(io, roomId) {
  const room = getRoom(roomId);
  if (!room) return;

  if (room.gameState.redHP <= 0 || room.gameState.blueHP <= 0) {
    room.gameState.status = "finished";
    clearRoomTimers(room);
    room.gameState.winner = room.gameState.redHP <= 0 ? "BLUE" : "RED";
    emitGameState(io, roomId);
    io.to(roomId).emit("game_update", { type: "victory" });
  }
}

module.exports = {
  checkAndStartGame,
  restartGame,
  handleWordSubmission,
  emitGameState,
  buildPublicState,
  calculateDamage,
};
