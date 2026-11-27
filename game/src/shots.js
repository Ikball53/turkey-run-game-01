/* Gobble Run — screenshot staging (?shot=) and headless self-test (?selftest=1). */
(function buildGobbleShots() {
  function params() {
    const out = {};
    const q = window.location.search.replace(/^\?/, "");
    if (!q) return out;
    q.split("&").forEach(function (pair) {
      const kv = pair.split("=");
      out[decodeURIComponent(kv[0] || "")] = decodeURIComponent(kv[1] || "");
    });
    return out;
  }

  function runSelfTest() {
    const results = [];
    function check(name, ok, detail) {
      results.push((ok ? "PASS" : "FAIL") + " " + name + " " + (detail || ""));
    }
    try {
      const s0 = GobbleGame.getState();
      check("boots-to-title", s0.state === "title", "state=" + s0.state);
      GobbleGame.startGame();
      const s1 = GobbleGame.getState();
      check("start-game", s1.state === "playing", "state=" + s1.state);
      // Simulate running right for ~3 seconds of game time.
      const before = GobbleGame.getState();
      // Drive the loop through real frames: wait via rAF in the page.
      let frames = 0;
      const keyEvent = function (type, key) {
        window.dispatchEvent(new KeyboardEvent(type, { key: key, bubbles: true }));
      };
      keyEvent("keydown", "ArrowRight");
      const startDist = GobbleGame.getState().dist;
      const step = function () {
        frames += 1;
        // Count frames, not wall time: under virtual-time headless runs the
        // clock leaps ahead, so a time-based wait would end after few frames.
        if (frames < 180) {
          requestAnimationFrame(step);
          return;
        }
        keyEvent("keyup", "ArrowRight");
        const s2 = GobbleGame.getState();
        check("turkey-runs-forward", s2.dist > startDist + 200, "dist " + startDist + " -> " + s2.dist);
        check("score-grows", s2.score > before.score, "score=" + s2.score);
        check("farmer-alive", ["patrol", "suspicious", "chase", "search"].indexOf(s2.farmerState) >= 0, "farmer=" + s2.farmerState + " gap=" + s2.farmerGap);
        // Tools work (capture plain numbers: getState hands back the live object).
        const burstBefore = GobbleGame.getState().tools.burst;
        GobbleGame.useBurst();
        const burstAfter = GobbleGame.getState().tools.burst;
        check("burst-tool-spends", burstAfter === burstBefore - 1, "burst " + burstBefore + " -> " + burstAfter);
        const decoyBefore = GobbleGame.getState().tools.decoy;
        GobbleGame.useDecoy();
        const decoyAfter = GobbleGame.getState().tools.decoy;
        check("decoy-tool-spends", decoyAfter === decoyBefore - 1, "decoy " + decoyBefore + " -> " + decoyAfter);
        // End screens are reachable.
        GobbleGame.forceState("escaped");
        check("escaped-screen", GobbleGame.getState().state === "escaped", "");
        GobbleGame.forceState("caught");
        check("caught-screen", GobbleGame.getState().state === "caught", "");
        GobbleGame.forceState("title");
        check("back-to-title", GobbleGame.getState().state === "title", "");
        const el = document.getElementById("selftest");
        if (el) el.textContent = "SELFTEST\n" + results.join("\n");
        document.title = "SELFTEST-DONE " + results.filter(function (r) { return r.indexOf("FAIL") === 0; }).length + " failures";
      };
      requestAnimationFrame(step);
    } catch (err) {
      const el = document.getElementById("selftest");
      if (el) el.textContent = "SELFTEST\nFAIL exception " + err.message;
      document.title = "SELFTEST-ERROR";
    }
  }

  window.addEventListener("load", function () {
    GobbleGame.init();
    const p = params();
    if (p.shot) {
      // Let two frames render, then freeze the staged scene.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          GobbleGame.forceState(p.shot);
        });
      });
    }
    if (p.selftest) runSelfTest();
  });
})();
