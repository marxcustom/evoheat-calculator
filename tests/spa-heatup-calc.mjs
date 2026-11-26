import { createRequire } from "module";
import assert from "assert";

const require = createRequire(import.meta.url);
const { kwAt, hours, formatHM, rowsFor, smallestThatMeets, AMBIENTS } = require("../spa-heatup/calc.js");
const ranges = require("../spa-heatup/models.js");

assert.deepStrictEqual(ranges.map((item) => item.id), ["Force-Ai", "Fusion-i Pro"]);

function model(rangeId, name) {
  return ranges.find((item) => item.id === rangeId).models.find((item) => item.name === name);
}

const force16 = model("Force-Ai", "Force-Ai 16");
const fusion7 = model("Fusion-i Pro", "Fusion-i Pro 7");
const fusion24 = model("Fusion-i Pro", "Fusion-i Pro 24");

assert.strictEqual(kwAt(force16, 15), 10.17);
assert.strictEqual(kwAt(force16, 27), 13.6);
assert.strictEqual(kwAt(fusion7, 15), 5);
assert.strictEqual(kwAt(fusion7, 27), 7);
assert.strictEqual(kwAt(fusion24, 15), 18.6);
assert.strictEqual(kwAt(fusion24, 27), 24.6);

// Straight line between the two brochure points, and the same line outside them.
const mid = kwAt(fusion7, 21);
assert.ok(Math.abs(mid - (5 + (7 - 5) * (21 - 15) / 12)) < 1e-9);
const at2 = kwAt(fusion24, 2);
assert.ok(Math.abs(at2 - (18.6 + (24.6 - 18.6) * (2 - 15) / 12)) < 1e-9);

const example = hours(1500, 20, 38, kwAt(force16, 15), 1);
assert.ok(Math.abs(example - 3.08259587020649) < 1e-9);
assert.strictEqual(formatHM(example), "3 h 5 min");

const both = ranges.flatMap((range) => rowsFor(range, 1500, 20, 38, 15, 1));
assert.strictEqual(both.length, 16);
const fit = smallestThatMeets(both, 8);
assert.strictEqual(fit.name, "Fusion-i Pro 7");
assert.ok(fit.hours <= 8);
assert.ok(AMBIENTS.indexOf(15) >= 0);

console.log("calc ok", "Force-Ai 16 at 15 °C", example.toFixed(3), "h");
console.log(ranges.map((item) => item.name + ": " + item.models.map((m) => m.name).join(", ")).join("\n"));
