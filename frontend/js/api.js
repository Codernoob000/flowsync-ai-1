/* ═══════════════════════════════════════════════════════════
   FLOWSYNC AI — API CLIENT
   Connects to FastAPI backend at localhost:8000
   Falls back to DEMO_MODE data on error
   ═══════════════════════════════════════════════════════════ */

const API_BASE_URL = 'http://localhost:8000';
const API_TIMEOUT  = 15000; // ms (allow time for Gemini calls)

/* ─── Utility: fetch with timeout ────────────────────────── */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), API_TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return await response.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/* ─── Health check ───────────────────────────────────────── */
async function checkBackendHealth() {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/health`, { method: 'GET' });
    return true;
  } catch {
    try {
      await fetchWithTimeout(`${API_BASE_URL}/`, { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }
}

/* ─── Known city coordinates (geocoding helper) ──────────── */
const CITY_COORDS = {
  'hyderabad central station':  { lat: 17.4399, lng: 78.4983 },
  'secunderabad':               { lat: 17.4399, lng: 78.4983 },
  'hitec city':                 { lat: 17.4435, lng: 78.3772 },
  'gachibowli':                 { lat: 17.4401, lng: 78.3489 },
  'madhapur':                   { lat: 17.4486, lng: 78.3908 },
  'banjara hills':              { lat: 17.4156, lng: 78.4347 },
  'jubilee hills':              { lat: 17.4325, lng: 78.4073 },
  'ameerpet':                   { lat: 17.4375, lng: 78.4483 },
  'begumpet':                   { lat: 17.4434, lng: 78.4700 },
  'kukatpally':                 { lat: 17.4948, lng: 78.3996 },
  'lb nagar':                   { lat: 17.3457, lng: 78.5522 },
  'uppal':                      { lat: 17.4012, lng: 78.5595 },
  'dilsukhnagar':               { lat: 17.3616, lng: 78.5274 },
  'mehdipatnam':                { lat: 17.3950, lng: 78.4422 },
  'charminar':                  { lat: 17.3616, lng: 78.4747 },
  'shamshabad':                 { lat: 17.2403, lng: 78.4294 },
  'miyapur':                    { lat: 17.4969, lng: 78.3548 },
  'lingampally':                { lat: 17.4924, lng: 78.3175 },
  'mumbai':                     { lat: 19.0760, lng: 72.8777 },
  'pune':                       { lat: 18.5204, lng: 73.8567 },
  'bangalore':                  { lat: 12.9716, lng: 77.5946 },
  'chennai':                    { lat: 13.0827, lng: 80.2707 },
  'delhi':                      { lat: 28.7041, lng: 77.1025 },
};

function getCoords(locationStr) {
  const lower = locationStr.toLowerCase().trim();
  // Try exact match first
  for (const [key, val] of Object.entries(CITY_COORDS)) {
    if (lower.includes(key)) return val;
  }
  // Default fallback — Hyderabad center
  return { lat: 17.3850, lng: 78.4867 };
}

/* ─── Risk helpers ───────────────────────────────────────── */
function riskLabel(risk) {
  return (risk || 'medium').toUpperCase();
}

function riskScore(probability) {
  return typeof probability === 'number' ? probability : 0.5;
}

/* ─── POST /routes/best-route ────────────────────────────── */
/**
 * @param {string} origin
 * @param {string} destination
 * @returns {Promise<object>} transformed route response matching frontend shape
 */
async function apiFetchBestRoute(origin, destination) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 1400 + Math.random() * 600));
    return DEMO_BEST_ROUTE_RESPONSE;
  }

  const originCoords = getCoords(origin);
  const destCoords   = getCoords(destination);

  const raw = await fetchWithTimeout(`${API_BASE_URL}/routes/best-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin,
      destination,
      origin_lat: originCoords.lat,
      origin_lng: originCoords.lng,
      dest_lat:   destCoords.lat,
      dest_lng:   destCoords.lng,
    })
  });

  // ── Transform backend shape → frontend shape ──────────
  return transformBackendResponse(raw, originCoords, destCoords);
}

/**
 * Transform the backend's response into the shape the frontend UI expects.
 * Backend returns: { all_routes, best_route, decision_reason }
 * Frontend expects: { routes, best_route_index, prediction }
 */
function transformBackendResponse(raw, originCoords, destCoords) {
  const allRoutes = raw.all_routes || [];

  // Find best route index
  const bestRoute = raw.best_route || allRoutes[0];
  let bestIdx = 0;
  for (let i = 0; i < allRoutes.length; i++) {
    if (allRoutes[i] === bestRoute || allRoutes[i].score === bestRoute.score) {
      bestIdx = i;
      break;
    }
  }

  // Build the routes array in the shape the frontend expects
  const routes = allRoutes.map((r, i) => {
    const orig   = r.original_route || {};
    const isBest = i === bestIdx;

    // Build waypoints for map rendering
    let waypoints = [];
    if (orig.waypoints && orig.waypoints.length > 2) {
      waypoints = orig.waypoints.map(wp =>
        Array.isArray(wp) ? wp : [wp.lat, wp.lng]
      );
    } else {
      // Generate synthetic waypoints between origin & dest
      waypoints = generateSyntheticRoute(
        originCoords, destCoords, i, allRoutes.length
      );
    }

    return {
      id:         i,
      name:       orig.label || `Route ${i + 1}`,
      via:        `${(r.route || {}).traffic || 'moderate'} traffic · ${(r.route || {}).weather || 'clear'} weather`,
      distance:   `${orig.distance_km || (r.route || {}).distance || '?'} km`,
      duration:   `${orig.duration_minutes || '?'} min`,
      risk_score: r.probability || 0.5,
      risk_label: riskLabel(r.risk),
      is_best:    isBest,
      action:     r.action || 'Unknown',
      explanation: r.explanation || '',
      waypoints:  waypoints,
    };
  });

  // Build prediction from the best route
  const best = allRoutes[bestIdx] || {};
  const prediction = {
    risk_score:          best.probability || 0.2,
    risk_label:          riskLabel(best.risk),
    action:              best.risk === 'Low' ? 'PROCEED' : best.risk === 'High' ? 'AVOID' : 'CAUTION',
    action_description:  best.risk === 'Low'
      ? 'AI recommends this route. Proceed with confidence.'
      : best.risk === 'High'
        ? 'High risk detected. Consider an alternative route.'
        : 'Moderate risk. Proceed with caution and monitor conditions.',
    explanation:         best.explanation || raw.decision_reason || '',
    tags: [
      `🌤️ Weather: ${(best.route || {}).weather || 'N/A'}`,
      `🚗 Traffic: ${(best.route || {}).traffic || 'N/A'}`,
      `⏱️ ETA: ${routes[bestIdx]?.duration || '?'}`,
    ]
  };

  return {
    best_route_index: bestIdx,
    routes,
    prediction,
  };
}

/**
 * Generate a synthetic curved route between two points for map display.
 */
function generateSyntheticRoute(origin, dest, routeIndex, totalRoutes) {
  const steps = 8;
  const coords = [];
  // Offset factor for visual variation between routes
  const offset = (routeIndex - Math.floor(totalRoutes / 2)) * 0.012;

  for (let i = 0; i <= steps; i++) {
    const t   = i / steps;
    const lat = origin.lat + (dest.lat - origin.lat) * t;
    const lng = origin.lng + (dest.lng - origin.lng) * t;
    // Add a curve perpendicular to the main line
    const curve = Math.sin(t * Math.PI) * offset;
    coords.push([lat + curve, lng - curve]);
  }
  return coords;
}

/* ─── POST /predict (not used by current backend, kept for compat) ── */
async function apiFetchPredict(payload) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 800));
    return DEMO_PREDICT_RESPONSE;
  }

  return fetchWithTimeout(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

/* ─── POST /simulate (kept for compat — falls back to demo) ── */
async function apiFetchSimulate(origin, destination, hourOffset) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 600));
    return getDemoSimulateData(hourOffset);
  }

  // Backend doesn't have a /simulate endpoint yet — use demo data
  await new Promise(r => setTimeout(r, 400));
  return getDemoSimulateData(hourOffset);
}
