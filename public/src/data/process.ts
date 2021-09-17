export default abstract class Process<R> {
  public readonly abstract processId: string;
  public readonly abstract ramRequirement: number;
  public readonly abstract returnValue: R;

  /**
   *  Returns true if and only if the process is over.
   */
  public abstract tick(): boolean;
}
