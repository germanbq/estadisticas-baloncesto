// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Games from "@/src/components/app/Games";
import type { Game } from "@/src/backend/entities/gamesEntities";

const navigation = vi.hoisted(() => ({
  router: { replace: vi.fn() },
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  usePathname: () => "/",
  useSearchParams: () => navigation.searchParams,
}));
vi.mock("@/src/components/FavoriteButton", () => ({ default: () => null }));

const DAY = "2026-10-18";
const NEXT_DAY = "2026-10-19";
const EMPTY = "No hay partidos programados para esta fecha.";
const ERROR = "No se pudieron cargar los partidos. Inténtalo de nuevo.";
const FIRST_LINK = "Ver partido: Boston Celtics contra Denver Nuggets";
const NEXT_LINK = "Ver partido: Los Angeles Lakers contra Chicago Bulls";

const firstGame: Game = {
  id: 15,
  homeTeamName: "Boston Celtics",
  homeTeamLogo: "/teams/boston.webp",
  homeTeamVictorys: 3,
  homeTeamLosses: 2,
  homeTeamScore: null,
  awayTeamName: "Denver Nuggets",
  awayTeamLogo: "/teams/denver.webp",
  awayTeamVictorys: 4,
  awayTeamLosses: 1,
  awayTeamScore: null,
  finished: false,
  stadium: "TD Garden",
  date: new Date("2026-10-18T20:00:00Z"),
  isFavorite: false,
};

const nextGame: Game = {
  ...firstGame,
  id: 16,
  homeTeamName: "Los Angeles Lakers",
  homeTeamLogo: "/teams/lakers.webp",
  awayTeamName: "Chicago Bulls",
  awayTeamLogo: "/teams/bulls.webp",
  stadium: "Crypto.com Arena",
  date: new Date("2026-10-19T20:00:00Z"),
};

const dateCounts = [
  { date: "2026-10-16", gamesNumber: 1 },
  { date: "2026-10-17", gamesNumber: 2 },
  { date: DAY, gamesNumber: 1 },
  { date: NEXT_DAY, gamesNumber: 1 },
  { date: "2026-10-20", gamesNumber: 0 },
];

const fetchMock = vi.fn<typeof fetch>();

function ok(data: unknown) {
  return Response.json({ data });
}

function failure() {
  return Response.json({ error: "Fallo simulado" }, { status: 500 });
}

function pendingResponse() {
  let resolve!: (response: Response) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Response>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

type GamesResponse = (date: string) => Response | Promise<Response>;

function abortableResponse(result: Response | Promise<Response>, signal?: AbortSignal | null) {
  return new Promise<Response>((resolve, reject) => {
    const abort = () => reject(signal?.reason ?? new DOMException("Petición cancelada", "AbortError"));
    if (signal?.aborted) {
      abort();
      return;
    }

    signal?.addEventListener("abort", abort, { once: true });
    Promise.resolve(result).then(
      (value) => {
        signal?.removeEventListener("abort", abort);
        resolve(value);
      },
      (error) => {
        signal?.removeEventListener("abort", abort);
        reject(error);
      },
    );
  });
}

function respondToGames(response: GamesResponse) {
  fetchMock.mockImplementation(async (input, options) => {
    const url = new URL(String(input), "https://app.test");

    if (url.pathname === "/api/partidos/numero") {
      return ok(dateCounts);
    }
    if (url.pathname === "/api/partidos/listado") {
      const date = url.searchParams.get("date");
      if (!date) throw new Error("Falta la fecha del listado");
      return abortableResponse(response(date), options?.signal);
    }

    throw new Error("Petición inesperada: " + url.pathname);
  });
}

function listCalls() {
  return fetchMock.mock.calls.filter(([input]) =>
    new URL(String(input), "https://app.test").pathname === "/api/partidos/listado",
  );
}

function requestedDates() {
  return listCalls().map(([input]) =>
    new URL(String(input), "https://app.test").searchParams.get("date"),
  );
}

function dateButton(day: number) {
  return screen.getByRole("button", {
    name: new RegExp("^Cambiar a fecha .*, " + day + "$"),
  });
}

async function waitForDates() {
  await screen.findByRole("region", { name: "Seleccionar fecha de los partidos" });
}

beforeEach(() => {
  vi.resetAllMocks();
  
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 18, 12, 0, 0));
  navigation.searchParams = new URLSearchParams(
    "date=" + DAY + "&reference=" + DAY + "&source=portfolio",
  );
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});

  respondToGames((date) =>
    ok(date === DAY ? [firstGame] : date === NEXT_DAY ? [nextGame] : []),
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Games: fecha inicial y tarjetas", () => {
  test("consulta la fecha de la URL y muestra su partido con el enlace correcto", async () => {
    render(<Games />);

    expect(await screen.findByRole("link", { name: FIRST_LINK }))
      .toHaveAttribute("href", "/partidos/15");
    expect(requestedDates()).toStrictEqual([DAY]);
    expect(navigation.router.replace).not.toHaveBeenCalled();
    expect(screen.queryByRole("status", { name: "Cargando partidos" }))
      .not.toBeInTheDocument();
  });

  test("usa hoy si la URL no incluye date y conserva los demás parámetros", async () => {
    navigation.searchParams = new URLSearchParams(
      "reference=" + DAY + "&source=portfolio",
    );
    render(<Games />);

    expect(await screen.findByRole("link", { name: FIRST_LINK })).toBeInTheDocument();
    expect(requestedDates()).toStrictEqual([DAY]);

    expect(navigation.router.replace).toHaveBeenCalledOnce();
    const [href, options] = navigation.router.replace.mock.calls[0];
    const url = new URL(href, "https://app.test");

    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("date")).toBe(DAY);
    expect(url.searchParams.get("reference")).toBe(DAY);
    expect(url.searchParams.get("source")).toBe("portfolio");
    expect(options).toStrictEqual({ scroll: false });
  });

  test.each(["2026-01-09", "2024-02-29"])(
    "consulta correctamente la fecha %s",
    async (date) => {
      navigation.searchParams = new URLSearchParams(
        "date=" + date + "&reference=" + DAY,
      );
      render(<Games />);

      expect(await screen.findByText(EMPTY)).toBeInTheDocument();
      expect(requestedDates()).toStrictEqual([date]);
    },
  );

  test("muestra una tarjeta por cada partido recibido", async () => {
    respondToGames(() => ok([firstGame, nextGame]));
    render(<Games />);

    expect(await screen.findByRole("link", { name: FIRST_LINK })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: NEXT_LINK }))
      .toHaveAttribute("href", "/partidos/16");
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });
});

describe("Games: carga, ausencia de datos y errores", () => {
  test("muestra la carga mientras espera y luego muestra el partido", async () => {
    const request = pendingResponse();
    respondToGames(() => request.promise);
    render(<Games />);

    expect(screen.getByRole("status", { name: "Cargando partidos" }))
      .toBeInTheDocument();
    expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();
    expect(screen.queryByText(ERROR)).not.toBeInTheDocument();

    await act(async () => {
      request.resolve(ok([firstGame]));
    });

    expect(screen.getByRole("link", { name: FIRST_LINK })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Cargando partidos" }))
      .not.toBeInTheDocument();
  });

  test("muestra el aviso de fecha sin partidos si recibe una lista vacía", async () => {
    respondToGames(() => ok([]));
    render(<Games />);

    expect(await screen.findByText(EMPTY)).toBeInTheDocument();
    expect(screen.queryByText(ERROR)).not.toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  test.each(["HTTP", "red"])("distingue un fallo de %s de una lista vacía", async (kind) => {
    respondToGames(() => {
      if (kind === "HTTP") return failure();
      return Promise.reject(new TypeError("Failed to fetch"));
    });
    render(<Games />);

    expect(await screen.findByText(ERROR)).toBeInTheDocument();
    expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(console.error).toHaveBeenCalledOnce();
  });
});

describe("Games: cambio de fecha con DateButtons real", () => {
  test("selecciona otro día, actualiza la URL y sustituye los partidos", async () => {
    render(<Games />);
    await screen.findByRole("link", { name: FIRST_LINK });
    await waitForDates();

    expect(dateButton(18)).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(dateButton(19));

    expect(await screen.findByRole("link", { name: NEXT_LINK })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: FIRST_LINK })).not.toBeInTheDocument();
    expect(dateButton(19)).toHaveAttribute("aria-pressed", "true");
    expect(dateButton(18)).toHaveAttribute("aria-pressed", "false");
    expect(requestedDates()).toStrictEqual([DAY, NEXT_DAY]);

    expect(navigation.router.replace).toHaveBeenCalledOnce();
    const [href, options] = navigation.router.replace.mock.calls[0];
    const url = new URL(href, "https://app.test");

    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("date")).toBe(NEXT_DAY);
    expect(url.searchParams.get("reference")).toBe(DAY);
    expect(url.searchParams.get("source")).toBe("portfolio");
    expect(options).toStrictEqual({ scroll: false });
  });

  test("oculta los partidos anteriores y vuelve a mostrar la carga mientras cambia de día", async () => {
    const request = pendingResponse();
    respondToGames((date) => date === DAY ? ok([firstGame]) : request.promise);
    render(<Games />);
    await screen.findByRole("link", { name: FIRST_LINK });
    await waitForDates();

    fireEvent.click(dateButton(19));

    expect(screen.getByRole("status", { name: "Cargando partidos" }))
      .toBeInTheDocument();
    expect(screen.queryByRole("link", { name: FIRST_LINK })).not.toBeInTheDocument();
    expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();

    await act(async () => {
      request.resolve(ok([nextGame]));
    });

    expect(screen.getByRole("link", { name: NEXT_LINK })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Cargando partidos" }))
      .not.toBeInTheDocument();
  });

  test.each([
    { initial: "lista vacía", message: EMPTY },
    { initial: "error", message: ERROR },
  ])("se recupera de $initial al elegir otro día", async ({ initial, message }) => {
    respondToGames((date) =>
      date === DAY
        ? initial === "error" ? failure() : ok([])
        : ok([nextGame]),
    );
    render(<Games />);
    await screen.findByText(message);
    await waitForDates();

    fireEvent.click(dateButton(19));

    expect(await screen.findByRole("link", { name: NEXT_LINK })).toBeInTheDocument();
    expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();
    expect(screen.queryByText(ERROR)).not.toBeInTheDocument();
  });
});

describe("Games: peticiones canceladas", () => {
  test.each(["resuelve", "rechaza"] as const)(
    "cancela el día anterior e ignora su petición si después se %s",
    async (outcome) => {
      const oldRequest = pendingResponse();
      respondToGames((date) =>
        date === DAY ? oldRequest.promise : ok([nextGame]),
      );
      render(<Games />);
      await waitForDates();

      const oldSignal = listCalls()[0][1]?.signal;
      expect(oldSignal?.aborted).toBe(false);

      fireEvent.click(dateButton(19));

      expect(oldSignal?.aborted).toBe(true);
      await screen.findByRole("link", { name: NEXT_LINK });

      
      await act(async () => {
        if (outcome === "resuelve") {
          oldRequest.resolve(ok([firstGame]));
        } else {
          oldRequest.reject(new TypeError("Fallo de la petición anterior"));
        }
      });

      expect(screen.getByRole("link", { name: NEXT_LINK })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: FIRST_LINK })).not.toBeInTheDocument();
      expect(screen.queryByText(ERROR)).not.toBeInTheDocument();
      expect(console.error).not.toHaveBeenCalled();
      expect(requestedDates()).toStrictEqual([DAY, NEXT_DAY]);
    },
  );

  test("cancela la petición al desmontarse e ignora una respuesta posterior", async () => {
    const request = pendingResponse();
    respondToGames(() => request.promise);
    const { unmount } = render(<Games />);
    await waitForDates();

    const signal = listCalls()[0][1]?.signal;
    expect(signal?.aborted).toBe(false);

    unmount();

    expect(signal?.aborted).toBe(true);

    await act(async () => {
      request.resolve(ok([firstGame]));
    });

    expect(screen.queryByRole("link", { name: FIRST_LINK })).not.toBeInTheDocument();
    expect(console.error).not.toHaveBeenCalled();
  });
});
