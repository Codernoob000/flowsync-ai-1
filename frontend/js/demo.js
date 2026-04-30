/* ═══════════════════════════════════════════════════════════
   FLOWSYNC AI — DEMO DATA
   Mock backend responses for offline / demo mode
   ═══════════════════════════════════════════════════════════ */

let DEMO_MODE = true; // Auto-detected: set to false when backend is reachable

/* ─── Hyderabad Route Coordinates ───────────────────────── */
// Origin: Hyderabad Central Station (Secunderabad)
// Destination: HITEC City
const DEMO_ORIGIN_LATLNG   = [17.4399, 78.4983];
const DEMO_DEST_LATLNG     = [17.4435, 78.3772];
const DEMO_MAP_CENTER      = [17.4200, 78.4377];
const DEMO_MAP_ZOOM        = 12;

/*
 * Three realistic Hyderabad route polylines:
 *   Route 1 (Best / Low risk)   → Via Banjara Hills & Jubilee Hills
 *   Route 2 (Medium risk)       → Via Begumpet & Ameerpet
 *   Route 3 (High risk)         → Via Old City / Mehdipatnam
 */
const DEMO_ROUTE_COORDS = [
  // Route 1 — Best (Blue) + Low Risk (Green tagged)
  [
    [17.4399, 78.4983],
    [17.4300, 78.4900],
    [17.4200, 78.4750],
    [17.4150, 78.4600],
    [17.4156, 78.4347],
    [17.4239, 78.4065],
    [17.4401, 78.3928],
    [17.4435, 78.3772]
  ],
  // Route 2 — Medium Risk (Yellow)
  [
    [17.4399, 78.4983],
    [17.4450, 78.4870],
    [17.4500, 78.4700],
    [17.4460, 78.4500],
    [17.4380, 78.4300],
    [17.4390, 78.4100],
    [17.4420, 78.3900],
    [17.4435, 78.3772]
  ],
  // Route 3 — High Risk (Red)
  [
    [17.4399, 78.4983],
    [17.4200, 78.5000],
    [17.4050, 78.4900],
    [17.3900, 78.4700],
    [17.3800, 78.4500],
    [17.3850, 78.4200],
    [17.4000, 78.4000],
    [17.4200, 78.3850],
    [17.4435, 78.3772]
  ]
];

/* ─── Mock /best-route Response ─────────────────────────── */
const DEMO_BEST_ROUTE_RESPONSE = {
  best_route_index: 0,
  routes: [
    {
      id: 0,
      name: "Route 1 · Banjara Hills",
      via: "Tank Bund → Banjara Hills → Jubilee Hills",
      distance: "14.2 km",
      duration: "28 min",
      risk_score: 0.18,
      risk_label: "LOW",
      is_best: true
    },
    {
      id: 1,
      name: "Route 2 · Begumpet",
      via: "Begumpet → Ameerpet → Madhapur",
      distance: "16.8 km",
      duration: "38 min",
      risk_score: 0.54,
      risk_label: "MEDIUM",
      is_best: false
    },
    {
      id: 2,
      name: "Route 3 · Old City",
      via: "Abids → Mehdipatnam → Gachibowli",
      distance: "22.1 km",
      duration: "55 min",
      risk_score: 0.87,
      risk_label: "HIGH",
      is_best: false
    }
  ],
  prediction: {
    risk_score: 0.18,
    risk_label: "LOW",
    action: "PROCEED",
    action_description: "Route is clear. Standard delivery timeline applies.",
    explanation: "Our AI predicts disruptions using live traffic and weather data. Route 1 via Banjara Hills shows low congestion (18% risk). Tank Bund road is currently clear — light traffic flow detected. Weather conditions are favorable with no rain predicted in the next 2 hours. This route saves approximately 27 minutes compared to alternative paths.",
    tags: ["🌤️ Weather: Clear", "🚗 Traffic: Light", "⏱️ ETA: 28 min"]
  }
};

/* ─── Mock /simulate Response Generator ─────────────────── */
/**
 * Returns simulated risk scores for each route at `hourOffset` hours from now.
 * Uses realistic sinusoidal patterns: peak risk during rush hours (8–9AM, 6–8PM).
 * @param {number} hourOffset - 0 to 24
 * @returns {{ route1: number, route2: number, route3: number }}
 */
function getDemoSimulateData(hourOffset) {
  const currentHour = new Date().getHours();
  const h = (currentHour + hourOffset) % 24;

  // Rush hour peaks: 8-9 AM and 18-20 PM
  const rushFactor = (
    Math.exp(-Math.pow(h - 8.5, 2) / 2) * 0.5 +
    Math.exp(-Math.pow(h - 19,   2) / 3) * 0.6 +
    0.05
  );

  const baseRisk1 = Math.min(0.95, 0.15 + rushFactor * 0.55 + Math.random() * 0.04);
  const baseRisk2 = Math.min(0.95, 0.45 + rushFactor * 0.40 + Math.random() * 0.06);
  const baseRisk3 = Math.min(0.99, 0.75 + rushFactor * 0.20 + Math.random() * 0.05);

  return {
    route1: +baseRisk1.toFixed(2),
    route2: +baseRisk2.toFixed(2),
    route3: +baseRisk3.toFixed(2)
  };
}

/* ─── 24-Hour Forecast Data ──────────────────────────────── */
function getDemoForecastSeries() {
  const series = { r1: [], r2: [], r3: [] };
  for (let h = 0; h <= 24; h++) {
    const d = getDemoSimulateData(h);
    series.r1.push(d.route1);
    series.r2.push(d.route2);
    series.r3.push(d.route3);
  }
  return series;
}

/* ─── Mock /predict Response ─────────────────────────────── */
const DEMO_PREDICT_RESPONSE = {
  risk_score: 0.18,
  risk_label: "LOW",
  confidence: 0.94,
  factors: {
    traffic: "light",
    weather: "clear",
    incidents: 0,
    road_quality: "good"
  }
};
