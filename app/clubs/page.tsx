import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EntityImage } from "@/components/entity-image";
import { Shield } from "lucide-react";

export default async function ClubsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; league?: string }>
}) {
  const { q = "", league = "" } = await searchParams;
  const query = q.trim();

  const whereClause: any = {};
  if (query) {
    whereClause.OR = [
      { common_name: { contains: query } },
      { official_name: { contains: query } },
      { country_name: { contains: query } },
      { city: { contains: query } }
    ];
  }
  if (league) {
    whereClause.league = { league_name: { contains: league } };
  }

  const clubs = await prisma.club.findMany({
    where: Object.keys(whereClause).length ? whereClause : undefined,
    include: {
      league: true,
      country: true,
      _count: { select: { players: true, careers: true } }
    },
    orderBy: { common_name: "asc" },
    take: 100
  });

  const leaguesList = [
    { label: "All Leagues", value: "" },
    { label: "Premier League", value: "Premier League" },
    { label: "La Liga", value: "La Liga" },
    { label: "Serie A", value: "Serie A" },
    { label: "Bundesliga", value: "Bundesliga" },
    { label: "Saudi Pro League", value: "Saudi Pro League" },
    { label: "MLS", value: "Major League Soccer" },
    { label: "Liga 1 Indonesia", value: "Liga 1 Indonesia" },
    { label: "South America", value: "Argentina" }
  ];

  return (
    <div className="soccer-page">
      <div className="topbar">
        <div>
          <div className="page-header-badge">
            <Shield size={16} /> WORLDWIDE CLUB ENCYCLOPEDIA
          </div>
          <h1>Worldwide Football Clubs</h1>
          <p className="muted">
            Explore iconic football clubs worldwide across Premier League, La Liga, Serie A, Bundesliga, Saudi Pro League, Liga 1 Indonesia, South America, and Asia.
          </p>
        </div>
      </div>

      <div className="roster-filters-bar">
        <form className="roster-search-form" action="/clubs" role="search">
          <input
            className="search soccer-search-input"
            id="club-query"
            name="q"
            placeholder="Search by club name, city, or country..."
            defaultValue={query}
          />
          {league && <input type="hidden" name="league" value={league} />}
          <button className="button accent" type="submit">Search</button>
        </form>

        <div className="position-tabs">
          {leaguesList.map((item) => {
            const active = (item.value === "" && !league) || league === item.value;
            const queryParam = new URLSearchParams();
            if (query) queryParam.set("q", query);
            if (item.value) queryParam.set("league", item.value);
            const href = `/clubs${queryParam.toString() ? `?${queryParam.toString()}` : ""}`;
            return (
              <Link key={item.label} href={href} className={`pos-chip ${active ? "active" : ""}`}>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="roster-meta-line">
        <span className="results-count">
          Showing <strong>{clubs.length}</strong> club institutions
          {query ? ` matching "${query}"` : ""}
          {league ? ` in ${league}` : ""}
        </span>
      </div>

      {clubs.length === 0 ? (
        <div className="card empty-roster-card">
          <p>No club records match your search criteria.</p>
          <Link href="/clubs" className="button secondary">Clear Filters</Link>
        </div>
      ) : (
        <section className="grid cols-4" aria-label="Club records">
          {clubs.map((c) => (
            <Link className="card club-crest-card record-card" href={`/club/${c.club_id}`} key={c.club_id}>
              <div
                className="club-color-strip"
                style={{
                  background: `linear-gradient(90deg, ${c.primary_color ?? "#0b3d2e"} 50%, ${c.secondary_color ?? "#facc15"} 50%)`
                }}
              />
              <div className="club-crest-media">
                <EntityImage className="avatar club-avatar" src={c.logo} name={c.common_name} kind="club" />
              </div>
              <div className="club-crest-body">
                <h3>{c.common_name}</h3>
                <p className="club-league-line">
                  {c.country?.flag} {c.country_name} · {c.league?.league_name ?? "Top League"}
                </p>
                <div className="club-stadium-line">
                  <span>🏟️ {c.stadium ?? "Stadium Arena"}</span>
                  {c.stadium_capacity && (
                    <span className="muted"> · {(c.stadium_capacity / 1000).toFixed(0)}k</span>
                  )}
                </div>
                {c.manager && c.manager !== "Data not available" && (
                  <p className="club-manager-line">
                    Manager: <strong>{c.manager}</strong>
                  </p>
                )}
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
