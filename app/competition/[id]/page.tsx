import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const competition = await prisma.competition.findUnique({ where: { competition_id: id }, include: { league: true } });
  if (!competition) notFound();

  return (
    <section className="card">
      <p className="muted">{competition.type}</p>
      <h1>{competition.competition_name}</h1>
      <p>Season: {competition.season ?? "Not specified"}</p>
      {competition.league && <p>League: {competition.league.league_name}</p>}
      <p className="muted">Source: {competition.source ?? "Data not available"}</p>
    </section>
  );
}
