import { reqEnvVarsSchema } from "../zod/schema.js";

const envVars = reqEnvVarsSchema.safeParse(process.env);

if (!envVars.success) {
  console.error("Missing required environment variables:", envVars.error);
  process.exit(1);
}
export const env = envVars.data;
