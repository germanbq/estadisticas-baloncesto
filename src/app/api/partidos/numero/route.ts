import { gamesController } from "@/src/backend/containers/GamesContainer";

export async function GET(request: Request) {
    const params = new URL(request.url).searchParams;
    return gamesController.gamesNumber(params.get("date"));
}