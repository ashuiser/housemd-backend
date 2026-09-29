import type { Response } from "express";
import redisClient from "../config/redis.js";

export async function streamEvents(
  threadId: string,
  res: Response,
  lastEventId?: string,
) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  const streamKey = `thread:${threadId}:events`;
  let currentCursor = lastEventId && lastEventId !== "" ? lastEventId : "0-0";
  let sequence = 0;

  try {
    while (true) {
      if (!subscriber.isOpen) break;

      const response = await subscriber.xRead(
        {
          key: streamKey,
          id: currentCursor,
        },
        {
          BLOCK: 5000, // block for 5 seconds
        },
      );

      if (response) {
        for (const stream of response) {
          for (const message of stream.messages) {
            currentCursor = message.id;
            const payload = message.message.payload;

            if (payload === "__done__") {
              continue;
            }

            // Write SSE event
            const data = JSON.parse(payload);

            const eventType =
              data.type === "interrupt" ? "input.requested" : "message";

            const eventData =
              data.type === "interrupt"
                ? {
                    interrupt_id: data.interrupt_id,
                    payload: data.payload,
                    namespace: data.namespace ?? [],
                  }
                : data;

            const protocolEvent =
              data.type === "interrupt"
                ? {
                    type: "event",
                    seq: sequence++,
                    event_id: message.id,
                    method: eventType,
                    params: {
                      namespace: data.namespace ?? [],
                      data: eventData,
                    },
                  }
                : data;

            res.write(
              `id: ${message.id}\n` +
                `event: message\n` +
                `data: ${JSON.stringify(protocolEvent)}\n\n`,
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Stream service error:", error);
    if (subscriber.isOpen) {
      subscriber.destroy();
    }
    res.end();
  }
}
