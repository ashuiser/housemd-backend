import type { Request, Response } from "express";
import { getThreadState } from "../services/state.service.js";
import createError from "../utils/createError.utils.js";
import { threadRequestSchema } from "../zod/schema.js";

export const handleState = async (req: Request, res: Response) => {
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

  const state = await getThreadState(
    threadIdValidation.data.threadId,
    threadIdValidation.data.userId,
  );
  return res.json({
    values: state.values,
    next: state.next,
    tasks: state.tasks,
    checkpoint: state.config,
  });
};
