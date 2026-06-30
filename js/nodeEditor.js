/* ── nodeEditor.js ─────────────────────────────────────────────────
   In-app road network & building position editor.

   Road editing
   ────────────
   • Click on satellite map → adds waypoint to the active road segment
   • Double-click → finishes the current segment, starts a new one
   • Undo → removes the last placed waypoint
   • Segments are visualised as orange dots connected by dashed lines
   • "Copy Road JSON" → generates ROAD_NETWORK format for roadNetwork.js

   Building editing
   ────────────────
   • "Move Buildings" mode makes every POI marker draggable
   • Drag a marker to its true satellite position
   • "Copy Building JSON" → generates entrance[] updates for poiData.js

   Workflow
   ────────
   1. Open editor (Edit button in header)
   2. Zoom to zoom 19-20 on satellite so road edges are crisp
   3. Click along road centrelines to trace each road
   4. Export → paste JSON into js/roadNetwork.js
   5. Switch to "Move Buildings" → drag each icon to building entrance
   6. Export → update entrance: coords in js/poiData.js
────────────────────────────────────────────────────────────────────── */

const NodeEditor = (() => {

  /* ── State ─────────────────────────────────────────────────────── */
  let _map            = null;
  let _drawLayer      = null;   // waypoint dots + lines during draw
  let _refLayer       = null;   // existing ROAD_NETWORK shown as grey reference
  let _active         = false;
  let _subMode        = 'roads';  // 'roads' | 'buildings'

  let _segments       = [];     // [{id, name, waypoints:[lat,lng]}]
  let _curSeg         = null;   // segment currently being drawn

  let _poiMarkers     = new Map();   // poiId → L.Marker (draggable)
  let _updatedPOIs    = new Map();   // poiId → {lat,lng} (dragged position)

  let _onSegUpdate    = null;   // callback → UI refresh

  /* ── Init ──────────────────────────────────────────────────────── */
  function init(map) {
    _map       = map;
    _drawLayer = L.layerGroup().addTo(map);
    _refLayer  = L.layerGroup().addTo(map);
  }

  /* ── Activation ─────────────────────────────────────────────────── */
  function activate(subMode = 'roads') {
    _active  = true;
    _subMode = subMode;

    if (subMode === 'roads') {
      _map.getContainer().style.cursor = 'crosshair';
      // Prevent default Leaflet double-click zoom so we can use it to end segment
      _map.doubleClickZoom.disable();
      _map.on('click',    _onMapClick);
      _map.on('dblclick', _onMapDblClick);
      if (_segments.length === 0) _startNewSegment();
    } else {
      _map.getContainer().style.cursor = 'grab';
      _enableBuildingDrag();
    }
  }

  function deactivate() {
    _active = false;
    _map.getContainer().style.cursor = '';
    _map.doubleClickZoom.enable();
    _map.off('click',    _onMapClick);
    _map.off('dblclick', _onMapDblClick);

    // Clean up incomplete tail segment (< 2 points)
    if (_curSeg && _curSeg.waypoints.length < 2) {
      _segments = _segments.filter(s => s !== _curSeg);
    }
    _curSeg = null;
    _disableBuildingDrag();
    _redraw();
  }

  function setSubMode(mode) {
    // Switch between roads / buildings without full deactivate
    if (mode === _subMode) return;

    if (_subMode === 'roads') {
      _map.getContainer().style.cursor = 'grab';
      _map.off('click',    _onMapClick);
      _map.off('dblclick', _onMapDblClick);
      _map.doubleClickZoom.enable();
      _enableBuildingDrag();
    } else {
      _map.getContainer().style.cursor = 'crosshair';
      _map.doubleClickZoom.disable();
      _map.on('click',    _onMapClick);
      _map.on('dblclick', _onMapDblClick);
      _disableBuildingDrag();
      if (_segments.length === 0 || (_curSeg && _curSeg.waypoints.length >= 2)) {
        _startNewSegment();
      }
    }

    _subMode = mode;
    if (_onSegUpdate) _onSegUpdate(_segments, _updatedPOIs);
  }

  /* ── Road drawing ───────────────────────────────────────────────── */
  function _onMapClick(e) {
    if (!_active || _subMode !== 'roads') return;
    if (!_curSeg) _startNewSegment();
    _curSeg.waypoints.push([e.latlng.lat, e.latlng.lng]);
    _redraw();
    if (_onSegUpdate) _onSegUpdate(_segments, _updatedPOIs);
  }

  function _onMapDblClick(e) {
    if (!_active || _subMode !== 'roads') return;
    L.DomEvent.stop(e);
    if (_curSeg && _curSeg.waypoints.length >= 2) {
      _startNewSegment();   // automatically begin next segment
    }
  }

  function _startNewSegment(name) {
    const seg = {
      id:        name || `road_${_segments.length + 1}`,
      name:      name || `Road Segment ${_segments.length + 1}`,
      type:      'secondary',
      waypoints: [],
    };
    _segments.push(seg);
    _curSeg = seg;
    if (_onSegUpdate) _onSegUpdate(_segments, _updatedPOIs);
  }

  function newSegment() {
    // Drop current segment if it has no waypoints, then start fresh
    if (_curSeg && _curSeg.waypoints.length === 0) {
      _segments = _segments.filter(s => s !== _curSeg);
    }
    _startNewSegment();
  }

  function undoLast() {
    if (!_curSeg) return;
    if (_curSeg.waypoints.length > 0) {
      _curSeg.waypoints.pop();
    } else if (_segments.length > 1) {
      // Remove empty tail segment, go back to previous
      _segments.pop();
      _curSeg = _segments[_segments.length - 1];
    }
    _redraw();
    if (_onSegUpdate) _onSegUpdate(_segments, _updatedPOIs);
  }

  function clearAll() {
    _segments = [];
    _curSeg   = null;
    _redraw();
    if (_active && _subMode === 'roads') _startNewSegment();
    if (_onSegUpdate) _onSegUpdate(_segments, _updatedPOIs);
  }

  function deleteSegment(idx) {
    _segments.splice(idx, 1);
    if (_curSeg && !_segments.includes(_curSeg)) {
      _curSeg = _segments[_segments.length - 1] || null;
    }
    _redraw();
    if (_onSegUpdate) _onSegUpdate(_segments, _updatedPOIs);
  }

  /* ── Visualisation ──────────────────────────────────────────────── */
  function _redraw() {
    _drawLayer.clearLayers();

    _segments.forEach((seg, si) => {
      const isActive = seg === _curSeg;
      const dotColor  = isActive ? '#FF6B35' : '#FFD700';
      const lineColor = isActive ? '#FF6B35' : '#FFD700';

      // Connecting line
      if (seg.waypoints.length >= 2) {
        L.polyline(seg.waypoints, {
          color:     lineColor,
          weight:    2.5,
          opacity:   isActive ? 0.9 : 0.55,
          dashArray: '6 3',
        }).addTo(_drawLayer);
      }

      // Waypoint dots
      seg.waypoints.forEach((pt, pi) => {
        const isFirst = pi === 0, isLast = pi === seg.waypoints.length - 1;
        const r = (isFirst || isLast) ? 5 : 3.5;
        L.circleMarker(pt, {
          radius:      r,
          fillColor:   dotColor,
          color:       '#fff',
          weight:      1.5,
          fillOpacity: 1,
        }).bindTooltip(
          `Seg ${si + 1} · Pt ${pi + 1}<br/>[${pt[0].toFixed(6)}, ${pt[1].toFixed(6)}]`,
          { direction: 'top', opacity: 0.9 }
        ).addTo(_drawLayer);
      });
    });
  }

  /* ── Reference overlay (existing road network) ─────────────────── */
  function showReferenceRoads(roadNetwork) {
    _refLayer.clearLayers();
    for (const seg of roadNetwork) {
      L.polyline(seg.waypoints, {
        color: 'rgba(150,150,150,0.5)',
        weight: 2,
        dashArray: '3 5',
      }).bindTooltip(`REF: ${seg.name}`, { direction: 'top', opacity: 0.8 })
        .addTo(_refLayer);
    }
  }

  function hideReferenceRoads() { _refLayer.clearLayers(); }

  /* ── Building drag ──────────────────────────────────────────────── */
  function _enableBuildingDrag() {
    _poiMarkers.forEach((marker, poiId) => {
      marker.dragging?.enable();
      marker.setOpacity(1);
      marker.on('dragend', () => {
        const ll = marker.getLatLng();
        _updatedPOIs.set(poiId, { lat: ll.lat, lng: ll.lng });
        if (_onSegUpdate) _onSegUpdate(_segments, _updatedPOIs);
      });
    });
  }

  function _disableBuildingDrag() {
    _poiMarkers.forEach(marker => {
      marker.dragging?.disable();
    });
  }

  function registerPoiMarkers(markerMap) {
    // markerMap: Map<poiId, L.Marker> (only the POI markers, not nodes)
    _poiMarkers = markerMap;
  }

  /* ── Segment rename ─────────────────────────────────────────────── */
  function renameSegment(idx, name) {
    if (_segments[idx]) {
      _segments[idx].id   = name.replace(/\s+/g, '-').toLowerCase();
      _segments[idx].name = name;
    }
    if (_onSegUpdate) _onSegUpdate(_segments, _updatedPOIs);
  }

  function setSegmentType(idx, type) {
    if (_segments[idx]) _segments[idx].type = type;
    if (_onSegUpdate) _onSegUpdate(_segments, _updatedPOIs);
  }

  /* ── JSON export ────────────────────────────────────────────────── */
  function exportRoadsJSON() {
    const valid = _segments.filter(s => s.waypoints.length >= 2);
    return JSON.stringify(valid.map(seg => ({
      id:        seg.id,
      name:      seg.name,
      type:      seg.type || 'secondary',
      waypoints: seg.waypoints.map(([la, lo]) => [
        parseFloat(la.toFixed(6)),
        parseFloat(lo.toFixed(6)),
      ]),
    })), null, 2);
  }

  function exportBuildingJSON() {
    const updates = [];
    _updatedPOIs.forEach((pos, poiId) => {
      updates.push({
        id:       poiId,
        entrance: [
          parseFloat(pos.lat.toFixed(6)),
          parseFloat(pos.lng.toFixed(6)),
        ],
        lat: parseFloat(pos.lat.toFixed(6)),
        lng: parseFloat(pos.lng.toFixed(6)),
      });
    });
    return JSON.stringify(updates, null, 2);
  }

  /* ── Callbacks / state ──────────────────────────────────────────── */
  function onUpdate(cb)       { _onSegUpdate = cb; }
  function getSegments()      { return _segments; }
  function getUpdatedPOIs()   { return _updatedPOIs; }
  function isActive()         { return _active; }
  function getSubMode()       { return _subMode; }
  function getSegmentCount()  { return _segments.filter(s => s.waypoints.length >= 2).length; }
  function getBuildingUpdateCount() { return _updatedPOIs.size; }

  return {
    init, activate, deactivate, setSubMode,
    newSegment, undoLast, clearAll, deleteSegment,
    renameSegment, setSegmentType,
    showReferenceRoads, hideReferenceRoads,
    registerPoiMarkers,
    exportRoadsJSON, exportBuildingJSON,
    onUpdate, getSegments, getUpdatedPOIs,
    isActive, getSubMode, getSegmentCount, getBuildingUpdateCount,
  };
})();
