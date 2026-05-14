const SCENES = {
  has: {
    label: "Has It",
    metric: "has",
    caption:
      "Reserve circles show who has oil underground. The position is directional and abstract, not a map projection.",
  },
  pumps: {
    label: "Pumps It",
    metric: "pumps",
    caption:
      "Production circles show who turns underground oil into supply. Big reserve bodies do not always become big pump bodies.",
  },
  burns: {
    label: "Burns It",
    metric: "burns",
    caption:
      "Consumption circles show demand power. China, India, Japan, South Korea, and the United States pull oil through use.",
  },
  mismatch: {
    label: "Mismatch",
    metric: "mismatch",
    caption:
      "Mismatch mode keeps all three circles visible and makes the contradiction inside each country cluster easier to compare.",
  },
};

const COUNTRIES = ["CAN", "USA", "VEN", "RUS", "SAU", "IRN", "IRQ", "CHN", "IND", "JPN", "KOR"];
const COUNTRY_LAYOUT = {
  CAN: { x: 0.18, y: 0.24, label: "Canada", region: "Northwest" },
  USA: { x: 0.22, y: 0.44, label: "United States", region: "West" },
  VEN: { x: 0.27, y: 0.68, label: "Venezuela", region: "Southwest" },
  RUS: { x: 0.58, y: 0.17, label: "Russia", region: "North" },
  SAU: { x: 0.50, y: 0.48, label: "Saudi Arabia", region: "Middle" },
  IRN: { x: 0.58, y: 0.42, label: "Iran", region: "Middle East" },
  IRQ: { x: 0.54, y: 0.55, label: "Iraq", region: "Middle East" },
  CHN: { x: 0.76, y: 0.42, label: "China", region: "East" },
  IND: { x: 0.70, y: 0.66, label: "India", region: "Southeast" },
  JPN: { x: 0.88, y: 0.35, label: "Japan", region: "Far East" },
  KOR: { x: 0.84, y: 0.27, label: "South Korea", region: "Northeast" },
};

const METRICS = {
  has: {
    label: "Has",
    field: "oil_reserves",
    share: "global_reserve_share",
    rank: "reserve_rank",
    color: [205, 78, 51],
    offset: [-0.92, -0.46],
  },
  pumps: {
    label: "Pumps",
    field: "oil_production",
    share: "global_production_share",
    rank: "production_rank",
    color: [223, 158, 47],
    offset: [0.92, -0.42],
  },
  burns: {
    label: "Burns",
    field: "oil_consumption",
    share: "global_consumption_share",
    rank: "consumption_rank",
    color: [54, 145, 134],
    offset: [0.02, 1.0],
  },
};

const NUMERIC_FIELDS = [
  "year",
  "oil_reserves",
  "oil_production",
  "oil_consumption",
  "reserve_rank",
  "production_rank",
  "consumption_rank",
  "global_reserve_share",
  "global_production_share",
  "global_consumption_share",
  "net_oil_balance_proxy",
  "production_consumption_ratio",
  "oil_power_index",
];

let oilData;
let rowsByYear = new Map();
let currentYear = 2020;
let currentScene = "mismatch";
let countryNodes = [];
let metricNodes = [];
let hovered = null;
let selected = null;
let yearSlider;
let yearLabel;
let detailPanel;
let captionEl;
let lastPanelKey = "";

function preload() {
  oilData = loadJSON("./public/data/oil_power_mvp.json");
}

function setup() {
  const holder = document.getElementById("sketch-holder");
  const canvas = createCanvas(holder.clientWidth, holder.clientHeight);
  canvas.parent("sketch-holder");
  pixelDensity(Math.min(2, window.devicePixelRatio || 1));
  frameRate(30);

  yearSlider = document.getElementById("year-slider");
  yearLabel = document.getElementById("year-label");
  detailPanel = document.getElementById("detail-panel");
  captionEl = document.getElementById("scene-caption");

  for (const row of oilData.rows) {
    normalizeRow(row);
    if (!rowsByYear.has(row.year)) rowsByYear.set(row.year, []);
    rowsByYear.get(row.year).push(row);
  }

  const years = oilData.metadata.completeYears;
  yearSlider.min = Math.min(...years);
  yearSlider.max = Math.max(...years);
  yearSlider.value = oilData.metadata.anchorYear;
  currentYear = Number(yearSlider.value);
  yearLabel.textContent = currentYear;

  document.querySelectorAll(".scene-tab").forEach((button) => {
    button.addEventListener("click", () => setScene(button.dataset.scene));
  });
  yearSlider.addEventListener("input", () => {
    currentYear = Number(yearSlider.value);
    yearLabel.textContent = currentYear;
    selected = null;
    lastPanelKey = "";
    rebuildGraph();
  });

  setScene("mismatch");
}

function windowResized() {
  const holder = document.getElementById("sketch-holder");
  resizeCanvas(holder.clientWidth, holder.clientHeight);
  rebuildGraph();
}

function draw() {
  drawBackground();
  drawCompassFrame();
  updateGraph();
  drawLinks();
  drawCountryNodes();
  drawMetricNodes();
  drawCenterLegend();
  updateHover();
  updateDetailPanel();
}

function setScene(scene) {
  currentScene = scene;
  document.querySelectorAll(".scene-tab").forEach((button) => {
    const active = button.dataset.scene === scene;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  captionEl.textContent = SCENES[scene].caption;
  selected = null;
  lastPanelKey = "";
  rebuildGraph();
}

function rebuildGraph() {
  const rows = rowsByYear.get(Number(currentYear)) || [];
  const rowByIso = new Map(rows.map((row) => [row.iso3, row]));
  countryNodes = [];
  metricNodes = [];

  for (const iso3 of COUNTRIES) {
    const row = rowByIso.get(iso3);
    if (!row) continue;
    const layout = COUNTRY_LAYOUT[iso3];
    const anchor = makeCountryNode(row, layout);
    countryNodes.push(anchor);

    for (const metricKey of Object.keys(METRICS)) {
      metricNodes.push(makeMetricNode(anchor, metricKey));
    }
  }
}

function makeCountryNode(row, layout) {
  const marginX = Math.max(82, width * 0.09);
  const marginY = Math.max(76, height * 0.12);
  const tx = map(layout.x, 0, 1, marginX, width - marginX);
  const ty = map(layout.y, 0, 1, marginY, height - marginY);
  return {
    type: "country",
    iso3: row.iso3,
    country_name: row.country_name,
    region: layout.region,
    row,
    tx,
    ty,
    x: tx,
    y: ty,
    r: 7,
  };
}

function makeMetricNode(anchor, metricKey) {
  const metric = METRICS[metricKey];
  const share = safeNumber(anchor.row[metric.share]);
  const value = anchor.row[metric.field];
  const base = Math.min(width, height);
  const clusterRadius = constrain(base * 0.055, 34, 54);
  const rawRadius = map(Math.sqrt(Math.max(0, share)), 0, Math.sqrt(0.22), 4, 42);
  const r = value > 0 ? constrain(rawRadius, 5, 42) : 4;
  return {
    type: "metric",
    metricKey,
    iso3: anchor.iso3,
    country_name: anchor.country_name,
    region: anchor.region,
    row: anchor.row,
    parent: anchor,
    share,
    value,
    rank: anchor.row[metric.rank],
    r,
    tx: constrain(anchor.tx + metric.offset[0] * clusterRadius, 36, width - 36),
    ty: constrain(anchor.ty + metric.offset[1] * clusterRadius, 36, height - 36),
    x: constrain(anchor.tx + metric.offset[0] * clusterRadius, 36, width - 36),
    y: constrain(anchor.ty + metric.offset[1] * clusterRadius, 36, height - 36),
  };
}

function updateGraph() {
  for (const node of [...countryNodes, ...metricNodes]) {
    const drift = node.type === "metric" ? sin(frameCount * 0.025 + node.x * 0.01 + node.y * 0.01) * 1.2 : 0;
    node.x += (node.tx - node.x) * 0.09;
    node.y += (node.ty + drift - node.y) * 0.09;
  }
}

function drawBackground() {
  background(23, 16, 9);
  noFill();
  stroke(255, 235, 194, 12);
  strokeWeight(1);
  const step = 36;
  for (let x = -step; x < width + step; x += step) line(x, 0, x + width * 0.12, height);
  for (let y = 0; y < height; y += step) line(0, y, width, y - height * 0.08);

  const glow = drawingContext.createRadialGradient(width * 0.58, height * 0.45, 20, width * 0.58, height * 0.45, width * 0.75);
  glow.addColorStop(0, "rgba(209, 151, 55, 0.22)");
  glow.addColorStop(0.45, "rgba(55, 128, 117, 0.10)");
  glow.addColorStop(1, "rgba(23, 16, 9, 0)");
  drawingContext.fillStyle = glow;
  drawingContext.fillRect(0, 0, width, height);
}

function drawCompassFrame() {
  const cx = width / 2;
  const cy = height / 2;
  stroke(246, 232, 199, 42);
  strokeWeight(1);
  line(cx, 30, cx, height - 30);
  line(30, cy, width - 30, cy);
  noFill();
  ellipse(cx, cy, Math.min(width, height) * 0.62, Math.min(width, height) * 0.62);
  ellipse(cx, cy, Math.min(width, height) * 0.92, Math.min(width, height) * 0.92);

  noStroke();
  fill(246, 232, 199, 150);
  textFont("Avenir Next Condensed, Gill Sans, sans-serif");
  textSize(11);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("NORTH", cx, 20);
  text("SOUTH", cx, height - 18);
  textAlign(LEFT, CENTER);
  text("WEST", 18, cy);
  textAlign(RIGHT, CENTER);
  text("EAST", width - 18, cy);
}

function drawLinks() {
  for (const node of metricNodes) {
    const active = isMetricActive(node.metricKey);
    const metric = METRICS[node.metricKey];
    const alpha = active ? 132 : 42;
    stroke(metric.color[0], metric.color[1], metric.color[2], alpha);
    strokeWeight(active ? 1.4 : 0.8);
    line(node.parent.x, node.parent.y, node.x, node.y);
  }

  if (currentScene === "mismatch") {
    for (const country of countryNodes) {
      const score = mismatchScore(country.row);
      stroke(246, 232, 199, map(score, 0, 1, 18, 105));
      strokeWeight(map(score, 0, 1, 0.5, 2.2));
      line(width / 2, height / 2, country.x, country.y);
    }
  }
}

function drawCountryNodes() {
  for (const node of countryNodes) {
    const score = mismatchScore(node.row);
    noStroke();
    fill(246, 232, 199, currentScene === "mismatch" ? 150 + score * 90 : 150);
    circle(node.x, node.y, 12 + score * 8);

    fill(246, 232, 199, 218);
    textFont("Avenir Next Condensed, Gill Sans, sans-serif");
    textSize(width < 700 ? 10 : 12);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(node.iso3, node.x, node.y - 18);
  }
}

function drawMetricNodes() {
  for (const node of metricNodes) {
    const metric = METRICS[node.metricKey];
    const active = isMetricActive(node.metricKey);
    const isHot = hovered === node || selected === node || hovered === node.parent || selected === node.parent;
    const alpha = active ? 235 : 78;
    const pulse = isHot ? 1.18 : 1;

    if (currentScene === "mismatch") drawMismatchHalo(node);

    stroke(metric.color[0], metric.color[1], metric.color[2], active ? 238 : 92);
    strokeWeight(active ? 2.1 : 1.1);
    if (node.value > 0) fill(metric.color[0], metric.color[1], metric.color[2], alpha);
    else fill(23, 16, 9, 90);
    circle(node.x, node.y, node.r * 2 * pulse);

    if (active || isHot || node.r > 16) {
      fill(255, 247, 226, active ? 232 : 140);
      noStroke();
      textFont("Avenir Next Condensed, Gill Sans, sans-serif");
      textSize(constrain(node.r * 0.55, 8, 13));
      textStyle(BOLD);
      textAlign(CENTER, CENTER);
      text(metric.label, node.x, node.y);
    }
  }
}

function drawMismatchHalo(node) {
  const score = mismatchScore(node.row);
  const metric = METRICS[node.metricKey];
  noFill();
  stroke(metric.color[0], metric.color[1], metric.color[2], 34 + score * 84);
  strokeWeight(1);
  circle(node.x, node.y, node.r * 2 + 10 + score * 16);
}

function drawCenterLegend() {
  const cx = width / 2;
  const cy = height / 2;
  noStroke();
  fill(23, 16, 9, 190);
  rectMode(CENTER);
  rect(cx, cy, 154, 58, 999);
  rectMode(CORNER);

  fill(246, 232, 199, 224);
  textFont("Avenir Next Condensed, Gill Sans, sans-serif");
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(12);
  text("OIL POWER", cx, cy - 10);
  textStyle(NORMAL);
  textSize(10);
  text("has / pumps / burns", cx, cy + 10);
}

function updateHover() {
  hovered = null;
  const allNodes = [...metricNodes, ...countryNodes];
  let best = null;
  let bestDistance = Infinity;
  for (const node of allNodes) {
    const hitRadius = node.type === "metric" ? Math.max(node.r, 9) + 6 : 18;
    const d = dist(mouseX, mouseY, node.x, node.y);
    if (d < hitRadius && d < bestDistance) {
      best = node;
      bestDistance = d;
    }
  }
  hovered = best;
}

function mousePressed() {
  if (hovered) {
    selected = hovered;
    lastPanelKey = "";
  }
}

function updateDetailPanel() {
  const node = hovered || selected;
  const key = node ? `${currentYear}:${currentScene}:${node.iso3}:${node.type}:${node.metricKey || "country"}` : `${currentYear}:${currentScene}:empty`;
  if (key === lastPanelKey) return;
  lastPanelKey = key;

  if (!node) {
    detailPanel.innerHTML = `
      <p class="panel-eyebrow">${SCENES[currentScene].label} / ${currentYear}</p>
      <h2>Hover a circle</h2>
      <p class="panel-copy">Each country has three linked circles: has, pumps, and burns. Placement is a directional graph, not a map.</p>
    `;
    return;
  }

  const row = node.row;
  const title = node.type === "metric" ? `${row.country_name}: ${METRICS[node.metricKey].label}` : row.country_name;
  detailPanel.innerHTML = `
    <p class="panel-eyebrow">${node.region} / ${currentYear}</p>
    <h2>${title}</h2>
    <p class="panel-copy">${storyFor(row)}</p>
    <div class="metric-grid">
      ${metric("Has share", percent(row.global_reserve_share))}
      ${metric("Pumps share", percent(row.global_production_share))}
      ${metric("Burns share", percent(row.global_consumption_share))}
      ${metric("Reserve rank", row.reserve_rank)}
      ${metric("Production rank", row.production_rank)}
      ${metric("Consumption rank", row.consumption_rank)}
      ${metric("Power index", fixed(row.oil_power_index))}
    </div>
  `;
}

function isMetricActive(metricKey) {
  return currentScene === "mismatch" || SCENES[currentScene].metric === metricKey;
}

function mismatchScore(row) {
  const reserve = safeNumber(row.global_reserve_share);
  const production = safeNumber(row.global_production_share);
  const consumption = safeNumber(row.global_consumption_share);
  return constrain(Math.max(Math.abs(reserve - production), Math.abs(reserve - consumption), Math.abs(production - consumption)) * 5.5, 0, 1);
}

function storyFor(row) {
  if (row.iso3 === "VEN") return "Huge reserve circle, much smaller pump and burn circles: oil underground is not the same as oil power.";
  if (row.iso3 === "USA") return "All three circles matter: the United States is a production and demand power, but not the largest reserve body.";
  if (row.iso3 === "CHN" || row.iso3 === "IND") return "Demand power shows up through the burn circle more than the has circle.";
  if (row.iso3 === "SAU" || row.iso3 === "RUS") return "Production-side power: reserve mass is connected to a large pump circle.";
  if (row.iso3 === "JPN" || row.iso3 === "KOR") return "Demand-heavy, reserve-light: useful later when the trade chapter explains who supplies them.";
  if (row.iso3 === "CAN" || row.iso3 === "IRN" || row.iso3 === "IRQ") return "A reserve-heavy country where the relative pump circle tells whether underground oil becomes supply.";
  return "Compare the three circles to see how reserves, production, and consumption split apart.";
}

function normalizeRow(row) {
  for (const field of NUMERIC_FIELDS) {
    if (row[field] !== null && row[field] !== undefined) row[field] = Number(row[field]);
  }
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value ?? "n/a"}</strong></div>`;
}

function percent(value) {
  if (value === null || Number.isNaN(value)) return "n/a";
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function fixed(value) {
  if (value === null || Number.isNaN(value)) return "n/a";
  return Number(value).toFixed(2);
}

function safeNumber(value) {
  return value === null || Number.isNaN(value) ? 0 : Number(value);
}
