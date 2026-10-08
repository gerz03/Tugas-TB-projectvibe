import Link from "next/link";
import { BarChart3, Home, Shield, Users, Gamepad2, Medal, GitCompare, User } from "lucide-react";

const nav = [
  ["Home", "/", Home],
  ["Players", "/players", Users],
  ["Clubs", "/clubs", Shield],
  ["Compare", "/compare", GitCompare],
  ["Match The Player", "/game", Gamepad2],
  ["Leaderboard", "/leaderboard", Medal],
  ["Account", "/profile", User],
  ["Admin", "/admin", BarChart3]
] as const;

export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-crest" aria-hidden="true">⚽</span>
          <div className="brand-text">
            <span className="brand-title">FOOTBALL</span>
            <span className="brand-subtitle">IDENTITY CLUB</span>
          </div>
        </Link>

        <div className="sidebar-badge">
          <span className="pulse-dot"></span>
          <span>LIVE FOOTBALL DB</span>
        </div>

        <nav aria-label="Main navigation" className="sidebar-nav">
          {nav.map(([label, href, Icon]) => (
            <Link className="nav-link" href={href} key={label}>
              <Icon size={18} className="nav-icon" /> <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer-card">
          <div className="stadium-badge">
            <span className="stadium-icon">🏟️</span>
            <div>
              <p className="stadium-label">GLOBAL LEAGUES</p>
              <p className="stadium-desc">25 Clubs · 35 Superstars</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="content">
        <div className="matchday-ticker">
          <span className="ticker-tag">MATCHDAY INTELLIGENCE</span>
          <span className="ticker-text">
            ⚽ Explore worldwide football clubs & legendary players · Verified career histories, club crests & season stats
          </span>
        </div>
        {children}
        <footer className="app-footer">
          <div className="footer-links">
            <Link href="/players">Browse 35+ Players</Link>
            <span className="dot-sep">•</span>
            <Link href="/clubs">Browse 25+ Worldwide Clubs</Link>
            <span className="dot-sep">•</span>
            <Link href="/game">Match The Player Quiz</Link>
            <span className="dot-sep">•</span>
            <Link href="/image-credits">Image credits and licenses</Link>
          </div>
          <p className="muted footer-copy">© 2026 Football Identity Club Encyclopedia. All logos & player portraits belong to respective federations and public commons.</p>
        </footer>
      </main>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        <Link href="/"><Home size={18} /><span>Home</span></Link>
        <Link href="/players"><Users size={18} /><span>Players</span></Link>
        <Link href="/clubs"><Shield size={18} /><span>Clubs</span></Link>
        <Link href="/game"><Gamepad2 size={18} /><span>Game</span></Link>
        <Link href="/profile"><User size={18} /><span>Account</span></Link>
      </nav>
    </div>
  );
}
