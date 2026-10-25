// @vitest-environment jsdom

import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import PlayersStats from "../../src/components/game/PlayersStats";
import type { PlayerStats } from "../../src/backend/entities/gamesEntities";

afterEach(() => {
  cleanup();
});

const homePlayer: PlayerStats = {
  name: "Jayson Tatum",
  playerId: 1,
  secondsPlayed: 65,
  points: 30,
  rebounds: 8,
  ofeRebounds: 2,
  defRebounds: 6,
  assists: 5,
  steals: 3,
  blocks: 1,
  turnovers: 4,
  plusMinus: 7,
  fgPercentage: 53.456,
  threePercentage: 44.444,
};

const awayPlayer: PlayerStats = {
  ...homePlayer,
  name: "Nikola Jokic",
  playerId: 2,
  secondsPlayed: 2280,
  points: 28,
  rebounds: 12,
  ofeRebounds: 3,
  defRebounds: 9,
  assists: 10,
  plusMinus: -7,
  fgPercentage: 60,
  threePercentage: 50,
};

const props = {
  homeName: "Boston Celtics",
  awayName: "Denver Nuggets",
  homePlayers: [homePlayer],
  awayPlayers: [awayPlayer],
};

describe("PlayersStats", () => {
  test("muestra los nombres de ambos equipos y sus etiquetas", () => {
    render(<PlayersStats {...props} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Boston Celtics",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Denver Nuggets",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Local")).toBeInTheDocument();
    expect(screen.getByText("Visitante")).toBeInTheDocument();
  });

  test("muestra a cada jugador únicamente en la tabla de su equipo", () => {
    render(<PlayersStats {...props} />);

    const homeRegion = screen.getByRole("region", {
      name: "Estadísticas de jugadores de Boston Celtics",
    });

    const awayRegion = screen.getByRole("region", {
      name: "Estadísticas de jugadores de Denver Nuggets",
    });

    expect(
      within(homeRegion).getByRole("link", { name: "Jayson Tatum" }),
    ).toBeInTheDocument();

    expect(
      within(homeRegion).queryByRole("link", { name: "Nikola Jokic" }),
    ).not.toBeInTheDocument();

    expect(
      within(awayRegion).getByRole("link", { name: "Nikola Jokic" }),
    ).toBeInTheDocument();

    expect(
      within(awayRegion).queryByRole("link", { name: "Jayson Tatum" }),
    ).not.toBeInTheDocument();
  });

  test("muestra las estadísticas bajo las columnas correspondientes", () => {
    render(<PlayersStats {...props} />);

    const homeRegion = screen.getByRole("region", {
      name: "Estadísticas de jugadores de Boston Celtics",
    });

    const headers = within(homeRegion)
      .getAllByRole("columnheader")
      .map((header) => header.textContent);

    expect(headers).toStrictEqual([
      "Jugador",
      "Minutos",
      "Puntos",
      "Rebotes",
      "Rebotes Ofe",
      "Rebotes Def",
      "Asistencias",
      "Robos",
      "Tapones",
      "Pérdidas",
      "FG%",
      "3P%",
      "+/-",
    ]);

    const playerRow = within(homeRegion).getByRole("row", {
      name: /Jayson Tatum/,
    });

    const values = within(playerRow)
      .getAllByRole("cell")
      .map((cell) => cell.textContent);

    expect(values).toStrictEqual([
      "1:05",
      "30",
      "8",
      "2",
      "6",
      "5",
      "3",
      "1",
      "4",
      "53.5%",
      "44.4%",
      "+7",
    ]);
  });

  test.each([
    { secondsPlayed: 0, expected: "0:00" },
    { secondsPlayed: 5, expected: "0:05" },
    { secondsPlayed: 65, expected: "1:05" },
    { secondsPlayed: 2280, expected: "38:00" },
  ])(
    "muestra $secondsPlayed segundos como $expected",
    ({ secondsPlayed, expected }) => {
      render(
        <PlayersStats
          {...props}
          homePlayers={[{ ...homePlayer, secondsPlayed }]}
        />,
      );

      const playerRow = screen.getByRole("row", {
        name: /Jayson Tatum/,
      });

      expect(
        within(playerRow).getByRole("cell", {
          name: expected,
        }),
      ).toBeInTheDocument();
    },
  );

  test.each([
    { plusMinus: 7, expected: "+7" },
    { plusMinus: -7, expected: "-7" },
    { plusMinus: 0, expected: "0" },
  ])(
    "muestra un impacto de $plusMinus como $expected",
    ({ plusMinus, expected }) => {
      render(
        <PlayersStats
          {...props}
          homePlayers={[{ ...homePlayer, plusMinus }]}
        />,
      );

      const playerRow = screen.getByRole("row", {
        name: /Jayson Tatum/,
      });

      expect(
        within(playerRow).getByRole("cell", {
          name: expected,
        }),
      ).toBeInTheDocument();
    },
  );

  test("muestra los porcentajes a cero con un decimal", () => {
    render(
      <PlayersStats
        {...props}
        homePlayers={[
          {
            ...homePlayer,
            fgPercentage: 0,
            threePercentage: 0,
          },
        ]}
      />,
    );

    const playerRow = screen.getByRole("row", {
      name: /Jayson Tatum/,
    });

    expect(
      within(playerRow).getAllByRole("cell", {
        name: "0.0%",
      }),
    ).toHaveLength(2);
  });

  test("los nombres enlazan al perfil del jugador correspondiente", () => {
    render(<PlayersStats {...props} />);

    expect(
      screen.getByRole("link", { name: "Jayson Tatum" }),
    ).toHaveAttribute("href", "/jugadores/1");

    expect(
      screen.getByRole("link", { name: "Nikola Jokic" }),
    ).toHaveAttribute("href", "/jugadores/2");
  });

  test("mantiene la tabla visitante cuando no hay jugadores locales", () => {
    render(
      <PlayersStats
        {...props}
        homePlayers={[]}
      />,
    );

    const homeRegion = screen.getByRole("region", {
      name: "Estadísticas de jugadores de Boston Celtics",
    });

    const awayRegion = screen.getByRole("region", {
      name: "Estadísticas de jugadores de Denver Nuggets",
    });

    // La tabla local conserva únicamente la fila de cabeceras.
    expect(within(homeRegion).getAllByRole("row")).toHaveLength(1);

    expect(
      within(awayRegion).getByRole("link", {
        name: "Nikola Jokic",
      }),
    ).toBeInTheDocument();
  });
});