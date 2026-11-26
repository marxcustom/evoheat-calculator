(function () {
  var LOCATIONS = window.CHILLING_LOCATIONS || [];
  var STATES = window.CHILLING_STATES || [];
  function $(id) { return document.getElementById(id); }
  function num(id) { return parseFloat($(id).value); }
  function seg(group) {
    var el = document.querySelector('[data-group="' + group + '"] button.on');
    return el ? el.dataset.value : "";
  }
  function setSeg(group, value) {
    document.querySelectorAll('[data-group="' + group + '"] button').forEach(function (b) {
      b.classList.toggle("on", b.dataset.value === String(value));
    });
  }
  function checked(id) { return $(id).getAttribute("aria-checked") === "true"; }
  function setChecked(id, on) { $(id).setAttribute("aria-checked", on ? "true" : "false"); }
  function city() {
    var id = $("city").value;
    for (var i = 0; i < LOCATIONS.length; i++) if (LOCATIONS[i].id === id) return LOCATIONS[i];
    return LOCATIONS[0];
  }
  function fmt(n, d) {
    return (+n).toLocaleString("en-AU", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function kw(n) { return fmt(n, 2) + " kW"; }

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
  function applyCityAir() {
    var c = city();
    if (!c) return;
    $("air").value = String(c.summerMax);
  }

  function syncArea() {
    var shape = seg("shape");
    if (shape === "rectangle") $("area").value = String(Math.round(num("length") * num("width") * 10) / 10);
    else if (shape === "circle") {
      var r = num("diameter") / 2;
      $("area").value = String(Math.round(Math.PI * r * r * 10) / 10);
    }
  }

  function read() {
    return {
      indoor: seg("place") !== "outdoor",
      roomC: num("room"),
      airC: num("air"),
      targetC: num("target"),
      litres: num("litres"),
      vessels: num("vessels"),
      areaM2: num("area"),
      people: num("people"),
      shiftsPerHour: +seg("shifts"),
      pumpCount: num("pumps"),
      pumpWatts: num("pump-watts"),
      uv: checked("uv"),
      sun: checked("sun"),
      sharedWall: checked("shared"),
      factor: num("factor"),
      hours: +seg("hours")
    };
  }

  function sliderText() {
    $("target-read").textContent = fmt(num("target"), 1) + " °C";
    $("room-read").textContent = fmt(num("room"), 1) + " °C";
    $("air-read").textContent = fmt(num("air"), 1) + " °C";
    $("litres-read").textContent = fmt(num("litres"), 0) + " L";
    $("vessels-read").textContent = fmt(num("vessels"), 0);
    $("length-read").textContent = fmt(num("length"), 1) + " m";
    $("width-read").textContent = fmt(num("width"), 1) + " m";
    $("diameter-read").textContent = fmt(num("diameter"), 1) + " m";
    $("area-read").textContent = fmt(num("area"), 1) + " m²";
    $("people-read").textContent = fmt(num("people"), 0);
    $("pumps-read").textContent = fmt(num("pumps"), 0);
    $("pump-watts-read").textContent = fmt(num("pump-watts"), 0) + " W";
    $("factor-read").textContent = fmt(num("factor"), 2);
  }

  function showPlace() {
    var indoor = seg("place") !== "outdoor";
    $("room-block").hidden = !indoor;
    $("air-block").hidden = indoor;
    $("rect-helper").hidden = seg("shape") !== "rectangle";
    $("circle-helper").hidden = seg("shape") !== "circle";
  }

  function table(id, rows, key, hours) {
    var body = $(id).querySelector("tbody");
    body.innerHTML = rows.map(function (row) {
      var pick = row.hours === hours ? " class=\"pick\"" : "";
      return "<tr" + pick + " data-hours=\"" + row.hours + "\"><td>" + row.hours + " h</td><td class=\"num\">" + kw(row[key]) + "</td></tr>";
    }).join("");
  }

  function refresh() {
    showPlace();
    sliderText();
    var input = read();
    var r = window.ChillingCalc.compute(input);
    var c = city();
    $("required-kw").textContent = kw(r.requiredKw);
    $("required-detail").textContent = "Including heat gains at " + r.hours + " h. Excluding gains: " + kw(r.excludingKw) + ".";
    $("start-read").textContent = fmt(r.start, 1) + " °C";
    $("delta-read").textContent = fmt(r.deltaT, 1) + " K";
    $("people-hour").textContent = fmt(r.peoplePerHour, 0) + " people per hour";
    if (c) $("air-hint").textContent = "Summer design maximum for " + c.label + " is " + fmt(c.summerMax, 1) + " °C. The slider starts there. Change it if you have a measured figure.";
    var vesselNote = r.fullVessel ? "full, litres × plunges" : "indoors, litres × plunges ÷ 2";
    $("gains").innerHTML = [
      ["Bathers", r.batherW],
      ["Pumps", r.pumpW],
      ["UV", r.uvW],
      ["Direct sun", r.sunW],
      ["Vessel (" + vesselNote + ")", r.vesselW]
    ].map(function (row) {
      return "<div><span>" + row[0] + "</span><span>" + fmt(row[1], 0) + " W</span></div>";
    }).join("") + "<div class=\"total\"><span>Total gains</span><span id=\"gains-kw\">" + kw(r.gainsKw) + "</span></div>";
    table("table-excluding", r.pull, "excluding", r.hours);
    table("table-including", r.pull, "including", r.hours);
    $("chip").textContent = kw(r.requiredKw) + " · " + r.hours + " h · Reset";
  }

  function reset() {
    $("consultant").value = "";
    $("project-name").value = "";
    $("pump-model").value = "";
    $("material").value = "Plastic walls";
    setSeg("use", "residential");
    setSeg("shape", "rectangle");
    setSeg("install", "aboveground");
    setSeg("place", "indoor");
    setSeg("shifts", "3");
    setSeg("hours", "4");
    setChecked("shared", false);
    setChecked("sun", false);
    setChecked("uv", true);
    $("litres").value = "1000";
    $("vessels").value = "1";
    $("length").value = "2";
    $("width").value = "1";
    $("diameter").value = "1.5";
    $("area").value = "2";
    $("target").value = "6";
    $("room").value = "30";
    $("people").value = "2";
    $("pumps").value = "1";
    $("pump-watts").value = "300";
    $("factor").value = "0.9";
    $("state").value = "WA";
    fillCities();
    var perth = LOCATIONS.filter(function (c) { return c.label === "Perth" && c.state === "WA"; })[0];
    if (perth) $("city").value = perth.id;
    applyCityAir();
    refresh();
  }

  function onControl(e) {
    var t = e.target;
    if (!t || !t.id) return;
    if (t.id === "length" || t.id === "width" || t.id === "diameter") syncArea();
    if (t.id === "state") { fillCities(); applyCityAir(); }
    if (t.id === "city") applyCityAir();
    refresh();
  }
  document.addEventListener("input", onControl);
  document.addEventListener("change", onControl);
  document.addEventListener("click", function (e) {
    var row = e.target.closest("tr[data-hours]");
    if (row && !e.target.closest("button")) {
      setSeg("hours", row.dataset.hours);
      refresh();
      return;
    }
    var b = e.target.closest("button");
    if (!b) return;
    if (b.id === "chip") { reset(); return; }
    if (b.classList.contains("switch")) {
      setChecked(b.id, !checked(b.id));
      refresh();
      return;
    }
    var group = b.closest("[data-group]");
    if (group) {
      setSeg(group.dataset.group, b.dataset.value);
      if (group.dataset.group === "shape") syncArea();
      refresh();
    }
  });

  var nav = ["Project", "Location", "Plunge dimensions and details", "Temperature", "Use", "Heat gains", "Pull-down", "Advanced", "Chiller models", "FYI for best results ensure:"];
  $("contents").innerHTML = '<div class="label">Contents</div><div class="links">' + nav.map(function (label) {
    var id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return '<a href="#' + id + '">' + label.replace(/:$/, "") + "</a>";
  }).join("") + "</div>";

  fillStates();
  var perth = LOCATIONS.filter(function (c) { return c.label === "Perth" && c.state === "WA"; })[0];
  if (perth) $("city").value = perth.id;
  applyCityAir();
  refresh();

  function deviceLine() {
    var e = navigator.userAgent || "";
    var pad = /Macintosh/.test(e) && (navigator.maxTouchPoints || 0) > 1;
    var device = /iPhone|iPod/.test(e) ? "iPhone" : /iPad/.test(e) || pad ? "iPad" : /Android/.test(e) ? "Android" : /Macintosh|Mac OS X/.test(e) ? "Mac" : /Windows/.test(e) ? "Windows" : "Other";
    var browser = /SamsungBrowser/.test(e) ? "Samsung" : /Edg(e|A|iOS)?\//.test(e) ? "Edge" : /Firefox|FxiOS/.test(e) ? "Firefox" : /Chrome|CriOS|Chromium/.test(e) ? "Chrome" : /Safari/.test(e) ? "Safari" : "Other";
    var installed = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
    var zone = "";
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (err) { zone = ""; }
    var place = zone === "Australia/Broken_Hill" ? "Adelaide" : zone.indexOf("/") >= 0 ? zone.split("/").pop().replace(/_/g, " ") : "local";
    var opt = { hour: "numeric", minute: "2-digit", hour12: true };
    if (zone) opt.timeZone = zone;
    var clock = new Date().toLocaleTimeString("en-AU", opt).replace(/\s/g, " ").toLowerCase();
    return "Chilling app opened · " + device + " · " + browser + " · " + (installed ? "installed app" : "browser") + " · device time " + clock + " " + place;
  }
  function notifyOpen() {
    try {
      if (navigator.webdriver) return;
      if (Date.now() - Number(sessionStorage.getItem("sw-reloaded") || 0) < 15000) return;
      fetch("https://ntfy.sh/markpool-bff5c8fb63a3?title=" + encodeURIComponent("Chilling") + "&tags=snowflake", {
        method: "POST", body: deviceLine(), mode: "cors", keepalive: true, credentials: "omit",
        headers: { "Content-Type": "text/plain" }
      }).catch(function () {});
    } catch (err) {}
  }
  notifyOpen();
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") window.__chillHidden = Date.now();
    else if (window.__chillHidden && Date.now() - window.__chillHidden >= 30 * 60 * 1000) {
      window.__chillHidden = 0;
      notifyOpen();
    }
  });
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
