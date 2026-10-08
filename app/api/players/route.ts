import { prisma } from "@/lib/prisma";
import { handleError, ok, pagination } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { skip, take, page, pageSize } = pagination(url);
    const q = url.searchParams.get("q") ?? "";
    const position = url.searchParams.get("position") ?? undefined;
    const country = url.searchParams.get("country") ?? undefined;
    const where = {
      AND: [
        q ? { OR: [{ full_name: { contains: q } }, { common_name: { contains: q } }] } : {},
        position ? { position: { contains: position } } : {},
        country ? { nationality: { contains: country } } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.player.findMany({ where, include: { current_club: true, country: true, careers: { include: { club: true }, orderBy: { start_date: "asc" } }, statistics: true }, skip, take, orderBy: { common_name: "asc" } }),
      prisma.player.count({ where })
    ]);
    return ok({ items, meta: { page, pageSize, total } });
  } catch (error) {
    return handleError(error);
  }
}
