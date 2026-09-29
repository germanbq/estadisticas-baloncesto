import { playersController } from "@/src/backend/containers/PlayersContainer";

export async function GET(request: Request) {
    const params = new URL(request.url).searchParams;

    return playersController.leadersList(params.get("metrica"));
}