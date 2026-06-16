import { RequestHandler } from "express";
import * as fs from "fs";
import * as path from "path";

interface StatisticResult {
  population: string;
  medianResponderFreq: number;
  medianNonResponderFreq: number;
  pValue: number;
  significant: boolean;
}

interface AnalysisResponse {
  statistics: StatisticResult[];
  populations: string[];
  samples_count: number;
  subjects_count: number;
  significant_count: number;
}

// Simple CSV parser
function parseCSV(content: string): Array<Record<string, string>> {
  const lines = content.trim().split("\n");
  if (lines.length < 1) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/['"]/g, ""));
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || "";
    });
    return record;
  });
}

export const handleAnalysisData: RequestHandler = (req, res) => {
  try {
    // outputs directory is a sibling of dashboard directory
    const outputsDir = path.join(process.cwd(), "..", "outputs");

    // Parse statistical results CSV
    let statistics: StatisticResult[] = [];
    const statisticalResultsPath = path.join(outputsDir, "statistical_results.csv");

    if (fs.existsSync(statisticalResultsPath)) {
      const content = fs.readFileSync(statisticalResultsPath, "utf-8");
      const records = parseCSV(content);

      statistics = records
        .filter((record) => record.population && record.population.trim())
        .map((record) => ({
          population: record.population?.trim() || "",
          medianResponderFreq: parseFloat(
            record.median_responder ||
              record.median_responder_freq ||
              record.medianresponderfreq ||
              record["median responder freq"] ||
              "0"
          ),
          medianNonResponderFreq: parseFloat(
          record.median_nonresponder ||
            record.median_non_responder_freq ||
            record.mediannonresponderfreq ||
            record["median non-responder freq"] ||
            "0"
        ),
          pValue: parseFloat(
            record.p_value || record.pvalue || record["p-value"] || "1"
          ),
          significant: parseFloat(
            record.p_value || record.pvalue || record["p-value"] || "1"
          ) < 0.05,
        }));
    }

    let samplesCount = 10500;
    let subjectsCount = 3500;

    // Try to count samples from the frequencies file
    const frequenciesPath = path.join(outputsDir, "sample_population_frequencies.csv");
    if (fs.existsSync(frequenciesPath)) {
      const content = fs.readFileSync(frequenciesPath, "utf-8");
      const records = parseCSV(content);
      samplesCount = new Set(records.map((r) => r.sample_id)).size;
    }

    const populations = [...new Set(statistics.map((s) => s.population))];
    const significantCount = statistics.filter((s) => s.significant).length;

    const response: AnalysisResponse = {
      statistics,
      populations,
      samples_count: samplesCount,
      subjects_count: subjectsCount,
      significant_count: significantCount,
    };

    res.json(response);
  } catch (error) {
    console.error("Error reading analysis data:", error);
    res.status(500).json({
      error: "Failed to load analysis data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleReports: RequestHandler = (req, res) => {
  try {
    // outputs directory is a sibling of dashboard directory
    const outputsDir = path.join(process.cwd(), "..", "outputs");

    const reports = {
      statistical: "",
      subset: "",
      google_form: "",
    };

    // Read statistical report
    const statisticalPath = path.join(outputsDir, "statistical_report.txt");
    if (fs.existsSync(statisticalPath)) {
      reports.statistical = fs.readFileSync(statisticalPath, "utf-8");
    }

    // Read subset analysis report
    const subsetPath = path.join(outputsDir, "subset_analysis_report.txt");
    if (fs.existsSync(subsetPath)) {
      reports.subset = fs.readFileSync(subsetPath, "utf-8");
    }

    // Read Google form answer
    const googleFormPath = path.join(outputsDir, "google_form_answer.txt");
    if (fs.existsSync(googleFormPath)) {
      reports.google_form = fs.readFileSync(googleFormPath, "utf-8");
    }

    res.json(reports);
  } catch (error) {
    console.error("Error reading reports:", error);
    res.status(500).json({
      error: "Failed to load reports",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handlePlotImage: RequestHandler = (req, res) => {
  try {
    const { population } = req.query;
    // outputs directory is a sibling of dashboard directory
    const outputsDir = path.join(process.cwd(), "..", "outputs", "plots");

    // Normalize population name to match file naming
    const normalizedName = (population as string)
      .replace(/[^a-z0-9_]/gi, "_")
      .toLowerCase();

    const imagePath = path.join(outputsDir, `${normalizedName}_boxplot.png`);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.setHeader("Content-Type", "image/png");
    res.sendFile(imagePath);
  } catch (error) {
    console.error("Error reading plot image:", error);
    res.status(500).json({
      error: "Failed to load image",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
