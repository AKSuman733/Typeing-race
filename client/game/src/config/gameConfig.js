export const MAX_PLAYERS = 50;
export const EPHEMERAL_MS = 2000;
export const SESSION_KEY = "type-race-session";

export const INITIAL_GAME_STATE = {
  players: [],
  host: null,
  currentWord: "",
  redHP: 200,
  blueHP: 200,
  maxRedHP: 200,
  maxBlueHP: 200,
  countdown: null,
  status: "waiting",
  winner: "",
  readyCount: 0,
  playerCount: 0,
  teamPlayerCount: 0,
  opponentCount: 0,
};
