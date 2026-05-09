const { getRoom } = require("../rooms/roomManager");
const words = require("./words");

const MIN_PLAYERS = 2;

const WORD_INTERVAL = 4000;

const DAMAGE = 5;
const PENALTY = 2;

// RANDOM WORD
function getRandomWord() {

  return words[
    Math.floor(Math.random() * words.length)
  ];

}

// GAME LOOP
function startGameLoop(io, roomId) {

  const room = getRoom(roomId);

  if (!room) return;

  // CLEAR OLD LOOP
  if (room.gameState.gameLoop) {

    clearInterval(room.gameState.gameLoop);

  }

  room.gameState.gameLoop = setInterval(() => {

    if (room.gameState.status !== "playing") {

      clearInterval(room.gameState.gameLoop);

      return;

    }

    const word = getRandomWord();

    room.gameState.currentWord = word;

    room.gameState.answeredPlayers = [];

    room.gameState.roundWinner = null;

    io.to(roomId).emit("new_word", word);

  }, WORD_INTERVAL);

}

// START COUNTDOWN
function startCountdown(io, roomId) {

  const room = getRoom(roomId);

  if (!room) return;

  // PREVENT MULTIPLE COUNTDOWNS
  if (room.gameState.countdown) return;

  let timeLeft = 5;

  room.gameState.status = "countdown";
  room.gameState.countdown = true;

  const interval = setInterval(() => {

    io.to(roomId).emit("countdown", timeLeft);

    timeLeft--;

    if (timeLeft < 0) {

      clearInterval(interval);

      room.gameState.status = "playing";
      room.gameState.countdown = false;

      io.to(roomId).emit("game_start");

      console.log(`Game started in ${roomId}`);

      startGameLoop(io, roomId);

    }

  }, 1000);

}

// CHECK IF GAME CAN START
function checkAndStartGame(io, roomId) {

  const room = getRoom(roomId);

  if (!room) return;

  if (
    room.players.length >= MIN_PLAYERS &&
    room.gameState.status === "waiting"
  ) {

    startCountdown(io, roomId);

  }

}
function calculateDamage(combo) {

    if (combo >= 5) return 15;
  
    if (combo >= 3) return 10;
  
    return 5;
  }
// HANDLE WORD SUBMISSION
function handleWordSubmission(
  io,
  roomId,
  socketId,
  typedWord
) {

  const room = getRoom(roomId);

  if (!room) return;

  if (room.gameState.status !== "playing") return;

  const player = room.players.find(
    (p) => p.socketId === socketId
  );

  if (!player) return;

  const alreadyAnswered =
  room.gameState.answeredPlayers.includes(socketId);

if (alreadyAnswered) {
  return;
}

  const correctWord = room.gameState.currentWord;
  const roundAlreadyWon = room.gameState.roundWinner !== null;

  room.gameState.answeredPlayers.push(socketId);

  // CORRECT WORD
  if (
    typedWord.trim().toLowerCase() ===
      correctWord.toLowerCase() &&
    !roundAlreadyWon
  ) {
    room.gameState.roundWinner = socketId;
    player.combo += 1;

const damage = calculateDamage(player.combo);

if (player.team === "red") {

  room.gameState.blueHP -= damage;

} else {

  room.gameState.redHP -= damage;

}

    io.to(roomId).emit("round_winner", {
        player: player.username,
        team: player.team,
      });

    io.to(roomId).emit("hp_update", {
      redHP: room.gameState.redHP,
      blueHP: room.gameState.blueHP,
    });

    io.to(roomId).emit("correct_word", {
      player: player.username,
      word: typedWord,
    });

    io.to(roomId).emit("combo_update", {
        player: player.username,
        combo: player.combo,
      });

  }

  // WRONG WORD
  else {
    player.combo = 0;

    if (player.team === "red") {

      room.gameState.redHP -= PENALTY;

    } else {

      room.gameState.blueHP -= PENALTY;

    }

    io.to(roomId).emit("hp_update", {
      redHP: room.gameState.redHP,
      blueHP: room.gameState.blueHP,
    });

    io.to(roomId).emit("wrong_word", {
      player: player.username,
      word: typedWord,
    });

  }

  checkWinner(io, roomId);

}

// CHECK WINNER
function checkWinner(io, roomId) {

  const room = getRoom(roomId);

  if (!room) return;

  if (room.gameState.redHP <= 0) {

    room.gameState.status = "finished";

    io.to(roomId).emit("game_over", {
      winner: "BLUE",
    });

    return;
  }

  if (room.gameState.blueHP <= 0) {

    room.gameState.status = "finished";

    io.to(roomId).emit("game_over", {
      winner: "RED",
    });

  }

}

module.exports = {
  checkAndStartGame,
  handleWordSubmission,
};