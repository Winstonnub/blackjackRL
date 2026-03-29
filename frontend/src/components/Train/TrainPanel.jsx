import { useState } from "react";
import { useTraining } from "../../hooks/useTraining";

const DEFAULTS = {
  algorithm: "qlearning",
  episodes: 100000,
  learning_rate: 0.01,
  discount_factor: 0.95,
  epsilon_start: 1.0,
  epsilon_end: 0.1,
  model_name: "",
};

export default function TrainPanel({ onModelTrained }) {
  const [params, setParams] = useState({ ...DEFAULTS });
  const { startTraining, isTraining, progress, error } =
    useTraining(onModelTrained);

  const set = (key, value) => setParams((p) => ({ ...p, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    startTraining(params);
  };

  return (
    <div className="train-panel">
      <h2>Train New Model</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Algorithm
          <select
            value={params.algorithm}
            onChange={(e) => set("algorithm", e.target.value)}
            disabled={isTraining}
          >
            <option value="qlearning">Q-Learning</option>
            <option value="monte_carlo">Monte Carlo</option>
            <option value="sarsa">SARSA</option>
            <option value="expected_sarsa">Expected SARSA</option>
            <option value="double_qlearning">Double Q-Learning</option>
          </select>
        </label>

        <label>
          Model Name
          <input
            type="text"
            value={params.model_name}
            onChange={(e) => set("model_name", e.target.value)}
            placeholder="my_model_v1"
            disabled={isTraining}
          />
        </label>

        <label>
          Episodes
          <input
            type="number"
            value={params.episodes}
            onChange={(e) => set("episodes", Number(e.target.value))}
            min={1000}
            max={1000000}
            step={1000}
            disabled={isTraining}
          />
        </label>

        <label>
          Learning Rate
          <input
            type="number"
            value={params.learning_rate}
            onChange={(e) => set("learning_rate", Number(e.target.value))}
            min={0.001}
            max={1}
            step={0.001}
            disabled={isTraining}
          />
        </label>

        <label>
          Discount Factor
          <input
            type="number"
            value={params.discount_factor}
            onChange={(e) => set("discount_factor", Number(e.target.value))}
            min={0.1}
            max={1}
            step={0.01}
            disabled={isTraining}
          />
        </label>

        <div className="epsilon-row">
          <label>
            Epsilon Start
            <input
              type="number"
              value={params.epsilon_start}
              onChange={(e) => set("epsilon_start", Number(e.target.value))}
              min={0}
              max={1}
              step={0.1}
              disabled={isTraining}
            />
          </label>
          <label>
            Epsilon End
            <input
              type="number"
              value={params.epsilon_end}
              onChange={(e) => set("epsilon_end", Number(e.target.value))}
              min={0}
              max={1}
              step={0.01}
              disabled={isTraining}
            />
          </label>
        </div>

        <button type="submit" disabled={isTraining}>
          {isTraining ? "Training..." : "Start Training"}
        </button>
      </form>

      {isTraining && (
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${progress * 100}%` }}
          />
          <span>{Math.round(progress * 100)}%</span>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
