import z from "zod";

export const reqEnvVarsSchema = z.object({
	PORT: z.coerce.number(),
	DATABASE_URL: z.url(),
	REDIS_URL: z.url(),

	PINECONE_INDEX: z.string(),
	PINECONE_API_KEY: z.string(),

	LANGSMITH_TRACING: z.coerce.boolean().default(true),
	LANGSMITH_ENDPOINT: z.url(),
	LANGSMITH_API_KEY: z.string(),
	LANGSMITH_PROJECT: z.string(),

	OPENAI_API_KEY: z.string(),
	TAVILY_API_KEY: z.string(),
});
