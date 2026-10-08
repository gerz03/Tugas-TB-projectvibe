import { prisma } from "@/lib/prisma";
import { handleError, ok, pagination } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { skip, take, page, pageSize } = pagination(url);
    const q = url.searchParams.get("q") ?? "";
    const country = url.searchParams.get("country") ?? undefined;
    const where = {
      AND: [
        q ? { OR: [{ official_name: { contains: q } }, { common_name: { contains: q } }] } : {},
        country ? { country_name: { contains: country } } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.club.findMany({ where, include: { league: true, country: true, players: true, careers: { include: { player: true } }, statistics: true, trophies: true }, skip, take, orderBy: { common_name: "asc" } }),
      prisma.club.count({ where })
    ]);
    return ok({ items, meta: { page, pageSize, total } });
  } catch (error) {
    return handleError(error);
  }
}
