import { createRequire } from "module";
import assert from "assert";

const require = createRequire(import.meta.url);
const { compute, HOURS } = require("../chilling/calc.js");

const example = {
  indoor: true,
  roomC: 30,
  airC: 32.1,
  targetC: 6,
  litres: 1000,
  vessels: 1,
  areaM2: 2,
  people: 2,
  shiftsPerHour: 3,
  pumpCount: 1,
  pumpWatts: 300,
  uv: true,
  sun: false,
  sharedWall: false,
  factor: 0.9,
  hours: 4
};

const result = compute(example);
const deltaT = 30 - 6;
const gainsW = 2 * 300 * 3 + 1 * 300 + 110 + 1000 * 1 / 2;
const pull4 = (4.18 * deltaT * 1000) / (3600 * 4 * 0.9);

assert.strictEqual(result.deltaT, 24);
assert.strictEqual(result.batherW, 1800);
assert.strictEqual(result.pumpW, 300);
assert.strictEqual(result.uvW, 110);
assert.strictEqual(result.sunW, 0);
assert.strictEqual(result.vesselW, 500);
assert.strictEqual(result.gainsW, gainsW);
assert.ok(Math.abs(result.gainsKw - 2.71) < 1e-12);
assert.ok(Math.abs(result.excludingKw - pull4) < 1e-12);
assert.ok(Math.abs(result.requiredKw - (gainsW / 1000 + pull4)) < 1e-12);
assert.strictEqual(result.requiredKw.toFixed(2), "10.45");
assert.strictEqual(result.excludingKw.toFixed(2), "7.74");
assert.deepStrictEqual(result.pull.map((row) => row.hours), HOURS);

for (const hours of HOURS) {
  const row = result.pull.find((item) => item.hours === hours);
  const excluding = (4.18 * deltaT * 1000) / (3600 * hours * 0.9);
  assert.ok(Math.abs(row.excluding - excluding) < 1e-9, "excluding " + hours);
  assert.ok(Math.abs(row.including - (gainsW / 1000 + excluding)) < 1e-9, "including " + hours);
}

const outdoor = compute({ ...example, indoor: false, airC: 32.1, sun: true, areaM2: 2.5, people: 0, pumpCount: 0, uv: false, hours: 4 });
assert.strictEqual(outdoor.start, 32.1);
assert.strictEqual(outdoor.vesselW, 1000);
assert.strictEqual(outdoor.sunW, 2500);
assert.strictEqual(outdoor.gainsW, 3500);

const shared = compute({ ...example, sharedWall: true });
assert.strictEqual(shared.vesselW, 1000);
assert.strictEqual(shared.fullVessel, true);

const two = compute({ ...example, vessels: 2 });
assert.strictEqual(two.vesselW, 1000);

console.log("calc ok", result.requiredKw.toFixed(2), "kW including,", result.excludingKw.toFixed(2), "kW excluding, gains", result.gainsKw, "kW");
