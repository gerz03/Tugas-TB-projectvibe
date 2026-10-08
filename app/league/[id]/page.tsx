import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EntityImage } from "@/components/entity-image";

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const league = await prisma.league.findUnique({
    where: { league_id: id },
    include: { country: true, clubs: { orderBy: { common_name: "asc" } } }
  });
  if (!league) notFound();

  return (
    <>
      <section className="card identity">
        <EntityImage className="avatar" src={league.logo} name={league.league_name} kind="club" />
        <div>
          <p className="muted">{league.country?.country_name ?? "Country unavailable"}</p>
          <h1>{league.league_name}</h1>
          <p>Season: {league.season ?? "Not specified"} · Founded: {league.founded ?? "Not available"}</p>
          <p className="muted">Source: {league.source ?? "Data not available"}</p>
        </div>
      </section>
      <section className="section">
        <h2>Clubs</h2>
        {league.clubs.length === 0 ? <div className="card">No clubs are linked to this league yet.</div> : (
          <div className="grid cols-4">
            {league.clubs.map((club) => (
              <Link className="card record-card" href={`/club/${club.club_id}`} key={club.club_id}>
                <EntityImage className="avatar" src={club.logo} name={club.common_name} kind="club" />
                <h3>{club.common_name}</h3>
                <p className="muted">{club.city ?? club.country_name ?? "Club record"}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
