import { useState } from "react";
import Dashboard from "./components/Dashboard/Dashboard";
import PlayMode from "./components/Play/PlayMode";
import "./App.css";

function App() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="app">
      <header>
        <h1>Blackjack RL</h1>
        <nav>
          <button
            className={tab === "dashboard" ? "active" : ""}
            onClick={() => setTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={tab === "play" ? "active" : ""}
            onClick={() => setTab("play")}
          >
            Play
          </button>
        </nav>
      </header>
      <main>
        {tab === "dashboard" && <Dashboard />}
        {tab === "play" && <PlayMode />}
      </main>
    </div>
  );
}

export default App;
