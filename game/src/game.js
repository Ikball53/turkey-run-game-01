/* Gobble Run — game loop, states, collisions, HUD and all screen drawing. */
const GobbleGame = (function buildGobbleGame() {
  const W = GOBBLE_CONFIG.canvasWidth;
  const H = GOBBLE_CONFIG.canvasHeight;
  const GY = GOBBLE_CONFIG.groundY;
  const P = GOBBLE_CONFIG.palette;

  let canvas = null;
  let ctx = null;
  let state = "title"; // title | playing | stageclear | caught | escaped
  let stateTime = 0;
  let time = 0;
  let runTime = 0;
  let stageIndex = 0;
  let stage = null;
  let rnd = Math.random;
  let turkey = null;
  let farmer = null;
  let decoy = null;
  let score = 0;
  let lives = GOBBLE_CONFIG.maxLives;
  let best = 0;
  let tools = { decoy: 2, burst: 3, hide: 2 };
  let particles = [];
  let banner = "";
  let bannerSub = "";
  let shake = 0;
  let startedAt = 0;

  function resetRun(seed) {
    stageIndex = 0;
    score = 0;
    lives = GOBBLE_CONFIG.maxLives;
    runTime = 0;
    tools = {
      decoy: GOBBLE_CONFIG.toolStartCounts.decoy,
      burst: GOBBLE_CONFIG.toolStartCounts.burst,
      hide: GOBBLE_CONFIG.toolStartCounts.hide,
    };
    particles = [];
    decoy = null;
    rnd = seed ? makeSeededRandom(seed) : Math.random;
    loadStage(0);
    startedAt = Date.now();
  }

  function loadStage(i) {
    stageIndex = i;
    stage = GobbleWorld.buildStage(i, 1234 + i * 97);
    turkey = {
      dist: 0, y: GY, vy: 0, onGround: true, dir: 1,
      dash: 0, dashCd: 0, invuln: 0, hidden: 0, hiddenUntil: 0,
      run: 0, moving: false, speedBoost: 0,
    };
    farmer = GobbleFarmer.createFarmer(i);
    farmer.x = 420 - 320; // farmer starts behind, in screen space
    farmer.dist = -320;
    banner = GOBBLE_CONFIG.stageNames[i];
    bannerSub = GOBBLE_CONFIG.stageSubtitles[i];
  }

  // Screen x of a world distance, with the turkey pinned near x=420.
  function screenX(dist) {
    return 420 + (dist - turkey.dist);
  }

  function startGame() {
    resetRun(0);
    state = "playing";
    stateTime = 0;
    GobbleAudio.ensureContext();
    GobbleAudio.startMusic();
    GobbleAudio.play("gobble");
  }

  function endCaught() {
    state = "caught";
    stateTime = 0;
    GobbleAudio.stopMusic();
    GobbleAudio.play("caught");
    if (score > best) best = score;
  }

  function endEscaped() {
    state = "escaped";
    stateTime = 0;
    score += GOBBLE_CONFIG.escapeBonus;
    GobbleAudio.stopMusic();
    GobbleAudio.play("escaped");
    if (score > best) best = score;
  }

  function hurtTurkey(source) {
    if (turkey.invuln > 0 || state !== "playing") return;
    lives -= 1;
    turkey.invuln = GOBBLE_CONFIG.invulnerableTime;
    turkey.dist = Math.max(0, turkey.dist - 70);
    farmer.dist = turkey.dist - 260;
    farmer.state = "patrol";
    farmer.stateTime = 0;
    shake = 10;
    GobbleAudio.play("hurt");
    burstFeathers(420, turkey.y - 30, 14);
    if (lives <= 0) endCaught();
  }

  function burstFeathers(x, y, n) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 260,
        vy: -40 - Math.random() * 160,
        life: 0.7 + Math.random() * 0.5,
        col: ["#f2b705", "#b3541e", "#7a4a21", "#fff"][i % 4],
      });
    }
  }

  function sparkle(x, y) {
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 180,
        vy: -20 - Math.random() * 120,
        life: 0.5,
        col: "#ffe9a8",
      });
    }
  }

  function useDecoy() {
    if (tools.decoy <= 0 || state !== "playing") return;
    tools.decoy -= 1;
    decoy = { dist: turkey.dist + 170, life: GOBBLE_CONFIG.decoyLife };
    GobbleAudio.play("decoy");
  }

  function useBurst() {
    if (tools.burst <= 0 || state !== "playing" || turkey.dashCd > 0) return;
    tools.burst -= 1;
    turkey.dash = GOBBLE_CONFIG.dashTime;
    turkey.dashCd = GOBBLE_CONFIG.dashCooldown;
    turkey.speedBoost = 1.4;
    GobbleAudio.play("dash");
    burstFeathers(420, turkey.y - 20, 8);
  }

  function useHide() {
    if (tools.hide <= 0 || state !== "playing") return;
    let near = null;
    for (const h of stage.haystacks) {
      if (Math.abs(h.dist - turkey.dist) < 110) { near = h; break; }
    }
    if (!near) return;
    tools.hide -= 1;
    turkey.hidden = GOBBLE_CONFIG.hideTime;
    farmer.state = "search";
    farmer.stateTime = 0;
    farmer.searchX = turkey.dist;
    GobbleAudio.play("hide");
  }

  function jump() {
    if (state === "playing" && turkey.onGround) {
      turkey.vy = -560;
      turkey.onGround = false;
      GobbleAudio.play("jump");
    }
  }

  function updatePlaying(dt) {
    runTime += dt;
    const ax = GobbleInput.axis();
    // Horizontal run: right pushes the escape forward, left falls back.
    let speed = GOBBLE_CONFIG.turkeySpeed;
    if (turkey.dash > 0) speed = GOBBLE_CONFIG.dashSpeed;
    if (turkey.speedBoost > 0) speed *= 1.25;
    turkey.moving = ax.x !== 0 || ax.y !== 0;
    if (ax.x > 0) {
      turkey.dist += speed * dt;
      turkey.dir = 1;
      score += Math.round(speed * dt * 0.12);
    } else if (ax.x < 0) {
      turkey.dist = Math.max(0, turkey.dist - speed * 0.6 * dt);
      turkey.dir = -1;
    } else {
      // Keep a slow waddle forward so the farmer keeps pressure on.
      turkey.dist += 26 * dt;
    }
    // Vertical: jump + gravity.
    if (!turkey.onGround) {
      turkey.vy += 1500 * dt;
      turkey.y += turkey.vy * dt;
      if (turkey.y >= GY) { turkey.y = GY; turkey.vy = 0; turkey.onGround = true; }
    }
    if (ax.y < 0) jump();
    turkey.run += dt * (turkey.moving ? 1 : 0.4);
    if (turkey.dash > 0) turkey.dash -= dt;
    if (turkey.dashCd > 0) turkey.dashCd -= dt;
    if (turkey.speedBoost > 0) turkey.speedBoost -= dt;
    if (turkey.invuln > 0) turkey.invuln -= dt;
    if (turkey.hidden > 0) turkey.hidden -= dt;

    // Fences block the run unless jumped.
    for (const f of stage.fences) {
      if (!f.passed && turkey.dist >= f.dist - 24 && turkey.dist < f.dist + 24) {
        if (turkey.y > GY - 64) {
          turkey.dist = f.dist - 24;
          turkey.speedBoost = 0;
        } else {
          f.passed = true;
          score += 25;
        }
      }
      if (turkey.dist > f.dist + 30) f.passed = true;
    }

    // Hot oven tiles burn feet on the ground.
    for (const t of stage.hotTiles) {
      if (turkey.dist > t.dist && turkey.dist < t.dist + t.width && turkey.onGround) {
        hurtTurkey("oven");
        turkey.vy = -420;
        turkey.onGround = false;
      }
    }

    GobbleWorld.updateStage(stage, dt, turkey.dist, rnd);

    // Knives: falling carving knives.
    for (const k of stage.knives) {
      const kx = screenX(k.dist);
      if (!k.done && Math.abs(kx - 420) < 42 && k.y > turkey.y - 90 && k.y < turkey.y + 30) {
        if (turkey.invuln <= 0) {
          k.done = true;
          hurtTurkey("knife");
        }
      }
      if (k.y > GY + 40 && !k.stuck) { k.stuck = true; GobbleAudio.play("knife"); }
    }
    // Rolling hay bales.
    for (const b of stage.bales) {
      const bx = screenX(b.dist);
      if (Math.abs(bx - 420) < 46 && turkey.onGround && turkey.y > GY - 50) {
        hurtTurkey("bale");
        b.dist = -9999;
      }
    }

    // Pickups.
    for (const p of stage.pickups) {
      if (p.taken) continue;
      const px = screenX(p.dist);
      const py = GY - 30 - p.lane * 120;
      if (Math.abs(px - 420) < 40 && Math.abs(py - (turkey.y - 30)) < 70) {
        p.taken = true;
        score += GOBBLE_CONFIG.pickupScore[p.kind];
        sparkle(px, py);
        GobbleAudio.play(p.kind === "corn" ? "pickup" : p.kind === "pie" ? "pie" : "feather");
      }
    }

    // Tools + dash input.
    if (GobbleInput.wasPressed("1")) useDecoy();
    if (GobbleInput.wasPressed("2")) useBurst();
    if (GobbleInput.wasPressed("3")) useHide();
    if (GobbleInput.wasPressed("shift")) useBurst();
    if (GobbleInput.wasPressed(" ")) jump();
    if (GobbleInput.wasPressed("m")) GobbleAudio.toggleMute();

    // Mouse: click a tool chip, else dash toward the click.
    const m = GobbleInput.mouse();
    if (GobbleInput.consumeClick()) {
      const chip = toolChipAt(m.x, m.y);
      if (chip === 1) useDecoy();
      else if (chip === 2) useBurst();
      else if (chip === 3) useHide();
      else if (m.x > 1188 && m.y > 10 && m.y < 40) GobbleAudio.toggleMute();
      else useBurst();
    }

    // Decoy lifetime.
    if (decoy) {
      decoy.life -= dt;
      if (decoy.life <= 0) decoy = null;
    }

    // Farmer AI.
    const farmerTarget = {
      x: 420 + (turkey.dist - turkey.dist),
      y: turkey.y,
      dist: turkey.dist,
    };
    const decoyTarget = decoy ? { dist: decoy.dist, x: screenX(decoy.dist), y: GY } : null;
    GobbleFarmer.updateFarmer(
      farmer, dt,
      { x: 420, y: turkey.y, dist: turkey.dist },
      stageIndex, turkey.hidden > 0, decoyTarget
    );
    // Farmer moves in distance space: chase the turkey's distance.
    const fdx = turkey.dist - farmer.dist;
    if (farmer.state === "chase") {
      farmer.dist += Math.sign(fdx) * farmer.speed * 1.05 * dt;
    } else if (farmer.state === "search") {
      farmer.dist += Math.sign(farmer.searchX - farmer.dist) * farmer.speed * 0.6 * dt;
    } else if (farmer.state === "patrol") {
      farmer.dist += farmer.dir * farmer.speed * 0.45 * dt;
      if (farmer.dist > turkey.dist - 60) farmer.dist = turkey.dist - 60;
      if (farmer.dist < turkey.dist - 700) farmer.dist = turkey.dist - 700;
    }
    farmer.x = screenX(farmer.dist);
    if (decoy && farmer.state === "chase") {
      const ddx = decoy.dist - farmer.dist;
      farmer.dist += Math.sign(ddx) * farmer.speed * 1.15 * dt;
      if (Math.abs(ddx) < 50) { decoy = null; GobbleAudio.play("gobble"); }
    }
    if (Math.abs(farmer.dist - turkey.dist) < 52 && Math.abs(farmer.y - turkey.y) < 90) {
      hurtTurkey("farmer");
    }

    // Gate: end of the stage.
    if (turkey.dist >= stage.goal) {
      score += 500;
      GobbleAudio.play("gate");
      if (stageIndex >= 2) {
        endEscaped();
      } else {
        state = "stageclear";
        stateTime = 0;
      }
    }

    // Particles.
    for (const pt of particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 300 * dt;
      pt.life -= dt;
    }
    particles = particles.filter(function (pt) { return pt.life > 0; });
    if (shake > 0) shake = Math.max(0, shake - dt * 30);
  }

  function toolChipAt(x, y) {
    if (y < 748 || y > 786) return 0;
    if (x >= 16 && x < 150) return 1;
    if (x >= 158 && x < 292) return 2;
    if (x >= 300 && x < 434) return 3;
    return 0;
  }

  function update(dt) {
    time += dt;
    stateTime += dt;
    if (state === "title") {
      if (GobbleInput.wasPressed("enter") || GobbleInput.takeAnyKey()) {
        // Any key starts, but ignore the mute toggle key.
        startGame();
      }
      if (GobbleInput.consumeClick()) startGame();
    } else if (state === "playing") {
      updatePlaying(dt);
    } else if (state === "stageclear") {
      if (stateTime > 1.8) {
        loadStage(stageIndex + 1);
        state = "playing";
        stateTime = 0;
      }
    } else if (state === "caught" || state === "escaped") {
      if (stateTime > 0.6 && (GobbleInput.wasPressed("enter") || GobbleInput.wasPressed("r"))) {
        startGame();
      }
      if (stateTime > 0.6 && GobbleInput.consumeClick()) startGame();
    }
    if (GobbleInput.wasPressed("m")) GobbleAudio.toggleMute();
    GobbleInput.endFrame();
  }

  /* ---------------- drawing ---------------- */

  function drawBackground() {
    GobbleArt.drawSky(ctx, W, H, stageIndex);
    GobbleArt.drawHills(ctx, W, GY);
    if (stageIndex === 0) GobbleArt.drawBarn(ctx, 1080, GY - 40, 1.0);
    if (stageIndex === 1) GobbleArt.drawBarn(ctx, 150, GY - 40, 0.9);
    GobbleArt.drawGround(ctx, W, H, GY, stageIndex, turkey.dist);
    for (const l of stage.leaves) {
      GobbleArt.drawLeaf(ctx, l.x, l.y, l.sway + time, l.col);
    }
  }

  function drawWorldObjects() {
    // Scenery props.
    for (const pr of stage.props) {
      const px = screenX(pr.dist) + pr.jitter * 0.4;
      if (px < -120 || px > W + 120) continue;
      if (pr.kind === "pumpkin") GobbleArt.drawPumpkin(ctx, px, GY + 108, pr.s);
      else if (pr.kind === "corn") GobbleArt.drawCornStalk(ctx, px, GY + 120, pr.s, 0.08);
      else if (pr.kind === "tree") GobbleArt.drawTree(ctx, px, GY + 40, pr.s);
      else if (pr.kind === "hay") GobbleArt.drawHaystack(ctx, px, GY + 130, pr.s * 0.8);
      else if (pr.kind === "pot") { GobbleArt.drawPumpkin(ctx, px, GY + 60, pr.s); }
      else if (pr.kind === "table") { GobbleArt.drawFence(ctx, px, GY + 40, 90); }
    }
    // Fences.
    for (const f of stage.fences) {
      const fx = screenX(f.dist);
      if (fx < -80 || fx > W + 80) continue;
      GobbleArt.drawFence(ctx, fx - 45, GY + 30, 90);
    }
    // Haystacks.
    for (const h of stage.haystacks) {
      const hx = screenX(h.dist);
      if (hx < -120 || hx > W + 120) continue;
      GobbleArt.drawHaystack(ctx, hx, GY + 130, 1.0);
    }
    // Ovens + hot tiles (kitchen).
    for (const o of stage.ovens) {
      const ox = screenX(o.dist);
      if (ox < -200 || ox > W + 200) continue;
      GobbleArt.drawOven(ctx, ox, GY + 130, 1.0, time + o.heat);
    }
    for (const t of stage.hotTiles) {
      const tx = screenX(t.dist);
      ctx.fillStyle = "rgba(255,123,28,0.55)";
      ctx.fillRect(tx, GY + 118, t.width, 12);
      ctx.fillStyle = "rgba(255,210,62,0.8)";
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(tx + 12 + i * 36, GY + 120, 14, 8);
      }
    }
    // Forest gate at the end of the stage.
    GobbleArt.drawGate(ctx, screenX(stage.goal), GY + 130, 1.0, turkey.dist > stage.goal - 260);
    // Pickups.
    for (const p of stage.pickups) {
      if (p.taken) continue;
      const px = screenX(p.dist);
      if (px < -40 || px > W + 40) continue;
      const py = GY - 30 - p.lane * 120;
      if (p.kind === "corn") GobbleArt.drawCorn(ctx, px, py, time);
      else if (p.kind === "pie") GobbleArt.drawPie(ctx, px, py, time);
      else GobbleArt.drawFeather(ctx, px, py, time);
    }
    // Falling knives.
    for (const k of stage.knives) {
      const kx = screenX(k.dist);
      if (kx < -60 || kx > W + 60) continue;
      // Telegraph shadow on the ground.
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(kx, GY + 128, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      GobbleArt.drawKnife(ctx, kx, Math.min(k.y, GY + 110), k.angle, 1.1);
    }
    // Rolling hay bales.
    for (const b of stage.bales) {
      const bx = screenX(b.dist);
      if (bx < -80 || bx > W + 80) continue;
      GobbleArt.drawHaystack(ctx, bx, b.y, 0.62);
    }
  }

  function drawHud() {
    ctx.save();
    ctx.textAlign = "left";
    ctx.font = "bold 15px Georgia, serif";
    ctx.fillStyle = "rgba(20,10,4,0.55)";
    ctx.fillRect(10, 10, 250, 64);
    ctx.fillStyle = "#ffe9a8";
    ctx.fillText("SCORE " + score, 20, 30);
    ctx.fillText("DIST " + Math.floor(turkey.dist) + "m", 20, 50);
    let hearts = "";
    for (let i = 0; i < GOBBLE_CONFIG.maxLives; i++) hearts += i < lives ? "♥ " : "♡ ";
    ctx.fillStyle = lives === 1 ? "#ff6b6b" : "#ff9db1";
    ctx.fillText(hearts, 150, 30);
    ctx.fillStyle = "#ffe9a8";
    ctx.font = "12px Georgia, serif";
    ctx.fillText(GOBBLE_CONFIG.stageNames[stageIndex], 20, 68);
    // Distance progress bar to the gate.
    ctx.fillStyle = "rgba(20,10,4,0.55)";
    ctx.fillRect(270, 16, 220, 12);
    ctx.fillStyle = "#7fae4c";
    ctx.fillRect(272, 18, Math.min(216, 216 * (turkey.dist / stage.goal)), 8);
    ctx.fillStyle = "#ffe9a8";
    ctx.font = "11px Georgia, serif";
    ctx.fillText("TO THE GATE", 272, 42);
    // Mute button, top right.
    ctx.fillStyle = "rgba(20,10,4,0.55)";
    ctx.fillRect(W - 92, 10, 82, 30);
    ctx.fillStyle = "#ffe9a8";
    ctx.font = "bold 13px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(GobbleAudio.isMuted() ? "MUTE ✕" : "SOUND ♪", W - 51, 30);
    ctx.textAlign = "left";
    // Tool chips, bottom left — small, clickable.
    const chips = [
      { n: 1, label: "1 DECOY ×" + tools.decoy },
      { n: 2, label: "2 BURST ×" + tools.burst },
      { n: 3, label: "3 HIDE ×" + tools.hide },
    ];
    chips.forEach(function (c, i) {
      const x = 16 + i * 142;
      ctx.fillStyle = "rgba(20,10,4,0.6)";
      ctx.fillRect(x, 748, 134, 38);
      ctx.fillStyle = tools[c.n === 1 ? "decoy" : c.n === 2 ? "burst" : "hide"] > 0 ? "#ffe9a8" : "#8a7a68";
      ctx.font = "bold 13px Georgia, serif";
      ctx.fillText(c.label, x + 10, 772);
    });
    // Stage banner, small, fades after a few seconds.
    if (stateTime < 4 && (state === "playing" || state === "stageclear")) {
      ctx.globalAlpha = Math.max(0, 1 - (stateTime - 2.5));
      ctx.fillStyle = "rgba(20,10,4,0.6)";
      ctx.fillRect(W / 2 - 260, 90, 520, 52);
      ctx.fillStyle = "#ffe9a8";
      ctx.font = "bold 17px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(banner, W / 2, 112);
      ctx.font = "12px Georgia, serif";
      ctx.fillText(bannerSub, W / 2, 132);
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;
    }
    // Farmer proximity warning.
    const gap = turkey.dist - farmer.dist;
    if (state === "playing" && gap < 260 && farmer.state === "chase") {
      ctx.fillStyle = "#ff5252";
      ctx.font = "bold 14px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("BRAM IS RIGHT BEHIND YOU — RUN!", W / 2, 170);
      ctx.textAlign = "left";
    }
    ctx.restore();
  }

  function drawTitle() {
    // Illustrated title scene: farm at dawn, big turkey, farmer far behind.
    GobbleArt.drawSky(ctx, W, H, 0);
    GobbleArt.drawHills(ctx, W, GY);
    GobbleArt.drawBarn(ctx, 1080, GY - 40, 1.1);
    GobbleArt.drawGround(ctx, W, H, GY, 0, 0);
    GobbleArt.drawFence(ctx, 60, GY + 30, 300);
    GobbleArt.drawFence(ctx, 920, GY + 30, 300);
    GobbleArt.drawPumpkin(ctx, 180, GY + 108, 1.2);
    GobbleArt.drawPumpkin(ctx, 1100, GY + 108, 1.0);
    GobbleArt.drawCornStalk(ctx, 90, GY + 120, 1.1, -0.06);
    GobbleArt.drawCornStalk(ctx, 1200, GY + 120, 1.0, 0.06);
    GobbleArt.drawHaystack(ctx, 980, GY + 130, 1.1);
    GobbleArt.drawTree(ctx, 1180, GY + 40, 1.1);
    GobbleArt.drawTree(ctx, 60, GY + 40, 0.9);
    GobbleArt.drawTurkey(ctx, 640, GY, { dir: 1, run: time, moving: true });
    GobbleArt.drawFarmer(ctx, 250, GY, { dir: 1, run: time, state: "patrol" });
    GobbleArt.drawKnife(ctx, 880, 300 + Math.sin(time * 2) * 12, 0.4, 1.2);
    // Title card.
    ctx.fillStyle = "rgba(20,10,4,0.62)";
    ctx.fillRect(W / 2 - 380, 96, 760, 280);
    ctx.strokeStyle = "#f2b705";
    ctx.lineWidth = 3;
    ctx.strokeRect(W / 2 - 380, 96, 760, 280);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f2b705";
    ctx.font = "bold 64px Georgia, serif";
    ctx.fillText("GOBBLE RUN", W / 2, 168);
    ctx.fillStyle = "#ffe9a8";
    ctx.font = "italic 24px Georgia, serif";
    ctx.fillText("The Great Thanksgiving Escape", W / 2, 206);
    ctx.font = "15px Georgia, serif";
    ctx.fillStyle = "#fff";
    ctx.fillText("Thanksgiving is tomorrow. Farmer Bram has the oven on", W / 2, 246);
    ctx.fillText("and the carving knife out. Pip the turkey is NOT dinner.", W / 2, 268);
    ctx.fillStyle = "#ffe9a8";
    ctx.font = "bold 15px Georgia, serif";
    ctx.fillText("Run the farmyard, the barn and the kitchen — reach the forest gate!", W / 2, 300);
    ctx.fillStyle = "#fff";
    ctx.font = "14px Georgia, serif";
    ctx.fillText("Move: WASD / Arrows  ·  Jump: Space  ·  Dash: Click / Shift", W / 2, 330);
    ctx.fillText("Tools: 1 Decoy  ·  2 Burst  ·  3 Hide in hay  ·  M Mute", W / 2, 352);
    ctx.fillStyle = "#f2b705";
    ctx.font = "bold 18px Georgia, serif";
    ctx.fillText("— PRESS ENTER OR CLICK TO RUN —", W / 2, 396);
    if (best > 0) {
      ctx.fillStyle = "#ffe9a8";
      ctx.font = "14px Georgia, serif";
      ctx.fillText("Best score this visit: " + best, W / 2, 424);
    }
    ctx.textAlign = "left";
  }

  function drawEnd(escaped) {
    // Keep the world visible behind a dim veil, then the end card.
    ctx.fillStyle = "rgba(20,10,4,0.55)";
    ctx.fillRect(0, 0, W, H);
    if (escaped) {
      GobbleArt.drawTree(ctx, 300, GY + 40, 1.3);
      GobbleArt.drawTree(ctx, 980, GY + 40, 1.2);
      GobbleArt.drawTurkey(ctx, 640, GY, { dir: 1, run: time, moving: true });
      GobbleArt.drawFeather(ctx, 560, 420, time);
      GobbleArt.drawFeather(ctx, 720, 400, time);
    } else {
      GobbleArt.drawFarmer(ctx, 700, GY, { dir: -1, run: time, state: "chase" });
      GobbleArt.drawTurkey(ctx, 560, GY, { dir: -1, run: time, moving: false });
    }
    ctx.fillStyle = "rgba(20,10,4,0.7)";
    ctx.fillRect(W / 2 - 360, 110, 720, 250);
    ctx.strokeStyle = escaped ? "#7fae4c" : "#d7263d";
    ctx.lineWidth = 3;
    ctx.strokeRect(W / 2 - 360, 110, 720, 250);
    ctx.textAlign = "center";
    ctx.fillStyle = escaped ? "#a8d86e" : "#ff6b6b";
    ctx.font = "bold 56px Georgia, serif";
    ctx.fillText(escaped ? "ESCAPED!" : "CAUGHT!", W / 2, 178);
    ctx.fillStyle = "#ffe9a8";
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText(
      escaped ? "Pip slips into the forest, free as a bird. Literally." : "Bram grabs Pip by the drumstick. The oven was already warm.",
      W / 2, 214
    );
    ctx.fillStyle = "#fff";
    ctx.font = "16px Georgia, serif";
    ctx.fillText("Score: " + score + "   ·   Distance: " + Math.floor(turkey.dist) + "m   ·   Time: " + runTime.toFixed(1) + "s", W / 2, 252);
    ctx.fillText("Best this visit: " + best, W / 2, 280);
    ctx.fillStyle = "#f2b705";
    ctx.font = "bold 17px Georgia, serif";
    ctx.fillText("— PRESS ENTER OR CLICK TO RUN AGAIN —", W / 2, 322);
    ctx.textAlign = "left";
  }

  function drawStageClear() {
    ctx.fillStyle = "rgba(20,10,4,0.5)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f2b705";
    ctx.font = "bold 48px Georgia, serif";
    ctx.fillText("STAGE CLEAR!", W / 2, 330);
    ctx.fillStyle = "#fff";
    ctx.font = "18px Georgia, serif";
    ctx.fillText("Pip slips through the gate — but Bram is not giving up.", W / 2, 372);
    ctx.fillText("Next: " + GOBBLE_CONFIG.stageNames[stageIndex + 1], W / 2, 402);
    ctx.fillStyle = "#ffe9a8";
    ctx.font = "16px Georgia, serif";
    ctx.fillText("Score: " + score + "  ·  +500 gate bonus", W / 2, 440);
    ctx.textAlign = "left";
  }

  function render() {
    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    if (state === "title") {
      drawTitle();
    } else {
      drawBackground();
      drawWorldObjects();
      // Decoy turkey.
      if (decoy) GobbleArt.drawDecoy(ctx, screenX(decoy.dist), GY, time);
      // On the end screens drawEnd() stages its own farmer + turkey, so the
      // world pair is hidden there — otherwise each appears twice.
      const onEndScreen = state === "caught" || state === "escaped";
      if (!onEndScreen) {
        // Farmer.
        GobbleArt.drawFarmer(ctx, farmer.x, GY, { dir: farmer.dir, run: farmer.run, state: farmer.state });
        // Turkey (blink while invulnerable).
        if (!(turkey.invuln > 0 && Math.floor(time * 12) % 2 === 0)) {
          GobbleArt.drawTurkey(ctx, 420, turkey.y, {
            dir: turkey.dir, run: turkey.run, moving: turkey.moving,
            hidden: turkey.hidden > 0, dash: turkey.dash > 0,
          });
        }
      }
      // Particles.
      for (const pt of particles) {
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.col;
        ctx.fillRect(pt.x - 3, pt.y - 3, 6, 6);
      }
      ctx.globalAlpha = 1;
      drawHud();
      if (state === "stageclear") drawStageClear();
      if (state === "caught") drawEnd(false);
      if (state === "escaped") drawEnd(true);
    }
    ctx.restore();
  }

  let lastTs = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function init() {
    canvas = document.getElementById("game");
    ctx = canvas.getContext("2d");
    GobbleInput.attach(canvas);
    resetRun(0);
    state = "title";
    stateTime = 0;
    requestAnimationFrame(frame);
  }

  function getState() {
    return {
      state: state, score: score, lives: lives, stage: stageIndex,
      dist: Math.floor(turkey ? turkey.dist : 0),
      farmerState: farmer ? farmer.state : "?",
      farmerGap: turkey && farmer ? Math.floor(turkey.dist - farmer.dist) : 0,
      tools: tools, time: runTime,
    };
  }

  // Test hooks used by shots.js (screenshot staging + self-test).
  function forceState(s) {
    if (s === "play") {
      resetRun(42);
      state = "playing";
      stateTime = 0;
      turkey.dist = 950;
      turkey.invuln = 0;
      score = 1250;
      lives = GOBBLE_CONFIG.maxLives;
      farmer.dist = turkey.dist - 320;
      farmer.state = "chase";
      stage.knifeTimer = 0.1;
    } else if (s === "escaped") {
      resetRun(42);
      loadStage(2);
      state = "escaped";
      stateTime = 2;
      score = 4860;
      best = score;
      turkey.dist = 1800;
      runTime = 74.3;
    } else if (s === "caught") {
      resetRun(42);
      state = "caught";
      stateTime = 2;
      score = 1430;
      best = score;
      lives = 0;
      turkey.dist = 812;
      farmer.dist = 800;
      farmer.state = "chase";
      runTime = 41.2;
    } else if (s === "title") {
      resetRun(0);
      state = "title";
      stateTime = 2;
    }
  }

  return {
    init: init, getState: getState, forceState: forceState,
    startGame: startGame, useDecoy: useDecoy, useBurst: useBurst, useHide: useHide,
  };
})();
