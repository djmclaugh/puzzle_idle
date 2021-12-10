import { EdgeType } from './loopy.js'

export default class Node {
  public constructor(public row: number, public column: number) {

  }

  public hash() {
    let sum = this.row + this.column;
    return ((Math.pow(sum, 2) + sum) / 2) + this.column;
  }

  public up(): Node {
    return new Node(this.row - 1, this.column);
  }
  public right(): Node {
    return new Node(this.row, this.column + 1);
  }
  public down(): Node {
    return new Node(this.row + 1, this.column);
  }
  public left(): Node {
    return new Node(this.row, this.column - 1);
  }

  public static fromEdge(type: EdgeType, row: number, column: number): [Node, Node] {
    switch (type) {
      case EdgeType.Vertical:
        return [new Node(row, column), new Node(row + 1, column)];
      case EdgeType.Horizontal:
        return [new Node(row, column), new Node(row, column + 1)];
    }
  }
}
