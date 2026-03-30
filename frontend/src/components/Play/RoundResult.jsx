const RESULT_COLORS = {
  win: "#4caf50",
  loss: "#f44336",
  draw: "#ff9800",
};

const ACTION_COLORS = {
  hit: "#f44336",
  stand: "#2196f3",
};

export default function RoundResult({ outcome }) {
  if (!outcome) return null;

  const { human, model, dealer_final_sum, dealer_busted, player_final_sum } =
    outcome;

  return (
    <div className="round-result">
      <h3>Round Over</h3>

      <div className="dealer-result">
        Dealer: {dealer_final_sum}
        {dealer_busted && <span className="busted"> (BUSTED)</span>}
      </div>

      <div
        className="result-badge"
        style={{ background: RESULT_COLORS[human.result] }}
      >
        You: {human.result.toUpperCase()} — Final hand: {player_final_sum}
      </div>

      {model && (
        <div className="ai-result">
          <div
            className="result-badge"
            style={{ background: RESULT_COLORS[model.result] }}
          >
            AI: {model.result.toUpperCase()}
          </div>
          <div className="ai-actions">
            <span className="ai-actions-label">AI played:</span>
            {model.actions_taken.map((action, i) => (
              <span
                key={i}
                className="action-chip"
                style={{ background: ACTION_COLORS[action] }}
              >
                {action}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
