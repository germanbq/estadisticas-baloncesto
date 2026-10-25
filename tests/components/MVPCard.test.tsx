// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import MVPCard from "@/src/components/game/MVPCard";
import type { GameMVP } from "@/src/backend/entities/gamesEntities";

afterEach(cleanup);

const player: GameMVP = {
  teamId: 1,
  playerId: 15,
  playerName: "Nikola Jokic",
  teamShortName: "DEN",
  jerseyNumber: "15",
  position: "C",
  points: 30,
  rebounds: 15,
  assists: 8,
  steals: 3,
  blocks: 2,
  secondsPlayed: 2399,
  plusMinus: 12,
  fgMade: 8,
  fgAttempted: 15,
  threeMade: 3,
  threeAttempted: 8,
  ftMade: 6,
  ftAttempted: 7,
};

const shots = [
  {
    label: "Tiros de Campo",
    madeKey: "fgMade",
    attemptedKey: "fgAttempted",
    percentage: 53.333333,
    text: "Tiros de Campo (53.3%)",
    ratio: "8/15",
  },
  {
    label: "Triples",
    madeKey: "threeMade",
    attemptedKey: "threeAttempted",
    percentage: 37.5,
    text: "Triples (37.5%)",
    ratio: "3/8",
  },
  {
    label: "Tiros Libres",
    madeKey: "ftMade",
    attemptedKey: "ftAttempted",
    percentage: 85.714286,
    text: "Tiros Libres (85.7%)",
    ratio: "6/7",
  },
] as const;

describe("MVPCard", () => {
  test("muestra los datos del MVP y el enlace a su ficha", () => {
    render(<MVPCard player={player} home={false} />);

    expect(screen.getByText("MVP del partido")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nikola Jokic" }))
      .toHaveAttribute("href", "/jugadores/15");
    expect(screen.getByText("DEN", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("#15", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("C", { exact: true })).toBeInTheDocument();
  });

  test("muestra el valor correspondiente a cada estadística básica", () => {
    render(<MVPCard player={player} home />);

    const stats = [
      { label: "Puntos", value: "30" },
      { label: "Rebotes", value: "15" },
      { label: "Asistencias", value: "8" },
      { label: "Robos", value: "3" },
      { label: "Tapones", value: "2" },
    ];

    for (const { label, value } of stats) {

      const block = screen.getByText(label, { exact: true }).parentElement;
      expect(block).toHaveTextContent(new RegExp(value + "$"));
    }
  });

  test.each(shots)("calcula y presenta el porcentaje de $label", ({ label, percentage, text, ratio }) => {
    render(<MVPCard player={player} home />);

    expect(screen.getByText(text, { exact: true })).toBeInTheDocument();
    expect(screen.getByText(ratio, { exact: true })).toBeInTheDocument();

    const bar = screen.getByRole("progressbar", { name: label });

    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(Number(bar.getAttribute("aria-valuenow"))).toBeCloseTo(percentage, 5);

    const fill = bar.firstElementChild as HTMLElement;
    expect(Number.parseFloat(fill.style.width)).toBeCloseTo(percentage, 5);
  });

  test.each(shots)("muestra 0% en $label cuando no hay intentos", ({ label, madeKey, attemptedKey }) => {
    const playerWithoutAttempts = {
      ...player,
      [madeKey]: 0,
      [attemptedKey]: 0,
    };

    render(<MVPCard player={playerWithoutAttempts} home />);

    expect(screen.getByText(label + " (0.0%)", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("0/0", { exact: true })).toBeInTheDocument();

    const bar = screen.getByRole("progressbar", { name: label });

    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar.firstElementChild).toHaveStyle({ width: "0%" });
  });

  test.each([
    { made: 11, attempted: 10, expected: 100 },
    { made: -1, attempted: 10, expected: 0 },
  ])("limita la barra a $expected% con $made/$attempted tiros", ({ made, attempted, expected }) => {
    render(
      <MVPCard
        player={{ ...player, fgMade: made, fgAttempted: attempted }}
        home
      />,
    );

    const bar = screen.getByRole("progressbar", { name: "Tiros de Campo" });

    expect(bar).toHaveAttribute("aria-valuenow", String(expected));
    expect(bar.firstElementChild).toHaveStyle({ width: expected + "%" });
  });

  test.each([
    { seconds: 59, text: "0 MIN" },
    { seconds: 60, text: "1 MIN" },
    { seconds: 2399, text: "39 MIN" },
  ])("muestra $text para $seconds segundos jugados", ({ seconds, text }) => {
    render(<MVPCard player={{ ...player, secondsPlayed: seconds }} home />);

    expect(screen.getByText(text, { exact: true })).toBeInTheDocument();
  });

  test.each([
    { plusMinus: 12, text: "+12 +/-" },
    { plusMinus: -7, text: "-7 +/-" },
    { plusMinus: 0, text: "0 +/-" },
  ])("presenta el impacto neto como $text", ({ plusMinus, text }) => {
    render(<MVPCard player={{ ...player, plusMinus }} home />);

    expect(screen.getByText(text, { exact: true })).toBeInTheDocument();
  });
});
