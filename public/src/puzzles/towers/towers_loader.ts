import Towers from "./towers.js";

export const LOADED_TOWERS: Map<number, Towers[]> = new Map();

const utf8Decoder = new TextDecoder('utf-8');

export function randomOfSize(size: number): Towers {
  const towers = LOADED_TOWERS.get(size)!;
  const t = towers[Math.floor(Math.random() * towers.length)];
  return t.copy();
}

export async function loadTowers(size: number): Promise<void> {
  // Check if already loaded
  if (LOADED_TOWERS.has(size)) {
    return;
  }

  const response = await fetch(`./src/puzzles/towers/towers_${size}.txt`);
  const reader = response.body!.getReader();
  let done = false;
  let data = "";
  while (!done) {
    let result = await reader.read();
    done = result.done;
    data += utf8Decoder.decode(result.value);
  }
  let puzzles = data.split("-----\n");
  // The text file ends with the delimiter, so remove the empty string at the
  // end of the array
  puzzles.pop();
  // Remove difficulty rating for now
  puzzles = puzzles.map(p => {
    const index = p.indexOf("\n");
    return p.substring(index + 1, p.length - 1);
  })

  LOADED_TOWERS.set(size, puzzles.map(p => {
    let t = Towers.fromString(p);
    return t;
  }));
}
