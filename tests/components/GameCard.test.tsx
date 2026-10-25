// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import GameCard from "../../src/components/GameCard";

vi.mock("../../src/components/FavoriteButton", () => ({
  default: () => null,
}));

afterEach(() => {
  cleanup();
});

const props = {
  id: 15,
  isFavorite: false,
  finalizado: true,
  homeTeam: "Boston Celtics",
  awayTeam: "Denver Nuggets",
  homeScore: 104,
  awayScore: 107,
  homeRecord: "3-3",
  awayRecord: "4-2",
  homeLogo: "/logos/boston-celtics.webp",
  awayLogo: "/logos/denver-nuggets.webp",
  place: "TD Garden",

  date: new Date("2026-10-18T22:30:00.000Z"),
};

describe("GameCard", () => {
  test("muestra los equipos, sus balances y el estadio", () => {
    render(<GameCard {...props} />);

    expect(screen.getByText("Boston Celtics")).toBeInTheDocument();
    expect(screen.getByText("Denver Nuggets")).toBeInTheDocument();

    expect(screen.getByText("(3-3)")).toBeInTheDocument();
    expect(screen.getByText("(4-2)")).toBeInTheDocument();

    expect(screen.getByText("TD Garden")).toBeInTheDocument();
  });

  test("muestra el estado y los marcadores de un partido finalizado", () => {
    render(<GameCard {...props} />);

    expect(screen.getByText("Finalizado")).toBeInTheDocument();
    expect(screen.getByText("FINAL")).toBeInTheDocument();

    expect(screen.getByText("104")).toBeInTheDocument();
    expect(screen.getByText("107")).toBeInTheDocument();

    expect(screen.queryByText("00:30")).not.toBeInTheDocument();
  });

  test("muestra la fecha y hora de Madrid cuando está pendiente", () => {
    render(
      <GameCard
        {...props}
        finalizado={false}
        homeScore={null}
        awayScore={null}
      />,
    );

    expect(screen.getByText("19/10/2026")).toBeInTheDocument();
    expect(screen.getByText("00:30")).toBeInTheDocument();

    expect(screen.queryByText("Finalizado")).not.toBeInTheDocument();
    expect(screen.queryByText("FINAL")).not.toBeInTheDocument();

    expect(screen.queryByText(/null|undefined/)).not.toBeInTheDocument();
  });

  test("muestra correctamente un marcador de cero", () => {
    render(
      <GameCard
        {...props}
        homeScore={0}
        awayScore={10}
      />,
    );

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  test("el enlace del partido apunta a su página", () => {
    render(
      <GameCard
        {...props}
        href="/partidos/15"
      />,
    );

    const link = screen.getByRole("link", {
      name: "Ver partido: Boston Celtics contra Denver Nuggets",
    });

    expect(link).toHaveAttribute("href", "/partidos/15");
  });

  test("no muestra un enlace de partido cuando no recibe href", () => {
    render(<GameCard {...props} />);

    expect(
      screen.queryByRole("link", {
        name: /Ver partido:/,
      }),
    ).not.toBeInTheDocument();
  });

  test("enlaza los nombres de los equipos cuando teamLinks está activo", () => {
    render(
      <GameCard
        {...props}
        teamLinks={true}
        homeId={1}
        awayId={2}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Boston Celtics" }),
    ).toHaveAttribute("href", "/equipos/1");

    expect(
      screen.getByRole("link", { name: "Denver Nuggets" }),
    ).toHaveAttribute("href", "/equipos/2");
  });

  test("muestra los nombres sin enlaces cuando teamLinks no está activo", () => {
    render(<GameCard {...props} />);

    expect(screen.getByText("Boston Celtics")).toBeInTheDocument();
    expect(screen.getByText("Denver Nuggets")).toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: "Boston Celtics" }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: "Denver Nuggets" }),
    ).not.toBeInTheDocument();
  });

  test("muestra el contenido adicional recibido mediante children", () => {
    render(
      <GameCard {...props}>
        <p>Información adicional del partido</p>
      </GameCard>,
    );

    expect(
      screen.getByText("Información adicional del partido"),
    ).toBeInTheDocument();
  });
});