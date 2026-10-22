// @vitest-environment node

import { beforeEach, describe, vi } from "vitest";
import { auth } from "@clerk/nextjs/server";
import type { Client } from "pg";

import { test } from "../fixtures/dbTest";

import { TeamsController } from "../../src/backend/controllers/TeamsController";
import { TeamsService } from "../../src/backend/services/TeamsService";
import { TeamsRepository } from "../../src/backend/repositories/TeamsRepository";
import { TeamsQueries } from "../../src/backend/queries/TeamsQueries";
import { PostgresQueryExecutor } from "../../src/backend/shared/PostgresQueryExecutor";
import type { Team } from "../../src/backend/entities/teamsEntities";

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

function createController(db: Client): TeamsController {
    const executor = new PostgresQueryExecutor(db);
    const queries = new TeamsQueries();
    const repository = new TeamsRepository(queries, executor);
    const service = new TeamsService(repository);
    return new TeamsController(service);
}

beforeEach(() => {
    authMock.mockReset();

    authMock.mockResolvedValue({
        userId: USER_A,
    });
});

describe("TeamsController.leaderBoard", () => {
  test("devuelve 400 cuando la conferencia es null", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.leaderBoard(null);

    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual({ error: expect.any(String) });
    expect(authMock).not.toHaveBeenCalled();
  });

  test("devuelve 400 cuando la conferencia no es East ni West", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.leaderBoard("conference");

    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual({ error: expect.any(String) });
    expect(authMock).not.toHaveBeenCalled();
  });

  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(TeamsService.prototype, "leaderBoard")
      .mockRejectedValue(new Error("Fallo simulado"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.leaderBoard("East");

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("ordena la clasificación del Este por porcentaje de victorias tras dos victorias de los Sixers", async ({ db, expect }) => {
    await db.query(
      `INSERT INTO games (home_team_id, away_team_id, date, season_init_year, finished, home_score, away_score, home_period_scores, away_period_scores)
       VALUES
         (3, 2, '2026-10-20 20:00:00+00', 2026, TRUE, 100, 90, ARRAY[25, 25, 25, 25]::SMALLINT[], ARRAY[20, 25, 20, 25]::SMALLINT[]),
         (2, 3, '2026-10-21 20:00:00+00', 2026, TRUE, 95, 110, ARRAY[20, 25, 25, 25]::SMALLINT[], ARRAY[25, 30, 25, 30]::SMALLINT[])`,
    );

    const controller = createController(db);
    const eastResponse = await controller.leaderBoard("East");

    expect(eastResponse.status).toBe(200);

    const eastResult: { data: Team[] } = await eastResponse.json();

    expect(eastResult.data).toMatchObject([
      { id: 3, name: "Philadelphia 76ers", victorys: 2, losses: 0, winRate: 100 },
      { id: SEED_TEAM_ID_A, name: "Boston Celtics", victorys: 3, losses: 3, winRate: 50 },
    ]);
  });

  test("devuelve equipos distintos según se consulte la conferencia Este u Oeste", async ({ db, expect }) => {
    const controller = createController(db);
    const eastResponse = await controller.leaderBoard("East");
    const westResponse = await controller.leaderBoard("West");

    expect(eastResponse.status).toBe(200);
    expect(westResponse.status).toBe(200);

    const eastResult: { data: Team[] } = await eastResponse.json();
    const westResult: { data: Team[] } = await westResponse.json();

    expect(eastResult.data).toMatchObject([
      { id: SEED_TEAM_ID_A, name: "Boston Celtics" },
      { id: 3, name: "Philadelphia 76ers" },
    ]);
    expect(westResult.data).toMatchObject([
      { id: SEED_TEAM_ID_B, name: "Denver Nuggets" },
    ]);
  });

  test("desempata por mayor número de victorias cuando los equipos tienen el mismo porcentaje", async ({ db, expect }) => {
    await db.query(
      `INSERT INTO team_season_stats (team_id, season_init_year, victorys, losses)
       VALUES (1, 2026, 3, 3), (3, 2026, 5, 5)
       ON CONFLICT (team_id, season_init_year)
       DO UPDATE SET victorys = EXCLUDED.victorys, losses = EXCLUDED.losses`,
    );

    const controller = createController(db);
    const response = await controller.leaderBoard("East");

    expect(response.status).toBe(200);
    const result: { data: Team[] } = await response.json();
    expect(result.data).toMatchObject([
      { id: 3, victorys: 5, losses: 5, winRate: 50 },
      { id: SEED_TEAM_ID_A, victorys: 3, losses: 3, winRate: 50 },
    ]);
  });

  test("marca el equipo como favorito solo para el usuario que lo guardó", async ({ db, expect }) => {
    await db.query(
      "INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $2)",
      [USER_A, SEED_TEAM_ID_A],
    );

    const controller = createController(db);
    const ownerResponse = await controller.leaderBoard("East");

    expect(ownerResponse.status).toBe(200);
    const ownerResult: { data: Team[] } = await ownerResponse.json();
    expect(ownerResult.data).toMatchObject([
      { id: SEED_TEAM_ID_A, isFavorite: true },
      { id: 3, isFavorite: false },
    ]);

    authMock.mockResolvedValue({ userId: USER_B });
    const otherResponse = await controller.leaderBoard("East");

    expect(otherResponse.status).toBe(200);
    const otherResult: { data: Team[] } = await otherResponse.json();
    expect(otherResult.data).toMatchObject([
      { id: SEED_TEAM_ID_A, isFavorite: false },
      { id: 3, isFavorite: false },
    ]);
  });

  test("las estadísticas de temporadas anteriores no afectan a la clasificación actual", async ({ db, expect }) => {
    const controller = createController(db);
    const beforeResponse = await controller.leaderBoard("East");

    expect(beforeResponse.status).toBe(200);
    const beforeResult: { data: Team[] } = await beforeResponse.json();
    expect(beforeResult.data).toMatchObject([
      { id: SEED_TEAM_ID_A, victorys: 3, losses: 3, winRate: 50 },
      { id: 3, victorys: 0, losses: 0, winRate: 0 },
    ]);

    await db.query(
      `INSERT INTO team_season_stats (team_id, season_init_year, victorys, losses)
       VALUES (1, 2025, 0, 82), (3, 2025, 82, 0)
       ON CONFLICT (team_id, season_init_year)
       DO UPDATE SET victorys = EXCLUDED.victorys, losses = EXCLUDED.losses`,
    );
    const afterResponse = await controller.leaderBoard("East");

    expect(afterResponse.status).toBe(200);
    expect(await afterResponse.json()).toStrictEqual(beforeResult);
  });
});


describe("TeamsController.teamProfile", () => {
  test.for([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "devuelve 400 cuando el ID no es un entero seguro: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.teamProfile(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );

  test.for([-2, 0])(
    "devuelve 400 cuando el ID es menor de 1: %s", async (id, { db, expect }) => {
      const controller = createController(db);
      const response = await controller.teamProfile(id);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({ error: expect.any(String) });
      expect(authMock).not.toHaveBeenCalled();
    },
  );
  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(TeamsService.prototype, "teamProfile")
      .mockRejectedValue(new Error("Fallo simulado"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.teamProfile(SEED_TEAM_ID_A);

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve correctamente el perfil del equipo solicitado", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.teamProfile(SEED_TEAM_ID_A);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: {
        id: SEED_TEAM_ID_A,
        name: "Boston Celtics",
        logo: "/logos/boston-celtics.webp",
        shortName: "BOS",
        conference: "East",
        division: "Atlantic",
        stadium: "TD Garden",
        coach: "Joe Mazzulla",
        victorys: 3,
        losses: 3,
        winRate: 50,
        homeVictorys: 3,
        homeLosses: 3,
        awayVictorys: 0,
        awayLosses: 0,
        rank: 1,
        isFavorite: false,
      },
    });
  });

  test("marca el perfil como favorito solo para el usuario que guardó el equipo", async ({ db, expect }) => {
    await db.query(
      "INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $2)",
      [USER_A, SEED_TEAM_ID_A],
    );

    const controller = createController(db);
    const ownerResponse = await controller.teamProfile(SEED_TEAM_ID_A);

    expect(ownerResponse.status).toBe(200);
    expect(await ownerResponse.json()).toMatchObject({
      data: { id: SEED_TEAM_ID_A, isFavorite: true },
    });

    authMock.mockResolvedValue({ userId: USER_B });
    const otherResponse = await controller.teamProfile(SEED_TEAM_ID_A);

    expect(otherResponse.status).toBe(200);
    expect(await otherResponse.json()).toMatchObject({
      data: { id: SEED_TEAM_ID_A, isFavorite: false },
    });
  });

  test("los partidos de temporadas anteriores no modifican las estadísticas del perfil actual", async ({ db, expect }) => {
    const controller = createController(db);
    const beforeResponse = await controller.teamProfile(SEED_TEAM_ID_A);

    expect(beforeResponse.status).toBe(200);
    const beforeResult = await beforeResponse.json();
    expect(beforeResult).toMatchObject({
      data: { id: SEED_TEAM_ID_A, victorys: 3, losses: 3, winRate: 50 },
    });

    await db.query(
      `INSERT INTO games (home_team_id, away_team_id, date, season_init_year, finished, home_score, away_score, home_period_scores, away_period_scores)
       VALUES
         (1, 2, '2025-10-20 20:00:00+00', 2025, TRUE, 100, 90, ARRAY[25, 25, 25, 25]::SMALLINT[], ARRAY[20, 25, 20, 25]::SMALLINT[]),
         (2, 1, '2025-10-21 20:00:00+00', 2025, TRUE, 95, 110, ARRAY[20, 25, 25, 25]::SMALLINT[], ARRAY[25, 30, 25, 30]::SMALLINT[])`,
    );

    const afterResponse = await controller.teamProfile(SEED_TEAM_ID_A);

    expect(afterResponse.status).toBe(200);
    expect(await afterResponse.json()).toStrictEqual(beforeResult);
  });

  test("devuelve 404 cuando el equipo no existe", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.teamProfile(9999);

    expect(response.status).toBe(404);
    expect(await response.json()).toStrictEqual({ error: expect.any(String) });
  });

  test("actualiza la posición en la conferencia cuando otro equipo tiene mejor porcentaje", async ({ db, expect }) => {
    const controller = createController(db);
    const beforeResponse = await controller.teamProfile(SEED_TEAM_ID_A);

    expect(beforeResponse.status).toBe(200);
    expect(await beforeResponse.json()).toMatchObject({
      data: { id: SEED_TEAM_ID_A, winRate: 50, rank: 1 },
    });

    await db.query(
      `INSERT INTO team_season_stats (team_id, season_init_year, victorys, losses)
       VALUES (3, 2026, 2, 0)
       ON CONFLICT (team_id, season_init_year)
       DO UPDATE SET victorys = EXCLUDED.victorys, losses = EXCLUDED.losses`,
    );
    const bostonResponse = await controller.teamProfile(SEED_TEAM_ID_A);
    const sixersResponse = await controller.teamProfile(3);

    expect(bostonResponse.status).toBe(200);
    expect(sixersResponse.status).toBe(200);
    expect(await bostonResponse.json()).toMatchObject({
      data: { id: SEED_TEAM_ID_A, winRate: 50, rank: 2 },
    });
    expect(await sixersResponse.json()).toMatchObject({
      data: { id: 3, winRate: 100, rank: 1 },
    });
  });
});