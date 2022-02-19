export default abstract class Puzzle<A> {
  public history: A[] = [];
  public guesses: number[] = [];
  private actionCallbacks: Set<(action: A) => void> = new Set();
  private contradictionCallbacks: Set<() => void> = new Set();

  public get lastGuess(): number|undefined {
    if (this.guesses.length == 0) {
      return undefined;
    }
    return this.guesses[this.guesses.length - 1];
  }

  protected addAction(a: A) {
    this.history.push(a);
    this.actionCallbacks.forEach((c) => { c(a); });
  }

  protected noticeContradiction() {
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

  public abstract undo(): void;

  public restart() {
    while (this.history.length > 0) {
      this.undo();
    }
  }

  public abandonGuess(): void {
    const g = this.lastGuess;
    if (g === undefined) {
      return;
    }
    while (this.history.length > g) {
      this.undo();
    }
  }

  public abstract markGuessAsImpossible(): void;
  public abstract isReadyForValidation(): boolean;
}
