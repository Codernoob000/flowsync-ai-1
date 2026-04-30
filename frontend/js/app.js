/* ═══════════════════════════════════════════════════════════
   FLOWSYNC AI — MAIN APPLICATION
   State · Events · Particle Canvas · Chart · Typewriter
   ═══════════════════════════════════════════════════════════ */

/* ─── App State ──────────────────────────────────────────── */
const state = {
  currentResult:  null,
  isLoading:      false,
  chartInstance:  null,
  forecastData:   null,
  typewriterTimer: null
};

/* ─── DOM Refs ───────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  suppressAutofillIcons();
  initParticleCanvas();
  initMap();
  initNavbar();
  initHeroCounters();
  initStatsCounters();
  initScrollReveal();
  initEventListeners();
  drawForecastChart(0);
  initTimeSlider();
  addRippleEffect();
  initPlacesAutocomplete();

  // Auto-detect backend availability, then update connection status
  await autoDetectMode();
  checkConnectionStatus();

  // Only auto-load demo if backend is offline
  if (DEMO_MODE) {
    console.log('[FlowSync] Backend offline — auto-loading demo data...');
    setTimeout(() => handleAnalyzeRoutes(), 1500);
  } else {
    console.log('[FlowSync] Backend online — waiting for user input.');
  }
});

/* ════════════════════════════════════════════════════════════
   SUPPRESS AUTOFILL ICONS
   Sets attributes to discourage browser credential managers
   from injecting icons into our route input fields.
   ════════════════════════════════════════════════════════════ */
function suppressAutofillIcons() {
  const inputs = document.querySelectorAll('.route-input');
  inputs.forEach(input => {
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('data-lpignore', 'true');
    input.setAttribute('data-form-type', 'other');
    input.setAttribute('data-1p-ignore', '');
    input.setAttribute('data-bwignore', 'true');
  });
}


/* ════════════════════════════════════════════════════════════
   PLACES AUTOCOMPLETE
   ════════════════════════════════════════════════════════════ */
function initPlacesAutocomplete() {
  if (typeof google === 'undefined' || !google.maps || !google.maps.places) return;
  const originInput = $('origin-input');
  const destInput = $('dest-input');
  
  if (originInput) {
    new google.maps.places.Autocomplete(originInput, { fields: ['formatted_address', 'name'] });
  }
  if (destInput) {
    new google.maps.places.Autocomplete(destInput, { fields: ['formatted_address', 'name'] });
  }
}

/* ════════════════════════════════════════════════════════════
   PARTICLE CANVAS (Hero Background)
   ════════════════════════════════════════════════════════════ */
function initParticleCanvas() {
  const canvas = $('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.r  = Math.random() * 2 + 0.5;
      this.a  = Math.random() * 0.6 + 0.1;
      const hue = Math.random() > 0.5 ? '260, 75%, 65%' : '190, 95%, 45%';
      this.color = `hsla(${hue}, ${this.a})`;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  const N = Math.min(90, Math.floor((W * H) / 14000));
  for (let i = 0; i < N; i++) particles.push(new Particle());

  function connect() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 140) {
          ctx.strokeStyle = `rgba(124, 58, 237, ${(1 - d / 140) * 0.18})`;
          ctx.lineWidth   = 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    connect();
    requestAnimationFrame(loop);
  }

  loop();
}

/* ════════════════════════════════════════════════════════════
   NAVBAR
   ════════════════════════════════════════════════════════════ */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const burger = $('hamburger-btn');
  const navLinks = $('nav-links');

  // Scroll → add .scrolled class
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // Hamburger toggle
  burger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', isOpen);
  });

  // Close menu on nav link click (mobile)
  $$('#nav-links .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ════════════════════════════════════════════════════════════
   COUNTERS
   ════════════════════════════════════════════════════════════ */
function animateCounter(el, target, duration = 1800) {
  let start = null;
  const startVal = 0;
  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(startVal + eased * (target - startVal));
    if (progress < 1) requestAnimationFrame(step);
    else el.classList.add('count-done');
  }
  requestAnimationFrame(step);
}

function initHeroCounters() {
  $$('.hero-count').forEach(el => {
    const t = parseInt(el.dataset.target, 10);
    // Hero counts start immediately (delayed slightly)
    setTimeout(() => animateCounter(el, t, 2000), 800);
  });
}

function initStatsCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$('.count').forEach(el => {
          animateCounter(el, parseInt(el.dataset.target, 10), 1600);
        });
        obs.disconnect();
      }
    });
  }, { threshold: 0.5 });

  const bar = document.querySelector('.stats-bar');
  if (bar) obs.observe(bar);
}

/* ════════════════════════════════════════════════════════════
   SCROLL REVEAL
   ════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  // Add reveal class to sections automatically
  const targets = [
    '.stats-bar', '.demo-section .section-header',
    '.insights-section', '.simulate-section .section-header',
    '.how-section .section-header', '.step-card'
  ];

  targets.forEach(sel => {
    $$(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 0.08}s`;
    });
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.1 });

  $$('.reveal').forEach(el => obs.observe(el));
}

/* ════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ════════════════════════════════════════════════════════════ */
function initEventListeners() {
  // Analyze Routes button
  $('analyze-btn').addEventListener('click', () => handleAnalyzeRoutes());

  // Enter key in inputs
  [$('origin-input'), $('dest-input')].forEach(el => {
    el.addEventListener('keypress', e => {
      if (e.key === 'Enter') handleAnalyzeRoutes();
    });
  });

  // Swap button
  $('swap-btn').addEventListener('click', () => {
    const o = $('origin-input').value;
    $('origin-input').value = $('dest-input').value;
    $('dest-input').value   = o;
  });

  // Load Demo button
  $('demo-btn').addEventListener('click', () => {
    $('origin-input').value = 'Hyderabad Central Station, Secunderabad';
    $('dest-input').value   = 'HITEC City, Hyderabad';
    handleAnalyzeRoutes();
  });

  // Clear button
  $('clear-btn').addEventListener('click', () => {
    clearRoutes();
    resetMapView();
    $('route-results').style.display = 'none';
    $('insights').style.display      = 'none';
    state.currentResult = null;
  });

  // Simulate button
  $('simulate-btn').addEventListener('click', () => handleSimulate());
}

/* ════════════════════════════════════════════════════════════
   ANALYZE ROUTES (Main Flow)
   ════════════════════════════════════════════════════════════ */
async function handleAnalyzeRoutes() {
  if (state.isLoading) return;

  const origin = $('origin-input').value.trim();
  const dest   = $('dest-input').value.trim();

  console.log('[FlowSync] Analyze requested:', { origin, dest, DEMO_MODE });

  if (!origin || !dest) {
    showToast('Please enter both origin and destination.', 'error');
    return;
  }

  setLoadingState(true);

  try {
    const result = await apiFetchBestRoute(origin, dest);
    console.log('[FlowSync] Received result:', result);
    state.currentResult = result;

    renderRouteResults(result);
    drawRoutes(result);
    renderInsights(result.prediction);

    $('route-results').style.display = 'block';
    $('insights').style.display      = 'block';

    // Smooth scroll to map
    $('map-wrapper').scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('✅ AI route analysis complete!', 'success');

  } catch (err) {
    console.error('[FlowSync] Route analysis failed:', err);
    showToast('📡 Demo mode active', 'success');
    // Fallback to demo in case DEMO_MODE was false but server is down
    const result = DEMO_BEST_ROUTE_RESPONSE;
    state.currentResult = result;
    renderRouteResults(result);
    drawRoutes(result);
    renderInsights(result.prediction);
    $('route-results').style.display = 'block';
    $('insights').style.display      = 'block';
  } finally {
    setLoadingState(false);
  }
}

/* ─── Loading State ──────────────────────────────────────── */
function setLoadingState(isLoading) {
  state.isLoading = isLoading;
  const btn     = $('analyze-btn');
  const text    = $('btn-text');
  const loader  = $('btn-loader');

  btn.disabled            = isLoading;
  text.style.display      = isLoading ? 'none' : 'flex';
  loader.style.display    = isLoading ? 'flex' : 'none';

  if (isLoading) btn.classList.add('loading');
  else btn.classList.remove('loading');
}

/* ─── Render Route Cards ─────────────────────────────────── */
function renderRouteResults(data) {
  const container = $('route-cards');
  container.innerHTML = '';

  data.routes.forEach((route, i) => {
    const riskPct  = Math.round(route.risk_score * 100);
    const riskType = route.is_best ? 'best' : route.risk_label.toLowerCase();

    const card = document.createElement('div');
    card.className = `route-card ${riskType}`;
    card.setAttribute('data-route-index', i);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <div class="route-card-header">
        <div class="route-card-title">
          ${route.is_best ? '⭐' : getRouteIcon(route.risk_label)}
          ${route.name}
        </div>
        <span class="route-badge ${riskType}">${route.is_best ? 'AI BEST' : route.risk_label}</span>
      </div>
      <div class="route-card-via">${route.via}</div>
      <div class="route-card-meta">
        <div class="route-mini-bar">
          <div class="route-mini-fill ${riskType}" style="width:${riskPct}%"></div>
        </div>
        <span class="route-meta-text">${riskPct}% · ${route.duration}</span>
      </div>
    `;

    card.addEventListener('click', () => selectRoute(i, data));
    card.addEventListener('keypress', e => { if (e.key === 'Enter') selectRoute(i, data); });

    container.appendChild(card);

    // Best route → auto select
    if (route.is_best) setTimeout(() => selectRoute(i, data), 100);
  });
}

function getRouteIcon(label) {
  if (label === 'LOW')    return '🟢';
  if (label === 'MEDIUM') return '🟡';
  return '🔴';
}

/* ─── Select / Highlight a route ────────────────────────── */
function selectRoute(index, data) {
  // Update card active state
  $$('.route-card').forEach((c, i) => {
    c.classList.toggle('active', i === index);
  });

  // Highlight on map
  highlightRoute(index, data);

  // Update insights for the selected route
  const route = data.routes[index];
  const isBest = index === data.best_route_index;

  // If backend returned per-route predictions, use them; else use top-level
  const pred = data.prediction || {};
  renderInsights({
    ...pred,
    risk_score:          route.risk_score,
    risk_label:          route.risk_label,
    action:              isBest ? 'PROCEED' : (route.risk_label === 'HIGH' ? 'AVOID' : 'CAUTION'),
    action_description:  isBest
      ? 'AI recommends this route. Proceed with confidence.'
      : route.risk_label === 'HIGH'
        ? 'High risk detected. Consider an alternative route.'
        : 'Moderate risk. Proceed with caution and monitor conditions.',
    explanation: isBest
      ? pred.explanation
      : `Route ${index + 1} shows a ${Math.round(route.risk_score * 100)}% risk score via ${route.via}. ${
          route.risk_label === 'HIGH'
            ? 'Heavy congestion and adverse conditions detected on this corridor.'
            : 'Moderate traffic conditions detected. Allow extra buffer time.'
        }`,
    tags: pred.tags || []
  });
}

/* ─── Render AI Insights ─────────────────────────────────── */
function renderInsights(pred) {
  const riskPct   = Math.round(pred.risk_score * 100);
  const riskColor = getRiskColor(pred.risk_label);

  // Risk card
  const pulseDot  = $('risk-pulse-dot');
  const levelText = $('risk-level-text');
  const barFill   = $('risk-bar-fill');
  const scoreLabel = $('risk-score-label');

  pulseDot.style.background = riskColor;
  pulseDot.style.boxShadow  = `0 0 12px ${riskColor}80`;
  pulseDot.style.setProperty('--pulse-color', riskColor);
  levelText.textContent     = pred.risk_label;
  levelText.style.color     = riskColor;
  barFill.style.width       = `${riskPct}%`;
  barFill.style.background  = riskColor;
  barFill.style.boxShadow   = `0 0 12px ${riskColor}80`;
  scoreLabel.textContent    = `Risk Score: ${riskPct}%`;

  // Action card
  const actionBadge = $('action-badge-text');
  const actionDesc  = $('action-description');
  actionBadge.textContent  = pred.action;
  actionBadge.style.color  = getActionColor(pred.action);
  actionDesc.textContent   = pred.action_description;

  // Explanation card — typewriter effect
  startTypewriter($('explanation-text'), pred.explanation || '');

  // Tags
  if (pred.tags && pred.tags.length > 0) {
    const tagsEl = $('explanation-tags');
    tagsEl.innerHTML = pred.tags.map(t =>
      `<span class="exp-tag">${t}</span>`
    ).join('');
  }
}

function getRiskColor(label) {
  if (label === 'LOW')    return 'var(--risk-low)';
  if (label === 'MEDIUM') return 'var(--risk-med)';
  return 'var(--risk-high)';
}

function getActionColor(action) {
  if (action === 'PROCEED') return 'var(--risk-low)';
  if (action === 'CAUTION') return 'var(--risk-med)';
  return 'var(--risk-high)';
}

/* ─── Typewriter Effect ──────────────────────────────────── */
function startTypewriter(el, text) {
  if (state.typewriterTimer) clearInterval(state.typewriterTimer);
  el.textContent = '';

  // Add cursor
  const cursor = document.createElement('span');
  cursor.className = 'typewriter-cursor';
  el.appendChild(cursor);

  let i = 0;
  state.typewriterTimer = setInterval(() => {
    el.insertBefore(document.createTextNode(text[i++]), cursor);
    if (i >= text.length) {
      clearInterval(state.typewriterTimer);
      // Blink for 2s then remove
      setTimeout(() => cursor.remove(), 2000);
    }
  }, 22);
}

/* ════════════════════════════════════════════════════════════
   SIMULATION
   ════════════════════════════════════════════════════════════ */
function initTimeSlider() {
  const slider  = $('time-slider');
  const display = $('slider-value');

  slider.addEventListener('input', () => {
    const h = parseInt(slider.value, 10);
    display.textContent = h === 0 ? 'Now' : `+${h}h`;

    // Update gradient fill behind thumb
    const pct = (h / 24) * 100;
    slider.style.background =
      `linear-gradient(90deg, var(--violet) ${pct}%, var(--glass-border) ${pct}%)`;

    // Update sim risk bars from demo data
    const d = getDemoSimulateData(h);
    updateSimBars(d.route1, d.route2, d.route3);
    drawForecastChart(h);
  });
}

async function handleSimulate() {
  const origin = $('origin-input').value.trim() || 'Hyderabad Central';
  const dest   = $('dest-input').value.trim()   || 'HITEC City';
  const h      = parseInt($('time-slider').value, 10);

  const btn = $('simulate-btn');
  btn.textContent = '⏳ Simulating…';
  btn.disabled = true;

  try {
    const result = await apiFetchSimulate(origin, dest, h);
    updateSimBars(result.route1, result.route2, result.route3);
    drawForecastChart(h);
    showToast('🔮 Simulation updated!', 'success');
  } catch (err) {
    console.error('Simulate error:', err);
    const d = getDemoSimulateData(h);
    updateSimBars(d.route1, d.route2, d.route3);
    drawForecastChart(h);
  } finally {
    btn.textContent = '🔮 Run AI Simulation';
    btn.disabled    = false;
  }
}

function updateSimBars(r1, r2, r3) {
  const pct1 = Math.round(r1 * 100),
        pct2 = Math.round(r2 * 100),
        pct3 = Math.round(r3 * 100);

  $('sim-bar1').style.width = `${pct1}%`;
  $('sim-val1').textContent = `${pct1}%`;

  $('sim-bar2').style.width = `${pct2}%`;
  $('sim-val2').textContent = `${pct2}%`;

  $('sim-bar3').style.width = `${pct3}%`;
  $('sim-val3').textContent = `${pct3}%`;
}

/* ════════════════════════════════════════════════════════════
   FORECAST CHART (Canvas)
   ════════════════════════════════════════════════════════════ */
function drawForecastChart(currentHour = 0) {
  const canvas = $('forecast-chart');
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.offsetWidth  || 600;
  const H   = canvas.offsetHeight || 220;

  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const series = getDemoForecastSeries();
  const labels = Array.from({ length: 25 }, (_, i) => i);

  const pad  = { top: 16, right: 20, bottom: 32, left: 44 };
  const cW   = W - pad.left - pad.right;
  const cH   = H - pad.top  - pad.bottom;

  // Gridlines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth   = 1;
  for (let row = 0; row <= 4; row++) {
    const y = pad.top + (cH / 4) * row;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
  }

  // Y-axis labels
  ctx.fillStyle  = 'rgba(148,163,184,0.5)';
  ctx.font       = '10px JetBrains Mono, monospace';
  ctx.textAlign  = 'right';
  ['100%', '75%', '50%', '25%', '0%'].forEach((lbl, i) => {
    const y = pad.top + (cH / 4) * i + 3;
    ctx.fillText(lbl, pad.left - 6, y);
  });

  // X-axis labels
  ctx.textAlign = 'center';
  [0, 6, 12, 18, 24].forEach(h => {
    const x = pad.left + (h / 24) * cW;
    ctx.fillText(h === 0 ? 'Now' : `${h}h`, x, H - pad.bottom + 16);
  });

  // Draw each series
  const routes = [
    { data: series.r1, color: '#3b82f6', label: 'Best Route' },
    { data: series.r2, color: '#eab308', label: 'Route 2' },
    { data: series.r3, color: '#ef4444', label: 'Route 3' }
  ];

  routes.forEach(({ data, color }) => {
    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
    grad.addColorStop(0, color + '30');
    grad.addColorStop(1, color + '00');

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = pad.left + (i / 24) * cW;
      const y = pad.top  + cH - v * cH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    const lastX = pad.left + cW;
    const lastY = pad.top  + cH;
    ctx.lineTo(lastX, lastY);
    ctx.lineTo(pad.left, lastY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    data.forEach((v, i) => {
      const x = pad.left + (i / 24) * cW;
      const y = pad.top  + cH - v * cH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  // Current time marker
  if (currentHour > 0) {
    const xNow = pad.left + (currentHour / 24) * cW;
    ctx.strokeStyle = 'rgba(124,58,237,0.7)';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xNow, pad.top);
    ctx.lineTo(xNow, pad.top + cH);
    ctx.stroke();
    ctx.setLineDash([]);
    // Label
    ctx.fillStyle  = 'rgba(124,58,237,0.8)';
    ctx.font       = '9px JetBrains Mono, monospace';
    ctx.textAlign  = 'center';
    ctx.fillText(`+${currentHour}h`, xNow, pad.top - 4);
  }
}

/* ════════════════════════════════════════════════════════════
   CONNECTION STATUS
   ════════════════════════════════════════════════════════════ */
async function checkConnectionStatus() {
  const el   = $('connection-status');
  const text = $('status-text');

  if (DEMO_MODE) {
    el.classList.add('connected');
    text.textContent = 'Demo Mode';
    return;
  }

  text.textContent = 'Connecting…';
  const ok = await checkBackendHealth();
  if (ok) {
    el.classList.add('connected');
    text.textContent = 'Connected';
  } else {
    el.classList.add('error');
    text.textContent = 'Offline';
    showToast('⚠️ Backend offline. Running in demo mode.', 'error');
  }
}

/* ════════════════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════════════════ */
function showToast(message, type = 'success') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className   = `toast toast-${type}`;

  requestAnimationFrame(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  });
}

/* ════════════════════════════════════════════════════════════
   BUTTON RIPPLE
   ════════════════════════════════════════════════════════════ */
function addRippleEffect() {
  $$('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect   = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className   = 'btn-ripple';
      ripple.style.left  = `${e.clientX - rect.left - 20}px`;
      ripple.style.top   = `${e.clientY - rect.top  - 20}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

/* ════════════════════════════════════════════════════════════
   RESIZE HANDLING
   ════════════════════════════════════════════════════════════ */
window.addEventListener('resize', () => {
  invalidateMapSize();
  drawForecastChart(parseInt($('time-slider').value, 10));
}, { passive: true });
