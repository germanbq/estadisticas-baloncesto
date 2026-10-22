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

describe("PlayersController.profileStats", () => {
  test.for([0, 2])(
    "devuelve 400 cuando el ID es menor o igual que cero: %s",
    async (id, { db, expect }) => {
      const serviceSpy = vi.spyOn(PlayersService.prototype, "profileStats");

      try {
        const response = await createController(db).profileStats(id);

        expect(response.status).toBe(400);
        expect(await response.json()).toStrictEqual({ error: "ID no válido" });
        expect(authMock).not.toHaveBeenCalled();
        expect(serviceSpy).not.toHaveBeenCalled();
      } finally {
        serviceSpy.mockRestore();
      }
    },
  );

  test.for([NaN, Infinity, -Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1, Number.MIN_SAFE_INTEGER - 1])(
    "devuelve 400 cuando el ID no es un entero seguro: %s",
    async (id, { db, expect }) => {
      const serviceSpy = vi.spyOn(PlayersService.prototype, "profileStats");

      try {
        const response = await createController(db).profileStats(id);

        expect(response.status).toBe(400);
        expect(await response.json()).toStrictEqual({ error: "ID no válido" });
        expect(authMock).not.toHaveBeenCalled();
        expect(serviceSpy).not.toHaveBeenCalled();
      } finally {
        serviceSpy.mockRestore();
      }
    },
  );

  test("devuelve 500 cuando falla el servicio", async ({ db, expect }) => {
    const error = new Error("Fallo simulado");
    const serviceSpy = vi.spyOn(PlayersService.prototype, "profileStats").mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const response = await createController(db).profileStats(1);

      expect(response.status).toBe(500);
      expect(await response.json()).toStrictEqual({ error: "Error al conseguir los datos del perfil" });
      expect(serviceSpy).toHaveBeenCalledWith(1, USER_A);
      expect(consoleSpy).toHaveBeenCalledWith(error);
    } finally {
      serviceSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  test("devuelve 404 cuando el jugador no existe", async ({ db, expect }) => {
    const missingId = 2147483647;
    const existing = await db.query("SELECT id FROM players WHERE id = $1", [missingId]);
    expect(existing.rows).toHaveLength(0);

    const response = await createController(db).profileStats(missingId);

    expect(response.status).toBe(404);
    expect(await response.json()).toStrictEqual({ error: "Jugador no encontrado" });
    expect(authMock).toHaveBeenCalledOnce();
  });

  test("devuelve 200 con el perfil y los promedios del jugador", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.profileStats(1);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      data: {
        id: 1,
        name: "Jayson Tatum",
        image: "/players/Jayson_Tatum.webp",
        height: "2.03",
        weight: "95.00",
        position: "SF",
        jerseyNumber: 0,
        country: "USA",
        age: 28,
        draft: 2017,
        team: "Boston Celtics",
        teamId: 1,
        isFavorite: false,
        seasons: [{
          season: 2026,
          points: 30,
          rebounds: 8,
          ofeRebounds: 2,
          defRebounds: 6,
          assists: 5,
          steals: 2,
          blocks: 1,
          turnovers: 3,
          plusMinus: -3,
          fgPercentage: 50,
          threePercentage: 100 * 4 / 9,
          games: 1,
        }],
      },
    });
    expect(authMock).toHaveBeenCalledOnce();
  });

  test("devuelve el perfil con seasons vacío cuando no hay estadísticas de temporada", async ({ db, expect }) => {
    await db.query("DELETE FROM player_season_stats WHERE player_id = 1");

    const response = await createController(db).profileStats(1);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { id: 1, name: "Jayson Tatum", teamId: 1, seasons: [] },
    });
  });

  test("ordena las temporadas de más reciente a más antigua", async ({ db, expect }) => {
    const controller = createController(db);
    const response = await controller.profileStats(2);

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.seasons.map((season: { season: number }) => season.season)).toStrictEqual([2026, 2025]);
    expect(result.data.seasons[1]).toMatchObject({ points: 50, games: 1 });
  });

  test("distingue los favoritos del usuario autenticado de los de otros usuarios", async ({ db, expect }) => {
    await db.query("DELETE FROM favorite_players WHERE player_id = 1");
    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, 1)", [USER_A]);
    const controller = createController(db);

    const favoriteResponse = await controller.profileStats(1);
    expect(favoriteResponse.status).toBe(200);
    expect(await favoriteResponse.json()).toMatchObject({ data: { id: 1, isFavorite: true } });

    authMock.mockResolvedValue({ userId: USER_B });
    const otherUserResponse = await controller.profileStats(1);
    expect(otherUserResponse.status).toBe(200);
    expect(await otherUserResponse.json()).toMatchObject({ data: { id: 1, isFavorite: false } });
  });

  test("devuelve el perfil sin sesión y con isFavorite false", async ({ db, expect }) => {
    await db.query("INSERT INTO favorite_players (user_id, player_id) VALUES ($1, 1) ON CONFLICT DO NOTHING", [USER_A]);
    authMock.mockResolvedValue({ userId: null });

    const response = await createController(db).profileStats(1);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { id: 1, name: "Jayson Tatum", isFavorite: false },
    });
  });

  test.for([
    { games: 0, fgAttempts: 20, threeAttempts: 9 },
    { games: 1, fgAttempts: 0, threeAttempts: 0 },
    { games: 0, fgAttempts: 0, threeAttempts: 0 },
  ])("devuelve cero para las divisiones con denominador cero: %j", async (values, { db, expect }) => {
    await db.query(
      `UPDATE player_season_stats
       SET games_played = $1, total_fg_attempted = $2, total_three_attempted = $3,
           total_fg_made = CASE WHEN $2 = 0 THEN 0 ELSE total_fg_made END,
           total_three_made = CASE WHEN $3 = 0 THEN 0 ELSE total_three_made END
       WHERE player_id = 1`,
      [values.games, values.fgAttempts, values.threeAttempts],
    );

    const response = await createController(db).profileStats(1);

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.seasons).toHaveLength(1);
    expect(result.data.seasons[0]).toStrictEqual({
      season: 2026,
      points: values.games === 0 ? 0 : 30,
      rebounds: values.games === 0 ? 0 : 8,
      ofeRebounds: values.games === 0 ? 0 : 2,
      defRebounds: values.games === 0 ? 0 : 6,
      assists: values.games === 0 ? 0 : 5,
      steals: values.games === 0 ? 0 : 2,
      blocks: values.games === 0 ? 0 : 1,
      turnovers: values.games === 0 ? 0 : 3,
      plusMinus: values.games === 0 ? 0 : -3,
      fgPercentage: values.fgAttempts === 0 ? 0 : 50,
      threePercentage: values.threeAttempts === 0 ? 0 : 100 * 4 / 9,
      games: values.games,
    });
  });
});