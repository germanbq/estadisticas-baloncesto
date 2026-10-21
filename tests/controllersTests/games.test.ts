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
        finished: false,
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
        finished: false,
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