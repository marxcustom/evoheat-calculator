/* Spa heat-up time.
   hours = litres × 4180 × (finish − start) / kW / 1000 / 3600
   kW is the model's heating output at the ambient air temperature. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SpaHeat = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var AMBIENTS = [2, 5, 10, 15, 20, 25, 30];

  function kwAt(model, ambient) {
    var pts = AMBIENTS.map(function (t) { return { t: t, kw: model.kw[String(t)] }; });
    if (ambient <= pts[0].t) return pts[0].kw;
    if (ambient >= pts[pts.length - 1].t) return pts[pts.length - 1].kw;
    for (var i = 1; i < pts.length; i++) {
      if (ambient <= pts[i].t) {
        var a = pts[i - 1], b = pts[i];
        return a.kw + (b.kw - a.kw) * ((ambient - a.t) / (b.t - a.t));
      }
    }
    return pts[pts.length - 1].kw;
  }

  function hours(litres, startC, finishC, kwEach, units) {
    var rise = finishC - startC;
    var total = kwEach * units;
    if (!(rise > 0) || !(total > 0)) return 0;
    return litres * 4180 * rise / total / 1000 / 3600;
  }

  function formatHM(h) {
    if (!(h > 0)) return "0 min";
    var mins = Math.round(h * 60);
    var hh = Math.floor(mins / 60);
    var mm = mins % 60;
    if (!hh) return mm + " min";
    if (!mm) return hh + " h";
    return hh + " h " + mm + " min";
  }

  function rowsFor(range, litres, startC, finishC, ambient, units) {
    return range.models.map(function (model) {
      var each = kwAt(model, ambient);
      return {
        name: model.name,
        kw: each,
        totalKw: each * units,
        hours: hours(litres, startC, finishC, each, units)
      };
    });
  }

  function smallestThatMeets(rows, targetHours) {
    var fits = rows.filter(function (row) { return row.hours > 0 && row.hours <= targetHours + 1e-9; });
    fits.sort(function (a, b) { return a.kw - b.kw; });
    return fits[0] || null;
  }

  return {
    AMBIENTS: AMBIENTS,
    kwAt: kwAt,
    hours: hours,
    formatHM: formatHM,
    rowsFor: rowsFor,
    smallestThatMeets: smallestThatMeets
  };
});
