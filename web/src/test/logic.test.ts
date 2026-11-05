import { describe, it, expect } from "vitest";
import { createBoard, dropPiece, checkWin, isBoardFull, getAIMove, getLowestRow, PLAYER, AI, ROWS, COLS } from "../logic";
import type { Board } from "../types";

function play(cols: number[], start: Board = createBoard()): Board {
  let b = start;
  cols.forEach((c, i) => {
    b = dropPiece(b, c, i % 2 === 0 ? PLAYER : AI)!.newBoard;
  });
  return b;
}

describe("connect four rules", () => {
  it("discs stack from the bottom", () => {
    const b = play([3, 3]);
    expect(b[ROWS - 1]![3]).toBe(PLAYER);
    expect(b[ROWS - 2]![3]).toBe(AI);
    expect(getLowestRow(b, 3)).toBe(ROWS - 3);
  });

  it("a full column rejects drops", () => {
    const b = play([0, 0, 0, 0, 0, 0]);
    expect(dropPiece(b, 0, PLAYER)).toBeNull();
  });

  it("detects horizontal, vertical and diagonal wins", () => {
    expect(checkWin(play([0, 0, 1, 1, 2, 2, 3]), PLAYER)?.cells).toHaveLength(4);
    expect(checkWin(play([0, 1, 0, 1, 0, 1, 0]), PLAYER)).not.toBeNull();
    // diagonal: P at (5,0),(4,1),(3,2),(2,3)
    expect(checkWin(play([0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]), PLAYER)).not.toBeNull();
    expect(checkWin(play([0, 1]), PLAYER)).toBeNull();
  });

  it("detects a full board", () => {
    let b = createBoard();
    expect(isBoardFull(b)).toBe(false);
    b = b.map((row) => row.map((_, c) => (c % 2 ? AI : PLAYER)));
    expect(isBoardFull(b)).toBe(true);
  });

  it("AI blocks an immediate threat", () => {
    // Player has three in the bottom row at cols 0-2; AI must take col 3.
    const b = play([0, 6, 1, 6, 2]);
    const col = getAIMove(b);
    expect(col).toBe(3);
    expect(col).toBeLessThan(COLS);
  });
});
