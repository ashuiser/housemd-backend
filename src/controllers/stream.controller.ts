import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { threads } from "../db/schema.js";
import { streamEvents } from "../services/stream.service.js";
import AppError from "../utils/AppError.utils.js";
import createError from "../utils/createError.utils.js";
import { threadRequestSchema } from "../zod/schema.js";

export const handleStream = async (req: Request, res: Response) => {
  const { threadId } = req.params;
  const userId = req.userId;
  const threadIdValidation = threadRequestSchema.safeParse({
    threadId,
    userId,
  });

  if (!threadIdValidation.success) {
    console.log("Validation error:", threadIdValidation.error);
    throw createError({
      code: "VALIDATION_ERROR",
      message: "Invalid thread ID or user ID",
    });
  }
  // Verify ownership
  const [existingThread] = await db
    .select()
    .from(threads)
    .where(eq(threads.id, threadIdValidation.data.threadId))
    .limit(1);

  if (!existingThread) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Thread not found",
      statusCode: 404,
    });
  }

  if (existingThread.ownerId !== threadIdValidation.data.userId) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Forbidden: You do not own this thread",
      statusCode: 403,
    });
  }

  let lastEventId = req.headers["last-event-id"] as string | undefined;
  if (!lastEventId) {
    lastEventId = req.query.lastEventId as string | undefined;
  }

  await streamEvents(threadIdValidation.data.threadId, res, lastEventId);
};
