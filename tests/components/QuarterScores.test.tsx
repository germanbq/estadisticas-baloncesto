// @vitest-environment jsdom

import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import QuarterScores from "../../src/components/game/QuarterScores";

afterEach(() => {
  cleanup();
});

const props = {
  homeName: "Boston Celtics",
  awayName: "Denver Nuggets",
  homeScores: [22, 25, 27, 30],
  awayScores: [20, 24, 26, 31],
  homeTotal: 104,
  awayTotal: 101,
};

describe("QuarterScores", () => {
  test("muestra los cuatro cuartos y el total sin prórrogas", () => {
    render(<QuarterScores {...props} />);

    const headers = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent);

    expect(headers).toStrictEqual([
      "Equipo",
      "Q1",
      "Q2",
      "Q3",
      "Q4",
      "Total",
    ]);
  });

  test("añade las columnas correspondientes a dos prórrogas", () => {
    render(
      <QuarterScores
        {...props}
        homeScores={[22, 25, 27, 30, 11, 8]}
        awayScores={[20, 24, 26, 31, 13, 5]}
        homeTotal={123}
        awayTotal={119}
      />,
    );

    expect(
      screen.getByRole("columnheader", { name: "P1" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "P2" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("columnheader", { name: "P3" }),
    ).not.toBeInTheDocument();
  });

  test("muestra los marcadores en la fila de su equipo", () => {
    render(<QuarterScores {...props} />);

    const homeRow = screen.getByRole("row", {
      name: /Boston Celtics/,
    });

    const awayRow = screen.getByRole("row", {
      name: /Denver Nuggets/,
    });

    expect(within(homeRow).getByText("22")).toBeInTheDocument();
    expect(within(homeRow).getByText("104")).toBeInTheDocument();

    expect(within(awayRow).getByText("20")).toBeInTheDocument();
    expect(within(awayRow).getByText("101")).toBeInTheDocument();
  });
});