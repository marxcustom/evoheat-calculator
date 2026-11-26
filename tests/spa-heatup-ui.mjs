/**
 * Opens Spa Heat-Up locally. Geolocation, ntfy and IP lookups are blocked.
 *
 *   BASE=http://127.0.0.1:8801 node tests/spa-heatup-ui.mjs
 */
import { createRequire } from "module";
import assert from "assert";

const require = createRequire(import.meta.url);
const { hours, kwAt, formatHM } = require("../spa-heatup/calc.js");
const ranges = require("../spa-heatup/models.js");
const puppeteer = (await import("puppeteer-core").catch(() =>
  import("/tmp/evo-test/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js")
)).default;

const BASE = process.env.BASE || "http://127.0.0.1:8801";
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const force16 = ranges.find((item) => item.id === "Force-Ai").models.find((item) => item.name === "Force-Ai 16");
const expectedH = hours(1500, 20, 38, kwAt(force16, 15), 1);

function hostOf(url) {
  try { return new URL(url).host; } catch { return ""; }
}

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
await page.goto(BASE + "/spa-heatup/", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.getElementById("heatup-hm") && document.getElementById("heatup-hm").textContent !== "–");

const initial = await page.$eval("#range", (el) => el.value);
assert.strictEqual(initial, "Force-Ai");
const options = await page.$$eval("#range option", (els) => els.map((el) => el.value));
assert.deepStrictEqual(options, ["Force-Ai", "Fusion-i Pro"]);

async function setRange(id, value) {
  await page.$eval("#" + id, (el, value) => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(el, String(value));
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
async function setSelect(id, value) {
  await page.$eval("#" + id, (el, value) => {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

await setSelect("model", "Force-Ai 16");
await setRange("litres", 1500);
await setRange("start", 20);
await setRange("target", 38);
await setRange("ambient", 15);
await setRange("units", 1);
await setRange("goal", 8);

const view = await page.evaluate(() => ({
  title: document.title,
  hm: document.getElementById("heatup-hm").textContent,
  hours: Number(document.getElementById("heatup-hm").getAttribute("data-hours")),
  kw: Number(document.getElementById("heatup-hm").getAttribute("data-kw")),
  note: document.getElementById("range-note").textContent,
  loss: document.getElementById("loss-note").textContent,
  fastest: document.getElementById("fastest").textContent,
  names: [...document.querySelectorAll("#compare div span:first-child")].map((el) => el.textContent)
}));

assert.strictEqual(view.title, "Spa Heat-Up");
assert.ok(Math.abs(view.kw - 10.17) < 1e-9, view.kw);
assert.ok(Math.abs(view.hours - expectedH) < 1e-6, view.hours);
assert.strictEqual(view.hm, formatHM(expectedH));
assert.ok(view.note.includes("BROCHURE-Evo-Force-Ai.pdf"));
assert.ok(view.note.includes("water in 26"));
assert.strictEqual(view.loss, "These heat-up figures do not take into account any heat loss factors.");
assert.deepStrictEqual(view.names, ranges[0].models.map((m) => m.name));
assert.ok(view.fastest.includes("Fusion-i Pro 7"));
assert.ok(view.fastest.includes("across Force-Ai and Fusion-i Pro"));

const geo = await page.evaluate(() => !!window.__geoCalled);
assert.strictEqual(geo, false);
assert.deepStrictEqual(blocked, []);
assert.deepStrictEqual(errors, []);

if (process.env.SHOT) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 150));
  await page.screenshot({ path: process.env.SHOT, fullPage: false });
}
await browser.close();
console.log("ui ok", view.hm, view.kw, "kW");
