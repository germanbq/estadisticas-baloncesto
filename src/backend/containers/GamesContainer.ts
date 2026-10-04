import { pool } from "../shared/db"
import { PostgresQueryExecutor } from "../shared/PostgresQueryExecutor"
import GamesQueries from "../queries/GamesQueries";
import GamesRepository from "../repositories/GamesRepository";
import GamesService from "../services/GamesService";
import GamesController from "../controllers/GamesController";

const executor = new PostgresQueryExecutor(pool);
const queries = new GamesQueries();
const repository = new GamesRepository(queries, executor);
const service = new GamesService(repository);
export const gamesController= new GamesController(service);