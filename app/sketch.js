const SCENES = {
  has: {
    label: "Has It",
    metric: "has",
    caption:
      "Filter: only the reserve circle is visible. This shows who has oil underground without implying they control production or demand.",
  },
  pumps: {
    label: "Pumps It",
    metric: "pumps",
    caption:
      "Filter: only the production circle is visible. This shows who actually turns oil into supply.",
  },
  burns: {
    label: "Burns It",
    metric: "burns",
    caption:
      "Filter: only the consumption circle is visible. This shows demand power: who burns and pulls oil through the system.",
  },
  mismatch: {
    label: "Mismatch",
    metric: "all",
    caption:
      "All three concentric circles are visible: has, pumps, and burns. The mismatch is inside each country, not a map shape.",
  },
};

const COUNTRIES = [
  "CAN",
  "USA",
  "MEX",
  "VEN",
  "COL",
  "BRA",
  "ARG",
  "GBR",
  "NOR",
  "NLD",
  "DEU",
  "FRA",
  "ESP",
  "ITA",
  "RUS",
  "KAZ",
  "AZE",
  "TUR",
  "DZA",
  "LBY",
  "EGY",
  "NGA",
  "AGO",
  "SAU",
  "IRN",
  "IRQ",
  "ARE",
  "KWT",
  "QAT",
  "OMN",
  "CHN",
  "IND",
  "PAK",
  "JPN",
  "KOR",
  "IDN",
  "MYS",
  "THA",
  "VNM",
  "SGP",
  "AUS",
];
const COUNTRY_LAYOUT = {
  CAN: { x: 0.16, y: 0.26, region: "Northwest" },
  USA: { x: 0.22, y: 0.49, region: "West" },
  MEX: { x: 0.22, y: 0.62, region: "West" },
  VEN: { x: 0.30, y: 0.74, region: "Southwest" },
  COL: { x: 0.25, y: 0.72, region: "Southwest" },
  BRA: { x: 0.34, y: 0.82, region: "South" },
  ARG: { x: 0.30, y: 0.90, region: "South" },
  GBR: { x: 0.43, y: 0.28, region: "Northwest" },
  NOR: { x: 0.46, y: 0.18, region: "Northwest" },
  NLD: { x: 0.47, y: 0.34, region: "Northwest" },
  DEU: { x: 0.50, y: 0.31, region: "Northwest" },
  FRA: { x: 0.46, y: 0.40, region: "West" },
  ESP: { x: 0.43, y: 0.48, region: "West" },
  ITA: { x: 0.50, y: 0.44, region: "Middle" },
  RUS: { x: 0.56, y: 0.18, region: "North" },
  KAZ: { x: 0.63, y: 0.29, region: "Northeast" },
  AZE: { x: 0.57, y: 0.36, region: "Middle" },
  TUR: { x: 0.54, y: 0.41, region: "Middle" },
  DZA: { x: 0.46, y: 0.56, region: "Middle" },
  LBY: { x: 0.50, y: 0.58, region: "Middle" },
  EGY: { x: 0.54, y: 0.60, region: "Middle" },
  NGA: { x: 0.44, y: 0.70, region: "South" },
  AGO: { x: 0.47, y: 0.82, region: "South" },
  SAU: { x: 0.50, y: 0.52, region: "Middle" },
  IRN: { x: 0.60, y: 0.44, region: "Middle East" },
  IRQ: { x: 0.56, y: 0.64, region: "Middle East" },
  ARE: { x: 0.61, y: 0.56, region: "Middle East" },
  KWT: { x: 0.58, y: 0.54, region: "Middle East" },
  QAT: { x: 0.63, y: 0.61, region: "Middle East" },
  OMN: { x: 0.64, y: 0.68, region: "Middle East" },
  CHN: { x: 0.76, y: 0.43, region: "East" },
  IND: { x: 0.72, y: 0.72, region: "Southeast" },
  PAK: { x: 0.68, y: 0.63, region: "Southeast" },
  JPN: { x: 0.90, y: 0.36, region: "Far East" },
  KOR: { x: 0.86, y: 0.24, region: "Northeast" },
  IDN: { x: 0.80, y: 0.82, region: "Southeast" },
  MYS: { x: 0.78, y: 0.74, region: "Southeast" },
  THA: { x: 0.78, y: 0.66, region: "Southeast" },
  VNM: { x: 0.82, y: 0.62, region: "Southeast" },
  SGP: { x: 0.84, y: 0.76, region: "Southeast" },
  AUS: { x: 0.86, y: 0.90, region: "Southeast" },
};

const METRICS = {
  has: {
    label: "Has",
    field: "oil_reserves",
    share: "global_reserve_share",
    rank: "reserve_rank",
    color: [205, 78, 51],
  },
  pumps: {
    label: "Pumps",
    field: "oil_production",
    share: "global_production_share",
    rank: "production_rank",
    color: [223, 158, 47],
  },
  burns: {
    label: "Burns",
    field: "oil_consumption",
    share: "global_consumption_share",
    rank: "consumption_rank",
    color: [54, 145, 134],
  },
};
const METRIC_ORDER = ["has", "pumps", "burns"];

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
let tradeData;
let rowsByYear = new Map();
let tradeEdgesByYear = new Map();
let currentYear = 2020;
let currentScene = "mismatch";
let countryNodes = [];
let hovered = null;
let selected = null;
let yearSlider;
let yearLabel;
let detailPanel;
let captionEl;
let lastPanelKey = "";

function preload() {
  oilData = loadJSON("./public/data/oil_power_mvp.json");
  tradeData = loadJSON("./public/data/crude_trade_edges.json");
}

function setup() {
  const holder = document.getElementById("sketch-holder");
  const canvas = createCanvas(holder.clientWidth, holder.clientHeight);
  canvas.parent("sketch-holder");
  pixelDensity(Math.min(2, window.devicePixelRatio || 1));
  frameRate(24);

  yearSlider = document.getElementById("year-slider");
  yearLabel = document.getElementById("year-label");
  detailPanel = document.getElementById("detail-panel");
  captionEl = document.getElementById("scene-caption");

  for (const row of oilData.rows) {
    normalizeRow(row);
    if (!rowsByYear.has(row.year)) rowsByYear.set(row.year, []);
    rowsByYear.get(row.year).push(row);
  }
  for (const edge of tradeData.edges) {
    normalizeTradeEdge(edge);
    if (!tradeEdgesByYear.has(edge.year)) tradeEdgesByYear.set(edge.year, []);
    tradeEdgesByYear.get(edge.year).push(edge);
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
  updateHover();
  drawTradeEdges();
  drawCountryClusters();
  drawTitle();
  drawLegend();
  drawTooltip();
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
  const existing = new Map(countryNodes.map((node) => [node.iso3, node]));

  countryNodes = COUNTRIES.map((iso3) => {
    const row = rowByIso.get(iso3);
    if (!row) return null;
    const layout = COUNTRY_LAYOUT[iso3];
    const target = targetFor(layout);
    const previous = existing.get(iso3);
    const metrics = metricValues(row);
    return {
      type: "country",
      iso3,
      country_name: row.country_name,
      region: layout.region,
      row,
      metrics,
      tx: target.x,
      ty: target.y,
      x: previous ? previous.x : target.x,
      y: previous ? previous.y : target.y,
      vx: 0,
      vy: 0,
      maxR: Math.max(...Object.values(metrics).map((metric) => metric.r)),
    };
  }).filter(Boolean);
}

function targetFor(layout) {
  const marginX = width < 700 ? Math.max(66, width * 0.055) : Math.max(34, width * 0.025);
  const marginY = width < 700 ? Math.max(74, height * 0.105) : Math.max(52, height * 0.072);
  return {
    x: map(layout.x, 0, 1, marginX, width - marginX),
    y: map(layout.y, 0, 1, marginY, height - marginY),
  };
}

function metricValues(row) {
  const values = {};
  const maxR = width < 700 ? 28 : 60;
  const minR = width < 700 ? 4.5 : 7;
  for (const key of METRIC_ORDER) {
    const metric = METRICS[key];
    const share = safeNumber(row[metric.share]);
    const value = row[metric.field];
    const r = value > 0 ? map(Math.sqrt(share), 0, Math.sqrt(0.22), minR, maxR, true) : minR * 0.8;
    values[key] = {
      ...metric,
      key,
      share,
      value,
      rank: row[metric.rank],
      r,
    };
  }
  return values;
}

function updateGraph() {
  for (const node of countryNodes) {
    const driftX = sin(frameCount * 0.018 + node.ty * 0.01) * 1.5;
    const driftY = cos(frameCount * 0.016 + node.tx * 0.01) * 1.2;
    node.vx += (node.tx + driftX - node.x) * 0.045;
    node.vy += (node.ty + driftY - node.y) * 0.045;
    node.vx *= 0.78;
    node.vy *= 0.78;
    node.x += node.vx;
    node.y += node.vy;
  }
}

function drawBackground() {
  background(23, 16, 9);
  noFill();
  stroke(255, 235, 194, 12);
  strokeWeight(1);
  const step = 42;
  for (let x = -step; x < width + step; x += step) line(x, 0, x + width * 0.10, height);
  for (let y = 0; y < height; y += step) line(0, y, width, y - height * 0.06);
}

function drawCompassFrame() {
  const cx = width / 2;
  const cy = height / 2;
  stroke(246, 232, 199, 38);
  strokeWeight(1);
  const frameMargin = width < 700 ? 36 : 22;
  line(cx, frameMargin, cx, height - frameMargin);
  line(frameMargin, cy, width - frameMargin, cy);
  noFill();
  const frameBase = Math.min(width, height);
  ellipse(cx, cy, frameBase * (width < 700 ? 0.60 : 0.74), frameBase * (width < 700 ? 0.60 : 0.74));
  ellipse(cx, cy, frameBase * (width < 700 ? 0.92 : 1.08), frameBase * (width < 700 ? 0.92 : 1.08));
}

function drawTradeEdges() {
  if (currentScene !== "mismatch") return;
  const nodes = new Map(countryNodes.map((node) => [node.iso3, node]));
  const visibleEdges = (tradeEdgesByYear.get(Number(currentYear)) || [])
    .filter((edge) => nodes.has(edge.exporter_iso3) && nodes.has(edge.importer_iso3))
    .slice(0, width < 700 ? 34 : 58);
  if (!visibleEdges.length) return;

  const localMax = Math.max(...visibleEdges.map((edge) => edge.trade_value_thousand_usd));
  for (const edge of visibleEdges) {
    const exporter = nodes.get(edge.exporter_iso3);
    const importer = nodes.get(edge.importer_iso3);
    const connected = hovered && (hovered.iso3 === edge.exporter_iso3 || hovered.iso3 === edge.importer_iso3);
    drawTradeEdge(exporter, importer, edge, localMax, connected);
  }
}

function drawTradeEdge(exporter, importer, edge, localMax, connected) {
  const valueN = localMax ? edge.trade_value_thousand_usd / localMax : edge.value_norm;
  const alpha = connected ? 210 : map(Math.sqrt(valueN), 0, 1, 24, 118);
  const weight = connected ? map(Math.sqrt(valueN), 0, 1, 1.6, 4.8) : map(Math.sqrt(valueN), 0, 1, 0.45, 2.4);
  const dx = importer.x - exporter.x;
  const dy = importer.y - exporter.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const bend = Math.min(88, distance * 0.18) * (exporter.iso3 < importer.iso3 ? 1 : -1);
  const midX = (exporter.x + importer.x) / 2 - (dy / distance) * bend;
  const midY = (exporter.y + importer.y) / 2 + (dx / distance) * bend;

  noFill();
  stroke(238, 168, 54, alpha);
  strokeWeight(weight);
  bezier(exporter.x, exporter.y, midX, midY, midX, midY, importer.x, importer.y);

  const t = 0.78;
  const px = bezierPoint(exporter.x, midX, midX, importer.x, t);
  const py = bezierPoint(exporter.y, midY, midY, importer.y, t);
  const tx = bezierTangent(exporter.x, midX, midX, importer.x, t);
  const ty = bezierTangent(exporter.y, midY, midY, importer.y, t);
  const angle = Math.atan2(ty, tx);
  push();
  translate(px, py);
  rotate(angle);
  noStroke();
  fill(54, 145, 134, connected ? 245 : alpha + 38);
  triangle(0, 0, -7, -3.5, -7, 3.5);
  pop();
}

function drawCountryClusters() {
  for (const node of countryNodes) drawCluster(node);
}

function drawCluster(node) {
  const hot = hovered === node || selected === node;
  const visibleKeys = visibleMetrics();
  const visible = visibleKeys.map((key) => node.metrics[key]).sort((a, b) => b.r - a.r);
  const haloR = Math.max(...visible.map((metric) => metric.r), 10) + (hot ? 17 : 9);

  if (hot) {
    noFill();
    stroke(255, 246, 221, 190);
    strokeWeight(2.5);
    circle(node.x, node.y, haloR * 2);
  }

  for (const metric of visible) {
    const active = currentScene === "mismatch" || SCENES[currentScene].metric === metric.key;
    const alpha = currentScene === "mismatch" ? 72 : 184;
    const weight = active ? (hot ? 4 : 2.6) : 1.2;
    fill(metric.color[0], metric.color[1], metric.color[2], alpha);
    stroke(metric.color[0], metric.color[1], metric.color[2], hot ? 255 : 210);
    strokeWeight(weight);
    circle(node.x, node.y, metric.r * 2);
  }

  noStroke();
  fill(255, 247, 226, hot ? 255 : 224);
  textFont("Avenir Next Condensed, Gill Sans, sans-serif");
  textStyle(BOLD);
  textSize(width < 700 ? 9 : 11);
  textAlign(CENTER, CENTER);
  text(node.iso3, node.x, node.y);
}

function drawTitle() {
  const x = 24;
  const y = height < 620 ? 78 : 96;
  const titleSize = width < 700 ? 22 : 34;
  noStroke();
  fill(23, 16, 9, 150);
  rect(x - 12, y - 16, width < 700 ? 292 : 458, titleSize * 2.15, 18);

  fill(255, 248, 235, 238);
  textFont("Iowan Old Style, Palatino Linotype, Georgia, serif");
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  textSize(titleSize);
  textLeading(titleSize * 0.9);
  text("Underground is not\nthe same as power.", x, y - 8);
}

function drawLegend() {
  const x = 24;
  const y = 24;
  const visibleKeys = visibleMetrics();
  const showTrade = currentScene === "mismatch" && (tradeEdgesByYear.get(Number(currentYear)) || []).length > 0;
  noStroke();
  fill(23, 16, 9, 185);
  rect(x - 10, y - 12, width < 700 ? 210 : 270, showTrade ? 100 : 74, 12);

  fill(246, 232, 199, 232);
  textFont("Avenir Next Condensed, Gill Sans, sans-serif");
  textStyle(BOLD);
  textSize(12);
  textAlign(LEFT, CENTER);
  text(`${SCENES[currentScene].label.toUpperCase()} / ${currentYear}`, x, y);

  let lx = x;
  for (const key of visibleKeys) {
    const metric = METRICS[key];
    fill(metric.color[0], metric.color[1], metric.color[2], 210);
    circle(lx + 6, y + 30, 11);
    fill(246, 232, 199, 205);
    textStyle(NORMAL);
    textSize(11);
    text(metric.label, lx + 18, y + 30);
    lx += width < 700 ? 54 : 68;
  }

  if (showTrade) {
    stroke(238, 168, 54, 170);
    strokeWeight(2);
    line(x, y + 64, x + 28, y + 64);
    noStroke();
    fill(54, 145, 134, 220);
    triangle(x + 34, y + 64, x + 26, y + 60, x + 26, y + 68);
    fill(246, 232, 199, 205);
    textStyle(NORMAL);
    textSize(11);
    text("crude trade: exporter → importer", x + 46, y + 64);
  }
}

function visibleMetrics() {
  const metric = SCENES[currentScene].metric;
  return metric === "all" ? METRIC_ORDER : [metric];
}

function updateHover() {
  hovered = null;
  let best = null;
  let bestDistance = Infinity;
  for (const node of countryNodes) {
    const hitRadius = Math.max(...visibleMetrics().map((key) => node.metrics[key].r), 10) + 16;
    const d = dist(mouseX, mouseY, node.x, node.y);
    if (d < hitRadius && d < bestDistance) {
      best = node;
      bestDistance = d;
    }
  }
  hovered = best;
}

function drawTooltip() {
  if (!hovered) return;

  const row = hovered.row;
  const padding = 14;
  const boxW = width < 700 ? 250 : 292;
  const connectedEdges = connectedTradeEdges(row.iso3);
  const boxH = connectedEdges.length ? 226 : 178;
  const x = constrain(mouseX + 18, 12, width - boxW - 12);
  const y = constrain(mouseY - 22, 12, height - boxH - 12);

  noStroke();
  fill(11, 8, 5, 224);
  rect(x, y, boxW, boxH, 16);
  stroke(255, 248, 235, 48);
  strokeWeight(1);
  noFill();
  rect(x + 0.5, y + 0.5, boxW - 1, boxH - 1, 16);

  noStroke();
  fill(255, 248, 235, 245);
  textFont("Avenir Next Condensed, Gill Sans, sans-serif");
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  textSize(18);
  text(`${row.country_name} (${row.iso3})`, x + padding, y + padding);

  textStyle(NORMAL);
  textSize(11);
  fill(255, 248, 235, 160);
  text(`${SCENES[currentScene].label} / ${currentYear}`, x + padding, y + padding + 25);

  const startY = y + padding + 54;
  tooltipMetric("Has", row.global_reserve_share, METRICS.has.color, x + padding, startY, boxW - padding * 2);
  tooltipMetric("Pumps", row.global_production_share, METRICS.pumps.color, x + padding, startY + 30, boxW - padding * 2);
  tooltipMetric("Burns", row.global_consumption_share, METRICS.burns.color, x + padding, startY + 60, boxW - padding * 2);

  fill(255, 248, 235, 180);
  textSize(11);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);
  text(storyFor(row), x + padding, startY + 95, boxW - padding * 2, 42);

  if (connectedEdges.length) {
    fill(255, 248, 235, 210);
    textFont("Avenir Next Condensed, Gill Sans, sans-serif");
    textStyle(BOLD);
    textAlign(LEFT, TOP);
    textSize(11);
    text("Top crude trade links", x + padding, startY + 139);
    textStyle(NORMAL);
    fill(255, 248, 235, 178);
    connectedEdges.slice(0, 2).forEach((edge, index) => {
      const isExporter = edge.exporter_iso3 === row.iso3;
      const partner = isExporter ? edge.importer_iso3 : edge.exporter_iso3;
      const direction = isExporter ? "exports to" : "imports from";
      text(`${direction} ${partner}: ${money(edge.trade_value_thousand_usd)}`, x + padding, startY + 157 + index * 15);
    });
  }
}

function connectedTradeEdges(iso3) {
  return (tradeEdgesByYear.get(Number(currentYear)) || [])
    .filter((edge) => edge.exporter_iso3 === iso3 || edge.importer_iso3 === iso3)
    .sort((a, b) => b.trade_value_thousand_usd - a.trade_value_thousand_usd);
}

function tooltipMetric(label, value, rgb, x, y, w) {
  const share = safeNumber(value);
  const barW = Math.max(2, w * constrain(share / 0.22, 0, 1));
  noStroke();
  fill(255, 248, 235, 190);
  textFont("Avenir Next Condensed, Gill Sans, sans-serif");
  textStyle(BOLD);
  textSize(11);
  textAlign(LEFT, TOP);
  text(label, x, y);
  textAlign(RIGHT, TOP);
  text(percent(value), x + w, y);
  fill(255, 248, 235, 34);
  rect(x, y + 16, w, 5, 999);
  fill(rgb[0], rgb[1], rgb[2], 230);
  rect(x, y + 16, barW, 5, 999);
}

function mousePressed() {
  if (hovered) {
    selected = hovered;
    lastPanelKey = "";
  }
}

function updateDetailPanel() {
  const node = hovered || selected;
  const key = node ? `${currentYear}:${currentScene}:${node.iso3}` : `${currentYear}:${currentScene}:empty`;
  if (key === lastPanelKey) return;
  lastPanelKey = key;

  if (!node) {
    detailPanel.innerHTML = `
      <p class="panel-eyebrow">${SCENES[currentScene].label} / ${currentYear}</p>
      <h2>Hover a country</h2>
      <p class="panel-copy">Each country is one concentric cluster. Use the filters to isolate has, pumps, or burns.</p>
    `;
    return;
  }

  const row = node.row;
  detailPanel.innerHTML = `
    <p class="panel-eyebrow">${node.region} / ${currentYear}</p>
    <h2>${row.country_name}</h2>
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

function mismatchScore(row) {
  const reserve = safeNumber(row.global_reserve_share);
  const production = safeNumber(row.global_production_share);
  const consumption = safeNumber(row.global_consumption_share);
  return constrain(Math.max(Math.abs(reserve - production), Math.abs(reserve - consumption), Math.abs(production - consumption)) * 5.5, 0, 1);
}

function storyFor(row) {
  if (row.iso3 === "VEN") return "A giant has-circle with a much smaller pump circle: oil underground is not the same as oil power.";
  if (row.iso3 === "USA") return "All three rings matter: the United States is both a production and demand power, with a smaller reserve share than the biggest reserve states.";
  if (row.iso3 === "CHN" || row.iso3 === "IND") return "The burn ring dominates the story: demand power is larger than reserve power.";
  if (row.iso3 === "SAU" || row.iso3 === "RUS") return "The has and pumps rings stay close together: reserve mass becomes production-side power.";
  if (row.iso3 === "JPN" || row.iso3 === "KOR") return "The burn ring appears without meaningful has or pump rings, setting up the later trade chapter.";
  if (row.iso3 === "CAN" || row.iso3 === "IRN" || row.iso3 === "IRQ") return "Compare the reserve ring against the pump ring to see whether underground oil becomes supply.";
  return "Compare the concentric rings to see how reserves, production, and consumption split apart.";
}

function normalizeRow(row) {
  for (const field of NUMERIC_FIELDS) {
    if (row[field] !== null && row[field] !== undefined) row[field] = Number(row[field]);
  }
}

function normalizeTradeEdge(edge) {
  for (const field of ["year", "trade_value_thousand_usd", "quantity_metric_tons", "share_of_year_trade", "value_norm"]) {
    edge[field] = Number(edge[field]);
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

function money(value) {
  if (value === null || Number.isNaN(value)) return "n/a";
  return `$${Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value) * 1000)}`;
}

function safeNumber(value) {
  return value === null || Number.isNaN(value) ? 0 : Number(value);
}
