// Configuration constants for Bloom Bastion.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'bloom-bastion.best';

export const BLOOM = {
  x: FIELD.width / 2,
  y: FIELD.height / 2,
  radius: 48,
  maxHp: 200,
};

export const PLAYER = {
  radius: 20,
  speed: 380,
  maxHp: 100,
  invulnerable: 1.0,
  bulletSpeed: 750,
  bulletDamage: 25,
  fireInterval: 0.22,
};

export const ENEMY_TYPES = {
  triangle: {
    sides: 3,
    radius: 18,
    speed: 210,
    hp: 35,
    damage: 10,
    score: 100,
    color: '#a855f7', // Toxic purple
  },
  square: {
    sides: 4,
    radius: 24,
    speed: 140,
    hp: 75,
    damage: 20,
    score: 200,
    color: '#d946ef', // Magenta blight
  },
  pentagon: {
    sides: 5,
    radius: 28,
    speed: 170,
    hp: 120,
    damage: 30,
    score: 350,
    color: '#ef4444', // Toxic red
  },
  hexagon: {
    sides: 6,
    radius: 36,
    speed: 100,
    hp: 300,
    damage: 50,
    score: 600,
    color: '#f97316', // Blight orange/red boss
  },
};

export const UPGRADES = [
  { id: 'rapid', title: 'Rapid Spores', desc: '+35% Fire Rate' },
  { id: 'damage', title: 'Heavy Bolts', desc: '+40% Bullet Damage' },
  { id: 'multishot', title: 'Multishot +1', desc: 'Fires an extra spore bolt' },
  { id: 'speed', title: 'Wisp Thrusters', desc: '+25% Movement Speed' },
  { id: 'repair', title: 'Bloom Roots', desc: 'Heal Bloom +60 HP & Max HP' },
  { id: 'heal', title: 'Nectar Shield', desc: 'Heal Player to Full & Max HP' },
  { id: 'magnet', title: 'Pollen Magnet', desc: 'Attracts Essence & Pickups' },
];

export const POOL = {
  enemies: 120,
  bullets: 150,
  particles: 250,
  texts: 40,
};

export const PALETTE = {
  backdrop: '#0a1f1e',
  sky: '#11292d',
  groundGrid: '#1e3a3a',
  bloomCore: '#4ade80',
  bloomPetals: '#22c55e',
  bloomGlow: 'rgba(74, 222, 128, 0.6)',
  player: '#38bdf8',
  playerGlow: 'rgba(56, 189, 248, 0.5)',
  bullet: '#fde047',
  text: '#f8fafc',
  muted: '#cbd5e1',
  panel: '#1e293b',
  panelBorder: '#334155',
  cardBg: '#0f172a',
  cardHover: '#312e81',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
