const rooms = {};

const MAX_PLAYERS = 20;

// CREATE ROOM
function createRoom(roomId) {

  rooms[roomId] = {

    id: roomId,
    host: null,

    players: [],

    gameState: {

      redHP: 100,

      blueHP: 100,

      currentWord: "",

      status: "waiting",

      countdown: null,

      answeredPlayers: [],

      roundWinner: null,
      gameLoop: null,

    },

  };

}

// GET ROOM
function getRoom(roomId) {

  return rooms[roomId];

}

// ADD PLAYER
function addPlayer(roomId, player) {


  // CREATE ROOM IF NOT EXISTS
  if (!rooms[roomId]) {

    createRoom(roomId);

  }

  const room = rooms[roomId];

  // ROOM FULL
  if (room.players.length >= MAX_PLAYERS) {

    return {
      error: "Room full",
    };

  }

  // TEAM BALANCING
  const redPlayers = room.players.filter(
    (p) => p.team === "red"
  ).length;

  const bluePlayers = room.players.filter(
    (p) => p.team === "blue"
  ).length;

  player.team =
    redPlayers <= bluePlayers
      ? "red"
      : "blue";

  // PLAYER COMBO
  player.combo = 0;

  if (!room.host) {
    room.host = player.socketId;
  }

  room.players.push(player);

  return room;

}

// REMOVE PLAYER
function removePlayer(socketId) {

  for (const roomId in rooms) {

    const room = rooms[roomId];

    const leavingPlayer = room.players.find(
        (player) => player.socketId === socketId
      );

    room.players = room.players.filter(
      (player) =>
        player.socketId !== socketId
    );

    if (
        leavingPlayer &&
        room.host === socketId &&
        room.players.length > 0
      ) {
        room.host = room.players[0].socketId;
      }

    // DELETE EMPTY ROOM
    if (room.players.length === 0) {

      delete rooms[roomId];

    }

  }

}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
};