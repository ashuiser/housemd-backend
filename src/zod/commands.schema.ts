import { z } from "zod";

export const commandRequestSchema = z.object({
	method: z.enum(["run.start", "input.respond"]),
	params: z.object({
		input: z.any().optional(),
		response: z.any().optional(),
		config: z
			.object({
				configurable: z.record(z.string(), z.string()).optional(),
			})
			.optional(),
	}),
});
