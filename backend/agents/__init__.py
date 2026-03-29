from backend.agents.base_agent import BaseAgent
from backend.agents.double_qlearning_agent import DoubleQLearningAgent
from backend.agents.expected_sarsa_agent import ExpectedSarsaAgent
from backend.agents.monte_carlo_agent import MonteCarloAgent
from backend.agents.qlearning_agent import QLearningAgent
from backend.agents.sarsa_agent import SarsaAgent

AGENT_REGISTRY: dict[str, type[BaseAgent]] = {
    "qlearning": QLearningAgent,
    "monte_carlo": MonteCarloAgent,
    "sarsa": SarsaAgent,
    "expected_sarsa": ExpectedSarsaAgent,
    "double_qlearning": DoubleQLearningAgent,
}
