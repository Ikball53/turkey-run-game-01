/* Gobble Run — every sprite is drawn fresh in code. No image files. */
const GobbleArt = (function buildGobbleArt() {
  const P = GOBBLE_CONFIG.palette;

  function circle(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function ellipse(ctx, x, y, rx, ry, fill) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawSky(ctx, w, h, stage) {
    // Fill the whole canvas: the hills only reach partway up, and any gap
    // would show the dark page background through the canvas.
    const g = ctx.createLinearGradient(0, 0, 0, h);
    if (stage === 2) {
      g.addColorStop(0, "#8a5a3a");
      g.addColorStop(0.6, "#c97b4a");
      g.addColorStop(1, "#a86438");
    } else {
      g.addColorStop(0, P.skyTop);
      g.addColorStop(0.45, P.skyMid);
      g.addColorStop(0.8, P.skyLow);
      g.addColorStop(1, "#d95f52");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Low autumn sun.
    circle(ctx, w - 170, 110, 46, "#ffe9a8");
    circle(ctx, w - 170, 110, 60, "rgba(255,233,168,0.25)");
    // Drifting clouds.
    ctx.fillStyle = "rgba(255,244,220,0.85)";
    ellipse(ctx, 210, 90, 70, 20, "rgba(255,244,220,0.85)");
    ellipse(ctx, 260, 78, 52, 18, "rgba(255,244,220,0.85)");
    ellipse(ctx, 760, 60, 60, 16, "rgba(255,244,220,0.7)");
  }

  function drawHills(ctx, w, groundY) {
    ctx.fillStyle = "#6d8f3e";
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.quadraticCurveTo(320, groundY - 120, 640, groundY - 30);
    ctx.quadraticCurveTo(960, groundY - 110, 1280, groundY - 20);
    ctx.lineTo(1280, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#57732f";
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.quadraticCurveTo(420, groundY - 70, 900, groundY - 18);
    ctx.quadraticCurveTo(1120, groundY - 50, 1280, groundY - 8);
    ctx.lineTo(1280, groundY);
    ctx.closePath();
    ctx.fill();
  }

  function drawGround(ctx, w, h, groundY, stage, scrollX) {
    if (stage === 2) {
      // Kitchen: checkered floor.
      ctx.fillStyle = "#d9c9a8";
      ctx.fillRect(0, groundY - 260, w, h - groundY + 260);
      ctx.fillStyle = "#b89a6e";
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 16; c++) {
          if ((r + c) % 2 === 0) ctx.fillRect(c * 80, groundY - 260 + r * 80, 80, 80);
        }
      }
      ctx.fillStyle = "#7a5a34";
      ctx.fillRect(0, groundY - 260, w, 10);
      return;
    }
    const g = ctx.createLinearGradient(0, groundY - 40, 0, h);
    g.addColorStop(0, P.grass);
    g.addColorStop(0.35, P.grassDark);
    g.addColorStop(0.36, P.dirt);
    g.addColorStop(1, P.dirtDark);
    ctx.fillStyle = g;
    ctx.fillRect(0, groundY - 40, w, h - groundY + 40);
    // Dirt path with pebbles scrolling past.
    ctx.fillStyle = "#c98d4e";
    ctx.fillRect(0, groundY + 60, w, 90);
    ctx.fillStyle = "#a86f36";
    for (let i = 0; i < 24; i++) {
      const px = ((i * 173 - scrollX * 0.6) % (w + 80) + w + 80) % (w + 80) - 40;
      ellipse(ctx, px, groundY + 78 + (i % 3) * 26, 9, 5, "#a86f36");
    }
  }

  function drawBarn(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = P.barnRed;
    ctx.fillRect(-90, -70, 180, 130);
    ctx.beginPath();
    ctx.moveTo(-100, -70);
    ctx.lineTo(0, -130);
    ctx.lineTo(100, -70);
    ctx.closePath();
    ctx.fillStyle = P.barnDark;
    ctx.fill();
    ctx.fillStyle = "#5e1f16";
    ctx.fillRect(-100, -70, 200, 8);
    ctx.fillStyle = "#f5e6c8";
    ctx.fillRect(-34, 10, 68, 50);
    ctx.strokeStyle = "#5e1f16";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-34, 10); ctx.lineTo(34, 60);
    ctx.moveTo(34, 10); ctx.lineTo(-34, 60);
    ctx.stroke();
    ctx.fillStyle = "#ffe9a8";
    ctx.fillRect(-58, -46, 26, 22);
    ctx.fillRect(32, -46, 26, 22);
    ctx.restore();
  }

  function drawFence(ctx, x, y, w) {
    ctx.fillStyle = P.wood;
    for (let px = x; px < x + w; px += 64) {
      ctx.fillRect(px, y - 34, 8, 44);
    }
    ctx.fillStyle = P.woodLight;
    ctx.fillRect(x, y - 30, w, 7);
    ctx.fillRect(x, y - 14, w, 7);
  }

  function drawPumpkin(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "#e8641b";
    ellipse(ctx, 0, 0, 26, 21, "#e8641b");
    ellipse(ctx, -12, 0, 12, 20, "#d65410");
    ellipse(ctx, 12, 0, 12, 20, "#f07a2e");
    ctx.strokeStyle = "#7a3a08";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.quadraticCurveTo(4, -30, 10, -30);
    ctx.stroke();
    ctx.restore();
  }

  function drawCornStalk(ctx, x, y, s, lean) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean || 0);
    ctx.scale(s, s);
    ctx.strokeStyle = "#4e7a2a";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -90);
    ctx.stroke();
    ctx.fillStyle = "#5d8a38";
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.quadraticCurveTo(-34, -44, -40, -78);
    ctx.quadraticCurveTo(-10, -66, 0, -44);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.quadraticCurveTo(34, -64, 40, -96);
    ctx.quadraticCurveTo(10, -84, 0, -62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f2c14e";
    ellipse(ctx, 6, -52, 8, 20, "#f2c14e");
    ctx.restore();
  }

  function drawHaystack(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = P.hayDark;
    ctx.beginPath();
    ctx.moveTo(-52, 0);
    ctx.quadraticCurveTo(-40, -58, 0, -62);
    ctx.quadraticCurveTo(40, -58, 52, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.hay;
    ctx.beginPath();
    ctx.moveTo(-46, 0);
    ctx.quadraticCurveTo(-36, -50, 0, -54);
    ctx.quadraticCurveTo(36, -50, 46, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#a8842a";
    ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 12, -8);
      ctx.quadraticCurveTo(i * 14, -30, i * 10, -48);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTree(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(-7, -70, 14, 70);
    ctx.fillStyle = "#c96a1e";
    circle(ctx, -26, -84, 26, "#c96a1e");
    circle(ctx, 24, -88, 28, "#d97a24");
    circle(ctx, 0, -108, 30, "#e08a2e");
    ctx.fillStyle = "#f2b705";
    circle(ctx, -14, -96, 8, "#f2b705");
    circle(ctx, 18, -104, 7, "#f2b705");
    ctx.restore();
  }

  function drawOven(ctx, x, y, s, heat) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = P.ovenSteel;
    ctx.fillRect(-70, -150, 140, 150);
    ctx.fillStyle = "#7c858f";
    ctx.fillRect(-70, -150, 140, 14);
    ctx.fillStyle = "#1c1c22";
    ctx.fillRect(-52, -104, 104, 84);
    const flick = 0.75 + 0.25 * Math.sin(heat * 9);
    ctx.fillStyle = P.ovenFire;
    ctx.globalAlpha = flick;
    ctx.beginPath();
    ctx.moveTo(-46, -24);
    ctx.quadraticCurveTo(-30, -70, -8, -44);
    ctx.quadraticCurveTo(6, -78, 20, -46);
    ctx.quadraticCurveTo(38, -70, 46, -24);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffd23e";
    ellipse(ctx, 0, -30, 26, 10, "#ffd23e");
    ctx.fillStyle = "#5a636d";
    for (let i = 0; i < 4; i++) circle(ctx, -48 + i * 32, -132, 7, "#5a636d");
    ctx.fillStyle = "#e8eef2";
    ctx.fillRect(-70, -160, 140, 10);
    ctx.restore();
  }

  function drawKnife(ctx, x, y, angle, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(s, s);
    ctx.fillStyle = P.knifeSteel;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(12, -10, 10, 14);
    ctx.lineTo(-10, 14);
    ctx.quadraticCurveTo(-12, -10, 0, -34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#9aa3ad";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(0, 12);
    ctx.stroke();
    ctx.fillStyle = "#4a2c14";
    ctx.fillRect(-8, 14, 16, 16);
    ctx.restore();
  }

  function drawTurkey(ctx, x, y, opts) {
    const o = opts || {};
    const dir = o.dir || 1;
    const run = o.run || 0;
    const hidden = !!o.hidden;
    const dash = !!o.dash;
    const bob = Math.sin(run * 14) * (o.moving ? 3 : 0);
    ctx.save();
    ctx.translate(x, y - bob);
    ctx.scale(dir, 1);
    ctx.globalAlpha = hidden ? 0.35 : 1;
    // Fanned tail feathers.
    const tailCols = ["#b3541e", "#d97a24", "#f2b705", "#a63a2e", "#7a4a21"];
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.rotate(i * 0.42 - Math.PI / 2 + Math.PI / 2 + (i * 0.42));
      ctx.rotate(0);
      ctx.restore();
      const ang = -Math.PI / 2 + i * 0.38;
      const tx = Math.cos(ang) * 30;
      const ty = Math.sin(ang) * 30 - 6;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(ang + Math.PI / 2);
      ellipse(ctx, 0, 0, 9, 20, tailCols[i + 2]);
      circle(ctx, 0, -14, 4, "#f2e6c8");
      ctx.restore();
    }
    // Body.
    ellipse(ctx, 0, -8, 26, 30, P.turkeyBrown);
    ellipse(ctx, -6, -14, 16, 18, P.turkeyLight);
    // Wing.
    ctx.save();
    ctx.rotate(dash ? -0.9 : Math.sin(run * 14) * 0.25 - 0.2);
    ellipse(ctx, -6, -10, 16, 10, P.turkeyDark);
    ctx.restore();
    // Head + beak + wattle.
    circle(ctx, 16, -42, 13, P.turkeyLight);
    ctx.fillStyle = "#f2b705";
    ctx.beginPath();
    ctx.moveTo(26, -44);
    ctx.lineTo(38, -40);
    ctx.lineTo(26, -37);
    ctx.closePath();
    ctx.fill();
    ellipse(ctx, 24, -32, 5, 9, P.wattle);
    circle(ctx, 19, -46, 2.5, "#1c1c22");
    // Snood.
    ctx.strokeStyle = P.wattle;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24, -50);
    ctx.quadraticCurveTo(28, -56, 24, -60);
    ctx.stroke();
    // Legs.
    ctx.strokeStyle = "#e8a33d";
    ctx.lineWidth = 4;
    const step = Math.sin(run * 14) * 8;
    ctx.beginPath();
    ctx.moveTo(-8, 20); ctx.lineTo(-8 + step, 34);
    ctx.moveTo(8, 20); ctx.lineTo(8 - step, 34);
    ctx.stroke();
    ctx.restore();
  }

  function drawFarmer(ctx, x, y, opts) {
    const o = opts || {};
    const dir = o.dir || 1;
    const run = o.run || 0;
    const state = o.state || "patrol";
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    const bob = Math.sin(run * 12) * 2;
    ctx.translate(0, -bob);
    // Legs + overalls.
    ctx.fillStyle = P.farmerOveralls;
    const step = Math.sin(run * 12) * 9;
    ctx.fillRect(-14, -34, 12, 34 + (step > 0 ? 4 : 0));
    ctx.fillRect(2, -34, 12, 34 + (step < 0 ? 4 : 0));
    ctx.fillStyle = "#2e4a6b";
    ctx.fillRect(-15, -58, 30, 28);
    // Shirt + arms reaching forward.
    ctx.fillStyle = P.farmerShirt;
    ctx.fillRect(-17, -88, 34, 34);
    ctx.save();
    ctx.rotate(0.5);
    ctx.fillStyle = P.farmerShirt;
    ctx.fillRect(8, -84, 26, 10);
    ctx.restore();
    ctx.fillStyle = P.farmerSkin;
    circle(ctx, 32, -76, 6, P.farmerSkin);
    // Head.
    circle(ctx, 0, -104, 15, P.farmerSkin);
    circle(ctx, -5, -102, 3, "#1c1c22");
    // Angry brows when chasing.
    ctx.strokeStyle = "#3a2410";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (state === "chase") { ctx.moveTo(-10, -110); ctx.lineTo(0, -106); }
    else { ctx.moveTo(-10, -108); ctx.lineTo(0, -110); }
    ctx.stroke();
    // Moustache.
    ctx.fillStyle = "#e8e0d0";
    ellipse(ctx, 0, -96, 9, 4, "#e8e0d0");
    // Straw hat.
    ctx.fillStyle = P.farmerHat;
    ellipse(ctx, 0, -114, 24, 6, P.farmerHat);
    ctx.fillStyle = "#8a6a2f";
    ctx.beginPath();
    ctx.moveTo(-13, -114);
    ctx.quadraticCurveTo(-12, -132, 0, -132);
    ctx.quadraticCurveTo(12, -132, 13, -114);
    ctx.closePath();
    ctx.fill();
    // Pitchfork in the back hand when patrolling.
    if (state !== "chase") {
      ctx.strokeStyle = "#8a5a2b";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-22, -60); ctx.lineTo(-30, -120);
      ctx.stroke();
      ctx.strokeStyle = "#c9ccd1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-34, -126); ctx.lineTo(-26, -126);
      ctx.moveTo(-30, -126); ctx.lineTo(-30, -118);
      ctx.stroke();
    }
    ctx.restore();
    // Spotted "!" bubble.
    if (state === "chase" || state === "suspicious") {
      ctx.fillStyle = "#fff";
      circle(ctx, x + dir * 10, y - 158, 16, "#fff");
      ctx.fillStyle = "#d7263d";
      ctx.font = "bold 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(state === "chase" ? "!" : "?", x + dir * 10, y - 150);
    }
  }

  function drawDecoy(ctx, x, y, t) {
    // A gobbling straw turkey that lures the farmer away.
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 6);
    drawTurkey(ctx, x, y, { dir: -1, run: t, moving: true });
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 13px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("GOBBLE! GOBBLE!", x, y - 92);
  }

  function drawCorn(ctx, x, y, t) {
    const bob = Math.sin(t * 3 + x) * 4;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(Math.sin(t * 2) * 0.15);
    ctx.fillStyle = "#f2c14e";
    ellipse(ctx, 0, 0, 10, 18, "#f2c14e");
    ctx.strokeStyle = "#c9932a";
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5, -14);
      ctx.lineTo(i * 5, 14);
      ctx.stroke();
    }
    ctx.fillStyle = "#5d8a38";
    ctx.beginPath();
    ctx.moveTo(-4, -18);
    ctx.quadraticCurveTo(-16, -26, -12, -34);
    ctx.quadraticCurveTo(-2, -28, 0, -18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPie(ctx, x, y, t) {
    const bob = Math.sin(t * 3 + x) * 4;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.fillStyle = "#c96a1e";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-20, -8);
    ctx.lineTo(20, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e8a33d";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-20, -8);
    ctx.lineTo(0, -22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    circle(ctx, 0, -14, 5, "#fff");
    ctx.restore();
  }

  function drawFeather(ctx, x, y, t) {
    const bob = Math.sin(t * 4 + x) * 5;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(Math.sin(t * 2) * 0.3);
    ctx.fillStyle = P.featherGold;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.quadraticCurveTo(14, -6, 0, 18);
    ctx.quadraticCurveTo(-14, -6, 0, -22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#a8842a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 18);
    ctx.stroke();
    ctx.restore();
  }

  function drawGate(ctx, x, y, s, open) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(-8, -150, 12, 150);
    ctx.fillRect(58, -150, 12, 150);
    ctx.fillStyle = "#8a5a2b";
    ctx.fillRect(-14, -150, 84, 12);
    ctx.fillStyle = open ? "#7fae4c" : "#a63a2e";
    ctx.beginPath();
    ctx.arc(28, -168, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(open ? "FREE!" : "FOREST", 28, -163);
    // Forest glow beyond the gate.
    if (open) {
      ctx.fillStyle = "rgba(127,174,76,0.35)";
      ctx.fillRect(-8, -150, 78, 150);
    }
    ctx.restore();
  }

  function drawLeaf(ctx, x, y, rot, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.quadraticCurveTo(7, 0, 0, 7);
    ctx.quadraticCurveTo(-7, 0, 0, -7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  return {
    drawSky: drawSky,
    drawHills: drawHills,
    drawGround: drawGround,
    drawBarn: drawBarn,
    drawFence: drawFence,
    drawPumpkin: drawPumpkin,
    drawCornStalk: drawCornStalk,
    drawHaystack: drawHaystack,
    drawTree: drawTree,
    drawOven: drawOven,
    drawKnife: drawKnife,
    drawTurkey: drawTurkey,
    drawFarmer: drawFarmer,
    drawDecoy: drawDecoy,
    drawCorn: drawCorn,
    drawPie: drawPie,
    drawFeather: drawFeather,
    drawGate: drawGate,
    drawLeaf: drawLeaf,
    circle: circle,
    ellipse: ellipse,
  };
})();
