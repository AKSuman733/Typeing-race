const {
  USERNAME_MAX_LENGTH,
  ROOM_ID_MAX_LENGTH,
} = require("../config/gameConfig");

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function sanitizeUsername(value) {
  if (typeof value !== "string") return { error: "Username is required" };

  const username = value.trim();

  if (!username) return { error: "Username is required" };
  if (username.length > USERNAME_MAX_LENGTH) {
    return { error: `Username must be ${USERNAME_MAX_LENGTH} characters or less` };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { error: "Username can only use letters, numbers, _ and -" };
  }

  return { username };
}

function sanitizeRoomId(value) {
  if (typeof value !== "string") return { error: "Room ID is required" };

  const roomId = value.trim();

  if (!roomId) return { error: "Room ID is required" };
  if (roomId.length > ROOM_ID_MAX_LENGTH) {
    return { error: `Room ID must be ${ROOM_ID_MAX_LENGTH} characters or less` };
  }
  if (!ROOM_ID_PATTERN.test(roomId)) {
    return { error: "Room ID can only use letters, numbers, _ and -" };
  }

  return { roomId };
}

function validateJoin({ username, roomId }) {
  const userResult = sanitizeUsername(username);
  if (userResult.error) return userResult;

  const roomResult = sanitizeRoomId(roomId);
  if (roomResult.error) return roomResult;

  return {
    username: userResult.username,
    roomId: roomResult.roomId,
  };
}

function sanitizeWord(value) {
  if (typeof value !== "string") return { error: "Word is required" };
  const word = value.trim();
  if (!word) return { error: "Word is required" };
  if (word.length > 40) return { error: "Word is too long" };
  return { word };
}

module.exports = {
  sanitizeUsername,
  sanitizeRoomId,
  validateJoin,
  sanitizeWord,
};
