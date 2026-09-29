import AppError from "./AppError.utils.js";

const ERRORS = {
	USER_NOT_FOUND: {
		code: "USER_NOT_FOUND",
		message: "The specified user was not found.",
		statusCode: 404,
	},
	VALIDATION_ERROR: {
		code: "VALIDATION_ERROR",
		message: "One or more validation errors occurred.",
		statusCode: 400,
	},
};

export default function createError({
	code,
	message,
	statusCode,
	details,
}: {
	code: keyof typeof ERRORS;
	message?: string;
	statusCode?: number;
	details?: unknown;
}) {
	const errorCreator = ERRORS[code];
	if (!errorCreator) {
		throw new Error(`Error code '${code}' is not defined.`);
	}
	return new AppError({
		code: errorCreator.code,
		message: message || errorCreator.message,
		statusCode: statusCode || errorCreator.statusCode,
		details,
	});
}
