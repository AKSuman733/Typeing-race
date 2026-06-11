export default function HPBar({ hp, maxHp, colorClass }) {
  const safeMax = maxHp > 0 ? maxHp : 1;
  const width = `${Math.max(0, Math.min(100, (hp / safeMax) * 100))}%`;

  return (
    <div className="w-full h-4 sm:h-5 bg-zinc-800 rounded-full overflow-hidden">
      <div className={`h-full hp-bar ${colorClass}`} style={{ width }} />
    </div>
  );
}
