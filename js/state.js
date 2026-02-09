/* state.js — Global State, Reference Values & Presets */

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
};

const DEFAULT_GLYC_REFS = {
  0:   { min: 60,  max: 100 },
  30:  { min: 110, max: 170 },
  60:  { min: 120, max: 170 },
  90:  { min: 100, max: 140 },
  120: { min: 60,  max: 140 },
  180: { min: 60,  max: 110 },
};

const PREGNANT_GLYC_REFS = {
  0:   { min: 60,  max: 92 },
  30:  { min: 100, max: 160 },
  60:  { min: 100, max: 180 },
  90:  { min: 80,  max: 155 },
  120: { min: 60,  max: 153 },
  180: { min: 60,  max: 110 },
};

const DEFAULT_INS_REFS = {
  0:   { min: 2,  max: 25 },
  30:  { min: 20, max: 80 },
  60:  { min: 20, max: 120 },
  90:  { min: 20, max: 90 },
  120: { min: 6,  max: 56 },
  180: { min: 2,  max: 30 },
};

const PRESETS = [
  { id: 'glyc3', name: 'Curva Glicemica 3 punti', desc: 'OGTT standard (basale, 60\', 120\')', type: 'glyc', times: [0, 60, 120], points: 3 },
  { id: 'glyc4', name: 'Curva Glicemica 4 punti', desc: 'Basale, 30\', 60\', 120\'', type: 'glyc', times: [0, 30, 60, 120], points: 4 },
  { id: 'glyc5', name: 'Curva Glicemica 5 punti', desc: 'Basale, 30\', 60\', 90\', 120\'', type: 'glyc', times: [0, 30, 60, 90, 120], points: 5 },
  { id: 'glyc6', name: 'Curva Glicemica 6 punti', desc: 'Basale, 30\', 60\', 90\', 120\', 180\'', type: 'glyc', times: [0, 30, 60, 90, 120, 180], points: 6 },
  { id: 'glyc_preg', name: 'Curva Glicemica Gravidanza', desc: 'OGTT 75g — Basale, 60\', 120\' (criteri IADPSG)', type: 'glyc', times: [0, 60, 120], points: 3, pregnant: true },
  { id: 'ins5', name: 'Curva Insulinemica 5 punti', desc: 'Basale, 30\', 60\', 90\', 120\'', type: 'ins', times: [0, 30, 60, 90, 120], points: 5 },
  { id: 'combined5', name: 'Combinata Glicemica + Insulinemica', desc: '5 punti: Basale, 30\', 60\', 90\', 120\'', type: 'combined', glycTimes: [0, 30, 60, 90, 120], insTimes: [0, 30, 60, 90, 120], points: '5+5' },
  { id: 'combined6', name: 'Combinata 6 punti', desc: '6 punti: Basale, 30\', 60\', 90\', 120\', 180\'', type: 'combined', glycTimes: [0, 30, 60, 90, 120, 180], insTimes: [0, 30, 60, 90, 120, 180], points: '6+6' },
];
