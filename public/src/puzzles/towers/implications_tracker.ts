import { Triple } from './towers.js'
import { TripleKeyMap } from '../../util/multi_key_map.js'

export default class ImplicationsTracker {
  private ifOnThenOn: TripleKeyMap<number, number, number, Set<Triple>> = new TripleKeyMap();
  private ifOnThenOff: TripleKeyMap<number, number, number, Set<Triple>> = new TripleKeyMap();
  private ifOffThenOn: TripleKeyMap<number, number, number, Set<Triple>> = new TripleKeyMap();
  private ifOffThenOff: TripleKeyMap<number, number, number, Set<Triple>> = new TripleKeyMap();

  private getOnOn(t: Triple) {
    return this.ifOnThenOn.get(t.row, t.col, t.val);
  }
  private getOnOff(t: Triple) {
    return this.ifOnThenOff.get(t.row, t.col, t.val);
  }
  private getOffOn(t: Triple) {
    return this.ifOffThenOn.get(t.row, t.col, t.val);
  }
  private getOffOff(t: Triple) {
    return this.ifOffThenOff.get(t.row, t.col, t.val);
  }

  constructor(size: number) {
    for (let i = 0; i < size; ++i) {
      for (let j = 0; j < size; ++j) {
        for (let k = 0; k < size; ++k) {
          this.ifOnThenOn.set(i, j, k, new Set());
          this.ifOffThenOn.set(i, j, k, new Set());
          this.ifOnThenOff.set(i, j, k, new Set());
          this.ifOffThenOff.set(i, j, k, new Set());
        }
      }
    }

    for (let i = 0; i < size; ++i) {
      for (let j = 0; j < size; ++j) {
        for (let k = 0; k < size; ++k) {
          const t = {row: i, col: j, val: k};
          for (let x = 0; x < size; ++x) {
            if (x != t.row) {
              this.addOnToOffImplication(t, {row: x, col: t.col, val: t.val});
            }
            if (x != t.col) {
              this.addOnToOffImplication(t, {row: t.row, col: x, val: t.val});
            }
            if (x != t.val) {
              this.addOnToOffImplication(t, {row: t.row, col: t.col, val: x});
            }
          }
        }
      }
    }
  }

  // Adds the implication a -> c.
  // Also adds the converse !c -> !a.
  // Returns true if the implication was added.
  // Returns false if the implication was already there.
  public addImplication(a: Triple, c: Triple): boolean {
    const implications = this.getOnOn(a)!;
    if (!implications.has(c)) {
      implications.add(c);
      this.getOffOff(c)!.add(a);
      return true;
    } else {
      return false;
    }
  }
  public removeImplication(a: Triple, c: Triple): boolean {
    const implications = this.getOnOn(a)!;
    if (!implications.has(c)) {
      return false;
    } else {
      implications.delete(c);
      this.getOffOff(c)!.delete(a);
      return true;
    }
  }

  // Adds the implication a -> !c.
  // Also adds the converse c -> !a.
  // Returns true if the implication was added.
  // Returns false if the implication was already there.
  public addOnToOffImplication(a: Triple, c: Triple): boolean {
    const implications = this.getOnOff(a)!;
    if (!implications.has(c)) {
      implications.add(c);
      this.getOnOff(c)!.add(a);
      return true;
    } else {
      return false;
    }
  }
  public removeOnToOffImplication(a: Triple, c: Triple): boolean {
    const implications = this.getOnOff(a)!;
    if (!implications.has(c)) {
      return false;
    } else {
      implications.delete(c);
      this.getOnOff(c)!.delete(a);
      return true;
    }
  }

  // Adds the implication !a -> c.
  // Also adds the converse !c -> a.
  // Returns true if the implication was added.
  // Returns false if the implication was already there.
  public addOffToOnImplication(a: Triple, c: Triple): boolean {
    const implications = this.getOffOn(a)!;
    if (!implications.has(c)) {
      implications.add(c);
      this.getOffOn(c)!.add(a);
      return true;
    } else {
      return false;
    }
  }
  public removeOffToOnImplication(a: Triple, c: Triple): boolean {
    const implications = this.getOffOn(a)!;
    if (!implications.has(c)) {
      return false;
    } else {
      implications.delete(c);
      this.getOffOn(c)!.delete(a);
      return true;
    }
  }

  // Get all of the possibilities transitively implied by a single possibility.
  public getImplicationsFromNodeSet(a: Triple): [Set<Triple>, Set<Triple>] {
    return this.getImplicationSet(new Set([a]), new Set(), new Set([a]), new Set());
  }

  // Get all of the possibilities transitively implied by a removing a single possibility.
  public getImplicationsFromNodeRemoval(a: Triple): [Set<Triple>, Set<Triple>] {
    return this.getImplicationSet(new Set(), new Set([a]), new Set(), new Set([a]));
  }

  private getImplicationSet(newAddedNodes: Set<Triple>, newRemovedNodes: Set<Triple>, nodesAlreadyFound: Set<Triple>, nodesAlreadyRemoved: Set<Triple>): [Set<Triple>, Set<Triple>] {
    const added: Set<Triple> = new Set();
    const removed: Set<Triple> = new Set();
    for (const n of newAddedNodes) {
      for (const onNode of this.getOnOn(n)!) {
        if (!nodesAlreadyFound.has(onNode)) {
          added.add(onNode);
          nodesAlreadyFound.add(onNode);
        }
      }
      for (const offNode of this.getOnOff(n)!) {
        if (!nodesAlreadyRemoved.has(offNode)) {
          removed.add(offNode);
          nodesAlreadyRemoved.add(offNode);
        }
      }
    }
    for (const n of newRemovedNodes) {
      for (const onNode of this.getOffOn(n)!) {
        if (!nodesAlreadyFound.has(onNode)) {
          added.add(onNode);
          nodesAlreadyFound.add(onNode);
        }
      }
      for (const offNode of this.getOffOff(n)!) {
        if (!nodesAlreadyRemoved.has(offNode)) {
          removed.add(offNode);
          nodesAlreadyRemoved.add(offNode);
        }
      }
    }
    if (added.size == 0 && removed.size == 0) {
      return [nodesAlreadyFound, nodesAlreadyRemoved];
    } else {
      return this.getImplicationSet(added, removed, nodesAlreadyFound, nodesAlreadyRemoved);
    }
  }
}
