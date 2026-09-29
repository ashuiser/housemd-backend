import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import threadsRouter from "./routes/index.js";
import errorHandler from "./utils/errorHandler.utils.js";

const app = express();

app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	}),
);
app.use(express.json());
app.use(cookieParser());

// app.use((req, _res, next) => {
// 	console.log("---- REQUEST ----");
// 	console.log("method:", req.method);
// 	console.log("url:", req.originalUrl);
// 	console.log("origin:", req.headers.origin);
// 	console.log("cookie:", req.headers.cookie);
// 	console.log("user-agent:", req.headers["user-agent"]);
// 	console.log("-----------------");

// 	next();
// });

app.get("/", (_req, res) => {
	res.status(200).json({
		message: "Hello from server",
		status: "success",
	});
});

app.use("/threads", threadsRouter);

app.use(errorHandler);

export default app;
