"use client";

import { useEffect, useState } from "react";
import { StatBars } from "@/components/stat-bars";
import { EntityImage } from "@/components/entity-image";

type EntityType = "player" | "club";
type SearchPlayer = { player_id: string; common_name: string; nationality: string | null; current_club: { common_name: string } | null };
type SearchClub = { club_id: string; common_name: string; country_name: string | null; league: { league_name: string } | null };
type SearchPayload = { players?: SearchPlayer[]; clubs?: SearchClub[] };

type PlayerComparison = {
  player_id: string;
  common_name: string;
  position: string | null;
  age: number | null;
  height: number | null;
  current_club: { common_name: string } | null;
  profile_photo: string | null;
  statistics: { appearances: number; goals: number; assists: number; minutes_played: number; shots: number; passes: number; dribbles: number; tackles: number }[];
};
type ClubComparison = {
  club_id: string;
  common_name: string;
  founded: number | null;
  logo: string | null;
  league: { league_name: string } | null;
  players: { player_id: string }[];
  statistics: { wins: number; losses: number; goals_for: number; trophies: number; league_position: number }[];
  trophies: { trophy_id: string }[];
};
type Comparison = PlayerComparison | ClubComparison;

function useSearch(query: string, type: EntityType) {
  const [items, setItems] = useState<SearchPayload>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setItems({});
      setError("");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalized)}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok || !payload.data) throw new Error(payload.error ?? "Could not search records.");
        setItems(payload.data as SearchPayload);
        setError("");
      } catch (searchError) {
        if (searchError instanceof Error && searchError.name === "AbortError") return;
        setItems({});
        setError(searchError instanceof Error ? searchError.message : "Could not search records.");
      }
    }, 200);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, type]);

  return { items: type === "player" ? items.players ?? [] : items.clubs ?? [], error };
}

function ComparisonCard({ record, type }: { record: Comparison; type: EntityType }) {
  if (type === "player") {
    const player = record as PlayerComparison;
    const stats = player.statistics[0];
    return (
      <div className="card">
        <EntityImage className="compare-image" src={player.profile_photo} name={player.common_name} kind="player" />
        <h2>{player.common_name}</h2>
        <p className="muted">{player.position ?? "Position unavailable"} · {player.current_club?.common_name ?? "No current club"}</p>
        <StatBars rows={[
          { label: "Age", value: player.age ?? 0 },
          { label: "Height", value: player.height ?? 0 },
          { label: "Matches", value: stats?.appearances ?? 0 },
          { label: "Goals", value: stats?.goals ?? 0 },
          { label: "Assists", value: stats?.assists ?? 0 },
          { label: "Minutes", value: stats?.minutes_played ?? 0 },
          { label: "Shots", value: stats?.shots ?? 0 },
          { label: "Passes", value: stats?.passes ?? 0 },
          { label: "Dribbles", value: stats?.dribbles ?? 0 },
          { label: "Tackles", value: stats?.tackles ?? 0 }
        ]} />
      </div>
    );
  }

  const club = record as ClubComparison;
  const stats = club.statistics[0];
  return (
    <div className="card">
      <EntityImage className="compare-crest" src={club.logo} name={club.common_name} kind="club" />
      <h2>{club.common_name}</h2>
      <p className="muted">{club.league?.league_name ?? "No league"} · Founded {club.founded ?? "not available"}</p>
      <StatBars rows={[
        { label: "Squad", value: club.players.length },
        { label: "Wins", value: stats?.wins ?? 0 },
        { label: "Losses", value: stats?.losses ?? 0 },
        { label: "Goals", value: stats?.goals_for ?? 0 },
        { label: "Trophies", value: stats?.trophies ?? club.trophies.length },
        { label: "League position", value: stats?.league_position ?? 0 }
      ]} />
    </div>
  );
}

export function CompareExplorer() {
  const [type, setType] = useState<EntityType>("player");
  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");
  const [comparison, setComparison] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resultA = useSearch(queryA, type);
  const resultB = useSearch(queryB, type);

  async function compare() {
    if (!selectedA || !selectedB || selectedA === selectedB) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/compare?type=${type}&a=${encodeURIComponent(selectedA)}&b=${encodeURIComponent(selectedB)}`);
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload.data?.items) || payload.data.items.length !== 2) {
        throw new Error(payload.error ?? "Could not load both records for comparison.");
      }
      setComparison(payload.data.items as Comparison[]);
    } catch (compareError) {
      setComparison([]);
      setError(compareError instanceof Error ? compareError.message : "Could not compare these records.");
    } finally {
      setLoading(false);
    }
  }

  function changeType(nextType: EntityType) {
    setType(nextType);
    setSelectedA("");
    setSelectedB("");
    setComparison([]);
    setError("");
  }

  const optionsA = type === "player" ? resultA.items as SearchPlayer[] : resultA.items as SearchClub[];
  const optionsB = type === "player" ? resultB.items as SearchPlayer[] : resultB.items as SearchClub[];

  return (
    <>
      <section className="card section">
        <label htmlFor="compare-type">Compare records</label>
        <select id="compare-type" className="search compare-type" value={type} onChange={(event) => changeType(event.target.value as EntityType)}>
          <option value="player">Players</option>
          <option value="club">Clubs</option>
        </select>
        <div className="grid cols-2 compare-pickers">
          <div>
            <label htmlFor="compare-search-a">First {type}</label>
            <input id="compare-search-a" className="search" value={queryA} onChange={(event) => { setQueryA(event.target.value); setSelectedA(""); }} placeholder={`Search ${type} by name`} />
            <label className="sr-only" htmlFor="compare-select-a">Choose first {type}</label>
            <select id="compare-select-a" className="search" value={selectedA} onChange={(event) => setSelectedA(event.target.value)}>
              <option value="">Choose a record</option>
              {type === "player"
                ? (optionsA as SearchPlayer[]).map((player) => <option value={player.player_id} key={player.player_id}>{player.common_name}</option>)
                : (optionsA as SearchClub[]).map((club) => <option value={club.club_id} key={club.club_id}>{club.common_name}</option>)}
            </select>
            {resultA.error && <p role="alert">{resultA.error}</p>}
          </div>
          <div>
            <label htmlFor="compare-search-b">Second {type}</label>
            <input id="compare-search-b" className="search" value={queryB} onChange={(event) => { setQueryB(event.target.value); setSelectedB(""); }} placeholder={`Search ${type} by name`} />
            <label className="sr-only" htmlFor="compare-select-b">Choose second {type}</label>
            <select id="compare-select-b" className="search" value={selectedB} onChange={(event) => setSelectedB(event.target.value)}>
              <option value="">Choose a record</option>
              {type === "player"
                ? (optionsB as SearchPlayer[]).map((player) => <option value={player.player_id} key={player.player_id}>{player.common_name}</option>)
                : (optionsB as SearchClub[]).map((club) => <option value={club.club_id} key={club.club_id}>{club.common_name}</option>)}
            </select>
            {resultB.error && <p role="alert">{resultB.error}</p>}
          </div>
        </div>
        <button className="button section" type="button" disabled={loading || !selectedA || !selectedB || selectedA === selectedB} onClick={() => void compare()}>
          {loading ? "Comparing…" : "Compare selected records"}
        </button>
        {error && <p className="section" role="alert">{error}</p>}
      </section>
      {comparison.length > 0 && (
        <section className="section grid cols-2" aria-label="Comparison results">
          {comparison.map((record) => (
            <ComparisonCard
              key={type === "player" ? (record as PlayerComparison).player_id : (record as ClubComparison).club_id}
              record={record}
              type={type}
            />
          ))}
        </section>
      )}
    </>
  );
}
