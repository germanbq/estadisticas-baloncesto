export type SqlQuery = {
  text: string;
  values: Array<string | number>;
};

export interface IQueryExecutor {
  query<T>(sql: string, params: unknown[]): Promise<T[]>;
}