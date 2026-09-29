import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { ChatOpenAI } from "@langchain/openai";
import {
  createAgent,
  createMiddleware,
  summarizationMiddleware,
} from "langchain";
import { env } from "../config/env.js";
import { appendMessages } from "../services/messages.service.js";
import { pineconeSearch } from "./tools/pinecone.js";
import { tavilySearch } from "./tools/tavily.js";

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
});

export const checkpointer = PostgresSaver.fromConnString(env.DATABASE_URL);

const persistenceMiddleware = createMiddleware({
  name: "persistenceMiddleware",
  beforeAgent: async (state, runtime) => {
    const threadId = runtime.configurable?.thread_id;
    if (!threadId) return;

    // console.log("Before: ", state.messages);

    const lastMsg = state.messages[state.messages.length - 1];
    if (lastMsg && lastMsg.type === "human") {
      await appendMessages(threadId, [lastMsg]);
    }
  },
  afterAgent: async (state, runtime) => {
    const threadId = runtime.configurable?.thread_id;
    if (!threadId) return;

    // console.log("After: ", state.messages);

    const lastMsg = state.messages[state.messages.length - 1];
    if (lastMsg && lastMsg.type === "ai") {
      await appendMessages(threadId, [lastMsg]);
    }
  },
});

export const Agent = createAgent({
  model: llm,
  tools: [tavilySearch, pineconeSearch],
  middleware: [
    persistenceMiddleware,
    summarizationMiddleware({
      model: llm,
      trigger: { tokens: 4000 },
      keep: { messages: 20 },
    }),
  ],
  checkpointer,
  systemPrompt: `You are HouseMD, an intelligent medical AI assistant.
You have access to a Tavily internet search tool and a Pinecone search tool.
If the user asks about something that requires up-to-date knowledge or something from their uploaded files, use the appropriate tool.
For uploaded documents, ALWAYS use the pinecone_search tool to find context. Don't tell anything which is not in the documents provided or web search results.`,
});
