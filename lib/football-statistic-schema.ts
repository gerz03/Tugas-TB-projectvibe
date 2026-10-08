import { z } from "zod";

export const playerStatisticImportSchema = z.object({
  source_id: z.string().trim().min(1).max(160),
  season: z.string().trim().min(1).max(40),
  competition: z.string().trim().min(1).max(120),
  team_type: z.enum(["club", "national"]).default("club"),
  club_id: z.string().trim().min(1).nullable().optional(),
  appearances: z.number().int().min(0).nullable().optional(),
  starts: z.number().int().min(0).nullable().optional(),
  minutes_played: z.number().int().min(0).nullable().optional(),
  goals: z.number().int().min(0).nullable().optional(),
  assists: z.number().int().min(0).nullable().optional(),
  yellow_cards: z.number().int().min(0).nullable().optional(),
  red_cards: z.number().int().min(0).nullable().optional(),
  clean_sheets: z.number().int().min(0).nullable().optional(),
  shots: z.number().int().min(0).nullable().optional(),
  shots_on_target: z.number().int().min(0).nullable().optional(),
  passes: z.number().int().min(0).nullable().optional(),
  key_passes: z.number().int().min(0).nullable().optional(),
  tackles: z.number().int().min(0).nullable().optional(),
  interceptions: z.number().int().min(0).nullable().optional(),
  duels_won: z.number().int().min(0).nullable().optional(),
  dribbles: z.number().int().min(0).nullable().optional(),
  penalties: z.number().int().min(0).nullable().optional(),
  own_goals: z.number().int().min(0).nullable().optional(),
  fouls: z.number().int().min(0).nullable().optional()
});
