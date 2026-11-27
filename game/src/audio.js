/* Gobble Run — all sounds are synthesised with WebAudio. No audio files. */
const GobbleAudio = (function buildGobbleAudio() {
  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  // A cheerful autumn fiddle-ish loop, quiet, in A minor pentatonic.
  const MELODY = [220, 261.6, 293.7, 329.6, 392, 329.6, 293.7, 261.6,
    220, 261.6, 329.6, 392, 440, 392, 329.6, 293.7];

  function ensureContext() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const ac = ensureContext();
    if (!ac) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function gobble() {
    // Two quick descending clucks: the turkey's signature call.
    tone(520, 0.09, "square", 0.07, 300);
    setTimeout(function () { tone(460, 0.09, "square", 0.07, 260); }, 90);
    setTimeout(function () { tone(620, 0.12, "square", 0.08, 340); }, 190);
  }

  function play(name) {
    if (muted) return;
    switch (name) {
      case "gobble": gobble(); break;
      case "pickup": tone(880, 0.1, "sine", 0.1, 1320); break;
      case "pie": tone(660, 0.12, "triangle", 0.11, 990); setTimeout(function () { tone(990, 0.12, "triangle", 0.1, 1320); }, 90); break;
      case "feather": tone(1046, 0.14, "sine", 0.11, 1568); setTimeout(function () { tone(1568, 0.18, "sine", 0.1, 2093); }, 110); break;
      case "jump": tone(300, 0.14, "sine", 0.09, 640); break;
      case "dash": tone(500, 0.16, "sawtooth", 0.06, 1200); break;
      case "hurt": tone(220, 0.25, "sawtooth", 0.13, 90); break;
      case "spotted": tone(180, 0.1, "square", 0.1, 320); setTimeout(function () { tone(180, 0.1, "square", 0.1, 320); }, 130); break;
      case "knife": tone(1400, 0.08, "sawtooth", 0.05, 700); break;
      case "hide": tone(392, 0.2, "sine", 0.08, 196); break;
      case "decoy": gobble(); break;
      case "gate": tone(523, 0.12, "triangle", 0.11); setTimeout(function () { tone(659, 0.12, "triangle", 0.11); }, 110); setTimeout(function () { tone(784, 0.2, "triangle", 0.12); }, 220); break;
      case "caught": tone(392, 0.3, "sawtooth", 0.12, 196); setTimeout(function () { tone(311, 0.35, "sawtooth", 0.12, 155); }, 280); setTimeout(function () { tone(233, 0.6, "sawtooth", 0.12, 110); }, 600); break;
      case "escaped":
        [523, 659, 784, 1046].forEach(function (f, i) {
          setTimeout(function () { tone(f, 0.22, "triangle", 0.12); }, i * 140);
        });
        break;
      default: break;
    }
  }

  function startMusic() {
    if (musicTimer || muted) return;
    musicTimer = setInterval(function () {
      if (muted) return;
      const f = MELODY[musicStep % MELODY.length];
      tone(f, 0.24, "triangle", 0.035);
      musicStep += 1;
    }, 260);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  function toggleMute() {
    muted = !muted;
    if (muted) stopMusic();
    return muted;
  }

  function isMuted() { return muted; }

  return { play: play, startMusic: startMusic, stopMusic: stopMusic,
    toggleMute: toggleMute, isMuted: isMuted, ensureContext: ensureContext };
})();
