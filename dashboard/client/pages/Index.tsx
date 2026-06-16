import { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  TrendingUp,
  Beaker,
  Users,
  Target,
  AlertCircle,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatisticResult {
  population: string;
  medianResponderFreq: number;
  medianNonResponderFreq: number;
  pValue: number;
  significant: boolean;
}

interface AnalysisData {
  statistics: StatisticResult[];
  populations: string[];
  samples_count: number;
  subjects_count: number;
  significant_count: number;
}

interface ReportsData {
  statistical: string;
  subset: string;
  google_form: string;
}

export default function Index() {
  const [selectedPopulation, setSelectedPopulation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({
    statistical: false,
    subset: false,
  });
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plotImage, setPlotImage] = useState<string | null>(null);

  // Load analysis data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const analysisResponse = await fetch("/api/analysis-data");
        if (!analysisResponse.ok) {
          throw new Error("Failed to load analysis data");
        }
        const analysis: AnalysisData = await analysisResponse.json();
        setAnalysisData(analysis);

        // Set first population as default
        if (analysis.populations.length > 0) {
          setSelectedPopulation(analysis.populations[0]);
        }

        const reportsResponse = await fetch("/api/reports");
        if (reportsResponse.ok) {
          const reports: ReportsData = await reportsResponse.json();
          setReportsData(reports);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load plot image when population changes
  useEffect(() => {
    if (selectedPopulation && analysisData) {
      const loadPlotImage = async () => {
        try {
          // Try to load the image
          const imageUrl = `/api/plot-image?population=${encodeURIComponent(selectedPopulation)}`;
          const response = await fetch(imageUrl);
          if (response.ok) {
            setPlotImage(imageUrl);
          } else {
            setPlotImage(null);
          }
        } catch (err) {
          console.log("Plot image not available:", err);
          setPlotImage(null);
        }
      };

      loadPlotImage();
    }
  }, [selectedPopulation, analysisData]);

  const filteredStatistics = useMemo(() => {
    if (!analysisData) return [];
    return analysisData.statistics.filter((stat) =>
      stat.population.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, analysisData]);

  const selectedStats = useMemo(() => {
    if (!analysisData) return null;
    return analysisData.statistics.find(
      (s) => s.population.toLowerCase() === selectedPopulation.toLowerCase()
    );
  }, [selectedPopulation, analysisData]);

  const toggleReport = (reportId: string) => {
    setExpandedReports((prev) => ({
      ...prev,
      [reportId]: !prev[reportId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B1D] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#EF4444] animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading clinical analysis data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050B1D] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Ensure the Python pipeline has generated outputs/ directory with CSV files.
          </p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-[#050B1D] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-400">No analysis data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B1D] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1f3a] bg-[#050B1D] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img
            src="/teiko-logo.png"
            alt="Teiko Labs"
            className="h-12 w-auto"
          />

          <div>
            <h1 className="text-3xl font-bold">
              Clinical Cytometry Analysis
            </h1>
            <p className="text-gray-400 text-sm">
              Teiko Labs Immune Cell Population Dashboard
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview KPIs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#EF4444]" />
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Samples",
                value: analysisData.samples_count.toLocaleString(),
                icon: <Target className="w-5 h-5" />,
              },
              {
                label: "Total Subjects",
                value: analysisData.subjects_count.toLocaleString(),
                icon: <Users className="w-5 h-5" />,
              },
              {
                label: "Cell Populations",
                value: analysisData.populations.length.toString(),
                icon: <Beaker className="w-5 h-5" />,
              },
              {
                label: "Significant Findings",
                value: analysisData.significant_count.toString(),
                icon: <AlertCircle className="w-5 h-5" />,
              },
            ].map((kpi, idx) => (
              <div
                key={idx}
                className="bg-[#1a1f3a] border border-[#2a3050] rounded-lg p-6 hover:border-[#EF4444] transition-colors duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">{kpi.label}</p>
                  <div className="text-[#EF4444]">{kpi.icon}</div>
                </div>
                <p className="text-3xl font-bold">{kpi.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Population Explorer */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Beaker className="w-6 h-6 text-[#EF4444]" />
            Population Explorer
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dropdown and Stats */}
            <div className="lg:col-span-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Cell Population
                </label>
                <select
                  value={selectedPopulation}
                  onChange={(e) => setSelectedPopulation(e.target.value)}
                  className="w-full bg-[#1a1f3a] border border-[#2a3050] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444] transition-colors"
                >
                  {analysisData.populations.map((pop) => (
                    <option key={pop} value={pop}>
                      {pop}
                    </option>
                  ))}
                </select>
              </div>

              {/* Statistics Summary */}
              {selectedStats && (
                <div className="bg-[#1a1f3a] border border-[#2a3050] rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-4">Statistical Summary</h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Median Responder",
                        value: selectedStats.medianResponderFreq.toFixed(2),
                      },
                      {
                        label: "Median Non-Responder",
                        value: selectedStats.medianNonResponderFreq.toFixed(2),
                      },
                      {
                        label: "P-Value",
                        value: selectedStats.pValue.toFixed(4),
                      },
                      {
                        label: "Significant",
                        value: selectedStats.significant ? "Yes" : "No",
                      },
                    ].map((stat, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-400">{stat.label}</span>
                        <span className={cn(
                          "font-semibold",
                          stat.label === "Significant" && selectedStats.significant
                            ? "text-[#EF4444]"
                            : "text-white"
                        )}>
                          {stat.value}{stat.label === "Median Responder" || stat.label === "Median Non-Responder" ? "%" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Boxplot */}
            <div className="lg:col-span-2">
              {plotImage ? (
                <div className="bg-[#1a1f3a] border border-[#2a3050] rounded-lg p-4 h-96 flex items-center justify-center overflow-auto">
                  <img
                    src={plotImage}
                    alt={`Boxplot for ${selectedPopulation}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="bg-[#1a1f3a] border border-[#2a3050] rounded-lg p-8 h-96 flex flex-col items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="text-6xl text-[#EF4444] opacity-20">📊</div>
                    <p className="text-gray-400">
                      Boxplot visualization for
                    </p>
                    <p className="text-xl font-semibold text-white">
                      {selectedPopulation}
                    </p>
                    <p className="text-sm text-gray-500">
                      (Image not found in outputs/plots/)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Statistical Results */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#EF4444]" />
            Statistical Results
          </h2>

          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search populations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1f3a] border border-[#2a3050] text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444] transition-colors"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-[#2a3050]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1a1f3a] border-b border-[#2a3050]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Population
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                    Responder (Median)
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                    Non-Responder (Median)
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                    P-Value
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                    Significant
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStatistics.map((stat, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      "border-b border-[#2a3050] hover:bg-[#1a1f3a] transition-colors",
                      stat.significant && "bg-[#1a1f3a] bg-opacity-50"
                    )}
                  >
                    <td className="px-6 py-4 text-sm text-white">
                      {stat.population}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-white">
                      {stat.medianResponderFreq.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-white">
                      {stat.medianNonResponderFreq.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-mono text-gray-300">
                      {stat.pValue.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {stat.significant ? (
                        <span className="inline-flex items-center gap-1 bg-[#EF4444] bg-opacity-20 text-[#EF4444] px-3 py-1 rounded text-xs font-medium">
                          ●
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Reports */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-[#EF4444]" />
            Reports
          </h2>

          <div className="space-y-4">
            {[
              {
                id: "statistical",
                title: "Statistical Analysis Report",
                content: reportsData?.statistical || "",
              },
              {
                id: "subset",
                title: "Subset Analysis Report",
                content: reportsData?.subset || "",
              },
            ].map((report) => (
              <div
                key={report.id}
                className="bg-[#1a1f3a] border border-[#2a3050] rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleReport(report.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#0f1425] transition-colors"
                >
                  <h3 className="font-semibold text-white text-lg">
                    {report.title}
                  </h3>
                  {expandedReports[report.id] ? (
                    <ChevronUp className="w-5 h-5 text-[#EF4444]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {expandedReports[report.id] && report.content && (
                  <div className="border-t border-[#2a3050] px-6 py-4 bg-[#0f1425]">
                    <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap text-gray-300">
                      {report.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Google Form Answer */}
            {reportsData?.google_form && (
              <div className="bg-[#1a1f3a] border border-[#2a3050] rounded-lg p-6">
                <h3 className="font-semibold text-white mb-3">Study Response</h3>
                <p className="text-gray-300 whitespace-pre-wrap">
                  {reportsData.google_form}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1f3a] bg-[#050B1D] py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>Clinical Cytometry Analysis Dashboard • Powered by Teiko Labs</p>
          <p className="mt-2">
            Advanced Flow Cytometry Data Analysis & Statistical Reporting
          </p>
        </div>
      </footer>
    </div>
  );
}
