import express from "express";
import errorHandler from "./utils/errorHandler.utils.js";

const app = express();

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Hello from server",
    status: "success",
  });
});

app.use(errorHandler);

export default app;
