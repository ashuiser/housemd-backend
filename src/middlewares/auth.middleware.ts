import type { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import { env } from "../config/env.js";
import AppError from "../utils/AppError.utils.js";

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export const authMiddleware = async (
	req: Request,
	_res: Response,
	next: NextFunction,
) => {
	try {
		// console.log(req.cookies);
		// console.log(req.path);
		const token = req.cookies.hmd_access;

		if (!token) {
			throw new AppError({
				code: "UNAUTHORIZED",
				message: "Unauthorized: Missing token",
				statusCode: 401,
			});
		}

		const { payload } = await jwtVerify(token, JWT_SECRET);
		if (!payload.userId) {
			throw new AppError({
				code: "UNAUTHORIZED",
				message: "Unauthorized: Invalid token payload",
				statusCode: 401,
			});
		}

		// Attach userId to request object
		req.userId = payload.userId as string;
		next();
	} catch (error) {
		if (error instanceof AppError) {
			next(error);
		} else {
			next(
				new AppError({
					code: "UNAUTHORIZED",
					message: "Unauthorized: Invalid or expired token",
					statusCode: 401,
				}),
			);
		}
	}
};
