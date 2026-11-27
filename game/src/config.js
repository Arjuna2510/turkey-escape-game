// config.js — every tunable number, colour and stage definition for Turkey Run.
// One place to tune the game: nothing in the other files hard-codes a balance value.

export const VIEW_W = 960;
export const VIEW_H = 540;
export const GROUND_Y = 462;
export const PLAYER_X = 205;

export const ESCAPE_DISTANCE = 3000; // metres to the forest gate
export const STAGE_LENGTH = 1000; // metres per stage

export const PALETTE = {
  cream: '#FFF3D6',
  ink: '#2B2118',
  barnRed: '#8C2F2F',
  pumpkin: '#E07830',
  hayGold: '#F2C14E',
  forest: '#3E6B3A',
  leaf: '#C96A2B',
  skyFarmTop: '#FFD9A0',
  skyFarmBottom: '#FF9E57',
  skyBarnTop: '#8A5A34',
  skyBarnBottom: '#4A2A1A',
  skyKitchenTop: '#F7E8C8',
  skyKitchenBottom: '#E8B96A',
  hudPanel: 'rgba(43, 33, 24, 0.72)',
  danger: '#D93A2B',
  good: '#7CB342',
};

// One stage per leg of the escape: farmyard, barn, kitchen. Each stage raises the
// run speed, the spawn rate and the farmer's patience, and changes the scenery.
export const STAGES = [
  {
    name: 'THE FARMYARD',
    sub: 'Stage 1 — slip past the fence',
    speed: 265,
    spawnGap: [520, 900],
    pressureRate: 1.1,
    farmerPatience: 4.5,
    hazards: ['fence', 'knifeLow', 'pumpkin'],
    skyTop: PALETTE.skyFarmTop,
    skyBottom: PALETTE.skyFarmBottom,
    ground: '#7A5A33',
    groundTop: '#5E8C3A',
    accent: PALETTE.hayGold,
  },
  {
    name: 'THE BARN',
    sub: 'Stage 2 — hide in the hay',
    speed: 300,
    spawnGap: [440, 760],
    pressureRate: 1.5,
    farmerPatience: 3.6,
    hazards: ['fence', 'knifeLow', 'knifeHigh', 'pumpkin', 'hay'],
    skyTop: PALETTE.skyBarnTop,
    skyBottom: PALETTE.skyBarnBottom,
    ground: '#6B4A2E',
    groundTop: '#8A6A42',
    accent: PALETTE.pumpkin,
  },
  {
    name: 'THE KITCHEN',
    sub: 'Stage 3 — past the oven, out the door',
    speed: 335,
    spawnGap: [380, 660],
    pressureRate: 1.9,
    farmerPatience: 2.8,
    hazards: ['fence', 'knifeLow', 'knifeHigh', 'flame', 'pumpkin'],
    skyTop: PALETTE.skyKitchenTop,
    skyBottom: PALETTE.skyKitchenBottom,
    ground: '#B98A5A',
    groundTop: '#D9B380',
    accent: PALETTE.barnRed,
  },
];

export const TUNING = {
  gravity: 2350,
  jumpVelocity: 860,
  dashVelocity: 620, // extra forward speed while dashing
  dashDrain: 55, // stamina per second
  dashRegen: 26,
  stumbleTime: 0.6,
  invulnerableTime: 1.6,
  pressureHit: 20, // farmer gains this much ground on a hazard hit
  pressureSpotted: 32, // farmer gains this much when he spots you hiding
  pressureCorn: -3, // each corn cob loosens the chase a little
  hideCoolRate: 22, // pressure lost per second while safely hidden
  maxLives: 3,
  cornScore: 50,
  stageBonus: 500,
  escapeBonus: 1000,
};

// Small deterministic RNG so a screenshot seed replays the same scene.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
