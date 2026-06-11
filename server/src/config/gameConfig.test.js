const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateDamage,
  getTeamHP,
  getWordInterval,
  scaleRoomHP,
} = require("./gameConfig");

test("calculateDamage scales with combo", () => {
  assert.equal(calculateDamage(1), 5);
  assert.equal(calculateDamage(3), 10);
  assert.equal(calculateDamage(5), 15);
});

test("getTeamHP scales with team size", () => {
  assert.equal(getTeamHP(1), 210);
  assert.equal(getTeamHP(25), 450);
});

test("getWordInterval increases for large rooms", () => {
  assert.equal(getWordInterval(10), 4000);
  assert.equal(getWordInterval(25), 5000);
});

test("scaleRoomHP keeps both teams at equal HP when sizes differ", () => {
  const room = {
    players: [
      { team: "red" },
      { team: "red" },
      { team: "red" },
      { team: "blue" },
      { team: "blue" },
    ],
    gameState: {},
  };

  scaleRoomHP(room);

  assert.equal(room.gameState.redHP, room.gameState.blueHP);
  assert.equal(room.gameState.redHP, getTeamHP(3));
  assert.equal(room.gameState.maxRedHP, room.gameState.maxBlueHP);
});
