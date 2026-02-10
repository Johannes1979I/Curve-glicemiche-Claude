/* state.js — Global State, Reference Values & Presets
   ───────────────────────────────────────────────────
   FONTI DEI VALORI DI RIFERIMENTO:
   ▸ Glicemia (OGTT 75g):
     - ADA Standards of Care 2026, Section 2 — Diabetes Care 49(Suppl 1):S27, Jan 2026
     - Basale: 60–99 mg/dL (normale), 100–125 (IFG), >=126 (diabete)
     - 120': <140 (normale), 140–199 (IGT), >=200 (diabete)
     - 30'/60'/90': range fisiologici da letteratura OGTT multipoint
   ▸ Glicemia 1-ora (criterio IDF 2024):
     - IDF Position Statement 2024 — Diabetes Research and Clinical Practice, Mar 2024
     - Presentato al 17mo ATTD Congress, Firenze 2024
     - 60' >=155 mg/dL = iperglicemia intermedia (IH)
     - 60' >=209 mg/dL = indicativo per diabete tipo 2
   ▸ Gravidanza (GDM) — criteri IADPSG confermati ADA 2026:
     - OGTT 75g: basale >=92, 60' >=180, 120' >=153 (1 valore alterato = GDM)
   ▸ Insulinemia:
     - Consensus SIE/AACE, letteratura Kraft patterns
     - Picco fisiologico entro 30-60', ritorno verso basale a 120'
   ─────────────────────────────────────────────────── */

const state = {
  preset: null,
  isPregnant: false,
  isCombined: false,
  glycTimes: [],
  insTimes: [],
  glycValues: [],
  insValues: [],
  glycRefs: {},
  insRefs: {},
  headerImage: null,
  glycChart: null,
  insChart: null,
  customCurve: null,
};

/* ── Glycemic Reference Values (mg/dL) — ADA 2026 + literature ── */
const DEFAULT_GLYC_REFS = {
  0:   { min: 60,  max: 99 },   // ADA 2026: normal fasting <100
  30:  { min: 100, max: 170 },   // physiological early peak
  60:  { min: 100, max: 154 },   // IDF 2024: >=155 = intermediate hyperglycemia
  90:  { min: 80,  max: 139 },   // descending phase
  120: { min: 60,  max: 139 },   // ADA 2026: <140 = normal tolerance
  150: { min: 60,  max: 119 },   // extended: approaching baseline
  180: { min: 60,  max: 109 },   // should return near fasting
  240: { min: 60,  max: 104 },   // extended curves: near-fasting
  300: { min: 60,  max: 99 },    // 5h: fasting level
};

/* ── Pregnancy (GDM) — IADPSG / ADA 2026 ── */
const PREGNANT_GLYC_REFS = {
  0:   { min: 60,  max: 91 },   // IADPSG: >=92 = GDM
  30:  { min: 80,  max: 160 },
  60:  { min: 80,  max: 179 },   // IADPSG: >=180 = GDM
  90:  { min: 70,  max: 155 },
  120: { min: 60,  max: 152 },   // IADPSG: >=153 = GDM
  150: { min: 60,  max: 119 },
  180: { min: 60,  max: 109 },
};

/* ── Insulin Reference Values (µUI/mL) — SIE/AACE consensus ── */
const DEFAULT_INS_REFS = {
  0:   { min: 2,   max: 25 },    // fasting hyperinsulinemia >25
  30:  { min: 20,  max: 120 },   // early insulin response
  60:  { min: 20,  max: 120 },   // peak should be 30-60'
  90:  { min: 15,  max: 80 },    // descending
  120: { min: 5,   max: 50 },    // should decline significantly
  150: { min: 3,   max: 35 },
  180: { min: 2,   max: 25 },    // near fasting
  240: { min: 2,   max: 20 },    // near fasting
  300: { min: 2,   max: 15 },    // 5h: should be at fasting
};

/* ── Diagnostic thresholds (for interpretations) ── */
const DIAG = {
  // ADA Standards of Care 2026 (Diabetes Care 49, Suppl 1, Jan 2026)
  fasting_ifg:      100,   // IFG: 100-125 mg/dL
  fasting_diabetes: 126,   // Diabetes: >=126 mg/dL
  t120_igt:         140,   // IGT: 140-199 mg/dL
  t120_diabetes:    200,   // Diabetes: >=200 mg/dL
  // IDF Position Statement 2024 — 1-hour PG (ATTD Florence 2024)
  t60_ih:           155,   // Intermediate Hyperglycemia: >=155 mg/dL
  t60_diabetes:     209,   // T2D: >=209 mg/dL
  // IADPSG / ADA 2026 — GDM (OGTT 75g)
  gdm_fasting:       92,
  gdm_60:           180,
  gdm_120:          153,
};

/* ── Preset Definitions ── */
const PRESETS = [
  { id: 'glyc3',     name: 'Curva Glicemica 3 punti',     desc: 'OGTT 75g standard (basale, 60\', 120\')',       type: 'glyc', times: [0, 60, 120], points: 3 },
  { id: 'glyc4',     name: 'Curva Glicemica 4 punti',     desc: 'Basale, 30\', 60\', 120\'',                     type: 'glyc', times: [0, 30, 60, 120], points: 4 },
  { id: 'glyc5',     name: 'Curva Glicemica 5 punti',     desc: 'Basale, 30\', 60\', 90\', 120\'',               type: 'glyc', times: [0, 30, 60, 90, 120], points: 5 },
  { id: 'glyc6',     name: 'Curva Glicemica 6 punti',     desc: 'Basale, 30\', 60\', 90\', 120\', 180\'',       type: 'glyc', times: [0, 30, 60, 90, 120, 180], points: 6 },
  { id: 'glyc_preg', name: 'Curva Glicemica Gravidanza',   desc: 'OGTT 75g — criteri IADPSG/ADA 2026',           type: 'glyc', times: [0, 60, 120], points: 3, pregnant: true },
  { id: 'custom',    name: 'Curva Personalizzata',         desc: 'Scegli numero punti e tempi',                   type: 'custom', times: [], points: '?' },
];
