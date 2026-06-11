import { memo } from "react";

const PlayerList = memo(function PlayerList({
  players,
  host,
  myTeam,
  opponentCount = 0,
}) {
  const online = players.filter((p) => !p.disconnected);
  const compact = players.length > 10;
  const teamLabel = myTeam === "red" ? "🔴 Red" : myTeam === "blue" ? "🔵 Blue" : "Your";

  return (
    <>
      <p className="text-sm text-zinc-400 mb-4">
        {teamLabel} team: {online.length} · Opponents: {opponentCount}
      </p>

      <div
        className={`space-y-2 overflow-y-auto pr-1 ${
          compact ? "max-h-64 sm:max-h-80" : ""
        }`}
      >
        {online.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-4">
            No teammates visible yet
          </p>
        )}

        {players.map((player) => (
          <div
            key={player.socketId}
            className={`bg-zinc-800 rounded-xl ${
              compact ? "p-2.5 text-sm" : "p-3 sm:p-4"
            } ${player.disconnected ? "opacity-50" : ""}`}
          >
            <div className="flex justify-between items-center gap-2">
              <span className="truncate">
                {player.username}
                {host === player.socketId && " 👑"}
                {player.disconnected && " (away)"}
              </span>
            </div>

            <div className="mt-1 flex justify-between text-xs text-zinc-500">
              <span>{player.ready ? "✅ Ready" : "⏳ Not ready"}</span>
              <span>
                {player.stats?.bestWpm ? `${player.stats.bestWpm} WPM` : "— WPM"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
});

export default PlayerList;
