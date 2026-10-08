import { fail, handleError, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const a = url.searchParams.get("a");
    const b = url.searchParams.get("b");
    if (!a || !b || !["player", "club"].includes(type ?? "")) return fail("type, a, and b are required");
    if (type === "player") {
      const items = await prisma.player.findMany({ where: { player_id: { in: [a, b] } }, include: { current_club: true, statistics: true } });
      items.sort((left, right) => [a, b].indexOf(left.player_id) - [a, b].indexOf(right.player_id));
      return ok({ type, items });
    }
    const items = await prisma.club.findMany({ where: { club_id: { in: [a, b] } }, include: { league: true, players: true, statistics: true, trophies: true } });
    items.sort((left, right) => [a, b].indexOf(left.club_id) - [a, b].indexOf(right.club_id));
    return ok({ type, items });
  } catch (error) {
    return handleError(error);
  }
}
