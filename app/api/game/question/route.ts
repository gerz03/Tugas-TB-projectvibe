import { z } from "zod";
import { cookies } from "next/headers";
import { fail, handleError, ok } from "@/lib/api";
import { buildQuestion, difficultySeconds, isDifficulty, isGameMode } from "@/lib/game-engine";
import { readSession } from "@/lib/auth";
import { sessionCookieName } from "@/lib/session-cookie";
import { prisma } from "@/lib/prisma";

const gameModeValues = ["CURRENT_CLUB", "CAREER_CLUB", "WHO_PLAYED_HERE", "CAREER_PATH", "TWO_CLUBS", "TRANSFER_CONNECTION", "COUNTRY_CHALLENGE"] as const;
const difficultyValues = ["EASY", "MEDIUM", "HARD", "EXPERT"] as const;

const schema = z.object({
  sessionId: z.string().optional(),
  username: z.string().trim().min(1).max(24).default("Guest"),
  mode: z.enum(gameModeValues).default("CAREER_CLUB"),
  difficulty: z.enum(difficultyValues).default("EASY"),
  questionNo: z.number().int().min(1).max(20).default(1)
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const cookieStore = await cookies();
    const authenticatedSession = await readSession(cookieStore.get(sessionCookieName)?.value);
    const account = authenticatedSession
      ? await prisma.user.findUnique({ where: { user_id: authenticatedSession.user_id }, select: { user_id: true, username: true } })
      : null;
    if (authenticatedSession && !account) return fail("Account no longer exists. Please sign in again.", 401);
    const session = input.sessionId
      ? await prisma.gameSession.findUnique({ where: { session_id: input.sessionId } })
      : await prisma.gameSession.create({
          data: {
            user_id: account?.user_id,
            username: account?.username ?? input.username,
            mode: input.mode,
            difficulty: input.difficulty,
            seed: crypto.randomUUID(),
            question_started_at: new Date()
          }
        });
    if (!session) return fail("Game session not found.", 404);
    if (session.user_id && session.user_id !== account?.user_id) return fail("This game session belongs to a different account.", 403);
    if (!isGameMode(session.mode) || !isDifficulty(session.difficulty)) return fail("Game session contains an unsupported mode or difficulty.", 422);
    if (session.completed_at) return fail("This game session is already complete.", 409);
    if (input.questionNo !== session.active_question_no) return fail("Question number does not match the active game question.", 409);

    let questionStartedAt = session.question_started_at;
    if (!questionStartedAt) {
      questionStartedAt = new Date();
      await prisma.gameSession.updateMany({
        where: { session_id: session.session_id, active_question_no: input.questionNo, question_started_at: null },
        data: { question_started_at: questionStartedAt }
      });
      const refreshedSession = await prisma.gameSession.findUniqueOrThrow({ where: { session_id: session.session_id } });
      questionStartedAt = refreshedSession.question_started_at ?? questionStartedAt;
    }

    const question = await buildQuestion(prisma, session.mode, session.difficulty, input.questionNo, session.seed);
    const elapsedSeconds = Math.floor((Date.now() - questionStartedAt.getTime()) / 1000);
    const timer = Math.max(0, difficultySeconds[session.difficulty] - elapsedSeconds);
    const { correct_ref_id: _correctRefId, ...publicQuestion } = question;
    return ok({ sessionId: session.session_id, questionNo: input.questionNo, ...publicQuestion, timer, dataPolicy: "Generated from database records; no hard-coded question list." });
  } catch (error) {
    return handleError(error);
  }
}
