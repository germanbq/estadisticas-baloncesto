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

import type { Game } from "../../src/backend/entities/gamesEntities";

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

const SEED_DATE_A = "2026-10-17";
const SEED_DATE_B = "2026-10-18";
const SEED_GAME_ID_A = 1;
const SEED_GAME_ID_B= 2;
const SEED_GAME_ID_C= 3;
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
  test("devuelve los partidos ordenados de la fecha solicitada usando horas límite", async ({
    db,
    expect,
  }) => {
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

  test("devuelve una lista vacía cuando no hay partidos", async ({
    db,
    expect,
  }) => {
    const controller = createController(db);
    const response = await controller.dayGames("2026-12-01");

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
        data: [],
    });
  });

  test("devuelve 400 cuando la fecha es null", async ({
    db,
    expect,
  }) => {
    const controller = createController(db);
    const response = await controller.dayGames(null);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
        error: expect.any(String),
    });
    expect(authMock).not.toHaveBeenCalled();
  });

  test("marca como favorito el partido guardado por el usuario", async ({
    db,
    expect,
  }) => {
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

  test("no muestra como propio el favorito de otro usuario", async ({
    db,
    expect,
  }) => {
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

  test("permite consultar partidos sin sesión y no marca favoritos", async ({
    db,
    expect,
  }) => {
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