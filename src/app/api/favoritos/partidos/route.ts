import { favoriteController } from "@/src/backend/containers/favoriteContainer";

export async function GET() {
    return favoriteController.favoriteGames();
}

export async function POST(request: Request) {
    const params = new URL(request.url).searchParams;
    return favoriteController.addFavoriteGame(Number(params.get("itemId")));
}

export async function DELETE(request: Request) {
    const params = new URL(request.url).searchParams;
    return favoriteController.removeFavoriteGame(Number(params.get("itemId")));
}