/* Gobble Run — Farmer Bram's chase AI: patrol, suspicion, chase, search. */
const GobbleFarmer = (function buildGobbleFarmer() {
  function createFarmer(stageIndex) {
    return {
      x: 150,
      y: GOBBLE_CONFIG.groundY,
      dir: 1,
      run: 0,
      state: "patrol",
      stateTime: 0,
      patrolTarget: 420,
      speed: GOBBLE_CONFIG.farmerSpeed[stageIndex],
      spottedAt: 0,
      searchX: 0,
    };
  }

  function spotDistance(stageIndex) {
    return [420, 460, 500][stageIndex];
  }

  function updateFarmer(farmer, dt, turkey, stageIndex, hidden, decoy) {
    farmer.stateTime += dt;
    farmer.run += dt;
    const target = decoy || turkey;
    const dx = target.x - farmer.x;
    const adx = Math.abs(dx);
    const dy = Math.abs(target.y - farmer.y);
    const canSee = !hidden && adx < spotDistance(stageIndex) && dy < 130;

    if (farmer.state === "patrol") {
      farmer.x += farmer.dir * farmer.speed * 0.45 * dt;
      if (farmer.x > farmer.patrolTarget) farmer.dir = -1;
      if (farmer.x < 90) farmer.dir = 1;
      if (farmer.stateTime > 2.5 && Math.random() < 0.01) {
        farmer.dir = -farmer.dir;
        farmer.stateTime = 0;
      }
      if (canSee) {
        farmer.state = "suspicious";
        farmer.stateTime = 0;
        GobbleAudio.play("spotted");
      }
    } else if (farmer.state === "suspicious") {
      // He squints, turns toward the rustle, then commits.
      farmer.dir = dx >= 0 ? 1 : -1;
      if (farmer.stateTime > 0.7) {
        farmer.state = "chase";
        farmer.stateTime = 0;
        farmer.spottedAt = farmer.x;
      }
      if (!canSee && farmer.stateTime > 1.4) {
        farmer.state = "patrol";
        farmer.stateTime = 0;
      }
    } else if (farmer.state === "chase") {
      farmer.dir = dx >= 0 ? 1 : -1;
      const chaseSpeed = farmer.speed * (decoy ? 1.15 : 1.0);
      farmer.x += farmer.dir * chaseSpeed * dt;
      if (!canSee) {
        // Lost the trail: search where the turkey was last seen.
        farmer.state = "search";
        farmer.stateTime = 0;
        farmer.searchX = target.x;
      }
    } else if (farmer.state === "search") {
      const sdx = farmer.searchX - farmer.x;
      farmer.dir = sdx >= 0 ? 1 : -1;
      farmer.x += farmer.dir * farmer.speed * 0.6 * dt;
      if (Math.abs(sdx) < 24 || farmer.stateTime > 4) {
        farmer.state = "patrol";
        farmer.stateTime = 0;
        farmer.patrolTarget = 200 + Math.random() * 500;
      }
      if (canSee) {
        farmer.state = "suspicious";
        farmer.stateTime = 0;
        GobbleAudio.play("spotted");
      }
    }
    farmer.x = Math.max(40, Math.min(1240, farmer.x));
  }

  function farmerCatches(farmer, turkey) {
    return Math.abs(farmer.x - turkey.x) < 52 && Math.abs(farmer.y - turkey.y) < 70;
  }

  return {
    createFarmer: createFarmer,
    updateFarmer: updateFarmer,
    farmerCatches: farmerCatches,
  };
})();
