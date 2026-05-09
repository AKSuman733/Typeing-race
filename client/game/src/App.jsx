import { useEffect, useState, useRef } from "react";
import socket from "./socket";

import { motion } from "framer-motion";

import attackSound from "./assets/sounds/attack.mp3";
import wrongSound from "./assets/sounds/wrong.mp3";
import countdownSound from "./assets/sounds/countdown.mp3";
import victorySound from "./assets/sounds/victory.mp3";

function App() {

  const [joined, setJoined] = useState(false);

  const [username, setUsername] = useState("");

  const [roomId, setRoomId] = useState("");

  const [room, setRoom] = useState(null);

  const [countdown, setCountdown] = useState(null);

  const [gameStarted, setGameStarted] = useState(false);

  const [currentWord, setCurrentWord] = useState("");

  const [input, setInput] = useState("");

  const [redHP, setRedHP] = useState(200);

  const [blueHP, setBlueHP] = useState(200);

  const [winner, setWinner] = useState("");

  const [myTeam, setMyTeam] = useState("");

  const [roundWinner, setRoundWinner] = useState("");

  const [comboMessage, setComboMessage] = useState("");

  const [shake, setShake] = useState(false);

  const [isHost, setIsHost] = useState(false);

  const attackAudio = useRef(new Audio(attackSound));

const wrongAudio = useRef(new Audio(wrongSound));

const countdownAudio = useRef(new Audio(countdownSound));

const victoryAudio = useRef(new Audio(victorySound));

  // SOCKET EVENTS
  useEffect(() => {

    attackAudio.current.load();
wrongAudio.current.load();
countdownAudio.current.load();
victoryAudio.current.load();

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("room_update", (roomData) => {

      console.log("ROOM DATA:", roomData);

      setRoom(roomData);

      setIsHost(roomData.host === socket.id);

      const me = roomData.players.find(
        (p) => p.socketId === socket.id
      );

      if (me) {
        setMyTeam(me.team);
      }

    });

    socket.on("countdown", (time) => {

      setCountdown(time);
    
      if (time > 0) {

    countdownAudio.current.currentTime = 0;

    countdownAudio.current.play();

  }

    
    });

    socket.on("game_start", () => {
      countdownAudio.current.pause();
      setCountdown(null);
      setGameStarted(true);
    });

    socket.on("new_word", (word) => {

      setCurrentWord(word);

      setInput("");

    });

    socket.on("hp_update", (data) => {

      setShake(true);
    
      setTimeout(() => {
        setShake(false);
      }, 300);
    
      setRedHP(data.redHP);
    
      setBlueHP(data.blueHP);
    
    });

    socket.on("game_over", (data) => {

      victoryAudio.current.currentTime = 0;

victoryAudio.current.play();

      setWinner(data.winner);

      setGameStarted(false);

    });

    socket.on("round_winner", (data) => {
      attackAudio.current.currentTime = 0;

      attackAudio.current.play()

      setRoundWinner(
        `${data.player} attacked first!`
      );

      setTimeout(() => {
        setRoundWinner("");
      }, 2000);

    });

    socket.on("wrong_word", () => {

      wrongAudio.current.currentTime = 0;
    
      wrongAudio.current.play();
    
    });

    socket.on("combo_update", (data) => {

      if (data.combo >= 2) {

        setComboMessage(
          `${data.player} is on ${data.combo} streak!`
        );

        setTimeout(() => {
          setComboMessage("");
        }, 2000);

      }

    });

    return () => {

      socket.off("wrong_word");

    };

  }, []);

  // JOIN ROOM
  const handleJoin = () => {

    if (!username.trim()) return;

    if (!roomId.trim()) return;

    socket.emit("join_room", {
      username,
      roomId,
    });

    setJoined(true);

  };

  // SUBMIT WORD
  const handleSubmit = (e) => {

    e.preventDefault();

    if (!input.trim()) return;

    socket.emit("submit_word", {
      roomId,
      word: input,
    });

    setInput("");

  };

  // JOIN SCREEN
  if (!joined) {

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">

        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">

          <h1 className="text-4xl font-bold text-center mb-8">
            ⚔️ Last Typist Standing
          </h1>

          <input
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            className="w-full p-4 mb-4 rounded-xl bg-zinc-800 border border-zinc-700 outline-none focus:border-green-500"
          />

          <input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) =>
              setRoomId(e.target.value)
            }
            className="w-full p-4 mb-6 rounded-xl bg-zinc-800 border border-zinc-700 outline-none focus:border-green-500"
          />

          <button
            onClick={handleJoin}
            className="w-full p-4 rounded-xl bg-green-500 hover:bg-green-600 transition-all font-bold text-lg"
          >
            Join Battle
          </button>

        </div>

      </div>
    );
  }

  // GAME SCREEN
  return (
    <div className="min-h-screen bg-black text-white p-4">

<motion.div
  className="max-w-5xl mx-auto"
  animate={
    shake
      ? {
          x: [-10, 10, -10, 10, 0],
        }
      : {}
  }
  transition={{
    duration: 0.3,
  }}
>

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">

          <div>
            <h1 className="text-3xl font-bold">
              ⚔️ Last Typist Standing
            </h1>

            <p className="text-zinc-400">
              Room: {roomId}
            </p>
          </div>

          <div className="text-white">
  {isHost ? "I AM HOST" : "NOT HOST"}
</div>

          <div className="bg-zinc-900 px-5 py-3 rounded-2xl border border-zinc-800">
            Team:
            {" "}
            <span
              className={
                myTeam === "red"
                  ? "text-red-400 font-bold"
                  : "text-blue-400 font-bold"
              }
            >
              {myTeam.toUpperCase()}
            </span>
          </div>

        </div>

        {/* HP BARS */}
        <div className="grid grid-cols-2 gap-4 mb-8">

          {/* RED */}
          <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">

            <div className="flex justify-between mb-2">
              <span className="font-bold text-red-400">
                🔴 RED TEAM
              </span>

              <span>{redHP} HP</span>
            </div>

            <div className="w-full h-5 bg-zinc-800 rounded-full overflow-hidden">


              <motion.div
  className="h-full bg-red-500" 
  animate={{
    width: `${redHP}%`,
    opacity: shake ? [1, 0.5, 1] : 1,
  }}
  transition={{
    duration: 0.3,
  }}
  ></motion.div>

            </div>

          </div>

          {/* BLUE */}
          <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">

            <div className="flex justify-between mb-2">
              <span className="font-bold text-blue-400">
                🔵 BLUE TEAM
              </span>

              <span>{blueHP} HP</span>
            </div>

            <div className="w-full h-5 bg-zinc-800 rounded-full overflow-hidden">

              <motion.div
  className="h-full bg-blue-500"
  animate={{
    width: `${blueHP}%`,
    opacity: shake ? [1, 0.5, 1] : 1,
  }}
  transition={{
    duration: 0.3,
  }}
  ></motion.div>
            </div>

          </div>

        </div>

        {/* MAIN GAME */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* GAME PANEL */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

          {
    !gameStarted && !winner && room && (
    isHost ? (

      room.players.length >= 2 && (

        <button
          onClick={() => {

            socket.emit("start_game", {
              roomId,
            });

          }}
          className="w-full mb-5 p-4 rounded-2xl bg-green-500 hover:bg-green-600 font-bold text-xl transition-all"
        >
          🚀 Start Game
        </button>

      )

    ) : (

      <div className="w-full mb-5 p-4 rounded-2xl bg-yellow-500/20 border border-yellow-500 text-center text-yellow-300 font-bold text-lg animate-pulse">
        ⏳ Waiting for host to start...
      </div>

    )
  )
}

            {/* WAITING */}
            {
              room &&
              room.players.length < 2 && (
                <div className="text-center text-2xl font-bold">
                 ⏳ Waiting for players...
                </div>
              )
            }

            {/* COUNTDOWN */}
            {
              countdown !== null &&
              !gameStarted &&
              !winner && (
                <div className="text-center">

                  <div className="text-7xl font-bold text-green-400 mb-4 animate-pulse">
                    {countdown}
                  </div>

                  <p className="text-zinc-400">
                    Battle starting...
                  </p>

                </div>
              )
            }

            {/* GAME */}
            {
              gameStarted && !winner && (
                <>

                  {
                    roundWinner && (
                
                      <motion.div
                      initial={{
                        y: -20,
                        opacity: 0,
                      }}
                      animate={{
                        y: 0,
                        opacity: 1,
                      }}
                      className="text-center text-yellow-400 font-bold mb-3"
                    > ⚡ {roundWinner} </motion.div>
                    )
                  }

                  {
                    comboMessage && (
                      <div className="text-center text-orange-400 font-bold mb-4">
                        🔥 {comboMessage}
                      </div>
                    )
                  }

                  <div className="text-center mb-8">

                    <h2 className="text-zinc-500 mb-2">
                      TYPE THIS WORD
                    </h2>

                    <motion.div
  key={currentWord}
  initial={{
    scale: 0.5,
    opacity: 0,
  }}
  animate={{
    scale: 1,
    opacity: 1,
  }}
  transition={{
    duration: 0.3,
  }}
  className="text-6xl font-extrabold tracking-wide"
>
  {currentWord}
</motion.div>

                  </div>

                  <form onSubmit={handleSubmit}>

                    <input
                      value={input}
                      onChange={(e) =>
                        setInput(e.target.value)
                      }
                      placeholder="Type fast..."
                      autoFocus
                      className="w-full p-5 rounded-2xl bg-zinc-800 border border-zinc-700 outline-none text-2xl focus:border-green-500"
                    />

                  </form>

                </>
              )
            }

            {/* WINNER */}
            {
              winner && (
                <div className="text-center">

                  <div className="text-7xl mb-5">
                    🏆
                  </div>

                  <h1 className="text-5xl font-bold">

                    <span
                      className={
                        winner === "RED"
                          ? "text-red-400"
                          : "text-blue-400"
                      }
                    >
                      {winner}
                    </span>

                    {" "}
                    TEAM WINS

                  </h1>

                </div>
              )
            }

          </div>

          {/* PLAYERS PANEL */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

            <h2 className="text-2xl font-bold mb-5">
              Players
            </h2>

            <div className="space-y-3">

              {
                room?.players.map((player) => (

                  <div
                    key={player.socketId}
                    className="bg-zinc-800 rounded-xl p-4 flex justify-between items-center"
                  >

                    <span>
                      {player.username}
                      {
    room.host === player.socketId &&
    " 👑"
  }
                    </span>

                    <span
                      className={
                        player.team === "red"
                          ? "text-red-400"
                          : "text-blue-400"
                      }
                    >
                      {player.team}
                    </span>

                  </div>

                ))
              }

            </div>

          </div>

        </div>

        </motion.div>

    </div>
  );
}

export default App;