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
const SEED_GAME_ID_B= 2;          //partido de SEED_DATE_B
const SEED_GAME_ID_C= 3;          //partido de SEED_DATE_B
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
