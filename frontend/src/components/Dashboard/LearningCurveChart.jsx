import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function LearningCurveChart({ learningCurve }) {
  if (!learningCurve || !learningCurve.checkpoints?.length) {
    return <p className="muted">No learning curve data available.</p>;
  }

  const data = learningCurve.checkpoints.map((ep, i) => ({
    episode: ep,
    avg_reward: learningCurve.avg_rewards[i],
    epsilon: learningCurve.epsilons[i],
  }));

  return (
    <div className="chart-container">
      <h3>Learning Curve</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="episode"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" domain={[0, 1]} />
          <Tooltip
            formatter={(val, name) =>
              name === "epsilon" ? val.toFixed(3) : val.toFixed(4)
            }
            labelFormatter={(ep) => `Episode ${ep.toLocaleString()}`}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="avg_reward"
            stroke="#2196f3"
            dot={false}
            name="Avg Reward"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="epsilon"
            stroke="#ff9800"
            dot={false}
            name="Epsilon"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
