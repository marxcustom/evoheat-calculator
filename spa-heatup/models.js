/* Model heating output in kW at each ambient air temperature. */
(function (root) {
var SPA_RANGES = [
  {
    id: "Force-Ai",
    name: "Force-Ai",
    note: "Heating output is taken from the performance workbook while the water is brought from 28 \u00b0C to 38 \u00b0C, the case closest to spa temperature.",
    models: [
      {name:"Force-Ai 13",kw:{2:5.1,5:5.7818,10:6.9182,15:8.0545,20:9.1909,25:10.3273,30:11.4636}},
      {name:"Force-Ai 16",kw:{2:6.2,5:7.0864,10:8.5636,15:10.0409,20:11.5182,25:12.9955,30:14.4727}},
      {name:"Force-Ai 19",kw:{2:8.0,5:9.1045,10:10.9455,15:12.7864,20:14.6273,25:16.4682,30:18.3091}},
      {name:"Force-Ai 22",kw:{2:9.8,5:11.1227,10:13.3273,15:15.5318,20:17.7364,25:19.9409,30:22.1455}},
      {name:"Force-Ai 28",kw:{2:10.7,5:12.5955,10:15.7545,15:18.9136,20:22.0727,25:25.2318,30:28.3909}},
      {name:"Force-Ai 32",kw:{2:12.3,5:14.5364,10:18.2636,15:21.9909,20:25.7182,25:29.4455,30:33.1727}},
      {name:"Force-Ai 32-3",kw:{2:12.3,5:14.5364,10:18.2636,15:21.9909,20:25.7182,25:29.4455,30:33.1727}},
      {name:"Force-Ai 40-3",kw:{2:16.54,5:19.03,10:24.97,15:28.8,20:32.6,25:36.47,30:40.3}},
    ]
  },
  {
    id: "Fusion-i Pro",
    name: "Fusion-i Pro",
    note: "Heating output is taken from the performance workbook while the water is brought from 28 \u00b0C to 38 \u00b0C, the case closest to spa temperature.",
    models: [
      {name:"Fusion-i Pro 7",kw:{2:2.79,5:3.51,10:4.37,15:5.0,20:5.8,25:6.66,30:7.6}},
      {name:"Fusion-i Pro 9",kw:{2:3.67,5:4.52,10:5.67,15:6.6,20:7.59,25:8.85,30:10.2}},
      {name:"Fusion-i Pro 13",kw:{2:4.81,5:6.14,10:7.79,15:9.07,20:10.43,25:11.77,30:13.41}},
      {name:"Fusion-i Pro 16",kw:{2:6.02,5:7.52,10:9.44,15:10.99,20:12.64,25:14.67,30:16.87}},
      {name:"Fusion-i Pro 19",kw:{2:6.0,5:8.19,10:10.71,15:12.47,20:14.34,25:16.95,30:19.62}},
      {name:"Fusion-i Pro 24",kw:{2:10.46,5:12.82,10:15.97,15:18.6,20:21.39,25:23.68,30:26.81}},
      {name:"Fusion-i Pro 28",kw:{2:11.19,5:13.71,10:17.65,15:21.4,20:23.5,25:27.36,30:31.5}},
      {name:"Fusion-i Pro 35-3",kw:{2:12.21,5:16.21,10:20.95,15:24.41,20:26.85,25:30.79,30:35.28}},
    ]
  },
  {
    id: "Dynamic-i Pro",
    name: "Dynamic-i Pro",
    note: "Heating output is taken from the performance workbook while the water is brought from 28 \u00b0C to 38 \u00b0C, the case closest to spa temperature.",
    models: [
      {name:"Dynamic-i Pro 50",kw:{2:11.01,5:13.03,10:15.96,15:18.6,20:20.85,25:23.1,30:24.85}},
      {name:"Dynamic-i Pro 60",kw:{2:10.67,5:11.62,10:15.39,15:20.6,20:23.73,25:26.85,30:29.65}},
      {name:"Dynamic-i Pro 703",kw:{2:14.53,5:17.68,10:21.96,15:25.6,20:28.64,25:31.68,30:34.07}},
    ]
  },
  {
    id: "Force i",
    name: "Force i",
    note: "Heating output is taken from the performance workbook. Precise 28 \u00b0C to 38 \u00b0C times are used where the sheet gives them. Where those times are only given to 0.1 h, the precise 18 \u00b0C to 38 \u00b0C times are used, the next closest water temperature to a spa.",
    models: [
      {name:"Force i9",kw:{2:4.708,5:5.23,10:6.1,15:7.4,20:8.0667,25:8.7333,30:11.0}},
      {name:"Force i12",kw:{2:6.4,5:7.0,10:8.0,15:9.7,20:10.6583,25:11.6167,30:14.0}},
      {name:"Force i17",kw:{2:8.14,5:9.1,10:10.7,15:12.4,20:14.3167,25:16.2333,30:19.0}},
      {name:"Force i19",kw:{2:10.56,5:12.0,10:14.4,15:15.4,20:17.1083,25:18.8167,30:21.0}},
      {name:"Force i24",kw:{2:12.84,5:14.7,10:17.8,15:19.9,20:21.6917,25:23.4833,30:27.0}},
      {name:"Force i28-3",kw:{2:15.184,5:17.29,10:20.8,15:23.3,20:25.3833,25:27.4667,30:30.0}},
    ]
  },
  {
    id: "Fusion i",
    name: "Fusion i",
    note: "Heating output is taken from the performance workbook while the water is brought from 28 \u00b0C to 38 \u00b0C, the case closest to spa temperature.",
    models: [
      {name:"Fusion i7",kw:{2:3.0,5:3.5236,10:4.3964,15:5.2691,20:6.1418,25:7.0145,30:7.8873}},
      {name:"Fusion i9",kw:{2:4.0,5:4.6136,10:5.6364,15:6.6591,20:7.6818,25:8.7045,30:9.7273}},
      {name:"Fusion i12",kw:{2:6.0,5:6.6682,10:7.7818,15:8.8955,20:10.0091,25:11.1227,30:12.2364}},
      {name:"Fusion i16",kw:{2:8.0,5:8.975,10:10.6,15:12.225,20:13.85,25:15.475,30:17.1}},
      {name:"Fusion i19",kw:{2:10.0,5:11.0602,10:12.8273,15:14.5943,20:16.3614,25:18.1284,30:19.8955}},
    ]
  },
  {
    id: "Apex",
    name: "Apex",
    note: "Heating output is taken from the performance workbook while the water is brought from 28 \u00b0C to 38 \u00b0C, the case closest to spa temperature.",
    models: [
      {name:"Apex 11",kw:{2:5.7314,5:6.2886,10:6.97,15:7.49,20:9.05,25:10.55,30:11.77}},
      {name:"Apex 14",kw:{2:6.0429,5:6.7371,10:7.8,15:8.9,20:10.89,25:13.0567,30:15.21}},
      {name:"Apex 18",kw:{2:8.9643,5:9.9157,10:11.18,15:12.29,20:15.0,25:17.725,30:20.13}},
      {name:"Apex 22",kw:{2:9.9929,5:10.8971,10:12.91,15:14.33,20:17.74,25:20.4483,30:24.39}},
      {name:"Apex 26",kw:{2:13.1714,5:14.4786,10:16.33,15:18.08,20:21.7,25:25.4167,30:28.82}},
      {name:"Apex 31",kw:{2:15.1343,5:16.6857,10:19.26,15:22.11,20:26.32,25:31.0117,30:35.95}},
      {name:"Apex 40T",kw:{2:18.7514,5:20.5986,10:23.98,15:28.03,20:32.83,25:38.4967,30:44.94}},
    ]
  },
  {
    id: "Edge i",
    name: "Edge i",
    note: "Heating output is taken from the performance workbook while the water is brought from 28 \u00b0C to 38 \u00b0C, the case closest to spa temperature.",
    models: [
      {name:"Edge i7",kw:{2:3.4,5:3.7862,10:4.43,15:5.34,20:6.2192,25:7.0983,30:7.84}},
      {name:"Edge i9",kw:{2:3.43,5:4.1313,10:5.3,15:6.62,20:7.6825,25:8.745,30:9.65}},
      {name:"Edge i13",kw:{2:4.27,5:5.2487,10:6.88,15:8.55,20:9.7667,25:10.9833,30:12.07}},
      {name:"Edge i17",kw:{2:5.55,5:6.9075,10:9.17,15:11.38,20:13.3133,25:15.2467,30:16.86}},
      {name:"Edge i20",kw:{2:6.52,5:7.8888,10:10.17,15:13.2,20:15.2417,25:17.2833,30:19.05}},
    ]
  },
  {
    id: "DHP",
    name: "DHP",
    note: "Heating output is taken from the heat-up table at 2, 5, 10, 15, 20, 25 and 30 \u00b0C. This range is not in the later performance workbook.",
    models: [
      {name:"DHP 20R",kw:{2:5.0,5:6.02,10:7.1875,15:8.0,20:9.1667,25:9.8333,30:10.5}},
      {name:"DHP 30R",kw:{2:7.8,5:8.82,10:10.25,15:11.5,20:13.2,25:14.2,30:15.2}},
      {name:"DHP 40R",kw:{2:11.0,5:12.2,10:13.9375,15:15.5,20:18.0,25:19.25,30:20.5}},
      {name:"DHP 50R",kw:{2:12.0,5:13.8,10:16.875,15:20.0,20:22.6667,25:23.0833,30:23.5}},
      {name:"DHP 603R",kw:{2:14.5,5:17.2,10:20.6875,15:23.5,20:25.3333,25:26.1667,30:27.0}},
    ]
  },
  {
    id: "Force-i Pro",
    name: "Force-i Pro",
    note: "Heating output is taken from the heat-up table at 2, 5, 10, 15, 20, 25 and 30 \u00b0C. This range is not in the later performance workbook.",
    models: [
      {name:"Force-i Pro 9",kw:{2:4.708,5:5.23,10:6.1,15:7.4,20:8.0667,25:8.7333,30:11.0}},
      {name:"Force-i Pro 12",kw:{2:6.4,5:7.0,10:8.0,15:9.7,20:10.6583,25:11.6167,30:14.0}},
      {name:"Force-i Pro 17",kw:{2:8.14,5:9.1,10:10.7,15:12.4,20:14.3167,25:16.2333,30:19.0}},
      {name:"Force-i Pro 19",kw:{2:10.56,5:12.0,10:14.4,15:15.4,20:17.1083,25:18.8167,30:21.0}},
      {name:"Force-i Pro 24",kw:{2:12.84,5:14.7,10:17.8,15:19.9,20:21.6917,25:23.4833,30:27.0}},
      {name:"Force-i Pro 28",kw:{2:15.184,5:17.29,10:20.8,15:23.3,20:25.3833,25:27.4667,30:30.0}},
    ]
  },
  {
    id: "CS",
    name: "CS",
    note: "Heating output is taken from the heat-up table at 2, 5, 10, 15, 20, 25 and 30 \u00b0C. This range is not in the later performance workbook.",
    models: [
      {name:"CS 38",kw:{2:22.0,5:23.8,10:26.875,15:30.0,20:34.4444,25:39.0,30:39.0}},
      {name:"CS 47",kw:{2:24.0,5:27.0,10:33.125,15:40.0,20:43.8889,25:50.0,30:50.0}},
      {name:"CS 57",kw:{2:29.0,5:33.2,10:40.5,15:48.0,20:53.0,25:60.0,30:60.0}},
      {name:"CS 95",kw:{2:47.0,5:56.0,10:68.75,15:80.0,20:88.3333,25:105.0,30:105.0}},
      {name:"CS 120",kw:{2:60.0,5:72.0,10:87.5,15:100.0,20:111.1111,25:142.0,30:142.0}},
      {name:"CS 145",kw:{2:65.0,5:80.0,10:101.25,15:120.0,20:133.8889,25:160.0,30:160.0}},
      {name:"CS 200-2",kw:{2:95.0,5:113.0,10:138.125,15:160.0,20:176.6667,25:218.0,30:218.0}},
    ]
  },
  {
    id: "CSi",
    name: "CSi",
    note: "Heating output is taken from the heat-up table at 2, 5, 10, 15, 20, 25 and 30 \u00b0C. This range is not in the later performance workbook.",
    models: [
      {name:"Csi-65",kw:{2:35.0,5:38.9375,10:45.5,15:50.0,20:55.3333,25:70.0,30:70.0}},
      {name:"CSi-130",kw:{2:69.3,5:77.625,10:91.5,15:100.0,20:109.5556,25:140.0,30:140.0}},
      {name:"CS-i-250",kw:{2:156.0,5:165.0,10:180.0,15:190.0,20:215.0,25:275.0,30:275.0}},
    ]
  },
];
root.SPA_RANGES = SPA_RANGES;
if (typeof module === "object" && module.exports) module.exports = SPA_RANGES;
})(typeof globalThis !== "undefined" ? globalThis : this);
