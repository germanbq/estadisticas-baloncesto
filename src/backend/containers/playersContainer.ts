import { pool } from "../shared/db"
import { PostgresQueryExecutor } from "../shared/PostgresQueryExecutor"
import { PlayersController } from "../controllers/PlayersController";
import { PlayersQueries } from "../queries/PlayersQueries";
import { PlayersRepository } from "../repositories/PlayersRepository";
import { PlayersService } from "../services/PlayersService";

const executor = new PostgresQueryExecutor(pool);
const queries = new PlayersQueries();
const repository = new PlayersRepository(queries, executor);
const service = new PlayersService(repository);

export const playersController= new PlayersController(service);