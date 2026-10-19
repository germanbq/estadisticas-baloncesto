import { test as baseTest } from "vitest";
import { loadEnvFile } from "node:process";
import { Client } from "pg";

export function createTestClient(): Client {
    loadEnvFile(".env.test.local");

    const connectionString = process.env.TEST_DATABASE_URL;

    if (!connectionString) {
        throw new Error("Falta TEST_DATABASE_URL");
    }

    if (new URL(connectionString).pathname !== "/nba_app_test") {
        throw new Error("La conexión debe apuntar a nba_app_test");
    }

    return new Client({
        connectionString,
    });
}

export const test = baseTest.extend("db", async ({}, { onCleanup }) => {
    const db = createTestClient();

    await db.connect();

    onCleanup(async () => {
        try {
            await db.query("ROLLBACK");
        } finally {
            await db.end();
        }
    });

    await db.query("BEGIN");

    return db;
  }
);