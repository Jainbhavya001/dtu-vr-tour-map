/* ── graph.js ──────────────────────────────────────────────────────
   Builds an undirected weighted adjacency graph from the node array.

   Two nodes are adjacent if they were consecutive in the same road
   segment *or* if their straight-line distance is ≤ CONNECT_RADIUS_M
   (handles segment junctions where two road ends share nearby nodes).

   Edge weight = Haversine distance in metres.
────────────────────────────────────────────────────────────────────── */

const Graph = (() => {

  const CONNECT_RADIUS_M = 6; // metres — maximum gap to auto-connect nearby nodes

  /*
   * Build the adjacency list.
   *
   * Returns:
   *   adj  – Map<nodeId, Array<{ nodeId, distM }>>
   *   nodeMap – Map<nodeId, node>
   */
  function build(nodes) {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const adj     = new Map(nodes.map(n => [n.id, []]));

    const { haversine } = NodeGenerator;

    // ── Pass 1: connect all node pairs within CONNECT_RADIUS_M ─────
    // O(n²) — fine for ~1000 nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ni = nodes[i], nj = nodes[j];
        const d = haversine([ni.lat, ni.lng], [nj.lat, nj.lng]);
        if (d <= CONNECT_RADIUS_M) {
          adj.get(ni.id).push({ nodeId: nj.id, distM: d });
          adj.get(nj.id).push({ nodeId: ni.id, distM: d });
        }
      }
    }

    return { adj, nodeMap };
  }

  /* Return the list of neighbour node IDs for a given node */
  function neighbours(adj, nodeId) {
    return adj.get(nodeId) ?? [];
  }

  return { build, neighbours };
})();
