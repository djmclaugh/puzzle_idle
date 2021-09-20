function parent(i: number): number {
  return (i - 1) >> 1;
}

function left(i: number): number {
  return (2 * i) + 1;
}

function right(i: number): number {
  return (2 * i) + 2;
}

// Priorities are kept track in a min heap.
// Items are kept track in an array of same-priority items.
// This allows for a "stable" priority queue.
export default class PriorityQueue<T> {
  private items: Map<number, T[]> = new Map();
  private heap: number[] = [];

  public isEmpty(): boolean {
    return this.heap.length == 0;
  }

  public addItem(item: T, priority: number) {
    if (this.items.has(priority)) {
      this.items.get(priority)!.push(item);
    } else {
      this.items.set(priority, [item]);
      this.insert(priority);
    }
  }

  public extractNext(): T|undefined {
    const p = this.max();
    if (p === undefined) {
      return undefined;
    }
    const list = this.items.get(p)!;
    const item = list.shift()!;
    if (list.length == 0) {
      this.extractMax();
      this.items.delete(p);
    }

    return item;
  }

  public peakNext(): T|undefined {
    const p = this.max();
    if (p === undefined) {
      return undefined;
    }
    const list = this.items.get(p)!;
    const item = list[0];

    return item;
  }

  public remove(item: T): boolean {
    for (let key of this.items.keys()) {
      const list = this.items.get(key)!;
      const index = list.indexOf(item);
      if (index != -1) {
        list.splice(index, 1);
        if (list.length == 0) {
          this.removeFromHeap(key);
          this.items.delete(key);
        }
        return true;
      }
    }
    return false;
  }

  private max(): number|undefined {
    return this.heap[0];
  }

  private swap(i: number, j: number) {
    let temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  private insert(i: number) {
    this.heap.push(i);
    let currentIndex = this.heap.length - 1;
    while (currentIndex != 0 && this.heap[currentIndex] > this.heap[parent(currentIndex)]) {
      const p = parent(currentIndex);
      this.swap(currentIndex, p);
      currentIndex = p;
    }
  }

  private extractMax(): number|undefined {
    if (this.heap.length == 0) {
      return undefined
    }

    const max = this.max();
    if (this.heap.length == 1) {
      this.heap.pop();
    } else {
      this.heap[0] = this.heap.pop()!;
      this.heapify(0);
    }

    return max;
  }

  private removeFromHeap(value: number) {
    for (let i = 0; i < this.heap.length; ++i) {
      if (this.heap[i] == value) {
        if (i == this.heap.length - 1) {
          this.heap.pop();
        } else {
          this.heap[i] = this.heap.pop()!;
          this.heapify(i);
        }
      }
    }
  }

  private heapify(i: number): void {
    // If not leaf
    if (i < this.heap.length >> 1) {
      // Find Biggest
      let max = this.heap[i];
      let maxIndex = i;

      let leftIndex = left(i);
      if (this.heap[leftIndex] > max) {
        max = this.heap[leftIndex];
        maxIndex = leftIndex;
      }

      let rightIndex = right(i);
      if (this.heap[rightIndex] > max) {
        max = this.heap[rightIndex];
        maxIndex = rightIndex;
      }

      if (maxIndex != i) {
        this.swap(i, maxIndex);
        this.heapify(maxIndex);
      }
    }
  }
}
