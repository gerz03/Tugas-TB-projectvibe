import { z } from "zod";
import { handleError, ok } from "@/lib/api";
import { requireAdminApiKey } from "@/lib/admin-auth";
import { playerStatisticImportSchema } from "@/lib/football-statistic-schema";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  players: z.array(z.object({
    full_name: z.string().trim().min(1).max(160),
    common_name: z.string().trim().min(1).max(120),
    source_id: z.string().trim().min(1).max(160).optional(),
    nationality: z.string().trim().max(80).optional(),
    position: z.string().trim().max(80).optional(),
    date_of_birth: z.iso.date().optional(),
    current_club_id: z.string().trim().min(1).optional(),
    profile_photo: z.url().nullable().optional(),
    source: z.string().trim().min(1).max(120).default("Admin import"),
    statistics: z.array(playerStatisticImportSchema).max(25).optional()
  })).max(500).default([]),
  clubs: z.array(z.object({
    official_name: z.string().trim().min(1).max(180),
    common_name: z.string().trim().min(1).max(120),
    country_name: z.string().trim().max(80).optional(),
    city: z.string().trim().max(100).optional(),
    logo: z.url().nullable().optional(),
    website: z.url().nullable().optional(),
    source: z.string().trim().min(1).max(120).default("Admin import")
  })).max(500).default([])
});

export async function POST(request: Request) {
  const authorizationError = requireAdminApiKey(request);
  if (authorizationError) return authorizationError;
  try {
    const input = schema.parse(await request.json());
    const imported = await prisma.$transaction(async (transaction) => {
      let statisticCount = 0;
      for (const player of input.players) {
        const createdPlayer = await transaction.player.create({
          data: {
            full_name: player.full_name,
            common_name: player.common_name,
            source_id: player.source_id,
            nationality: player.nationality,
            position: player.position,
            date_of_birth: player.date_of_birth ? new Date(player.date_of_birth) : null,
            current_club_id: player.current_club_id,
            profile_photo: player.profile_photo,
            source: player.source
          }
        });
        for (const statistic of player.statistics ?? []) {
          await transaction.playerStatistic.create({
            data: {
              ...statistic,
              player_id: createdPlayer.player_id,
              club_id: statistic.club_id ?? (statistic.team_type === "club" ? player.current_club_id : null),
              source: player.source,
              last_updated: new Date()
            }
          });
          statisticCount += 1;
        }
      }
      for (const club of input.clubs) {
        await transaction.club.create({
          data: {
            official_name: club.official_name,
            common_name: club.common_name,
            country_name: club.country_name,
            city: club.city,
            logo: club.logo,
            website: club.website,
            source: club.source
          }
        });
      }
      return { statisticCount };
    });
    const recordsSeen = input.players.length + input.clubs.length + imported.statisticCount;
    return ok({
      records_seen: recordsSeen,
      records_changed: recordsSeen,
      players_imported: input.players.length,
      clubs_imported: input.clubs.length,
      statistics_imported: imported.statisticCount
    });
  } catch (error) {
    return handleError(error);
  }
}
