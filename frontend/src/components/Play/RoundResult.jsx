const RESULT_COLORS = {
  win: "#4caf50",
  loss: "#f44336",
  draw: "#ff9800",
};

const ACTION_COLORS = {
  hit: "#f44336",
  stand: "#2196f3",
};

function GamePanel({ title, result, reward, dealerSum, dealerBusted, playerSum, actions, color }) {
  return (
    <div className="game-panel" style={{ borderTop: `3px solid ${color}` }}>
      <div className="game-panel-title">{title}</div>

      <div className="game-panel-row">
        <span className="game-panel-label">Your hand</span>
        <span className="game-panel-value">{playerSum}</span>
      </div>

      <div className="game-panel-row">
        <span className="game-panel-label">Dealer</span>
        <span className="game-panel-value">
          {dealerSum}
          {dealerBusted && <span className="busted"> BUST</span>}
        </span>
      </div>

      {actions && (
        <div className="game-panel-actions">
          {actions.map((action, i) => (
            <span
              key={i}
              className="action-chip"
              style={{ background: ACTION_COLORS[action] }}
            >
              {action}
            </span>
          ))}
        </div>
      )}

      <div
        className="game-panel-result"
        style={{ background: RESULT_COLORS[result] }}
      >
        {result.toUpperCase()}
      </div>
    </div>
  );
}

export default function RoundResult({ outcome }) {
  if (!outcome) return null;

  const { human, model, dealer_final_sum, dealer_busted, player_final_sum } =
    outcome;

  return (
    <div className="round-result">
      <h3>Round Over</h3>
      <p className="same-deal-note">Same starting hand, parallel games</p>

      <div className="game-panels">
        <GamePanel
          title="You"
          result={human.result}
          reward={human.reward}
          dealerSum={dealer_final_sum}
          dealerBusted={dealer_busted}
          playerSum={player_final_sum}
          color="#2196f3"
        />

        {model && (
          <GamePanel
            title="AI Model"
            result={model.result}
            reward={model.reward}
            dealerSum={model.dealer_final_sum ?? dealer_final_sum}
            dealerBusted={model.dealer_busted ?? dealer_busted}
            playerSum={model.player_final_sum ?? player_final_sum}
            actions={model.actions_taken}
            color="#ff9800"
          />
        )}
      </div>
    </div>
  );
}
