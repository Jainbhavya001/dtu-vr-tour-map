/* ── roadNetwork.js ────────────────────────────────────────────────
   Defines DTU's road segments as ordered arrays of [lat, lng] waypoints.
   The nodeGenerator.js module interpolates navigation nodes along these
   segments at CONFIG.NODE_SPACING_M metre intervals.

   Coordinate system: WGS-84 decimal degrees.
   All coordinates are approximate, based on the DTU campus layout
   (center: 28.7499°N, 77.1182°E — Main Gate on Bawana Road).
────────────────────────────────────────────────────────────────────── */

const ROAD_NETWORK = [

  /* ── PRIMARY ROADS ──────────────────────────────────────────────── */

  {
    id: 'spine',
    name: 'Main Spine Road',
    type: 'primary',   // thicker rendering
    waypoints: [
      [28.74993, 77.11822],  // Gate 1 (main entrance)
      [28.75020, 77.11823],
      [28.75048, 77.11825],
      [28.75075, 77.11826],
      [28.75100, 77.11828],
      [28.75128, 77.11830],
      [28.75155, 77.11833],
      [28.75180, 77.11838],
      [28.75205, 77.11842],
      [28.75218, 77.11845],  // Junction at Main Building
    ],
  },

  {
    id: 'hostel-spine',
    name: 'Hostel Approach Road',
    type: 'primary',
    waypoints: [
      [28.75218, 77.11845],  // Main Building junction
      [28.75240, 77.11845],
      [28.75265, 77.11845],
      [28.75290, 77.11845],
      [28.75312, 77.11847],
      [28.75335, 77.11848],
      [28.75358, 77.11852],
      [28.75382, 77.11856],  // North hostel area
    ],
  },

  {
    id: 'gate2-road',
    name: 'Gate 2 Road',
    type: 'primary',
    waypoints: [
      [28.75312, 77.11847],
      [28.75328, 77.11818],
      [28.75348, 77.11793],
      [28.75368, 77.11772],
      [28.75390, 77.11755],  // Gate 2
    ],
  },

  /* ── ACADEMIC BLOCK ROADS ───────────────────────────────────────── */

  {
    id: 'west-academic-road',
    name: 'West Academic Road',
    type: 'secondary',
    waypoints: [
      [28.75128, 77.11830],  // Junction from spine
      [28.75126, 77.11808],
      [28.75123, 77.11782],
      [28.75120, 77.11756],
      [28.75118, 77.11730],  // IT Block zone
      [28.75115, 77.11704],
    ],
  },

  {
    id: 'cse-it-internal',
    name: 'CSE–IT Internal Road',
    type: 'secondary',
    waypoints: [
      [28.75118, 77.11730],
      [28.75108, 77.11730],
      [28.75095, 77.11730],
      [28.75082, 77.11733],  // CSE Block side
    ],
  },

  {
    id: 'workshop-road',
    name: 'Workshop Road',
    type: 'secondary',
    waypoints: [
      [28.74993, 77.11822],  // Gate 1 area
      [28.74995, 77.11790],
      [28.74998, 77.11760],
      [28.75000, 77.11740],
      [28.75015, 77.11738],
      [28.75033, 77.11737],  // Workshop
    ],
  },

  {
    id: 'south-cross-road',
    name: 'South Cross Road',
    type: 'secondary',
    waypoints: [
      [28.75033, 77.11737],  // Workshop
      [28.75050, 77.11740],
      [28.75068, 77.11745],
      [28.75082, 77.11745],
      [28.75095, 77.11745],
      [28.75108, 77.11745],
    ],
  },

  {
    id: 'academic-cross-north',
    name: 'Academic Cross Road (North)',
    type: 'secondary',
    waypoints: [
      [28.75100, 77.11828],  // Spine junction
      [28.75098, 77.11808],
      [28.75095, 77.11788],
      [28.75092, 77.11765],
      [28.75090, 77.11742],
    ],
  },

  {
    id: 'mech-civil-road',
    name: 'Mechanical–Civil Block Road',
    type: 'secondary',
    waypoints: [
      [28.75075, 77.11826],  // Spine junction
      [28.75075, 77.11848],
      [28.75075, 77.11868],
      [28.75072, 77.11888],  // Mech block area
    ],
  },

  {
    id: 'appsci-road',
    name: 'Applied Sciences Road',
    type: 'secondary',
    waypoints: [
      [28.75100, 77.11828],
      [28.75092, 77.11828],
      [28.75088, 77.11832],
      [28.75088, 77.11852],
      [28.75088, 77.11872],
    ],
  },

  /* ── EAST / LIBRARY / SPORTS ROADS ─────────────────────────────── */

  {
    id: 'library-road',
    name: 'Library Road',
    type: 'secondary',
    waypoints: [
      [28.75218, 77.11845],  // Main Building junction
      [28.75212, 77.11875],
      [28.75205, 77.11905],
      [28.75196, 77.11932],
      [28.75188, 77.11958],  // Central Library
    ],
  },

  {
    id: 'sports-approach',
    name: 'Sports Complex Approach',
    type: 'secondary',
    waypoints: [
      [28.75188, 77.11958],  // Library
      [28.75183, 77.11988],
      [28.75178, 77.12012],
      [28.75175, 77.12035],  // Sports Ground entrance
    ],
  },

  {
    id: 'sports-perimeter-north',
    name: 'Sports Perimeter Road (North)',
    type: 'tertiary',
    waypoints: [
      [28.75175, 77.12035],
      [28.75200, 77.12042],
      [28.75228, 77.12045],
      [28.75255, 77.12040],
      [28.75280, 77.12030],
      [28.75305, 77.12015],
      [28.75328, 77.11998],
      [28.75348, 77.11978],
      [28.75362, 77.11958],
      [28.75372, 77.11935],
      [28.75378, 77.11910],
      [28.75382, 77.11882],  // NE hostel area
    ],
  },

  {
    id: 'gate3-road',
    name: 'Gate 3 Road',
    type: 'primary',
    waypoints: [
      [28.75175, 77.12035],
      [28.75152, 77.12062],
      [28.75125, 77.12082],
      [28.75095, 77.12095],
      [28.75065, 77.12105],
      [28.75035, 77.12110],
      [28.75005, 77.12112],
      [28.74975, 77.12112],
      [28.74945, 77.12112],  // Gate 3
    ],
  },

  /* ── ECE / EE BLOCK ROAD ───────────────────────────────────────── */

  {
    id: 'ece-road',
    name: 'ECE–EE Block Road',
    type: 'secondary',
    waypoints: [
      [28.75155, 77.11833],  // Spine junction
      [28.75152, 77.11852],
      [28.75148, 77.11872],
      [28.75143, 77.11893],
    ],
  },

  /* ── ADMIN / CAFETERIA INTERNAL ─────────────────────────────────── */

  {
    id: 'admin-internal',
    name: 'Admin Block Internal Road',
    type: 'tertiary',
    waypoints: [
      [28.75218, 77.11845],
      [28.75228, 77.11855],
      [28.75238, 77.11868],
      [28.75245, 77.11880],
      [28.75248, 77.11895],
      [28.75245, 77.11908],
      [28.75238, 77.11915],  // Cafeteria / Mess area
    ],
  },

  {
    id: 'auditorium-road',
    name: 'Auditorium Road',
    type: 'tertiary',
    waypoints: [
      [28.75218, 77.11845],
      [28.75228, 77.11845],
      [28.75240, 77.11848],
      [28.75248, 77.11855],
      [28.75248, 77.11862],  // Auditorium / Seminar hall
    ],
  },

  /* ── SOUTH PERIMETER ────────────────────────────────────────────── */

  {
    id: 'south-perimeter',
    name: 'South Perimeter Road',
    type: 'tertiary',
    waypoints: [
      [28.74993, 77.11822],  // Gate 1
      [28.74988, 77.11860],
      [28.74985, 77.11900],
      [28.74985, 77.11940],
      [28.74985, 77.11980],
      [28.74985, 77.12020],
      [28.74985, 77.12060],
      [28.74985, 77.12090],
      [28.74945, 77.12112],  // Gate 3
    ],
  },

  /* ── NORTH PERIMETER (West side) ────────────────────────────────── */

  {
    id: 'north-west-perimeter',
    name: 'North-West Perimeter Road',
    type: 'tertiary',
    waypoints: [
      [28.74993, 77.11822],  // Gate 1
      [28.74998, 77.11795],
      [28.75005, 77.11770],
      [28.75010, 77.11745],
      [28.75015, 77.11720],
      [28.75020, 77.11700],  // West boundary area
      [28.75030, 77.11682],
      [28.75045, 77.11668],
      [28.75065, 77.11658],
      [28.75090, 77.11652],
      [28.75115, 77.11650],
      [28.75140, 77.11652],
      [28.75165, 77.11658],
      [28.75190, 77.11668],
      [28.75210, 77.11680],
      [28.75225, 77.11695],
      [28.75235, 77.11712],
      [28.75240, 77.11730],
      [28.75240, 77.11750],
      [28.75238, 77.11770],
      [28.75235, 77.11790],
      [28.75230, 77.11808],
      [28.75225, 77.11826],
      [28.75218, 77.11845],  // Main Building
    ],
  },

  /* ── CONNECTING ROAD: academic west → Gate 2 area ──────────────── */

  {
    id: 'northwest-internal',
    name: 'North-West Internal Road',
    type: 'tertiary',
    waypoints: [
      [28.75240, 77.11845],  // Hostel spine
      [28.75238, 77.11820],
      [28.75235, 77.11795],
      [28.75232, 77.11770],
      [28.75230, 77.11745],
      [28.75228, 77.11720],
    ],
  },
];
