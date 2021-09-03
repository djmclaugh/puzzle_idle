export default abstract class Bot {
  // Called whenever the puzzle the bot is working on has changed.
  public abstract puzzleChanged(): void;
  // Called whenever the bot should take its next step.
  public abstract tick(): boolean;

  public logs: string[] = [];
}
