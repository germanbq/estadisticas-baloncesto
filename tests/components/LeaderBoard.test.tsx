// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import LeaderBoard from "@/src/components/classification/LeaderBoard";
import styles from "@/src/components/classification/LeaderBoard.module.css";
import type { Team } from "@/src/backend/entities/teamsEntities";

vi.mock("@/src/components/FavoriteButton", () => ({ default: () => null }));

const navigation = vi.hoisted(() => ({
  router: {
    replace: vi.fn<(href: string, options?: { scroll: boolean }) => void>(),
  },
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  usePathname: () => "/clasificacion",
  useSearchParams: () => navigation.searchParams,
}));

type Conference = "East" | "West";

const teams: Record<Conference, Team[]> = {
  East: [
    {
      id: 42, name: "Boston Celtics", logo: "/logos/boston-celtics.webp",
      division: "Atlantic", victorys: 3, losses: 1, winRate: 75,
      difference: 8.3, streakNumber: 2, streakVictory: true, isFavorite: false,
    },
    {
      id: 7, name: "Chicago Bulls", logo: "/logos/chicago-bulls.webp",
      division: "Central", victorys: 2, losses: 2, winRate: 50,
      difference: -2.1, streakNumber: 1, streakVictory: false, isFavorite: true,
    },
  ],
  West: [
    {
      id: 113, name: "Denver Nuggets", logo: "/logos/denver-nuggets.webp",
      division: "Northwest", victorys: 4, losses: 1, winRate: 80,
      difference: 9.2, streakNumber: 3, streakVictory: true, isFavorite: false,
    },
    {
      id: 58, name: "Los Angeles Lakers", logo: "/logos/los-angeles-lakers.webp",
      division: "Pacific", victorys: 3, losses: 2, winRate: 60,
      difference: 1.5, streakNumber: 1, streakVictory: true, isFavorite: false,
    },
  ],
};

const conferences: Conference[] = ["East", "West"];
const labels: Record<Conference, string> = {
  East: "CONFERENCIA ESTE",
  West: "CONFERENCIA OESTE",
};
const fetchMock = vi.fn<typeof fetch>();

function otherConference(conf: Conference): Conference {
  return conf === "East" ? "West" : "East";
}

function conferenceButton(conf: Conference) {
  return screen.getByRole("button", { name: labels[conf]});
}

async function waitForTeams(conf: Conference) {
  await screen.findByRole("link", { name: new RegExp(teams[conf][0].name) });
}

function expectSelectedConference(conf: Conference) {
  
  expect(conferenceButton(conf)).toHaveClass(styles.active);
  expect(conferenceButton(otherConference(conf))).not.toHaveClass(styles.active);
}

function expectTeamLinks(conf: Conference) {
  const table = screen.getByRole("table");
  expect(within(table).getAllByRole("link")).toHaveLength(teams[conf].length);

  for (const team of teams[conf]) {
    const row = within(table).getByRole("row", { name: new RegExp(team.name) });
    const link = within(row).getByRole("link", { name: new RegExp(team.name) });

    expect(link).toHaveAttribute("href", "/equipos/" + team.id);
    expect(within(link).getByText(team.name, { exact: true })).toBeInTheDocument();
    expect(within(link).getByRole("img", { name: "Logo " + team.name }))
      .toBeInTheDocument();
  }
}

function requestedConferences() {
  return fetchMock.mock.calls.map(([input]) =>
    new URL(String(input), "https://app.test").searchParams.get("conf"),
  );
}

function expectNavigation(conf: Conference) {
  const call = navigation.router.replace.mock.calls.at(-1);
  expect(call).toBeDefined();
  const [href, options] = call!;
  const url = new URL(href, "https://app.test");

  expect(url.pathname).toBe("/clasificacion");
  expect(url.searchParams.get("conf")).toBe(conf);
  expect(url.searchParams.get("source")).toBe("portfolio");
  expect(options).toStrictEqual({ scroll: false });
}

beforeEach(() => {
  vi.resetAllMocks();
  navigation.searchParams = new URLSearchParams("conf=East&source=portfolio");

  navigation.router.replace.mockImplementation((href) => {
    navigation.searchParams = new URL(href, "https://app.test").searchParams;
  });

  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(async (input) => {
    const url = new URL(String(input), "https://app.test");
    const conf = url.searchParams.get("conf");

    if (url.pathname !== "/api/clasificacion" || (conf !== "East" && conf !== "West")) {
      throw new Error("Petición inesperada: " + String(input));
    }

    return Response.json({ data: teams[conf] });
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("LeaderBoard: conferencia inicial y enlaces", () => {
  test("selecciona Este por defecto si la URL no indica conferencia", async () => {
    navigation.searchParams = new URLSearchParams("source=portfolio");
    render(<LeaderBoard season={2026} />);
    await waitForTeams("East");

    expectSelectedConference("East");
    expect(requestedConferences()).toStrictEqual(["East"]);
    expect(navigation.router.replace).toHaveBeenCalledOnce();
    expectNavigation("East");
  });

  test.each(conferences)(
    "carga %s desde la URL y cada equipo enlaza a su propia ficha",
    async (conf) => {
      navigation.searchParams = new URLSearchParams("conf=" + conf + "&source=portfolio");
      render(<LeaderBoard season={2026} />);
      await waitForTeams(conf);

      expectSelectedConference(conf);
      expectTeamLinks(conf);
      expect(requestedConferences()).toStrictEqual([conf]);
      expect(navigation.router.replace).not.toHaveBeenCalled();
    },
  );
});

describe("LeaderBoard: botones de conferencia", () => {
  test.each(conferences)(
    "cambia a %s al pulsar su botón y muestra los enlaces de los nuevos equipos",
    async (target) => {
      const initial = otherConference(target);
      navigation.searchParams = new URLSearchParams(
        "conf=" + initial + "&source=portfolio",
      );
      render(<LeaderBoard season={2026} />);
      await waitForTeams(initial);

      fireEvent.click(conferenceButton(target));
      await waitForTeams(target);

      expectSelectedConference(target);
      expectTeamLinks(target);
      expect(requestedConferences()).toStrictEqual([initial, target]);

      for (const team of teams[initial]) {
        expect(screen.queryByRole("link", { name: new RegExp(team.name) }))
          .not.toBeInTheDocument();
      }

      expect(navigation.router.replace).toHaveBeenCalledOnce();
      expectNavigation(target);
    },
  );

  test.each(conferences)(
    "no repite la petición ni la navegación al pulsar %s si ya está seleccionada",
    async (conf) => {
      navigation.searchParams = new URLSearchParams("conf=" + conf + "&source=portfolio");
      render(<LeaderBoard season={2026} />);
      await waitForTeams(conf);

      fireEvent.click(conferenceButton(conf));

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(navigation.router.replace).not.toHaveBeenCalled();
      expectSelectedConference(conf);
      expectTeamLinks(conf);
    },
  );

  test("permite ir de Este a Oeste y volver a Este", async () => {
    render(<LeaderBoard season={2026} />);
    await waitForTeams("East");

    fireEvent.click(conferenceButton("West"));
    await waitForTeams("West");
    expectTeamLinks("West");

    fireEvent.click(conferenceButton("East"));
    await waitForTeams("East");

    expectSelectedConference("East");
    expectTeamLinks("East");
    expect(requestedConferences()).toStrictEqual(["East", "West", "East"]);
    expect(navigation.router.replace).toHaveBeenCalledTimes(2);
    expectNavigation("East");
  });

  test("muestra la carga y oculta los enlaces anteriores mientras cambia de conferencia", async () => {
    render(<LeaderBoard season={2026} />);
    await waitForTeams("East");

    let finishRequest!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      finishRequest = resolve;
    });
    fetchMock.mockReturnValueOnce(pending);

    fireEvent.click(conferenceButton("West"));

    expectSelectedConference("West");
    expect(screen.getByRole("status", { name: "Cargando clasificación" }))
      .toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(within(screen.getByRole("table")).queryByRole("link"))
      .not.toBeInTheDocument();

    await act(async () => {
      finishRequest(Response.json({ data: teams.West }));
    });

    expectTeamLinks("West");
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "false");
    expect(screen.queryByRole("status", { name: "Cargando clasificación" }))
      .not.toBeInTheDocument();
  });
});
