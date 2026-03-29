export default function ModelSelector({ models, selectedId, onSelect }) {
  if (!models.length) {
    return <p className="muted">No models trained yet. Train one first!</p>;
  }

  return (
    <div className="model-selector">
      <label>
        Select Model
        <select
          value={selectedId || ""}
          onChange={(e) => onSelect(e.target.value || null)}
        >
          <option value="">-- Choose a model --</option>
          {models.map((m) => (
            <option key={m.model_id} value={m.model_id}>
              {m.name} ({m.algorithm}, {m.episodes.toLocaleString()} eps)
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
