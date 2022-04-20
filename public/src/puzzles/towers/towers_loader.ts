import Towers from "./towers.js"

import { fromSimonTathamId } from "./util.js"

export const LOADED_TOWERS: Map<number, Towers[]> = new Map();

const utf8Decoder = new TextDecoder('utf-8');

export function randomOfSize(size: number): Towers {
  const towers = LOADED_TOWERS.get(size)!;
  let t = towers[Math.floor(Math.random() * towers.length)];
  t = t.rotate(Math.floor(Math.random() * 4));
  if (Math.random() < 0.5) {
    t = t.mirror();
  }
  return t;
}

export async function loadTowers(size: number): Promise<void> {
  // Check if already loaded
  if (LOADED_TOWERS.has(size)) {
    return;
  }

  const response = await fetch(`./src/puzzles/towers/${size}.txt`);
  const reader = response.body!.getReader();
  let done = false;
  let data = "";
  while (!done) {
    let result = await reader.read();
    done = result.done;
    data += utf8Decoder.decode(result.value);
  }
  let puzzles = data.trim().split("\n");
  LOADED_TOWERS.set(size, puzzles.map(p => {
    let t = fromSimonTathamId(p);
    return t;
  }));
}

export async function loadAllTowers(): Promise<void> {
  await loadTowers(2);
  await loadTowers(3);
  await loadTowers(4);
  await loadTowers(5);
  await loadTowers(6);
  await loadTowers(7);
  await loadTowers(8);
  await loadTowers(9);
}
