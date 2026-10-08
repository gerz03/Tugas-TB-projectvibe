import Link from "next/link";
import { Play, Users, Shield, Trophy, ArrowRight, Activity, Flame } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SearchBox } from "@/components/search-box";
import { EntityImage } from "@/components/entity-image";

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

export default async function HomePage() {
  const [players, clubs, transfers, leaderboard, playerCount, clubCount] = await Promise.all([
    prisma.player.findMany({
      include: {
        current_club: true,
        country: true,
        statistics: { orderBy: { last_updated: "desc" }, take: 1 }
      },
      take: 8,
      orderBy: { popularity: "desc" }
    }),
    prisma.club.findMany({
      include: { league: true, country: true },
      take: 8,
      orderBy: { official_name: "asc" }
    }),
    prisma.transfer.findMany({
      include: { player: true, fromClub: true, toClub: true },
      take: 6,
      orderBy: { transfer_date: "desc" }
    }),
    prisma.gameSession.findMany({ take: 5, orderBy: { score: "desc" } }),
    prisma.player.count(),
    prisma.club.count()
  ]);

  const featuredPlayer = players[0];
  const featuredClub = clubs[0];

  return (
    <div className="soccer-page">
      <div className="topbar">
        <SearchBox />
        <div className="topbar-meta">
          <span className="live-pill"><Activity size={14} /> ACTIVE DATABASE</span>
          <span className="muted">35+ Players · 25 Worldwide Clubs</span>
        </div>
      </div>

      {/* Hero Section styled like a Football Pitch & Stadium */}
      <section className="soccer-hero">
        <div className="pitch-lines-overlay" aria-hidden="true">
          <div className="pitch-center-circle"></div>
          <div className="pitch-center-line"></div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <Flame size={16} /> OFFICIAL FOOTBALL SQUAD ENCYCLOPEDIA
          </div>
          <h1>ELITE SQUADS. WORLD CLUBS. TEST YOUR FOOTBALL IQ.</h1>
          <p>
            Dive into verified career histories, official club crests, jersey numbers, and season statistics for 35 world superstars and 25 worldwide clubs.
          </p>
          <div className="actions">
            <Link href="/game" className="button accent pulse-btn">
              <Play size={18} /> PLAY MATCH QUIZ
            </Link>
            <Link href="/players" className="button secondary">
              <Users size={18} /> EXPLORE PLAYERS
            </Link>
            <Link href="/clubs" className="button ghost">
              <Shield size={18} /> WORLDWIDE CLUBS
            </Link>
          </div>
        </div>

        {featuredPlayer && (
          <div className="featured-card-wrapper">
            <div className="fut-card">
              <div className="fut-card-header">
                <span className="fut-rating">{featuredPlayer.popularity}</span>
                <span className={`fut-position ${getPositionClass(featuredPlayer.position)}`}>
                  {getPositionShort(featuredPlayer.position)}
                </span>
                <span className="fut-flag">{featuredPlayer.country?.flag}</span>
              </div>
              <div className="fut-card-image">
                <EntityImage
                  className="fut-photo"
                  src={featuredPlayer.profile_photo}
                  name={featuredPlayer.common_name}
                  kind="player"
                />
              </div>
              <div className="fut-card-info">
                <h3 className="fut-name">{featuredPlayer.common_name}</h3>
                <div className="fut-details">
                  <span className="fut-club-badge">
                    {featuredPlayer.current_club?.common_name ?? "Free Agent"}
                  </span>
                  <span className="fut-kit-number">#{featuredPlayer.shirt_number ?? 7}</span>
                </div>
                {featuredPlayer.statistics[0] && (
                  <div className="fut-stats-row">
                    <div>
                      <strong>{featuredPlayer.statistics[0].goals ?? 0}</strong>
                      <span>GOALS</span>
                    </div>
                    <div>
                      <strong>{featuredPlayer.statistics[0].assists ?? 0}</strong>
                      <span>ASSISTS</span>
                    </div>
                    <div>
                      <strong>{featuredPlayer.statistics[0].appearances ?? 0}</strong>
                      <span>APPS</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Stadium Intelligence Counters */}
      <section className="section grid cols-4 stats-grid">
        <div className="card matchday-stat-card">
          <div className="stat-icon-wrap"><Users size={24} /></div>
          <div>
            <h2 className="stat-number">{playerCount}</h2>
            <p className="muted">World Players Cataloged</p>
          </div>
        </div>
        <div className="card matchday-stat-card">
          <div className="stat-icon-wrap"><Shield size={24} /></div>
          <div>
            <h2 className="stat-number">{clubCount}</h2>
            <p className="muted">Worldwide Clubs Roster</p>
          </div>
        </div>
        <div className="card matchday-stat-card">
          <div className="stat-icon-wrap"><Trophy size={24} /></div>
          <div>
            <h2 className="stat-number">{leaderboard[0]?.score ?? 0}</h2>
            <p className="muted">Leaderboard High Score</p>
          </div>
        </div>
        <div className="card matchday-stat-card">
          <div className="stat-icon-wrap"><Play size={24} /></div>
          <div>
            <h2 className="stat-number">7</h2>
            <p className="muted">Quiz Challenge Modes</p>
          </div>
        </div>
      </section>

      {/* Popular World Players */}
      <section className="section" id="players">
        <div className="section-header">
          <div>
            <h2>⚽ Featured World Superstars</h2>
            <p className="muted">Explore profile stats, kit numbers, career histories & authentic portraits</p>
          </div>
          <Link href="/players" className="see-all-link">
            View All {playerCount} Players <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid cols-4">
          {players.map((player) => (
            <Link className="card player-squad-card" href={`/player/${player.player_id}`} key={player.player_id}>
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
                  {player.country?.flag} {player.nationality ?? "International"} · {player.current_club?.common_name ?? "Free Agent"}
                </p>
                {player.statistics[0] ? (
                  <div className="player-mini-stats">
                    <span><strong>{player.statistics[0].goals ?? 0}</strong> Goals</span>
                    <span className="stat-dot">•</span>
                    <span><strong>{player.statistics[0].assists ?? 0}</strong> Assists</span>
                    <span className="stat-dot">•</span>
                    <span><strong>{player.statistics[0].appearances ?? 0}</strong> Apps</span>
                  </div>
                ) : (
                  <div className="player-mini-stats muted">Career Record Verified</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Worldwide Clubs Showcase */}
      <section className="section" id="clubs">
        <div className="section-header">
          <div>
            <h2>🛡️ Worldwide Football Clubs</h2>
            <p className="muted">From Premier League and La Liga giants to South American & Asian champions</p>
          </div>
          <Link href="/clubs" className="see-all-link">
            View All {clubCount} Clubs <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid cols-4">
          {clubs.map((c) => (
            <Link className="card club-crest-card" href={`/club/${c.club_id}`} key={c.club_id}>
              <div className="club-color-strip" style={{
                background: `linear-gradient(90deg, ${c.primary_color ?? "#0b3d2e"} 50%, ${c.secondary_color ?? "#facc15"} 50%)`
              }} />
              <div className="club-crest-media">
                <EntityImage className="avatar club-avatar" src={c.logo} name={c.common_name} kind="club" />
              </div>
              <div className="club-crest-body">
                <h3>{c.common_name}</h3>
                <p className="club-league-line">
                  {c.country?.flag} {c.country_name} · {c.league?.league_name ?? "Top League"}
                </p>
                <div className="club-stadium-line">
                  <span>🏟️ {c.stadium ?? "Home Arena"}</span>
                  {c.stadium_capacity && <span className="muted">({(c.stadium_capacity / 1000).toFixed(0)}k)</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Transfer Window & Match Quiz Challenge */}
      <section className="section grid cols-2">
        <div>
          <div className="section-header">
            <h2>🔄 Blockbuster Transfers</h2>
            <Link href="/compare" className="text-link">Compare Squads</Link>
          </div>
          <div className="grid">
            {transfers.map((transfer) => (
              <div className="card transfer-card" key={transfer.transfer_id}>
                <div className="transfer-player-info">
                  <strong>{transfer.player.common_name}</strong>
                  <span className="transfer-season-badge">{transfer.season}</span>
                </div>
                <div className="transfer-journey">
                  <span className="club-pill from">{transfer.fromClub.common_name}</span>
                  <span className="transfer-arrow">➔</span>
                  <span className="club-pill to">{transfer.toClub.common_name}</span>
                </div>
                <div className="transfer-meta">
                  <span className="fee-badge">
                    {transfer.transfer_fee && transfer.transfer_fee > 0
                      ? `€${(transfer.transfer_fee / 1000000).toFixed(0)}M`
                      : transfer.transfer_type === "FREE" ? "Free Transfer" : "Permanent"}
                  </span>
                  <span className="muted">{transfer.transfer_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-header">
            <h2>🏆 Matchday Quiz Challenge</h2>
            <Link href="/leaderboard" className="text-link">Leaderboard</Link>
          </div>
          <div className="card stadium-challenge-card">
            <div className="challenge-badge">7 INTERACTIVE GAME MODES</div>
            <h3>Test Your Football Knowledge</h3>
            <p className="muted">
              Can you identify players by their career journey, past transfer steps, current clubs, or teammates?
            </p>
            <div className="modes-chips">
              <span>Career Club</span>
              <span>Current Club</span>
              <span>Who Played Here</span>
              <span>Transfer Connections</span>
              <span>Two Clubs</span>
            </div>
            <div className="actions" style={{ marginTop: 20 }}>
              <Link className="button accent" href="/game">
                <Play size={18} /> Start Quiz Session
              </Link>
              <Link className="button secondary" href="/leaderboard">
                <Trophy size={18} /> View High Scores
              </Link>
            </div>
          </div>

          {featuredClub && (
            <Link className="card featured-club-banner" href={`/club/${featuredClub.club_id}`}>
              <EntityImage className="avatar club-avatar" src={featuredClub.logo} name={featuredClub.common_name} kind="club" />
              <div>
                <span className="badge-tag">SPOTLIGHT CLUB</span>
                <p className="featured-club-title">{featuredClub.common_name}</p>
                <p className="muted">{featuredClub.city}, {featuredClub.country_name} · {featuredClub.stadium}</p>
              </div>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
