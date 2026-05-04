export type GamePhase = "menu" | "playing" | "over";

export type Cell = 0 | 1 | 2; // 0 = empty, 1 = player (red), 2 = AI (yellow)

export type Board = Cell[][];

export interface WinLine {
  cells: [number, number][];
}
