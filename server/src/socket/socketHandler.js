const {
  getRoom,
  createEmptyPlayer,
  addPlayer,
  disconnectPlayer,
  toggleReady,
  clearRoomTimers,
} = require("../rooms/roomManager");

const {
  checkAndStartGame,
  restartGame,
  handleWordSubmission,
  emitGameState,
} = require("../game/gameEngine");

const { validateJoin, sanitizeWord } = require("../utils/validation");
const { isRateLimited, clearRateLimit } = require("../utils/rateLimit");
const {
  SUBMIT_RATE_LIMIT,
  SUBMIT_RATE_WINDOW_MS,
} = require("../config/gameConfig");

function joinRoom(io, socket, { username, roomId }) {
  const validation = validateJoin({ username, roomId });
  if (validation.error) {
    socket.emit("error_message", validation.error);
    return;
  }

  const player = createEmptyPlayer({
    socketId: socket.id,
    username: validation.username,
  });

  const result = addPlayer(validation.roomId, player);

  if (result.error) {
    socket.emit("error_message", result.error);
    return;
  }

  socket.join(validation.roomId);
  socket.data.roomId = validation.roomId;
  socket.data.username = validation.username;

  emitGameState(io, validation.roomId);
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("join_room", (payload) => joinRoom(io, socket, payload));

    socket.on("rejoin_room", (payload) => joinRoom(io, socket, payload));

    socket.on("toggle_ready", ({ roomId }) => {
      const room = getRoom(roomId);
      if (!room || roomId !== socket.data.roomId) return;

      const result = toggleReady(socket.id, roomId);
      if (result.error) {
        socket.emit("error_message", result.error);
        return;
      }

      emitGameState(io, roomId);
    });

    socket.on("start_game", ({ roomId }) => {
      const room = getRoom(roomId);
      if (!room || room.host !== socket.id) return;

      const started = checkAndStartGame(io, roomId);
      if (!started) {
        socket.emit("error_message", "All players must be ready before starting");
      }
    });

    socket.on("restart_game", ({ roomId }) => {
      const room = getRoom(roomId);
      if (!room || room.host !== socket.id) return;

      restartGame(io, roomId);
    });

    socket.on("submit_word", ({ roomId, word }) => {
      const room = getRoom(roomId);
      if (!room || roomId !== socket.data.roomId) return;

      if (
        isRateLimited(
          `submit:${socket.id}`,
          SUBMIT_RATE_LIMIT,
          SUBMIT_RATE_WINDOW_MS
        )
      ) {
        return;
      }

      const wordResult = sanitizeWord(word);
      if (wordResult.error) return;

      handleWordSubmission(io, roomId, socket.id, wordResult.word);
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      disconnectPlayer(socket.id, roomId, (expiredRoomId) => {
        const updatedRoom = getRoom(expiredRoomId);
        if (!updatedRoom) return;

        if (
          updatedRoom.players.filter((p) => !p.disconnected).length < 2 &&
          updatedRoom.gameState.status === "playing"
        ) {
          clearRoomTimers(updatedRoom);
          updatedRoom.gameState.status = "waiting";
        }

        emitGameState(io, expiredRoomId);
      });

      const updatedRoom = getRoom(roomId);
      if (!updatedRoom) return;

      if (
        updatedRoom.players.filter((p) => !p.disconnected).length < 2 &&
        updatedRoom.gameState.status === "playing"
      ) {
        clearRoomTimers(updatedRoom);
        updatedRoom.gameState.status = "waiting";
      }

      emitGameState(io, roomId);
      clearRateLimit(`submit:${socket.id}`);
    });
  });
};
