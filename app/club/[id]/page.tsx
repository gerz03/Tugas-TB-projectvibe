import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatBars } from "@/components/stat-bars";
import { EntityImage } from "@/components/entity-image";
import Link from "next/link";
import { Shield, Globe } from "lucide-react";

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

export default async function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const club = await prisma.club.findUnique({
    where: { club_id: id },
    include: {
      league: true,
      country: true,
      players: {
        include: { country: true, statistics: { take: 1, orderBy: { season: "desc" } } }
      },
      careers: {
        include: {
          player: {
            include: { country: true, statistics: { take: 1, orderBy: { season: "desc" } } }
          }
        }
      },
      statistics: { orderBy: { season: "desc" } },
      trophies: true
    }
  });

  if (!club) notFound();

  // Combine direct current players and career players without duplicates
  const rawSquad = club.players.length
    ? club.players
    : club.careers
        .map((c) => c.player)
        .filter((p, index, arr) => arr.findIndex((x) => x.player_id === p.player_id) === index);

  // Sort squad: GK -> DEF -> MID -> FWD
  const positionWeight: Record<string, number> = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
  const squad = [...rawSquad].sort((a, b) => {
    const wa = positionWeight[getPositionShort(a.position)] || 5;
    const wb = positionWeight[getPositionShort(b.position)] || 5;
    return wa - wb;
  });

  const stat = club.statistics[0];

  return (
    <div className="soccer-page">
      {/* Club Stadium Banner */}
      <section className="club-hero-card">
        <div
          className="club-hero-strip"
          style={{
            background: `linear-gradient(90deg, ${club.primary_color ?? "#0b3d2e"} 0%, ${club.secondary_color ?? "#facc15"} 100%)`
          }}
        />
        <div className="club-hero-inner">
          <div className="club-crest-hero-wrap">
            <EntityImage
              className="club-hero-crest"
              src={club.logo}
              name={club.common_name}
              kind="club"
            />
          </div>

          <div className="club-hero-info">
            <div className="club-badges-row">
              <span className="nationality-pill">
                {club.country?.flag} {club.country_name}
              </span>
              <span className="league-pill">
                <Shield size={14} /> {club.league?.league_name ?? "Top League"}
              </span>
              {club.founded && (
                <span className="founded-pill">Est. {club.founded}</span>
              )}
            </div>

            <h1 className="club-hero-name">{club.common_name}</h1>
            <p className="club-official-name">{club.official_name}</p>

            <div className="club-meta-actions">
              {club.website && (
                <a
                  className="button secondary"
                  href={club.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe size={16} /> Official Club Website
                </a>
              )}
            </div>

            <p className="muted club-source-line">
              Source: {club.source ?? "Official League Record"} · Last updated: {club.last_updated.toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>
      </section>

      {/* Overview & Season Statistics */}
      <section className="section grid cols-3">
        <div className="card club-overview-card">
          <div className="card-header-with-icon">
            <h3>🏟️ Stadium & Operations</h3>
          </div>
          <div className="spec-list">
            <div className="spec-item">
              <span className="spec-label">Home Stadium</span>
              <span className="spec-val highlight">{club.stadium ?? "Data not available"}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Capacity</span>
              <span className="spec-val">
                {club.stadium_capacity
                  ? `${club.stadium_capacity.toLocaleString()} seats`
                  : "Not listed"}
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-label">City</span>
              <span className="spec-val">{club.city ?? "Data not available"}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Head Coach / Manager</span>
              <span className="spec-val highlight">{club.manager ?? "Data not available"}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Club President</span>
              <span className="spec-val">{club.president ?? "Data not available"}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Founded</span>
              <span className="spec-val">{club.founded ?? "Data not available"}</span>
            </div>
          </div>
        </div>

        <div className="card club-colors-card">
          <div className="card-header-with-icon">
            <h3>🎨 Club Kit Identity</h3>
          </div>
          <p className="muted" style={{ marginBottom: 16 }}>
            Official registered team kit colors for home and away strips.
          </p>
          <div className="kit-swatches-wrap">
            <div className="kit-swatch-box">
              <div
                className="kit-color-circle"
                style={{ background: club.primary_color ?? "#0b3d2e" }}
              />
              <span className="kit-swatch-label">Primary</span>
              <span className="kit-swatch-code">{club.primary_color ?? "#0b3d2e"}</span>
            </div>
            <div className="kit-swatch-box">
              <div
                className="kit-color-circle"
                style={{ background: club.secondary_color ?? "#facc15" }}
              />
              <span className="kit-swatch-label">Secondary</span>
              <span className="kit-swatch-code">{club.secondary_color ?? "#facc15"}</span>
            </div>
          </div>

          <div className="club-badge-display">
            <p className="muted">Shield Crest Preview</p>
            <EntityImage
              className="club-crest-preview"
              src={club.logo}
              name={club.common_name}
              kind="club"
            />
          </div>
        </div>

        <div className="card club-stats-card">
          <div className="card-header-with-icon">
            <h3>📊 League Performance</h3>
          </div>
          {stat ? (
            <div>
              <div className="stat-season-header">
                <span className="season-badge">{stat.season} · {stat.competition}</span>
                {stat.league_position && (
                  <span className="position-rank-badge">Rank #{stat.league_position}</span>
                )}
              </div>
              <StatBars
                rows={[
                  { label: "Matches", value: stat.matches },
                  { label: "Wins", value: stat.wins },
                  { label: "Draws", value: stat.draws },
                  { label: "Losses", value: stat.losses },
                  { label: "Goals Scored", value: stat.goals_for },
                  { label: "Goals Conceded", value: stat.goals_against }
                ]}
              />
              {stat.source && (
                <p className="stats-source muted" style={{ marginTop: 14 }}>
                  <a className="text-link" href={stat.source} target="_blank" rel="noreferrer">
                    Official Standings Reference
                  </a>
                </p>
              )}
            </div>
          ) : (
            <p className="muted">No verified season campaign recorded.</p>
          )}
        </div>
      </section>

      {/* Official Squad Roster */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2>⚽ Registered Squad & Team Roster</h2>
            <p className="muted">
              {squad.length} verified players in club database (ordered by tactical position)
            </p>
          </div>
        </div>

        {squad.length === 0 ? (
          <div className="card">
            <p className="muted">No squad players currently linked in this club record.</p>
          </div>
        ) : (
          <div className="grid cols-4">
            {squad.map((player) => (
              <Link
                className="card player-squad-card record-card"
                href={`/player/${player.player_id}`}
                key={player.player_id}
              >
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
                  <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    {player.position ?? "Squad Player"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
