/* ── main.js ───────────────────────────────────────────────────────
   Application entry point.
   Initialises all modules in dependency order and wires event flow.
────────────────────────────────────────────────────────────────────── */

(function init() {

  /* ── Event handlers (declared first so they're in scope for callbacks) */

  function onNodeClick(node) {
    TourController.visitNode(node);
    MapController.flyTo(node.lat, node.lng);
  }

  function onPoiClick(poi) {
    const { node } = NodeGenerator.nearestNode(nodes, poi.lat, poi.lng);
    if (node) {
      TourController.visitNode(node);
      MapController.flyTo(poi.lat, poi.lng, 19);
    }
    UI.setActivePOI(poi.id);
    UI.toast(`${poi.icon} ${poi.name}`, 'info');
  }

  function onDestNavigate(poiId) {
    if (!TourController.currentNode()) {
      UI.toast('Click a node on the map first to set your starting point', 'error');
      return;
    }
    const result = TourController.navigateTo(poiId);
    if (!result) {
      UI.toast('No path found — start node may be isolated', 'error');
    }
  }

  function openEditor() {
    NodeEditor.activate('roads');
    document.getElementById('editor-hint').classList.remove('hidden');
    document.getElementById('panel-tour').classList.add('hidden');
    document.getElementById('panel-editor').classList.remove('hidden');
  }

  function closeEditor() {
    NodeEditor.deactivate();
    MapController.setMarkersEditable(false);
    document.getElementById('editor-hint').classList.add('hidden');
    document.getElementById('panel-tour').classList.remove('hidden');
    document.getElementById('panel-editor').classList.add('hidden');
  }

  function onEditorUpdate(segments, updatedPOIs) {
    UI.refreshEditorSegList(segments, NodeEditor.isActive() ? NodeEditor.getSubMode() : 'roads');
    UI.refreshEditorBldgList(updatedPOIs);
  }

  function handleNodeChange(node) {
    MapController.setActiveNode(node.id);
    const sceneData = TourController.sceneDataForNode(node);
    UI.updateTourPanel(node, sceneData);
    if (sceneData.primaryPOI) UI.setActivePOI(sceneData.primaryPOI.id);
  }

  function handlePathReady({ path, distM, destNode }) {
    MapController.drawPath(nodes, path);
    UI.showPathInfo(distM, path.length, () => {
      TourController.walkPath();
      UI.toast(`Walking path: ${Pathfinding.formatDist(distM)}`, 'info');
    });
  }

  function handleWalkStep(node, stepIdx, total) {
    MapController.panTo(node.lat, node.lng);
  }

  function handleWalkComplete() {
    UI.toast('Arrived at destination!', 'success');
    UI.hidePathInfo();
    MapController.clearPath();
  }

  /* ── Variable declarations referenced in handlers above ───────── */
  let nodes;

  /* ── Startup (wrapped in try-catch to surface errors visually) ── */
  try {

    /* ── 1. Generate navigation nodes ─────────────────────────────── */
    nodes = NodeGenerator.generate(
      ROAD_NETWORK,
      POI_DATA,
      CONFIG.NODE_SPACING_M,
      CONFIG.NODE_MERGE_RADIUS,
    );

    console.info(`[DTU Tour] Generated ${nodes.length} navigation nodes.`);

    /* ── 2. Build navigation graph ─────────────────────────────────── */
    const { adj, nodeMap } = Graph.build(nodes);

    /* ── 3. Init Leaflet map (Esri satellite, no key needed) ────────── */
    MapController.init('map');
    MapController.drawRoads(ROAD_NETWORK);
    MapController.renderNodes(nodes, onNodeClick);
    MapController.renderPOIs(POI_DATA, onPoiClick);

    /* ── 4. Init Tour controller ─────────────────────────────────────── */
    TourController.init(nodes, adj, {
      onNodeChange:   handleNodeChange,
      onPathReady:    handlePathReady,
      onWalkStep:     handleWalkStep,
      onWalkComplete: handleWalkComplete,
      onAutoTourEnd:  () => { UI.setAutoTourState(false); UI.toast('Auto-tour complete', 'success'); },
    });

    /* ── 5. Init UI ───────────────────────────────────────────────────── */
    UI.setNodeCount(nodes.length);
    UI.initSidebar(onPoiClick);
    UI.initSearch(onPoiClick);
    UI.initDestSelect(onDestNavigate);

    /* ── 5b. Init node editor ────────────────────────────────────────── */
    NodeEditor.init(MapController.getMap());
    NodeEditor.onUpdate(onEditorUpdate);
    UI.initEditor({
      onOpen:        openEditor,
      onClose:       closeEditor,
      onSubMode:     (mode) => {
        NodeEditor.setSubMode(mode);
        if (mode === 'buildings') {
          MapController.setMarkersEditable(true);
          NodeEditor.registerPoiMarkers(MapController.getPoiMarkerMap());
        } else {
          MapController.setMarkersEditable(false);
        }
      },
      onNewSeg:      () => NodeEditor.newSegment(),
      onUndo:        () => NodeEditor.undoLast(),
      onClear:       () => NodeEditor.clearAll(),
      onLoadRef:     () => { NodeEditor.showReferenceRoads(ROAD_NETWORK); return true; },
      onHideRef:     () => NodeEditor.hideReferenceRoads(),
      onDeleteSeg:   (i) => NodeEditor.deleteSegment(i),

      onExportRoads: () => {
        const json = NodeEditor.exportRoadsJSON();
        UI.showEditorJSON(json,
          'Road JSON — paste as the array into js/roadNetwork.js',
          '// Replace the ROAD_NETWORK array body with this content');
      },
      onExportBldgs: () => {
        const json = NodeEditor.exportBuildingJSON();
        UI.showEditorJSON(json,
          'Building JSON — update entrance: in each POI in js/poiData.js',
          '// Find each id below and update its entrance: and lat/lng fields');
      },
    });

    /* ── 6. Wire header / map control buttons ─────────────────────────── */
    document.getElementById('btn-zoom-in')
      .addEventListener('click', () => MapController.zoomIn());

    document.getElementById('btn-zoom-out')
      .addEventListener('click', () => MapController.zoomOut());

    document.getElementById('btn-recenter')
      .addEventListener('click', () => MapController.recenter());

    document.getElementById('btn-nodes-toggle')
      .addEventListener('click', () => {
        const v = !MapController.areNodesVisible();
        MapController.toggleNodes(v);
        UI.setNodeToggleState(v);
        UI.toast(v ? 'Navigation nodes shown' : 'Navigation nodes hidden');
      });

    document.getElementById('btn-layer-toggle')
      .addEventListener('click', () => {
        MapController.toggleLayer();
        const tile = MapController.getCurrentTile();
        UI.toast(tile === 'satellite' ? 'Satellite view' : 'Street map view');
      });

    document.getElementById('btn-auto-tour')
      .addEventListener('click', () => {
        if (TourController.isAutoTour()) {
          TourController.stopAutoTour();
          UI.setAutoTourState(false);
          MapController.clearPath();
          UI.hidePathInfo();
          UI.toast('Auto-tour stopped');
        } else {
          const poiOrder = [
            'gate1', 'workshop', 'cse-block', 'it-block',
            'applied-sci', 'mech-block', 'civil-block', 'main-building',
            'auditorium', 'cafeteria', 'library', 'ece-block', 'ee-block',
            'biotechnology', 'health-centre', 'himadri', 'karakoram',
            'nilgiri', 'satpura', 'aravalli', 'gate2',
            'sports-ground', 'cricket-ground', 'gym', 'gate3',
          ];
          TourController.startAutoTour(poiOrder);
          UI.setAutoTourState(true);
          UI.toast('Auto-tour started — visiting all campus locations', 'info');
        }
      });

    // Global bridge for segment delete (event delegation in ui.js)
    window._editorDeleteSeg = (idx) => NodeEditor.deleteSegment(idx);

    /* ── Snap to Gate 1 on first load ───────────────────────────────── */
    setTimeout(() => {
      const gate = POI_MAP['gate1'];
      if (gate) {
        const { node } = NodeGenerator.nearestNode(nodes, gate.lat, gate.lng);
        if (node) TourController.visitNode(node);
      }
    }, 600);

  } catch (err) {
    console.error('[DTU Tour] Startup error:', err);
    document.body.innerHTML =
      '<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;' +
      'background:#0d1117;font-family:monospace;color:#f85149;padding:40px">' +
        '<div style="max-width:700px;width:100%">' +
          '<h2 style="margin-bottom:16px">DTU Tour - Startup Error</h2>' +
          '<pre style="background:#161b22;border:1px solid #30363d;border-radius:8px;' +
          'padding:16px;overflow:auto;font-size:12px;color:#e6edf3;white-space:pre-wrap">' +
          (err.stack || err.message) +
          '</pre>' +
          '<p style="margin-top:16px;color:#8b949e;font-size:13px">' +
          'Open the browser console (F12) for details. ' +
          'Serve via HTTP — do not open index.html directly via file://.' +
          '</p>' +
        '</div>' +
      '</div>';
  }

})();
