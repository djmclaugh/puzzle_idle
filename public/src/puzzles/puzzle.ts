export interface Contradiction {
  noticedOnMove: number
}

// A: Object type of actions applied to the puzzle.
export default abstract class Puzzle<A> {
  public history: A[] = [];
  public guesses: number[] = [];
  protected contradiction: Contradiction|null = null;
  private actionCallbacks: Set<(action: A) => void> = new Set();
  private contradictionCallbacks: Set<() => void> = new Set();


  public get lastGuessIndex(): number|undefined {
    if (this.guesses.length == 0) {
      return undefined;
    }
    return this.guesses[this.guesses.length - 1];
  }

  public get lastGuess(): A|undefined {
    if (this.guesses.length == 0) {
      return undefined;
    }
    return this.history[this.lastGuessIndex!];
  }

  protected addAction(a: A) {
    this.history.push(a);
    this.actionCallbacks.forEach((c) => { c(a); });
  }

  public noticeContradiction(c: Contradiction) {
    // Only have to keep track of the earliest contradiction.
    if (this.contradiction === null) {
      this.contradiction = c;
      this.contradiction.noticedOnMove = this.history.length - 1;
    }
    // But trigger the callbacks regardless again just in case.
    this.contradictionCallbacks.forEach((c) => { c(); });
  }

  public onAction(c: (action: A) => void) {
    this.actionCallbacks.add(c);
  }

  public onContradiction(c: () => void) {
    this.contradictionCallbacks.add(c);
  }

  public removeActionListener(c: (action: A) => void) {
    this.actionCallbacks.delete(c);
  }

  public abstract undoAction(a: A): void;

  public undo(): void {
    const lastAction = this.history.pop();
    if (lastAction === undefined) {
      throw new Error("Cannot undo non-existant action");
    }
    this.undoAction(lastAction);

    if (this.lastGuessIndex !== undefined && this.history.length <= this.lastGuessIndex) {
      this.guesses.pop();
    }
    if (this.contradiction !== null && this.contradiction.noticedOnMove >= this.history.length) {
      this.contradiction = null;
    }
  }

  public getContradiction(): Contradiction|null {
    return this.contradiction;
  }

  public get hasContradiction(): boolean {
    return this.contradiction !== null;
  }

  public restart() {
    while (this.history.length > 0) {
      this.undo();
    }
  }

  public abandonGuess(): void {
    if (this.guesses.length == 0) {
      throw new Error("Cannot abandon non-existant guess");
    }
    const index = this.lastGuessIndex!;
    while (this.history.length > index) {
      this.undo();
    }
  }

  public abstract markGuessAsImpossible(): void;
  public abstract isReadyForValidation(): boolean;
}
