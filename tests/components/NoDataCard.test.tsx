// @vitest-environment jsdom

//Hace test de los usos del componente en otros componentes
import "@testing-library/jest-dom/vitest";
import type { ReactElement, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import Games from "@/src/components/app/Games";
import FavoriteGames from "@/src/components/favorites/FavoriteGames";
import FavoritePlayers from "@/src/components/favorites/FavoritePlayers";
import FavoriteTeams from "@/src/components/favorites/FavoriteTeams";
import StatsLeaders from "@/src/components/players/StatsLeaders";
import TeamPage from "@/src/app/equipos/[id]/page";
import PlayerStatsPage from "@/src/app/jugadores/[id]/page";
import GamePage from "@/src/app/partidos/[id]/page";

const mocks = vi.hoisted(() => ({
  navigation: {
    router: { replace: vi.fn() },
    searchParams: new URLSearchParams("date=2026-10-18&metric=points"),
  },
  teams: {
    teamProfile: vi.fn<(id: number) => Promise<Response>>(),
    playersSeasonStats: vi.fn<(id: number) => Promise<Response>>(),
    upcomingTeamGames: vi.fn<(id: number) => Promise<Response>>(),
  },
  players: {
    profileStats: vi.fn<(id: number) => Promise<Response>>(),
    lastGames: vi.fn<(id: number) => Promise<Response>>(),
  },
  games: {
    gameById: vi.fn<(id: number) => Promise<Response>>(),
    lastTeamGames: vi.fn<(teamId: number) => Promise<Response>>(),
    headToHeadGames: vi.fn<(homeId: number, awayId: number) => Promise<Response>>(),
    statsLeaders: vi.fn<(teamId: number) => Promise<Response>>(),
    gameTeamStats: vi.fn<(teamId: number, gameId: number) => Promise<Response>>(),
    gameMVP: vi.fn<(gameId: number) => Promise<Response>>(),
    playersStats: vi.fn<(gameId: number, teamId: number) => Promise<Response>>(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.navigation.router,
  usePathname: () => "/pruebas",
  useSearchParams: () => mocks.navigation.searchParams,
  notFound: () => { throw new Error("NEXT_NOT_FOUND"); },
}));

vi.mock("@/src/backend/containers/teamsContainer", () => ({
  teamsController: mocks.teams,
}));
vi.mock("@/src/backend/containers/playersContainer", () => ({
  playersController: mocks.players,
}));
vi.mock("@/src/backend/containers/gamesContainer", () => ({
  gamesController: mocks.games,
}));

vi.mock("@/src/components/app/DateButtons", () => ({ default: () => null }));
vi.mock("@/src/components/FavoriteButton", () => ({ default: () => null }));

vi.mock("@/src/components/GameCard", () => ({
  default: ({ homeTeam, awayTeam, children }: {
    homeTeam: string; awayTeam: string; children?: ReactNode;
  }) => <article><p>{homeTeam} contra {awayTeam}</p>{children}</article>,
}));
vi.mock("@/src/components/HorizontalPlayerCard", () => ({
  default: ({ player }: { player: { name: string } }) => <p>{player.name}</p>,
}));
vi.mock("@/src/components/team/HeaderCard", () => ({
  default: () => <p>Perfil del equipo disponible</p>,
}));
vi.mock("@/src/components/team/TeamGames", () => ({
  default: () => <p>Partidos del equipo disponibles</p>,
}));
vi.mock("@/src/components/team/PlayerStatsTable", () => ({
  default: () => <p>Estadísticas del equipo disponibles</p>,
}));
vi.mock("@/src/components/player/PlayerProfileCard", () => ({
  default: () => <p>Perfil del jugador disponible</p>,
}));
vi.mock("@/src/components/player/MainStats", () => ({
  default: () => <p>Promedios disponibles</p>,
}));
vi.mock("@/src/components/player/StatsTable", () => ({
  default: () => <p>Temporadas disponibles</p>,
}));
vi.mock("@/src/components/player/LastGames", () => ({
  default: () => <p>Últimos partidos disponibles</p>,
}));
vi.mock("@/src/components/game/StatsComparison", () => ({
  default: () => <p>Comparativa previa disponible</p>,
}));
vi.mock("@/src/components/game/HeadToHeadGames", () => ({
  default: () => <p>Enfrentamientos disponibles</p>,
}));
vi.mock("@/src/components/game/LastGamesComparison", () => ({
  default: () => <p>Estado de forma disponible</p>,
}));
vi.mock("@/src/components/game/StatsLeadersComparison", () => ({
  default: () => <p>Líderes disponibles</p>,
}));
vi.mock("@/src/components/game/FinishedTeamStatsComparison", () => ({
  default: () => <p>Comparativa final disponible</p>,
}));
vi.mock("@/src/components/game/MVPCard", () => ({
  default: () => <p>MVP disponible</p>,
}));
vi.mock("@/src/components/game/PlayersStats", () => ({
  default: () => <p>Jugadores del partido disponibles</p>,
}));
vi.mock("@/src/components/game/QuarterScores", () => ({
  default: () => <p>Marcador por cuartos disponible</p>,
}));

function ok(data: unknown): Response {
  return Response.json({ data });
}

function failure(): Response {
  return Response.json({ error: "Fallo simulado" }, { status: 500 });
}

const game = {
  id: 15,
  homeTeamId: 1,
  awayTeamId: 2,
  homeTeamName: "Boston Celtics",
  awayTeamName: "Denver Nuggets",
  homeShortName: "BOS",
  awayShortName: "DEN",
  homeTeamLogo: "/teams/boston.webp",
  awayTeamLogo: "/teams/denver.webp",
  homeTeamVictorys: 3,
  homeTeamLosses: 2,
  awayTeamVictorys: 4,
  awayTeamLosses: 1,
  homeTeamScore: null,
  awayTeamScore: null,
  homePeriodScores: [],
  awayPeriodScores: [],
  date: "2026-10-18T20:00:00Z",
  finished: false,
  stadium: "TD Garden",
  isFavorite: true,
  homeWinRate: 60,
  awayWinRate: 80,
  homePointsPerGame: 110,
  awayPointsPerGame: 112,
  homePointsAllowedPerGame: 100,
  awayPointsAllowedPerGame: 104,
  homeNetRating: 10,
  awayNetRating: 8,
  homeStreakNumber: 2,
  awayStreakNumber: 3,
  homeStreakVictory: true,
  awayStreakVictory: true,
};

const favoriteTeam = {
  id: 1,
  name: "Boston Celtics",
  logo: "/teams/boston.webp",
  position: 1,
  victorys: 3,
  losses: 2,
  streakVictory: true,
  streakNumber: 2,
  division: "Atlantic",
  netRating: 10,
  pointsPerGame: 110,
  pointsAllowedPerGame: 100,
  homeVictorys: 2,
  homeLosses: 1,
  nextMatch: "Denver Nuggets",
  nextMatchDate: "2026-10-18T20:00:00Z",
  isFavorite: true,
};

const leader = {
  id: 1, name: "Jayson Tatum", image: "/players/tatum.webp",
  position: "SF", team: "BOS", jerseyNumber: "0", value: 30,
};

const playerProfile = { id: 1, name: "Jayson Tatum", seasons: [{ season: 2026 }] };
const teamStats = { points: 110 };
const mvp = { playerId: 1, teamId: 1, name: "Jayson Tatum" };
const playerGameStats = { playerId: 1, name: "Jayson Tatum", points: 30 };

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});

  mocks.teams.teamProfile.mockImplementation(async () => ok(favoriteTeam));
  mocks.teams.playersSeasonStats.mockImplementation(async () => ok([playerGameStats]));
  mocks.teams.upcomingTeamGames.mockImplementation(async () => ok([game]));
  mocks.players.profileStats.mockImplementation(async () => ok(playerProfile));
  mocks.players.lastGames.mockImplementation(async () => ok([game]));
  mocks.games.gameById.mockImplementation(async () => ok(game));
  mocks.games.lastTeamGames.mockImplementation(async () => ok([game]));
  mocks.games.headToHeadGames.mockImplementation(async () => ok([game]));
  mocks.games.statsLeaders.mockImplementation(async () => ok([leader]));
  mocks.games.gameTeamStats.mockImplementation(async () => ok(teamStats));
  mocks.games.gameMVP.mockImplementation(async () => ok(mvp));
  mocks.games.playersStats.mockImplementation(async () => ok([playerGameStats]));

  fetchMock.mockRejectedValue(new Error("Falta configurar fetch en esta prueba"));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function expectNotice(text: string, title?: string) {
  expect(screen.getByText(text, { exact: true })).toBeInTheDocument();
  if (title) {
    expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
  }
}

const favoriteProps = {
  onFavoriteChange: () => {},
  disabled: false,
};

type ClientCase = {
  name: string;
  view: () => ReactElement;
  data: unknown[];
  empty: string;
  error: string;
  content: string;
};

const clientCases: ClientCase[] = [
  {
    name: "Games",
    view: () => <Games />,
    data: [game],
    empty: "No hay partidos programados para esta fecha.",
    error: "No se pudieron cargar los partidos. Inténtalo de nuevo.",
    content: "Boston Celtics contra Denver Nuggets",
  },
  {
    name: "FavoriteGames",
    view: () => <FavoriteGames {...favoriteProps} />,
    data: [game],
    empty: "Todavía no tienes partidos favoritos",
    error: "No se pudieron cargar tus partidos favoritos",
    content: "Boston Celtics contra Denver Nuggets",
  },
  {
    name: "FavoritePlayers",
    view: () => <FavoritePlayers {...favoriteProps} />,
    data: [{ id: 1, name: "Jayson Tatum" }],
    empty: "Todavía no tienes jugadores favoritos",
    error: "No se pudieron cargar tus jugadores favoritos",
    content: "Jayson Tatum",
  },
  {
    name: "FavoriteTeams",
    view: () => <FavoriteTeams {...favoriteProps} />,
    data: [favoriteTeam],
    empty: "Todavía no tienes equipos favoritos",
    error: "No se pudieron cargar tus equipos favoritos",
    content: "Boston Celtics",
  },
  {
    name: "StatsLeaders",
    view: () => <StatsLeaders />,
    data: [leader],
    empty: "No hay estadísticas disponibles para mostrar los líderes de la liga en esta métrica",
    error: "No se pudieron cargar los líderes de la liga. Inténtalo de nuevo.",
    content: "Jayson Tatum",
  },
];

describe.each(clientCases)("$name: estados de la petición", ({ view, data, empty, error, content }) => {
  test("no muestra avisos mientras la petición sigue cargando", () => {
    fetchMock.mockImplementation(() => new Promise<Response>(() => {}));
    render(view());

    expect(fetchMock).toHaveBeenCalled();
    
    expect(screen.getByRole("status", { name: /^Cargando/ })).toBeInTheDocument();
    expect(screen.queryByText(empty)).not.toBeInTheDocument();
    expect(screen.queryByText(error)).not.toBeInTheDocument();
  });

  test("muestra el aviso de lista vacía cuando la petición devuelve []", async () => {
    fetchMock.mockImplementation(async () => ok([]));
    render(view());

    expect(await screen.findByText(empty, { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(empty);
    expect(screen.queryByText(error)).not.toBeInTheDocument();
    expect(screen.queryByText(content)).not.toBeInTheDocument();
  });

  test("distingue un error HTTP de una lista vacía", async () => {
    fetchMock.mockImplementation(async () => failure());
    render(view());

    expect(await screen.findByText(error, { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(error);
    expect(screen.queryByText(empty)).not.toBeInTheDocument();
    expect(screen.queryByText(content)).not.toBeInTheDocument();
  });

  test("muestra el error si fetch rechaza por un fallo de red", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    render(view());

    expect(await screen.findByText(error, { exact: true })).toBeInTheDocument();
    expect(screen.queryByText(empty)).not.toBeInTheDocument();
  });

  test("muestra el contenido sin NoDataCard cuando hay datos", async () => {
    fetchMock.mockImplementation(async () => ok(data));
    render(view());

    expect(await screen.findByText(content, { exact: true })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(empty)).not.toBeInTheDocument();
    expect(screen.queryByText(error)).not.toBeInTheDocument();
  });
});

const params = () => Promise.resolve({ id: "15" });
const renderTeamPage = async () => render(await TeamPage({ params: params() }));
const renderPlayerPage = async () => render(await PlayerStatsPage({ params: params() }));
const renderGamePage = async () => render(await GamePage({ params: params() }));

describe("Página de equipo", () => {
  const gamesEmpty = "No hay partidos disponibles para este equipo";
  const gamesError = "No se pudieron cargar los partidos del equipo";
  const playersEmpty = "No hay estadísticas de jugadores disponibles esta temporada";
  const playersError = "No se pudieron cargar las estadísticas de los jugadores";

  test("muestra partidos y estadísticas cuando hay datos", async () => {
    await renderTeamPage();
    expect(screen.getByText("Partidos del equipo disponibles")).toBeInTheDocument();
    expect(screen.getByText("Estadísticas del equipo disponibles")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("avisa de que no hay partidos si ambas listas están vacías", async () => {
    mocks.games.lastTeamGames.mockImplementation(async () => ok([]));
    mocks.teams.upcomingTeamGames.mockImplementation(async () => ok([]));
    await renderTeamPage();

    expectNotice(gamesEmpty, "Partidos del equipo");
    expect(screen.queryByText("Partidos del equipo disponibles")).not.toBeInTheDocument();
    expect(screen.queryByText(gamesError)).not.toBeInTheDocument();
    expect(screen.getByText("Estadísticas del equipo disponibles")).toBeInTheDocument();
  });

  test.each(["finalizados", "próximos"] as const)(
    "mantiene el contenido si solo están vacíos los partidos %s",
    async (emptyList) => {
      const query = emptyList === "finalizados"
        ? mocks.games.lastTeamGames : mocks.teams.upcomingTeamGames;
      query.mockImplementation(async () => ok([]));
      await renderTeamPage();

      expect(screen.getByText("Partidos del equipo disponibles")).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    },
  );

  test.each(["finalizados", "próximos"] as const)(
    "muestra error si falla la consulta de partidos %s",
    async (failedList) => {
      const query = failedList === "finalizados"
        ? mocks.games.lastTeamGames : mocks.teams.upcomingTeamGames;
      query.mockImplementation(async () => failure());
      await renderTeamPage();

      expectNotice(gamesError, "Partidos del equipo");
      expect(screen.queryByText(gamesEmpty)).not.toBeInTheDocument();
      expect(screen.queryByText("Partidos del equipo disponibles")).not.toBeInTheDocument();
      expect(screen.getByText("Estadísticas del equipo disponibles")).toBeInTheDocument();
    },
  );

  test("avisa si no hay estadísticas de jugadores", async () => {
    mocks.teams.playersSeasonStats.mockImplementation(async () => ok([]));
    await renderTeamPage();

    expectNotice(playersEmpty, "Estadísticas de los jugadores");
    expect(screen.queryByText("Estadísticas del equipo disponibles")).not.toBeInTheDocument();
    expect(screen.queryByText(playersError)).not.toBeInTheDocument();
    expect(screen.getByText("Partidos del equipo disponibles")).toBeInTheDocument();
  });

  test("distingue un error al cargar estadísticas de una lista vacía", async () => {
    mocks.teams.playersSeasonStats.mockImplementation(async () => failure());
    await renderTeamPage();

    expectNotice(playersError, "Estadísticas de los jugadores");
    expect(screen.queryByText(playersEmpty)).not.toBeInTheDocument();
    expect(screen.queryByText("Estadísticas del equipo disponibles")).not.toBeInTheDocument();
  });
});

describe("Página de jugador", () => {
  const gamesEmpty = "No hay partidos finalizados disponibles para este jugador";
  const gamesError = "No se pudieron cargar los últimos partidos del jugador";

  test("muestra las tres secciones sin avisos cuando hay datos", async () => {
    await renderPlayerPage();

    for (const text of ["Promedios disponibles", "Temporadas disponibles", "Últimos partidos disponibles"]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("muestra los dos avisos de estadísticas cuando no hay temporadas", async () => {
    mocks.players.profileStats.mockImplementation(async () => ok({ ...playerProfile, seasons: [] }));
    await renderPlayerPage();

    expectNotice(
      "No hay estadísticas disponibles para mostrar los promedios de este jugador",
      "Promedios de temporada 2025-2026",
    );
    expectNotice(
      "No hay estadísticas de temporada disponibles para este jugador",
      "Estadísticas completas por temporada",
    );
    expect(screen.queryByText("Promedios disponibles")).not.toBeInTheDocument();
    expect(screen.queryByText("Temporadas disponibles")).not.toBeInTheDocument();
    expect(screen.getByText("Últimos partidos disponibles")).toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(2);
  });

  test("avisa si no hay últimos partidos", async () => {
    mocks.players.lastGames.mockImplementation(async () => ok([]));
    await renderPlayerPage();

    expectNotice(gamesEmpty, "Últimos 5 partidos");
    expect(screen.queryByText(gamesError)).not.toBeInTheDocument();
    expect(screen.queryByText("Últimos partidos disponibles")).not.toBeInTheDocument();
    expect(screen.getByText("Promedios disponibles")).toBeInTheDocument();
  });

  test("muestra error si falla la carga de últimos partidos", async () => {
    mocks.players.lastGames.mockImplementation(async () => failure());
    await renderPlayerPage();

    expectNotice(gamesError, "Últimos 5 partidos");
    expect(screen.queryByText(gamesEmpty)).not.toBeInTheDocument();
    expect(screen.queryByText("Últimos partidos disponibles")).not.toBeInTheDocument();
  });
});

const sides = [
  { label: "local", id: game.homeTeamId },
  { label: "visitante", id: game.awayTeamId },
];

describe("Página de partido pendiente", () => {
  const headEmpty = "No hay enfrentamientos finalizados esta temporada";
  const headError = "No se pudieron cargar los enfrentamientos";
  const formEmpty = "No hay partidos finalizados disponibles esta temporada";
  const formError = "No se pudieron cargar los últimos partidos";
  const leadersEmpty = "No hay estadísticas disponibles para comparar los líderes de ambos equipos";
  const leadersError = "No se pudieron cargar los líderes estadísticos";

  test("muestra las secciones sin avisos cuando hay datos", async () => {
    await renderGamePage();
    for (const text of ["Enfrentamientos disponibles", "Estado de forma disponible", "Líderes disponibles"]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("avisa si no hay enfrentamientos", async () => {
    mocks.games.headToHeadGames.mockImplementation(async () => ok([]));
    await renderGamePage();

    expectNotice(headEmpty, "Enfrentamientos esta temporada");
    expect(screen.queryByText(headError)).not.toBeInTheDocument();
    expect(screen.queryByText("Enfrentamientos disponibles")).not.toBeInTheDocument();
  });

  test("muestra error si falla la consulta de enfrentamientos", async () => {
    mocks.games.headToHeadGames.mockImplementation(async () => failure());
    await renderGamePage();

    expectNotice(headError, "Enfrentamientos esta temporada");
    expect(screen.queryByText(headEmpty)).not.toBeInTheDocument();
    expect(screen.queryByText("Enfrentamientos disponibles")).not.toBeInTheDocument();
  });

  test("avisa si ninguno de los equipos tiene últimos partidos", async () => {
    mocks.games.lastTeamGames.mockImplementation(async () => ok([]));
    await renderGamePage();

    expectNotice(formEmpty, "Estado de forma");
    expect(screen.queryByText("Estado de forma disponible")).not.toBeInTheDocument();
    expect(screen.queryByText(formError)).not.toBeInTheDocument();
  });

  test.each(sides)("mantiene el estado de forma si solo falta el equipo $label", async ({ id }) => {
    mocks.games.lastTeamGames.mockImplementation(async (teamId) => ok(teamId === id ? [] : [game]));
    await renderGamePage();

    expect(screen.getByText("Estado de forma disponible")).toBeInTheDocument();
    expect(screen.queryByText(formEmpty)).not.toBeInTheDocument();
  });

  test.each(sides)("muestra error de estado de forma si falla el equipo $label", async ({ id }) => {
    mocks.games.lastTeamGames.mockImplementation(async (teamId) => teamId === id ? failure() : ok([game]));
    await renderGamePage();

    expectNotice(formError, "Estado de forma");
    expect(screen.queryByText(formEmpty)).not.toBeInTheDocument();
    expect(screen.queryByText("Estado de forma disponible")).not.toBeInTheDocument();
  });

  test.each(sides)("avisa si faltan los líderes del equipo $label", async ({ id }) => {
    mocks.games.statsLeaders.mockImplementation(async (teamId) => ok(teamId === id ? [] : [leader]));
    await renderGamePage();

    expectNotice(leadersEmpty, "Líderes estadísticos");
    expect(screen.queryByText(leadersError)).not.toBeInTheDocument();
    expect(screen.queryByText("Líderes disponibles")).not.toBeInTheDocument();
  });

  test("avisa también si faltan los líderes de ambos equipos", async () => {
    mocks.games.statsLeaders.mockImplementation(async () => ok([]));
    await renderGamePage();

    expectNotice(leadersEmpty, "Líderes estadísticos");
    expect(screen.queryByText("Líderes disponibles")).not.toBeInTheDocument();
  });

  test.each(sides)("muestra error de líderes si falla el equipo $label", async ({ id }) => {
    mocks.games.statsLeaders.mockImplementation(async (teamId) => teamId === id ? failure() : ok([leader]));
    await renderGamePage();

    expectNotice(leadersError, "Líderes estadísticos");
    expect(screen.queryByText(leadersEmpty)).not.toBeInTheDocument();
    expect(screen.queryByText("Líderes disponibles")).not.toBeInTheDocument();
  });
});

describe("Página de partido finalizado", () => {
  const mvpEmpty = "No hay estadísticas disponibles para decidir el MVP del partido";
  const mvpError = "No se pudo cargar el MVP del partido";
  const teamsEmpty = "No hay estadísticas disponibles de los equipos";
  const teamsError = "No se pudieron cargar las estadísticas de los equipos";
  const playersEmpty = "No hay estadísticas disponibles sobre los jugadores";
  const playersError = "No se pudieron cargar las estadísticas de los jugadores";

  beforeEach(() => {
    mocks.games.gameById.mockImplementation(async () => ok({
      ...game, finished: true, homeTeamScore: 110, awayTeamScore: 104,
    }));
  });

  test("muestra las tres secciones sin avisos cuando hay datos", async () => {
    await renderGamePage();
    for (const text of ["MVP disponible", "Comparativa final disponible", "Jugadores del partido disponibles"]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("avisa si no hay MVP", async () => {
    mocks.games.gameMVP.mockImplementation(async () => ok(null));
    await renderGamePage();

    expectNotice(mvpEmpty, "MVP del partido");
    expect(screen.queryByText(mvpError)).not.toBeInTheDocument();
    expect(screen.queryByText("MVP disponible")).not.toBeInTheDocument();
  });

  test("muestra error si falla la consulta del MVP", async () => {
    mocks.games.gameMVP.mockImplementation(async () => failure());
    await renderGamePage();

    expectNotice(mvpError, "MVP del partido");
    expect(screen.queryByText(mvpEmpty)).not.toBeInTheDocument();
    expect(screen.queryByText("MVP disponible")).not.toBeInTheDocument();
  });

  test("avisa si ninguno de los equipos tiene estadísticas", async () => {
    mocks.games.gameTeamStats.mockImplementation(async () => ok(null));
    await renderGamePage();

    expectNotice(teamsEmpty, "Comparativa de equipos");
    expect(screen.queryByText(teamsError)).not.toBeInTheDocument();
    expect(screen.queryByText("Comparativa final disponible")).not.toBeInTheDocument();
  });

  test.each(sides)("mantiene la comparativa si solo faltan estadísticas del equipo $label", async ({ id }) => {
    mocks.games.gameTeamStats.mockImplementation(async (teamId) => ok(teamId === id ? null : teamStats));
    await renderGamePage();

    expect(screen.getByText("Comparativa final disponible")).toBeInTheDocument();
    expect(screen.queryByText(teamsEmpty)).not.toBeInTheDocument();
  });

  test.each(sides)("muestra error de estadísticas si falla el equipo $label", async ({ id }) => {
    mocks.games.gameTeamStats.mockImplementation(async (teamId) => teamId === id ? failure() : ok(teamStats));
    await renderGamePage();

    expectNotice(teamsError, "Comparativa de equipos");
    expect(screen.queryByText(teamsEmpty)).not.toBeInTheDocument();
    expect(screen.queryByText("Comparativa final disponible")).not.toBeInTheDocument();
  });

  test("avisa si ninguno de los equipos tiene estadísticas de jugadores", async () => {
    mocks.games.playersStats.mockImplementation(async () => ok([]));
    await renderGamePage();

    expectNotice(playersEmpty, "Estadísticas de jugadores");
    expect(screen.queryByText(playersError)).not.toBeInTheDocument();
    expect(screen.queryByText("Jugadores del partido disponibles")).not.toBeInTheDocument();
  });

  test.each(sides)("mantiene la tabla si solo faltan jugadores del equipo $label", async ({ id }) => {
    mocks.games.playersStats.mockImplementation(async (_gameId, teamId) => ok(teamId === id ? [] : [playerGameStats]));
    await renderGamePage();

    expect(screen.getByText("Jugadores del partido disponibles")).toBeInTheDocument();
    expect(screen.queryByText(playersEmpty)).not.toBeInTheDocument();
  });

  test.each(sides)("muestra error de jugadores si falla el equipo $label", async ({ id }) => {
    mocks.games.playersStats.mockImplementation(async (_gameId, teamId) => teamId === id ? failure() : ok([playerGameStats]));
    await renderGamePage();

    expectNotice(playersError, "Estadísticas de jugadores");
    expect(screen.queryByText(playersEmpty)).not.toBeInTheDocument();
    expect(screen.queryByText("Jugadores del partido disponibles")).not.toBeInTheDocument();
  });
});
