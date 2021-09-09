import PriorityQueue from '../../src/util/priority_queue.js';

export function run() {
  console.log("Test PriorityQueue: ")

  const q: PriorityQueue<string> = new PriorityQueue();

  q.addItem("a", 5)
  q.addItem("b", 4)
  q.addItem("c", 1)
  q.addItem("d", 4)
  q.addItem("e", 2)
  console.log(q.extractNext());
  console.log(q.extractNext());
  q.addItem("h", 2)
  console.log(q.extractNext());
  console.log(q.extractNext());
  console.log(q.extractNext());
  console.log(q.extractNext());
}
