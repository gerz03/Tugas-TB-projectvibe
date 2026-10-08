import Link from "next/link";
import { prisma } from "@/lib/prisma";

const periods = ["today", "week", "month", "all"] as const;
type Period = (typeof periods)[number];

function periodStart(period: Period) {
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

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: requestedPeriod = "all" } = await searchParams;
  const period: Period = periods.includes(requestedPeriod as Period) ? requestedPeriod as Period : "all";
  const sessions = await prisma.gameSession.findMany({
    where: period === "all" ? undefined : { started_at: { gte: periodStart(period) } },
    orderBy: [{ score: "desc" }, { highest_streak: "desc" }],
    take: 50
  });
  return (
    <>
      <div className="topbar">
        <div><h1>Leaderboard</h1><p className="muted">Global ranking with accuracy, games, and streaks.</p></div>
        <nav className="tabs" aria-label="Leaderboard time range">
          {periods.map((value) => (
            <Link className="tab" href={`/leaderboard?period=${value}`} aria-current={period === value ? "page" : undefined} key={value}>
              {value === "all" ? "All Time" : value === "week" ? "This Week" : value === "month" ? "This Month" : "Today"}
            </Link>
          ))}
        </nav>
      </div>
      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th align="left">Rank</th><th align="left">Username</th><th align="right">Score</th><th align="right">Accuracy</th><th align="right">Games</th><th align="right">Best Streak</th></tr></thead>
          <tbody>
            {sessions.map((s, index) => {
              const total = s.correct_answers + s.wrong_answers;
              return <tr key={s.session_id} style={{ borderTop: "1px solid #dde5e0" }}><td>#{index + 1}</td><td style={{ padding: 12 }}><strong>{s.username}</strong></td><td align="right">{s.score}</td><td align="right">{total ? Math.round((s.correct_answers / total) * 100) : 0}%</td><td align="right">1</td><td align="right">{s.highest_streak}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
