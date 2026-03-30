/**
 * Browser-side Blackjack engine replicating Gymnasium Blackjack-v1 (sab=True).
 *
 * Rules:
 * - Infinite deck (card drawn uniformly from 1-13, face cards = 10)
 * - Dealer hits until sum >= 17
 * - Natural (21 on first two cards) pays 1.5x if sab=False; with sab=True wins 1
 * - Usable ace: ace counted as 11 without busting
 */

function drawCard(rng) {
  const card = Math.floor(rng() * 13) + 1; // 1–13
  return Math.min(card, 10); // face cards = 10
}

function handValue(cards) {
  let total = cards.reduce((s, c) => s + c, 0);
  const aces = cards.filter((c) => c === 1).length;
  let usableAce = false;
  for (let i = 0; i < aces; i++) {
    if (total + 10 <= 21) {
      total += 10;
      usableAce = true;
      break; // only one ace can be counted as 11
    }
  }
  return { total, usableAce };
}

function isBust(cards) {
  return handValue(cards).total > 21;
}

/** Seeded PRNG (mulberry32) for reproducible hands */
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a new Blackjack hand.
 * Returns the initial observation and internal state.
 */
export function newHand(seed) {
  const rng = makeRng(seed ?? Math.floor(Math.random() * 2 ** 31));

  const playerCards = [drawCard(rng), drawCard(rng)];
  const dealerCards = [drawCard(rng), drawCard(rng)];

  const { total: playerSum, usableAce } = handValue(playerCards);
  const dealerUpcard = dealerCards[0];

  return {
    rng,
    playerCards,
    dealerCards,
    obs: [playerSum, dealerUpcard, usableAce],
    terminated: false,
    reward: 0,
  };
}

/**
 * Apply a player action: 1 = hit, 0 = stand.
 * Mutates state in place, returns { obs, reward, terminated }.
 */
export function step(state, action) {
  if (state.terminated) throw new Error("Game already over");

  if (action === 1) {
    // Hit
    state.playerCards.push(drawCard(state.rng));
    const { total, usableAce } = handValue(state.playerCards);
    state.obs = [total, state.obs[1], usableAce];

    if (isBust(state.playerCards)) {
      state.terminated = true;
      state.reward = -1;
    }
  } else {
    // Stand — dealer plays
    while (handValue(state.dealerCards).total < 17) {
      state.dealerCards.push(drawCard(state.rng));
    }

    const playerTotal = handValue(state.playerCards).total;
    const dealerTotal = handValue(state.dealerCards).total;
    const dealerBust = dealerTotal > 21;

    let reward;
    if (dealerBust || playerTotal > dealerTotal) {
      reward = 1;
    } else if (playerTotal < dealerTotal) {
      reward = -1;
    } else {
      reward = 0;
    }

    state.terminated = true;
    state.reward = reward;
  }

  return {
    obs: state.obs,
    reward: state.reward,
    terminated: state.terminated,
  };
}

/** Get final dealer sum and bust status (call after stand) */
export function dealerInfo(state) {
  const { total } = handValue(state.dealerCards);
  return { dealerFinalSum: total, dealerBusted: total > 21 };
}

/** Get player final sum */
export function playerFinalSum(state) {
  return handValue(state.playerCards).total;
}
