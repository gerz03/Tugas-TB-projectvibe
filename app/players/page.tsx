import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EntityImage } from "@/components/entity-image";
import { Users, Filter } from "lucide-react";

function getPositionClass(pos?: string | null) {
  if (!pos) return "pos-fwd";
  const p = pos.toLowerCase();
  if (p.includes("forward") || p.includes("striker") || p.includes("winger")) return "pos-fwd";
  if (p.includes("midfield")) return "pos-mid";
  if (p.includes("defender") || p.includes("back")) return "pos-def";
  if (p.includes("goalkeeper") || p.includes("keeper")) return "pos-gk";
  return "pos-fwd";
}

function getPositionShort(pos?: string | null) {
  if (!pos) return "FWD";
  const p = pos.toLowerCase();
  if (p.includes("goalkeeper") || p.includes("keeper")) return "GK";
  if (p.includes("defender") || p.includes("back")) return "DEF";
  if (p.includes("midfield")) return "MID";
  return "FWD";
}

export default async function PlayersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; pos?: string }>
}) {
  const { q = "", pos = "" } = await searchParams;
  const query = q.trim();

  const whereClause: any = {};
  if (query) {
    whereClause.OR = [
      { common_name: { contains: query } },
      { full_name: { contains: query } },
      { nationality: { contains: query } }
    ];
  }
  if (pos && pos !== "ALL") {
    whereClause.position = { contains: pos };
  }

  const players = await prisma.player.findMany({
    where: Object.keys(whereClause).length ? whereClause : undefined,
    include: {
      current_club: true,
      country: true,
      statistics: { orderBy: { last_updated: "desc" }, take: 1 }
    },
    orderBy: [{ popularity: "desc" }, { common_name: "asc" }],
    take: 100
  });

  const positions = [
    { label: "All Squad", value: "" },
    { label: "Forwards", value: "Forward" },
    { label: "Midfielders", value: "Midfielder" },
    { label: "Defenders", value: "Defender" },
    { label: "Goalkeepers", value: "Goalkeeper" }
  ];

  return (
    <div className="soccer-page">
      <div className="topbar">
        <div>
          <div className="page-header-badge">
            <Users size={16} /> WORLD FOOTBALL ROSTER
          </div>
          <h1>World Players Database</h1>
          <p className="muted">
            Explore {players.length} global footballers, positions, jersey numbers, verified careers, and season statistics.
          </p>
        </div>
      </div>

      <div className="roster-filters-bar">
        <form className="roster-search-form" action="/players" role="search">
          <input
            className="search soccer-search-input"
            id="player-query"
            name="q"
            placeholder="Search by player name, club, or nationality..."
            defaultValue={query}
          />
          {pos && <input type="hidden" name="pos" value={pos} />}
          <button className="button accent" type="submit">Search</button>
        </form>

        <div className="position-tabs">
          <span className="filter-label"><Filter size={14} /> Position:</span>
          {positions.map((p) => {
            const active = (p.value === "" && !pos) || pos === p.value;
            const queryParam = new URLSearchParams();
            if (query) queryParam.set("q", query);
            if (p.value) queryParam.set("pos", p.value);
            const href = `/players${queryParam.toString() ? `?${queryParam.toString()}` : ""}`;
            return (
              <Link
                key={p.label}
                href={href}
                className={`pos-chip ${active ? "active" : ""}`}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="roster-meta-line">
        <span className="results-count">
          Showing <strong>{players.length}</strong> players
          {query ? ` matching "${query}"` : ""}
          {pos ? ` in ${pos}` : ""}
        </span>
      </div>

      {players.length === 0 ? (
        <div className="card empty-roster-card">
          <p>No player records match your search criteria.</p>
          <Link href="/players" className="button secondary">Clear Filters</Link>
        </div>
      ) : (
        <section className="grid cols-4" aria-label="Player records">
          {players.map((player) => (
            <Link className="card player-squad-card record-card" href={`/player/${player.player_id}`} key={player.player_id}>
              <div className="player-card-top">
                <span className={`position-badge ${getPositionClass(player.position)}`}>
                  {getPositionShort(player.position)}
                </span>
                <span className="jersey-number-badge">#{player.shirt_number ?? "—"}</span>
              </div>

              <div className="player-card-media">
                <EntityImage
                  className="avatar squad-avatar"
                  src={player.profile_photo}
                  name={player.common_name}
                  kind="player"
                />
              </div>

              <div className="player-card-body">
                <h3>{player.common_name}</h3>
                <p className="player-team-line">
                  {player.country?.flag} {player.nationality ?? "International"}
                </p>
                <div className="player-club-tag">
                  {player.current_club?.common_name ?? (player.career_status === "RETIRED" ? "Retired" : "Club not listed")}
                </div>

                {player.statistics[0] ? (
                  <div className="player-mini-stats">
                    <span><strong>{player.statistics[0].goals ?? 0}</strong> G</span>
                    <span className="stat-dot">•</span>
                    <span><strong>{player.statistics[0].assists ?? 0}</strong> A</span>
                    <span className="stat-dot">•</span>
                    <span><strong>{player.statistics[0].appearances ?? 0}</strong> Apps</span>
                  </div>
                ) : (
                  <div className="player-mini-stats muted">
                    {player.career_status === "RETIRED" ? "Legend Record" : "Active Squad"}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
