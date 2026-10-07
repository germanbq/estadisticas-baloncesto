import { favoriteController } from "@/src/backend/containers/favoriteContainer";

export async function GET() {
    return favoriteController.favoritePlayers();
}

export async function POST(request: Request) {
    const params = new URL(request.url).searchParams;
    return favoriteController.addFavoritePlayer(Number(params.get("itemId")));
}

export async function DELETE(request: Request) {
    const params = new URL(request.url).searchParams;
    return favoriteController.removeFavoritePlayer(Number(params.get("itemId")));
}