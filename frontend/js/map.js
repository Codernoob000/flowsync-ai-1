/* ═══════════════════════════════════════════════════════════
   FLOWSYNC AI — MAP MODULE
   Leaflet.js · CartoDB Dark Tiles · Route Rendering
   Works with BOTH demo coords and live backend waypoints
   ═══════════════════════════════════════════════════════════ */

let leafletMap     = null;
let routeLayers    = [];
let markerOrigin   = null;
let markerDest     = null;

/* ─── Color Map ──────────────────────────────────────────── */
const ROUTE_COLORS = {
  best:   { color: '#3b82f6', weight: 6, opacity: 1.0 },
  low:    { color: '#22c55e', weight: 4, opacity: 0.75 },
  medium: { color: '#eab308', weight: 4, opacity: 0.75 },
  high:   { color: '#ef4444', weight: 4, opacity: 0.75 }
};

function getRiskType(riskLabel, isBest) {
  if (isBest) return 'best';
  if (riskLabel === 'LOW')    return 'low';
  if (riskLabel === 'MEDIUM') return 'medium';
  return 'high';
}

/* ─── Initialize Map ─────────────────────────────────────── */
function initMap() {
  if (leafletMap) return;

  leafletMap = L.map('map', {
    center: DEMO_MAP_CENTER,
    zoom:   DEMO_MAP_ZOOM,
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(leafletMap);

  // Fix Leaflet z-index
  document.querySelector('.leaflet-pane').style.zIndex = '1';
  document.querySelectorAll('.leaflet-control').forEach(el => {
    el.style.zIndex = '400';
  });

  addCityLabel();
}

/* ─── Get waypoint coords for a route ────────────────────── */
function getRouteCoords(route, index) {
  // 1. Backend waypoints via transformed response
  if (route.waypoints && route.waypoints.length > 1) {
    return route.waypoints.map(wp =>
      Array.isArray(wp) ? wp : [wp.lat || wp[0], wp.lng || wp[1]]
    );
  }
  // 2. Fallback to demo coords
  if (typeof DEMO_ROUTE_COORDS !== 'undefined') {
    return DEMO_ROUTE_COORDS[index] || DEMO_ROUTE_COORDS[0];
  }
  return [];
}

/* ─── Draw all routes on map ─────────────────────────────── */
function drawRoutes(routeData) {
  clearRoutes();

  console.log('[FlowSync Map] Drawing routes:', routeData);

  const allCoords = [];

  routeData.routes.forEach((route, i) => {
    const coords   = getRouteCoords(route, i);
    if (!coords || coords.length < 2) {
      console.warn('[FlowSync Map] Skipping route with invalid coords:', route);
      return;
    }

    const riskType = getRiskType(route.risk_label, route.is_best);
    const style    = ROUTE_COLORS[riskType];

    // Halo for best route
    if (route.is_best) {
      const haloLine = L.polyline(coords, {
        color: style.color, weight: 14, opacity: 0.2
      }).addTo(leafletMap);
      routeLayers.push(haloLine);
    }

    // Main polyline
    const line = L.polyline(coords, {
      color:    style.color,
      weight:   style.weight,
      opacity:  style.opacity,
      lineCap:  'round',
      lineJoin: 'round'
    }).addTo(leafletMap);

    line.bindPopup(`
      <div class="popup-title">${route.name}</div>
      <div class="popup-meta">📍 ${route.via}</div>
      <div class="popup-meta">📏 ${route.distance} · ⏱️ ${route.duration}</div>
      <div class="popup-risk ${riskType}">
        ${route.is_best ? '⭐ BEST ROUTE · ' : ''}Risk: ${Math.round(route.risk_score * 100)}% ${route.risk_label}
      </div>
    `, { maxWidth: 280 });

    routeLayers.push(line);
    allCoords.push(...coords);
  });

  // Markers from first route's endpoints
  const firstRoute  = routeData.routes[0];
  const firstCoords = getRouteCoords(firstRoute, 0);
  if (firstCoords.length >= 2) {
    addMarkers(
      { latlng: firstCoords[0], label: 'origin' },
      { latlng: firstCoords[firstCoords.length - 1], label: 'destination' }
    );
  }

  // Fly to fit all routes
  if (allCoords.length) {
    const bounds = L.latLngBounds(allCoords);
    leafletMap.flyToBounds(bounds, { padding: [48, 48], duration: 1.4 });
  }
}

/* ─── Highlight a specific route ─────────────────────────── */
function highlightRoute(routeIndex, routeData) {
  clearRoutes();
  const allCoords = [];

  routeData.routes.forEach((route, i) => {
    const coords   = getRouteCoords(route, i);
    if (!coords || coords.length < 2) return;

    const isActive = i === routeIndex;
    const riskType = getRiskType(route.risk_label, i === routeData.best_route_index);
    const style    = ROUTE_COLORS[riskType];
    const weight   = isActive ? style.weight + 2 : style.weight;
    const opacity  = isActive ? 1.0 : 0.35;

    const line = L.polyline(coords, {
      color: style.color, weight, opacity,
      lineCap: 'round', lineJoin: 'round'
    }).addTo(leafletMap);

    if (isActive) {
      const halo = L.polyline(coords, {
        color: style.color, weight: weight + 10, opacity: 0.15
      }).addTo(leafletMap);
      routeLayers.push(halo);
    }

    routeLayers.push(line);
    allCoords.push(...coords);
  });

  const firstRoute  = routeData.routes[0];
  const firstCoords = getRouteCoords(firstRoute, 0);
  if (firstCoords.length >= 2) {
    addMarkers(
      { latlng: firstCoords[0], label: 'origin' },
      { latlng: firstCoords[firstCoords.length - 1], label: 'destination' }
    );
  }
}

/* ─── Markers ────────────────────────────────────────────── */
function addMarkers(origin, dest) {
  if (markerOrigin) leafletMap.removeLayer(markerOrigin);
  if (markerDest)   leafletMap.removeLayer(markerDest);

  const originIcon = L.divIcon({
    className: '',
    html: `<div class="custom-marker-origin"><span>🚀</span></div>`,
    iconSize: [36, 36], iconAnchor: [18, 36]
  });
  const destIcon = L.divIcon({
    className: '',
    html: `<div class="custom-marker-dest"><span>📍</span></div>`,
    iconSize: [36, 36], iconAnchor: [18, 36]
  });

  markerOrigin = L.marker(origin.latlng, { icon: originIcon })
    .addTo(leafletMap)
    .bindPopup('<div class="popup-title">🚀 Origin</div><div class="popup-meta">Starting Point</div>');

  markerDest = L.marker(dest.latlng, { icon: destIcon })
    .addTo(leafletMap)
    .bindPopup('<div class="popup-title">📍 Destination</div><div class="popup-meta">End Point</div>');
}

/* ─── Clear / Reset ──────────────────────────────────────── */
function clearRoutes() {
  routeLayers.forEach(layer => leafletMap.removeLayer(layer));
  routeLayers = [];
  if (markerOrigin) { leafletMap.removeLayer(markerOrigin); markerOrigin = null; }
  if (markerDest)   { leafletMap.removeLayer(markerDest);   markerDest   = null; }
}

function resetMapView() {
  if (!leafletMap) return;
  leafletMap.flyTo(DEMO_MAP_CENTER, DEMO_MAP_ZOOM, { duration: 1 });
}

/* ─── City label ─────────────────────────────────────────── */
function addCityLabel() {
  const icon = L.divIcon({
    className: '',
    html: `<div style="
      color: rgba(124,58,237,0.6);
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      pointer-events: none; white-space: nowrap;
      text-shadow: 0 0 20px rgba(124,58,237,0.8);
    ">HYDERABAD</div>`,
    iconSize: [100, 20], iconAnchor: [50, 10]
  });
  L.marker([17.385, 78.487], { icon: icon, interactive: false }).addTo(leafletMap);
}

/* ─── Invalidate size (needed by app.js on resize) ───────── */
function invalidateMapSize() {
  if (leafletMap) setTimeout(() => leafletMap.invalidateSize(), 200);
}