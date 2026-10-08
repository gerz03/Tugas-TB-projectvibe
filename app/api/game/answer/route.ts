import { z } from "zod";
import { fail, handleError, ok } from "@/lib/api";
import { buildQuestion, difficultySeconds, isDifficulty, isGameMode, scoreAnswer } from "@/lib/game-engine";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  sessionId: z.string(),
  questionNo: z.number().int().min(1).max(20),
  selectedRefId: z.string().max(100)
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const result = await prisma.$transaction(async (transaction) => {
      const session = await transaction.gameSession.findUnique({ where: { session_id: input.sessionId } });
      if (!session) return { ok: false as const, error: "Session not found", status: 404 as const };
      if (!isGameMode(session.mode) || !isDifficulty(session.difficulty)) return { ok: false as const, error: "Game session contains an unsupported mode or difficulty.", status: 422 as const };
      if (session.completed_at) return { ok: false as const, error: "This game session is already complete.", status: 409 as const };
      if (input.questionNo !== session.active_question_no) return { ok: false as const, error: "Question has already been answered or is not active.", status: 409 as const };
      if (!session.question_started_at) return { ok: false as const, error: "Question timer has not been initialized.", status: 409 as const };

      const question = await buildQuestion(prisma, session.mode, session.difficulty, input.questionNo, session.seed);
      const elapsedMs = Math.max(0, Date.now() - session.question_started_at.getTime());
      const timedOut = elapsedMs >= difficultySeconds[session.difficulty] * 1000;
      const isCorrect = !timedOut && input.selectedRefId === question.correct_ref_id;
      const timeLeftSeconds = Math.max(0, difficultySeconds[session.difficulty] - Math.ceil(elapsedMs / 1000));
      const nextStreak = isCorrect ? session.current_streak + 1 : 0;
      const points = scoreAnswer(isCorrect, nextStreak, timeLeftSeconds);
      const completed = input.questionNo >= session.total_questions;
      const now = new Date();

      await transaction.gameAnswer.create({
        data: {
          session_id: session.session_id,
          question_no: input.questionNo,
          mode: session.mode,
          correct_ref_id: question.correct_ref_id,
          selected_ref_id: input.selectedRefId || null,
          is_correct: isCorrect,
          points_delta: points,
          time_ms: elapsedMs,
          server_seed: session.seed,
          player_id: question.player_id ?? null,
          club_id: question.club_id ?? null
        }
      });
      const updated = await transaction.gameSession.update({
        where: { session_id: session.session_id },
        data: {
          score: { increment: points },
          current_streak: nextStreak,
          highest_streak: Math.max(session.highest_streak, nextStreak),
          correct_answers: { increment: isCorrect ? 1 : 0 },
          wrong_answers: { increment: isCorrect ? 0 : 1 },
          active_question_no: completed ? session.active_question_no : session.active_question_no + 1,
          question_started_at: completed ? null : now,
          completed_at: completed ? now : null
        }
      });
      if (session.user_id) {
        const user = await transaction.user.findUnique({ where: { user_id: session.user_id } });
        if (!user) throw new Error("Game session account no longer exists.");
        const totalAnswers = user.correct_answers + user.wrong_answers + 1;
        const correctAnswers = user.correct_answers + (isCorrect ? 1 : 0);
        const totalScore = user.total_score + points;
        const accuracy = Math.round((correctAnswers / totalAnswers) * 100);
        const completedGames = user.games_played + (completed ? 1 : 0);
        const highestStreak = Math.max(user.highest_streak, nextStreak);
        await transaction.user.update({
          where: { user_id: user.user_id },
          data: {
            total_score: { increment: points },
            games_played: { increment: completed ? 1 : 0 },
            correct_answers: { increment: isCorrect ? 1 : 0 },
            wrong_answers: { increment: isCorrect ? 0 : 1 },
            accuracy,
            highest_streak: highestStreak
          }
        });
        const [careerCorrect, clubCorrect] = await Promise.all([
          transaction.gameAnswer.count({ where: { session: { user_id: user.user_id }, mode: "CAREER_CLUB", is_correct: true } }),
          transaction.gameAnswer.count({ where: { session: { user_id: user.user_id }, mode: { in: ["CURRENT_CLUB", "CAREER_CLUB", "WHO_PLAYED_HERE", "TWO_CLUBS"] }, is_correct: true } })
        ]);
        const earnedCodes = new Set<string>();
        if (correctAnswers >= 1) earnedCodes.add("first_goal");
        if (completedGames >= 10) earnedCodes.add("football_fan");
        if (accuracy > 80) earnedCodes.add("scout");
        if (totalScore >= 10000) earnedCodes.add("legend");
        if (highestStreak >= 10) earnedCodes.add("perfect");
        if (careerCorrect >= 50) earnedCodes.add("transfer_expert");
        if (clubCorrect >= 100) earnedCodes.add("club_historian");
        const achievements = await transaction.achievement.findMany({ where: { code: { in: [...earnedCodes] } } });
        for (const achievement of achievements) {
          await transaction.userAchievement.upsert({
            where: { user_id_achievement_id: { user_id: user.user_id, achievement_id: achievement.achievement_id } },
            update: {},
            create: { user_id: user.user_id, achievement_id: achievement.achievement_id }
          });
        }
      }
      return { ok: true as const, data: {
        isCorrect,
        timedOut,
        points,
        score: updated.score,
        streak: updated.current_streak,
        correctAnswerId: question.correct_ref_id,
        correctAnswerLabel: question.options.find((option) => option.id === question.correct_ref_id)?.label ?? "Answer unavailable",
        completed
      } };
    });

    if (!result.ok) return fail(result.error, result.status);
    return ok(result.data);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return fail("This question has already been answered.", 409);
    }
    return handleError(error);
  }
}
