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
