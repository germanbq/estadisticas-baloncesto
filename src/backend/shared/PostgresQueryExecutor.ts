import type { Pool } from "pg";
import type { IQueryExecutor } from "./sql.types";

export class PostgresQueryExecutor implements IQueryExecutor {
  constructor(private readonly pool: Pool) {}

  async query<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }
}