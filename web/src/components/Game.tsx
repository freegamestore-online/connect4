import { useState, useCallback, useEffect, useRef } from "react";
import { useGameSounds } from "@freegamestore/games";
import type { Cell, Board, WinLine } from "../types";

const ROWS = 6;
const COLS = 7;
const PLAYER: Cell = 1;
const AI: Cell = 2;
const EMPTY: Cell = 0;
const AI_DEPTH = 5;

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => EMPTY as Cell));
}

function cloneBoard(b: Board): Board {
  return b.map((row) => [...row]);
}

function getLowestRow(board: Board, col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r]![col] === EMPTY) return r;
  }
  return -1;
}

function isBoardFull(board: Board): boolean {
  for (let c = 0; c < COLS; c++) {
    if (board[0]![c] === EMPTY) return false;
  }
  return true;
}

function checkWin(board: Board, player: Cell): WinLine | null {
  const dirs: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r]![c] !== player) continue;
      for (const [dr, dc] of dirs) {
        const cells: [number, number][] = [[r, c]];
        let ok = true;
        for (let i = 1; i < 4; i++) {
          const nr = r + dr! * i;
          const nc = c + dc! * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr]![nc] !== player) {
            ok = false;
            break;
          }
          cells.push([nr, nc]);
        }
        if (ok) return { cells };
      }
    }
  }
  return null;
}

// --- Minimax AI ---

function getValidCols(board: Board): number[] {
  const cols: number[] = [];
  // Check center first for better move ordering
  const order = [3, 2, 4, 1, 5, 0, 6];
  for (const c of order) {
    if (board[0]![c] === EMPTY) cols.push(c);
  }
  return cols;
}

function scoreWindow(window: Cell[], player: Cell): number {
  const opp: Cell = player === PLAYER ? AI : PLAYER;
  const pCount = window.filter((c) => c === player).length;
  const oCount = window.filter((c) => c === opp).length;
  const eCount = window.filter((c) => c === EMPTY).length;

  if (pCount === 4) return 100000;
  if (oCount === 4) return -100000;
  if (pCount === 3 && eCount === 1) return 50;
  if (oCount === 3 && eCount === 1) return -50;
  if (pCount === 2 && eCount === 2) return 5;
  return 0;
}

function evaluateBoard(board: Board, player: Cell): number {
  let score = 0;

  // Center column preference
  for (let r = 0; r < ROWS; r++) {
    if (board[r]![3] === player) score += 3;
  }

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const w = [board[r]![c]!, board[r]![c + 1]!, board[r]![c + 2]!, board[r]![c + 3]!];
      score += scoreWindow(w, player);
    }
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const w = [board[r]![c]!, board[r + 1]![c]!, board[r + 2]![c]!, board[r + 3]![c]!];
      score += scoreWindow(w, player);
    }
  }
  // Diagonal down-right
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const w = [board[r]![c]!, board[r + 1]![c + 1]!, board[r + 2]![c + 2]!, board[r + 3]![c + 3]!];
      score += scoreWindow(w, player);
    }
  }
  // Diagonal down-left
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      const w = [board[r]![c]!, board[r + 1]![c - 1]!, board[r + 2]![c - 2]!, board[r + 3]![c - 3]!];
      score += scoreWindow(w, player);
    }
  }

  return score;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): [number, number] {
  const playerWin = checkWin(board, PLAYER);
  const aiWin = checkWin(board, AI);
  const full = isBoardFull(board);

  if (aiWin) return [100000 + depth, -1];
  if (playerWin) return [-100000 - depth, -1];
  if (full) return [0, -1];
  if (depth === 0) return [evaluateBoard(board, AI), -1];

  const validCols = getValidCols(board);

  if (maximizing) {
    let best = -Infinity;
    let bestCol = validCols[0]!;
    for (const col of validCols) {
      const row = getLowestRow(board, col);
      if (row === -1) continue;
      const next = cloneBoard(board);
      next[row]![col] = AI;
      const [score] = minimax(next, depth - 1, alpha, beta, false);
      if (score > best) {
        best = score;
        bestCol = col;
      }
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return [best, bestCol];
  } else {
    let best = Infinity;
    let bestCol = validCols[0]!;
    for (const col of validCols) {
      const row = getLowestRow(board, col);
      if (row === -1) continue;
      const next = cloneBoard(board);
      next[row]![col] = PLAYER;
      const [score] = minimax(next, depth - 1, alpha, beta, true);
      if (score < best) {
        best = score;
        bestCol = col;
      }
      beta = Math.min(beta, best);
      if (alpha >= beta) break;
    }
    return [best, bestCol];
  }
}

function getAIMove(board: Board): number {
  const [, col] = minimax(board, AI_DEPTH, -Infinity, Infinity, true);
  return col;
}

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

  const dropPiece = useCallback(
    (b: Board, col: number, player: Cell): { newBoard: Board; row: number } | null => {
      const row = getLowestRow(b, col);
      if (row === -1) return null;
      const newBoard = cloneBoard(b);
      newBoard[row]![col] = player;
      return { newBoard, row };
    },
    [],
  );

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
    [board, gameOver, playerTurn, dropPiece, finalizeDrop],
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
  }, [playerTurn, gameOver, board, dropPiece, finalizeDrop]);

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
            ? "Your turn (Red)"
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
            background: "#2563eb",
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

              let bg = "var(--paper)";
              if (cell === PLAYER) bg = "#ef4444";
              else if (cell === AI) bg = "#eab308";

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

      <style>{`
        @keyframes drop {
          from {
            transform: translateY(-100%);
            opacity: 0.8;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
