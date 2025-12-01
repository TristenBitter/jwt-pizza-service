import express, { json, Router } from "express";
import { authRouter, setAuthUser } from "./routes/authRouter.js";
import orderRouter from "./routes/orderRouter.js";
import franchiseRouter from "./routes/franchiseRouter.js";
import userRouter from "./routes/userRouter.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import metrics from "./metrics.js";
import logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const versionJson = JSON.parse(
  readFileSync(join(__dirname, "version.json"), "utf-8")
);
const _version = versionJson.version;
import { factory as _factory, sqlDb as _db } from "./config.js";

export const app = express();
app.use(json());
app.use(logger.httpLogger);
app.use(metrics.requestTracker);
app.use(setAuthUser);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

const apiRouter = Router();
app.use("/api", apiRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/user", userRouter);
apiRouter.use("/order", orderRouter);
apiRouter.use("/franchise", franchiseRouter);

apiRouter.use("/docs", (req, res) => {
  res.json({
    version: _version,
    endpoints: [
      ...authRouter.docs,
      ...userRouter.docs,
      ...orderRouter.docs,
      ...franchiseRouter.docs,
    ],
    config: { factory: _factory.url, db: _db.connection.host },
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "welcome to JWT Pizza",
    version: _version,
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    message: "unknown endpoint",
  });
});

app.use((err, req, res, next) => {
  logger.unhandledErrorLogger(err, req, res, next);
  res
    .status(err.statusCode ?? 500)
    .json({ message: err.message, stack: err.stack });
  next();
});

export default app;
