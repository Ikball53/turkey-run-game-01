/* Gobble Run — tuning, stages and shared constants. */
const GOBBLE_CONFIG = {
  canvasWidth: 1280,
  canvasHeight: 800,
  groundY: 668,
  turkeyRadius: 26,
  farmerRadius: 30,
  turkeySpeed: 300,
  dashSpeed: 620,
  dashTime: 0.22,
  dashCooldown: 1.1,
  maxLives: 3,
  invulnerableTime: 1.6,
  // A run is won by crossing the forest gate at the end of stage 3.
  stageGoalDistance: [1400, 1600, 1800],
  stageNames: ["1 · THE FARMYARD", "2 · THE BARN", "3 · THE KITCHEN"],
  stageSubtitles: [
    "Dawn breaks. Farmer Bram is already up — and the oven is warming.",
    "Sneak past the hay bales. The barn door is the only way through.",
    "The kitchen! Dodge the oven and the carving knife. The forest gate is close.",
  ],
  farmerSpeed: [118, 148, 178],
  knifeFallInterval: [2.4, 1.9, 1.45],
  hayBaleInterval: [3.2, 2.4, 2.0],
  // Tools: decoy gobble, feather-burst dash, haystack hide.
  toolStartCounts: { decoy: 2, burst: 3, hide: 2 },
  hideTime: 3.0,
  decoyLife: 4.0,
  pickupScore: { corn: 100, pie: 250, feather: 500 },
  escapeBonus: 2000,
  // Autumn palette shared by every drawing routine.
  palette: {
    skyTop: "#f7b267",
    skyMid: "#f4845f",
    skyLow: "#e3645a",
    grass: "#7fae4c",
    grassDark: "#5d8a38",
    dirt: "#b5763a",
    dirtDark: "#8f5a26",
    barnRed: "#a63a2e",
    barnDark: "#7e2a20",
    wood: "#8a5a2b",
    woodLight: "#b07a3e",
    hay: "#e8c15a",
    hayDark: "#c9a13a",
    turkeyBrown: "#7a4a21",
    turkeyLight: "#a06a35",
    turkeyDark: "#54330f",
    featherGold: "#f2b705",
    wattle: "#d7263d",
    farmerShirt: "#3f6fb5",
    farmerOveralls: "#2e4a6b",
    farmerSkin: "#f2c89b",
    farmerHat: "#6b4a1f",
    ovenSteel: "#9aa3ad",
    ovenFire: "#ff7b1c",
    knifeSteel: "#dfe6ec",
  },
};

/* Stage flavour lines shown on the tiny stage banner. */
const GOBBLE_STAGE_TIPS = [
  "Tip: grab corn, jump the fences, never let Bram get close.",
  "Tip: haystacks hide you. Press 3 near one to vanish.",
  "Tip: the oven floor burns — hop the hot tiles, mind the knives.",
];

/* Tiny deterministic RNG so screenshot staging is reproducible. */
function makeSeededRandom(seed) {
  let s = seed >>> 0;
  return function seededRandom() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
