import { Command } from "@langchain/langgraph";
import { eq } from "drizzle-orm";
import type { AgentRunStream } from "langchain";
import { Agent } from "../agent/agent.js";
import redisClient from "../config/redis.js";
import { db } from "../db/index.js";
import { threads } from "../db/schema.js";
import type { TRunAgentRequest } from "../types/index.js";
import AppError from "../utils/AppError.utils.js";

type RunAgentOptions = {
  threadId: string;
  runId: string;
  userId: string;
  command: TRunAgentRequest;
};

export async function processCommand(
  threadId: string,
  userId: string,
  command: TRunAgentRequest,
) {
  // Upsert thread
  const [existingThread] = await db
    .select()
    .from(threads)
    .where(eq(threads.id, threadId))
    .limit(1);

  if (!existingThread) {
    await db.insert(threads).values({
      id: threadId,
      ownerId: userId,
      title: "New Chat",
    });
  } else if (existingThread.ownerId !== userId) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Forbidden: You do not own this thread",
      statusCode: 403,
    });
  }

  // Acquire Lock
  const lockKey = `thread:${threadId}:lock`;
  const locked = await redisClient.set(lockKey, "locked", {
    condition: "NX",
    expiration: {
      type: "EX",
      value: 300,
    },
  });

  if (!locked) {
    throw new AppError({
      code: "CONFLICT",
      message: "Conflict: Agent is already running for this thread",
      statusCode: 409,
    });
  }

  const runId = crypto.randomUUID();

  // Fire-and-forget
  runAgent({ threadId, runId, command, userId }).catch(console.error);

  return { run_id: runId };
}

async function runAgent({ threadId, runId, command, userId }: RunAgentOptions) {
  const streamKey = `thread:${threadId}:events`;
  try {
    let stream: AgentRunStream | undefined;
    if (command.method === "run.start") {
      const configurable = {
        thread_id: threadId,
        run_id: runId,
        userId: userId,
        internetMode:
          command.params?.config?.configurable?.internetMode || "all",
      };
      stream = await Agent.streamEvents(
        { messages: [command.params.input.messages[0]] },
        {
          configurable: configurable,
          version: "v3",
        },
      );
    } else if (command.method === "input.respond") {
      const configurable = {
        thread_id: threadId,
        userId: userId,
        internetMode: "ask" as const,
      };
      stream = await Agent.streamEvents(
        new Command({
          resume: command.params.response,
        }),
        {
          configurable: configurable,
          version: "v3",
        },
      );
    }
    if (stream) {
      for await (const event of stream) {
        // Publish raw event to Redis for SSE consumers
        await redisClient.xAdd(streamKey, "*", {
          payload: JSON.stringify(event),
        });
      }
      if (stream.interrupted) {
        for (const interrupt of stream.interrupts) {
          await redisClient.xAdd(streamKey, "*", {
            payload: JSON.stringify({
              type: "interrupt",
              interrupt_id: interrupt.interruptId,
              payload: interrupt.payload,
              namespace: [],
            }),
          });
        }
      }
    }
  } catch (error) {
    console.error(`Agent error for thread ${threadId}:`, error);
    await redisClient.xAdd(streamKey, "*", {
      payload: JSON.stringify({
        event: "error",
        data: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      }),
    });
  } finally {
    // Send sentinel and cleanup
    await redisClient.xAdd(streamKey, "*", {
      payload: "__done__",
    });
    await redisClient.del(`thread:${threadId}:lock`);
    await redisClient.expire(streamKey, 3600); // 1 hour TTL
  }
}
