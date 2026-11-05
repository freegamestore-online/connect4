import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Game } from "../components/Game";
import { ROWS, COLS } from "../logic";

function cells(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[style*='aspect-ratio: 1']"));
}

const previewed = (container: HTMLElement) => cells(container).filter((el) => el.style.opacity === "0.7");

describe("Game hover preview", () => {
  it("previews only the landing cell of the hovered column", () => {
    const { container } = render(<Game onScore={() => {}} onGameOver={() => {}} />);
    const all = cells(container);
    expect(all).toHaveLength(ROWS * COLS);
    fireEvent.pointerEnter(all[3]!, { pointerType: "mouse" }); // top row, column 3
    const shown = previewed(container);
    expect(shown).toHaveLength(1);
    expect(all.indexOf(shown[0]!)).toBe((ROWS - 1) * COLS + 3);
  });

  it("ignores emulated hover from touch", () => {
    const { container } = render(<Game onScore={() => {}} onGameOver={() => {}} />);
    fireEvent.pointerEnter(cells(container)[3]!, { pointerType: "touch" });
    expect(previewed(container)).toHaveLength(0);
  });
});
