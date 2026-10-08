import Link from "next/link";
import { cookies } from "next/headers";
import { LogoutButton } from "@/components/logout-button";
import { readSession } from "@/lib/auth";
import { sessionCookieName } from "@/lib/session-cookie";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const session = await readSession(cookieStore.get(sessionCookieName)?.value);
  const user = session
    ? await prisma.user.findUnique({
        where: { user_id: session.user_id },
        include: {
          achievements: { include: { achievement: true }, orderBy: { unlocked_at: "desc" } },
          sessions: { orderBy: { started_at: "desc" }, take: 10 }
        }
      })
    : null;

  if (!user) {
    return (
      <section className="card auth-card">
        <h1>Your Football Identity</h1>
        <p className="muted">Sign in or create an account to save scores, game history, and achievements.</p>
        <div className="actions"><Link className="button accent" href="/login">Sign in</Link><Link className="button secondary" href="/register">Create account</Link></div>
      </section>
    );
  }

  return (
    <>
      <div className="topbar">
        <div><h1>{user.username}</h1><p className="muted">{user.email}</p></div>
        <LogoutButton />
      </div>
      <section className="section grid cols-4">
        <div className="card"><h2>{user.total_score}</h2><p>Total score</p></div>
        <div className="card"><h2>{user.games_played}</h2><p>Completed games</p></div>
        <div className="card"><h2>{user.accuracy}%</h2><p>Answer accuracy</p></div>
        <div className="card"><h2>{user.highest_streak}</h2><p>Best streak</p></div>
      </section>
      <section className="section grid cols-2">
        <div>
          <h2>Recent games</h2>
          {user.sessions.length === 0 ? <div className="card">Play a game to start building your history.</div> : (
            <div className="grid">
              {user.sessions.map((game) => (
                <div className="card" key={game.session_id}>
                  <strong>{game.mode.replaceAll("_", " ")}</strong>
                  <p>{game.score} points · {game.difficulty}</p>
                  <p className="muted">{game.started_at.toLocaleDateString("id-ID")} · {game.completed_at ? "Complete" : "In progress"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2>Achievements</h2>
          {user.achievements.length === 0 ? <div className="card">Achievements will appear here as you play.</div> : (
            <div className="grid">
              {user.achievements.map((item) => (
                <div className="card" key={item.user_achievement_id}>
                  <strong>{item.achievement.name}</strong>
                  <p className="muted">{item.achievement.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
