/**
 * Browser-side agent: loads a pre-trained Q-table JSON and acts greedily.
 */

const cache = {};

export async function loadAgent(modelId) {
  if (cache[modelId]) return cache[modelId];

  const res = await fetch(`/models/${modelId}.json`);
  if (!res.ok) throw new Error(`Failed to load model: ${modelId}`);
  const data = await res.json();

  const agent = {
    modelId,
    name: data.name,
    algorithm: data.algorithm,
    benchmarks: data.benchmarks,
    learningCurve: data.learning_curve,
    qTable: data.q_table,
  };

  cache[modelId] = agent;
  return agent;
}

/** Returns 0 (stand) or 1 (hit) */
export function act(agent, obs) {
  const [playerSum, dealerUpcard, usableAce] = obs;
  const key = `${playerSum},${dealerUpcard},${usableAce ? 1 : 0}`;
  const q = agent.qTable[key];
  if (!q) return 1; // default hit if state unseen
  return q[1] > q[0] ? 1 : 0;
}

/** Returns { stand: float, hit: float } */
export function getQValues(agent, obs) {
  const [playerSum, dealerUpcard, usableAce] = obs;
  const key = `${playerSum},${dealerUpcard},${usableAce ? 1 : 0}`;
  const q = agent.qTable[key] ?? [0, 0];
  return { stand: q[0], hit: q[1] };
}

