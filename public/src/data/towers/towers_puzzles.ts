import Towers from '../../puzzles/towers/towers.js'

const callbacks: (()=>void)[] = []

export const currentPuzzles: Towers[] = [];
export function onPuzzleChange(callback: ()=>void) {
  callbacks.push(callback);
}
export function notifyChange() {
  for (const c of callbacks) {
    c();
  }
}
