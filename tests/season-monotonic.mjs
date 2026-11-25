/**
 * Season sizing must be monotonic: a longer swim season never recommends a
 * smaller heater. Compares Jul–May, Jun–May, all 12 months via the All year
 * button, all 12 via the month chart, Sep–May and Oct–Apr.
 *
 * Uses a local static server and puppeteer-core. Geolocation, ntfy, ipwho.is
 * and BigDataCloud are never called: the location gate is opened with the
 * app's own enter hook, and any request off the test server fails the run.
 *
 *   BASE=http://127.0.0.1:8801 node tests/season-monotonic.mjs
 */
const puppeteer = (await import("puppeteer-core").catch(() => import("/tmp/evo-test/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js"))).default;

const BASE = process.env.BASE || "http://127.0.0.1:8801";
const ONLY = process.env.ONLY || "";
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WINTER = new Set(["Jun", "Jul", "Aug"]);
const NOTE = "Sized up one model for winter swimming.";

const APPS = [
  ["Fusion", "/"],
  ["Active-i Pro", "/active-i-pro/"],
  ["Buccaneer Pools", "/buccaneer-pools/"],
  ["Aqua Technics", "/aqua-technics/"],
  ["Ranger", "/ranger/"],
  ["James", "/james/"],
  ["Bruzzies", "/bruzzies/"],
  ["Todd", "/todd/"],
  ["Lehmo", "/lehmo/"],
  ["Craig", "/craig/"],
  ["Rusty", "/rusty/"],
];

function wrapped(start, end) {
  const a = MONTHS.indexOf(start);
  const b = MONTHS.indexOf(end);
  const out = [];
  for (let i = a; ; i = (i + 1) % 12) {
    out.push(MONTHS[i]);
    if (i === b) break;
  }
  return out;
}

const SCENARIOS = [
  { id: "Oct–Apr", button: "Oct–Apr", months: wrapped("Oct", "Apr") },
  { id: "Sep–May", button: "Sep–May", months: wrapped("Sep", "May") },
  { id: "Jul–May", months: wrapped("Jul", "May") },
  { id: "Jun–May", months: wrapped("Jun", "May") },
  { id: "All year button", button: "All year", months: MONTHS.slice() },
  { id: "All 12 manual", months: MONTHS.slice(), manual: true },
];

function sameSet(a, b) {
  return a.length === b.length && a.every((m) => b.includes(m));
}

function rangeOf(model) {
  return model.replace(/^\d+\s*×\s*/, "").replace(/\s\d.*$/, "");
}

function hostOf(url) {
  try { return new URL(url).host; } catch { return ""; }
}

async function openApp(browser, path) {
  const page = await browser.newPage();
  const blocked = [];
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
  await page.setRequestInterception(true);
  const allowed = hostOf(BASE);
  page.on("request", (req) => {
    const host = hostOf(req.url());
    if (host && host !== allowed) blocked.push(host);
    if (req.url().includes("/sw.js") || (host && host !== allowed)) {
      req.abort().catch(() => {});
      return;
    }
    req.continue().catch(() => {});
  });
  await page.evaluateOnNewDocument(() => {
    if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.reject(new Error("sw off"));
    const fail = () => { window.__geoCalled = true; };
    const geo = { getCurrentPosition: fail, watchPosition: fail, clearWatch() {} };
    try { Object.defineProperty(navigator, "geolocation", { configurable: true, get: () => geo }); } catch (e) {}
  });
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(() => document.querySelector("[data-month]") || typeof window.__evoEnter === "function", { timeout: 15000 });
  await page.evaluate(() => {
    if (document.getElementById("root")?.hidden && typeof window.__evoEnter === "function") window.__evoEnter("stub");
  });
  await page.waitForSelector("[data-month]", { timeout: 15000 });
  return { page, blocked, errors };
}

async function read(page) {
  return page.evaluate((NOTE) => {
    const months = [...document.querySelectorAll("[data-month]")]
      .filter((el) => el.getAttribute("aria-pressed") === "true")
      .map((el) => el.getAttribute("data-month"));
    const cards = [...document.querySelectorAll("div")]
      .filter((d) => d.childNodes.length === 1 && d.textContent.startsWith("@ 27"))
      .map((d) => {
        const model = [...d.parentElement.querySelectorAll("a")].map((a) => a.textContent.trim()).find(Boolean) || "";
        const cap = d.textContent.match(/([\d.]+)\s*kW/);
        return { model, capKw: cap ? Number(cap[1]) : null };
      })
      .filter((c) => c.model);
    const badge = [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).find((t) => /kW/.test(t)) || "";
    const reqMatch = badge.match(/([\d.]+)\s*kW/);
    const selects = [...document.querySelectorAll("label")].flatMap((l) => {
      const sel = l.querySelector("select");
      if (!sel || !sel.selectedOptions[0]) return [];
      return [{ name: (l.childNodes[0].textContent || "").trim(), label: sel.selectedOptions[0].textContent.trim() }];
    });
    const area = (document.body.innerText.match(/Surface area\s+([\d.]+)/) || [])[1] || "";
    return {
      months,
      cards,
      reqKw: reqMatch ? Number(reqMatch[1]) : null,
      note: document.body.innerText.includes(NOTE),
      selects,
      area,
    };
  }, NOTE);
}

async function clickButton(page, text) {
  const ok = await page.evaluate((text) => {
    const b = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === text);
    if (!b) return false;
    b.click();
    return true;
  }, text);
  if (!ok) throw new Error("missing button " + text);
}

async function clickMonth(page, name) {
  const ok = await page.evaluate((name) => {
    const el = [...document.querySelectorAll("[data-month]")].find((e) => e.getAttribute("data-month") === name);
    if (!el) return false;
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return true;
  }, name);
  if (!ok) throw new Error("missing month " + name);
}

async function waitMonths(page, wanted) {
  const deadline = Date.now() + 8000;
  let last;
  while (Date.now() < deadline) {
    last = await read(page);
    if (sameSet(last.months, wanted) && last.reqKw != null && last.cards.length) return last;
    await new Promise((r) => setTimeout(r, 40));
  }
  throw new Error("months did not settle at " + wanted.join(",") + " got " + JSON.stringify(last));
}

async function setMonths(page, wanted) {
  for (let n = 0; n < 24; n++) {
    const cur = await read(page);
    const diff = MONTHS.find((m) => cur.months.includes(m) !== wanted.includes(m));
    if (!diff) return waitMonths(page, wanted);
    await clickMonth(page, diff);
  }
  throw new Error("could not set " + wanted.join(","));
}

async function choose(page, labelStart, optionLabel) {
  const result = await page.evaluate((labelStart, optionLabel) => {
    const lab = [...document.querySelectorAll("label")].find((l) => (l.childNodes[0].textContent || "").trim().startsWith(labelStart));
    if (!lab) return "no " + labelStart;
    const sel = lab.querySelector("select");
    const opt = [...sel.options].find((o) => o.textContent.trim() === optionLabel || o.textContent.trim().startsWith(optionLabel));
    if (!opt) return "no option " + optionLabel + " in " + [...sel.options].map((o) => o.textContent.trim()).join("|");
    Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set.call(sel, opt.value);
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    return opt.value;
  }, labelStart, optionLabel);
  if (String(result).startsWith("no ")) throw new Error(result);
}

async function setSlider(page, label, value) {
  return page.evaluate((label, value) => {
    const span = [...document.querySelectorAll("span")].find((s) => s.textContent.trim() === label);
    if (!span) return "absent";
    const input = span.parentElement.parentElement.querySelector('input[type="range"]');
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input, String(value));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return input.value;
  }, label, value);
}

async function prepare(page, place) {
  await choose(page, "State", place.state);
  const deadline = Date.now() + 15000;
  let ready = false;
  while (Date.now() < deadline) {
    const info = await page.evaluate((city) => {
      const lab = [...document.querySelectorAll("label")].find((l) => (l.childNodes[0].textContent || "").trim().startsWith("Location"));
      const sel = lab && lab.querySelector("select");
      return sel ? [...sel.options].some((o) => o.textContent.trim() === city) : false;
    }, place.city);
    if (info) { ready = true; break; }
    await new Promise((r) => setTimeout(r, 50));
  }
  if (!ready) throw new Error("location list never showed " + place.city);
  await choose(page, "Location", place.city);
  const length = await setSlider(page, "Length", 10);
  const width = await setSlider(page, "Width", 4);
  await new Promise((r) => setTimeout(r, 200));
  const snap = await read(page);
  if (length !== "absent" && snap.area !== "40" && snap.area !== "40.0") {
    throw new Error("expected 10×4 m, surface area " + snap.area);
  }
  return { length, width, selects: snap.selects, area: snap.area };
}

function byRange(cards) {
  const out = {};
  for (const card of cards) out[rangeOf(card.model)] = card;
  return out;
}

function assertMonotonic(app, place, rows) {
  const problems = [];
  const order = ["Oct–Apr", "Sep–May", "Jul–May", "Jun–May"];
  for (let i = 1; i < order.length; i++) {
    const prev = rows[order[i - 1]];
    const next = rows[order[i]];
    if (next.reqKw + 1e-9 < prev.reqKw) problems.push(place + " " + order[i] + " requirement " + next.reqKw + " < " + order[i - 1] + " " + prev.reqKw);
    const a = byRange(prev.cards);
    const b = byRange(next.cards);
    for (const range of Object.keys(a)) {
      if (!b[range]) { problems.push(place + " missing " + range + " on " + order[i]); continue; }
      if (b[range].capKw + 1e-9 < a[range].capKw) problems.push(place + " " + order[i] + " " + b[range].model + " (" + b[range].capKw + " kW) < " + order[i - 1] + " " + a[range].model + " (" + a[range].capKw + " kW)");
    }
  }
  const full = ["Jun–May", "All year button", "All 12 manual"];
  const base = JSON.stringify({ req: rows[full[0]].reqKw, cards: rows[full[0]].cards });
  for (const id of full.slice(1)) {
    const got = JSON.stringify({ req: rows[id].reqKw, cards: rows[id].cards });
    if (got !== base) problems.push(place + " " + id + " differs from Jun–May: " + got);
  }
  for (const row of Object.values(rows)) {
    const winter = row.months.some((m) => WINTER.has(m));
    if (!winter && row.note) problems.push(place + " " + row.id + " shows the winter note");
    if (row.note && !winter) problems.push(place + " " + row.id + " note without winter");
  }
  if (problems.length) {
    const err = new Error(app + " " + place + "\n" + problems.join("\n"));
    err.problems = problems;
    throw err;
  }
}

async function runPlace(page, place) {
  const setup = await prepare(page, place);
  const rows = {};
  for (const scenario of SCENARIOS) {
    if (scenario.manual) await clickButton(page, "Oct–Apr");
    if (scenario.button) await clickButton(page, scenario.button);
    const snap = scenario.button && !scenario.manual && scenario.id !== "Jul–May"
      ? await waitMonths(page, scenario.months)
      : await setMonths(page, scenario.months);
    if (scenario.button && !sameSet(snap.months, scenario.months)) {
      throw new Error(scenario.id + " button left " + snap.months.join(","));
    }
    rows[scenario.id] = { id: scenario.id, ...snap };
  }
  return { setup, rows };
}

const places = [
  { id: "Perth", state: "WA", city: "Perth" },
  { id: "Hobart", state: "TAS", city: "Hobart" },
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const report = [];
const failures = [];
try {
  for (const [name, path] of APPS) {
    if (ONLY && name !== ONLY) continue;
    const { page, blocked, errors } = await openApp(browser, path);
    try {
      for (const place of places) {
        const { setup, rows } = await runPlace(page, place);
        try { assertMonotonic(name, place.id, rows); }
        catch (err) { failures.push(err.message); }
        report.push({ app: name, place: place.id, area: setup.area, selects: setup.selects, rows });
        const brief = Object.values(rows).map((r) => r.id + " " + r.reqKw + "kW " + r.cards.map((c) => c.model + "@" + c.capKw).join(" | ") + (r.note ? " note" : "")).join("\n    ");
        console.log(name + " / " + place.id + (setup.area ? " area " + setup.area : " pool " + setup.selects.map((s) => s.label).join(", ")) + "\n    " + brief);
        if (process.env.SHOT && name === "Fusion" && place.id === "Perth") {
          await clickButton(page, "All year");
          await waitMonths(page, MONTHS);
          await page.evaluate(() => {
            const el = [...document.querySelectorAll("div,p,span")].find((n) => n.childNodes.length === 1 && n.textContent.trim() === "Sized up one model for winter swimming.");
            if (el) el.scrollIntoView({ block: "center" });
          });
          await new Promise((r) => setTimeout(r, 200));
          await page.screenshot({ path: process.env.SHOT, fullPage: false });
        }
      }
      const geo = await page.evaluate(() => !!window.__geoCalled);
      if (geo) throw new Error("geolocation was called");
      if (blocked.length) throw new Error("off-server request: " + [...new Set(blocked)].join(", "));
      if (errors.length) throw new Error("page error: " + errors.join(" | "));
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error("\nFAILURES\n" + failures.join("\n\n"));
  process.exit(1);
}
console.log("\nmonotonic across " + report.length + " app/location runs");
