/* ── pathfinding.js ────────────────────────────────────────────────
   Dijkstra's shortest-path algorithm over the navigation graph.

   Returns:
     { path: [nodeId, …], distM: number }  — or null if unreachable.

   The heuristic-free Dijkstra is used (not A*) because the graph is
   sparse and the node count (~1000) keeps it well within budget.
────────────────────────────────────────────────────────────────────── */

const Pathfinding = (() => {

  /* Minimal binary min-heap for (dist, nodeId) pairs */
  class MinHeap {
    constructor() { this._data = []; }

    push(dist, id) {
      this._data.push({ dist, id });
      this._bubbleUp(this._data.length - 1);
    }

    pop() {
      const top = this._data[0];
      const last = this._data.pop();
      if (this._data.length) {
        this._data[0] = last;
        this._sinkDown(0);
      }
      return top;
    }

    get size() { return this._data.length; }

    _bubbleUp(i) {
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (this._data[p].dist <= this._data[i].dist) break;
        [this._data[p], this._data[i]] = [this._data[i], this._data[p]];
        i = p;
      }
    }

    _sinkDown(i) {
      const n = this._data.length;
      while (true) {
        let s = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && this._data[l].dist < this._data[s].dist) s = l;
        if (r < n && this._data[r].dist < this._data[s].dist) s = r;
        if (s === i) break;
        [this._data[s], this._data[i]] = [this._data[i], this._data[s]];
        i = s;
      }
    }
  }

  /*
   * Find the shortest path from startId to endId.
   *
   * @param {Map} adj      – adjacency list from Graph.build()
   * @param {string} startId
   * @param {string} endId
   * @returns {{ path: string[], distM: number } | null}
   */
  function dijkstra(adj, startId, endId) {
    if (startId === endId) return { path: [startId], distM: 0 };

    const dist = new Map();
    const prev = new Map();
    const heap = new MinHeap();

    dist.set(startId, 0);
    heap.push(0, startId);

    while (heap.size > 0) {
      const { dist: d, id } = heap.pop();

      if (id === endId) break;
      if (d > (dist.get(id) ?? Infinity)) continue; // stale entry

      for (const { nodeId: nid, distM } of (adj.get(id) ?? [])) {
        const nd = d + distM;
        if (nd < (dist.get(nid) ?? Infinity)) {
          dist.set(nid, nd);
          prev.set(nid, id);
          heap.push(nd, nid);
        }
      }
    }

    if (!dist.has(endId)) return null; // unreachable

    // Reconstruct path
    const path = [];
    let cur = endId;
    while (cur !== undefined) {
      path.unshift(cur);
      cur = prev.get(cur);
    }

    return { path, distM: dist.get(endId) };
  }

  /* Human-readable distance string */
  function formatDist(metres) {
    return metres < 1000
      ? `${Math.round(metres)} m`
      : `${(metres / 1000).toFixed(2)} km`;
  }

  return { dijkstra, formatDist };
})();
