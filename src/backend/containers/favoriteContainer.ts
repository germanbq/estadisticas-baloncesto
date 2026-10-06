import { FavoritesController } from "../controllers/FavoritesController";
import { FavoritesQueries } from "../queries/FavoritesQueries";
import { FavoritesRepository } from "../repositories/FavoritesRepository";
import { FavoritesService } from "../services/FavoritesService";
import { pool } from "../shared/db";
import { PostgresQueryExecutor } from "../shared/PostgresQueryExecutor";

const executor = new PostgresQueryExecutor(pool)
const queries = new FavoritesQueries();
const repository = new FavoritesRepository(queries, executor);
const service = new FavoritesService(repository);
export const favoriteController = new FavoritesController(service);