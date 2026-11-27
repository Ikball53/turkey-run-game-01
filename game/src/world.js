/* Gobble Run — stage layouts: fences, hay bales, ovens, knives, pickups. */
const GobbleWorld = (function buildGobbleWorld() {
  function buildStage(stageIndex, seed) {
    const rnd = makeSeededRandom(seed + stageIndex * 7919);
    const goal = GOBBLE_CONFIG.stageGoalDistance[stageIndex];
    const stage = {
      index: stageIndex,
      goal: goal,
      fences: [],
      haystacks: [],
      ovens: [],
      hotTiles: [],
      knives: [],
      bales: [],
      pickups: [],
      leaves: [],
      props: [],
      knifeTimer: 1.2,
      baleTimer: 2.0,
      elapsed: 0,
    };
    // Static scenery props along the run, kept apart so they never pile up
    // into one unreadable clump on screen.
    const propCount = stageIndex === 2 ? 4 : 8;
    let lastDist = -200;
    for (let i = 0; i < propCount; i++) {
      let d = 120 + rnd() * (goal - 240);
      if (d - lastDist < 150) d = lastDist + 150 + rnd() * 60;
      if (d > goal - 120) break;
      lastDist = d;
      const kind = stageIndex === 2
        ? (rnd() < 0.5 ? "pot" : "table")
        : (rnd() < 0.3 ? "pumpkin" : rnd() < 0.55 ? "corn" : rnd() < 0.8 ? "tree" : "hay");
      stage.props.push({ dist: d, kind: kind, jitter: rnd() * 120 - 60, s: 0.7 + rnd() * 0.25 });
    }
    // Fences to jump over (farmyard + barn).
    if (stageIndex < 2) {
      const n = 5 + stageIndex * 2;
      for (let i = 0; i < n; i++) {
        stage.fences.push({ dist: 260 + i * ((goal - 400) / n) + rnd() * 60, passed: false });
      }
    }
    // Haystacks: hide spots and cover.
    const hayN = stageIndex === 2 ? 2 : 4 + stageIndex;
    for (let i = 0; i < hayN; i++) {
      stage.haystacks.push({ dist: 320 + rnd() * (goal - 480), used: false });
    }
    // Kitchen: ovens with hot floor tiles in front of them.
    if (stageIndex === 2) {
      for (let i = 0; i < 3; i++) {
        const d = 420 + i * 480 + rnd() * 80;
        stage.ovens.push({ dist: d, heat: rnd() * 6 });
        stage.hotTiles.push({ dist: d - 90, width: 190 });
      }
    }
    // Pickups scattered along the run.
    for (let i = 0; i < 16; i++) {
      const r = rnd();
      const kind = r < 0.6 ? "corn" : r < 0.85 ? "pie" : "feather";
      stage.pickups.push({
        dist: 180 + rnd() * (goal - 300),
        lane: 0.55 + rnd() * 0.35,
        kind: kind,
        taken: false,
      });
    }
    // Falling leaves for atmosphere.
    for (let i = 0; i < 26; i++) {
      stage.leaves.push({
        x: rnd() * 1280,
        y: rnd() * 500,
        speed: 22 + rnd() * 30,
        sway: rnd() * 6.28,
        col: ["#e8641b", "#f2b705", "#c96a1e", "#a63a2e"][i % 4],
      });
    }
    return stage;
  }

  function spawnKnife(stage, rnd) {
    stage.knives.push({
      dist: 500 + rnd() * 900,
      lane: 0.35 + rnd() * 0.55,
      y: -40,
      vy: 340 + rnd() * 160,
      angle: (rnd() - 0.5) * 0.9,
      spin: (rnd() - 0.5) * 3,
      done: false,
    });
  }

  function spawnBale(stage, rnd) {
    stage.bales.push({ dist: stage.goal + 260, x: 1320, y: GOBBLE_CONFIG.groundY + 96, vx: -(150 + rnd() * 90), r: 30 });
  }

  function updateStage(stage, dt, distance, rnd) {
    stage.elapsed += dt;
    // Falling carving knives, telegraphed by a whistle.
    stage.knifeTimer -= dt;
    if (stage.knifeTimer <= 0) {
      spawnKnife(stage, rnd);
      stage.knifeTimer = GOBBLE_CONFIG.knifeFallInterval[stage.index] * (0.8 + rnd() * 0.5);
    }
    // Rolling hay bales from the right in stages 1-2.
    if (stage.index < 2) {
      stage.baleTimer -= dt;
      if (stage.baleTimer <= 0) {
        spawnBale(stage, rnd);
        stage.baleTimer = GOBBLE_CONFIG.hayBaleInterval[stage.index] * (0.8 + rnd() * 0.5);
      }
    }
    for (const k of stage.knives) {
      k.y += k.vy * dt;
      k.angle += k.spin * dt;
      if (k.y > GOBBLE_CONFIG.groundY + 120) k.done = true;
    }
    stage.knives = stage.knives.filter(function (k) { return !k.done; });
    for (const b of stage.bales) b.x += b.vx * dt;
    stage.bales = stage.bales.filter(function (b) { return b.x > -80; });
    for (const l of stage.leaves) {
      l.y += l.speed * dt;
      l.x += Math.sin(stage.elapsed * 2 + l.sway) * 18 * dt;
      if (l.y > 700) { l.y = -10; l.x = Math.random() * 1280; }
    }
  }

  // Convert a run distance into a screen x for world objects.
  function distToScreenX(dist, distance, turkeyScreenX) {
    return turkeyScreenX + (dist - distance) * 1.0;
  }

  return {
    buildStage: buildStage,
    spawnKnife: spawnKnife,
    spawnBale: spawnBale,
    updateStage: updateStage,
    distToScreenX: distToScreenX,
  };
})();
