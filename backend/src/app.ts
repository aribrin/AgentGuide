import express from "express";
import cors from "cors";
import agentRoutes from "./routes/agentRoutes";
import runRoutes from "./routes/runRoutes";
import { authenticateApiKey } from "./middleware/auth"; 

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["http://localhost:3000"],
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-API-Key", "x-api-key"]
}));
app.use(express.json());

// Public routes
app.use("/agents", agentRoutes);

//  Protected routes (everything under /v1 requires API key)
app.use("/v1", authenticateApiKey, runRoutes);

export default app;
