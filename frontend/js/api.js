/* ═══════════════════════════════════════════════════════════
   FLOWSYNC AI — API CLIENT
   DEMO_MODE (set in demo.js) → auto-detected via health check
   If backend is reachable → live mode; otherwise → demo fallback
   ═══════════════════════════════════════════════════════════ */

const API_BASE_URL = 'http://127.0.0.1:8000';
const API_TIMEOUT  = 15000;

/* ─── Auto-detect backend availability ───────────────────── */
async function autoDetectMode() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      DEMO_MODE = false;
      console.log('[FlowSync API] ✅ Backend detected — LIVE MODE');
      return true;
    }
  } catch (e) {
    console.warn('[FlowSync API] ⚠️ Backend unreachable — DEMO MODE', e.message || '');
  }
  DEMO_MODE = true;
  return false;
}

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
  if (DEMO_MODE) {
    console.log('[FlowSync API] Demo mode — skipping health check');
    return true;
  }
  try {
    await fetchWithTimeout(`${API_BASE_URL}/health`, { method: 'GET' });
    console.log('[FlowSync API] Health check: OK');
    return true;
  } catch {
    try {
      await fetchWithTimeout(`${API_BASE_URL}/`, { method: 'GET' });
      return true;
    } catch {
      console.warn('[FlowSync API] Health check: OFFLINE');
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
  'bengaluru':                  { lat: 12.9716, lng: 77.5946 },
  'chennai':                    { lat: 13.0827, lng: 80.2707 },
  'delhi':                      { lat: 28.7041, lng: 77.1025 },
  'new delhi':                  { lat: 28.6139, lng: 77.2090 },
  'hyderabad':                  { lat: 17.3850, lng: 78.4867 },
  'kolkata':                    { lat: 22.5726, lng: 88.3639 },
  'ahmedabad':                  { lat: 23.0225, lng: 72.5714 },
  'jaipur':                     { lat: 26.9124, lng: 75.7873 },
  'lucknow':                    { lat: 26.8467, lng: 80.9462 },
  'nagpur':                     { lat: 21.1458, lng: 79.0882 },
  'visakhapatnam':              { lat: 17.6868, lng: 83.2185 },
  'vizag':                      { lat: 17.6868, lng: 83.2185 },
};

function getCoords(locationStr) {
  const lower = locationStr.toLowerCase().trim();
  for (const [key, val] of Object.entries(CITY_COORDS)) {
    if (lower.includes(key)) return val;
  }
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
async function apiFetchBestRoute(origin, destination) {
  /* ── Demo mode: return mock data directly ─────────────── */
  if (DEMO_MODE) {
    console.log('[FlowSync API] 🔥 DEMO MODE — returning mock data');
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    return DEMO_BEST_ROUTE_RESPONSE;
  }

  /* ── Live mode: call backend ──────────────────────────── */
  const originCoords = getCoords(origin);
  const destCoords   = getCoords(destination);

  const payload = {
    origin,
    destination,
    origin_lat: originCoords.lat,
    origin_lng: originCoords.lng,
    dest_lat:   destCoords.lat,
    dest_lng:   destCoords.lng,
  };

  console.log('[FlowSync API] POST /routes/best-route', payload);

  const raw = await fetchWithTimeout(`${API_BASE_URL}/routes/best-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log('[FlowSync API] Raw backend response:', raw);
  return transformBackendResponse(raw, originCoords, destCoords);
}

/* ─── Transform backend → frontend shape ─────────────────── */
function transformBackendResponse(raw, originCoords, destCoords) {
  const allRoutes = raw.all_routes || [];
  const bestRoute = raw.best_route || allRoutes[0];

  let bestIdx = 0;
  for (let i = 0; i < allRoutes.length; i++) {
    if (allRoutes[i] === bestRoute || allRoutes[i].score === bestRoute.score) {
      bestIdx = i;
      break;
    }
  }

  const routes = allRoutes.map((r, i) => {
    const orig   = r.original_route || {};
    const isBest = i === bestIdx;

    let waypoints = [];
    if (orig.waypoints && orig.waypoints.length > 2) {
      waypoints = orig.waypoints.map(wp =>
        Array.isArray(wp) ? wp : [wp.lat, wp.lng]
      );
    } else {
      waypoints = generateSyntheticRoute(originCoords, destCoords, i, allRoutes.length);
    }

    return {
      id:          i,
      name:        orig.label || `Route ${i + 1}`,
      via:         `${(r.route || {}).traffic || 'moderate'} traffic · ${(r.route || {}).weather || 'clear'} weather`,
      distance:    `${orig.distance_km || (r.route || {}).distance || '?'} km`,
      duration:    `${orig.duration_minutes || '?'} min`,
      risk_score:  r.probability || 0.5,
      risk_label:  riskLabel(r.risk),
      is_best:     isBest,
      action:      r.action || 'Unknown',
      explanation: r.explanation || '',
      waypoints:   waypoints,
    };
  });

  const best = allRoutes[bestIdx] || {};
  const prediction = {
    risk_score:         best.probability || 0.2,
    risk_label:         riskLabel(best.risk),
    action:             best.risk === 'Low' ? 'PROCEED' : best.risk === 'High' ? 'AVOID' : 'CAUTION',
    action_description: best.risk === 'Low'
      ? 'AI recommends this route. Proceed with confidence.'
      : best.risk === 'High'
        ? 'High risk detected. Consider an alternative route.'
        : 'Moderate risk. Proceed with caution and monitor conditions.',
    explanation:        best.explanation || raw.decision_reason || '',
    tags: [
      `🌤️ Weather: ${(best.route || {}).weather || 'N/A'}`,
      `🚗 Traffic: ${(best.route || {}).traffic || 'N/A'}`,
      `⏱️ ETA: ${routes[bestIdx]?.duration || '?'}`,
    ]
  };

  return { best_route_index: bestIdx, routes, prediction };
}

/* ─── Synthetic route generator ──────────────────────────── */
function generateSyntheticRoute(origin, dest, routeIndex, totalRoutes) {
  const steps = 8;
  const coords = [];
  const offset = (routeIndex - Math.floor(totalRoutes / 2)) * 0.012;
  for (let i = 0; i <= steps; i++) {
    const t     = i / steps;
    const lat   = origin.lat + (dest.lat - origin.lat) * t;
    const lng   = origin.lng + (dest.lng - origin.lng) * t;
    const curve = Math.sin(t * Math.PI) * offset;
    coords.push([lat + curve, lng - curve]);
  }
  return coords;
}

/* ─── Simulate (always uses demo data) ───────────────────── */
async function apiFetchSimulate(origin, destination, hourOffset) {
  await new Promise(r => setTimeout(r, 400));
  return getDemoSimulateData(hourOffset);
}

/* ─── Predict (kept for compat) ──────────────────────────── */
async function apiFetchPredict(payload) {
  await new Promise(r => setTimeout(r, 500));
  return DEMO_PREDICT_RESPONSE;
}