// Gobble Run — entrypoint: hands the game in for make.fun turkey-run-game-01.
// Copies game/ and screenshots/ from this repository into the output directory
// and writes /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Node 22, standard library only, no network, no build step.

import { buildDossier } from "./vendor/makefun-game.ts";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)));
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");

const dossierOptions = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(sourceDir: string, targetDir: string): void {
  if (!existsSync(sourceDir)) {
    throw new Error("missing directory: " + sourceDir);
  }
  mkdirSync(targetDir, { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true, dereference: true });
}

async function handIn(): Promise<void> {
  const gameDir = join(repoRoot, "game");
  if (!existsSync(join(gameDir, "index.html"))) {
    throw new Error("game/index.html is missing — nothing to hand in.");
  }
  mkdirSync(outputDir, { recursive: true });
  rmSync(join(outputDir, "game"), { recursive: true, force: true });
  rmSync(join(outputDir, "screenshots"), { recursive: true, force: true });
  copyTree(gameDir, join(outputDir, "game"));
  copyTree(join(repoRoot, "screenshots"), join(outputDir, "screenshots"));
  const dossier = await buildDossier(outputDir, dossierOptions);
  writeFileSync(join(outputDir, "dossier.json"), dossier);
  // A second build must produce the identical dossier bytes, so the hand-in
  // is deterministic across the grader's two runs.
  const dossierAgain = await buildDossier(outputDir, dossierOptions);
  if (!Buffer.from(dossierAgain).equals(Buffer.from(dossier))) {
    throw new Error("dossier.json does not match a fresh buildDossier run");
  }
  console.log("dossier.json written: " + dossier.length + " bytes (output: " + outputDir + ")");
  console.log("hand-in complete: game/ + screenshots/ + dossier.json in " + outputDir);
}

await handIn();
