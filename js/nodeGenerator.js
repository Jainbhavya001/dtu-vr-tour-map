/* ── nodeGenerator.js ──────────────────────────────────────────────
   Generates navigation nodes along road segments at fixed metre intervals,
   then injects exactly ONE building-entrance node per POI (placed at the
   road-side `entrance` coordinate defined in poiData.js).

   Rules enforced:
     • Road nodes are interpolated every NODE_SPACING_M metres along road
       centrelines — they stay strictly on the road geometry.
     • Near-duplicate nodes (< NODE_MERGE_RADIUS m apart) are merged,
       so road nodes never cluster at junctions.
     • Building entrance nodes are deduplicated against road nodes; if a
       road node is already within NODE_MERGE_RADIUS of the entrance it
       is replaced by the building node (preserving the poiId metadata).
     • Each POI gets exactly one node marked  isBuildingNode: true.
────────────────────────────────────────────────────────────────────── */

const NodeGenerator = (() => {

  const EARTH_R = 6371000; // metres

  /* Haversine distance between two [lat,lng] pairs, returns metres */
  function haversine([lat1, lng1], [lat2, lng2]) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return 2 * EARTH_R * Math.asin(Math.sqrt(a));
  }

  /* Linear interpolation between two [lat,lng] at parameter t ∈ [0,1] */
  function lerp([la1, lo1], [la2, lo2], t) {
    return [la1 + t * (la2 - la1), lo1 + t * (lo2 - lo1)];
  }

  /*
   * Interpolate points every stepM metres along one road waypoint pair.
   * Includes p1; excludes p2 (caller chains segments without duplication).
   */
  function interpolatePair(p1, p2, stepM) {
    const dist = haversine(p1, p2);
    if (dist < 0.1) return [p1];
    const steps = Math.max(1, Math.floor(dist / stepM));
    const pts = [];
    for (let i = 0; i < steps; i++) pts.push(lerp(p1, p2, i / steps));
    return pts;
  }

  /* Generate raw [lat, lng] points from one road segment definition */
  function generateFromSegment(seg, stepM) {
    const raw = [];
    const wp  = seg.waypoints;
    for (let i = 0; i < wp.length - 1; i++) {
      raw.push(...interpolatePair(wp[i], wp[i + 1], stepM));
    }
    raw.push(wp[wp.length - 1]); // always include last waypoint
    return raw;
  }

  /*
   * Remove near-duplicates in O(n²) — acceptable for ≤ ~1500 nodes.
   * Returns filtered [lat, lng] array.
   */
  function deduplicate(pts, mergeRadiusM) {
    const kept = [];
    for (const pt of pts) {
      let tooClose = false;
      for (const k of kept) {
        if (haversine(pt, k) < mergeRadiusM) { tooClose = true; break; }
      }
      if (!tooClose) kept.push(pt);
    }
    return kept;
  }

  /*
   * Main export — generates the full node list.
   *
   * Returns: Array of node objects:
   *   {
   *     id            : 'N0' | 'B_gate1' | …
   *     lat, lng      : number
   *     segmentId     : string
   *     segmentName   : string
   *     isBuildingNode: boolean    ← true only for building-entrance nodes
   *     poiId         : string | null
   *   }
   */
  function generate(roadNetwork, poiData, stepM = 4, mergeRadiusM = 3) {

    // ── 1. Collect raw road points ────────────────────────────────
    const rawPts = [];
    for (const seg of roadNetwork) {
      for (const pt of generateFromSegment(seg, stepM)) {
        rawPts.push({ lat: pt[0], lng: pt[1], segId: seg.id, segName: seg.name });
      }
    }

    // ── 2. Deduplicate road points ─────────────────────────────────
    const coords  = rawPts.map(p => [p.lat, p.lng]);
    const keptCoords = deduplicate(coords, mergeRadiusM);

    // ── 3. Build road node objects ─────────────────────────────────
    const roadNodes = keptCoords.map((pt, i) => {
      const meta = rawPts.find(r =>
        Math.abs(r.lat - pt[0]) < 1e-9 && Math.abs(r.lng - pt[1]) < 1e-9
      );
      return {
        id:            `N${i}`,
        lat:           pt[0],
        lng:           pt[1],
        segmentId:     meta ? meta.segId   : 'unknown',
        segmentName:   meta ? meta.segName : 'Unknown',
        isBuildingNode: false,
        poiId:         null,
      };
    });

    // ── 4. Inject building entrance nodes ─────────────────────────
    // For each POI with an `entrance`, check whether a road node is
    // already within mergeRadiusM. If yes — replace that node with a
    // building node (same position, upgraded metadata). If no — append
    // a new building node so the POI is still reachable.
    const allNodes = [...roadNodes];

    for (const poi of poiData) {
      if (!poi.entrance) continue;
      const [eLat, eLng] = poi.entrance;

      // Find closest road node
      let closestIdx = -1;
      let closestDist = Infinity;
      for (let i = 0; i < allNodes.length; i++) {
        const d = haversine([eLat, eLng], [allNodes[i].lat, allNodes[i].lng]);
        if (d < closestDist) { closestDist = d; closestIdx = i; }
      }

      if (closestDist <= mergeRadiusM && closestIdx !== -1) {
        // Upgrade existing node to a building node
        allNodes[closestIdx] = {
          ...allNodes[closestIdx],
          lat:            eLat,
          lng:            eLng,
          isBuildingNode: true,
          poiId:          poi.id,
        };
      } else {
        // Append a new building node
        allNodes.push({
          id:             `B_${poi.id}`,
          lat:            eLat,
          lng:            eLng,
          segmentId:      'entrance',
          segmentName:    poi.name,
          isBuildingNode: true,
          poiId:          poi.id,
        });
      }
    }

    return allNodes;
  }

  /* Find the closest node (by Haversine) to a given [lat, lng] */
  function nearestNode(nodes, lat, lng) {
    let best = null, bestDist = Infinity;
    for (const n of nodes) {
      const d = haversine([lat, lng], [n.lat, n.lng]);
      if (d < bestDist) { bestDist = d; best = n; }
    }
    return { node: best, distM: bestDist };
  }

  return { generate, nearestNode, haversine };
})();
