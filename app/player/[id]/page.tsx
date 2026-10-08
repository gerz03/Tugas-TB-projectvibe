import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EntityImage } from "@/components/entity-image";
import Link from "next/link";
import { GitCompare, Shield, Activity } from "lucide-react";

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

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await prisma.player.findUnique({
    where: { player_id: id },
    include: {
      current_club: { include: { league: true } },
      country: true,
      careers: { include: { club: { include: { league: true } } }, orderBy: { start_date: "asc" } },
      statistics: { orderBy: { season: "desc" } },
      transfers: { include: { fromClub: true, toClub: true }, orderBy: { transfer_date: "desc" } }
    }
  });

  if (!player) notFound();

  const finalClub = player.career_status === "RETIRED"
    ? player.careers[player.careers.length - 1]?.club
    : null;
  const displayedClub = player.current_club ?? finalClub;
  const displayedClubHeading = finalClub && !player.current_club ? "Final Club" : "Current Club Details";
  const value = (v: unknown) => (typeof v === "string" || typeof v === "number" ? v : "Data not available");
  const now = new Date();
  const birthDate = player.date_of_birth;
  let age = birthDate ? now.getUTCFullYear() - birthDate.getUTCFullYear() : null;
  if (
    age !== null &&
    birthDate &&
    (now.getUTCMonth() < birthDate.getUTCMonth() ||
      (now.getUTCMonth() === birthDate.getUTCMonth() && now.getUTCDate() < birthDate.getUTCDate()))
  ) {
    age -= 1;
  }

  const latestStat = player.statistics[0];

  return (
    <div className="soccer-page">
      {/* Player Stadium Locker Banner */}
      <section className="player-hero-card">
        <div className="player-hero-backdrop"></div>
        <div className="player-hero-content">
          <div className="player-hero-photo-wrap">
            <EntityImage
              className="player-profile-photo"
              src={player.profile_photo}
              name={player.common_name}
              kind="player"
            />
            <div className="player-kit-floating-badge">
              #{player.shirt_number ?? "—"}
            </div>
          </div>

          <div className="player-hero-meta">
            <div className="player-badges-row">
              <span className={`position-badge ${getPositionClass(player.position)}`}>
                {getPositionShort(player.position)} · {player.position ?? "Player"}
              </span>
              <span className="nationality-pill">
                {player.country?.flag} {player.nationality ?? "International"}
              </span>
              <span className="status-pill">
                {player.career_status === "RETIRED" ? "👑 Football Legend" : "⚽ Active Squad"}
              </span>
            </div>

            <h1 className="player-hero-name">{player.common_name}</h1>
            <p className="player-official-name">{player.full_name}</p>

            <div className="player-actions-row">
              {displayedClub ? (
                <Link className="button club-link-btn" href={`/club/${displayedClub.club_id}`}>
                  <Shield size={16} /> {finalClub && !player.current_club ? `Retired at ${displayedClub.common_name}` : displayedClub.common_name}
                </Link>
              ) : (
                <span className="button ghost">{player.career_status === "RETIRED" ? "Retired" : "Club not listed"}</span>
              )}

              <Link className="button secondary" href={`/compare?p1=${player.player_id}`}>
                <GitCompare size={16} /> Compare In Head-To-Head
              </Link>
            </div>

            <p className="player-source-line muted">
              Source: {value(player.source)} · Last updated: {player.last_updated.toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>
      </section>

      {/* Physical & Tactical Cards */}
      <section className="section grid cols-3">
        <div className="card tactical-card">
          <div className="card-header-with-icon">
            <h3>📋 Tactical & Physical Profile</h3>
          </div>
          <div className="spec-list">
            <div className="spec-item">
              <span className="spec-label">Preferred Foot</span>
              <span className="spec-val highlight">{value(player.preferred_foot)}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Height</span>
              <span className="spec-val">{player.height ? `${player.height} cm` : "Not listed"}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Weight</span>
              <span className="spec-val">{player.weight ? `${player.weight} kg` : "Not listed"}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Age</span>
              <span className="spec-val">{age ?? "Not listed"} years</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Date of Birth</span>
              <span className="spec-val">{player.date_of_birth?.toLocaleDateString("en-GB") ?? "Not listed"}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Birthplace</span>
              <span className="spec-val">{value(player.place_of_birth)}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Secondary Role</span>
              <span className="spec-val">{value(player.secondary_position)}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">National Team</span>
              <span className="spec-val">{value(player.current_national_team)}</span>
            </div>
          </div>
        </div>

        <div className="card club-card-spotlight">
          <div className="card-header-with-icon">
            <h3>🛡️ {displayedClubHeading}</h3>
          </div>
          {displayedClub ? (
            <div className="club-spotlight-inner">
              <Link href={`/club/${displayedClub.club_id}`} className="club-logo-link">
                <EntityImage
                  className="avatar club-large-avatar"
                  src={displayedClub.logo}
                  name={displayedClub.common_name}
                  kind="club"
                />
              </Link>
              <h4>{displayedClub.common_name}</h4>
              <p className="muted">
                {finalClub && !player.current_club
                  ? "Last club before retirement"
                  : displayedClub.league?.league_name ?? "League"}
              </p>
              <div className="club-mini-specs">
                <p>🏟️ <strong>Stadium:</strong> {displayedClub.stadium ?? "Arena"}</p>
                <p>📍 <strong>City:</strong> {displayedClub.city ?? "City"}</p>
                {displayedClub.manager && <p>👔 <strong>Manager:</strong> {displayedClub.manager}</p>}
              </div>
              <Link href={`/club/${displayedClub.club_id}`} className="button accent full-width">
                View Club Hub
              </Link>
            </div>
          ) : (
            <p className="muted">Currently without an active club contract.</p>
          )}
        </div>

        <div className="card stats-highlight-card">
          <div className="card-header-with-icon">
            <h3><Activity size={18} /> Season Record</h3>
          </div>
          {latestStat ? (
            <div className="latest-stat-body">
              <span className="season-badge">{latestStat.season} · {latestStat.competition}</span>
              <div className="key-stat-bars-grid">
                <div className="stat-pill-box">
                  <span className="stat-box-val">{latestStat.goals ?? 0}</span>
                  <span className="stat-box-lbl">GOALS</span>
                </div>
                <div className="stat-pill-box">
                  <span className="stat-box-val">{latestStat.assists ?? 0}</span>
                  <span className="stat-box-lbl">ASSISTS</span>
                </div>
                <div className="stat-pill-box">
                  <span className="stat-box-val">{latestStat.appearances ?? 0}</span>
                  <span className="stat-box-lbl">MATCHES</span>
                </div>
              </div>
              {latestStat.source && (
                <p className="stats-source muted">
                  Source: <a className="text-link" href={latestStat.source} target="_blank" rel="noreferrer">Verified Record</a>
                </p>
              )}
            </div>
          ) : (
            <p className="muted">No verified season records are cataloged.</p>
          )}
        </div>
      </section>

      {/* Full Statistics Table */}
      {player.statistics.length > 0 && (
        <section className="section card">
          <div className="section-header">
            <h2>📊 Competition Statistics Record</h2>
          </div>
          <div className="table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Competition</th>
                  <th>Team</th>
                  <th>Appearances</th>
                  <th>Goals</th>
                  <th>Assists</th>
                </tr>
              </thead>
              <tbody>
                {player.statistics.map((row) => (
                  <tr key={row.stat_id}>
                    <td><strong>{row.season}</strong></td>
                    <td>{row.competition}</td>
                    <td>{row.team_type.toUpperCase()}</td>
                    <td>{row.appearances ?? "—"}</td>
                    <td className="stat-goal-cell">{row.goals ?? "—"}</td>
                    <td className="stat-assist-cell">{row.assists ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Biography */}
      {player.biography && (
        <section className="section card bio-card">
          <h2>📖 Player Biography & Legacy</h2>
          <p className="bio-text">{player.biography}</p>
        </section>
      )}

      {/* Career History & Transfers */}
      <section className="section grid cols-2">
        <div className="card">
          <div className="section-header">
            <h2>🏆 Club Career Pathway</h2>
          </div>
          <div className="career-timeline">
            {player.careers.map((career) => (
              <div className="career-timeline-row" key={career.career_id}>
                <div className="timeline-marker"></div>
                <div className="career-content">
                  <div className="career-header">
                    <Link href={`/club/${career.club_id}`} className="career-club-name">
                      {career.club.common_name}
                    </Link>
                    <span className="season-pill">{career.season ?? "Season"}</span>
                  </div>
                  <p className="muted">
                    {career.appearances} matches · {career.goals} goals · {career.assists} assists
                  </p>
                  <span className="transfer-type-tag">{career.transfer_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <h2>🔄 Transfer Journey</h2>
          </div>
          {player.transfers.length === 0 ? (
            <p className="muted">No historical transfers recorded.</p>
          ) : (
            <div className="grid">
              {player.transfers.map((tr) => (
                <div className="transfer-card" key={tr.transfer_id}>
                  <div className="transfer-player-info">
                    <span className="transfer-season-badge">{tr.season ?? tr.transfer_date?.getFullYear()}</span>
                    <span className="fee-badge">
                      {tr.transfer_fee && tr.transfer_fee > 0
                        ? `€${(tr.transfer_fee / 1000000).toFixed(0)}M`
                          : tr.transfer_type === "FREE" ? "Free Transfer" : tr.transfer_type}
                    </span>
                  </div>
                  <div className="transfer-journey">
                    <Link className="club-pill from" href={`/club/${tr.from_club_id}`}>
                      {tr.fromClub.common_name}
                    </Link>
                    <span className="transfer-arrow">➔</span>
                    <Link className="club-pill to" href={`/club/${tr.to_club_id}`}>
                      {tr.toClub.common_name}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
