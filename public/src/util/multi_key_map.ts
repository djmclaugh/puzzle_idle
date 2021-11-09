export class DoubleKeyMap<K1, K2, V> {
  private map: Map<K1, Map<K2, V>> = new Map();

  get(k1: K1, k2: K2) {
    const innerMap = this.map.get(k1);
    if (innerMap) {
      return innerMap.get(k2);
    }
    return undefined;
  }

  has(k1: K1, k2: K2) {
    const innerMap = this.map.get(k1);
    if (innerMap) {
      return innerMap.has(k2);
    }
    return false;
  }

  set(k1: K1, k2: K2, v: V) {
    if (!this.map.has(k1)) {
      this.map.set(k1, new Map());
    }
    const innerMap = this.map.get(k1)!;
    innerMap.set(k2, v);
    return this;
  }
}

export class TripleKeyMap<K1, K2, K3, V> {
  private map: Map<K1, DoubleKeyMap<K2, K3, V>> = new Map();

  get(k1: K1, k2: K2, k3: K3) {
    const innerMap = this.map.get(k1);
    if (innerMap) {
      return innerMap.get(k2, k3);
    }
    return undefined;
  }

  has(k1: K1, k2: K2, k3: K3) {
    const innerMap = this.map.get(k1);
    if (innerMap) {
      return innerMap.has(k2, k3);
    }
    return false;
  }

  set(k1: K1, k2: K2, k3: K3, v: V) {
    if (!this.map.has(k1)) {
      this.map.set(k1, new DoubleKeyMap());
    }
    const innerMap = this.map.get(k1)!;
    innerMap.set(k2, k3, v);
    return this;
  }
}
