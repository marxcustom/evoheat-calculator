/**
 * Opens The Chilling App locally and checks the sheet example.
 * Geolocation, ntfy and IP lookups are blocked and fail the run if attempted.
 *
 *   BASE=http://127.0.0.1:8801 node tests/chilling-ui.mjs
 */
import { createRequire } from "module";
import assert from "assert";

const require = createRequire(import.meta.url);
const { compute } = require("../chilling/calc.js");
const puppeteer = (await import("puppeteer-core").catch(() =>
  import("/tmp/evo-test/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js")
)).default;

const BASE = process.env.BASE || "http://127.0.0.1:8801";
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";

function hostOf(url) {
  try { return new URL(url).host; } catch { return ""; }
}

const example = compute({
  indoor: true, roomC: 30, airC: 32.1, targetC: 6, litres: 1000, vessels: 1, areaM2: 2,
  people: 2, shiftsPerHour: 3, pumpCount: 1, pumpWatts: 300, uv: true, sun: false,
  sharedWall: false, factor: 0.9, hours: 4
});

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"]
});
const blocked = [];
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
await page.setRequestInterception(true);
const allowed = hostOf(BASE);
page.on("request", (req) => {
  const host = hostOf(req.url());
  if (host && host !== allowed) blocked.push(host);
  if (req.url().includes("/sw.js") || (host && host !== allowed)) { req.abort().catch(() => {}); return; }
  req.continue().catch(() => {});
});
await page.evaluateOnNewDocument(() => {
  const fail = () => { window.__geoCalled = true; };
  try { Object.defineProperty(navigator, "geolocation", { configurable: true, get: () => ({ getCurrentPosition: fail, watchPosition: fail, clearWatch() {} }) }); } catch (e) {}
  if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.reject(new Error("sw off"));
});
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));
await page.goto(BASE + "/chilling/", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.getElementById("required-kw") && document.getElementById("required-kw").textContent.includes("kW"));

async function setRange(id, value) {
  await page.$eval("#" + id, (el, value) => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(el, String(value));
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
await setRange("litres", 1000);
await setRange("target", 6);
await setRange("room", 30);
await setRange("vessels", 1);
await setRange("people", 2);
await setRange("pumps", 1);
await setRange("pump-watts", 300);
await setRange("factor", 0.9);
await page.click('[data-group="place"] [data-value="indoor"]');
await page.click('[data-group="shifts"] [data-value="3"]');
await page.click('[data-group="hours"] [data-value="4"]');
const uvOn = await page.$eval("#uv", (el) => el.getAttribute("aria-checked") === "true");
if (!uvOn) await page.click("#uv");
const sunOn = await page.$eval("#sun", (el) => el.getAttribute("aria-checked") === "true");
if (sunOn) await page.click("#sun");
const shared = await page.$eval("#shared", (el) => el.getAttribute("aria-checked") === "true");
if (shared) await page.click("#shared");

const view = await page.evaluate(() => ({
  title: document.title,
  required: document.getElementById("required-kw").textContent,
  detail: document.getElementById("required-detail").textContent,
  gains: document.getElementById("gains-kw").textContent,
  delta: document.getElementById("delta-read").textContent,
  warning: document.getElementById("warning").textContent,
  models: document.getElementById("models-placeholder").textContent,
  fyi: [...document.querySelectorAll("#fyi li")].map((li) => li.textContent),
  excluding4: document.querySelector("#table-excluding tr.pick td.num").textContent,
  including4: document.querySelector("#table-including tr.pick td.num").textContent,
  hours: [...document.querySelectorAll("#table-including tbody tr")].map((tr) => tr.firstElementChild.textContent),
  h1: document.querySelector("h1").textContent,
  headings: [...document.querySelectorAll("h2")].map((h) => h.textContent)
}));

assert.strictEqual(view.title, "The Chilling App");
assert.strictEqual(view.h1, "The Chilling App");
assert.strictEqual(view.required, example.requiredKw.toFixed(2) + " kW");
assert.strictEqual(view.including4, example.requiredKw.toFixed(2) + " kW");
assert.strictEqual(view.excluding4, example.excludingKw.toFixed(2) + " kW");
assert.strictEqual(view.gains, example.gainsKw.toFixed(2) + " kW");
assert.strictEqual(view.delta, "24.0 K");
assert.strictEqual(view.warning, "Unit chosen must not deliver less chilling capacity than this figure.");
assert.ok(view.models.includes("No chiller model is recommended yet."));
assert.ok(view.models.includes("Models will be added here later."));
assert.deepStrictEqual(view.hours, ["1 h", "2 h", "4 h", "8 h", "12 h", "16 h", "20 h", "24 h"]);
assert.ok(view.fyi[0].startsWith("The vessel is appropriately well insulated."));
assert.strictEqual(view.fyi.length, 6);
assert.ok(view.headings.includes("Chilling capacity required"));
assert.ok(view.headings.includes("Temperature"));
assert.ok(view.headings.includes("FYI for best results ensure:"));

await page.click('[data-group="place"] [data-value="outdoor"]');
await page.$eval("#state", (el) => {
  el.value = "TAS";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
});
await page.waitForFunction(() => [...document.querySelectorAll("#city option")].some((o) => o.textContent === "Hobart"));
await page.$eval("#city", (el) => {
  el.value = "094029";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
});
const outdoor = await page.evaluate(() => ({
  air: document.getElementById("air").value,
  hint: document.getElementById("air-hint").textContent,
  roomHidden: document.getElementById("room-block").hidden,
  airHidden: document.getElementById("air-block").hidden
}));
assert.strictEqual(outdoor.air, "21.8");
assert.ok(outdoor.hint.includes("Hobart"));
assert.ok(outdoor.hint.includes("21.8"));
assert.strictEqual(outdoor.roomHidden, true);
assert.strictEqual(outdoor.airHidden, false);

const geo = await page.evaluate(() => !!window.__geoCalled);
assert.strictEqual(geo, false);
assert.deepStrictEqual(blocked, []);
assert.deepStrictEqual(errors, []);

if (process.env.SHOT) {
  await page.click('[data-group="place"] [data-value="indoor"]');
  await setRange("room", 30);
  await page.evaluate(() => document.getElementById("results").scrollIntoView({ block: "start" }));
  await new Promise((r) => setTimeout(r, 150));
  await page.screenshot({ path: process.env.SHOT, fullPage: false });
}

await browser.close();
console.log("ui ok", view.required, "gains", view.gains, "excluding", view.excluding4);
