import { createRequire } from "module";
import assert from "assert";

const require = createRequire(import.meta.url);
const { kwAt, hours, formatHM, rowsFor, smallestThatMeets } = require("../spa-heatup/calc.js");
const ranges = require("../spa-heatup/models.js");

function rangeNamed(id) {
  const found = ranges.find((item) => item.id === id);
  assert.ok(found, id);
  return found;
}
function modelNamed(id, name) {
  const found = rangeNamed(id).models.find((item) => item.name === name);
  assert.ok(found, name);
  return found;
}

// Sheet "Heatup Times options 28C": Force-i Pro 24, 8000 L, start 30 °C, finish 38 °C.
const force = modelNamed("Force-i Pro", "Force-i Pro 24");
const sheet = [
  [2, 12.84, 5.787469712703358],
  [5, 14.7, 5.055177626606206],
  [10, 17.8, 4.17478152309613],
  [15, 19.9, 3.734226689000559],
  [20, 21.69166666666671, 3.425790754257901],
  [25, 23.483333333333345, 3.164419209841493],
  [30, 27, 2.7522633744855964]
];
for (const [ambient, kw, time] of sheet) {
  const gotKw = kwAt(force, ambient);
  const got = hours(8000, 30, 38, gotKw, 1);
  assert.ok(Math.abs(gotKw - kw) < 0.001, ambient + " kW " + gotKw);
  assert.ok(Math.abs(got - time) < 0.001, ambient + " h " + got + " vs " + time);
}
assert.strictEqual(formatHM(hours(8000, 30, 38, kwAt(force, 5), 1)), "5 h 3 min");
assert.strictEqual(formatHM(hours(8000, 30, 38, kwAt(force, 30), 1)), "2 h 45 min");

// Fusion-i Pro 24 output at 30 °C matches the performance workbook (26.81 kW).
const fusion = modelNamed("Fusion-i Pro", "Fusion-i Pro 24");
assert.ok(Math.abs(kwAt(fusion, 30) - 26.81) < 1e-9);
assert.ok(Math.abs(hours(1000, 10, 38, kwAt(fusion, 30), 1) - 1.2126486800116045) < 0.001);

// Between the 5 °C and 10 °C points the output is a straight line.
const mid = kwAt(force, 7.5);
assert.ok(Math.abs(mid - (14.7 + 17.8) / 2) < 1e-9);

// Two units halve the time.
const one = hours(8000, 30, 38, kwAt(force, 5), 1);
const two = hours(8000, 30, 38, kwAt(force, 5), 2);
assert.ok(Math.abs(two - one / 2) < 1e-9);

// At 5 °C none of the Force-i Pro models heat 8,000 L from 30 °C to 38 °C in 4 h.
const rows = rowsFor(rangeNamed("Force-i Pro"), 8000, 30, 38, 5, 1);
assert.strictEqual(smallestThatMeets(rows, 4), null);
const fit = smallestThatMeets(rows, 6);
assert.strictEqual(fit.name, "Force-i Pro 24");
assert.ok(fit.hours <= 6);
const smaller = rows.filter((row) => row.kw < fit.kw);
assert.ok(smaller.every((row) => row.hours > 6));

console.log("calc ok", "Force-i Pro 24 at 5 °C", one.toFixed(3), "h,", kwAt(force, 5), "kW");
console.log("ranges", ranges.map((item) => item.id + " (" + item.models.length + ")").join(", "));
