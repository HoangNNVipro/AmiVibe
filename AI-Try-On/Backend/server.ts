import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.ts";
import apiRoutes from "./routes/api.ts";

dotenv.config();

const app = express();
let dbConnected = false;

async function ensureDbConnection() {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
}

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(async (req, res, next) => {
  try {
    await ensureDbConnection();
    next();
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use("/api", apiRoutes);

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  (async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })();
} else if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export default app;

