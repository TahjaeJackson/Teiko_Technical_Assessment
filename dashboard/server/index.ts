import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleAnalysisData, handleReports, handlePlotImage } from "./routes/analysis-data";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Analysis data routes
  app.get("/api/analysis-data", handleAnalysisData);
  app.get("/api/reports", handleReports);
  app.get("/api/plot-image", handlePlotImage);

  return app;
}
