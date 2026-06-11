import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import HPBar from "./HPBar";
import PlayerList from "./PlayerList";

export default function GameBoard({
  roomId,
  shake,
  gameState,
  flash,
  socketId,
  myPlayer,
  myTeam,
  onToggleReady,
  onStartGame,
  onRestartGame,
  onSubmitWord,
  onPrepareAudio,
}) {
  const wordInputRef = useRef(null);

  useEffect(() => {
    if (gameState.status !== "playing" || !gameState.currentWord) return;

    if (wordInputRef.current) {
      wordInputRef.current.value = "";
      wordInputRef.current.focus();
    }
  }, [gameState.currentWord, gameState.status]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const word = wordInputRef.current?.value.trim();
    if (!word) return;
    onSubmitWord(word);
    wordInputRef.current.value = "";
    wordInputRef.current.focus();
  };

  const isHost = gameState.host === socketId;
  const onlineCount = gameState.playerCount ?? gameState.players.filter((p) => !p.disconnected).length;
  const readyCount = gameState.readyCount ?? gameState.players.filter((p) => p.ready && !p.disconnected).length;
  const allReady = onlineCount >= 2 && readyCount === onlineCount;

  return (
    <div className="min-h-screen bg-black text-white p-3 sm:p-4 pb-24 sm:pb-4">
      <div className={`max-w-5xl mx-auto${shake ? " animate-shake" : ""}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              ⚔️ Last Typist Standing
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base">Room: {roomId}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-800 text-sm sm:text-base">
              Team:{" "}
              <span
                className={
                  myTeam === "red"
                    ? "text-red-400 font-bold"
                    : "text-blue-400 font-bold"
                }
              >
                {myTeam.toUpperCase() || "—"}
              </span>
            </div>

            {myPlayer?.stats && (
              <div className="bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-800 text-sm">
                You: {myPlayer.stats.bestWpm} WPM · {myPlayer.stats.correct}✓ /{" "}
                {myPlayer.stats.wrong}✗
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-800">
            <div className="flex justify-between mb-2 text-sm sm:text-base">
              <span className="font-bold text-red-400">🔴 RED TEAM</span>
              <span>
                {gameState.redHP}/{gameState.maxRedHP} HP
              </span>
            </div>
            <HPBar
              hp={gameState.redHP}
              maxHp={gameState.maxRedHP}
              colorClass="bg-red-500"
            />
          </div>

          <div className="bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-800">
            <div className="flex justify-between mb-2 text-sm sm:text-base">
              <span className="font-bold text-blue-400">🔵 BLUE TEAM</span>
              <span>
                {gameState.blueHP}/{gameState.maxBlueHP} HP
              </span>
            </div>
            <HPBar
              hp={gameState.blueHP}
              maxHp={gameState.maxBlueHP}
              colorClass="bg-blue-500"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-8">
            {gameState.status === "waiting" && onlineCount < 2 && (
              <div className="text-center text-xl sm:text-2xl font-bold">
                ⏳ Waiting for players...
              </div>
            )}

            {gameState.status === "waiting" && onlineCount >= 2 && (
              <div className="space-y-4">
                <p className="text-center text-zinc-400">
                  Ready: {readyCount}/{onlineCount}
                </p>

                <button
                  onClick={onToggleReady}
                  className={`w-full p-4 rounded-2xl font-bold text-lg transition-all ${
                    myPlayer?.ready
                      ? "bg-zinc-700 hover:bg-zinc-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {myPlayer?.ready ? "❌ Not Ready" : "✅ Ready Up"}
                </button>

                {isHost ? (
                  <button
                    onClick={onStartGame}
                    disabled={!allReady}
                    className="w-full p-4 rounded-2xl bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xl transition-all"
                  >
                    🚀 Start Game
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-yellow-500/20 border border-yellow-500 text-center text-yellow-300 font-bold">
                    {allReady
                      ? "⏳ Waiting for host to start..."
                      : "⏳ Waiting for all players to ready up..."}
                  </div>
                )}
              </div>
            )}

            {gameState.status === "countdown" && (
              <div className="text-center">
                <div className="text-6xl sm:text-7xl font-bold text-green-400 mb-4 animate-pulse">
                  {gameState.countdown}
                </div>
                <p className="text-zinc-400">Battle starting...</p>
              </div>
            )}

            {gameState.status === "playing" && (
              <>
                {flash.roundWinner && (
                  <div className="text-center text-yellow-400 font-bold mb-3 text-sm sm:text-base">
                    ⚡ {flash.roundWinner}
                  </div>
                )}

                {flash.comboMessage && (
                  <div className="text-center text-orange-400 font-bold mb-4 text-sm sm:text-base">
                    🔥 {flash.comboMessage}
                  </div>
                )}

                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-zinc-500 mb-2 text-sm sm:text-base">
                    TYPE THIS WORD
                  </h2>

                  <motion.div
                    key={gameState.currentWord}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-4xl sm:text-6xl font-extrabold tracking-wide break-words"
                  >
                    {gameState.currentWord}
                  </motion.div>
                </div>

                <form onSubmit={handleSubmit} className="game-input-sticky">
                  <input
                    ref={wordInputRef}
                    defaultValue=""
                    placeholder="Type fast..."
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    onFocus={() => onPrepareAudio?.()}
                    className="w-full p-4 sm:p-5 rounded-2xl bg-zinc-800 border border-zinc-700 outline-none text-xl sm:text-2xl focus:border-green-500"
                  />
                </form>
              </>
            )}

            {gameState.status === "finished" && (
              <div className="text-center">
                <div className="text-6xl sm:text-7xl mb-5">🏆</div>
                <h1 className="text-3xl sm:text-5xl font-bold mb-8">
                  <span
                    className={
                      gameState.winner === "RED"
                        ? "text-red-400"
                        : "text-blue-400"
                    }
                  >
                    {gameState.winner}
                  </span>{" "}
                  TEAM WINS
                </h1>

                {isHost ? (
                  <button
                    onClick={onRestartGame}
                    className="w-full max-w-sm mx-auto p-4 rounded-2xl bg-green-500 hover:bg-green-600 font-bold text-xl transition-all"
                  >
                    🔄 Play Again
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-yellow-500/20 border border-yellow-500 text-yellow-300 font-bold">
                    ⏳ Waiting for host to restart...
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-5">Your Team</h2>
            <PlayerList
              players={gameState.players}
              host={gameState.host}
              myTeam={myTeam}
              opponentCount={gameState.opponentCount ?? 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
