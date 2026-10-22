// @vitest-environment node

import { beforeEach, describe, vi } from "vitest";
import { auth } from "@clerk/nextjs/server";
import type { Client } from "pg";

import { test } from "../fixtures/dbTest";

import GamesController from "../../src/backend/controllers/GamesController";
import GamesService from "../../src/backend/services/GamesService";
import GamesRepository from "../../src/backend/repositories/GamesRepository";
import GamesQueries from "../../src/backend/queries/GamesQueries";
import { PostgresQueryExecutor } from "../../src/backend/shared/PostgresQueryExecutor";

import type { Game, GamesNum } from "../../src/backend/entities/gamesEntities";

vi.mock("@clerk/nextjs/server", () => ({
    auth: vi.fn(),
}));

const authMock = vi.mocked(auth, { partial: true });

type GameJson = Omit<Game, "date"> & {
    date: string;
};

type DayGamesBody = {
    data: GameJson[];
};

const SEED_DATE_A = "2026-10-17"; //fecha con un partido
const SEED_DATE_B = "2026-10-18"; //fecha con dos partidos en horas límite
const SEED_GAME_ID_A = 1;         //partido de SEED_DATE_A
const SEED_GAME_ID_B = 2;          //partido de SEED_DATE_B
const SEED_GAME_ID_C = 3;          //partido de SEED_DATE_B
const SEED_TEAM_ID_A = 1;         //equipo con partidos
const SEED_TEAM_ID_B = 3;         //equipo sin partidos
const USER_A = "usuario_prueba_A";
const USER_B = "usuario_prueba_B";

function createController(db: Client): GamesController {
    const executor = new PostgresQueryExecutor(db);
    const queries = new GamesQueries();
    const repository = new GamesRepository(queries, executor);
    const service = new GamesService(repository);
    return new GamesController(service);
}

beforeEach(() => {
    authMock.mockReset();

    authMock.mockResolvedValue({
        userId: USER_A,
    });
});

describe("GamesController.dayGames", () => {
  test("devuelve 400 cuando la fecha es null", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.dayGames(null);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
        error: expect.any(String),
    });
    expect(authMock).not.toHaveBeenCalled();
  });

  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(GamesService.prototype, "dayGames")
      .mockRejectedValue(new Error("Fallo simulado"));

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.dayGames(SEED_DATE_A);

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({
        error: expect.any(String),
      });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve los partidos ordenados de la fecha solicitada usando horas límite", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.dayGames(SEED_DATE_B);

    expect(response.status).toBe(200);

    const body: DayGamesBody = await response.json();

    expect(body.data.map((game) => game.id)).toStrictEqual([
        SEED_GAME_ID_B, SEED_GAME_ID_C,
    ]);
    expect(body.data[0]).toMatchObject({
        homeTeamName: "Boston Celtics",
        awayTeamName: "Denver Nuggets",
        stadium: "TD Garden",
        finished: true,
        date: "2026-10-18T08:00:00.000Z",
        isFavorite: false,
    });
    expect(body.data[1]).toMatchObject({
        homeTeamName: "Boston Celtics",
        awayTeamName: "Denver Nuggets",
        stadium: "TD Garden",
        finished: false,
        date: "2026-10-19T07:59:59.999Z",
        isFavorite: false,
    });
  });

  test("devuelve una lista vacía cuando no hay partidos", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.dayGames("2026-12-01");

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
        data: [],
    });
  });


  test("marca como favorito el partido guardado por el usuario", async ({ db, expect }) => {
    await db.query(
      `
        INSERT INTO favorite_games (user_id, game_id)
        VALUES ($1, $2)
      `,
      [USER_A, SEED_GAME_ID_A],
    );

    const controller = createController(db);
    const response = await controller.dayGames(SEED_DATE_A);

    expect(response.status).toBe(200);

    const body: DayGamesBody = await response.json();

    expect(
      body.data.map((game) => ({
            id: game.id,
            isFavorite: game.isFavorite,
        })),
    ).toStrictEqual([
        {
            id: SEED_GAME_ID_A,
            isFavorite: true,
        },
    ]);
  });

  test("no muestra como propio el favorito de otro usuario", async ({ db, expect }) => {
    await db.query(
      `
        INSERT INTO favorite_games (user_id, game_id)
        VALUES ($1, $2)
      `,
      [USER_A, SEED_GAME_ID_A],
    );

    authMock.mockResolvedValue({
        userId: USER_B,
    });

    const controller = createController(db);
    const response = await controller.dayGames(SEED_DATE_A);

    expect(response.status).toBe(200);

    const body: DayGamesBody = await response.json();

    expect(
        body.data.map((game) => ({
            id: game.id,
            isFavorite: game.isFavorite,
        })),
    ).toStrictEqual([
        {
            id: SEED_GAME_ID_A,
            isFavorite: false,
        },
    ]);
  });

  test("permite consultar partidos sin sesión y no marca favoritos", async ({ db, expect }) => {
    await db.query(
      `
        INSERT INTO favorite_games (user_id, game_id)
        VALUES ($1, $2)
      `,
      [USER_A, SEED_GAME_ID_A],
    );

    authMock.mockResolvedValue({
      userId: null,
    });

    const controller = createController(db);
    const response = await controller.dayGames(SEED_DATE_A);

    expect(response.status).toBe(200);

    const body: DayGamesBody = await response.json();

    expect(
      body.data.map((game) => ({
            id: game.id,
            isFavorite: game.isFavorite,
        })),
    ).toStrictEqual([
        {
            id: SEED_GAME_ID_A,
            isFavorite: false,
        },
    ]);
  });

});

describe("GamesController.gamesNumber", () => {
  test("devuelve 400 cuando la fecha es null", async ({db, expect}) => {
    const controller = createController(db);
    const response = await controller.gamesNumber(null);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: expect.any(String),
    })
    expect(authMock).not.toHaveBeenCalled();
  });
  
  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(GamesService.prototype, "gamesNumber")
      .mockRejectedValue(new Error("Fallo simulado"));

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.gamesNumber(SEED_DATE_A);

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({
        error: expect.any(String),
      });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve cinco jornadas ordenadas con su número de partidos, incluyendo las jornadas vacías", async ({db, expect}) => {
    const controller = createController(db);
    const response = await controller.gamesNumber(SEED_DATE_B);

    expect(response.status).toBe(200);

    const result: {data: GamesNum[]} = await response.json(); 

    expect(result.data).toStrictEqual([
      { date: "2026-10-16", gamesNumber: 0 },
      { date: "2026-10-17", gamesNumber: 1 },
      { date: "2026-10-18", gamesNumber: 2 },
      { date: "2026-10-19", gamesNumber: 1 },
      { date: "2026-10-20", gamesNumber: 0 },
    ]);
  })
});

describe("GamesController.gameById", () => {
  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.gameById(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({
        error: expect.any(String),
      });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID es menor de 1", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.gameById(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({
        error: expect.any(String),
      });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

   test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(GamesService.prototype, "gameById")
      .mockRejectedValue(new Error("Fallo simulado"));

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.gameById(SEED_GAME_ID_A);

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({
        error: expect.any(String),
      });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve 404 cuando recibe un ID inválido", async ({db, expect}) => {
    const controller = createController(db);
    const response = await controller.gameById(9999);

    expect(response.status).toBe(404);
    expect(await response.json()).toStrictEqual({
      error: expect.any(String),
    });
  });

  test("devuelve los datos de un partido cuando recibe un ID válido", async ({db, expect}) => {
    const controller = createController(db);
    const response = await controller.gameById(SEED_GAME_ID_A);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: {
        id: SEED_GAME_ID_A,
        homeTeamName: "Boston Celtics",
        awayTeamName: "Denver Nuggets",
        finished: true,
        stadium: "TD Garden",
        date: "2026-10-18T07:59:59.999Z",
        homeTeamId: 1,
        awayTeamId: 2,
        homeShortName: "BOS",
        awayShortName: "DEN",
      },
    });
  });
})

describe("GamesController.lastTeamGames", () => {
  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.lastTeamGames(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({
        error: expect.any(String),
      });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID es menor de 1", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.lastTeamGames(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({
        error: expect.any(String),
      });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(GamesService.prototype, "lastTeamGames")
      .mockRejectedValue(new Error("Fallo simulado"));

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.lastTeamGames(SEED_TEAM_ID_A);

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({
        error: expect.any(String),
      });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve una lista vacía si el equipo no tiene partidos finalizados", async ({db, expect}) => {
    const controller = createController(db);
    const response = await controller.lastTeamGames(SEED_TEAM_ID_B);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      data: [],
    });
  });

  test("devuelve los últimos cinco partidos finalizados del equipo ordenados del más reciente al más antiguo", async ({db, expect}) => {
    const controller = createController(db);
    const response = await controller.lastTeamGames(SEED_TEAM_ID_A);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      data: [
        {
          id: SEED_GAME_ID_B,
          rivalName: "Denver Nuggets",
          home: true,
          stadium: "TD Garden",
          score: 112,
          rivalScore: 100,
        },
        {
          id: SEED_GAME_ID_A,
          rivalName: "Denver Nuggets",
          home: true,
          stadium: "TD Garden",
          score: 104,
          rivalScore: 107,
        },
        {
          id: 7,
          rivalName: "Denver Nuggets",
          home: true,
          stadium: "TD Garden",
          score: 116,
          rivalScore: 110,
        },
        {
          id: 5,
          rivalName: "Denver Nuggets",
          home: true,
          stadium: "TD Garden",
          score: 108,
          rivalScore: 102,
        },
        {
          id: 8,
          rivalName: "Denver Nuggets",
          home: true,
          stadium: "TD Garden",
          score: 101,
          rivalScore: 109,
        },
      ],
    });
  });

  test("devuelve los partidos desde la perspectiva del equipo visitante", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.lastTeamGames(2);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      data: [
        { id: SEED_GAME_ID_B, rivalName: "Boston Celtics", home: false, stadium: "TD Garden", score: 100, rivalScore: 112 },
        { id: SEED_GAME_ID_A, rivalName: "Boston Celtics", home: false, stadium: "TD Garden", score: 107, rivalScore: 104 },
        { id: 7, rivalName: "Boston Celtics", home: false, stadium: "TD Garden", score: 110, rivalScore: 116 },
        { id: 5, rivalName: "Boston Celtics", home: false, stadium: "TD Garden", score: 102, rivalScore: 108 },
        { id: 8, rivalName: "Boston Celtics", home: false, stadium: "TD Garden", score: 109, rivalScore: 101 },
      ],
    });
  });
  
  test("excluye los partidos finalizados de temporadas anteriores aunque haya menos de cinco de la actual", async ({ db, expect }) => {
    const previousSeason = await db.query(
      "SELECT id FROM games WHERE home_team_id = $1 AND away_team_id = $2 AND season_init_year = $3 AND finished = TRUE",
      [SEED_TEAM_ID_A, 2, 2025],
    );
    expect(previousSeason.rows).toHaveLength(1);

    await db.query(
      "UPDATE games SET finished = FALSE WHERE id = ANY($1::integer[])",
      [[5, 6]],
    );

    const controller = createController(db);
    const response = await controller.lastTeamGames(SEED_TEAM_ID_A);

    expect(response.status).toBe(200);
    const result: { data: { id: number }[] } = await response.json();
    expect(result.data.map((game) => game.id)).toStrictEqual([
      SEED_GAME_ID_B, SEED_GAME_ID_A, 7, 8,
    ]);
    expect(result.data.map((game) => game.id)).not.toContain(previousSeason.rows[0].id);
  });
})

describe("GamesController.headToHeadGames", () => {
  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID local no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.headToHeadGames(id, 2);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID visitante no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.headToHeadGames(SEED_TEAM_ID_A, id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID local es menor de 1: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.headToHeadGames(id, 2);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID visitante es menor de 1: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.headToHeadGames(SEED_TEAM_ID_A, id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(GamesService.prototype, "headToHeadGames")
      .mockRejectedValue(new Error("Fallo simulado"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.headToHeadGames(SEED_TEAM_ID_A, SEED_TEAM_ID_B);

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve una lista vacía cuando los equipos no tienen enfrentamientos finalizados", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.headToHeadGames(SEED_TEAM_ID_A, SEED_TEAM_ID_B);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ data: [] });
  });

  test("devuelve los enfrentamientos finalizados ordenados del más reciente al más antiguo", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.headToHeadGames(SEED_TEAM_ID_A, 2);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      data: [
        { id: SEED_GAME_ID_B, date: "2026-10-18T08:00:00.000Z", homeScore: 112, awayScore: 100, stadium: "TD Garden", homeName: "Boston Celtics", awayName: "Denver Nuggets" },
        { id: SEED_GAME_ID_A, date: "2026-10-18T07:59:59.999Z", homeScore: 104, awayScore: 107, stadium: "TD Garden", homeName: "Boston Celtics", awayName: "Denver Nuggets" },
        { id: 7, date: "2026-10-15T20:00:00.000Z", homeScore: 116, awayScore: 110, stadium: "TD Garden", homeName: "Boston Celtics", awayName: "Denver Nuggets" },
        { id: 5, date: "2026-10-14T20:00:00.000Z", homeScore: 108, awayScore: 102, stadium: "TD Garden", homeName: "Boston Celtics", awayName: "Denver Nuggets" },
        { id: 8, date: "2026-10-13T20:00:00.000Z", homeScore: 101, awayScore: 109, stadium: "TD Garden", homeName: "Boston Celtics", awayName: "Denver Nuggets" },
        { id: 6, date: "2026-10-11T20:00:00.000Z", homeScore: 99, awayScore: 105, stadium: "TD Garden", homeName: "Boston Celtics", awayName: "Denver Nuggets" },
      ],
    });
  });

  test("devuelve los mismos enfrentamientos al invertir los IDs de los equipos", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.headToHeadGames(SEED_TEAM_ID_A, 2);
    const reversedResponse = await controller.headToHeadGames(2, SEED_TEAM_ID_A);

    expect(response.status).toBe(200);
    expect(reversedResponse.status).toBe(200);

    const result = await response.json();
    expect(result.data).toHaveLength(6);
    expect(await reversedResponse.json()).toStrictEqual(result);
  });

  test("excluye los enfrentamientos finalizados de otras temporadas", async ({ db, expect }) => {
    const previousSeason = await db.query(
      "SELECT id FROM games WHERE home_team_id = $1 AND away_team_id = $2 AND season_init_year = $3 AND finished = TRUE",
      [SEED_TEAM_ID_A, 2, 2025],
    );
    expect(previousSeason.rows).toHaveLength(1);

    const controller = createController(db);
    const response = await controller.headToHeadGames(SEED_TEAM_ID_A, 2);

    expect(response.status).toBe(200);
    const result: { data: { id: number }[] } = await response.json();
    expect(result.data.map((game) => game.id)).toStrictEqual([
      SEED_GAME_ID_B, SEED_GAME_ID_A, 7, 5, 8, 6,
    ]);
    expect(result.data.map((game) => game.id)).not.toContain(previousSeason.rows[0].id);
  });
});

describe("GamesController.statsLeaders", () => {
  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.statsLeaders(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID es menor de 1: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.statsLeaders(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(GamesService.prototype, "statsLeaders")
      .mockRejectedValue(new Error("Fallo simulado"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.statsLeaders(SEED_TEAM_ID_A);

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve una lista vacía cuando el equipo no tiene partidos finalizados ni estadísticas de jugadores", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.statsLeaders(SEED_TEAM_ID_B);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ data: [] });
  });

  test("devuelve los líderes por promedio usando solo partidos de esta temporada desempatando por el menor ID de jugador", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.statsLeaders(2);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      data: [
        { metric: "Puntos", name: "Jamal Murray", jerseyNumber: 27, value: 28.5 },
        { metric: "Rebotes", name: "Nikola Jokic", jerseyNumber: 15, value: 10.5 },
        { metric: "Asistencias", name: "Nikola Jokic", jerseyNumber: 15, value: 8.5 },
        { metric: "Robos", name: "Nikola Jokic", jerseyNumber: 15, value: 1.5 },
        { metric: "Tapones", name: "Nikola Jokic", jerseyNumber: 15, value: 1.5 },
      ],
    });
  });

  test("excluye a los jugadores con cero partidos disputados sin provocar división por cero", async ({ db, expect }) => {
    const updated = await db.query(
      "UPDATE player_season_stats SET games_played = 0 WHERE player_id = $1 AND season_init_year = $2 RETURNING player_id",
      [2, 2026],
    );
    expect(updated.rows).toHaveLength(1);

    const controller = createController(db);
    const response = await controller.statsLeaders(2);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      data: [
        { metric: "Puntos", name: "Jamal Murray", jerseyNumber: 27, value: 28.5 },
        { metric: "Rebotes", name: "Jamal Murray", jerseyNumber: 27, value: 4.5 },
        { metric: "Asistencias", name: "Jamal Murray", jerseyNumber: 27, value: 6.5 },
        { metric: "Robos", name: "Jamal Murray", jerseyNumber: 27, value: 1.5 },
        { metric: "Tapones", name: "Jamal Murray", jerseyNumber: 27, value: 0.5 },
      ],
    });
  });
});

describe("GamesController.gameTeamStats", () => {
  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID del equipo no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.gameTeamStats(id, SEED_GAME_ID_A);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID del partido no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.gameTeamStats(SEED_TEAM_ID_A, id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID del equipo es menor de 1: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.gameTeamStats(id, SEED_GAME_ID_A);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID del partido es menor de 1: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.gameTeamStats(SEED_TEAM_ID_A, id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );
  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(GamesService.prototype, "gameTeamStats")
      .mockRejectedValue(new Error("Fallo simulado"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.gameTeamStats(SEED_TEAM_ID_A, SEED_GAME_ID_A);

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve 404 para un partido pendiente sin estadísticas de equipo", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.gameTeamStats(SEED_TEAM_ID_A, SEED_GAME_ID_C);

    expect(response.status).toBe(404);
    expect(await response.json()).toStrictEqual({
      error: expect.any(String),
    });
  });

  test("devuelve las estadísticas del equipo en un partido finalizado", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.gameTeamStats(SEED_TEAM_ID_A, SEED_GAME_ID_A);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      data: {
        fgMade: 38,
        fgAttempted: 80,
        threeMade: 12,
        threeAttempted: 32,
        ftMade: 16,
        ftAttempted: 20,
        paintPoints: 40,
        fastbreakPoints: 12,
        benchPoints: 28,
        secondChancePoints: 10,
        effectiveFieldGoal: 55,
        trueShooting: 58.56,
        offensiveRating: 104,
        defensiveRating: 107,
        rebounds: 42,
        assists: 25,
        steals: 7,
        tapones: 5,
        turnovers: 12,
        personalFouls: 18,
      },
    });
  });
});

describe("GamesController.gameMVP", () => {
  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.gameMVP(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID es menor de 1: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.gameMVP(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(GamesService.prototype, "gameMVP")
      .mockRejectedValue(new Error("Fallo simulado"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.gameMVP(SEED_GAME_ID_A);

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve 404 cuando el partido no está finalizado", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.gameMVP(SEED_GAME_ID_C);

    expect(response.status).toBe(404);
    expect(await response.json()).toStrictEqual({ error: expect.any(String) });
  });

  test("devuelve el jugador con mayor valoración como MVP del partido", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.gameMVP(SEED_GAME_ID_A);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      data: {
        teamId: 2,
        playerId: 2,
        playerName: "Nikola Jokic",
        teamShortName: "DEN",
        jerseyNumber: 15,
        position: "C",
        points: 28,
        rebounds: 12,
        assists: 10,
        steals: 1,
        blocks: 2,
        secondsPlayed: 2280,
        plusMinus: 3,
        fgMade: 11,
        fgAttempted: 18,
        threeMade: 2,
        threeAttempted: 4,
        ftMade: 4,
        ftAttempted: 5,
      },
    });
  });

  test("excluye al jugador con mayor valoración si tiene cero segundos jugados", async ({ db, expect }) => {
    const updated = await db.query(
      "UPDATE player_game_stats SET seconds_played = 0 WHERE player_id = $1 AND game_id = $2 RETURNING player_id",
      [2, SEED_GAME_ID_A],
    );
    expect(updated.rows).toHaveLength(1);

    const controller = createController(db);
    const response = await controller.gameMVP(SEED_GAME_ID_A);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: {
        teamId: 2,
        playerId: 3,
        playerName: "Jamal Murray",
        teamShortName: "DEN",
        points: 32,
        secondsPlayed: 2160,
      },
    });
  });

  test("desempata por el menor ID cuando los jugadores tienen las mismas estadísticas y puntos", async ({ db, expect }) => {
    const updated = await db.query(
      `UPDATE player_game_stats
       SET seconds_played = 2160,
           points = 30,
           rebounds = 8,
           ofe_rebounds = 2,
           def_rebounds = 6,
           assists = 5,
           steals = 2,
           blocks = 1,
           turnovers = 3,
           plusminus = 0,
           fg_made = 10,
           fg_attempted = 20,
           three_made = 4,
           three_attempted = 9,
           ft_made = 6,
           ft_attempted = 7
       WHERE game_id = $1
       RETURNING player_id`,
      [SEED_GAME_ID_A],
    );
    expect(updated.rows.map((row) => row.player_id).sort((a, b) => a - b)).toStrictEqual([1, 2, 3]);

    const controller = createController(db);
    const response = await controller.gameMVP(SEED_GAME_ID_A);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: {
        playerId: 1,
        playerName: "Jayson Tatum",
        teamId: SEED_TEAM_ID_A,
        points: 30,
      },
    });
  });
});

describe("GamesController.playersStats", () => {
  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID del partido no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.playersStats(id, SEED_TEAM_ID_A);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID del equipo no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.playersStats(SEED_GAME_ID_A, id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID del partido es menor de 1: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.playersStats(id, SEED_TEAM_ID_A);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID del equipo es menor de 1: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.playersStats(SEED_GAME_ID_A, id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );
  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(GamesService.prototype, "playersStats")
      .mockRejectedValue(new Error("Fallo simulado"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.playersStats(SEED_GAME_ID_A, SEED_TEAM_ID_A);

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve 404 cuando el equipo no tiene estadísticas de jugadores en el partido", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.playersStats(SEED_GAME_ID_C, SEED_TEAM_ID_A);

    expect(response.status).toBe(404);
    expect(await response.json()).toStrictEqual({ error: expect.any(String) });
  });

  test("devuelve las estadísticas de los jugadores ordenados por nombre descendente y no por ID", async ({ db, expect }) => {
    const addedPlayer = await db.query(
      `INSERT INTO players (name, height, weight, age, draft, team_id, country, jersey_number, position, image)
       VALUES ('Aaron Test', 2.00, 100, 25, 2020, 2, 'USA', 99, 'SF', '/players/test.webp')
       RETURNING id`,
    );
    const addedPlayerId: number = addedPlayer.rows[0].id;
    await db.query(
      `INSERT INTO player_game_stats (player_id, game_id, team_id, seconds_played, points, rebounds, ofe_rebounds, def_rebounds, assists, steals, blocks, turnovers, plusminus, fg_made, fg_attempted, three_made, three_attempted, ft_made, ft_attempted)
       SELECT $1, game_id, team_id, seconds_played, points, rebounds, ofe_rebounds, def_rebounds, assists, steals, blocks, turnovers, plusminus, fg_made, fg_attempted, three_made, three_attempted, ft_made, ft_attempted
       FROM player_game_stats WHERE player_id = 2 AND game_id = $2`,
      [addedPlayerId, SEED_GAME_ID_A],
    );

    const controller = createController(db);
    const response = await controller.playersStats(SEED_GAME_ID_A, 2);

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data).toStrictEqual([
      {
        name: "Nikola Jokic", playerId: 2, secondsPlayed: 2280,
        points: 28, rebounds: 12, ofeRebounds: 3, defRebounds: 9,
        assists: 10, steals: 1, blocks: 2, turnovers: 4, plusMinus: 3,
        fgPercentage: expect.closeTo(61.111111, 5), threePercentage: 50,
      },
      {
        name: "Jamal Murray", playerId: 3, secondsPlayed: 2160,
        points: 32, rebounds: 4, ofeRebounds: 1, defRebounds: 3,
        assists: 6, steals: 2, blocks: 0, turnovers: 2, plusMinus: 3,
        fgPercentage: expect.closeTo(54.545455, 5), threePercentage: 50,
      },
      {
        name: "Aaron Test", playerId: addedPlayerId, secondsPlayed: 2280,
        points: 28, rebounds: 12, ofeRebounds: 3, defRebounds: 9,
        assists: 10, steals: 1, blocks: 2, turnovers: 4, plusMinus: 3,
        fgPercentage: expect.closeTo(61.111111, 5), threePercentage: 50,
      },
    ]);
  });
});
