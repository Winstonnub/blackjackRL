const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === "true";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

// Static-mode model fetchers (read from /public/models/)
async function staticListModels() {
  const res = await fetch("/models/index.json");
  return res.json();
}

async function staticGetBenchmarks(modelId) {
  const res = await fetch(`/models/${modelId}.json`);
  const data = await res.json();
  return {
    model_id: data.model_id,
    name: data.name,
    algorithm: data.algorithm,
    episodes: data.episodes,
    trained_at: data.trained_at,
    hyperparams: data.hyperparams,
    benchmarks: data.benchmarks,
    learning_curve: data.learning_curve,
  };
}

export const api = {
  // Training — not available in static mode
  startTraining: (body) =>
    request("/train", { method: "POST", body: JSON.stringify(body) }),
  getJobStatus: (jobId) => request(`/train/${jobId}`),

  // Models
  listModels: () =>
    STATIC_MODE ? staticListModels() : request("/models"),
  getBenchmarks: (modelId) =>
    STATIC_MODE ? staticGetBenchmarks(modelId) : request(`/models/${modelId}/benchmarks`),
  recommend: (modelId, state) =>
    request(`/models/${modelId}/recommend`, {
      method: "POST",
      body: JSON.stringify(state),
    }),
  deleteModel: (modelId) =>
    request(`/models/${modelId}`, { method: "DELETE" }),

  // Game — handled by engine in static mode, API in dev mode
  newGame: (modelId) =>
    request("/game/new", {
      method: "POST",
      body: JSON.stringify({ model_id: modelId || null }),
    }),
  gameAction: (gameId, action) =>
    request(`/game/${gameId}/action`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
};
