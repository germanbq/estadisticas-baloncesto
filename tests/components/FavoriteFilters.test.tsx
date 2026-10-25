// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import FavoritesFilters from "@/src/components/favorites/FavoritesFilters";
import styles from "@/src/components/favorites/FavoritesFilters.module.css";
import type { FavCounts } from "@/src/backend/entities/favoritesEntities";

const counts: FavCounts = {
  numberPlayers: 4,
  numberTeams: 2,
  numberGames: 7,
};
const setSelected = vi.fn<(selected: string) => void>();

const options = [
  { name: "Jugadores (4)", value: "Players", initial: "Teams" },
  { name: "Equipos (2)", value: "Teams", initial: "Players" },
  { name: "Partidos (7)", value: "Games", initial: "Players" },
] as const;

function FiltersWithState({ initialSelected }: { initialSelected: string }) {
  const [selected, updateSelected] = useState(initialSelected);

  return (
    <FavoritesFilters
      selected={selected}
      counts={counts}
      setSelected={(value) => {
        setSelected(value);
        updateSelected(value);
      }}
    />
  );
}

function expectActiveOption(selected: string) {
  for (const option of options) {
    const button = screen.getByRole("button", { name: option.name});
    if (option.value === selected) {
      expect(button).toHaveClass(styles.active);
    } else {
      expect(button).not.toHaveClass(styles.active);
    }
  }
}

beforeEach(() => {
  setSelected.mockReset();
});

afterEach(cleanup);

describe("FavoritesFilters: contadores", () => {
  test("muestra los tres filtros con el contador correspondiente", () => {
    render(
      <FavoritesFilters selected="Players" setSelected={setSelected} counts={counts} />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(3);
    for (const option of options) {
      expect(screen.getByRole("button", { name: option.name}))
        .toBeInTheDocument();
    }
    expect(setSelected).not.toHaveBeenCalled();
  });

  test("mantiene los tres filtros visibles cuando todos los contadores son cero", () => {
    render(
      <FavoritesFilters
        selected="Players"
        setSelected={setSelected}
        counts={{ numberPlayers: 0, numberTeams: 0, numberGames: 0 }}
      />,
    );

    for (const name of ["Jugadores (0)", "Equipos (0)", "Partidos (0)"]) {
      expect(screen.getByRole("button", { name})).toBeEnabled();
    }
  });

  test("actualiza los contadores cuando cambian las props y conserva la selección", () => {
    const { rerender } = render(
      <FavoritesFilters selected="Teams" setSelected={setSelected} counts={counts} />,
    );

    rerender(
      <FavoritesFilters
        selected="Teams"
        setSelected={setSelected}
        counts={{ numberPlayers: 5, numberTeams: 1, numberGames: 8 }}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Jugadores (5)"}))
      .not.toHaveClass(styles.active);
    expect(screen.getByRole("button", { name: "Equipos (1)"}))
      .toHaveClass(styles.active);
    expect(screen.getByRole("button", { name: "Partidos (8)"}))
      .not.toHaveClass(styles.active);
    expect(setSelected).not.toHaveBeenCalled();
  });
});

describe("FavoritesFilters: selección", () => {
  test.each(options)(
    "marca únicamente $name cuando selected es $value",
    ({ value }) => {
      render(
        <FavoritesFilters selected={value} setSelected={setSelected} counts={counts} />,
      );

      expectActiveOption(value);
      expect(setSelected).not.toHaveBeenCalled();
    },
  );

  test.each(options)(
    "al pulsar $name comunica $value al padre y actualiza el filtro activo",
    ({ name, value, initial }) => {
      render(<FiltersWithState initialSelected={initial} />);
      expectActiveOption(initial);

      fireEvent.click(screen.getByRole("button", { name}));

      expect(setSelected).toHaveBeenCalledExactlyOnceWith(value);
      expectActiveOption(value);
 
      for (const option of options) {
        expect(screen.getByRole("button", { name: option.name}))
          .toBeInTheDocument();
      }
    },
  );

  test("actualiza el filtro activo si el padre cambia selected", () => {
    const { rerender } = render(
      <FavoritesFilters selected="Players" setSelected={setSelected} counts={counts} />,
    );
    expectActiveOption("Players");

    rerender(
      <FavoritesFilters selected="Games" setSelected={setSelected} counts={counts} />,
    );

    expectActiveOption("Games");
    expect(setSelected).not.toHaveBeenCalled();
  });
});
