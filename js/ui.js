/* ── ui.js ─────────────────────────────────────────────────────────
   All DOM interaction: search, POI sidebar list, tour panel updates,
   navigation form, modals, toasts, and header button wiring.
────────────────────────────────────────────────────────────────────── */

const UI = (() => {

  /* ── Toast ─────────────────────────────────────────────────────── */
  let _toastTimer = null;
  function toast(msg, type = 'info', ms = 2800) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type}`;
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { el.className = 'toast hidden'; }, ms);
  }

  /* ── Node count chip ────────────────────────────────────────────── */
  function setNodeCount(n) {
    document.getElementById('node-count').textContent = n.toLocaleString();
  }

  /* ── POI Sidebar ────────────────────────────────────────────────── */
  let _activePOIId  = null;
  let _currentFilter = 'all';
  let _onPoiClick   = null;

  function initSidebar(onPoiClick) {
    _onPoiClick = onPoiClick;
    _renderPoiList('all');

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _currentFilter = btn.dataset.cat;
        _renderPoiList(_currentFilter);
      });
    });
  }

  function _renderPoiList(cat) {
    const list = document.getElementById('poi-list');
    const pois = cat === 'all' ? POI_DATA : POI_DATA.filter(p => p.cat === cat);
    list.innerHTML = pois.map(poi => `
      <div class="poi-item ${poi.id === _activePOIId ? 'active' : ''}" data-id="${poi.id}">
        <div class="poi-icon ${poi.cat}">${poi.icon}</div>
        <div class="poi-info">
          <div class="poi-name">${poi.name}</div>
          <div class="poi-desc">${poi.desc}</div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.poi-item').forEach(el => {
      el.addEventListener('click', () => {
        const poi = POI_MAP[el.dataset.id];
        if (poi && _onPoiClick) _onPoiClick(poi);
      });
    });
  }

  function setActivePOI(poiId) {
    _activePOIId = poiId;
    _renderPoiList(_currentFilter);
  }

  /* ── Tour Panel ─────────────────────────────────────────────────── */
  function updateTourPanel(node, sceneData) {
    document.getElementById('tour-location-name').textContent =
      sceneData.primaryPOI ? sceneData.primaryPOI.name : `Node ${node.id}`;
    document.getElementById('tour-node-id').textContent = node.id;

    _showGroundView(node, sceneData);
    _updateNearbyPOIs(node, sceneData.nearbyPOIs);
  }

  function clearTourPanel() {
    document.getElementById('tour-location-name').textContent = 'Select a node to explore';
    document.getElementById('tour-node-id').textContent = '—';
    document.getElementById('gv-placeholder').classList.remove('hidden');
    document.getElementById('gv-active').classList.add('hidden');
    document.getElementById('nearby-pois').innerHTML =
      '<p class="placeholder-text">No location selected</p>';
    document.getElementById('path-info').classList.add('hidden');
  }

  function _showGroundView(node, sceneData) {
    const placeholder = document.getElementById('gv-placeholder');
    const active      = document.getElementById('gv-active');
    const scene       = document.getElementById('gv-scene');

    placeholder.classList.add('hidden');
    active.classList.remove('hidden');

    const poi = sceneData.primaryPOI;
    const buildingColor = poi ? (CAT_COLOR[poi.cat] || '#4FC3F7') : '#4FC3F7';
    const buildingH = 60 + Math.floor(Math.random() * 30); // varied heights
    const buildingH2 = 40 + Math.floor(Math.random() * 20);

    // Synthetic ground-level scene
    scene.innerHTML = `
      <div class="gv-sky">
        ${_starfield()}
        ${poi ? `<div style="
          position:absolute;bottom:0;left:50%;transform:translateX(-50%);
          font-size:11px;color:#8b949e;padding:0 8px;text-align:center;
          background:linear-gradient(transparent,rgba(0,0,0,.6));width:100%;
        ">${poi.name} — ${sceneData.nearbyPOIs[0] ? Math.round(sceneData.nearbyPOIs[0].distM) + 'm away' : ''}</div>` : ''}
      </div>
      <div class="gv-building-wrap" style="height:${buildingH + 20}px;bottom:18px;">
        ${_buildingHTML(buildingH, buildingColor, 44, '0.7')}
        ${poi ? _buildingHTML(buildingH, buildingColor, 55, '1') : ''}
        ${_buildingHTML(buildingH2, buildingColor, 35, '0.5')}
      </div>
      <div class="gv-ground">
        <div class="gv-road"></div>
      </div>
      <div class="gv-label">${poi ? poi.name : 'Campus Road — Node ' + node.id}</div>
    `;

    // Compass: approximate heading towards nearest POI
    if (poi) {
      const bearing = _bearing(node.lat, node.lng, poi.lat, poi.lng);
      const needle = document.getElementById('compass-needle');
      if (needle) needle.style.transform = `rotate(${bearing}deg)`;
    }
  }

  function _starfield() {
    const stars = Array.from({ length: 12 }, () => {
      const x = Math.random() * 100, y = Math.random() * 60;
      const s = 1 + Math.random();
      return `<div style="position:absolute;left:${x}%;top:${y}%;width:${s}px;height:${s}px;background:#fff;border-radius:50%;opacity:${0.3 + Math.random() * 0.5}"></div>`;
    }).join('');
    return `<div style="position:absolute;inset:0;overflow:hidden">${stars}</div>`;
  }

  function _buildingHTML(h, color, w, opacity) {
    const floors = Math.ceil(h / 12);
    const cols   = Math.ceil(w / 9);
    const windows = Array.from({ length: floors * cols }, (_, i) =>
      `<div class="gv-win ${Math.random() > 0.3 ? 'lit' : ''}"></div>`
    ).join('');
    return `
      <div class="gv-building" style="width:${w}px;height:${h}px;opacity:${opacity};border-color:${color}40;">
        <div class="gv-building-windows" style="grid-template-columns:repeat(${cols},1fr)">${windows}</div>
      </div>`;
  }

  /* Approximate bearing between two lat/lng points (degrees, 0=N) */
  function _bearing(lat1, lng1, lat2, lng2) {
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
  }

  function _updateNearbyPOIs(node, nearbyPOIs) {
    const el = document.getElementById('nearby-pois');
    if (!nearbyPOIs.length) {
      el.innerHTML = '<p class="placeholder-text">No landmarks within 400 m</p>';
      return;
    }
    el.innerHTML = nearbyPOIs.map(({ poi, distM }) => `
      <div class="nearby-item" data-id="${poi.id}">
        <div class="nearby-item-icon">${poi.icon}</div>
        <div class="nearby-item-info">
          <div class="nearby-item-name">${poi.name}</div>
          <div class="nearby-item-dist">${Math.round(distM)} m</div>
        </div>
      </div>
    `).join('');

    el.querySelectorAll('.nearby-item').forEach(item => {
      item.addEventListener('click', () => {
        const poi = POI_MAP[item.dataset.id];
        if (poi && _onPoiClick) _onPoiClick(poi);
      });
    });
  }

  /* ── Navigation (dest select + path info) ───────────────────────── */
  function initDestSelect(onNavigate) {
    const sel = document.getElementById('dest-select');
    sel.innerHTML = '<option value="">— Choose destination —</option>' +
      POI_DATA.map(p => `<option value="${p.id}">${p.icon} ${p.name}</option>`).join('');

    document.getElementById('btn-navigate').addEventListener('click', () => {
      const id = sel.value;
      if (id && onNavigate) onNavigate(id);
    });
  }

  function showPathInfo(distM, nodeCount, onWalkClick) {
    const el = document.getElementById('path-info');
    el.classList.remove('hidden');
    document.getElementById('path-distance').textContent = Pathfinding.formatDist(distM);
    document.getElementById('path-nodes').textContent    = nodeCount;

    const walkBtn = document.getElementById('btn-walk-path');
    walkBtn.onclick = onWalkClick;
  }

  function hidePathInfo() {
    document.getElementById('path-info').classList.add('hidden');
  }

  /* ── Search ─────────────────────────────────────────────────────── */
  function initSearch(onSelectResult) {
    const input   = document.getElementById('search-input');
    const dropdown= document.getElementById('search-results');

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { dropdown.classList.add('hidden'); return; }

      const results = POI_DATA.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.cat.toLowerCase().includes(q)
      ).slice(0, CONFIG.SEARCH_MAX_RESULTS);

      if (!results.length) { dropdown.classList.add('hidden'); return; }

      dropdown.innerHTML = results.map(p => `
        <div class="search-item" data-id="${p.id}">
          <span class="search-item-icon">${p.icon}</span>
          <span class="search-item-name">${p.name}</span>
          <span class="search-item-cat">${p.cat}</span>
        </div>
      `).join('');
      dropdown.classList.remove('hidden');

      dropdown.querySelectorAll('.search-item').forEach(el => {
        el.addEventListener('click', () => {
          const poi = POI_MAP[el.dataset.id];
          if (poi) {
            input.value = poi.name;
            dropdown.classList.add('hidden');
            if (onSelectResult) onSelectResult(poi);
          }
        });
      });
    });

    // Close dropdown on outside click
    document.addEventListener('click', e => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }

  /* ── Auto-tour button ───────────────────────────────────────────── */
  function setAutoTourState(active) {
    const btn = document.getElementById('btn-auto-tour');
    if (active) {
      btn.classList.add('touring');
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Stop Tour`;
    } else {
      btn.classList.remove('touring');
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Auto Tour`;
    }
  }

  /* ── Node toggle button ─────────────────────────────────────────── */
  function setNodeToggleState(visible) {
    const btn = document.getElementById('btn-nodes-toggle');
    btn.classList.toggle('active-btn', visible);
  }

  /* ── Editor UI ──────────────────────────────────────────────────── */
  function initEditor(handlers) {
    const {
      onOpen, onClose, onSubMode,
      onNewSeg, onUndo, onClear,
      onLoadRef, onHideRef,
      onDeleteSeg,
      onExportRoads, onExportBldgs,
    } = handlers;

    // Toggle editor open/close
    document.getElementById('btn-editor-toggle').addEventListener('click', () => {
      const isOpen = !document.getElementById('panel-editor').classList.contains('hidden');
      if (isOpen) onClose(); else onOpen();
      const btn = document.getElementById('btn-editor-toggle');
      btn.classList.toggle('active-btn', !isOpen);
    });

    document.getElementById('btn-editor-close').addEventListener('click', () => {
      onClose();
      document.getElementById('btn-editor-toggle').classList.remove('active-btn');
    });

    // Sub-mode tabs (Draw Roads / Move Buildings)
    document.querySelectorAll('.editor-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.dataset.mode;
        onSubMode(mode);

        const roadsPanel = document.getElementById('editor-roads-panel');
        const bldgsPanel = document.getElementById('editor-buildings-panel');
        const hint       = document.getElementById('editor-hint');

        if (mode === 'roads') {
          roadsPanel.classList.remove('hidden');
          bldgsPanel.classList.add('hidden');
          hint.classList.remove('hidden');
        } else {
          roadsPanel.classList.add('hidden');
          bldgsPanel.classList.remove('hidden');
          hint.classList.add('hidden');
          hint.textContent = '';
        }
      });
    });

    // Road controls
    document.getElementById('btn-ed-new-seg').addEventListener('click', onNewSeg);
    document.getElementById('btn-ed-undo').addEventListener('click', onUndo);
    document.getElementById('btn-ed-clear').addEventListener('click', () => {
      if (confirm('Clear all drawn segments?')) onClear();
    });

    // Reference road overlay
    const loadRefBtn = document.getElementById('btn-ed-load-ref');
    const hideRefBtn = document.getElementById('btn-ed-hide-ref');
    loadRefBtn.addEventListener('click', () => {
      onLoadRef();
      loadRefBtn.classList.add('hidden');
      hideRefBtn.classList.remove('hidden');
      toast('Showing existing road network as grey reference');
    });
    hideRefBtn.addEventListener('click', () => {
      onHideRef();
      hideRefBtn.classList.add('hidden');
      loadRefBtn.classList.remove('hidden');
    });

    // Export buttons
    document.getElementById('btn-ed-export-roads').addEventListener('click', onExportRoads);
    document.getElementById('btn-ed-export-bldgs').addEventListener('click', onExportBldgs);

    // JSON box copy/close
    document.getElementById('btn-ed-copy-json').addEventListener('click', () => {
      const txt = document.getElementById('editor-json-output').value;
      const fallback = () => {
        const ta = document.getElementById('editor-json-output');
        ta.select();
        document.execCommand('copy');
        toast('Copied to clipboard!', 'success');
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(txt)
          .then(() => toast('Copied to clipboard!', 'success'))
          .catch(fallback);
      } else {
        fallback();
      }
    });
    document.getElementById('btn-ed-close-json').addEventListener('click', () => {
      document.getElementById('editor-json-box').classList.add('hidden');
    });
  }

  function refreshEditorSegList(segments, currentSubMode) {
    const list     = document.getElementById('editor-seg-list');
    const countEl  = document.getElementById('ed-seg-count');
    const valid    = segments.filter(s => s.waypoints.length >= 2);
    const current  = segments[segments.length - 1];

    countEl.textContent = `${valid.length} valid`;

    if (segments.length === 0 || (segments.length === 1 && segments[0].waypoints.length === 0)) {
      list.innerHTML = '<p class="placeholder-text">No segments yet — click on roads</p>';
      return;
    }

    list.innerHTML = segments.map((seg, i) => {
      const isCur  = seg === current;
      const dotCol = isCur ? '#FF6B35' : (seg.waypoints.length >= 2 ? '#3fb950' : '#8b949e');
      return `
        <div class="editor-seg-item ${isCur ? 'current-seg' : ''}">
          <div class="seg-dot" style="background:${dotCol}"></div>
          <div class="seg-name">${seg.name}</div>
          <div class="seg-pts">${seg.waypoints.length} pts</div>
          <button class="seg-del" data-idx="${i}" title="Delete segment">✕</button>
        </div>`;
    }).join('');

    list.querySelectorAll('.seg-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // onDeleteSeg is wired in main.js via UI.initEditor handler
        btn.dispatchEvent(new CustomEvent('editor-delete-seg', {
          detail: { idx: parseInt(btn.dataset.idx) },
          bubbles: true,
        }));
      });
    });

    // Wire delete via event delegation on list
    if (!list._delWired) {
      list._delWired = true;
      list.addEventListener('editor-delete-seg', e => {
        if (window._editorDeleteSeg) window._editorDeleteSeg(e.detail.idx);
      });
    }
  }

  function refreshEditorBldgList(updatedPOIs) {
    const countEl = document.getElementById('ed-bldg-count');
    const listEl  = document.getElementById('editor-bldg-list');
    countEl.textContent = `${updatedPOIs.size} moved`;

    if (updatedPOIs.size === 0) {
      listEl.innerHTML = '<p class="placeholder-text">Drag building icons on the map to reposition them</p>';
      return;
    }

    let html = '';
    updatedPOIs.forEach((pos, poiId) => {
      const poi = POI_MAP[poiId];
      html += `
        <div class="editor-bldg-item bldg-moved">
          <div class="bldg-icon">${poi ? poi.icon : '📍'}</div>
          <div class="bldg-name">${poi ? poi.short : poiId}</div>
          <div class="bldg-coords">${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}</div>
        </div>`;
    });
    listEl.innerHTML = html;
  }

  function showEditorJSON(json, label, hint) {
    const box    = document.getElementById('editor-json-box');
    const output = document.getElementById('editor-json-output');
    const lbl    = document.getElementById('editor-json-label');
    const hintEl = document.getElementById('editor-json-hint');

    output.value = json;
    lbl.textContent = label;
    hintEl.textContent = hint;
    box.classList.remove('hidden');
    output.focus();
    output.select();
  }

  return {
    toast, setNodeCount,
    initSidebar, setActivePOI,
    updateTourPanel, clearTourPanel,
    initDestSelect, showPathInfo, hidePathInfo,
    initSearch,
    setAutoTourState, setNodeToggleState,
    initEditor, refreshEditorSegList, refreshEditorBldgList, showEditorJSON,
  };
})();
