import { pool } from "../shared/db";
import { PostgresQueryExecutor } from "../shared/PostgresQueryExecutor";
import { TeamsQueries } from "../queries/TeamsQueries";
import { TeamsRepository } from "../repositories/TeamsRepository";
import { TeamsService } from "../services/TeamsService";
import { TeamsController } from "../controllers/TeamsController";

const executor = new PostgresQueryExecutor(pool);
const queries = new TeamsQueries();
const repository = new TeamsRepository(queries, executor);
const service = new TeamsService(repository);
export const teamsController = new TeamsController(service);