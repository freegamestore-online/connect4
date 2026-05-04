import { useState, useCallback, useEffect } from "react";
import { Shell } from "./components/Shell";
import { Game } from "./components/Game";
import { Leaderboard } from "./components/Leaderboard";
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
  const { topScores, recentScores, submitScore, loading } = useLeaderboard("connect4");

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
    <Shell
      sidebar={
        <nav className="flex-1 px-4 flex flex-col gap-3 py-4">
          <div className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
            Wins
          </div>
          <div
            className="text-3xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {wins}
          </div>
          {phase !== "playing" && (
            <button
              onClick={start}
              className="mt-4 px-4 py-2 rounded-xl font-semibold text-sm"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {phase === "menu" ? "Start" : "Play Again"}
            </button>
          )}
          <div
            className="mt-2 border-t"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="text-xs font-semibold px-4 pt-3" style={{ color: "var(--muted)" }}>
              Leaderboard
            </div>
            <Leaderboard topScores={topScores} recentScores={recentScores} loading={loading} />
          </div>
        </nav>
      }
      dock={
        <>
          <div className="text-sm font-semibold">
            Wins: {wins}
          </div>
        </>
      }
    >
      <div className="relative w-full h-full min-h-[400px]">
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
              className="px-6 py-3 rounded-xl font-semibold"
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
    </Shell>
  );
}
