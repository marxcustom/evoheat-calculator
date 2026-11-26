/* Cold-plunge chilling maths from the project sheet.
   Vessel gain is litres × vessels, halved indoors unless the vessel
   shares a wall with a hot pool or sits outdoors. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ChillingCalc = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var HOURS = [1, 2, 4, 8, 12, 16, 20, 24];
  var BATHER_W = 300;
  var UV_W = 110;
  var SUN_W_M2 = 1000;

  function compute(p) {
    var start = p.indoor ? +p.roomC : +p.airC;
    var deltaT = start - +p.targetC;
    var batherW = +p.people * BATHER_W * +p.shiftsPerHour;
    var pumpW = +p.pumpCount * +p.pumpWatts;
    var uvW = p.uv ? UV_W : 0;
    var sunW = !p.indoor && p.sun ? SUN_W_M2 * +p.areaM2 : 0;
    var fullVessel = !p.indoor || p.sharedWall;
    var vesselW = +p.litres * +p.vessels * (fullVessel ? 1 : 0.5);
    var gainsW = batherW + pumpW + uvW + sunW + vesselW;
    var gainsKw = gainsW / 1000;
    var factor = +p.factor;
    var pull = HOURS.map(function (hours) {
      var excluding = (4.18 * deltaT * +p.litres) / (3600 * hours * factor);
      return { hours: hours, excluding: excluding, including: gainsKw + excluding };
    });
    var chosen = null;
    for (var i = 0; i < pull.length; i++) if (pull[i].hours === +p.hours) chosen = pull[i];
    if (!chosen) chosen = pull[2];
    return {
      start: start,
      deltaT: deltaT,
      batherW: batherW,
      pumpW: pumpW,
      uvW: uvW,
      sunW: sunW,
      vesselW: vesselW,
      fullVessel: fullVessel,
      gainsW: gainsW,
      gainsKw: gainsKw,
      pull: pull,
      hours: chosen.hours,
      requiredKw: chosen.including,
      excludingKw: chosen.excluding,
      peoplePerHour: +p.people * +p.shiftsPerHour
    };
  }

  return { HOURS: HOURS, BATHER_W: BATHER_W, UV_W: UV_W, SUN_W_M2: SUN_W_M2, compute: compute };
});
