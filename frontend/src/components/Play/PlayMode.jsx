import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/client";
import { useGame } from "../../hooks/useGame";
import HandDisplay from "./HandDisplay";
import RoundResult from "./RoundResult";
import StatsPanel from "./StatsPanel";

export default function PlayMode() {
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [hintVisible, setHintVisible] = useState(false);
  const { gameState, loading, newGame, doAction, humanStats, modelStats, resetStats } =
    useGame();

  useEffect(() => {
    api.listModels().then(setModels);
  }, []);

  const startNewRound = useCallback(() => {
    setHintVisible(false);
    newGame(selectedModelId);
  }, [newGame, selectedModelId]);

  const handleAction = useCallback((action) => {
    setHintVisible(false);
    doAction(action);
  }, [doAction]);

  const hand = gameState?.hand_state;

  return (
    <div className="play-mode">
      <div className="play-header">
        <h2>Play Blackjack</h2>
        <div className="play-controls">
          <label>
            AI Companion
            <select
              value={selectedModelId || ""}
              onChange={(e) => {
                setSelectedModelId(e.target.value || null);
                resetStats();
              }}
            >
              <option value="">None (solo play)</option>
              {models.map((m) => (
                <option key={m.model_id} value={m.model_id}>
                  {m.name} ({m.algorithm})
                </option>
              ))}
            </select>
          </label>
          <button onClick={startNewRound} disabled={loading}>
            {gameState ? "New Hand" : "Deal"}
          </button>
        </div>
      </div>

      {hand && (
        <div className="table">
          <HandDisplay
            label={`Dealer showing`}
            sum={hand.dealer_upcard}
          />

          <HandDisplay
            label="Your Hand"
            sum={hand.player_sum}
            usableAce={hand.usable_ace}
            highlight={
              gameState.is_terminal
                ? gameState.outcome?.human.result === "win"
                  ? "win"
                  : gameState.outcome?.human.result === "loss"
                  ? "loss"
                  : "draw"
                : ""
            }
          />

          {!gameState.is_terminal && (
            <div className="action-buttons">
              <button
                className="btn-hit"
                onClick={() => handleAction("hit")}
                disabled={loading}
              >
                Hit
              </button>
              <button
                className="btn-stand"
                onClick={() => handleAction("stand")}
                disabled={loading}
              >
                Stand
              </button>

              {gameState.model_recommendation && (
                <button
                  className="btn-hint"
                  onClick={() => setHintVisible((v) => !v)}
                >
                  {hintVisible
                    ? `AI: ${gameState.model_recommendation}`
                    : "Reveal AI hint"}
                </button>
              )}
            </div>
          )}

          {gameState.is_terminal && (
            <>
              <RoundResult outcome={gameState.outcome} />
              <button className="btn-deal" onClick={startNewRound}>
                Deal Again
              </button>
            </>
          )}
        </div>
      )}

      <StatsPanel humanStats={humanStats} modelStats={modelStats} />
    </div>
  );
}
