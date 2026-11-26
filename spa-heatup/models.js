/* Heating output (kW) from the EvoHeat brochures.
   Points are the maximum of the published heating-capacity range at
   air 15 °C and air 27 °C, water in 26 °C / water out 28 °C.
   https://evoheat.com.au/brochures/ */
(function (root) {
var SPA_RANGES = [
  {
    id: "Force-Ai",
    name: "Force-Ai",
    note: "Maximum heating capacity from BROCHURE-Evo-Force-Ai.pdf. Conditions: air 15 °C and air 27 °C, water in 26 °C / out 28 °C. Other ambients are a straight line through those two published points. Boost mode, published only at 27 °C, is not used.",
    models: [
      {name:"Force-Ai 13",kw:{15:8.32,27:10.70}},
      {name:"Force-Ai 16",kw:{15:10.17,27:13.60}},
      {name:"Force-Ai 19",kw:{15:13.10,27:17.10}},
      {name:"Force-Ai 22",kw:{15:16.10,27:20.60}},
      {name:"Force-Ai 28",kw:{15:20.40,27:26.00}},
      {name:"Force-Ai 32",kw:{15:24.36,27:30.10}},
      {name:"Force-Ai 32-3",kw:{15:24.36,27:30.10}},
      {name:"Force-Ai 40-3",kw:{15:28.88,27:38.00}}
    ]
  },
  {
    id: "Fusion-i Pro",
    name: "Fusion-i Pro",
    note: "Maximum heating capacity from BROCHURE-Evo-Fusion-i-Pro.pdf. Conditions: air 15 °C and air 27 °C, water in 26 °C / out 28 °C. Other ambients are a straight line through those two published points.",
    models: [
      {name:"Fusion-i Pro 7",kw:{15:5.00,27:7.00}},
      {name:"Fusion-i Pro 9",kw:{15:6.60,27:9.36}},
      {name:"Fusion-i Pro 13",kw:{15:9.07,27:12.30}},
      {name:"Fusion-i Pro 16",kw:{15:10.99,27:15.48}},
      {name:"Fusion-i Pro 19",kw:{15:12.47,27:18.00}},
      {name:"Fusion-i Pro 24",kw:{15:18.60,27:24.60}},
      {name:"Fusion-i Pro 28-3",kw:{15:21.40,27:28.87}},
      {name:"Fusion-i Pro 35-3",kw:{15:24.41,27:32.37}}
    ]
  }
];
root.SPA_RANGES = SPA_RANGES;
if (typeof module === "object" && module.exports) module.exports = SPA_RANGES;
})(typeof globalThis !== "undefined" ? globalThis : this);
