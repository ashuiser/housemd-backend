import type { Request, Response } from "express";
import { processCommand } from "../services/commands.service.js";
import type { TRunAgentRequest } from "../types/index.js";
import createError from "../utils/createError.utils.js";
import { threadRequestSchema } from "../zod/schema.js";

export const handleCommand = async (req: Request, res: Response) => {
  const { threadId } = req.params;
  const userId = req.userId;
  const command = req.body as TRunAgentRequest;

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

  const result = await processCommand(
    threadIdValidation.data.threadId,
    threadIdValidation.data.userId,
    command,
  );

  // sendResponse({
  //   res,
  //   success: true,
  //   statusCode: 200,
  //   data: result,
  // });
  return res.json({
    type: "success",
    id: command.id,
    result: {
      runId: result.run_id,
    },
  });
};
