import type { BaseMessage } from "@langchain/core/messages";
import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { messages } from "../db/schema.js";

export async function appendMessages(
	threadId: string,
	msgs: BaseMessage[],
): Promise<void> {
	if (msgs.length === 0) return;

	const rows = msgs.map((msg) => ({
		threadId,
		lcMessage: msg.toJSON(),
	}));

	await db.insert(messages).values(rows);
}

export async function getMessages(threadId: string) {
	const rows = await db
		.select({ lcMessage: messages.lcMessage })
		.from(messages)
		.where(eq(messages.threadId, threadId))
		.orderBy(asc(messages.createdAt));

	return rows.map((r) => r.lcMessage);
}
