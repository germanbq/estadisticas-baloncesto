// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import DateButtons from "@/src/components/app/DateButtons";
import type { GamesNum } from "@/src/backend/entities/gamesEntities";

const navigation = vi.hoisted(() => ({
  router: { replace: vi.fn() },
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  usePathname: () => "/",
  useSearchParams: () => navigation.searchParams,
}));

const DAY = "2026-10-18";
const PREVIOUS = "Cambiar a fechas anteriores";
const NEXT = "Cambiar a fechas posteriores";
const fetchMock = vi.fn<typeof fetch>();
const onDateChange = vi.fn<(date: Date) => void>();

function localDate(value: string) {
  return new Date(value + "T00:00:00");
}

function getDateString(date: Date) {
  return date.getFullYear() + "-"
    + String(date.getMonth() + 1).padStart(2, "0") + "-"
    + String(date.getDate()).padStart(2, "0");
}

function countsAround(reference: string): GamesNum[] {
  const center = localDate(reference);
  return [-2, -1, 0, 1, 2].map((offset, index) => ({
    date: getDateString(new Date(
      center.getFullYear(), center.getMonth(), center.getDate() + offset,
    )),
    gamesNumber: [0, 1, 2, 4, 3][index],
  }));
}

function ok(data: GamesNum[]) {
  return Response.json({ data });
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

function DateButtonsWithState({ initialDate = DAY }: { initialDate?: string }) {
  const [date, setDate] = useState(() => localDate(initialDate));

  return (
    <DateButtons
      date={date}
      getDateString={getDateString}
      setDate={(value) => {
        onDateChange(value);
        setDate(value);
      }}
    />
  );
}

async function ready() {
  return await screen.findByRole("region", {
    name: "Seleccionar fecha de los partidos",
  });
}

function dayButton(day: number) {
  return screen.getByRole("button", {
    name: new RegExp("^Cambiar a fecha .*, " + day + "$"),
  });
}

function requestedDates() {
  return fetchMock.mock.calls.map(([input]) =>
    new URL(String(input), "https://app.test").searchParams.get("date"),
  );
}

function lastReplacedUrl() {
  const lastCall = navigation.router.replace.mock.calls.at(-1);
  expect(lastCall).toBeDefined();
  const url = new URL(lastCall![0], "https://app.test");
  expect(url.pathname).toBe("/");
  return url;
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

  fetchMock.mockImplementation(async (input) => {
    const url = new URL(String(input), "https://app.test");
    if (url.pathname !== "/api/partidos/numero") {
      throw new Error("Endpoint inesperado: " + url.pathname);
    }
    const reference = url.searchParams.get("date");
    if (!reference) throw new Error("Falta la fecha de referencia");
    return ok(countsAround(reference));
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("DateButtons: referencia y contenido inicial", () => {
  test("consulta reference, muestra cinco días y no reescribe una URL válida", async () => {
    navigation.searchParams = new URLSearchParams(
      "reference=2026-10-23&date=" + DAY,
    );
    render(<DateButtonsWithState />);

    const region = await ready();

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "/api/partidos/numero?date=2026-10-23",
      { signal: expect.any(AbortSignal) },
    );
    
    expect(within(region).getAllByRole("button")).toHaveLength(7);
    expect(dayButton(23)).toBeInTheDocument();
    expect(navigation.router.replace).not.toHaveBeenCalled();
    expect(onDateChange).not.toHaveBeenCalled();
  });

  test("usa hoy si falta reference y conserva los otros parámetros", async () => {
    navigation.searchParams = new URLSearchParams(
      "date=2026-10-17&source=portfolio",
    );
    render(<DateButtonsWithState initialDate="2026-10-17" />);
    await ready();

    expect(requestedDates()).toStrictEqual([DAY]);
    expect(navigation.router.replace).toHaveBeenCalledOnce();

    const url = lastReplacedUrl();
    expect(url.searchParams.get("reference")).toBe(DAY);
    expect(url.searchParams.get("date")).toBe("2026-10-17");
    expect(url.searchParams.get("source")).toBe("portfolio");
    expect(dayButton(17)).toHaveAttribute("aria-pressed", "true");
    expect(onDateChange).not.toHaveBeenCalled();
  });

  test("muestra Hoy en el día actual y marca la fecha seleccionada", async () => {
    render(<DateButtonsWithState />);
    await ready();

    expect(within(dayButton(18)).getByText("Hoy", { exact: true }))
      .toBeInTheDocument();
    expect(dayButton(18)).toHaveAttribute("aria-pressed", "true");
    expect(dayButton(17)).toHaveAttribute("aria-pressed", "false");
    expect(within(dayButton(17)).queryByText("Hoy", { exact: true }))
      .not.toBeInTheDocument();
  });

  test.each([
    { day: 16, text: "0 partidos" },
    { day: 17, text: "1 partido" },
    { day: 18, text: "2 partidos" },
  ])("muestra $text para el día $day", async ({ day, text }) => {
    render(<DateButtonsWithState />);
    await ready();

    expect(within(dayButton(day)).getByText(text, { exact: true }))
      .toBeInTheDocument();
  });

  test.each(["2026-09-18", "2025-10-18"])(
    "no confunde %s con el mismo número de día de otro mes o año",
    async (date) => {
      render(<DateButtonsWithState initialDate={date} />);
      await ready();

      expect(screen.queryByRole("button", { pressed: true }))
        .not.toBeInTheDocument();
    },
  );

  test("actualiza el día activo cuando cambia la prop date", async () => {
    const { rerender } = render(
      <DateButtons date={localDate(DAY)} setDate={onDateChange} getDateString={getDateString} />,
    );
    await ready();
    expect(dayButton(18)).toHaveAttribute("aria-pressed", "true");

    rerender(
      <DateButtons date={localDate("2026-10-19")} setDate={onDateChange} getDateString={getDateString} />,
    );

    expect(dayButton(19)).toHaveAttribute("aria-pressed", "true");
    expect(dayButton(18)).toHaveAttribute("aria-pressed", "false");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(onDateChange).not.toHaveBeenCalled();
  });
});

describe("DateButtons: selección y navegación", () => {
  test("comunica el día pulsado al padre y cambia el botón activo", async () => {
    render(<DateButtonsWithState />);
    await ready();

    fireEvent.click(dayButton(19));

    expect(onDateChange).toHaveBeenCalledExactlyOnceWith(localDate("2026-10-19"));
    expect(dayButton(19)).toHaveAttribute("aria-pressed", "true");
    expect(dayButton(18)).toHaveAttribute("aria-pressed", "false");
    
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });

  test.each([
    { arrow: PREVIOUS, expected: "2026-10-13", selectedDay: 13 },
    { arrow: NEXT, expected: "2026-10-23", selectedDay: 23 },
  ])("desplaza cinco días con $arrow", async ({ arrow, expected, selectedDay }) => {
    render(<DateButtonsWithState />);
    await ready();

    fireEvent.click(screen.getByRole("button", { name: arrow }));
    await ready();

    expect(requestedDates()).toStrictEqual([DAY, expected]);
    expect(onDateChange).toHaveBeenCalledExactlyOnceWith(localDate(expected));
    expect(dayButton(selectedDay)).toHaveAttribute("aria-pressed", "true");
    expect(navigation.router.replace).toHaveBeenCalledOnce();

    const url = lastReplacedUrl();
    expect(url.searchParams.get("reference")).toBe(expected);
    expect(url.searchParams.get("source")).toBe("portfolio");
  });

  test.each([
    { reference: "2026-01-29", arrow: NEXT, expected: "2026-02-03" },
    { reference: "2026-01-03", arrow: PREVIOUS, expected: "2025-12-29" },
    { reference: "2024-02-26", arrow: NEXT, expected: "2024-03-02" },
    { reference: "2026-02-26", arrow: NEXT, expected: "2026-03-03" },
    { reference: "2026-12-28", arrow: NEXT, expected: "2027-01-02" },
  ])(
    "navega desde $reference hasta $expected al cruzar un límite de calendario",
    async ({ reference, arrow, expected }) => {
      navigation.searchParams = new URLSearchParams("reference=" + reference);
      render(<DateButtonsWithState initialDate={reference} />);
      await ready();

      fireEvent.click(screen.getByRole("button", { name: arrow }));
      await ready();

      expect(requestedDates()).toStrictEqual([reference, expected]);
      expect(onDateChange).toHaveBeenCalledExactlyOnceWith(localDate(expected));
      expect(lastReplacedUrl().searchParams.get("reference")).toBe(expected);
    },
  );

  test("encadena varios desplazamientos usando la referencia más reciente", async () => {
    render(<DateButtonsWithState />);
    await ready();

    for (const arrow of [NEXT, NEXT, PREVIOUS]) {
      fireEvent.click(screen.getByRole("button", { name: arrow }));
      await ready();
    }

    expect(requestedDates()).toStrictEqual([
      DAY, "2026-10-23", "2026-10-28", "2026-10-23",
    ]);
    expect(onDateChange.mock.calls.map(([date]) => getDateString(date)))
      .toStrictEqual(["2026-10-23", "2026-10-28", "2026-10-23"]);
    expect(navigation.router.replace).toHaveBeenCalledTimes(3);
    expect(lastReplacedUrl().searchParams.get("reference")).toBe("2026-10-23");
    expect(dayButton(23)).toHaveAttribute("aria-pressed", "true");
  });
});

describe("DateButtons: carga y fallos de la API", () => {
  test("muestra el skeleton hasta que termina la petición inicial", async () => {
    const request = pendingResponse();
    fetchMock.mockReturnValueOnce(request.promise);
    render(<DateButtonsWithState />);

    expect(screen.getByRole("status", { name: "Cargando fechas" }))
      .toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("button", { name: NEXT })).not.toBeInTheDocument();

    await act(async () => {
      request.resolve(ok(countsAround(DAY)));
    });

    expect(screen.getByRole("region", { name: "Seleccionar fecha de los partidos" }))
      .toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Cargando fechas" }))
      .not.toBeInTheDocument();
  });

  test("oculta los contadores anteriores mientras carga otra referencia", async () => {
    render(<DateButtonsWithState />);
    await ready();

    const request = pendingResponse();
    fetchMock.mockReturnValueOnce(request.promise);
    fireEvent.click(screen.getByRole("button", { name: NEXT }));

    expect(screen.getByRole("status", { name: "Cargando fechas" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Cambiar a fecha .*, 18$/ }))
      .not.toBeInTheDocument();

    await act(async () => {
      request.resolve(ok(countsAround("2026-10-23")));
    });

    expect(dayButton(23)).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("status", { name: "Cargando fechas" }))
      .not.toBeInTheDocument();
  });

  test.each(["HTTP", "red"])("finaliza la carga si la petición falla por %s", async (kind) => {
    if (kind === "HTTP") {
      fetchMock.mockResolvedValueOnce(
        Response.json({ error: "Fallo simulado" }, { status: 500 }),
      );
    } else {
      fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    }

    render(<DateButtonsWithState />);
    const region = await ready();

    
    expect(console.error).toHaveBeenCalledOnce();
    expect(within(region).getAllByRole("button")).toHaveLength(2);
    expect(screen.getByRole("button", { name: PREVIOUS })).toBeEnabled();
    expect(screen.getByRole("button", { name: NEXT })).toBeEnabled();
    expect(screen.queryByRole("status", { name: "Cargando fechas" }))
      .not.toBeInTheDocument();
  });

  test("se recupera de un fallo al desplazarse a otra referencia", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(<DateButtonsWithState />);
    await ready();

    fireEvent.click(screen.getByRole("button", { name: NEXT }));
    const region = await ready();

    expect(requestedDates()).toStrictEqual([DAY, "2026-10-23"]);
    expect(within(region).getAllByRole("button")).toHaveLength(7);
    expect(dayButton(23)).toHaveAttribute("aria-pressed", "true");
  });
});

describe("DateButtons: cancelación de peticiones", () => {
  test("cancela la petición anterior cuando cambia la referencia", async () => {
    render(<DateButtonsWithState />);
    await ready();

    const initialSignal = fetchMock.mock.calls[0][1]?.signal;
    expect(initialSignal?.aborted).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: NEXT }));
    await ready();

    expect(initialSignal?.aborted).toBe(true);
    expect(fetchMock.mock.calls[1][1]?.signal?.aborted).toBe(false);
  });

  test.each(["resuelve", "rechaza"] as const)(
    "cancela al desmontarse y no vuelve a mostrar contenido si la petición se %s después",
    async (outcome) => {
      const request = pendingResponse();
      fetchMock.mockReturnValueOnce(request.promise);
      const { unmount } = render(<DateButtonsWithState />);

      const signal = fetchMock.mock.calls[0][1]?.signal;
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal?.aborted).toBe(false);

      unmount();

      expect(signal?.aborted).toBe(true);

      await act(async () => {
        if (outcome === "resuelve") {
          request.resolve(ok(countsAround(DAY)));
        } else {
          request.reject(new DOMException("Petición cancelada", "AbortError"));
        }
      });

      expect(screen.queryByRole("region", { name: "Seleccionar fecha de los partidos" }))
        .not.toBeInTheDocument();
      expect(onDateChange).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    },
  );
});
