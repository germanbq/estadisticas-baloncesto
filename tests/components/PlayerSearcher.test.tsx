// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import PlayerSearcher from "@/src/components/players/PlayerSearcher";
import styles from "@/src/components/players/PlayerSearcher.module.css";

const navigation = vi.hoisted(() => ({
  router: { replace: vi.fn() },
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  usePathname: () => "/jugadores",
  useSearchParams: () => navigation.searchParams,
}));

const onSearchChange = vi.fn<(search: string) => void>();

function SearcherWithState({ initialSearch = "" }: { initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);

  return (
    <PlayerSearcher
      search={search}
      setSearch={(value) => {
        onSearchChange(value);
        setSearch(value);
      }}
    />
  );
}

function input() {
  return screen.getByRole("textbox");
}

function filter(label: string) {
  return screen.getByRole("button", { name: label});
}

function setQuery(query: string) {
  navigation.searchParams = new URLSearchParams(query);
}

function replacedUrl() {
  expect(navigation.router.replace).toHaveBeenCalledOnce();
  const [url, options] = navigation.router.replace.mock.calls[0];

  expect(options).toStrictEqual({ scroll: false });

  const parsed = new URL(url, "https://app.test");
  expect(parsed.pathname).toBe("/jugadores");
  return parsed;
}

beforeEach(() => {
  vi.resetAllMocks();
  setQuery("pos=ALL&conf=BOTH");
});

afterEach(cleanup);

describe("PlayerSearcher: texto de búsqueda", () => {
  test("muestra el texto recibido por la propiedad search", () => {
    render(<PlayerSearcher search="Nikola Jokic" setSearch={onSearchChange} />);

    expect(input()).toHaveValue("Nikola Jokic");
    expect(onSearchChange).not.toHaveBeenCalled();
  });

  test("comunica el nuevo texto al padre y lo muestra actualizado", () => {
    render(<SearcherWithState />);

    fireEvent.change(input(), { target: { value: "Jokic" } });

    expect(onSearchChange).toHaveBeenCalledExactlyOnceWith("Jokic");
    expect(input()).toHaveValue("Jokic");
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });

  test("borra el texto al pulsar Borrar búsqueda", () => {
    render(<SearcherWithState initialSearch="Jokic" />);

    fireEvent.click(screen.getByRole("button", { name: "Borrar búsqueda" }));

    expect(onSearchChange).toHaveBeenCalledExactlyOnceWith("");
    expect(input()).toHaveValue("");
  });

  test("actualiza el campo si el padre cambia la propiedad search", () => {
    const { rerender } = render(
      <PlayerSearcher search="Jokic" setSearch={onSearchChange} />,
    );

    rerender(<PlayerSearcher search="Doncic" setSearch={onSearchChange} />);

    expect(input()).toHaveValue("Doncic");
    expect(onSearchChange).not.toHaveBeenCalled();
  });
});

describe("PlayerSearcher: valores iniciales de los filtros", () => {
  test("usa todas las posiciones y ambas conferencias si no hay parámetros", () => {
    setQuery("");
    render(<SearcherWithState />);

    const url = replacedUrl();

    expect(url.searchParams.get("pos")).toBe("ALL");
    expect(url.searchParams.get("conf")).toBe("BOTH");
    
    expect(filter("TODAS")).toHaveClass(styles.active);
    expect(filter("AMBAS")).toHaveClass(styles.active);
  });

  test.each([
    { query: "conf=East", expectedPos: "ALL", expectedConf: "East" },
    { query: "pos=C", expectedPos: "C", expectedConf: "BOTH" },
  ])(
    "completa el parámetro que falta en $query",
    ({ query, expectedPos, expectedConf }) => {
      setQuery(query);
      render(<SearcherWithState />);

      const url = replacedUrl();

      expect(url.searchParams.get("pos")).toBe(expectedPos);
      expect(url.searchParams.get("conf")).toBe(expectedConf);
    },
  );

  test("recupera los filtros de la URL sin volver a escribirla", () => {
    setQuery("pos=PF&conf=West");
    render(<SearcherWithState />);

    expect(filter("ALA-PÍVOT")).toHaveClass(styles.active);
    expect(filter("OESTE")).toHaveClass(styles.active);
    expect(filter("TODAS")).not.toHaveClass(styles.active);
    expect(filter("AMBAS")).not.toHaveClass(styles.active);
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });
});

describe("PlayerSearcher: filtros de posición", () => {
  test.each([
    { label: "TODAS", value: "ALL", initial: "PG" },
    { label: "BASE", value: "PG", initial: "ALL" },
    { label: "ESCOLTA", value: "SG", initial: "PG" },
    { label: "ALERO", value: "SF", initial: "PG" },
    { label: "ALA-PÍVOT", value: "PF", initial: "PG" },
    { label: "PÍVOT", value: "C", initial: "PG" },
  ])(
    "selecciona $label y escribe pos=$value",
    ({ label, value, initial }) => {
      setQuery("pos=" + initial + "&conf=West");
      render(<SearcherWithState />);

      fireEvent.click(filter(label));

      const url = replacedUrl();

      expect(url.searchParams.get("pos")).toBe(value);
      expect(url.searchParams.get("conf")).toBe("West");
      expect(filter(label)).toHaveClass(styles.active);
      expect(filter("OESTE")).toHaveClass(styles.active);
      expect(onSearchChange).not.toHaveBeenCalled();
    },
  );
});

describe("PlayerSearcher: filtros de conferencia", () => {
  test.each([
    { label: "AMBAS", value: "BOTH", initial: "West" },
    { label: "ESTE", value: "East", initial: "West" },
    { label: "OESTE", value: "West", initial: "East" },
  ])(
    "selecciona $label y escribe conf=$value",
    ({ label, value, initial }) => {
      setQuery("pos=SG&conf=" + initial);
      render(<SearcherWithState />);

      fireEvent.click(filter(label));

      const url = replacedUrl();

      expect(url.searchParams.get("conf")).toBe(value);
      expect(url.searchParams.get("pos")).toBe("SG");
      expect(filter(label)).toHaveClass(styles.active);
      expect(filter("ESCOLTA")).toHaveClass(styles.active);
      expect(onSearchChange).not.toHaveBeenCalled();
    },
  );
});

describe("PlayerSearcher: combinación de búsqueda y filtros", () => {
  test("conserva otros parámetros de la URL al cambiar un filtro", () => {
    setQuery("pos=ALL&conf=BOTH&page=3&search=Jamal%20Murray");
    render(<SearcherWithState />);

    fireEvent.click(filter("PÍVOT"));

    const url = replacedUrl();

    expect(url.searchParams.get("pos")).toBe("C");
    expect(url.searchParams.get("conf")).toBe("BOTH");
    expect(url.searchParams.get("page")).toBe("3");
    expect(url.searchParams.get("search")).toBe("Jamal Murray");
  });

  test("combina los cambios de posición y conferencia", () => {
    render(<SearcherWithState />);

    fireEvent.click(filter("BASE"));
    fireEvent.click(filter("ESTE"));

    expect(navigation.router.replace).toHaveBeenCalledTimes(2);
    const [lastUrl, options] = navigation.router.replace.mock.calls[1];
    const url = new URL(lastUrl, "https://app.test");

    expect(url.pathname).toBe("/jugadores");
    expect(url.searchParams.get("pos")).toBe("PG");
    expect(url.searchParams.get("conf")).toBe("East");
    expect(options).toStrictEqual({ scroll: false });
    expect(filter("BASE")).toHaveClass(styles.active);
    expect(filter("ESTE")).toHaveClass(styles.active);
  });

  test("no vuelve a navegar al pulsar un filtro que ya está seleccionado", () => {
    setQuery("pos=PG&conf=East");
    render(<SearcherWithState />);

    fireEvent.click(filter("BASE"));
    fireEvent.click(filter("ESTE"));

    expect(navigation.router.replace).not.toHaveBeenCalled();
  });

  test("mantiene los filtros al escribir y borrar el nombre", () => {
    setQuery("pos=C&conf=West");
    render(<SearcherWithState />);

    fireEvent.change(input(), { target: { value: "Jokic" } });
    fireEvent.click(screen.getByRole("button", { name: "Borrar búsqueda" }));

    expect(input()).toHaveValue("");
    expect(filter("PÍVOT")).toHaveClass(styles.active);
    expect(filter("OESTE")).toHaveClass(styles.active);
    expect(onSearchChange.mock.calls).toStrictEqual([["Jokic"], [""]]);
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });
});
