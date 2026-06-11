import { MAX_PLAYERS } from "../config/gameConfig";

export default function Lobby({
  username,
  setUsername,
  roomId,
  setRoomId,
  joinError,
  onJoin,
}) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8">
          ⚔️ Last Typist Standing
        </h1>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={20}
          className="w-full p-4 mb-4 rounded-xl bg-zinc-800 border border-zinc-700 outline-none focus:border-green-500"
        />

        <input
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          maxLength={24}
          className="w-full p-4 mb-6 rounded-xl bg-zinc-800 border border-zinc-700 outline-none focus:border-green-500"
        />

        {joinError && (
          <p className="mb-4 text-center text-red-400 font-medium">{joinError}</p>
        )}

        <button
          onClick={onJoin}
          className="w-full p-4 rounded-xl bg-green-500 hover:bg-green-600 transition-all font-bold text-lg"
        >
          Join Battle
        </button>

        <p className="mt-4 text-center text-zinc-500 text-sm">
          Up to {MAX_PLAYERS} players per room (25 per team)
        </p>
      </div>
    </div>
  );
}
