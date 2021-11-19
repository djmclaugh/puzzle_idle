import { Triple } from './towers.js'
import { TripleKeyMap } from '../../util/multi_key_map.js'

type ImplicationMap = TripleKeyMap<number, number, number, Set<Triple>>;

function getOrSetIfUndefined(t: Triple, map: ImplicationMap): Set<Triple> {
  let s: Set<Triple>|undefined = map.get(t.row, t.col, t.val);
  if (s === undefined) {
    s = new Set();
    map.set(t.row, t.col, t.val, s);
  }
  return s;
}

export default class ImplicationsTracker {
  private ifOnThenOn: ImplicationMap = new TripleKeyMap();
  private ifOnThenOff: ImplicationMap = new TripleKeyMap();
  private ifOffThenOn: ImplicationMap = new TripleKeyMap();
  private ifOffThenOff: ImplicationMap = new TripleKeyMap();

  private getOnOn(t: Triple): Set<Triple> {
    return getOrSetIfUndefined(t, this.ifOnThenOn);
  }
  private getOnOff(t: Triple): Set<Triple> {
    return getOrSetIfUndefined(t, this.ifOnThenOff);
  }
  private getOffOn(t: Triple): Set<Triple> {
    return getOrSetIfUndefined(t, this.ifOffThenOn);
  }
  private getOffOff(t: Triple): Set<Triple> {
    return getOrSetIfUndefined(t, this.ifOffThenOff);
  }

  constructor(size: number) {
    // Uncomment to auto apply latin square uniqueness implications
    // for (let i = 0; i < size; ++i) {
    //   for (let j = 0; j < size; ++j) {
    //     for (let k = 0; k < size; ++k) {
    //       const t = {row: i, col: j, val: k};
    //       for (let x = 0; x < size; ++x) {
    //         if (x != t.row) {
    //           this.addOnToOffImplication(t, {row: x, col: t.col, val: t.val});
    //         }
    //         if (x != t.col) {
    //           this.addOnToOffImplication(t, {row: t.row, col: x, val: t.val});
    //         }
    //         if (x != t.val) {
    //           this.addOnToOffImplication(t, {row: t.row, col: t.col, val: x});
    //         }
    //       }
    //     }
    //   }
    // }
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

  // setImplicators: Nodes that imply the desired outcome if set
  // removeImplicators: Nodes that imply the desired outcome if removed
  public getImplicatorSet(newSetImplicators: Set<Triple>, newRemoveImplicators: Set<Triple>, setImplicators: Set<Triple>, removeImplicators: Set<Triple>): [Set<Triple>, Set<Triple>] {
    const setImplicatorsAdded: Set<Triple> = new Set();
    const removeImplicatorsAdded: Set<Triple> = new Set();
    for (const n of newSetImplicators) {
      for (const m of this.getOffOn(n)!) {
        // If n is off, then m must be on.
        // This means that if m is off, n must be on as desired.
        if (!removeImplicators.has(m)) {
          removeImplicators.add(m);
          removeImplicatorsAdded.add(m);
        }
      }
      for (const m of this.getOffOff(n)!) {
        // If n is off, then m must be off.
        // This means that if m is on, n must be on as desired.
        if (!setImplicators.has(m)) {
          setImplicators.add(m);
          setImplicatorsAdded.add(m);
        }
      }
    }
    for (const n of newRemoveImplicators) {
      for (const m of this.getOnOn(n)!) {
        // If n is on, then m must be on.
        // This means that if m is off, n must be off as desired.
        if (!removeImplicators.has(m)) {
          removeImplicators.add(m);
          removeImplicatorsAdded.add(m);
        }
      }
      for (const m of this.getOnOff(n)!) {
        // If n is on, then m must be off.
        // This means that if m is on, n must be off as desired.
        if (!setImplicators.has(m)) {
          setImplicators.add(m);
          setImplicatorsAdded.add(m);
        }
      }
    }
    if (removeImplicatorsAdded.size == 0 && setImplicatorsAdded.size == 0) {
      return [setImplicators, removeImplicators];
    } else {
      return this.getImplicationSet(setImplicatorsAdded, removeImplicatorsAdded, setImplicators, removeImplicators);
    }
  }

  public impliesContradiction(node: Triple): boolean {
    const [nodesToSet, nodesToRemove] = this.getImplicationsFromNodeSet(node);
    for (const n of nodesToSet) {
      if (nodesToRemove.has(n)) {
        return true;
      }
    }
    return false;
  }

  public removalImpliesContradiction(node: Triple): boolean {
    const [nodesToSet, nodesToRemove] = this.getImplicationsFromNodeRemoval(node);
    for (const n of nodesToSet) {
      if (nodesToRemove.has(n)) {
        return true;
      }
    }
    return false;
  }
}
