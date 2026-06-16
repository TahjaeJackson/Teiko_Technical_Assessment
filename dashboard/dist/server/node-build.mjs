import path from "node:path";
import "dotenv/config";
import * as express$1 from "express";
import express from "express";
import cors from "cors";
import * as fs from "fs";
import * as path$1 from "path";
//#region server/routes/demo.ts
var handleDemo = (req, res) => {
	res.status(200).json({ message: "Hello from Express server" });
};
//#endregion
//#region server/routes/analysis-data.ts
function parseCSV(content) {
	const lines = content.trim().split("\n");
	if (lines.length < 1) return [];
	const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
	return lines.slice(1).map((line) => {
		const values = line.split(",").map((v) => v.trim().replace(/['"]/g, ""));
		const record = {};
		headers.forEach((header, idx) => {
			record[header] = values[idx] || "";
		});
		return record;
	});
}
var handleAnalysisData = (req, res) => {
	try {
		const outputsDir = path$1.join(process.cwd(), "..", "outputs");
		let statistics = [];
		const statisticalResultsPath = path$1.join(outputsDir, "statistical_results.csv");
		if (fs.existsSync(statisticalResultsPath)) statistics = parseCSV(fs.readFileSync(statisticalResultsPath, "utf-8")).filter((record) => record.population && record.population.trim()).map((record) => ({
			population: record.population?.trim() || "",
			medianResponderFreq: parseFloat(record.median_responder || record.median_responder_freq || record.medianresponderfreq || record["median responder freq"] || "0"),
			medianNonResponderFreq: parseFloat(record.median_nonresponder || record.median_non_responder_freq || record.mediannonresponderfreq || record["median non-responder freq"] || "0"),
			pValue: parseFloat(record.p_value || record.pvalue || record["p-value"] || "1"),
			significant: parseFloat(record.p_value || record.pvalue || record["p-value"] || "1") < .05
		}));
		let samplesCount = 10500;
		let subjectsCount = 3500;
		const frequenciesPath = path$1.join(outputsDir, "sample_population_frequencies.csv");
		if (fs.existsSync(frequenciesPath)) {
			const records = parseCSV(fs.readFileSync(frequenciesPath, "utf-8"));
			samplesCount = new Set(records.map((r) => r.sample_id)).size;
		}
		const populations = [...new Set(statistics.map((s) => s.population))];
		const significantCount = statistics.filter((s) => s.significant).length;
		const response = {
			statistics,
			populations,
			samples_count: samplesCount,
			subjects_count: subjectsCount,
			significant_count: significantCount
		};
		res.json(response);
	} catch (error) {
		console.error("Error reading analysis data:", error);
		res.status(500).json({
			error: "Failed to load analysis data",
			message: error instanceof Error ? error.message : "Unknown error"
		});
	}
};
var handleReports = (req, res) => {
	try {
		const outputsDir = path$1.join(process.cwd(), "..", "outputs");
		const reports = {
			statistical: "",
			subset: "",
			google_form: ""
		};
		const statisticalPath = path$1.join(outputsDir, "statistical_report.txt");
		if (fs.existsSync(statisticalPath)) reports.statistical = fs.readFileSync(statisticalPath, "utf-8");
		const subsetPath = path$1.join(outputsDir, "subset_analysis_report.txt");
		if (fs.existsSync(subsetPath)) reports.subset = fs.readFileSync(subsetPath, "utf-8");
		const googleFormPath = path$1.join(outputsDir, "google_form_answer.txt");
		if (fs.existsSync(googleFormPath)) reports.google_form = fs.readFileSync(googleFormPath, "utf-8");
		res.json(reports);
	} catch (error) {
		console.error("Error reading reports:", error);
		res.status(500).json({
			error: "Failed to load reports",
			message: error instanceof Error ? error.message : "Unknown error"
		});
	}
};
var handlePlotImage = (req, res) => {
	try {
		const { population } = req.query;
		const outputsDir = path$1.join(process.cwd(), "..", "outputs", "plots");
		const normalizedName = population.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
		const imagePath = path$1.join(outputsDir, `${normalizedName}_boxplot.png`);
		if (!fs.existsSync(imagePath)) return res.status(404).json({ error: "Image not found" });
		res.setHeader("Content-Type", "image/png");
		res.sendFile(imagePath);
	} catch (error) {
		console.error("Error reading plot image:", error);
		res.status(500).json({
			error: "Failed to load image",
			message: error instanceof Error ? error.message : "Unknown error"
		});
	}
};
//#endregion
//#region server/index.ts
function createServer() {
	const app = express();
	app.use(cors());
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.get("/api/ping", (_req, res) => {
		const ping = process.env.PING_MESSAGE ?? "ping";
		res.json({ message: ping });
	});
	app.get("/api/demo", handleDemo);
	app.get("/api/analysis-data", handleAnalysisData);
	app.get("/api/reports", handleReports);
	app.get("/api/plot-image", handlePlotImage);
	return app;
}
//#endregion
//#region server/node-build.ts
var app = createServer();
var port = process.env.PORT || 3e3;
var __dirname = import.meta.dirname;
var distPath = path.join(__dirname, "../spa");
app.use(express$1.static(distPath));
app.get("*", (req, res) => {
	if (req.path.startsWith("/api/") || req.path.startsWith("/health")) return res.status(404).json({ error: "API endpoint not found" });
	res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
	console.log(`🚀 Fusion Starter server running on port ${port}`);
	console.log(`📱 Frontend: http://localhost:${port}`);
	console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
	console.log("🛑 Received SIGTERM, shutting down gracefully");
	process.exit(0);
});
process.on("SIGINT", () => {
	console.log("🛑 Received SIGINT, shutting down gracefully");
	process.exit(0);
});
//#endregion
export {};

//# sourceMappingURL=node-build.mjs.map