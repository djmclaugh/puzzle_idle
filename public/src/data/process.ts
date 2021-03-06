export default abstract class Process<R> {
  public readonly abstract processId: string;
  public readonly abstract interfaceId: number;
  public readonly abstract friendlyName: string;
  // If the process is not done, returns undefined.
  // Otherwise, returns the result of the process.
  public readonly abstract returnValue: R|undefined;

  public readonly abstract currentAction: string;

  /**
   *  Returns true if and only if the process is over.
   */
  public abstract tick(): boolean;
}
