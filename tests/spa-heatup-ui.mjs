/**
 * Opens the Spa Heat-Up app locally and checks the Force-i Pro 24 sheet example.
 * Geolocation, ntfy and IP lookups are blocked and fail the run if attempted.
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
const force = ranges.find((item) => item.id === "Force-i Pro").models.find((item) => item.name === "Force-i Pro 24");
const expectedH = hours(8000, 30, 38, kwAt(force, 5), 1);

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

await setSelect("range", "Force-i Pro");
await setSelect("model", "Force-i Pro 24");
await setRange("litres", 8000);
await setRange("start", 30);
await setRange("target", 38);
await setRange("ambient", 5);
await setRange("units", 1);
await setRange("goal", 6);

const view = await page.evaluate(() => ({
  title: document.title,
  h1: document.querySelector("h1").textContent,
  hm: document.getElementById("heatup-hm").textContent,
  hours: Number(document.getElementById("heatup-hm").getAttribute("data-hours")),
  kw: Number(document.getElementById("heatup-hm").getAttribute("data-kw")),
  detail: document.getElementById("heatup-detail").textContent,
  note: document.getElementById("loss-note").textContent,
  caveat: document.getElementById("loss-caveat").textContent,
  cover: document.getElementById("cover-note").textContent,
  rows: document.querySelectorAll("#compare div").length,
  fastest: document.getElementById("fastest").textContent,
  headings: [...document.querySelectorAll("h2")].map((h) => h.textContent)
}));

assert.strictEqual(view.title, "Spa Heat-Up");
assert.strictEqual(view.h1, "Spa Heat-Up");
assert.ok(Math.abs(view.hours - expectedH) < 0.001, view.hours);
assert.ok(Math.abs(view.kw - 14.7) < 0.001, view.kw);
assert.strictEqual(view.hm, formatHM(expectedH));
assert.ok(view.detail.includes("Force-i Pro 24"));
assert.strictEqual(view.note, "These heat-up figures do not take into account any heat loss factors.");
assert.strictEqual(view.caveat, "Items such as uninsulated tank walls and pipework, uncovered pools and other factors will increase these values.");
assert.ok(view.cover.includes("recorded only"));
assert.ok(view.rows >= 6);
assert.ok(view.fastest.includes("Force-i Pro 24"));
assert.ok(view.headings.includes("Heat-up time"));
assert.ok(view.headings.includes("Temperature"));

await page.click("#cover");
const uncovered = await page.$eval("#cover-note", (el) => el.textContent);
assert.ok(uncovered.includes("Cover off"));
const sameHours = await page.$eval("#heatup-hm", (el) => el.getAttribute("data-hours"));
assert.ok(Math.abs(Number(sameHours) - view.hours) < 1e-9);

const geo = await page.evaluate(() => !!window.__geoCalled);
assert.strictEqual(geo, false);
assert.deepStrictEqual(blocked, []);
assert.deepStrictEqual(errors, []);

if (process.env.SHOT) {
  await page.click("#cover");
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 150));
  await page.screenshot({ path: process.env.SHOT, fullPage: false });
}
await browser.close();
console.log("ui ok", view.hm, view.kw, "kW", view.hours.toFixed(3), "h");
