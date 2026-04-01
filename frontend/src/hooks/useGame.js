import { useState, useCallback } from "react";
import { api } from "../api/client";
import { newHand, step, dealerInfo, playerFinalSum } from "../engine/blackjack";
import { loadAgent, act, getQValues } from "../engine/agent";

const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === "true";
const INITIAL_STATS = { wins: 0, losses: 0, draws: 0, total: 0 };

function resultFromReward(reward) {
  if (reward > 0) return "win";
  if (reward < 0) return "loss";
  return "draw";
}

/** Play the agent's full hand from a given seed, return actions + result + dealer info */
function playAgentHand(agent, seed) {
  const state = newHand(seed);
  const actions = [];

  while (!state.terminated) {
    const action = act(agent, state.obs);
    actions.push(action === 1 ? "hit" : "stand");
    step(state, action);
  }

  const { dealerFinalSum, dealerBusted } = dealerInfo(state);

  return {
    actions_taken: actions,
    reward: state.reward,
    result: resultFromReward(state.reward),
    dealer_final_sum: dealerFinalSum,
    dealer_busted: dealerBusted,
    player_final_sum: playerFinalSum(state),
  };
}

export function useGame() {
  const [gameState, setGameState] = useState(null);
  const [engineState, setEngineState] = useState(null); // browser engine state
  const [loading, setLoading] = useState(false);
  const [humanStats, setHumanStats] = useState({ ...INITIAL_STATS });
  const [modelStats, setModelStats] = useState({ ...INITIAL_STATS });

  const newGame = useCallback(async (modelId) => {
    setLoading(true);
    try {
      if (!STATIC_MODE) {
        const state = await api.newGame(modelId);
        setGameState(state);
        setEngineState(null);
        return;
      }

      // Static mode: run entirely in browser
      const seed = Math.floor(Math.random() * 2 ** 31);
      const state = newHand(seed);
      const [playerSum, dealerUpcard, usableAce] = state.obs;

      let modelAgent = null;
      let modelPlaythrough = null;
      if (modelId) {
        modelAgent = await loadAgent(modelId);
        modelPlaythrough = playAgentHand(modelAgent, seed);
      }

      const recommendation =
        modelAgent && !state.terminated
          ? act(modelAgent, state.obs) === 1
            ? "hit"
            : "stand"
          : null;

      setEngineState({ state, modelAgent, modelPlaythrough, seed });
      setGameState({
        game_id: `local-${seed}`,
        hand_state: { player_sum: playerSum, dealer_upcard: dealerUpcard, usable_ace: usableAce },
        model_recommendation: recommendation,
        is_terminal: false,
        outcome: null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const doAction = useCallback(
    async (action) => {
      if (!gameState || gameState.is_terminal) return;
      setLoading(true);
      try {
        if (!STATIC_MODE) {
          const state = await api.gameAction(gameState.game_id, action);
          setGameState(state);
          _updateStats(state);
          return;
        }

        // Static mode
        const { state, modelAgent, modelPlaythrough } = engineState;
        const actionIdx = action === "hit" ? 1 : 0;
        step(state, actionIdx);

        const [playerSum, dealerUpcard, usableAce] = state.obs;

        let outcome = null;
        if (state.terminated) {
          const { dealerFinalSum, dealerBusted } = dealerInfo(state);
          const pSum = playerFinalSum(state);
          const humanResult = resultFromReward(state.reward);

          outcome = {
            human: { result: humanResult, reward: state.reward },
            model: modelPlaythrough
              ? {
                  result: modelPlaythrough.result,
                  reward: modelPlaythrough.reward,
                  actions_taken: modelPlaythrough.actions_taken,
                  dealer_final_sum: modelPlaythrough.dealer_final_sum,
                  dealer_busted: modelPlaythrough.dealer_busted,
                  player_final_sum: modelPlaythrough.player_final_sum,
                }
              : null,
            dealer_final_sum: dealerFinalSum,
            dealer_busted: dealerBusted,
            player_final_sum: pSum,
          };
        }

        const recommendation =
          modelAgent && !state.terminated
            ? act(modelAgent, state.obs) === 1
              ? "hit"
              : "stand"
            : null;

        const newGameState = {
          game_id: gameState.game_id,
          hand_state: { player_sum: playerSum, dealer_upcard: dealerUpcard, usable_ace: usableAce },
          model_recommendation: recommendation,
          is_terminal: state.terminated,
          outcome,
        };

        setGameState(newGameState);
        _updateStats(newGameState);
      } finally {
        setLoading(false);
      }
    },
    [gameState, engineState]
  );

  function _updateStats(state) {
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
  }

  const resetStats = useCallback(() => {
    setHumanStats({ ...INITIAL_STATS });
    setModelStats({ ...INITIAL_STATS });
  }, []);

  return { gameState, loading, newGame, doAction, humanStats, modelStats, resetStats };
}
