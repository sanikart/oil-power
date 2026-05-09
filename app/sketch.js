const SCENES = {
  has: {
    label: "Has It",
    caption:
      "Reserve bodies are sized by proved oil underground. The heaviest forms do not always move the most oil into the world.",
  },
  pumps: {
    label: "Pumps It",
    caption:
      "Production turns reserves into motion. Particles rise from countries that actually pump oil at scale.",
  },
  burns: {
    label: "Burns It",
    caption:
      "Consumption creates pull. Demand giants behave like wells, drawing attention even when they are not reserve giants.",
  },
  mismatch: {
    label: "Mismatch",
    caption:
      "The contradiction field separates oil underground from oil power: high reserves can sit far from high production and demand.",
  },
};

const HIGHLIGHTS = new Set(["VEN", "SAU", "CAN", "USA", "CHN", "IND", "RUS", "IRN", "IRQ", "JPN", "KOR"]);
const DETAIL_ISO = ["VEN", "SAU", "CAN", "USA", "CHN", "IND", "RUS", "IRN", "IRQ", "JPN", "KOR"];
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
let currentScene = "has";
let entities = [];
let particles = [];
let hovered = null;
let selected = null;
let yearSlider;
let yearLabel;
let detailPanel;
let captionEl;

function preload() {
  oilData = loadJSON("./public/data/oil_power_mvp.json");
}

function setup() {
  const holder = document.getElementById("sketch-holder");
  const canvas = createCanvas(holder.clientWidth, holder.clientHeight);
  canvas.parent("sketch-holder");
  pixelDensity(Math.min(2, window.devicePixelRatio || 1));

  yearSlider = document.getElementById("year-slider");
  yearLabel = document.getElementById("year-label");
  detailPanel = document.getElementById("detail-panel");
  captionEl = document.getElementById("scene-caption");

  const years = oilData.metadata.completeYears;
  yearSlider.min = Math.min(...years);
  yearSlider.max = Math.max(...years);
  yearSlider.value = oilData.metadata.anchorYear;
  currentYear = Number(yearSlider.value);
  yearLabel.textContent = currentYear;

  for (const row of oilData.rows) {
    normalizeRow(row);
    if (!rowsByYear.has(row.year)) rowsByYear.set(row.year, []);
    rowsByYear.get(row.year).push(row);
  }

  document.querySelectorAll(".scene-tab").forEach((button) => {
    button.addEventListener("click", () => setScene(button.dataset.scene));
  });
  yearSlider.addEventListener("input", () => {
    currentYear = Number(yearSlider.value);
    yearLabel.textContent = currentYear;
    rebuildEntities();
  });

  rebuildEntities();
}

function windowResized() {
  const holder = document.getElementById("sketch-holder");
  resizeCanvas(holder.clientWidth, holder.clientHeight);
  rebuildEntities();
}

function draw() {
  drawBackground();
  hovered = null;
  updateEntities();
  drawScene();
  updateParticles();
  drawLabels();
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
  particles = [];
  rebuildEntities();
}

function rebuildEntities() {
  const rows = rowsByYear.get(Number(currentYear)) || [];
  const chosen = selectRows(rows);
  const max = {
    reserves: maxValue(rows, "oil_reserves"),
    production: maxValue(rows, "oil_production"),
    consumption: maxValue(rows, "oil_consumption"),
    power: maxValue(rows, "oil_power_index"),
  };

  entities = chosen.map((row, index) => {
    const existing = entities.find((entity) => entity.iso3 === row.iso3);
    const target = targetFor(row, index, chosen.length, max);
    return {
      ...row,
      isHighlight: HIGHLIGHTS.has(row.iso3),
      x: existing ? existing.x : width / 2,
      y: existing ? existing.y : height / 2,
      vx: 0,
      vy: 0,
      tx: target.x,
      ty: target.y,
      r: target.r,
      tone: target.tone,
      reserveN: normalizeMetric(row.oil_reserves, max.reserves),
      productionN: normalizeMetric(row.oil_production, max.production),
      consumptionN: normalizeMetric(row.oil_consumption, max.consumption),
    };
  });
}

function selectRows(rows) {
  const selectedRows = new Map();
  for (const row of rows) {
    if (DETAIL_ISO.includes(row.iso3)) selectedRows.set(row.iso3, row);
  }

  const metric = currentScene === "has" ? "oil_reserves" : currentScene === "pumps" ? "oil_production" : "oil_consumption";
  rows
    .filter((row) => row[metric] !== null)
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, 34)
    .forEach((row) => selectedRows.set(row.iso3, row));

  if (currentScene === "mismatch") {
    rows
      .filter((row) => row.oil_reserves !== null && row.oil_production !== null && row.oil_consumption !== null)
      .sort((a, b) => mismatchScore(b) - mismatchScore(a))
      .slice(0, 26)
      .forEach((row) => selectedRows.set(row.iso3, row));
  }

  return Array.from(selectedRows.values());
}

function normalizeRow(row) {
  for (const field of NUMERIC_FIELDS) {
    if (row[field] !== null && row[field] !== undefined) row[field] = Number(row[field]);
  }
}

function targetFor(row, index, count, max) {
  const padX = width * 0.08;
  const padY = height * 0.12;
  const reserveN = normalizeMetric(row.oil_reserves, max.reserves);
  const productionN = normalizeMetric(row.oil_production, max.production);
  const consumptionN = normalizeMetric(row.oil_consumption, max.consumption);
  const angle = (index / Math.max(1, count)) * TWO_PI;
  const ring = 0.32 + (index % 5) * 0.07;

  if (currentScene === "has") {
    return {
      x: map(productionN, 0, 1, padX, width - padX) + cos(angle) * 18,
      y: map(reserveN, 0, 1, height - padY, padY) + sin(angle) * 18,
      r: map(Math.sqrt(reserveN), 0, 1, 9, 58),
      tone: reserveN,
    };
  }

  if (currentScene === "pumps") {
    return {
      x: width * (0.18 + 0.64 * ((index % 13) / 12)),
      y: map(productionN, 0, 1, height - padY, padY),
      r: map(Math.sqrt(productionN), 0, 1, 7, 44),
      tone: productionN,
    };
  }

  if (currentScene === "burns") {
    return {
      x: width / 2 + cos(angle) * width * ring,
      y: height / 2 + sin(angle) * height * ring * 0.76,
      r: map(Math.sqrt(consumptionN), 0, 1, 8, 52),
      tone: consumptionN,
    };
  }

  return {
    x: map(logNorm(row.oil_reserves), 0, 1, padX, width - padX),
    y: map(logNorm(row.oil_production + row.oil_consumption), 0, 1, height - padY, padY),
    r: map(Math.sqrt(Math.max(reserveN, productionN, consumptionN)), 0, 1, 7, 42),
    tone: mismatchScore(row),
  };
}

function updateEntities() {
  for (const entity of entities) {
    entity.vx += (entity.tx - entity.x) * 0.035;
    entity.vy += (entity.ty - entity.y) * 0.035;
    entity.vx *= 0.78;
    entity.vy *= 0.78;
    entity.x += entity.vx;
    entity.y += entity.vy;

    if (dist(mouseX, mouseY, entity.x, entity.y) < entity.r + 8) hovered = entity;
  }
}

function drawScene() {
  if (!entities.length) {
    noStroke();
    fill(246, 239, 225, 180);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("No country data for this year", width / 2, height / 2);
    return;
  }

  if (currentScene === "has") drawReserveField();
  if (currentScene === "pumps") drawProductionField();
  if (currentScene === "burns") drawConsumptionField();
  if (currentScene === "mismatch") drawMismatchField();

  for (const entity of entities) drawEntity(entity);
}

function drawReserveField() {
  stroke(231, 196, 126, 38);
  strokeWeight(1);
  for (let i = 0; i < 11; i++) {
    const y = map(i, 0, 10, height * 0.14, height * 0.9);
    line(width * 0.06, y, width * 0.94, y + sin(frameCount * 0.01 + i) * 12);
  }
  drawAxisText("less pumped", "more pumped", "deeper reserves");
}

function drawProductionField() {
  stroke(217, 154, 40, 45);
  strokeWeight(1.4);
  for (const entity of entities) {
    const strands = entity.isHighlight ? 5 : 2;
    for (let i = 0; i < strands; i++) {
      const sway = sin(frameCount * 0.035 + i + entity.x * 0.01) * 14;
      line(entity.x, entity.y, entity.x + sway, height * 0.1);
    }
    if (random() < entity.productionN * 0.24) {
      particles.push({
        x: entity.x + random(-entity.r, entity.r),
        y: entity.y,
        vx: random(-0.35, 0.35),
        vy: random(-2.9, -0.8),
        life: 90,
        color: [217, 154, 40],
      });
    }
  }
  drawAxisText("", "", "more production");
}

function drawConsumptionField() {
  noFill();
  strokeWeight(1);
  for (const entity of entities) {
    if (entity.consumptionN < 0.08) continue;
    stroke(47, 143, 131, 36 + entity.consumptionN * 80);
    const pulse = sin(frameCount * 0.04 + entity.x) * 8;
    circle(entity.x, entity.y, entity.r * 2.5 + pulse);
    circle(entity.x, entity.y, entity.r * 3.8 + pulse);
  }
}

function drawMismatchField() {
  stroke(246, 239, 225, 36);
  strokeWeight(1);
  line(width * 0.1, height * 0.82, width * 0.9, height * 0.18);
  drawAxisText("less underground", "more underground", "more pumped + burned");
}

function drawEntity(entity) {
  const hot = entity === hovered || entity === selected;
  const alpha = entity.isHighlight ? 220 : 128;
  const red = currentScene === "mismatch" ? lerp(85, 182, entity.tone || 0) : lerp(45, 217, entity.tone || 0);
  const green = currentScene === "burns" ? lerp(70, 143, entity.tone || 0) : lerp(47, 154, entity.tone || 0);
  const blue = currentScene === "burns" ? lerp(62, 131, entity.tone || 0) : 40;

  noStroke();
  fill(red, green, blue, alpha * 0.34);
  circle(entity.x, entity.y, entity.r * (hot ? 2.55 : 2.15));
  fill(red, green, blue, alpha);
  circle(entity.x, entity.y, entity.r * (hot ? 1.2 : 1));

  if (entity.isHighlight) {
    stroke(246, 239, 225, hot ? 230 : 150);
    strokeWeight(hot ? 2.4 : 1.4);
    noFill();
    circle(entity.x, entity.y, entity.r * 1.42);
  }
}

function drawLabels() {
  textFont("Avenir Next Condensed, Gill Sans, sans-serif");
  textSize(width < 600 ? 11 : 13);
  textStyle(BOLD);
  noStroke();
  for (const entity of entities) {
    if (!entity.isHighlight && entity !== hovered && entity !== selected) continue;
    fill(246, 239, 225, entity.isHighlight ? 230 : 170);
    textAlign(CENTER, CENTER);
    text(entity.iso3, entity.x, entity.y - entity.r - 14);
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= 1;
    noStroke();
    fill(particle.color[0], particle.color[1], particle.color[2], particle.life * 2.4);
    circle(particle.x, particle.y, 3);
    if (particle.life <= 0 || particle.y < 0) particles.splice(i, 1);
  }
  if (particles.length > 600) particles.splice(0, particles.length - 600);
}

function drawBackground() {
  background(28, 20, 12);
  for (let y = 0; y < height; y += 3) {
    const t = y / height;
    stroke(lerp(37, 15, t), lerp(27, 18, t), lerp(15, 13, t), 190);
    line(0, y, width, y);
  }
  stroke(246, 239, 225, 10);
  for (let x = 0; x < width; x += 34) line(x, 0, x + sin(frameCount * 0.003 + x) * 20, height);
}

function drawAxisText(left, right, top) {
  textFont("Avenir Next Condensed, Gill Sans, sans-serif");
  textSize(12);
  textStyle(BOLD);
  fill(246, 239, 225, 125);
  noStroke();
  textAlign(LEFT, CENTER);
  if (left) text(left, width * 0.07, height * 0.94);
  textAlign(RIGHT, CENTER);
  if (right) text(right, width * 0.93, height * 0.94);
  textAlign(LEFT, CENTER);
  if (top) text(top, width * 0.07, height * 0.08);
}

function mousePressed() {
  if (hovered) selected = hovered;
}

function updateDetailPanel() {
  const entity = hovered || selected;
  if (!entity) {
    detailPanel.innerHTML = `
      <p class="panel-eyebrow">${SCENES[currentScene].label} / ${currentYear}</p>
      <h2>Hover a country</h2>
      <p class="panel-copy">The canvas uses abstract forces only. No geography, no map projection, no borders.</p>
    `;
    return;
  }
  detailPanel.innerHTML = `
    <p class="panel-eyebrow">${SCENES[currentScene].label} / ${currentYear}</p>
    <h2>${entity.country_name}</h2>
    <p class="panel-copy">${countryLine(entity)}</p>
    <div class="metric-grid">
      ${metric("Reserve rank", entity.reserve_rank)}
      ${metric("Production rank", entity.production_rank)}
      ${metric("Consumption rank", entity.consumption_rank)}
      ${metric("Reserves", compact(entity.oil_reserves))}
      ${metric("Production", compact(entity.oil_production))}
      ${metric("Consumption", compact(entity.oil_consumption))}
    </div>
  `;
}

function countryLine(entity) {
  if (entity.iso3 === "VEN") return "A giant underground body with much weaker pumping force in the anchor year.";
  if (entity.iso3 === "USA") return "Less reserve-dominant than Venezuela or Saudi Arabia, but huge in both pumping and burning.";
  if (entity.iso3 === "CHN" || entity.iso3 === "IND") return "A demand power: the pull is stronger than the underground body.";
  if (entity.iso3 === "SAU" || entity.iso3 === "RUS") return "A production-side power where underground mass turns into market motion.";
  if (entity.iso3 === "JPN" || entity.iso3 === "KOR") return "A consumption-heavy country, useful for the later trade-dependence chapter.";
  return "Its position changes by reserves, production, consumption, and the mismatch between them.";
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value ?? "n/a"}</strong></div>`;
}

function compact(value) {
  if (value === null || Number.isNaN(value)) return "n/a";
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

function maxValue(rows, field) {
  return Math.max(0, ...rows.map((row) => row[field] || 0));
}

function normalizeMetric(value, max) {
  if (value === null || !max) return 0;
  return Math.max(0, Math.min(1, value / max));
}

function logNorm(value) {
  if (!value || value <= 0) return 0;
  return Math.log10(value + 1) / 11;
}

function mismatchScore(row) {
  const reserveRank = row.reserve_rank || 100;
  const productionRank = row.production_rank || 100;
  const consumptionRank = row.consumption_rank || 100;
  return Math.abs(reserveRank - Math.min(productionRank, consumptionRank)) / 100;
}
