import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EntityImage } from "@/components/entity-image";

export default async function CountryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const country = await prisma.country.findUnique({
    where: { country_id: id },
    include: { leagues: { orderBy: { league_name: "asc" } }, clubs: { orderBy: { common_name: "asc" } } }
  });
  if (!country) notFound();

  return (
    <>
      <section className="card">
        <p className="muted">{country.continent}</p>
        <h1>{country.flag} {country.country_name}</h1>
        <p>Country code: {country.country_code}{country.fifa_code ? ` · FIFA: ${country.fifa_code}` : ""}</p>
        <p className="muted">Source: {country.source ?? "Data not available"}</p>
      </section>
      <section className="section">
        <h2>Leagues</h2>
        {country.leagues.length === 0 ? <div className="card">No league records are available.</div> : (
          <div className="grid cols-4">
            {country.leagues.map((league) => (
              <Link className="card record-card" href={`/league/${league.league_id}`} key={league.league_id}>
                <h3>{league.league_name}</h3><p className="muted">{league.season ?? "Season unavailable"}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="section">
        <h2>Clubs</h2>
        {country.clubs.length === 0 ? <div className="card">No club records are available.</div> : (
          <div className="grid cols-4">
            {country.clubs.map((club) => (
              <Link className="card record-card" href={`/club/${club.club_id}`} key={club.club_id}>
                <EntityImage className="avatar" src={club.logo} name={club.common_name} kind="club" /><h3>{club.common_name}</h3>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
