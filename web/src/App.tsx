import { useState, useCallback, useEffect } from "react";
import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { Game } from "./components/Game";
import { useLeaderboard } from "./hooks/useLeaderboard";
import type { GamePhase } from "./types";

const BEST_SCORE_KEY = "freeconnect4-best";

function getBestScore(): number {
  const v = localStorage.getItem(BEST_SCORE_KEY);
  return v ? parseInt(v, 10) : 0;
}

export default function App() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [wins, setWins] = useState(getBestScore);
  const [lastResult, setLastResult] = useState<"win" | "loss" | "draw" | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const { submitScore } = useLeaderboard("connect4");

  const handleScore = useCallback(
    (s: number) => {
      if (s > 0) {
        const newWins = wins + 1;
        setWins(newWins);
        localStorage.setItem(BEST_SCORE_KEY, String(newWins));
        submitScore(newWins);
        setLastResult("win");
      } else if (s < 0) {
        setLastResult("loss");
      } else {
        setLastResult("draw");
      }
    },
    [wins, submitScore],
  );

  const handleGameOver = useCallback(() => {
    setPhase("over");
  }, []);

  const start = useCallback(() => {
    setLastResult(null);
    setGameKey((k) => k + 1);
    setPhase("playing");
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase !== "playing" && (e.key === " " || e.key === "Enter")) {
        start();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, start]);

  return (
    <GameShell
      topbar={
        <GameTopbar
          title="Connect 4"
          stats={[{ label: "Wins", value: wins }]}
          actions={
            <>
              {phase !== "playing" && (
                <button className="min-h-[2.75rem] min-w-[2.75rem]" onClick={start}>{phase === "menu" ? "Start" : "Play Again"}</button>
              )}
              <GameAuth />
            </>
          }
          rules={
            <div>
              <h3 style={{ fontWeight: 700 }}>Connect 4</h3>
              <h4 style={{ fontWeight: 600 }}>Rules</h4>
              <ul><li>Drop discs to connect 4 in a row — horizontal, vertical, or diagonal</li><li>Play against the AI</li></ul>
              <h4 style={{ fontWeight: 600 }}>Controls</h4>
              <ul><li>Tap a column to drop your disc</li></ul>
            </div>
          }
        />
      }
    >
      <div className="relative w-full h-full">
        {phase === "playing" ? (
          <Game key={gameKey} onScore={handleScore} onGameOver={handleGameOver} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <h1
              className="text-4xl font-bold"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Connect 4
            </h1>
            {phase === "over" && lastResult && (
              <p
                className="text-xl font-bold"
                style={{
                  color: lastResult === "win" ? "var(--success)" : lastResult === "loss" ? "var(--error)" : "var(--warning)",
                  fontFamily: "Fraunces, serif",
                }}
              >
                {lastResult === "win" ? "You Win!" : lastResult === "loss" ? "You Lose!" : "It's a Draw!"}
              </p>
            )}
            <p style={{ color: "var(--muted)" }}>
              Drop pieces to connect four in a row. You are Red.
            </p>
            <button
              onClick={start}
              className="px-6 py-3 rounded-xl font-semibold min-h-[2.75rem]"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {phase === "menu" ? "Start Game" : "Play Again"}
            </button>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Press Space or Enter to start
            </p>
          </div>
        )}
      </div>
    </GameShell>
  );
}
