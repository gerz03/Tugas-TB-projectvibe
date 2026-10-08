import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { playerStatisticImportSchema } from "@/lib/football-statistic-schema";

export type ImportReport = {
  source: string;
  records_seen: number;
  records_changed: number;
  status: "success" | "skipped" | "failed";
  error_message?: string;
};

const externalPlayerSchema = z.object({
  source_id: z.string().trim().min(1).max(160),
  full_name: z.string().trim().min(1).max(160),
  common_name: z.string().trim().min(1).max(120),
  nationality: z.string().trim().max(80).nullable().optional(),
  position: z.string().trim().max(80).nullable().optional(),
  date_of_birth: z.string().nullable().optional().refine((value) => !value || !Number.isNaN(Date.parse(value)), "date_of_birth must be a valid date."),
  profile_photo: z.string().url().nullable().optional(),
  current_club_id: z.string().trim().min(1).nullable().optional(),
  statistics: z.array(playerStatisticImportSchema).max(25).optional()
});

const externalPayloadSchema = z.object({
  data: z.array(externalPlayerSchema).max(1000)
});

export async function syncExternalFootballData(): Promise<ImportReport> {
  const configuredBaseUrl = process.env.FOOTBALL_API_BASE_URL?.trim();
  const apiKey = process.env.FOOTBALL_API_KEY;
  const source = configuredBaseUrl ? new URL(configuredBaseUrl).origin : "No external API configured";
  const log = await prisma.syncLog.create({ data: { source, status: "running" } });

  if (!configuredBaseUrl || !apiKey) {
    const message = "FOOTBALL_API_BASE_URL and FOOTBALL_API_KEY must both be configured.";
    await prisma.syncLog.update({
      where: { sync_id: log.sync_id },
      data: { status: "skipped", finished_at: new Date(), error_message: message }
    });
    return { source, records_seen: 0, records_changed: 0, status: "skipped", error_message: "External API is not configured; existing data was retained." };
  }

  try {
    const baseUrl = configuredBaseUrl.endsWith("/") ? configuredBaseUrl : `${configuredBaseUrl}/`;
    const response = await fetch(new URL("players", baseUrl), {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) throw new Error(`External API returned HTTP ${response.status}.`);

    const payload = externalPayloadSchema.parse(await response.json());
    const changed = await prisma.$transaction(async (transaction) => {
      let count = 0;
      for (const player of payload.data) {
        const existing = await transaction.player.findFirst({
          where: { source, source_id: player.source_id },
          select: { player_id: true }
        });
        const data = {
          full_name: player.full_name,
          common_name: player.common_name,
          ...(player.nationality !== undefined ? { nationality: player.nationality } : {}),
          ...(player.position !== undefined ? { position: player.position } : {}),
          ...(player.date_of_birth !== undefined ? { date_of_birth: player.date_of_birth ? new Date(player.date_of_birth) : null } : {}),
          ...(player.profile_photo !== undefined ? { profile_photo: player.profile_photo } : {}),
          ...(player.current_club_id !== undefined ? { current_club_id: player.current_club_id } : {}),
          source,
          source_id: player.source_id,
          last_updated: new Date()
        };
        let playerId: string;
        let currentClubId: string | null;
        if (existing) {
          const updatedPlayer = await transaction.player.update({ where: { player_id: existing.player_id }, data });
          playerId = updatedPlayer.player_id;
          currentClubId = updatedPlayer.current_club_id;
        } else {
          const createdPlayer = await transaction.player.create({ data });
          playerId = createdPlayer.player_id;
          currentClubId = createdPlayer.current_club_id;
        }
        count += 1;

        for (const statistic of player.statistics ?? []) {
          const statisticData = {
            player_id: playerId,
            club_id: statistic.club_id ?? (statistic.team_type === "club" ? currentClubId : null),
            season: statistic.season,
            competition: statistic.competition,
            team_type: statistic.team_type,
            ...(statistic.appearances !== undefined ? { appearances: statistic.appearances } : {}),
            ...(statistic.starts !== undefined ? { starts: statistic.starts } : {}),
            ...(statistic.minutes_played !== undefined ? { minutes_played: statistic.minutes_played } : {}),
            ...(statistic.goals !== undefined ? { goals: statistic.goals } : {}),
            ...(statistic.assists !== undefined ? { assists: statistic.assists } : {}),
            ...(statistic.yellow_cards !== undefined ? { yellow_cards: statistic.yellow_cards } : {}),
            ...(statistic.red_cards !== undefined ? { red_cards: statistic.red_cards } : {}),
            ...(statistic.clean_sheets !== undefined ? { clean_sheets: statistic.clean_sheets } : {}),
            ...(statistic.shots !== undefined ? { shots: statistic.shots } : {}),
            ...(statistic.shots_on_target !== undefined ? { shots_on_target: statistic.shots_on_target } : {}),
            ...(statistic.passes !== undefined ? { passes: statistic.passes } : {}),
            ...(statistic.key_passes !== undefined ? { key_passes: statistic.key_passes } : {}),
            ...(statistic.tackles !== undefined ? { tackles: statistic.tackles } : {}),
            ...(statistic.interceptions !== undefined ? { interceptions: statistic.interceptions } : {}),
            ...(statistic.duels_won !== undefined ? { duels_won: statistic.duels_won } : {}),
            ...(statistic.dribbles !== undefined ? { dribbles: statistic.dribbles } : {}),
            ...(statistic.penalties !== undefined ? { penalties: statistic.penalties } : {}),
            ...(statistic.own_goals !== undefined ? { own_goals: statistic.own_goals } : {}),
            ...(statistic.fouls !== undefined ? { fouls: statistic.fouls } : {}),
            source,
            source_id: statistic.source_id,
            last_updated: new Date()
          };
          const existingStatistic = await transaction.playerStatistic.findFirst({
            where: { source, source_id: statistic.source_id },
            select: { stat_id: true }
          });
          if (existingStatistic) {
            await transaction.playerStatistic.update({ where: { stat_id: existingStatistic.stat_id }, data: statisticData });
          } else {
            await transaction.playerStatistic.create({ data: statisticData });
          }
          count += 1;
        }
      }
      return count;
    });

    const recordsSeen = payload.data.reduce((count, player) => count + 1 + (player.statistics?.length ?? 0), 0);
    await prisma.syncLog.update({
      where: { sync_id: log.sync_id },
      data: { status: "success", finished_at: new Date(), records_seen: recordsSeen, records_changed: changed }
    });
    return { source, records_seen: recordsSeen, records_changed: changed, status: "success" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown external sync error.";
    await prisma.syncLog.update({
      where: { sync_id: log.sync_id },
      data: { status: "failed", finished_at: new Date(), error_message: message }
    });
    return { source, records_seen: 0, records_changed: 0, status: "failed", error_message: message };
  }
}
