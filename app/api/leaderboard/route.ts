import { fail, handleError, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const periods = ["today", "week", "month", "all"] as const;

function periodStart(period: (typeof periods)[number]) {
  const start = new Date();
  if (period === "today") start.setHours(0, 0, 0, 0);
  if (period === "week") {
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  }
  if (period === "month") {
    start.setHours(0, 0, 0, 0);
    start.setDate(1);
  }
  return start;
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const requestedPeriod = requestUrl.searchParams.get("period") ?? "all";
    if (!periods.includes(requestedPeriod as (typeof periods)[number])) return fail("Invalid leaderboard period.", 422);
    const period = requestedPeriod as (typeof periods)[number];
    const sessions = await prisma.gameSession.findMany({
      where: period === "all" ? undefined : { started_at: { gte: periodStart(period) } },
      orderBy: [{ score: "desc" }, { highest_streak: "desc" }],
      take: 50
    });
    return ok(sessions.map((s, index) => ({
      rank: index + 1,
      username: s.username,
      avatar: `https://placehold.co/64x64?text=${encodeURIComponent(s.username.slice(0, 2).toUpperCase())}`,
      score: s.score,
      accuracy: s.correct_answers + s.wrong_answers > 0 ? Math.round((s.correct_answers / (s.correct_answers + s.wrong_answers)) * 100) : 0,
      games: 1,
      bestStreak: s.highest_streak
    })));
  } catch (error) {
    return handleError(error);
  }
}
