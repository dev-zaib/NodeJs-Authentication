import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouterV1 from "./routes/v1/userRoutes.v1.js";
import userRouterV2 from "./routes/v2/userRoutes.v2.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";

app.use(errorMiddleware);
app.use("/api/v1/users", userRouterV1);
app.use("/api/v2/users", userRouterV2);
export default app;
