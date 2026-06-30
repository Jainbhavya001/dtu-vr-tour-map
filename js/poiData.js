/* ── poiData.js ────────────────────────────────────────────────────
   All Points of Interest on the DTU campus.

   Fields:
     id          – unique string identifier
     name        – display name
     short       – abbreviated name
     cat         – 'academic' | 'hostel' | 'facility' | 'gate' | 'sports'
     lat/lng     – building centre (for the POI marker icon)
     entrance    – [lat, lng] point ON the road at the building entrance
                   → this is where the single building navigation node is placed
     desc        – one-line description
     details     – longer paragraph for the tour panel
     icon        – emoji icon
     color       – accent colour (auto-derived from cat if omitted)
────────────────────────────────────────────────────────────────────── */

const POI_DATA = [

  /* ── Gates ─────────────────────────────────────────────────────── */
  {
    id: 'gate1', name: 'Main Gate (Gate 1)', short: 'Gate 1',
    cat: 'gate', lat: 28.74993, lng: 77.11822,
    entrance: [28.74993, 77.11822],   // gate IS on the road
    icon: '🚪',
    desc: 'Main entrance on Bawana Road',
    details: 'Principal entrance to DTU from Bawana Road (NH-709B). Security check is mandatory for all visitors. Auto-rickshaws and cabs drop off here.',
  },
  {
    id: 'gate2', name: 'Gate 2 (North Gate)', short: 'Gate 2',
    cat: 'gate', lat: 28.75392, lng: 77.11753,
    entrance: [28.75392, 77.11753],
    icon: '🚪',
    desc: 'North exit towards Rohini',
    details: 'Secondary gate towards Rohini Sector 22. Often used by hostel residents. Opens during specific hours; closed at night.',
  },
  {
    id: 'gate3', name: 'Gate 3 (East Gate)', short: 'Gate 3',
    cat: 'gate', lat: 28.74942, lng: 77.12115,
    entrance: [28.74942, 77.12115],
    icon: '🚪',
    desc: 'East gate near sports complex',
    details: 'East-facing gate primarily used for sports-ground access and cultural event days.',
  },

  /* ── Academic Blocks ────────────────────────────────────────────── */
  {
    id: 'main-building', name: 'Main Building (Admin Block)', short: 'Admin',
    cat: 'academic', lat: 28.75225, lng: 77.11850,
    entrance: [28.75218, 77.11840],   // on the main spine road
    icon: '🏛️',
    desc: 'University administration headquarters',
    details: 'The iconic Main Building houses the Vice-Chancellor\'s office, examination branch, accounts, and all central administrative offices. The fountain plaza in front is the social heart of the campus.',
  },
  {
    id: 'cse-block', name: 'CSE Block', short: 'CSE',
    cat: 'academic', lat: 28.75105, lng: 77.11715,
    entrance: [28.75118, 77.11730],   // on west-academic road, in front of CSE
    icon: '💻',
    desc: 'Computer Science & Engineering',
    details: 'Houses the CSE Department — DTU\'s most competitive branch. Labs include HPC clusters, deep-learning workstations, networking labs, and AI research centres.',
  },
  {
    id: 'it-block', name: 'IT Block', short: 'IT',
    cat: 'academic', lat: 28.75122, lng: 77.11692,
    entrance: [28.75118, 77.11704],   // on west-academic road, in front of IT
    icon: '🖥️',
    desc: 'Information Technology Department',
    details: 'IT Department with state-of-the-art computing labs. Adjacent to CSE, sharing the software-lab building and the open-air seating area between them.',
  },
  {
    id: 'ece-block', name: 'ECE Block', short: 'ECE',
    cat: 'academic', lat: 28.75140, lng: 77.11895,
    entrance: [28.75148, 77.11870],   // on ece-road
    icon: '📡',
    desc: 'Electronics & Communication Engineering',
    details: 'ECE Department with VLSI labs, signal-processing labs, and an anechoic chamber for antenna research. Frequently holds IEEE student chapter events.',
  },
  {
    id: 'ee-block', name: 'EE Block', short: 'EE',
    cat: 'academic', lat: 28.75168, lng: 77.11865,
    entrance: [28.75162, 77.11840],   // on main spine, east side
    icon: '⚡',
    desc: 'Electrical Engineering Department',
    details: 'Electrical Engineering block featuring high-voltage labs, power-systems simulation, renewable energy testbeds, and a smart-grid research facility.',
  },
  {
    id: 'mech-block', name: 'Mechanical Block', short: 'Mech',
    cat: 'academic', lat: 28.75078, lng: 77.11890,
    entrance: [28.75075, 77.11868],   // on mech-civil road
    icon: '⚙️',
    desc: 'Mechanical Engineering Department',
    details: 'Mechanical Engineering block with CNC machines, fluid-mechanics labs, thermal-engineering labs, and a CAD/CAM centre.',
  },
  {
    id: 'civil-block', name: 'Civil Block', short: 'Civil',
    cat: 'academic', lat: 28.75065, lng: 77.11845,
    entrance: [28.75075, 77.11848],   // on mech-civil road
    icon: '🏗️',
    desc: 'Civil Engineering Department',
    details: 'Civil Engineering block housing geotechnical, structural, and environmental-engineering labs with a concrete-testing facility and surveying equipment.',
  },
  {
    id: 'applied-sci', name: 'Applied Sciences Block', short: 'Appl.Sci',
    cat: 'academic', lat: 28.75088, lng: 77.11810,
    entrance: [28.75090, 77.11828],   // on the main spine
    icon: '🔬',
    desc: 'Mathematics, Physics & Chemistry',
    details: 'Departments of Applied Mathematics, Physics, and Chemistry. Core science labs for all first-year students. Also houses the Department of Humanities & Social Sciences.',
  },
  {
    id: 'workshop', name: 'Central Workshop', short: 'Workshop',
    cat: 'academic', lat: 28.75030, lng: 77.11730,
    entrance: [28.75033, 77.11737],   // end of workshop-road
    icon: '🔧',
    desc: 'Manufacturing & machining practice centre',
    details: 'All engineering students complete mandatory workshop training here. Sections include lathes, milling, welding, carpentry, foundry, and sheet-metal work.',
  },
  {
    id: 'biotechnology', name: 'Biotechnology Block', short: 'BioTech',
    cat: 'academic', lat: 28.75152, lng: 77.11810,
    entrance: [28.75155, 77.11833],   // on main spine
    icon: '🧬',
    desc: 'Biotechnology & Biomedical Engineering',
    details: 'State-of-the-art biotechnology labs with PCR facilities, cell-culture rooms, ELISA workstations, and biomedical imaging equipment.',
  },

  /* ── Library & Facilities ───────────────────────────────────────── */
  {
    id: 'library', name: 'Central Library', short: 'Library',
    cat: 'facility', lat: 28.75192, lng: 77.11968,
    entrance: [28.75188, 77.11958],   // on library-road
    icon: '📚',
    desc: 'Central university library with digital resources',
    details: 'DTU Central Library spans four floors with over 1,00,000 volumes. Offers 24-hour reading rooms during exams, IEEE & Springer digital access, and OPAC catalogue terminals.',
  },
  {
    id: 'cafeteria', name: 'Main Cafeteria / Mess', short: 'Canteen',
    cat: 'facility', lat: 28.75242, lng: 77.11918,
    entrance: [28.75238, 77.11910],   // on admin-internal road (cafeteria spur)
    icon: '🍽️',
    desc: 'Central dining hall and cafeteria',
    details: 'The main cafeteria serves subsidised meals for all students. Multiple food stalls, juice counters, and outdoor seating are available.',
  },
  {
    id: 'auditorium', name: 'Seminar Hall / Auditorium', short: 'Auditorium',
    cat: 'facility', lat: 28.75250, lng: 77.11865,
    entrance: [28.75248, 77.11858],   // on auditorium-road
    icon: '🎭',
    desc: 'Main auditorium for events and convocation',
    details: 'DTU\'s main auditorium seats 800 people. Hosts convocation, Engifest (cultural fest), Troika (tech festival), guest lectures, and college events.',
  },
  {
    id: 'health-centre', name: 'Health Centre', short: 'Medical',
    cat: 'facility', lat: 28.75262, lng: 77.11835,
    entrance: [28.75258, 77.11845],   // on hostel spine road
    icon: '🏥',
    desc: 'Campus health & medical facility',
    details: 'Basic OPD services, first-aid, and referrals. Open Mon–Sat. On-call doctor available for hostel emergencies.',
  },
  {
    id: 'atm', name: 'ATM & Bank Branch', short: 'ATM',
    cat: 'facility', lat: 28.75208, lng: 77.11822,
    entrance: [28.75205, 77.11828],   // on main spine near admin
    icon: '🏧',
    desc: 'SBI ATM and campus bank branch',
    details: 'SBI campus branch with ATM. Handles student fee transactions, scholarship disbursements, and daily banking needs.',
  },

  /* ── Hostels ─────────────────────────────────────────────────────── */
  {
    id: 'himadri', name: 'Himadri Hostel (H1)', short: 'Himadri',
    cat: 'hostel', lat: 28.75330, lng: 77.11843,
    entrance: [28.75328, 77.11848],   // on hostel spine
    icon: '🏠',
    desc: 'Boys hostel — H1',
    details: 'Himadri is one of the oldest boys\' hostels. Single and double rooms with a common TV room. Closest hostel to the main mess.',
  },
  {
    id: 'karakoram', name: 'Karakoram Hostel (H2)', short: 'Karakoram',
    cat: 'hostel', lat: 28.75360, lng: 77.11857,
    entrance: [28.75358, 77.11852],   // on hostel spine
    icon: '🏠',
    desc: 'Boys hostel — H2',
    details: 'Karakoram hostel features 3-seater rooms with attached bathrooms. Popular for its proximity to the north gate.',
  },
  {
    id: 'nilgiri', name: 'Nilgiri Hostel (H3)', short: 'Nilgiri',
    cat: 'hostel', lat: 28.75342, lng: 77.11872,
    entrance: [28.75340, 77.11855],   // on hostel spine, slightly east
    icon: '🏠',
    desc: 'Boys hostel — H3',
    details: 'Nilgiri hostel — recently renovated with improved common facilities and faster campus Wi-Fi coverage.',
  },
  {
    id: 'satpura', name: 'Satpura Hostel (H4)', short: 'Satpura',
    cat: 'hostel', lat: 28.75370, lng: 77.11838,
    entrance: [28.75368, 77.11852],   // on hostel spine
    icon: '🏠',
    desc: 'Boys hostel — H4',
    details: 'Satpura hostel is located in the northern part of the campus, close to the sports ground.',
  },
  {
    id: 'aravalli', name: 'Aravalli Girls Hostel', short: 'Aravalli',
    cat: 'hostel', lat: 28.75312, lng: 77.11882,
    entrance: [28.75310, 77.11870],   // on sports-perimeter-north road
    icon: '🏠',
    desc: 'Girls hostel (GH1)',
    details: 'Aravalli is the primary girls\' hostel at DTU with 24-hour security, separate mess, and common recreation areas.',
  },

  /* ── Sports ──────────────────────────────────────────────────────── */
  {
    id: 'sports-ground', name: 'Sports Ground & Stadium', short: 'Sports',
    cat: 'sports', lat: 28.75178, lng: 77.12045,
    entrance: [28.75175, 77.12035],   // on sports-approach road
    icon: '🏟️',
    desc: 'Main athletics track and football ground',
    details: 'Multi-sport complex with an athletics track, football ground, basketball courts, volleyball courts, badminton courts, and a gymnasium. Hosts inter-college tournaments.',
  },
  {
    id: 'cricket-ground', name: 'Cricket Ground', short: 'Cricket',
    cat: 'sports', lat: 28.75255, lng: 77.12025,
    entrance: [28.75228, 77.12045],   // on sports-perimeter-north
    icon: '🏏',
    desc: 'Campus cricket pitch',
    details: 'Full-length cricket ground used for inter-departmental and inter-college cricket matches.',
  },
  {
    id: 'gym', name: 'Student Gymnasium', short: 'Gym',
    cat: 'sports', lat: 28.75148, lng: 77.12065,
    entrance: [28.75148, 77.12058],   // on gate3 road near sports
    icon: '🏋️',
    desc: 'Weight training and cardio facility',
    details: 'Fully equipped gymnasium with free weights, cardio machines, and a dedicated yoga room. Available to all registered students.',
  },
];

/* ── Lookup map: id → poi ────────────────────────────────────────── */
const POI_MAP = Object.fromEntries(POI_DATA.map(p => [p.id, p]));

/* ── Category colours ────────────────────────────────────────────── */
const CAT_COLOR = {
  academic: '#4FC3F7',
  hostel:   '#CE93D8',
  facility: '#A5D6A7',
  gate:     '#FFCC80',
  sports:   '#80DEEA',
};

/* ── Category emoji ──────────────────────────────────────────────── */
const CAT_ICON = {
  academic: '🏫',
  hostel:   '🏠',
  facility: '🏢',
  gate:     '🚪',
  sports:   '🏟️',
};
