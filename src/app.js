import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/config.js";

const app = express();
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  cors({
    origin: config.ORIGIN || "http://localhost:5174",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
  }),
);

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});
// routes import
import authRouter from "./routes/auth.route.js";
import productRouter from "./routes/product.route.js";
import interestRouter from "./routes/interest.route.js";

// routes declaration
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/interest", interestRouter);
export default app;
