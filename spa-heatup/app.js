(function () {
  var RANGES = window.SPA_RANGES || [];
  var LOCATIONS = window.SPA_LOCATIONS || [];
  var STATES = window.SPA_STATES || [];
  var Heat = window.SpaHeat;

  function $(id) { return document.getElementById(id); }
  function num(id) { return parseFloat($(id).value); }
  function fmt(n, d) {
    return (+n).toLocaleString("en-AU", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function checked(id) { return $(id).getAttribute("aria-checked") === "true"; }
  function setChecked(id, on) { $(id).setAttribute("aria-checked", on ? "true" : "false"); }
  function city() {
    var id = $("city").value;
    for (var i = 0; i < LOCATIONS.length; i++) if (LOCATIONS[i].id === id) return LOCATIONS[i];
    return LOCATIONS[0];
  }
  function range() {
    var id = $("range").value;
    for (var i = 0; i < RANGES.length; i++) if (RANGES[i].id === id) return RANGES[i];
    return RANGES[0];
  }
  function model() {
    var name = $("model").value;
    var list = range().models;
    for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return list[0];
  }

  function fillStates() {
    $("state").innerHTML = STATES.map(function (s) { return '<option value="' + s + '">' + s + "</option>"; }).join("");
    $("state").value = "WA";
    fillCities();
  }
  function fillCities() {
    var st = $("state").value;
    var list = LOCATIONS.filter(function (c) { return c.state === st; });
    $("city").innerHTML = list.map(function (c) {
      return '<option value="' + c.id + '">' + c.label + "</option>";
    }).join("");
  }
  function fillRanges() {
    $("range").innerHTML = RANGES.map(function (r) {
      return '<option value="' + r.id + '">' + r.name + "</option>";
    }).join("");
    var prefer = RANGES.filter(function (r) { return r.id === "Force-i Pro"; })[0];
    if (prefer) $("range").value = prefer.id;
    fillModels();
  }
  function fillModels() {
    var current = $("model").value;
    var list = range().models;
    $("model").innerHTML = list.map(function (m) {
      return '<option value="' + m.name + '">' + m.name + "</option>";
    }).join("");
    if (list.some(function (m) { return m.name === current; })) $("model").value = current;
    else if (list.some(function (m) { return m.name === "Force-i Pro 24"; })) $("model").value = "Force-i Pro 24";
  }
  function applyCity() {
    var c = city();
    if (!c) return;
    $("start").value = String(c.coldMains);
    $("ambient").value = String(Math.min(30, Math.max(2, c.coldAir)));
  }
  function syncVolume() {
    var litres = Math.round(num("length") * num("width") * num("depth") * 1000);
    litres = Math.min(20000, Math.max(200, litres));
    $("litres").value = String(litres);
  }

  function refresh() {
    var r = range();
    var m = model();
    var litres = num("litres");
    var start = num("start");
    var target = num("target");
    var ambient = num("ambient");
    var units = num("units");
    var each = Heat.kwAt(m, ambient);
    var h = Heat.hours(litres, start, target, each, units);
    $("litres-read").textContent = fmt(litres, 0) + " L";
    $("length-read").textContent = fmt(num("length"), 1) + " m";
    $("width-read").textContent = fmt(num("width"), 1) + " m";
    $("depth-read").textContent = fmt(num("depth"), 2) + " m";
    $("start-read").textContent = fmt(start, 1) + " °C";
    $("target-read").textContent = fmt(target, 1) + " °C";
    $("ambient-read").textContent = fmt(ambient, 1) + " °C";
    $("units-read").textContent = fmt(units, 0);
    $("goal-read").textContent = fmt(num("goal"), 1) + " h";
    $("range-note").textContent = r.note;
    var place = city();
    if (place) {
      $("start-hint").textContent = "Cold-month mains temperature for " + place.label + " is " + fmt(place.coldMains, 1) + " °C. Change the slider if the spa starts warmer.";
      $("ambient-hint").textContent = "Cold-month 9 am air temperature for " + place.label + " is " + fmt(place.coldAir, 1) + " °C. The slider starts there.";
    }
    $("cover-note").textContent = checked("cover")
      ? "Cover on. This is recorded only. It does not change the heat-up time."
      : "Cover off. Uncovered spas are one of the factors that increase the time. No loss figure is added.";
    $("heatup-hm").textContent = Heat.formatHM(h);
    $("heatup-hm").setAttribute("data-hours", String(h));
    $("heatup-hm").setAttribute("data-kw", String(each));
    $("heatup-detail").textContent = m.name + " · " + fmt(each, 2) + " kW each · " + fmt(units, 0) + (units > 1 ? " units · " : " unit · ") + fmt(h, 2) + " h at " + fmt(ambient, 1) + " °C ambient.";
    $("chip").textContent = Heat.formatHM(h) + " · " + m.name + " · Reset";

    var body = Heat.AMBIENTS.map(function (t) {
      var kw = Heat.kwAt(m, t);
      var th = Heat.hours(litres, start, target, kw, units);
      var pick = Math.abs(t - ambient) < 0.001 ? " class=\"pick\"" : "";
      return "<tr" + pick + "><td>" + t + " °C</td><td class=\"num\">" + fmt(kw * units, 2) + " kW</td><td class=\"num\">" + Heat.formatHM(th) + "</td></tr>";
    }).join("");
    $("table-ambient").querySelector("tbody").innerHTML = body;

    var rows = Heat.rowsFor(r, litres, start, target, ambient, units);
    $("compare").innerHTML = rows.map(function (row) {
      var on = row.name === m.name ? " class=\"total\"" : "";
      return "<div" + on + "><span>" + row.name + "</span><span>" + Heat.formatHM(row.hours) + " · " + fmt(row.kw, 2) + " kW</span></div>";
    }).join("");
    var goal = num("goal");
    var fit = Heat.smallestThatMeets(rows, goal);
    if (fit) {
      $("fastest").innerHTML = "<strong>Smallest model to reach " + fmt(goal, 1) + " h</strong>" + fit.name + " · " + Heat.formatHM(fit.hours) + " · " + fmt(fit.kw, 2) + " kW. This is the lowest output in the range that meets the target time.";
    } else {
      var fastest = rows.slice().sort(function (a, b) { return a.hours - b.hours; })[0];
      $("fastest").innerHTML = "<strong>No model in this range reaches " + fmt(goal, 1) + " h</strong>" + (fastest ? "The fastest is " + fastest.name + " at " + Heat.formatHM(fastest.hours) + " · " + fmt(fastest.kw, 2) + " kW." : "");
    }
  }

  function reset() {
    $("length").value = "2";
    $("width").value = "2";
    $("depth").value = "0.8";
    $("litres").value = "1500";
    $("target").value = "38";
    $("units").value = "1";
    $("goal").value = "4";
    setChecked("cover", true);
    $("state").value = "WA";
    fillCities();
    var perth = LOCATIONS.filter(function (c) { return c.label === "Perth" && c.state === "WA"; })[0];
    if (perth) $("city").value = perth.id;
    applyCity();
    fillRanges();
    refresh();
  }

  function onControl(e) {
    var t = e.target;
    if (!t || !t.id) return;
    if (t.id === "length" || t.id === "width" || t.id === "depth") syncVolume();
    if (t.id === "state") { fillCities(); applyCity(); }
    if (t.id === "city") applyCity();
    if (t.id === "range") fillModels();
    refresh();
  }
  document.addEventListener("input", onControl);
  document.addEventListener("change", onControl);
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.id === "chip") { reset(); return; }
    if (b.classList.contains("switch")) {
      setChecked(b.id, !checked(b.id));
      refresh();
    }
  });

  var nav = ["Spa", "Location", "Temperature", "Heat pump", "Time at each ambient", "Every model in this range"];
  $("contents").innerHTML = '<div class="label">Contents</div><div class="links">' + nav.map(function (label) {
    var id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return '<a href="#' + id + '">' + label + "</a>";
  }).join("") + "</div>";

  fillStates();
  var perth = LOCATIONS.filter(function (c) { return c.label === "Perth" && c.state === "WA"; })[0];
  if (perth) $("city").value = perth.id;
  applyCity();
  fillRanges();
  refresh();

  function deviceLine() {
    var e = navigator.userAgent || "";
    var pad = /Macintosh/.test(e) && (navigator.maxTouchPoints || 0) > 1;
    var device = /iPhone|iPod/.test(e) ? "iPhone" : /iPad/.test(e) || pad ? "iPad" : /Android/.test(e) ? "Android" : /Macintosh|Mac OS X/.test(e) ? "Mac" : /Windows/.test(e) ? "Windows" : "Other";
    var browser = /SamsungBrowser/.test(e) ? "Samsung" : /Edg(e|A|iOS)?\//.test(e) ? "Edge" : /Firefox|FxiOS/.test(e) ? "Firefox" : /Chrome|CriOS|Chromium/.test(e) ? "Chrome" : /Safari/.test(e) ? "Safari" : "Other";
    var installed = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
    var zone = "";
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (err) { zone = ""; }
    var where = zone === "Australia/Broken_Hill" ? "Adelaide" : zone.indexOf("/") >= 0 ? zone.split("/").pop().replace(/_/g, " ") : "local";
    var opt = { hour: "numeric", minute: "2-digit", hour12: true };
    if (zone) opt.timeZone = zone;
    var clock = new Date().toLocaleTimeString("en-AU", opt).replace(/\s/g, " ").toLowerCase();
    return "Spa Heat-Up app opened · " + device + " · " + browser + " · " + (installed ? "installed app" : "browser") + " · device time " + clock + " " + where;
  }
  function notifyOpen() {
    try {
      if (navigator.webdriver) return;
      if (Date.now() - Number(sessionStorage.getItem("sw-reloaded") || 0) < 15000) return;
      fetch("https://ntfy.sh/markpool-bff5c8fb63a3?title=" + encodeURIComponent("Spa Heat-Up") + "&tags=hotsprings", {
        method: "POST", body: deviceLine(), mode: "cors", keepalive: true, credentials: "omit",
        headers: { "Content-Type": "text/plain" }
      }).catch(function () {});
    } catch (err) {}
  }
  notifyOpen();
  if ("serviceWorker" in navigator) {
    var had = !!navigator.serviceWorker.controller, reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      var n = Number(sessionStorage.getItem("sw-reloaded") || 0);
      if (!had || reloaded || Date.now() - n < 10000) return;
      reloaded = true;
      sessionStorage.setItem("sw-reloaded", String(Date.now()));
      setTimeout(function () { window.location.reload(); }, 3000);
    });
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(function () {});
    });
  }
})();
