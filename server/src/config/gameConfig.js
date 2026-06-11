const BASE_HP = 200;
const HP_PER_PLAYER = 10;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 50;
const WORD_INTERVAL_BASE = 4000;
const WORD_INTERVAL_LARGE = 5000;
const LARGE_ROOM_THRESHOLD = 20;
const COUNTDOWN_SECONDS = 5;
const PENALTY = 2;
const DISCONNECT_GRACE_MS = 60_000;
const SUBMIT_RATE_LIMIT = 12;
const SUBMIT_RATE_WINDOW_MS = 1000;
const USERNAME_MAX_LENGTH = 20;
const ROOM_ID_MAX_LENGTH = 24;

function calculateDamage(combo) {
  if (combo >= 5) return 15;
  if (combo >= 3) return 10;
  return 5;
}

function getTeamHP(teamSize) {
  return BASE_HP + teamSize * HP_PER_PLAYER;
}

function getWordInterval(totalPlayers) {
  return totalPlayers > LARGE_ROOM_THRESHOLD
    ? WORD_INTERVAL_LARGE
    : WORD_INTERVAL_BASE;
}

function scaleRoomHP(room) {
  const redCount = room.players.filter((p) => p.team === "red").length;
  const blueCount = room.players.filter((p) => p.team === "blue").length;
  const sharedHP = getTeamHP(Math.max(redCount, blueCount, 1));

  room.gameState.redHP = sharedHP;
  room.gameState.blueHP = sharedHP;
  room.gameState.maxRedHP = sharedHP;
  room.gameState.maxBlueHP = sharedHP;
}

module.exports = {
  BASE_HP,
  HP_PER_PLAYER,
  MIN_PLAYERS,
  MAX_PLAYERS,
  WORD_INTERVAL_BASE,
  COUNTDOWN_SECONDS,
  PENALTY,
  DISCONNECT_GRACE_MS,
  SUBMIT_RATE_LIMIT,
  SUBMIT_RATE_WINDOW_MS,
  USERNAME_MAX_LENGTH,
  ROOM_ID_MAX_LENGTH,
  calculateDamage,
  getTeamHP,
  getWordInterval,
  scaleRoomHP,
};
