// @vitest-environment node

import { beforeEach, describe, vi } from "vitest";
import { auth } from "@clerk/nextjs/server";
import type { Client } from "pg";

import { test } from "../fixtures/dbTest";

import { FavoritesController } from "../../src/backend/controllers/FavoritesController";
import { FavoritesService } from "../../src/backend/services/FavoritesService";
import { FavoritesRepository } from "../../src/backend/repositories/FavoritesRepository";
import { FavoritesQueries } from "../../src/backend/queries/FavoritesQueries";
import { PostgresQueryExecutor } from "../../src/backend/shared/PostgresQueryExecutor";
import { error } from "console";

vi.mock("@clerk/nextjs/server", () => ({
    auth: vi.fn(),
}));

const authMock = vi.mocked(auth, { partial: true });

const SEED_PLAYER_ID_A = 1; // Jayson Tatum
const SEED_PLAYER_ID_B = 2; // Nikola Jokic
const SEED_PLAYER_ID_C = 3; // Jamal Murray
const SEED_TEAM_ID_A = 1; // Boston Celtics
const SEED_TEAM_ID_B = 2; // Denver Nuggets
const SEED_GAME_ID_A = 1;
const SEED_GAME_ID_B = 2;
const SEED_GAME_ID_C = 9;
const USER_A = "usuario_prueba_A";
const USER_B = "usuario_prueba_B";

function createController(db: Client): FavoritesController {
    const executor = new PostgresQueryExecutor(db);
    const queries = new FavoritesQueries();
    const repository = new FavoritesRepository(queries, executor);
    const service = new FavoritesService(repository);
    return new FavoritesController(service);
}

beforeEach(() => {
    authMock.mockReset();

    authMock.mockResolvedValue({
        userId: USER_A,
    });
});

describe("FavoritesController.favoriteCounts", () => {
  test("devuelve 401 cuando no hay un usuario autenticado", async ({ db, expect }) => {
    authMock.mockResolvedValue({ userId: null });
    const serviceSpy = vi.spyOn(FavoritesService.prototype, "favoriteCounts");

    try {
      const controller = createController(db);
      const response = await controller.favoriteCounts();

      expect(response.status).toBe(401);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(serviceSpy).not.toHaveBeenCalled();
    } finally {
      serviceSpy.mockRestore();
    }
  });

  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(FavoritesService.prototype, "favoriteCounts")
      .mockRejectedValue(new Error("Fallo simulado"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.favoriteCounts();

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve 500 cuando falla auth", async ({ db, expect }) => {
    authMock.mockRejectedValue(new Error("Fallo simulado de autenticación"));
    const serviceSpy = vi.spyOn(FavoritesService.prototype, "favoriteCounts");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.favoriteCounts();

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
      expect(serviceSpy).not.toHaveBeenCalled();
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve los contadores correctos cuando el usuario tiene favoritos de cada tipo", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_games (user_id, game_id) VALUES ($1, $2)", [USER_A, SEED_GAME_ID_A]);
    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, $2)", [USER_A, SEED_PLAYER_ID_A]);
    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, $2)", [USER_A, SEED_PLAYER_ID_B]);
    await db.query("INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $2)", [USER_A, SEED_TEAM_ID_A]);

    const controller = createController(db);
    const response = await controller.favoriteCounts();

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      data: { numberGames: 1, numberPlayers: 2, numberTeams: 1 },
    });
  });

  test("devuelve los contadores a cero cuando el usuario no tiene favoritos", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.favoriteCounts();

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      data: { numberGames: 0, numberPlayers: 0, numberTeams: 0 },
    });
  });

  test("solo cuenta los favoritos del usuario autenticado", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_games (user_id, game_id) VALUES ($1, $2)", [USER_A, SEED_GAME_ID_A]);
    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, $2)", [USER_A, SEED_PLAYER_ID_A]);
    await db.query("INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $2)", [USER_A, SEED_TEAM_ID_A]);
    await db.query("INSERT INTO favorite_games (user_id, game_id) VALUES ($1, $2), ($1, $3)", [USER_B, SEED_GAME_ID_A, SEED_GAME_ID_B]);
    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, $2), ($1, $3)", [USER_B, SEED_PLAYER_ID_A, SEED_PLAYER_ID_B]);
    await db.query("INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $2), ($1, $3)", [USER_B, SEED_TEAM_ID_A, SEED_TEAM_ID_B]);

    const controller = createController(db);
    const response = await controller.favoriteCounts();

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      data: { numberGames: 1, numberPlayers: 1, numberTeams: 1 },
    });

    authMock.mockResolvedValue({ userId: USER_B });
    const otherResponse = await controller.favoriteCounts();

    expect(otherResponse.status).toBe(200);
    expect(await otherResponse.json()).toStrictEqual({
      data: { numberGames: 2, numberPlayers: 2, numberTeams: 2 },
    });
  });
});

describe("FavoritesController.favoriteGames", () => {
  test("devuelve 401 cuando no hay un usuario autenticado", async ({ db, expect }) => {
    authMock.mockResolvedValue({ userId: null });
    const serviceSpy = vi.spyOn(FavoritesService.prototype, "favoriteGames");

    try {
      const controller = createController(db);
      const response = await controller.favoriteGames();

      expect(response.status).toBe(401);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(serviceSpy).not.toHaveBeenCalled();
    } finally {
      serviceSpy.mockRestore();
    }
  });

  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(FavoritesService.prototype, "favoriteGames")
      .mockRejectedValue(new Error("Fallo simulado"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.favoriteGames();

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve 500 cuando falla auth", async ({ db, expect }) => {
    authMock.mockRejectedValue(new Error("Fallo simulado de autenticación"));
    const serviceSpy = vi.spyOn(FavoritesService.prototype, "favoriteGames");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.favoriteGames();

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
      expect(serviceSpy).not.toHaveBeenCalled();
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });


  test("devuelve una lista vacía cuando el usuario no tiene partidos favoritos", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.favoriteGames();

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ data: [] });
  });

  test("los partidos favoritos de otro usuario no afectan a los del usuario autenticado", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_games (user_id, game_id) VALUES ($1, $2)", [USER_A, SEED_GAME_ID_A]);
    const controller = createController(db);
    const beforeResponse = await controller.favoriteGames();

    expect(beforeResponse.status).toBe(200);
    const beforeResult = await beforeResponse.json();
    expect(beforeResult).toMatchObject({ data: [{ id: SEED_GAME_ID_A, isFavorite: true }] });

    await db.query(
      "INSERT INTO favorite_games (user_id, game_id) VALUES ($1, $2), ($1, $3)",
      [USER_B, SEED_GAME_ID_A, SEED_GAME_ID_B],
    );
    const afterResponse = await controller.favoriteGames();

    expect(afterResponse.status).toBe(200);
    expect(await afterResponse.json()).toStrictEqual(beforeResult);
  });

  test("devuelve el partido favorito con victorias y derrotas a cero aunque sus equipos no tengan TSS", async ({ db, expect }) => {
    const deleted = await db.query(
      "DELETE FROM team_season_stats WHERE team_id IN ($1, $2) AND season_init_year = 2026 RETURNING team_id",
      [SEED_TEAM_ID_A, SEED_TEAM_ID_B],
    );
    expect(deleted.rows).toHaveLength(2);
    await db.query("INSERT INTO favorite_games (user_id, game_id) VALUES ($1, $2)", [USER_A, SEED_GAME_ID_A]);

    const controller = createController(db);
    const response = await controller.favoriteGames();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: [{
        id: SEED_GAME_ID_A,
        homeTeamName: "Boston Celtics",
        awayTeamName: "Denver Nuggets",
        homeTeamVictorys: 0,
        homeTeamLosses: 0,
        awayTeamVictorys: 0,
        awayTeamLosses: 0,
        isFavorite: true,
      }],
    });
  });

  test("devuelve los datos correctos de los partidos favoritos ordenados del más reciente al más antiguo", async ({ db, expect }) => {
    await db.query(
      "INSERT INTO favorite_games (user_id, game_id) VALUES ($1, $2), ($1, $3), ($1, $4)",
      [USER_A, SEED_GAME_ID_A, SEED_GAME_ID_C, SEED_GAME_ID_B],
    );

    const controller = createController(db);
    const response = await controller.favoriteGames();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: [
        {
          id: SEED_GAME_ID_B,
          date: "2026-10-18T08:00:00.000Z",
          homeTeamName: "Boston Celtics",
          homeTeamLogo: "/logos/boston-celtics.webp",
          awayTeamName: "Denver Nuggets",
          awayTeamLogo: "/logos/denver-nuggets.webp",
          stadium: "TD Garden",
          homeTeamScore: 112,
          awayTeamScore: 100,
          finished: true,
          isFavorite: true,
        },
        {
          id: SEED_GAME_ID_A,
          date: "2026-10-18T07:59:59.999Z",
          homeTeamName: "Boston Celtics",
          homeTeamLogo: "/logos/boston-celtics.webp",
          awayTeamName: "Denver Nuggets",
          awayTeamLogo: "/logos/denver-nuggets.webp",
          stadium: "TD Garden",
          homeTeamScore: 104,
          awayTeamScore: 107,
          finished: true,
          isFavorite: true,
        },
        {
          id: SEED_GAME_ID_C,
          date: "2025-10-18T20:00:00.000Z",
          homeTeamName: "Boston Celtics",
          homeTeamLogo: "/logos/boston-celtics.webp",
          awayTeamName: "Denver Nuggets",
          awayTeamLogo: "/logos/denver-nuggets.webp",
          stadium: "TD Garden",
          homeTeamScore: 110,
          awayTeamScore: 106,
          finished: true,
          isFavorite: true,
        },
      ],
    });
  });
});

describe("FavoritesController.favoritePlayers", () => {
  test("devuelve 401 cuando no hay un usuario autenticado", async ({ db, expect }) => {
    authMock.mockResolvedValue({ userId: null });
    const serviceSpy = vi.spyOn(FavoritesService.prototype, "favoritePlayers");

    try {
      const controller = createController(db);
      const response = await controller.favoritePlayers();

      expect(response.status).toBe(401);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(serviceSpy).not.toHaveBeenCalled();
    } finally {
      serviceSpy.mockRestore();
    }
  });

  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(FavoritesService.prototype, "favoritePlayers")
      .mockRejectedValue(new Error("Fallo simulado"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.favoritePlayers();

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve 500 cuando falla auth", async ({ db, expect }) => {
    authMock.mockRejectedValue(new Error("Fallo simulado de autenticación"));
    const serviceSpy = vi.spyOn(FavoritesService.prototype, "favoritePlayers");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.favoritePlayers();

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
      expect(serviceSpy).not.toHaveBeenCalled();
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });


 test("devuelve una lista vacía cuando el usuario no tiene jugadores favoritos", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.favoritePlayers();

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ data: [] });
  });

  test("los jugadores favoritos de otro usuario no afectan a los del usuario autenticado", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, $2)", [USER_A, SEED_PLAYER_ID_A]);
    const controller = createController(db);
    const beforeResponse = await controller.favoritePlayers();

    expect(beforeResponse.status).toBe(200);
    const beforeResult = await beforeResponse.json();
    expect(beforeResult).toMatchObject({ data: [{ id: SEED_PLAYER_ID_A, isFavorite: true }] });

    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, $2), ($1, $3)", [USER_B, SEED_PLAYER_ID_A, SEED_PLAYER_ID_B]);

    const afterResponse = await controller.favoritePlayers();
    expect(afterResponse.status).toBe(200);
    expect(await afterResponse.json()).toStrictEqual(beforeResult);
  });

  test("devuelve el jugador favorito con estadísticas a cero aunque no tenga PSS", async ({ db, expect }) => {
    const deleted = await db.query("DELETE FROM player_season_stats WHERE player_id = $1 AND season_init_year = 2026 RETURNING player_id", [SEED_PLAYER_ID_B]);
    expect(deleted.rows).toHaveLength(1);

    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, $2)", [USER_A, SEED_PLAYER_ID_B]);

    const controller = createController(db);
    const response = await controller.favoritePlayers();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: [{
      id: SEED_PLAYER_ID_B, name: "Nikola Jokic", points: 0, rebounds: 0,
      assists: 0, steals: 0, blocks: 0, isFavorite: true,
    }] });
  });

  test("devuelve los datos y promedios correctos de los favoritos ordenados por valoración descendente", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, $2), ($1, $3), ($1, $4)", [USER_A, SEED_PLAYER_ID_C, SEED_PLAYER_ID_A, SEED_PLAYER_ID_B]);
    const controller = createController(db);
    const response = await controller.favoritePlayers();
    
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: [
      { id: SEED_PLAYER_ID_B, name: "Nikola Jokic", image: "/players/Nikola_Jokic.webp", team: "Denver Nuggets", jerseyNumber: 15, position: "C", age: 31, points: 24.5, rebounds: 10.5, assists: 8.5, steals: 1.5, blocks: 1.5, isFavorite: true },
      { id: SEED_PLAYER_ID_A, name: "Jayson Tatum", image: "/players/Jayson_Tatum.webp", team: "Boston Celtics", jerseyNumber: 0, position: "SF", age: 28, points: 30, rebounds: 8, assists: 5, steals: 2, blocks: 1, isFavorite: true },
      { id: SEED_PLAYER_ID_C, name: "Jamal Murray", image: "/players/Jamal_Murray.webp", team: "Denver Nuggets", jerseyNumber: 27, position: "PG", age: 29, points: 28.5, rebounds: 4.5, assists: 6.5, steals: 1.5, blocks: 0.5, isFavorite: true },
    ] });
  });
});

describe("FavoritesController.favoriteTeams", () => {
  test("devuelve 401 cuando no hay un usuario autenticado", async ({ db, expect }) => {
    authMock.mockResolvedValue({ userId: null });
    const serviceSpy = vi.spyOn(FavoritesService.prototype, "favoriteTeams");

    try {
      const controller = createController(db);
      const response = await controller.favoriteTeams();

      expect(response.status).toBe(401);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(serviceSpy).not.toHaveBeenCalled();
    } finally {
      serviceSpy.mockRestore();
    }
  });

  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(FavoritesService.prototype, "favoriteTeams")
      .mockRejectedValue(new Error("Fallo simulado"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.favoriteTeams();

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve 500 cuando falla auth", async ({ db, expect }) => {
    authMock.mockRejectedValue(new Error("Fallo simulado de autenticación"));
    const serviceSpy = vi.spyOn(FavoritesService.prototype, "favoriteTeams");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.favoriteTeams();

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
      expect(serviceSpy).not.toHaveBeenCalled();
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });


  test("devuelve una lista vacía cuando el usuario no tiene equipos favoritos", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.favoriteTeams();

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ data: [] });
  });

  test("los equipos favoritos de otro usuario no afectan a los del usuario autenticado", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $2)", [USER_A, SEED_TEAM_ID_A]);
    const controller = createController(db);
    const beforeResponse = await controller.favoriteTeams();

    expect(beforeResponse.status).toBe(200);
    const beforeResult = await beforeResponse.json();
    expect(beforeResult).toMatchObject({ data: [{ id: SEED_TEAM_ID_A, isFavorite: true }] });

    await db.query("INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $2), ($1, $3)", [USER_B, SEED_TEAM_ID_A, SEED_TEAM_ID_B]);
    const afterResponse = await controller.favoriteTeams();

    expect(afterResponse.status).toBe(200);
    expect(await afterResponse.json()).toStrictEqual(beforeResult);
  });

  test("devuelve el equipo favorito con estadísticas a cero aunque no tenga TSS", async ({ db, expect }) => {
    const deleted = await db.query("DELETE FROM team_season_stats WHERE team_id = $1 AND season_init_year = 2026 RETURNING team_id", [SEED_TEAM_ID_A]);
    expect(deleted.rows).toHaveLength(1);
    await db.query("INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $2)", [USER_A, SEED_TEAM_ID_A]);

    const controller = createController(db);
    const response = await controller.favoriteTeams();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: [{
      id: SEED_TEAM_ID_A, name: "Boston Celtics", victorys: 0, losses: 0,
      streakNumber: 0, streakVictory: true, netRating: 0,
      pointsPerGame: 0, pointsAllowedPerGame: 0, homeVictorys: 0, homeLosses: 0,
      isFavorite: true,
    }] });
  });

  test("devuelve los datos correctos de los equipos favoritos ordenados por posición y por ID en caso de empate", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, 3), ($1, $2), ($1, $3)", [USER_A, SEED_TEAM_ID_B, SEED_TEAM_ID_A]);
    const controller = createController(db);
    const response = await controller.favoriteTeams();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: [
      {
        id: SEED_TEAM_ID_A, name: "Boston Celtics", logo: "/logos/boston-celtics.webp", division: "Atlantic",
        victorys: 3, losses: 3, position: 1, homeVictorys: 3, homeLosses: 3,
        pointsPerGame: expect.closeTo(106.666667, 5), pointsAllowedPerGame: 105.5,
        netRating: 7, nextMatch: null, nextMatchDate: null, isFavorite: true,
      },
      {
        id: SEED_TEAM_ID_B, name: "Denver Nuggets", logo: "/logos/denver-nuggets.webp", division: "Northwest",
        victorys: 3, losses: 3, position: 1, homeVictorys: 0, homeLosses: 0,
        pointsPerGame: 105.5, pointsAllowedPerGame: expect.closeTo(106.666667, 5),
        netRating: -7, nextMatch: null, nextMatchDate: null, isFavorite: true,
      },
      {
        id: 3, name: "Philadelphia 76ers", logo: "/logos/philadelphia-76ers.webp", division: "Atlantic",
        victorys: 0, losses: 0, position: 2, homeVictorys: 0, homeLosses: 0,
        pointsPerGame: 0, pointsAllowedPerGame: 0, netRating: 0,
        streakNumber: 0, streakVictory: true, nextMatch: null, nextMatchDate: null, isFavorite: true,
      },
    ] });
  });
});

describe("FavoritesController.addFavoriteGame", () => {
  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.addFavoriteGame(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID es menor de 1: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.addFavoriteGame(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );
    test("devuelve 401 cuando no hay un usuario autenticado", async ({db, expect}) => {
        authMock.mockResolvedValue({userId: null});
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "addFavoriteGame");

        try {
            const controller = createController(db);
            const response = await controller.addFavoriteGame(SEED_GAME_ID_A);

            expect(response.status).toBe(401);
            expect(await response.json()).toStrictEqual({error: expect.any(String) });
            expect(serviceSpy).not.toHaveBeenCalled();
        } finally {
            serviceSpy.mockRestore();
        }
    });

    test("devuelve 500 cuando falla el servicio", async ({db, expect}) => {
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "addFavoriteGame")
                                .mockRejectedValue(new Error("Fallo simulado"));
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            const controller = createController(db);
            const response = await controller.addFavoriteGame(SEED_GAME_ID_A);

            expect(response.status).toBe(500);
            expect(await response.json()).toStrictEqual({error: expect.any(String)});
        } finally {
            serviceSpy.mockRestore();
            consoleSpy.mockRestore();
        }
    });

  test("devuelve 500 cuando falla auth al añadir un partido favorito", async ({ db, expect }) => {
    authMock.mockRejectedValue(new Error("Fallo simulado de autenticación"));
    const serviceSpy = vi.spyOn(FavoritesService.prototype, "addFavoriteGame");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.addFavoriteGame(SEED_GAME_ID_A);

      expect(response.status).toBe(500);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(serviceSpy).not.toHaveBeenCalled();
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("aumenta en uno el contador de partidos favoritos al añadir un partido", async ({ db, expect }) => {
    const controller = createController(db);
    const beforeResponse = await controller.favoriteCounts();

    expect(beforeResponse.status).toBe(200);
    expect(await beforeResponse.json()).toStrictEqual({
      data: { numberGames: 0, numberPlayers: 0, numberTeams: 0 },
    });

    const addedResponse = await controller.addFavoriteGame(SEED_GAME_ID_A);
    expect(addedResponse.status).toBe(204);
    const afterResponse = await controller.favoriteCounts();

    expect(afterResponse.status).toBe(200);
    expect(await afterResponse.json()).toStrictEqual({
      data: { numberGames: 1, numberPlayers: 0, numberTeams: 0 },
    });
  });

  test("añadir un partido favorito a otro usuario no aumenta el contador del usuario original", async ({ db, expect }) => {
    const controller = createController(db);
    const beforeResponse = await controller.favoriteCounts();

    expect(beforeResponse.status).toBe(200);
    const beforeResult = await beforeResponse.json();
    expect(beforeResult).toMatchObject({ data: { numberGames: 0 } });

    authMock.mockResolvedValue({ userId: USER_B });
    const addedResponse = await controller.addFavoriteGame(SEED_GAME_ID_A);
    expect(addedResponse.status).toBe(204);
    const otherResponse = await controller.favoriteCounts();
    expect(otherResponse.status).toBe(200);
    expect(await otherResponse.json()).toMatchObject({ data: { numberGames: 1 } });

    authMock.mockResolvedValue({ userId: USER_A });
    const afterResponse = await controller.favoriteCounts();
    expect(afterResponse.status).toBe(200);
    expect(await afterResponse.json()).toStrictEqual(beforeResult);
  });

  test("no duplica el favorito ni devuelve error cuando ya existe", async ({ db, expect }) => {
    const controller = createController(db);
    const firstResponse = await controller.addFavoriteGame(SEED_GAME_ID_A);
    const repeatedResponse = await controller.addFavoriteGame(SEED_GAME_ID_A);

    expect(firstResponse.status).toBe(204);
    expect(repeatedResponse.status).toBe(204);

    const stored = await db.query(
      "SELECT COUNT(*)::integer AS count FROM favorite_games WHERE user_id = $1 AND game_id = $2",
      [USER_A, SEED_GAME_ID_A],
    );
    expect(stored.rows).toStrictEqual([{ count: 1 }]);

    const countsResponse = await controller.favoriteCounts();
    expect(countsResponse.status).toBe(200);
    expect(await countsResponse.json()).toMatchObject({ data: { numberGames: 1 } });
  });

  test("devuelve 500 cuando el partido no existe y la clave foránea rechaza el favorito", async ({ db, expect }) => {
    const missing = await db.query("SELECT id FROM games WHERE id = $1", [9999]);
    expect(missing.rows).toHaveLength(0);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const controller = createController(db);
      const response = await controller.addFavoriteGame(9999);

      expect(response.status).toBe(500);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test("permite guardar el mismo partido como favorito para dos usuarios distintos", async ({ db, expect }) => {
    const controller = createController(db);
    const firstResponse = await controller.addFavoriteGame(SEED_GAME_ID_A);
    expect(firstResponse.status).toBe(204);

    authMock.mockResolvedValue({ userId: USER_B });
    const otherResponse = await controller.addFavoriteGame(SEED_GAME_ID_A);
    expect(otherResponse.status).toBe(204);

    const stored = await db.query(
      "SELECT user_id, game_id FROM favorite_games WHERE game_id = $1 AND user_id IN ($2, $3) ORDER BY user_id",
      [SEED_GAME_ID_A, USER_A, USER_B],
    );
    expect(stored.rows).toStrictEqual([
      { user_id: USER_A, game_id: SEED_GAME_ID_A },
      { user_id: USER_B, game_id: SEED_GAME_ID_A },
    ]);
  });
});

describe("FavoritesController.addFavoritePlayer", () => {
    test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
        "devuelve 400 cuando el ID no es un entero seguro: %s", async (id, { db, expect }) => {
        const controller = createController(db);
        const response = await controller.addFavoritePlayer(id);

        expect(response.status).toBe(400);
        expect(await response.json()).toStrictEqual({ error: expect.any(String) });
        expect(authMock).not.toHaveBeenCalled();
        },
    );

    test.for([-2, 0])(
        "devuelve 400 cuando el ID es menor de 1: %s", async (id, { db, expect }) => {
        const controller = createController(db);
        const response = await controller.addFavoritePlayer(id);

        expect(response.status).toBe(400);
        expect(await response.json()).toStrictEqual({ error: expect.any(String) });
        expect(authMock).not.toHaveBeenCalled();
        },
    );
  
    test("devuelve 401 cuando no hay un usuario autenticado", async ({db, expect}) => {
        authMock.mockResolvedValue({userId: null});
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "addFavoritePlayer");

        try {
            const controller = createController(db);
            const response = await controller.addFavoritePlayer(SEED_PLAYER_ID_A);

            expect(response.status).toBe(401);
            expect(await response.json()).toStrictEqual({error: expect.any(String) });
            expect(serviceSpy).not.toHaveBeenCalled();
        } finally {
            serviceSpy.mockRestore();
        }
    });

    test("devuelve 500 cuando falla el servicio", async ({db, expect}) => {
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "addFavoritePlayer")
                                .mockRejectedValue(new Error("Fallo simulado"));
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            const controller = createController(db);
            const response = await controller.addFavoritePlayer(SEED_PLAYER_ID_A);

            expect(response.status).toBe(500);
            expect(await response.json()).toStrictEqual({error: expect.any(String)});
        } finally {
            serviceSpy.mockRestore();
            consoleSpy.mockRestore();
        }
    });

    test("devuelve 500 cuando falla auth al añadir un jugador favorito", async ({ db, expect }) => {
        authMock.mockRejectedValue(new Error("Fallo simulado de autenticación"));
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "addFavoritePlayer");
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
        const controller = createController(db);
        const response = await controller.addFavoritePlayer(SEED_PLAYER_ID_A);

        expect(response.status).toBe(500);
        expect(await response.json()).toStrictEqual({ error: expect.any(String) });
        expect(serviceSpy).not.toHaveBeenCalled();
        } finally {
        serviceSpy.mockRestore();
        consoleSpy.mockRestore();
        }
    });

    test("aumenta en uno el contador de jugadores favoritos al añadir un jugador", async ({ db, expect }) => {
        const controller = createController(db);
        const beforeResponse = await controller.favoriteCounts();

        expect(beforeResponse.status).toBe(200);
        expect(await beforeResponse.json()).toStrictEqual({
        data: { numberGames: 0, numberPlayers: 0, numberTeams: 0 },
        });

        const addedResponse = await controller.addFavoritePlayer(SEED_PLAYER_ID_A);
        expect(addedResponse.status).toBe(204);
        const afterResponse = await controller.favoriteCounts();

        expect(afterResponse.status).toBe(200);
        expect(await afterResponse.json()).toStrictEqual({
        data: { numberGames: 0, numberPlayers: 1, numberTeams: 0 },
        });
    });

    test("añadir un jugador favorito a otro usuario no aumenta el contador del usuario original", async ({ db, expect }) => {
        const controller = createController(db);
        const beforeResponse = await controller.favoriteCounts();

        expect(beforeResponse.status).toBe(200);
        const beforeResult = await beforeResponse.json();
        expect(beforeResult).toMatchObject({ data: { numberPlayers: 0 } });

        authMock.mockResolvedValue({ userId: USER_B });
        const addedResponse = await controller.addFavoritePlayer(SEED_PLAYER_ID_A);
        expect(addedResponse.status).toBe(204);
        const otherResponse = await controller.favoriteCounts();
        expect(otherResponse.status).toBe(200);
        expect(await otherResponse.json()).toMatchObject({ data: { numberPlayers: 1 } });

        authMock.mockResolvedValue({ userId: USER_A });
        const afterResponse = await controller.favoriteCounts();
        expect(afterResponse.status).toBe(200);
        expect(await afterResponse.json()).toStrictEqual(beforeResult);
    });

    test("no duplica el favorito ni devuelve error cuando ya existe", async ({ db, expect }) => {
        const controller = createController(db);
        const firstResponse = await controller.addFavoritePlayer(SEED_PLAYER_ID_A);
        const repeatedResponse = await controller.addFavoritePlayer(SEED_PLAYER_ID_A);

        expect(firstResponse.status).toBe(204);
        expect(repeatedResponse.status).toBe(204);

        const stored = await db.query(
        "SELECT COUNT(*)::integer AS count FROM favorite_players WHERE user_id = $1 AND player_id = $2",
        [USER_A, SEED_PLAYER_ID_A],
        );
        expect(stored.rows).toStrictEqual([{ count: 1 }]);

        const countsResponse = await controller.favoriteCounts();
        expect(countsResponse.status).toBe(200);
        expect(await countsResponse.json()).toMatchObject({ data: { numberPlayers: 1 } });
    });

    test("devuelve 500 cuando el jugador no existe y la clave foránea rechaza el favorito", async ({ db, expect }) => {
        const missing = await db.query("SELECT id FROM players WHERE id = $1", [9999]);
        expect(missing.rows).toHaveLength(0);
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        try {
        const controller = createController(db);
        const response = await controller.addFavoritePlayer(9999);

        expect(response.status).toBe(500);
        expect(await response.json()).toStrictEqual({ error: expect.any(String) });
        } finally {
        consoleSpy.mockRestore();
        }
    });

    test("permite guardar el mismo jugador como favorito para dos usuarios distintos", async ({ db, expect }) => {
        const controller = createController(db);
        const firstResponse = await controller.addFavoritePlayer(SEED_PLAYER_ID_A);
        expect(firstResponse.status).toBe(204);

        authMock.mockResolvedValue({ userId: USER_B });
        const otherResponse = await controller.addFavoritePlayer(SEED_PLAYER_ID_A);
        expect(otherResponse.status).toBe(204);

        const stored = await db.query(
        "SELECT user_id, player_id FROM favorite_players WHERE player_id = $1 AND user_id IN ($2, $3) ORDER BY user_id",
        [SEED_PLAYER_ID_A, USER_A, USER_B],
        );
        expect(stored.rows).toStrictEqual([
        { user_id: USER_A, player_id: SEED_PLAYER_ID_A },
        { user_id: USER_B, player_id: SEED_PLAYER_ID_A },
        ]);
    });
});

describe("FavoritesController.addFavoriteTeam", () => {
    test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
        "devuelve 400 cuando el ID no es un entero seguro: %s", async (id, { db, expect }) => {
        const controller = createController(db);
        const response = await controller.addFavoriteTeam(id);

        expect(response.status).toBe(400);
        expect(await response.json()).toStrictEqual({ error: expect.any(String) });
        expect(authMock).not.toHaveBeenCalled();
        },
    );

    test.for([-2, 0])(
        "devuelve 400 cuando el ID es menor de 1: %s", async (id, { db, expect }) => {
        const controller = createController(db);
        const response = await controller.addFavoriteTeam(id);

        expect(response.status).toBe(400);
        expect(await response.json()).toStrictEqual({ error: expect.any(String) });
        expect(authMock).not.toHaveBeenCalled();
        },
    );
  
    test("devuelve 401 cuando no hay un usuario autenticado", async ({db, expect}) => {
        authMock.mockResolvedValue({userId: null});
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "addFavoriteTeam");

        try {
            const controller = createController(db);
            const response = await controller.addFavoriteTeam(SEED_TEAM_ID_A);

            expect(response.status).toBe(401);
            expect(await response.json()).toStrictEqual({error: expect.any(String) });
            expect(serviceSpy).not.toHaveBeenCalled();
        } finally {
            serviceSpy.mockRestore();
        }
    });

    test("devuelve 500 cuando falla el servicio", async ({db, expect}) => {
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "addFavoriteTeam")
                                .mockRejectedValue(new Error("Fallo simulado"));
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            const controller = createController(db);
            const response = await controller.addFavoriteTeam(SEED_TEAM_ID_A);

            expect(response.status).toBe(500);
            expect(await response.json()).toStrictEqual({error: expect.any(String)});
        } finally {
            serviceSpy.mockRestore();
            consoleSpy.mockRestore();
        }
    });

    test("devuelve 500 cuando falla auth al añadir un equipo favorito", async ({ db, expect }) => {
        authMock.mockRejectedValue(new Error("Fallo simulado de autenticación"));
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "addFavoriteTeam");
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
        const controller = createController(db);
        const response = await controller.addFavoriteTeam(SEED_TEAM_ID_A);

        expect(response.status).toBe(500);
        expect(await response.json()).toStrictEqual({ error: expect.any(String) });
        expect(serviceSpy).not.toHaveBeenCalled();
        } finally {
        serviceSpy.mockRestore();
        consoleSpy.mockRestore();
        }
    });

    test("aumenta en uno el contador de equipos favoritos al añadir un equipo", async ({ db, expect }) => {
        const controller = createController(db);
        const beforeResponse = await controller.favoriteCounts();

        expect(beforeResponse.status).toBe(200);
        expect(await beforeResponse.json()).toStrictEqual({
        data: { numberGames: 0, numberPlayers: 0, numberTeams: 0 },
        });

        const addedResponse = await controller.addFavoriteTeam(SEED_TEAM_ID_A);
        expect(addedResponse.status).toBe(204);
        const afterResponse = await controller.favoriteCounts();

        expect(afterResponse.status).toBe(200);
        expect(await afterResponse.json()).toStrictEqual({
        data: { numberGames: 0, numberPlayers: 0, numberTeams: 1 },
        });
    });

    test("añadir un equipo favorito a otro usuario no aumenta el contador del usuario original", async ({ db, expect }) => {
        const controller = createController(db);
        const beforeResponse = await controller.favoriteCounts();

        expect(beforeResponse.status).toBe(200);
        const beforeResult = await beforeResponse.json();
        expect(beforeResult).toMatchObject({ data: { numberTeams: 0 } });

        authMock.mockResolvedValue({ userId: USER_B });
        const addedResponse = await controller.addFavoriteTeam(SEED_TEAM_ID_A);
        expect(addedResponse.status).toBe(204);
        const otherResponse = await controller.favoriteCounts();
        expect(otherResponse.status).toBe(200);
        expect(await otherResponse.json()).toMatchObject({ data: { numberTeams: 1 } });

        authMock.mockResolvedValue({ userId: USER_A });
        const afterResponse = await controller.favoriteCounts();
        expect(afterResponse.status).toBe(200);
        expect(await afterResponse.json()).toStrictEqual(beforeResult);
    });

    test("no duplica el favorito ni devuelve error cuando ya existe", async ({ db, expect }) => {
        const controller = createController(db);
        const firstResponse = await controller.addFavoriteTeam(SEED_TEAM_ID_A);
        const repeatedResponse = await controller.addFavoriteTeam(SEED_TEAM_ID_A);

        expect(firstResponse.status).toBe(204);
        expect(repeatedResponse.status).toBe(204);

        const stored = await db.query(
        "SELECT COUNT(*)::integer AS count FROM favorite_teams WHERE user_id = $1 AND team_id = $2",
        [USER_A, SEED_TEAM_ID_A],
        );
        expect(stored.rows).toStrictEqual([{ count: 1 }]);

        const countsResponse = await controller.favoriteCounts();
        expect(countsResponse.status).toBe(200);
        expect(await countsResponse.json()).toMatchObject({ data: { numberTeams: 1 } });
    });

    test("devuelve 500 cuando el equipo no existe y la clave foránea rechaza el favorito", async ({ db, expect }) => {
        const missing = await db.query("SELECT id FROM teams WHERE id = $1", [9999]);
        expect(missing.rows).toHaveLength(0);
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        try {
        const controller = createController(db);
        const response = await controller.addFavoriteTeam(9999);

        expect(response.status).toBe(500);
        expect(await response.json()).toStrictEqual({ error: expect.any(String) });
        } finally {
        consoleSpy.mockRestore();
        }
    });

    test("permite guardar el mismo equipo como favorito para dos usuarios distintos", async ({ db, expect }) => {
        const controller = createController(db);
        const firstResponse = await controller.addFavoriteTeam(SEED_TEAM_ID_A);
        expect(firstResponse.status).toBe(204);

        authMock.mockResolvedValue({ userId: USER_B });
        const otherResponse = await controller.addFavoriteTeam(SEED_TEAM_ID_A);
        expect(otherResponse.status).toBe(204);

        const stored = await db.query(
        "SELECT user_id, team_id FROM favorite_teams WHERE team_id = $1 AND user_id IN ($2, $3) ORDER BY user_id",
        [SEED_TEAM_ID_A, USER_A, USER_B],
        );
        expect(stored.rows).toStrictEqual([
        { user_id: USER_A, team_id: SEED_TEAM_ID_A },
        { user_id: USER_B, team_id: SEED_TEAM_ID_A },
        ]);
    });
});

describe("FavoritesController.removeFavoriteGame", () => {
  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.removeFavoriteGame(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID es menor de 1: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.removeFavoriteGame(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );
    test("devuelve 401 cuando no hay un usuario autenticado", async ({db, expect}) => {
        authMock.mockResolvedValue({userId: null});
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "removeFavoriteGame");

        try {
            const controller = createController(db);
            const response = await controller.removeFavoriteGame(SEED_GAME_ID_A);

            expect(response.status).toBe(401);
            expect(await response.json()).toStrictEqual({error: expect.any(String) });
            expect(serviceSpy).not.toHaveBeenCalled();
        } finally {
            serviceSpy.mockRestore();
        }
    });

    test("devuelve 500 cuando falla el servicio", async ({db, expect}) => {
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "removeFavoriteGame")
                                .mockRejectedValue(new Error("Fallo simulado"));
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            const controller = createController(db);
            const response = await controller.removeFavoriteGame(SEED_GAME_ID_A);

            expect(response.status).toBe(500);
            expect(await response.json()).toStrictEqual({error: expect.any(String)});
        } finally {
            serviceSpy.mockRestore();
            consoleSpy.mockRestore();
        }
    });

  test("devuelve 500 cuando falla auth al eliminar un partido favorito", async ({ db, expect }) => {
    authMock.mockRejectedValue(new Error("Fallo simulado de autenticación"));
    const serviceSpy = vi.spyOn(FavoritesService.prototype, "removeFavoriteGame");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.removeFavoriteGame(SEED_GAME_ID_A);

      expect(response.status).toBe(500);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(serviceSpy).not.toHaveBeenCalled();
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });


  test("eliminar un favorito no elimina el mismo partido guardado por otro usuario", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_games (user_id, game_id) VALUES ($1, $3), ($2, $3)", [USER_A, USER_B, SEED_GAME_ID_A]);
    const controller = createController(db);
    const response = await controller.removeFavoriteGame(SEED_GAME_ID_A);

    expect(response.status).toBe(204);
    const stored = await db.query(
      "SELECT user_id, game_id FROM favorite_games WHERE game_id = $1 AND user_id IN ($2, $3) ORDER BY user_id",
      [SEED_GAME_ID_A, USER_A, USER_B],
    );
    expect(stored.rows).toStrictEqual([{ user_id: USER_B, game_id: SEED_GAME_ID_A }]);
  });

  test("devuelve 204 sin modificar otros favoritos si el partido no está guardado como favorito", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_games (user_id, game_id) VALUES ($1, $2)", [USER_A, SEED_GAME_ID_A]);
    const game = await db.query("SELECT id FROM games WHERE id = $1", [SEED_GAME_ID_B]);
    expect(game.rows).toHaveLength(1);

    const controller = createController(db);
    const response = await controller.removeFavoriteGame(SEED_GAME_ID_B);

    expect(response.status).toBe(204);
    const stored = await db.query("SELECT game_id FROM favorite_games WHERE user_id = $1", [USER_A]);
    expect(stored.rows).toStrictEqual([{ game_id: SEED_GAME_ID_A }]);
  });

  test("devuelve 204 sin modificar favoritos cuando el partido no existe", async ({ db, expect }) => {
    const missing = await db.query("SELECT id FROM games WHERE id = $1", [9999]);
    expect(missing.rows).toHaveLength(0);
    await db.query("INSERT INTO favorite_games (user_id, game_id) VALUES ($1, $2)", [USER_A, SEED_GAME_ID_A]);
    
    const controller = createController(db);
    const response = await controller.removeFavoriteGame(9999);

    expect(response.status).toBe(204);
    const stored = await db.query("SELECT game_id FROM favorite_games WHERE user_id = $1", [USER_A]);
    expect(stored.rows).toStrictEqual([{ game_id: SEED_GAME_ID_A }]);
  });

  test("disminuye en uno el contador de partidos favoritos al eliminar uno", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_games (user_id, game_id) VALUES ($1, $2), ($1, $3)", [USER_A, SEED_GAME_ID_A, SEED_GAME_ID_B]);
    const controller = createController(db);
    const beforeResponse = await controller.favoriteCounts();

    expect(beforeResponse.status).toBe(200);
    expect(await beforeResponse.json()).toStrictEqual({
      data: { numberGames: 2, numberPlayers: 0, numberTeams: 0 },
    });
    const removedResponse = await controller.removeFavoriteGame(SEED_GAME_ID_A);
    expect(removedResponse.status).toBe(204);
    const afterResponse = await controller.favoriteCounts();

    expect(afterResponse.status).toBe(200);
    expect(await afterResponse.json()).toStrictEqual({
      data: { numberGames: 1, numberPlayers: 0, numberTeams: 0 },
    });
  });
});

describe("FavoritesController.removeFavoritePlayer", () => {
  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.removeFavoritePlayer(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID es menor de 1: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.removeFavoritePlayer(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );
    test("devuelve 401 cuando no hay un usuario autenticado", async ({db, expect}) => {
        authMock.mockResolvedValue({userId: null});
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "removeFavoritePlayer");

        try {
            const controller = createController(db);
            const response = await controller.removeFavoritePlayer(SEED_PLAYER_ID_A);

            expect(response.status).toBe(401);
            expect(await response.json()).toStrictEqual({error: expect.any(String) });
            expect(serviceSpy).not.toHaveBeenCalled();
        } finally {
            serviceSpy.mockRestore();
        }
    });

    test("devuelve 500 cuando falla el servicio", async ({db, expect}) => {
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "removeFavoritePlayer")
                                .mockRejectedValue(new Error("Fallo simulado"));
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            const controller = createController(db);
            const response = await controller.removeFavoritePlayer(SEED_PLAYER_ID_A);

            expect(response.status).toBe(500);
            expect(await response.json()).toStrictEqual({error: expect.any(String)});
        } finally {
            serviceSpy.mockRestore();
            consoleSpy.mockRestore();
        }
    });

  test("devuelve 500 cuando falla auth al eliminar un jugador favorito", async ({ db, expect }) => {
    authMock.mockRejectedValue(new Error("Fallo simulado de autenticación"));
    const serviceSpy = vi.spyOn(FavoritesService.prototype, "removeFavoritePlayer");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.removeFavoritePlayer(SEED_PLAYER_ID_A);

      expect(response.status).toBe(500);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(serviceSpy).not.toHaveBeenCalled();
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });


  test("eliminar un favorito no elimina el mismo jugador guardado por otro usuario", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, $3), ($2, $3)", [USER_A, USER_B, SEED_PLAYER_ID_A]);
    const controller = createController(db);
    const response = await controller.removeFavoritePlayer(SEED_PLAYER_ID_A);

    expect(response.status).toBe(204);
    const stored = await db.query(
      "SELECT user_id, player_id FROM favorite_players WHERE player_id = $1 AND user_id IN ($2, $3) ORDER BY user_id",
      [SEED_PLAYER_ID_A, USER_A, USER_B],
    );
    expect(stored.rows).toStrictEqual([{ user_id: USER_B, player_id: SEED_PLAYER_ID_A }]);
  });

  test("devuelve 204 sin modificar otros favoritos si el jugador no está guardado como favorito", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, $2)", [USER_A, SEED_PLAYER_ID_A]);
    const game = await db.query("SELECT id FROM players WHERE id = $1", [SEED_PLAYER_ID_B]);
    expect(game.rows).toHaveLength(1);

    const controller = createController(db);
    const response = await controller.removeFavoritePlayer(SEED_PLAYER_ID_B);

    expect(response.status).toBe(204);
    const stored = await db.query("SELECT player_id FROM favorite_players WHERE user_id = $1", [USER_A]);
    expect(stored.rows).toStrictEqual([{ player_id: SEED_PLAYER_ID_A }]);
  });

  test("devuelve 204 sin modificar favoritos cuando el jugador no existe", async ({ db, expect }) => {
    const missing = await db.query("SELECT id FROM players WHERE id = $1", [9999]);
    expect(missing.rows).toHaveLength(0);
    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, $2)", [USER_A, SEED_PLAYER_ID_A]);
    
    const controller = createController(db);
    const response = await controller.removeFavoritePlayer(9999);

    expect(response.status).toBe(204);
    const stored = await db.query("SELECT player_id FROM favorite_players WHERE user_id = $1", [USER_A]);
    expect(stored.rows).toStrictEqual([{ player_id: SEED_PLAYER_ID_A }]);
  });

  test("disminuye en uno el contador de jugadores favoritos al eliminar uno", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, $2), ($1, $3)", [USER_A, SEED_PLAYER_ID_A, SEED_PLAYER_ID_B]);
    const controller = createController(db);
    const beforeResponse = await controller.favoriteCounts();

    expect(beforeResponse.status).toBe(200);
    expect(await beforeResponse.json()).toStrictEqual({
      data: { numberGames: 0, numberPlayers: 2, numberTeams: 0 },
    });
    const removedResponse = await controller.removeFavoritePlayer(SEED_PLAYER_ID_A);
    expect(removedResponse.status).toBe(204);
    const afterResponse = await controller.favoriteCounts();

    expect(afterResponse.status).toBe(200);
    expect(await afterResponse.json()).toStrictEqual({
      data: { numberGames: 0, numberPlayers: 1, numberTeams: 0 },
    });
  });
});

describe("FavoritesController.removeFavoriteTeam", () => {
  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.removeFavoriteTeam(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID es menor de 1: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.removeFavoriteTeam(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );
    test("devuelve 401 cuando no hay un usuario autenticado", async ({db, expect}) => {
        authMock.mockResolvedValue({userId: null});
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "removeFavoriteTeam");

        try {
            const controller = createController(db);
            const response = await controller.removeFavoriteTeam(SEED_TEAM_ID_A);

            expect(response.status).toBe(401);
            expect(await response.json()).toStrictEqual({error: expect.any(String) });
            expect(serviceSpy).not.toHaveBeenCalled();
        } finally {
            serviceSpy.mockRestore();
        }
    });

    test("devuelve 500 cuando falla el servicio", async ({db, expect}) => {
        const serviceSpy = vi.spyOn(FavoritesService.prototype, "removeFavoriteTeam")
                                .mockRejectedValue(new Error("Fallo simulado"));
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            const controller = createController(db);
            const response = await controller.removeFavoriteTeam(SEED_TEAM_ID_A);

            expect(response.status).toBe(500);
            expect(await response.json()).toStrictEqual({error: expect.any(String)});
        } finally {
            serviceSpy.mockRestore();
            consoleSpy.mockRestore();
        }
    });

  test("devuelve 500 cuando falla auth al eliminar un equipo favorito", async ({ db, expect }) => {
    authMock.mockRejectedValue(new Error("Fallo simulado de autenticación"));
    const serviceSpy = vi.spyOn(FavoritesService.prototype, "removeFavoriteTeam");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.removeFavoriteTeam(SEED_TEAM_ID_A);

      expect(response.status).toBe(500);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(serviceSpy).not.toHaveBeenCalled();
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });


  test("eliminar un favorito no elimina el mismo equipo guardado por otro usuario", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $3), ($2, $3)", [USER_A, USER_B, SEED_TEAM_ID_A]);
    const controller = createController(db);
    const response = await controller.removeFavoriteTeam(SEED_TEAM_ID_A);

    expect(response.status).toBe(204);
    const stored = await db.query(
      "SELECT user_id, team_id FROM favorite_teams WHERE team_id = $1 AND user_id IN ($2, $3) ORDER BY user_id",
      [SEED_TEAM_ID_A, USER_A, USER_B],
    );
    expect(stored.rows).toStrictEqual([{ user_id: USER_B, team_id: SEED_TEAM_ID_A }]);
  });

  test("devuelve 204 sin modificar otros favoritos si el equipo no está guardado como favorito", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $2)", [USER_A, SEED_TEAM_ID_A]);
    const game = await db.query("SELECT id FROM teams WHERE id = $1", [SEED_TEAM_ID_B]);
    expect(game.rows).toHaveLength(1);

    const controller = createController(db);
    const response = await controller.removeFavoriteTeam(SEED_TEAM_ID_B);

    expect(response.status).toBe(204);
    const stored = await db.query("SELECT team_id FROM favorite_teams WHERE user_id = $1", [USER_A]);
    expect(stored.rows).toStrictEqual([{ team_id: SEED_TEAM_ID_A }]);
  });

  test("devuelve 204 sin modificar favoritos cuando el equipo no existe", async ({ db, expect }) => {
    const missing = await db.query("SELECT id FROM teams WHERE id = $1", [9999]);
    expect(missing.rows).toHaveLength(0);
    await db.query("INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $2)", [USER_A, SEED_TEAM_ID_A]);
    
    const controller = createController(db);
    const response = await controller.removeFavoriteTeam(9999);

    expect(response.status).toBe(204);
    const stored = await db.query("SELECT team_id FROM favorite_teams WHERE user_id = $1", [USER_A]);
    expect(stored.rows).toStrictEqual([{ team_id: SEED_TEAM_ID_A }]);
  });

  test("disminuye en uno el contador de equipos favoritos al eliminar uno", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $2), ($1, $3)", [USER_A, SEED_TEAM_ID_A, SEED_TEAM_ID_B]);
    const controller = createController(db);
    const beforeResponse = await controller.favoriteCounts();

    expect(beforeResponse.status).toBe(200);
    expect(await beforeResponse.json()).toStrictEqual({
      data: { numberGames: 0, numberPlayers: 0, numberTeams: 2 },
    });
    const removedResponse = await controller.removeFavoriteTeam(SEED_TEAM_ID_A);
    expect(removedResponse.status).toBe(204);
    const afterResponse = await controller.favoriteCounts();

    expect(afterResponse.status).toBe(200);
    expect(await afterResponse.json()).toStrictEqual({
      data: { numberGames: 0, numberPlayers: 0, numberTeams: 1 },
    });
  });
});

