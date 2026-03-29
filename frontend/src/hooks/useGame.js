import { useState, useCallback } from "react";
import { api } from "../api/client";

const INITIAL_STATS = { wins: 0, losses: 0, draws: 0, total: 0 };

export function useGame() {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [humanStats, setHumanStats] = useState({ ...INITIAL_STATS });
  const [modelStats, setModelStats] = useState({ ...INITIAL_STATS });

  const newGame = useCallback(async (modelId) => {
    setLoading(true);
    try {
      const state = await api.newGame(modelId);
      setGameState(state);
    } finally {
      setLoading(false);
    }
  }, []);

  const doAction = useCallback(
    async (action) => {
      if (!gameState || gameState.is_terminal) return;
      setLoading(true);
      try {
        const state = await api.gameAction(gameState.game_id, action);
        setGameState(state);

        if (state.is_terminal && state.outcome) {
          const { human, model } = state.outcome;

          setHumanStats((prev) => ({
            wins: prev.wins + (human.result === "win" ? 1 : 0),
            losses: prev.losses + (human.result === "loss" ? 1 : 0),
            draws: prev.draws + (human.result === "draw" ? 1 : 0),
            total: prev.total + 1,
          }));

          if (model) {
            setModelStats((prev) => ({
              wins: prev.wins + (model.result === "win" ? 1 : 0),
              losses: prev.losses + (model.result === "loss" ? 1 : 0),
              draws: prev.draws + (model.result === "draw" ? 1 : 0),
              total: prev.total + 1,
            }));
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [gameState]
  );

  const resetStats = useCallback(() => {
    setHumanStats({ ...INITIAL_STATS });
    setModelStats({ ...INITIAL_STATS });
  }, []);

  return { gameState, loading, newGame, doAction, humanStats, modelStats, resetStats };
}
