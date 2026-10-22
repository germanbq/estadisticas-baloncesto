// @vitest-environment node

import { beforeEach, describe, vi } from "vitest";
import { auth } from "@clerk/nextjs/server";
import type { Client } from "pg";

import { test } from "../fixtures/dbTest";

import { PlayersController } from "../../src/backend/controllers/PlayersController";
import { PlayersService } from "../../src/backend/services/PlayersService";
import { PlayersRepository } from "../../src/backend/repositories/PlayersRepository";
import { PlayersQueries } from "../../src/backend/queries/PlayersQueries";
import { PostgresQueryExecutor } from "../../src/backend/shared/PostgresQueryExecutor";

vi.mock("@clerk/nextjs/server", () => ({
    auth: vi.fn(),
}));

const authMock = vi.mocked(auth, { partial: true });

const SEED_DATE_A = "2026-10-17"; //fecha con un partido
const SEED_DATE_B = "2026-10-18"; //fecha con dos partidos en horas límite
const SEED_GAME_ID_A = 1;         //partido de SEED_DATE_A
const SEED_GAME_ID_B = 2;          //partido de SEED_DATE_B
const SEED_GAME_ID_C = 3;          //partido de SEED_DATE_B
const SEED_TEAM_ID_A = 1;         //equipo con partidos
const SEED_TEAM_ID_B = 3;         //equipo sin partidos
const USER_A = "usuario_prueba_A";
const USER_B = "usuario_prueba_B";

function createController(db: Client): PlayersController {
    const executor = new PostgresQueryExecutor(db);
    const queries = new PlayersQueries();
    const repository = new PlayersRepository(queries, executor);
    const service = new PlayersService(repository);
    return new PlayersController(service);
}

beforeEach(() => {
    authMock.mockReset();

    authMock.mockResolvedValue({
        userId: USER_A,
    });
});

describe("PlayersController.leadersList", () => {
  test("devuelve 400 cuando la métrica es null", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.leadersList(null);

    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual({ error: expect.any(String) });
    expect(authMock).not.toHaveBeenCalled();
  });

  test("devuelve 400 cuando la métrica es una palabra no admitida", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.leadersList("metric");

    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual({ error: expect.any(String) });
    expect(authMock).not.toHaveBeenCalled();
  });

  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const serviceSpy = vi
      .spyOn(PlayersService.prototype, "leadersList")
      .mockRejectedValue(new Error("Fallo simulado"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const controller = createController(db);
      const response = await controller.leadersList("points");

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ error: expect.any(String) });
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve los líderes por promedio de puntos sin incluir estadísticas de temporadas anteriores", async ({ db, expect }) => {
    const updated = await db.query(
      `UPDATE team_season_stats
       SET victorys = 1, losses = 0
       WHERE team_id IN (1, 2) AND season_init_year = 2026
       RETURNING team_id`,
    );
    expect(updated.rows).toHaveLength(2);

    const previousSeason = await db.query(
      "SELECT total_points, games_played FROM player_season_stats WHERE player_id = $1 AND season_init_year = $2",
      [2, 2025],
    );
    expect(previousSeason.rows).toStrictEqual([{ total_points: 50, games_played: 1 }]);

    const controller = createController(db);
    const response = await controller.leadersList("points");

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      data: [
        { id: 1, name: "Jayson Tatum", image: "/players/Jayson_Tatum.webp", position: "SF", team: "BOS", jerseyNumber: 0, value: 30 },
        { id: 3, name: "Jamal Murray", image: "/players/Jamal_Murray.webp", position: "PG", team: "DEN", jerseyNumber: 27, value: 28.5 },
        { id: 2, name: "Nikola Jokic", image: "/players/Nikola_Jokic.webp", position: "C", team: "DEN", jerseyNumber: 15, value: 24.5 },
      ],
    });
  });

  test("excluye al jugador que no alcanza el porcentaje mínimo de partidos y lo incluye cuando lo supera", async ({ db, expect }) => {
    const playerId = 2;
    const teamStats = await db.query(
      "UPDATE team_season_stats SET victorys = 6, losses = 4 WHERE team_id = 2 AND season_init_year = 2026 RETURNING team_id",
    );
    expect(teamStats.rows).toHaveLength(1);
    const playerStats = await db.query(
      "UPDATE player_season_stats SET games_played = 7 WHERE player_id = $1 AND season_init_year = 2026 RETURNING player_id",
      [playerId],
    );
    expect(playerStats.rows).toHaveLength(1);

    const controller = createController(db);
    const response = await controller.leadersList("points");

    expect(response.status).toBe(200);
    const result: { data: { id: number }[] } = await response.json();
    expect(result.data.map((player) => player.id)).not.toContain(playerId);

    await db.query(
      "UPDATE player_season_stats SET games_played = 8 WHERE player_id = $1 AND season_init_year = 2026",
      [playerId],
    );
    const eligibleResponse = await controller.leadersList("points");

    expect(eligibleResponse.status).toBe(200);
    const eligibleResult = await eligibleResponse.json();
    expect(eligibleResult.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: playerId, value: 6.125 })]));
  });

  test("devuelve solo los tres mejores jugadores cuando hay más de tres elegibles", async ({ db, expect }) => {
    await db.query(
      "UPDATE team_season_stats SET victorys = 1, losses = 0 WHERE team_id IN (1, 2) AND season_init_year = 2026",
    );
    const addedPlayer = await db.query(
      `INSERT INTO players (name, height, weight, age, draft, team_id, country, jersey_number, position, image)
       VALUES ('Jugador límite', 2.00, 100, 25, 2020, 2, 'USA', 99, 'SF', '/players/test.webp')
       RETURNING id`,
    );
    const playerId: number = addedPlayer.rows[0].id;
    await db.query(
      `INSERT INTO player_season_stats (player_id, season_init_year, total_points, total_rebounds, total_ofe_rebounds, total_def_rebounds, total_assists, total_steals, total_blocks, total_turnovers, plusminus, total_fg_made, total_fg_attempted, total_three_made, total_three_attempted, games_played)
       VALUES ($1, 2026, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1)`,
      [playerId],
    );

    const controller = createController(db);
    const response = await controller.leadersList("points");

    expect(response.status).toBe(200);
    const result: { data: { id: number; value: number }[] } = await response.json();
    expect(result.data).toHaveLength(3);
    expect(result.data.map((player) => ({ id: player.id, value: player.value }))).toStrictEqual([
      { id: playerId, value: 40 },
      { id: 1, value: 30 },
      { id: 3, value: 28.5 },
    ]);
  });

  test("incluye al jugador al alcanzar exactamente el 77 % de partidos y lo excluye por debajo", async ({ db, expect }) => {
    const teamStats = await db.query(
      "UPDATE team_season_stats SET victorys = 60, losses = 40 WHERE team_id = 2 AND season_init_year = 2026 RETURNING team_id",
    );
    expect(teamStats.rows).toHaveLength(1);
    const playerStats = await db.query(
      "UPDATE player_season_stats SET games_played = 76 WHERE player_id = 2 AND season_init_year = 2026 RETURNING player_id",
    );
    expect(playerStats.rows).toHaveLength(1);

    const controller = createController(db);
    const belowResponse = await controller.leadersList("points");

    expect(belowResponse.status).toBe(200);
    const belowResult: { data: { id: number }[] } = await belowResponse.json();
    expect(belowResult.data.map((player) => player.id)).not.toContain(2);

    await db.query(
      "UPDATE player_season_stats SET games_played = 77 WHERE player_id = 2 AND season_init_year = 2026",
    );
    const thresholdResponse = await controller.leadersList("points");

    expect(thresholdResponse.status).toBe(200);
    const thresholdResult: { data: { id: number }[] } = await thresholdResponse.json();
    expect(thresholdResult.data.map((player) => player.id)).toContain(2);
  });
});
