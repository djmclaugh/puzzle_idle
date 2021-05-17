export class Permutation {
  private order: number[];

  constructor(permutation: number[]) {
    this.order = permutation.concat();
  }

  public f(input: number) {
    return this.order[input];
  }

  public applyToEach(inputs: number[]) {
    for (let i = 0; i < inputs.length; ++i) {
      inputs[i] = this.f(inputs[i]);
    }
  }
}

export const S2 = [
  new Permutation([0, 1]),
  new Permutation([1, 0]),
];

export const S3 = [
  new Permutation([0, 1, 2]),
  new Permutation([0, 2, 1]),
  new Permutation([1, 0, 2]),
  new Permutation([1, 2, 0]),
  new Permutation([2, 0, 1]),
  new Permutation([2, 1, 0]),
];
