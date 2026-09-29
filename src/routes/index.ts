import { Router } from "express";
import { handleCommand } from "../controllers/commands.controller.js";
import { handleState } from "../controllers/state.controller.js";
import { handleStream } from "../controllers/stream.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { commandRequestSchema } from "../zod/commands.schema.js";

const router = Router();

// Base route is /threads
router.post(
	"/:threadId/commands",
	authMiddleware,
	validateRequest(commandRequestSchema),
	handleCommand,
);

router.post("/:threadId/stream", authMiddleware, handleStream);

router.get("/:threadId/state", authMiddleware, handleState);

export default router;
