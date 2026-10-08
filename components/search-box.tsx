"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type SearchItem = {
  type: string;
  label: string;
  href: string;
  meta: string;
};

type SearchPayload = {
  players?: { player_id: string; common_name: string; nationality: string | null; current_club: { common_name: string } | null }[];
  clubs?: { club_id: string; common_name: string; country_name: string | null; league: { league_name: string } | null }[];
  leagues?: { league_id: string; league_name: string; season: string | null }[];
  countries?: { country_id: string; country_name: string; continent: string }[];
  competitions?: { competition_id: string; competition_name: string; season: string | null }[];
};

function getSearchItems(results: SearchPayload): SearchItem[] {
  return [
    ...(results.players ?? []).map((player) => ({
      type: "Player",
      label: player.common_name,
      href: `/player/${player.player_id}`,
      meta: `${player.nationality ?? "Nationality unavailable"} · ${player.current_club?.common_name ?? "No current club"}`
    })),
    ...(results.clubs ?? []).map((club) => ({
      type: "Club",
      label: club.common_name,
      href: `/club/${club.club_id}`,
      meta: `${club.country_name ?? "Country unavailable"} · ${club.league?.league_name ?? "No league"}`
    })),
    ...(results.leagues ?? []).map((league) => ({
      type: "League",
      label: league.league_name,
      href: `/league/${league.league_id}`,
      meta: league.season ?? "Season unavailable"
    })),
    ...(results.countries ?? []).map((country) => ({
      type: "Country",
      label: country.country_name,
      href: `/country/${country.country_id}`,
      meta: country.continent
    })),
    ...(results.competitions ?? []).map((competition) => ({
      type: "Competition",
      label: competition.competition_name,
      href: `/competition/${competition.competition_id}`,
      meta: competition.season ?? "Season unavailable"
    }))
  ];
}

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "Search is temporarily unavailable.");
        }
        setResults(payload.data as SearchPayload);
      } catch (searchError) {
        if (searchError instanceof Error && searchError.name === "AbortError") return;
        setResults(null);
        setError(searchError instanceof Error ? searchError.message : "Search is temporarily unavailable.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const items = results ? getSearchItems(results) : [];
  const isOpen = query.trim().length >= 2;

  return (
    <div className="search-box">
      <div className="search-input-wrap">
        <Search size={18} aria-hidden="true" />
        <input
          aria-label="Search football records"
          aria-expanded={isOpen}
          aria-controls="search-results"
          className="search"
          placeholder="Search players, clubs, leagues, countries..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setQuery("");
              setResults(null);
            }
          }}
        />
      </div>
      {isOpen && (
        <div className="search-results card" id="search-results" role="region" aria-label="Search results">
          {loading && <p className="muted search-message" role="status">Searching football records…</p>}
          {error && <p className="search-message" role="alert">{error}</p>}
          {!loading && !error && results && items.length === 0 && (
            <p className="muted search-message">No matching players, clubs, leagues, countries, or competitions.</p>
          )}
          {!loading && items.map((item) => (
            <Link
              href={item.href}
              key={`${item.type}-${item.href}`}
              className="search-result"
              onClick={() => setQuery("")}
            >
              <strong>{item.label}</strong> <span className="muted">({item.type})</span>
              <span className="muted search-result-meta">{item.meta}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
