import type { NextFunction, Request, Response } from "express";
import z from "zod";
import createError from "../utils/createError.utils.js";

export const validateRequest = (schema: z.ZodType) => {
	return (req: Request, _res: Response, next: NextFunction) => {
		try {
			const result = schema.safeParse(req.body);
			if (!result.success) {
				next(
					createError({
						code: "VALIDATION_ERROR",
						details: z.flattenError(result.error),
					}),
				);
			}
			req.body = result.data;
			next();
		} catch (error) {
			next(error);
		}
	};
};
