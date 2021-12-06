import Loopy from "./loopy.js";

const LOADED_LOOPY: Map<number, Loopy[]> = new Map();

const utf8Decoder = new TextDecoder('utf-8');

export async function randomOfSize(size: number): Promise<Loopy> {
  await loadLoopy(size);
  const loopies = LOADED_LOOPY.get(size)!;
  const puzzle = loopies[Math.floor(Math.random() * loopies.length)];
  return puzzle.copy();
}

async function loadLoopy(size: number): Promise<void> {
  // Check if already loaded
  if (LOADED_LOOPY.has(size)) {
    return;
  }

  const response = await fetch(`./src/puzzles/loopy/loopy_${size}.txt`);
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

  LOADED_LOOPY.set(size, puzzles.map(p => {
    let t = Loopy.fromString(p);
    return t;
  }));
}
