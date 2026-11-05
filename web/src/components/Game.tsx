import { useState, useCallback, useEffect, useRef } from "react";
import { useGameSounds } from "@freegamestore/games";
import type { Board, Cell, WinLine } from "../types";
import { ROWS, COLS, PLAYER, AI, EMPTY, createBoard, getLowestRow, dropPiece, checkWin, isBoardFull, getAIMove } from "../logic";

// --- Components ---

interface GameProps {
  onScore: (s: number) => void;
  onGameOver: () => void;
}

export function Game({ onScore, onGameOver }: GameProps) {
  const sounds = useGameSounds();
  const [board, setBoard] = useState<Board>(createBoard);
  const [winLine, setWinLine] = useState<WinLine | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const onScoreRef = useRef(onScore);
  const onGameOverRef = useRef(onGameOver);
  onScoreRef.current = onScore;
  onGameOverRef.current = onGameOver;

  const soundsRef = useRef(sounds);
  soundsRef.current = sounds;

  const finalizeDrop = useCallback(
    (newBoard: Board, player: Cell) => {
      setBoard(newBoard);

      const win = checkWin(newBoard, player);
      if (win) {
        setWinLine(win);
        setGameOver(true);
        if (player === PLAYER) {
          soundsRef.current.playScore();
          onScoreRef.current(1);
        } else {
          soundsRef.current.playError();
          onScoreRef.current(-1);
        }
        onGameOverRef.current();
        return true;
      }
      if (isBoardFull(newBoard)) {
        setGameOver(true);
        onScoreRef.current(0);
        onGameOverRef.current();
        return true;
      }
      return false;
    },
    [],
  );

  const handleColumnClick = useCallback(
    (col: number) => {
      if (gameOver || !playerTurn) return;

      const result = dropPiece(board, col, PLAYER);
      if (!result) return;

      sounds.playMove();
      // Update board immediately — piece appears instantly
      const over = finalizeDrop(result.newBoard, PLAYER);
      if (!over) {
        setPlayerTurn(false);
      }
    },
    [board, gameOver, playerTurn, finalizeDrop],
  );

  // AI turn
  useEffect(() => {
    if (playerTurn || gameOver) return;

    const timer = setTimeout(() => {
      const col = getAIMove(board);
      const result = dropPiece(board, col, AI);
      if (!result) return;

      const over = finalizeDrop(result.newBoard, AI);
      if (!over) {
        setPlayerTurn(true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [playerTurn, gameOver, board, finalizeDrop]);

  const isWinCell = (r: number, c: number): boolean => {
    if (!winLine) return false;
    return winLine.cells.some(([wr, wc]) => wr === r && wc === c);
  };

  const gap = 4;
  const padding = 8;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
      <div className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
        {gameOver
          ? winLine
            ? winLine.cells[0] && board[winLine.cells[0][0]]![winLine.cells[0][1]] === PLAYER
              ? "You Win!"
              : "AI Wins!"
            : "Draw!"
          : playerTurn
            ? "Your turn"
            : "AI thinking..."}
      </div>

      <div
        style={{
          position: "relative",
          width: "min(90vw, 500px)",
          maxHeight: "70vh",
          aspectRatio: `${COLS}/${ROWS}`,
        }}
      >
        {/* Board */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            gap: `${gap}px`,
            background: "var(--accent)",
            borderRadius: "1.25rem",
            padding: `${padding}px`,
            position: "relative",
            zIndex: 10,
            maxWidth: "100%",
          }}
        >
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) => {
              const cell = board[r]![c]!;
              const isWin = isWinCell(r, c);
              const isHover = hoverCol === c && !gameOver && playerTurn && getLowestRow(board, c) !== -1;

              // Empty holes show the board through; hover previews a ghost of the player disc
              let bg = "transparent";
              if (cell === PLAYER) bg = "var(--ink)";
              else if (cell === AI) bg = "var(--paper)";
              else if (isHover) bg = "var(--ink)";

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleColumnClick(c)}
                  onMouseEnter={() => setHoverCol(c)}
                  onMouseLeave={() => setHoverCol(null)}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "50%",
                    background: bg,
                    cursor: !gameOver && playerTurn && getLowestRow(board, c) !== -1 ? "pointer" : "default",
                    boxShadow: isWin
                      ? "0 0 0 4px #fff, 0 0 16px rgba(255,255,255,0.6)"
                      : "inset 0 2px 4px rgba(0,0,0,0.2)",
                    transition: "box-shadow 0.2s, opacity 0.2s",
                    opacity: isHover && cell === EMPTY ? 0.7 : 1,
                  }}
                />
              );
            }),
          )}
        </div>
      </div>

      {/* Column tap targets for mobile */}
      <div className="md:hidden text-xs" style={{ color: "var(--muted)" }}>
        Tap a column to drop your piece
      </div>

    </div>
  );
}
