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

  public suffle<T>(list: T[]): void {
    if (this.order.length != list.length) {
      throw new Error("List of the wrong size.")
    }
    const temp = list.concat();
    for (let i = 0; i < list.length; ++i) {
      list[this.order[i]] = temp[i];
    }
  }
}

// Fisher–Yates shuffle
export function randomPermutation(size: number) {
  const l: number[] = [];
  for (let i = 0; i < size; ++i) {
    l.push(i);
  }
  for (let i = 0; i < size; ++i) {
    const rand = i + Math.floor(Math.random() * (size - i));
    const temp = l[rand];
    l[rand] = l[i];
    l[i] = temp;
  }
  return new Permutation(l);
}

// TODO: Look into Steinhaus–Johnson–Trotter algorithm
