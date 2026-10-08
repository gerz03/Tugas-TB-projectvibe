import type { PrismaClient } from "@prisma/client";

export const gameModes = [
  "CURRENT_CLUB",
  "CAREER_CLUB",
  "WHO_PLAYED_HERE",
  "CAREER_PATH",
  "TWO_CLUBS",
  "TRANSFER_CONNECTION",
  "COUNTRY_CHALLENGE"
] as const;
export const difficulties = ["EASY", "MEDIUM", "HARD", "EXPERT"] as const;

export type Difficulty = (typeof difficulties)[number];
export type GameMode = (typeof gameModes)[number];

type ClubRecord = {
  club_id: string;
  common_name: string;
  logo: string | null;
  country_name: string | null;
};

type CareerRecord = { club: ClubRecord };
type CountryRecord = { country_id: string; country_name: string; flag: string | null; continent: string };
type PlayerRecord = {
  player_id: string;
  common_name: string;
  profile_photo: string | null;
  position: string | null;
  nationality: string | null;
  current_club: ClubRecord | null;
  country: CountryRecord | null;
  careers: CareerRecord[];
};
type QuestionOption = { id: string; label: string };

export type GameQuestion = {
  prompt: string;
  subject: { type: string; id: string; name: string; image: string | null; meta: string };
  options: QuestionOption[];
  correct_ref_id: string;
  timer: number;
  player_id?: string;
  club_id?: string;
};

export const difficultySeconds: Record<Difficulty, number> = {
  EASY: 20,
  MEDIUM: 15,
  HARD: 12,
  EXPERT: 10
};

export function isGameMode(value: string): value is GameMode {
  return (gameModes as readonly string[]).includes(value);
}

export function isDifficulty(value: string): value is Difficulty {
  return (difficulties as readonly string[]).includes(value);
}

export function scoreAnswer(isCorrect: boolean, streak: number, timeLeftSeconds: number) {
  if (!isCorrect) return -25;
  const streakBonus = streak >= 2 ? 50 : 0;
  const timeBonus = Math.max(10, Math.min(100, timeLeftSeconds * 5));
  return 100 + streakBonus + timeBonus;
}

function shuffle<T>(items: T[], seed: string) {
  const copy = [...items];
  let value = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0) || 1;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    value = (value * 9301 + 49297) % 233280;
    const j = Math.floor((value / 233280) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function playerOptions(players: PlayerRecord[], correctPlayer: PlayerRecord, seed: string, eligible = players) {
  const eligibleIds = new Set(eligible.map((player) => player.player_id));
  const validAlternatives = eligible.filter((player) => player.player_id !== correctPlayer.player_id);
  const fallbackAlternatives = players.filter((player) => player.player_id !== correctPlayer.player_id && !eligibleIds.has(player.player_id));
  const alternatives = shuffle([...validAlternatives, ...fallbackAlternatives], seed).slice(0, 3);
  return shuffle(
    [
      { id: correctPlayer.player_id, label: correctPlayer.common_name },
      ...alternatives.map((player) => ({ id: player.player_id, label: player.common_name }))
    ],
    `${seed}-order`
  );
}

export async function buildQuestion(
  db: PrismaClient,
  mode: GameMode,
  difficulty: Difficulty,
  questionNo: number,
  seed: string
): Promise<GameQuestion> {
  const minPopularity = difficulty === "EASY" ? 80 : difficulty === "MEDIUM" ? 60 : difficulty === "HARD" ? 35 : 0;
  const players: PlayerRecord[] = await db.player.findMany({
    where: { popularity: { gte: minPopularity }, careers: { some: {} } },
    include: {
      current_club: true,
      country: true,
      careers: { include: { club: true }, orderBy: { start_date: "asc" } }
    },
    take: 100
  });
  if (players.length === 0) throw new Error("Not enough player career records to generate a question.");

  const clubs: ClubRecord[] = await db.club.findMany({ take: 200 });
  const picked = shuffle(players, `${seed}-${mode}-${questionNo}`)[0];
  if (!picked) throw new Error("No eligible player was found for this question.");

  if (mode === "CURRENT_CLUB") {
    const eligible = players.filter((player) => player.current_club);
    const player = shuffle(eligible, `${seed}-current-${questionNo}`)[0];
    if (!player?.current_club) throw new Error("No eligible player has a current club record.");
    const correct = player.current_club;
    const distractors = shuffle(clubs.filter((club) => club.club_id !== correct.club_id), `${seed}-clubs-${questionNo}`).slice(0, 3);
    return {
      prompt: "Which club is this player currently playing for?",
      subject: { type: "player", id: player.player_id, name: player.common_name, image: player.profile_photo, meta: player.position ?? "Position unavailable" },
      options: shuffle([{ id: correct.club_id, label: correct.common_name }, ...distractors.map((club) => ({ id: club.club_id, label: club.common_name }))], `${seed}-options-${questionNo}`),
      correct_ref_id: correct.club_id,
      timer: difficultySeconds[difficulty],
      player_id: player.player_id
    };
  }

  if (mode === "WHO_PLAYED_HERE") {
    const eligible = players.filter((player) => player.careers.length > 0);
    const player = shuffle(eligible, `${seed}-who-${questionNo}`)[0];
    const club = player?.careers[player.careers.length - 1]?.club;
    if (!player || !club) throw new Error("No eligible player career exists for this question.");
    const playedHere = players.filter((candidate) => candidate.careers.some((career) => career.club.club_id === club.club_id));
    const options = playerOptions(players, player, `${seed}-players-${questionNo}`, playedHere);
    return {
      prompt: `Which player has played for ${club.common_name}?`,
      subject: { type: "club", id: club.club_id, name: club.common_name, image: club.logo, meta: club.country_name ?? "Club record" },
      options,
      correct_ref_id: player.player_id,
      timer: difficultySeconds[difficulty],
      club_id: club.club_id
    };
  }

  if (mode === "CAREER_PATH") {
    const path = picked.careers.map((career) => career.club.common_name).join(" → ");
    return {
      prompt: "Which player matches this career path?",
      subject: { type: "career_path", id: picked.player_id, name: path, image: null, meta: "Career timeline" },
      options: playerOptions(players, picked, `${seed}-path-${questionNo}`),
      correct_ref_id: picked.player_id,
      timer: difficultySeconds[difficulty],
      player_id: picked.player_id
    };
  }

  if (mode === "TWO_CLUBS") {
    const eligible = players.filter((player) => new Set(player.careers.map((career) => career.club.club_id)).size >= 2);
    const player = shuffle(eligible, `${seed}-two-${questionNo}`)[0];
    if (!player) throw new Error("At least one player with two recorded clubs is required for this mode.");
    const pathClubs = [...new Map(player.careers.map((career) => [career.club.club_id, career.club])).values()];
    const pair = shuffle(pathClubs, `${seed}-pair-${questionNo}`).slice(0, 2);
    const [first, second] = pair;
    if (!first || !second) throw new Error("Could not find two distinct clubs for this career.");
    return {
      prompt: "Who has represented both clubs?",
      subject: { type: "club_pair", id: player.player_id, name: `${first.common_name} and ${second.common_name}`, image: null, meta: "Select the player who played for both clubs" },
      options: playerOptions(players, player, `${seed}-two-options-${questionNo}`),
      correct_ref_id: player.player_id,
      timer: difficultySeconds[difficulty],
      player_id: player.player_id
    };
  }

  if (mode === "TRANSFER_CONNECTION") {
    const transfers = await db.transfer.findMany({
      include: { player: true, fromClub: true, toClub: true },
      take: 200
    });
    const transfer = shuffle(transfers, `${seed}-transfer-${questionNo}`)[0];
    if (!transfer) throw new Error("No transfer records are available for this mode.");
    const candidates = players.filter((player) => player.player_id !== transfer.player_id);
    const options = shuffle([
      { id: transfer.player.player_id, label: transfer.player.common_name },
      ...shuffle(candidates, `${seed}-transfer-options-${questionNo}`).slice(0, 3).map((player) => ({ id: player.player_id, label: player.common_name }))
    ], `${seed}-transfer-order-${questionNo}`);
    return {
      prompt: "Which player made this transfer?",
      subject: {
        type: "transfer",
        id: transfer.transfer_id,
        name: `${transfer.fromClub.common_name} → ${transfer.toClub.common_name}`,
        image: null,
        meta: transfer.season ?? "Transfer record"
      },
      options,
      correct_ref_id: transfer.player.player_id,
      timer: difficultySeconds[difficulty],
      player_id: transfer.player.player_id
    };
  }

  if (mode === "COUNTRY_CHALLENGE") {
    const eligible = players.filter((player) => player.country);
    const player = shuffle(eligible, `${seed}-country-player-${questionNo}`)[0];
    if (!player?.country) throw new Error("No player nationality records are available for this mode.");
    const countries: CountryRecord[] = await db.country.findMany({ take: 200 });
    const correct = player.country;
    const options = shuffle([
      { id: correct.country_id, label: correct.country_name },
      ...shuffle(countries.filter((country) => country.country_id !== correct.country_id), `${seed}-country-options-${questionNo}`)
        .slice(0, 3)
        .map((country) => ({ id: country.country_id, label: country.country_name }))
    ], `${seed}-country-order-${questionNo}`);
    return {
      prompt: "Which country does this player represent?",
      subject: { type: "player", id: player.player_id, name: player.common_name, image: player.profile_photo, meta: player.position ?? "Player profile" },
      options,
      correct_ref_id: correct.country_id,
      timer: difficultySeconds[difficulty],
      player_id: player.player_id
    };
  }

  const careerClub = picked.careers[picked.careers.length - 1]?.club;
  if (!careerClub) throw new Error("Selected player has no verified career club.");
  const careerDistractors = shuffle(clubs.filter((club) => club.club_id !== careerClub.club_id), `${seed}-career-clubs-${questionNo}`).slice(0, 3);
  return {
    prompt: "Which club has this player played for?",
    subject: { type: "player", id: picked.player_id, name: picked.common_name, image: picked.profile_photo, meta: picked.position ?? "Position unavailable" },
    options: shuffle([{ id: careerClub.club_id, label: careerClub.common_name }, ...careerDistractors.map((club) => ({ id: club.club_id, label: club.common_name }))], `${seed}-career-options-${questionNo}`),
    correct_ref_id: careerClub.club_id,
    timer: difficultySeconds[difficulty],
    player_id: picked.player_id
  };
}
