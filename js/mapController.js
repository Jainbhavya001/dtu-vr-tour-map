/* ── mapController.js ──────────────────────────────────────────────
   Manages the Leaflet map: tile layers, navigation node circles,
   building-entrance diamond nodes, POI markers, path overlays.

   Tile cycle (layer-toggle button):  satellite → street → satellite
   Road nodes    → small cyan circle (4 px)
   Building nodes → coloured diamond (10 px, category colour, white border)
   Active node   → orange circle (8 px)
────────────────────────────────────────────────────────────────────── */

const MapController = (() => {

  let _map          = null;
  let _nodeLayer    = null;
  let _poiLayer     = null;
  let _pathLayer    = null;
  let _roadLayer    = null;
  let _labelLayer   = null;   // Esri road-labels overlay (on top of satellite)

  let _tileSatellite = null;
  let _tileStreet    = null;
  // 'satellite' | 'street'
  let _currentTile   = 'satellite';

  let _nodes        = [];
  let _nodeMarkers  = new Map();   // nodeId → Leaflet layer
  let _activeId     = null;
  let _nodesVisible = true;

  let _onNodeClick  = null;

  /* ── Init ──────────────────────────────────────────────────────── */
  function init(containerId) {
    _map = L.map(containerId, {
      center:           CONFIG.MAP_CENTER,
      zoom:             CONFIG.MAP_ZOOM_DEFAULT,
      zoomControl:      false,
      attributionControl: true,
      preferCanvas:     true,
    });

    // ── Default: Esri satellite imagery ────────────────────────────
    _tileSatellite = L.tileLayer(CONFIG.TILE_SATELLITE.url, {
      attribution:   CONFIG.TILE_SATELLITE.attribution,
      maxZoom:       CONFIG.TILE_SATELLITE.maxZoom,
      maxNativeZoom: CONFIG.TILE_SATELLITE.maxNativeZoom,
    }).addTo(_map);

    // Road label overlay on satellite
    _labelLayer = L.tileLayer(CONFIG.TILE_SATELLITE_LABELS.url, {
      attribution:   '',
      maxZoom:       CONFIG.TILE_SATELLITE_LABELS.maxZoom,
      maxNativeZoom: CONFIG.TILE_SATELLITE_LABELS.maxNativeZoom,
      opacity:       CONFIG.TILE_SATELLITE_LABELS.opacity,
    }).addTo(_map);

    // Street map (loaded lazily on first toggle)
    _tileStreet = L.tileLayer(CONFIG.TILE_OSM.url, {
      attribution:   CONFIG.TILE_OSM.attribution,
      maxZoom:       CONFIG.TILE_OSM.maxZoom,
      maxNativeZoom: CONFIG.TILE_OSM.maxNativeZoom,
    });

    // Layer groups (order = draw order, last = top)
    _roadLayer  = L.layerGroup().addTo(_map);
    _nodeLayer  = L.layerGroup().addTo(_map);
    _pathLayer  = L.layerGroup().addTo(_map);
    _poiLayer   = L.layerGroup().addTo(_map);

    return _map;
  }

  /* ── Tile layer toggle (satellite ↔ street) ────────────────────── */
  function toggleLayer() {
    if (_currentTile === 'satellite') {
      _map.removeLayer(_tileSatellite);
      if (_labelLayer) _map.removeLayer(_labelLayer);
      _tileStreet.addTo(_map);
      _tileStreet.bringToBack();
      _currentTile = 'street';
    } else {
      _map.removeLayer(_tileStreet);
      _tileSatellite.addTo(_map);
      _tileSatellite.bringToBack();
      if (_labelLayer) { _labelLayer.addTo(_map); }
      _currentTile = 'satellite';
    }
    // Keep overlays on top
    _roadLayer.bringToFront();
    _nodeLayer.bringToFront();
    _pathLayer.bringToFront();
    _poiLayer.bringToFront();
    return true;
  }

  function getCurrentTile() { return _currentTile; }

  /* ── Road segment lines ─────────────────────────────────────────── */
  function drawRoads(roadNetwork) {
    _roadLayer.clearLayers();
    for (const seg of roadNetwork) {
      // On satellite the roads are already visible; draw a subtle tint
      // so users can see which roads have nav nodes.
      const color  = seg.type === 'primary'   ? 'rgba(79,195,247,0.30)'
                   : seg.type === 'secondary' ? 'rgba(79,195,247,0.18)'
                   : 'rgba(79,195,247,0.10)';
      const weight = seg.type === 'primary' ? 5
                   : seg.type === 'secondary' ? 3
                   : 2;
      L.polyline(seg.waypoints, {
        color, weight, opacity: 1, smoothFactor: 1,
      }).addTo(_roadLayer);
    }
  }

  /* ── Navigation nodes ───────────────────────────────────────────── */
  function renderNodes(nodes, onClickCb) {
    _nodes = nodes;
    _onNodeClick = onClickCb;
    _nodeMarkers.clear();
    _nodeLayer.clearLayers();

    for (const node of nodes) {
      const marker = node.isBuildingNode
        ? _makeBuildingNode(node, false)
        : _makeRoadNode(node, false);
      marker.addTo(_nodeLayer);
      _nodeMarkers.set(node.id, marker);
    }
  }

  /* Small cyan circle — road interpolation node */
  function _makeRoadNode(node, isActive) {
    const c = L.circleMarker([node.lat, node.lng], {
      radius:      isActive ? CONFIG.NODE_RADIUS_ACTIVE_PX : CONFIG.NODE_RADIUS_PX,
      fillColor:   isActive ? CONFIG.NODE_COLOR_ACTIVE     : CONFIG.NODE_COLOR,
      color:       isActive ? '#fff' : 'rgba(255,255,255,0.25)',
      weight:      isActive ? 2 : 0.5,
      fillOpacity: isActive ? 1 : CONFIG.NODE_OPACITY,
      className:   'node-circle',
    });

    c.bindTooltip(
      `<span style="font-size:11px;color:#8b949e">${node.segmentName} · ${node.id}</span>`,
      { direction: 'top', offset: [0, -5], opacity: 0.9 }
    );
    c.on('click', () => { if (_onNodeClick) _onNodeClick(node); });
    return c;
  }

  /* Coloured diamond — building entrance node */
  function _makeBuildingNode(node, isActive) {
    const poi   = node.poiId ? POI_MAP[node.poiId] : null;
    const color = poi ? (CAT_COLOR[poi.cat] || '#FFD700') : '#FFD700';
    const size  = isActive ? 16 : 12;
    const border= isActive ? '3px solid #fff' : '2px solid rgba(255,255,255,0.85)';
    const glow  = isActive ? `box-shadow:0 0 10px ${color},0 0 20px ${color}80` : `box-shadow:0 0 6px ${color}80`;

    const html = `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${border};
      border-radius:2px;
      transform:rotate(45deg);
      ${glow};
      cursor:pointer;
    "></div>`;

    const icon = L.divIcon({
      html,
      iconSize:   [size, size],
      iconAnchor: [size / 2, size / 2],
      className:  '',
    });

    const marker = L.marker([node.lat, node.lng], { icon, zIndexOffset: 50 });
    marker.bindTooltip(
      `<b style="color:${color}">${poi ? poi.icon + ' ' + poi.name : node.id}</b><br/>
       <span style="font-size:11px;color:#8b949e">Building entrance node</span>`,
      { direction: 'top', offset: [0, -8], opacity: 0.95 }
    );
    marker.on('click', () => { if (_onNodeClick) _onNodeClick(node); });
    return marker;
  }

  /* Update styling of active node */
  function setActiveNode(nodeId) {
    // Reset previous
    if (_activeId !== null && _nodeMarkers.has(_activeId)) {
      const prevNode = _nodes.find(n => n.id === _activeId);
      if (prevNode) {
        const fresh = prevNode.isBuildingNode
          ? _makeBuildingNode(prevNode, false)
          : _makeRoadNode(prevNode, false);
        _nodeLayer.removeLayer(_nodeMarkers.get(_activeId));
        fresh.addTo(_nodeLayer);
        _nodeMarkers.set(_activeId, fresh);
      }
    }

    _activeId = nodeId;

    if (nodeId && _nodeMarkers.has(nodeId)) {
      const node = _nodes.find(n => n.id === nodeId);
      if (node) {
        const fresh = node.isBuildingNode
          ? _makeBuildingNode(node, true)
          : _makeRoadNode(node, true);
        _nodeLayer.removeLayer(_nodeMarkers.get(nodeId));
        fresh.addTo(_nodeLayer);
        fresh.bringToFront?.();
        _nodeMarkers.set(nodeId, fresh);
      }
    }
  }

  function toggleNodes(visible) {
    _nodesVisible = visible;
    if (visible) _nodeLayer.addTo(_map);
    else _map.removeLayer(_nodeLayer);
  }

  function areNodesVisible() { return _nodesVisible; }

  /* ── POI markers ────────────────────────────────────────────────── */
  const _poiMarkerMap = new Map(); // poiId → L.Marker

  function renderPOIs(pois, onClickCb) {
    _poiLayer.clearLayers();
    _poiMarkerMap.clear();
    for (const poi of pois) {
      const m = _makePoiMarker(poi);
      m.on('click', () => { if (onClickCb) onClickCb(poi); });
      m.addTo(_poiLayer);
      _poiMarkerMap.set(poi.id, m);
    }
  }

  function getPoiMarkerMap() { return _poiMarkerMap; }

  function setMarkersEditable(editable) {
    _poiMarkerMap.forEach(marker => {
      if (editable) {
        marker.dragging?.enable();
        marker.getElement()?.classList.add('poi-drag-ring');
      } else {
        marker.dragging?.disable();
        marker.getElement()?.classList.remove('poi-drag-ring');
      }
    });
  }

  function _makePoiMarker(poi) {
    const color = CAT_COLOR[poi.cat] || '#4FC3F7';
    const html  = `<div style="
      background:${color}22;
      border:1.5px solid ${color};
      border-radius:50%;
      width:28px;height:28px;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;
      box-shadow:0 2px 10px rgba(0,0,0,.6);
      cursor:pointer;
    ">${poi.icon}</div>`;

    const icon = L.divIcon({ html, iconSize: [28, 28], iconAnchor: [14, 14], className: '' });
    const m    = L.marker([poi.lat, poi.lng], { icon, zIndexOffset: 200 });
    m.bindTooltip(
      `<b>${poi.name}</b><br/><span style="color:#8b949e;font-size:11px">${poi.desc}</span>`,
      { direction: 'top', offset: [0, -15], opacity: 0.95 }
    );
    return m;
  }

  /* ── Path overlay ───────────────────────────────────────────────── */
  function drawPath(nodes, pathNodeIds) {
    _pathLayer.clearLayers();
    const latlngs = pathNodeIds
      .map(id => nodes.find(n => n.id === id))
      .filter(Boolean)
      .map(n => [n.lat, n.lng]);
    if (latlngs.length < 2) return;

    L.polyline(latlngs, {
      color: CONFIG.PATH_COLOR, weight: CONFIG.PATH_WEIGHT,
      opacity: 0.9, dashArray: '6 4',
    }).addTo(_pathLayer);
  }

  function clearPath() { _pathLayer.clearLayers(); }

  function animateWalker(nodes, pathNodeIds, stepCb) {
    let i = 0;
    return setInterval(() => {
      if (i >= pathNodeIds.length) return;
      const node = nodes.find(n => n.id === pathNodeIds[i]);
      if (node && stepCb) stepCb(node, i, pathNodeIds.length);
      i++;
    }, CONFIG.WALK_STEP_INTERVAL_MS);
  }

  /* ── Camera helpers ─────────────────────────────────────────────── */
  function flyTo(lat, lng, zoom) {
    _map.flyTo([lat, lng], zoom || _map.getZoom(), { duration: 0.8 });
  }

  function panTo(lat, lng) {
    _map.panTo([lat, lng], { animate: true, duration: 0.5 });
  }

  function zoomIn()  { _map.zoomIn(); }
  function zoomOut() { _map.zoomOut(); }
  function recenter() {
    _map.flyTo(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM_DEFAULT, { duration: 1 });
  }

  function getMap() { return _map; }

  return {
    init, toggleLayer, getCurrentTile,
    drawRoads,
    renderNodes, setActiveNode, toggleNodes, areNodesVisible,
    renderPOIs, getPoiMarkerMap, setMarkersEditable,
    drawPath, clearPath, animateWalker,
    flyTo, panTo, zoomIn, zoomOut, recenter,
    getMap,
  };
})();
