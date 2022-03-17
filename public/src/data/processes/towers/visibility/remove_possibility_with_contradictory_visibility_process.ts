import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import { HintFace, faceToString } from '../../../../puzzles/towers/hint_face.js'
import { VisibilityInfo } from '../../../../puzzles/towers/visibility_tracker.js'
import { Triple } from '../../../../puzzles/towers/triple_collection'

export default class RemovePossibilityWithContradictoryVisibilityProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  private info: VisibilityInfo|null= null;
  public readonly returnValue: void = undefined;
  private done: boolean = false;
  private actionMessage: string = 'Waiting for process to run...'

  public constructor(
      private t: Towers,
      private triple: Triple,
      private face: HintFace,
      interfaceId: number) {
    super();
    this.friendlyName = `Check For Visibility Contradiction - Cell (${triple.col + 1}, ${triple.row + 1}), Height ${triple.val + 1}, ${faceToString(this.face)} Face`;
    this.interfaceId = interfaceId;
    this.processId = `remove_possibility_with_contradictiory_visibility_${triple.row}_${triple.col}_${triple.val}_${faceToString(face).toLowerCase()}_${interfaceId}`;
  }

  public get currentAction(): string {
    return this.actionMessage;
  }

  public tick(): boolean {
    if (this.done) {
      return true;
    }
    if (!this.info) {
      this.info = this.t.visibility.getWithTriple(this.triple)[this.face];
      if (this.info.seen && this.info.hidden) {
        this.actionMessage = `Would have to be seen AND hidden if placed here. Impossible!`;
      } else {
        this.actionMessage = `No visibility contradiction. Done!`;
        this.done = true;
      }
    } else {
      this.actionMessage = `Removed Possibility. Done!`;
      this.t.removeFromCell(this.triple.row, this.triple.col, this.triple.val);
      this.done = true;
    }
    return false;
  }
}
