import { teamsController } from "@/src/backend/containers/teamsContainer";

export async function GET(request: Request){
    const params = new URL(request.url).searchParams;

    return teamsController.leaderBoard(params.get("conf"));
}