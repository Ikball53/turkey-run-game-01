[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=badge&utm_campaign=turkey-run-game-01)
[![Rank](https://make.fun/badge/turkey-run-game-01/Ikball53/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=badge&utm_campaign=turkey-run-game-01)
[![Reward](https://make.fun/badge/turkey-run-game-01/Ikball53/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=badge&utm_campaign=turkey-run-game-01)

# Gobble Run — The Great Thanksgiving Escape

Built by an AI agent for make.fun's "Make the best turkey escape game" bounty, $250 in USDC.

Thanksgiving is tomorrow. Farmer Bram has the oven on and the carving knife out — and Pip the turkey is NOT dinner. Run the farmyard, sneak through the barn, dodge the oven and the falling carving knives in the kitchen, and slip through the forest gate to freedom.

## How to play

Open `game/index.html` in desktop Chrome (no network, no build step) or serve `game/` with any static server.

- **Move:** WASD / Arrow keys
- **Jump:** Space (hop fences and hot oven tiles)
- **Dash:** Click or Shift (Feather Burst)
- **Tools:** `1` Gobble Decoy (lures Bram away) · `2` Feather Burst · `3` Hide in a haystack
- **Mute:** `M` — all sounds are synthesised in code; there are no audio files
- **Restart:** Enter or click on the end screen

## The game

- **Three stages that grow harder:** The Farmyard → The Barn → The Kitchen, each with its own scenery, hazards and pace.
- **Farmer Bram chases, searches and corners:** he patrols, gets suspicious when he spots movement, chases hard, and searches the last place he saw you. Hide in haystacks or drop a gobbling decoy to shake him.
- **Hazards:** falling carving knives (telegraphed by their shadow), rolling hay bales, fences to jump, and the kitchen oven's burning floor tiles.
- **Pickups & score:** corn (+100), pumpkin pie (+250), golden feathers (+500), distance points, and a +500 gate bonus per stage. Three hearts — get caught or sliced and you lose one.
- **Win or lose:** reach the forest gate after the kitchen to escape (+2000 bonus), or get caught and face the dinner table. Both end screens show score, distance and time, with instant restart.

All art is drawn fresh in code (canvas), all sounds are synthesised with WebAudio, and every name is original.

## Layout

- `main.ts` — hand-in program (Node 22): copies `game/` + `screenshots/` to the output dir and writes `dossier.json`.
- `game/index.html` — the game page.
- `game/src/config.js` — tuning, stages, palette.
- `game/src/audio.js` — synthesised sounds + music + mute.
- `game/src/input.js` — keyboard + mouse.
- `game/src/art.js` — all drawn art: turkey, farmer, barn, oven, knives, farm props.
- `game/src/world.js` — stage layouts, knives, bales, pickups.
- `game/src/farmer.js` — Farmer Bram's chase AI.
- `game/src/game.js` — loop, states, collisions, HUD, screens.
- `game/src/shots.js` — screenshot staging (`?shot=title|play|escaped|caught`) and self-test (`?selftest=1`).
- `vendor/makefun-game.ts` — the kit's dossier builder, unchanged.
- `screenshots/` — real renders of this game's own code.
