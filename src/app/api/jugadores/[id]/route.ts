import { playersController } from "@/src/backend/containers/PlayersContainer";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return playersController.profileStats(Number(id));
}