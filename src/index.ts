import "dotenv/config";
import z from "zod";
import app from "./app.js";
import redisClient from "./config/redis.js";

const reqEnvVarsSchema = z.object({
  PORT: z.coerce.number(),
  DATABASE_URL: z.url(),
});

const reqEnvVars = reqEnvVarsSchema.safeParse(process.env);

if (!reqEnvVars.success) {
  console.error("Missing required environment variables:", reqEnvVars.error);
  process.exit(1);
}

const PORT = reqEnvVars.data.PORT;

console.log("Connecting to Redis..");
try {
  await redisClient.connect();
  console.log("Redis client connected");
} catch (error) {
  console.log("Redis client connection error", error);
  process.exit(1);
}

console.log("Starting server...");
app.listen(PORT, () => {
  console.log(`server started on port ${PORT}.`);
});

// console.log("Setting up checkpointer...");
// await checkpointer.setup();
// console.log("Checkpointer setup complete");
