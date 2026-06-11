import Lobby from "./components/Lobby";
import GameBoard from "./components/GameBoard";
import { useGameSocket } from "./hooks/useGameSocket";

function App() {
  const {
    joined,
    joinError,
    username,
    setUsername,
    roomId,
    setRoomId,
    shake,
    gameState,
    flash,
    handleJoin,
    toggleReady,
    startGame,
    restartGame,
    submitWord,
    primeAudio,
    socketId,
  } = useGameSocket();

  if (!joined) {
    return (
      <Lobby
        username={username}
        setUsername={setUsername}
        roomId={roomId}
        setRoomId={setRoomId}
        joinError={joinError}
        onJoin={handleJoin}
      />
    );
  }

  const myPlayer = gameState.players.find((p) => p.socketId === socketId);

  return (
    <GameBoard
      roomId={roomId}
      shake={shake}
      gameState={gameState}
      flash={flash}
      socketId={socketId}
      myPlayer={myPlayer}
      myTeam={myPlayer?.team || ""}
      onToggleReady={toggleReady}
      onStartGame={startGame}
      onRestartGame={restartGame}
      onSubmitWord={submitWord}
      onPrepareAudio={primeAudio}
    />
  );
}

export default App;
