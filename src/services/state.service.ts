import { eq } from "drizzle-orm";
import { Agent } from "../agent/agent.js";
import { db } from "../db/index.js";
import { threads } from "../db/schema.js";
import AppError from "../utils/AppError.utils.js";
import { getMessages } from "./messages.service.js";

export async function getThreadState(threadId: string, userId: string) {
  const existingThread = await db
    .select()
    .from(threads)
    .where(eq(threads.id, threadId))
    .limit(1);

  if (existingThread.length === 0) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Thread not found",
      statusCode: 404,
    });
  }

  if (existingThread[0]?.ownerId !== userId) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Forbidden: You do not own this thread",
      statusCode: 403,
    });
  }

  const checkpointState = await Agent.graph.getState({
    configurable: {
      thread_id: threadId,
    },
  });
  // console.log("Checkpoint State: ", checkpointState);
  const messages = await getMessages(threadId);

  return {
    values: { messages: messages },
    next: checkpointState.next,
    tasks: checkpointState.tasks,
    config: checkpointState.config,
  };
}
