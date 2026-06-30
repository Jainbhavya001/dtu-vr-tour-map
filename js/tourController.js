/* ── tourController.js ─────────────────────────────────────────────
   Manages virtual tour state: current node, active path, walk animation,
   and auto-tour sequence through all campus POIs.
────────────────────────────────────────────────────────────────────── */

const TourController = (() => {

  let _nodes       = [];
  let _adj         = null;
  let _currentNode = null;
  let _activePath  = [];          // array of nodeIds
  let _walkTimer   = null;        // interval handle for walk animation
  let _autoTimer   = null;        // timeout handle for auto-tour dwell
  let _autoTourIdx = 0;
  let _isAutoTour  = false;

  // Callbacks wired up by main.js
  let _onNodeChange   = null;   // (node) → void
  let _onPathReady    = null;   // ({ path, distM }) → void
  let _onWalkStep     = null;   // (node, stepIdx, total) → void
  let _onWalkComplete = null;   // () → void
  let _onAutoTourEnd  = null;   // () → void

  /* ── Setup ───────────────────────────────────────────────────────── */
  function init(nodes, adj, callbacks = {}) {
    _nodes       = nodes;
    _adj         = adj;
    _onNodeChange   = callbacks.onNodeChange   || null;
    _onPathReady    = callbacks.onPathReady    || null;
    _onWalkStep     = callbacks.onWalkStep     || null;
    _onWalkComplete = callbacks.onWalkComplete || null;
    _onAutoTourEnd  = callbacks.onAutoTourEnd  || null;
  }

  /* ── Navigation ──────────────────────────────────────────────────── */
  function visitNode(node) {
    _currentNode = node;
    if (_onNodeChange) _onNodeChange(node);
  }

  function visitNodeById(nodeId) {
    const node = _nodes.find(n => n.id === nodeId);
    if (node) visitNode(node);
  }

  function currentNode() { return _currentNode; }

  /* Find path from current node to nearest node of a POI */
  function navigateTo(poiId) {
    if (!_currentNode) {
      // No current node — snap to nearest POI first
      const poi = POI_MAP[poiId];
      if (!poi) return null;
      const { node } = NodeGenerator.nearestNode(_nodes, poi.lat, poi.lng);
      if (node) visitNode(node);
      return null;
    }

    const poi = POI_MAP[poiId];
    if (!poi) return null;

    const { node: destNode } = NodeGenerator.nearestNode(_nodes, poi.lat, poi.lng);
    if (!destNode) return null;

    const result = Pathfinding.dijkstra(_adj, _currentNode.id, destNode.id);
    if (!result) return null;

    _activePath = result.path;
    if (_onPathReady) _onPathReady({ ...result, destNode });
    return result;
  }

  /* Walk the active path step by step */
  function walkPath() {
    if (!_activePath.length) return;
    stopWalk();

    let step = 0;
    _walkTimer = setInterval(() => {
      if (step >= _activePath.length) {
        clearInterval(_walkTimer);
        _walkTimer = null;
        if (_onWalkComplete) _onWalkComplete();
        return;
      }
      const nodeId = _activePath[step];
      const node   = _nodes.find(n => n.id === nodeId);
      if (node) {
        _currentNode = node;
        if (_onWalkStep)     _onWalkStep(node, step, _activePath.length);
        if (_onNodeChange)   _onNodeChange(node);
      }
      step++;
    }, CONFIG.WALK_STEP_INTERVAL_MS);
  }

  function stopWalk() {
    if (_walkTimer) { clearInterval(_walkTimer); _walkTimer = null; }
  }

  function isWalking() { return _walkTimer !== null; }

  /* ── Auto-tour ───────────────────────────────────────────────────── */
  function startAutoTour(poiIds) {
    stopAutoTour();
    _isAutoTour  = true;
    _autoTourIdx = 0;

    function visitNext() {
      if (!_isAutoTour || _autoTourIdx >= poiIds.length) {
        stopAutoTour();
        if (_onAutoTourEnd) _onAutoTourEnd();
        return;
      }

      const poi = POI_MAP[poiIds[_autoTourIdx]];
      if (!poi) { _autoTourIdx++; visitNext(); return; }

      const { node } = NodeGenerator.nearestNode(_nodes, poi.lat, poi.lng);
      if (!node) { _autoTourIdx++; visitNext(); return; }

      // If we have a current node, walk the path; otherwise jump
      if (_currentNode) {
        const result = Pathfinding.dijkstra(_adj, _currentNode.id, node.id);
        if (result && result.path.length > 1) {
          _activePath = result.path;
          if (_onPathReady) _onPathReady({ ...result, destNode: node });

          let step = 0;
          _walkTimer = setInterval(() => {
            if (!_isAutoTour) { clearInterval(_walkTimer); return; }
            if (step >= result.path.length) {
              clearInterval(_walkTimer);
              _walkTimer = null;
              _autoTourIdx++;
              _autoTimer = setTimeout(visitNext, CONFIG.AUTO_TOUR_DWELL_MS);
              return;
            }
            const n = _nodes.find(x => x.id === result.path[step]);
            if (n) { _currentNode = n; if (_onNodeChange) _onNodeChange(n); }
            step++;
          }, CONFIG.WALK_STEP_INTERVAL_MS);
          return;
        }
      }

      // Jump directly
      visitNode(node);
      _autoTourIdx++;
      _autoTimer = setTimeout(visitNext, CONFIG.AUTO_TOUR_DWELL_MS);
    }

    visitNext();
  }

  function stopAutoTour() {
    _isAutoTour = false;
    stopWalk();
    if (_autoTimer) { clearTimeout(_autoTimer); _autoTimer = null; }
  }

  function isAutoTour() { return _isAutoTour; }

  /* ── Nearest POIs from a node ────────────────────────────────────── */
  function nearestPOIs(node, maxCount = 5, maxDistM = 400) {
    const { haversine } = NodeGenerator;
    return POI_DATA
      .map(poi => ({
        poi,
        distM: haversine([node.lat, node.lng], [poi.lat, poi.lng]),
      }))
      .filter(x => x.distM <= maxDistM)
      .sort((a, b) => a.distM - b.distM)
      .slice(0, maxCount);
  }

  /* ── Ground view scene data for current node ─────────────────────── */
  function sceneDataForNode(node) {
    const pois = nearestPOIs(node, 3, 300);
    return {
      node,
      nearbyPOIs: pois,
      primaryPOI: pois[0]?.poi || null,
    };
  }

  return {
    init,
    visitNode, visitNodeById, currentNode,
    navigateTo,
    walkPath, stopWalk, isWalking,
    startAutoTour, stopAutoTour, isAutoTour,
    nearestPOIs, sceneDataForNode,
  };
})();
