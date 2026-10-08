import { prisma } from "@/lib/prisma";
import { AdminOperations } from "@/components/admin-operations";

export default async function AdminPage() {
  const [players, clubs, statistics, users, sync] = await Promise.all([
    prisma.player.count(),
    prisma.club.count(),
    prisma.playerStatistic.count(),
    prisma.user.count(),
    prisma.syncLog.findFirst({ orderBy: { started_at: "desc" } })
  ]);
  const clubOptions = await prisma.club.findMany({
    select: { club_id: true, common_name: true },
    orderBy: { common_name: "asc" }
  });
  const adminEnabled = Boolean(process.env.ADMIN_API_KEY);
  const providerConfigured = Boolean(process.env.FOOTBALL_API_BASE_URL && process.env.FOOTBALL_API_KEY);
  return (
    <>
      <header className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">FOOTBALL IDENTITY</p>
          <h1>Admin dashboard</h1>
          <p className="muted">Manage player and club records, statistics, and data updates in one place.</p>
        </div>
        <span className={`admin-status-pill${adminEnabled ? " is-ready" : " is-warning"}`}>
          <span aria-hidden="true" />{adminEnabled ? "Ready to manage data" : "Setup required"}
        </span>
      </header>

      <section className="section admin-summary-grid" aria-label="Database summary">
        <div className="card admin-summary-card"><span className="admin-summary-icon">♟</span><strong>{players}</strong><span>Players</span></div>
        <div className="card admin-summary-card"><span className="admin-summary-icon">⚽</span><strong>{clubs}</strong><span>Clubs</span></div>
        <div className="card admin-summary-card"><span className="admin-summary-icon">▤</span><strong>{statistics}</strong><span>Season statistics</span></div>
        <div className="card admin-summary-card"><span className="admin-summary-icon">↻</span><strong>{sync?.status === "success" ? "Complete" : sync?.status === "failed" ? "Failed" : sync?.status === "skipped" ? "Skipped" : "Not yet"}</strong><span>Most recent sync</span></div>
      </section>

      <section className="section admin-connection-card card" aria-label="Data provider connection">
        <span className={`admin-connection-dot${providerConfigured ? " is-ready" : ""}`} aria-hidden="true" />
        <div>
          <strong>{providerConfigured ? "External provider connected" : "Using the starter dataset"}</strong>
          <p className="muted">{providerConfigured ? "Use Provider sync below to refresh player profiles and statistics." : "You can add players and clubs with the forms below. Connect a provider in .env to enable automatic updates."}</p>
        </div>
      </section>

      <AdminOperations clubs={clubOptions} adminEnabled={adminEnabled} providerConfigured={providerConfigured} />
    </>
  );
}
