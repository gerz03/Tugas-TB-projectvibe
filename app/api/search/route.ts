import { fail, handleError, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    if (q.length < 2) return ok({ players: [], clubs: [], leagues: [], countries: [], competitions: [] });
    if (q.length > 80) return fail("Search query must be 80 characters or fewer.", 422);
    const [players, clubs, leagues, countries, competitions] = await Promise.all([
      prisma.player.findMany({ where: { OR: [{ full_name: { contains: q } }, { common_name: { contains: q } }] }, include: { current_club: true }, take: 8 }),
      prisma.club.findMany({ where: { OR: [{ official_name: { contains: q } }, { common_name: { contains: q } }] }, include: { league: true }, take: 8 }),
      prisma.league.findMany({ where: { league_name: { contains: q } }, take: 8 }),
      prisma.country.findMany({ where: { country_name: { contains: q } }, take: 8 }),
      prisma.competition.findMany({ where: { competition_name: { contains: q } }, take: 8 })
    ]);
    return ok({ players, clubs, leagues, countries, competitions });
  } catch (error) {
    return handleError(error);
  }
}
