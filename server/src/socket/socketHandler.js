const { getRoom } = require("../rooms/roomManager");

const {
    addPlayer,
    removePlayer,
  } = require("../rooms/roomManager");
  
  const {
    checkAndStartGame,
    handleWordSubmission,
  } = require("../game/gameEngine");
  
  module.exports = (io) => {
  
    io.on("connection", (socket) => {
  
      console.log("Player connected:", socket.id);
  
      // JOIN ROOM
      socket.on("join_room", ({ username, roomId }) => {
  
        const player = {
            socketId: socket.id,
            username,
            team: null,
            combo: 0,
          };
  
        const room = addPlayer(roomId, player);
  
        if (room.error) {
          socket.emit("error_message", room.error);
          return;
        }
  
        socket.join(roomId);
  
        console.log(`${username} joined ${roomId}`);
  
        io.to(roomId).emit("room_update", room);
  

  
      });

      socket.on("start_game", ({ roomId }) => {

        const room = getRoom(roomId);
      
        if (!room) return;
      
        // ONLY HOST CAN START
        if (room.host !== socket.id) return;
      
        checkAndStartGame(io, roomId);
      
      });
  
      // SUBMIT WORD
      socket.on("submit_word", ({ roomId, word }) => {
  
        handleWordSubmission(
          io,
          roomId,
          socket.id,
          word
        );
  
      });
  
      // DISCONNECT
      socket.on("disconnect", () => {

        console.log("Player disconnected:", socket.id);
      
        // FIND ROOM BEFORE REMOVAL
        const room = Object.values(require("../rooms/roomManager").rooms)
          .find((room) =>
            room.players.some(
              (player) => player.socketId === socket.id
            )
          );
      
        removePlayer(socket.id);
      
        // EMIT UPDATED ROOM
        if (room) {
      
          io.to(room.id).emit("room_update", room);
      
        }
      
      });
  
    });
  
  };