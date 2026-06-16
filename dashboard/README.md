# Clinical Cytometry Analysis Dashboard

A production-ready React + Express dashboard for Teiko Labs immune cell population analysis, featuring clinical trial data visualization and advanced statistical reporting.

## Architecture

```
project_root/
├── dashboard/               # This React + Express application
│   ├── client/             # React frontend
│   ├── server/             # Express API backend
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── outputs/                # Sibling directory with Python pipeline outputs
│   ├── statistical_results.csv
│   ├── sample_population_frequencies.csv
│   ├── statistical_report.txt
│   ├── subset_analysis_report.txt
│   ├── google_form_answer.txt
│   └── plots/              # PNG boxplot images
└── Makefile
```

## Setup

### From Project Root

```bash
cd dashboard
npm install
npm run dev
```

The application will start at `http://localhost:8080`

### From Dashboard Directory

```bash
npm install
npm run dev
```

## Data Integration

The dashboard reads clinical analysis data from the `outputs/` directory (a sibling of the dashboard directory):

- **statistical_results.csv**: Population-level statistical comparisons
  - Columns: `population`, `median_responder_freq`, `median_non_responder_freq`, `p_value`

- **sample_population_frequencies.csv**: Sample-level population frequencies
  - Columns: `sample_id`, `subject_id`, `population`, `responder`, `frequency`

- **statistical_report.txt**: Full statistical analysis narrative report

- **subset_analysis_report.txt**: Demographic and subset stratification report

- **google_form_answer.txt**: Summary response text

- **plots/*.png**: Boxplot visualizations (one per population)
  - Naming: `{population_name}_boxplot.png` (e.g., `cd4_t_cell_boxplot.png`)

## API Endpoints

- `GET /api/analysis-data` - Returns KPI metrics and statistical results
- `GET /api/reports` - Returns full text reports
- `GET /api/plot-image?population={name}` - Returns PNG boxplot image

## Design

- **Colors**: Dark navy (#020B2D) background with Teiko red (#EF4444) accents
- **Typography**: Professional clinical dashboard aesthetic
- **Responsive**: Optimized for desktop and tablet viewing
- **Shadows & Borders**: Subtle depth with rounded corners and gradient borders

## Dashboard Sections

1. **Executive Overview**: KPI cards showing total samples, subjects, populations, and significant findings

2. **Population Explorer**: Interactive selector with population-specific statistics and boxplot visualization

3. **Statistical Results**: Searchable table of all populations with p-value highlighting for significant findings

4. **Clinical Reports**: Expandable sections for statistical and subset analysis reports

## Development

### Commands

```bash
npm run dev       # Start development server (Vite + Express)
npm run build     # Production build
npm run start     # Start production server
npm run typecheck # TypeScript validation
npm run test      # Run Vitest tests
```


## Notes

- File paths use `../outputs/` to read from the sibling outputs directory
- All data loading is dynamic; no hardcoded mock data
- The dashboard gracefully handles missing output files with appropriate error messaging
- Significant findings are automatically highlighted (p < 0.05)
