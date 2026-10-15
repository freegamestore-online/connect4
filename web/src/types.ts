export type GamePhase = "menu" | "playing" | "over";

export type Cell = 0 | 1 | 2; // 0 = empty, 1 = player (ink), 2 = AI (paper)

export type Board = Cell[][];

export interface WinLine {
  cells: [number, number][];
}
