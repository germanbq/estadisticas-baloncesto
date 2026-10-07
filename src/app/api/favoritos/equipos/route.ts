import { favoriteController } from "@/src/backend/containers/favoriteContainer";

export async function GET() {
    return favoriteController.favoriteTeams();
}

export async function POST(request: Request) {
    const params = new URL(request.url).searchParams;
    return favoriteController.addFavoriteTeam(Number(params.get("itemId")));
}

export async function DELETE(request: Request) {
    const params = new URL(request.url).searchParams;
    return favoriteController.removeFavoriteTeam(Number(params.get("itemId")));
}