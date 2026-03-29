export default function BenchmarkCards({ benchmarks }) {
  if (!benchmarks) return null;

  const cards = [
    { label: "Win Rate", value: `${(benchmarks.win_rate * 100).toFixed(1)}%`, color: "#4caf50" },
    { label: "Loss Rate", value: `${(benchmarks.loss_rate * 100).toFixed(1)}%`, color: "#f44336" },
    { label: "Draw Rate", value: `${(benchmarks.draw_rate * 100).toFixed(1)}%`, color: "#ff9800" },
    { label: "House Edge", value: `${benchmarks.house_edge_percent.toFixed(2)}%`, color: "#9c27b0" },
    { label: "Avg Reward", value: benchmarks.avg_reward.toFixed(4), color: "#2196f3" },
  ];

  return (
    <div className="benchmark-cards">
      {cards.map((c) => (
        <div key={c.label} className="card" style={{ borderTop: `3px solid ${c.color}` }}>
          <div className="card-value">{c.value}</div>
          <div className="card-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
