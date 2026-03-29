function StatRow({ label, stats, color }) {
  const winRate = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : "0.0";
  return (
    <div className="stat-row" style={{ borderLeft: `3px solid ${color}` }}>
      <strong>{label}</strong>
      <div className="stat-numbers">
        <span className="win">W: {stats.wins}</span>
        <span className="loss">L: {stats.losses}</span>
        <span className="draw">D: {stats.draws}</span>
        <span className="rate">({winRate}%)</span>
      </div>
    </div>
  );
}

export default function StatsPanel({ humanStats, modelStats }) {
  return (
    <div className="stats-panel">
      <h3>Session Stats</h3>
      <StatRow label="You" stats={humanStats} color="#2196f3" />
      {modelStats.total > 0 && (
        <StatRow label="AI Model" stats={modelStats} color="#ff9800" />
      )}
    </div>
  );
}
