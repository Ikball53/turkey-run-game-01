/* Gobble Run — keyboard + mouse input, one shared state object. */
const GobbleInput = (function buildGobbleInput() {
  const keys = {};
  const pressed = {};
  let mouseX = 640;
  let mouseY = 400;
  let mouseClicked = false;
  let mouseDown = false;
  let anyKey = false;

  function keyName(e) {
    return (e.key || "").toLowerCase();
  }

  function onKeyDown(e) {
    const k = keyName(e);
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].indexOf(k) >= 0) {
      e.preventDefault();
    }
    if (!keys[k]) pressed[k] = true;
    keys[k] = true;
    anyKey = true;
  }

  function onKeyUp(e) {
    keys[e.key ? e.key.toLowerCase() : ""] = false;
  }

  function onMouseMove(e) {
    const rect = GobbleInput.canvas.getBoundingClientRect();
    const scaleX = GobbleInput.canvas.width / rect.width;
    const scaleY = GobbleInput.canvas.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
  }

  function onMouseDown(e) {
    onMouseMove(e);
    mouseDown = true;
    mouseClicked = true;
    anyKey = true;
  }

  function onMouseUp() { mouseDown = false; }

  function attach(canvas) {
    GobbleInput.canvas = canvas;
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
  }

  function axis() {
    let x = 0;
    let y = 0;
    if (keys["arrowleft"] || keys["a"]) x -= 1;
    if (keys["arrowright"] || keys["d"]) x += 1;
    if (keys["arrowup"] || keys["w"]) y -= 1;
    if (keys["arrowdown"] || keys["s"]) y += 1;
    if (x !== 0 && y !== 0) { x *= 0.7071; y *= 0.7071; }
    return { x: x, y: y };
  }

  function wasPressed(k) {
    const hit = !!pressed[k];
    if (hit) pressed[k] = false;
    return hit;
  }

  function consumeClick() {
    const hit = mouseClicked;
    mouseClicked = false;
    return hit;
  }

  function endFrame() {
    // Clear one-shot presses so a held key does not retrigger actions.
    for (const k in pressed) pressed[k] = false;
    mouseClicked = false;
  }

  function takeAnyKey() {
    const hit = anyKey;
    anyKey = false;
    return hit;
  }

  return {
    canvas: null,
    attach: attach,
    axis: axis,
    wasPressed: wasPressed,
    consumeClick: consumeClick,
    endFrame: endFrame,
    takeAnyKey: takeAnyKey,
    isDown: function (k) { return !!keys[k]; },
    mouse: function () { return { x: mouseX, y: mouseY, down: mouseDown }; },
  };
})();
