import { favoriteController } from "@/src/backend/containers/favoriteContainer";

export async function GET() {
    return favoriteController.favoriteTeams();
}