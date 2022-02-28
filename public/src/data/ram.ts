import Vue from '../vue.js'

export default class RAM {
  public used: number = 0;
  public max: number = 3000;

  // Keeps track of what uses how much ram
  private allocation: Map<string, number> = new Map();

  public get remaining(): number {
    return this.max - this.used;
  }

  public allocate(name: string, amount: number): boolean {
    if (amount > this.max - this.used) {
      return false;
    }
    if (this.allocation.has(name)) {
      throw new Error("Process with this ID already has memeory allocated:" + name);
    }
    this.used += amount;
    this.allocation.set(name, amount);
    return true;
  }

  public deallocate(name: string): void {
    if (this.allocation.has(name)) {
      const amount = this.allocation.get(name)!;
      this.used -= amount;
      this.allocation.delete(name);
    } else {
      // throw new Error("Process with this ID has no memeory allocated: " + name);
    }
  }
}

export const currentRAM: RAM = Vue.reactive(new RAM());
