const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateJoin, sanitizeWord } = require("./validation");

test("validateJoin accepts clean values", () => {
  const result = validateJoin({ username: "Player_1", roomId: "room-42" });
  assert.deepEqual(result, { username: "Player_1", roomId: "room-42" });
});

test("validateJoin rejects invalid username", () => {
  const result = validateJoin({ username: "bad name!", roomId: "room1" });
  assert.equal(result.error, "Username can only use letters, numbers, _ and -");
});

test("sanitizeWord rejects empty input", () => {
  const result = sanitizeWord("   ");
  assert.equal(result.error, "Word is required");
});
