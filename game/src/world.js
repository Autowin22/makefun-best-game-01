// The game's rules and state for Bloom Bastion.
import { FIELD, BLOOM, PLAYER, ENEMY_TYPES, POOL, STEP } from './config.js';

export const EVENT_SHOOT = 1;
export const EVENT_HIT = 2;
export const EVENT_BLOOM_HIT = 4;
export const EVENT_EXPLODE = 8;
export const EVENT_WAVE_COMPLETE = 16;
export const EVENT_UPGRADE = 32;
export const EVENT_OVER = 64;
export const EVENT_VICTORY = 128;

export function createWorld(random) {
  const player = {
    x: 0, y: 0, 
    hp: PLAYER.maxHp, maxHp: PLAYER.maxHp,
    invulnerable: 0,
    fireTimer: 0,
    radius: PLAYER.radius,
    speedMult: 1,
    damageMult: 1,
    fireRateMult: 1,
    multishot: 1,
    magnetRadius: 100,
    vx: 0, vy: 0 // For knockback
  };

  const bloom = { hp: BLOOM.maxHp, maxHp: BLOOM.maxHp };

  const enemies = Array.from({ length: POOL.enemies }, () => ({
    active: false, type: 'triangle', x: 0, y: 0, hp: 0, maxHp: 0, radius: 0, speed: 0, damage: 0, score: 0, color: '', sides: 3, vx: 0, vy: 0
  }));

  const bullets = Array.from({ length: POOL.bullets }, () => ({
    active: false, x: 0, y: 0, vx: 0, vy: 0, damage: 0, radius: 4
  }));

  const particles = Array.from({ length: POOL.particles }, () => ({
    active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: '', size: 0
  }));

  const texts = Array.from({ length: POOL.texts }, () => ({
    active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, text: '', color: '', size: 0
  }));

  const state = {
    player,
    bloom,
    enemies,
    bullets,
    particles,
    texts,
    score: 0,
    wave: 1,
    enemiesToSpawn: 0,
    spawnTimer: 0,
    shake: 0,
    paused: false,
    victory: false,
    upgradeChoices: []
  };

  function reset() {
    player.x = BLOOM.x;
    player.y = BLOOM.y + 150;
    player.hp = PLAYER.maxHp;
    player.maxHp = PLAYER.maxHp;
    player.invulnerable = 0;
    player.fireTimer = 0;
    player.speedMult = 1;
    player.damageMult = 1;
    player.fireRateMult = 1;
    player.multishot = 1;
    player.magnetRadius = 100;
    player.vx = 0; player.vy = 0;

    bloom.hp = BLOOM.maxHp;
    bloom.maxHp = BLOOM.maxHp;

    for (const e of enemies) e.active = false;
    for (const b of bullets) b.active = false;
    for (const p of particles) p.active = false;
    for (const t of texts) t.active = false;

    state.score = 0;
    state.wave = 1;
    state.enemiesToSpawn = 0;
    state.spawnTimer = 0;
    state.shake = 0;
    state.victory = false;
    startWave(1);
  }

  function startWave(wave) {
    state.wave = wave;
    state.enemiesToSpawn = 5 + wave * 3 + Math.floor(wave * wave * 0.5);
    state.spawnTimer = 1.0;
  }

  function spawnEnemy() {
    const free = enemies.find(e => !e.active);
    if (!free) return;

    const types = Object.keys(ENEMY_TYPES);
    // Probability of tougher enemies increases with waves
    let typeIdx = 0;
    if (state.wave >= 3) typeIdx = random() < 0.3 ? 1 : 0;
    if (state.wave >= 5) typeIdx = random() < 0.4 ? (random() < 0.5 ? 2 : 1) : 0;
    if (state.wave >= 8) typeIdx = Math.floor(random() * types.length);
    if (state.wave >= 10 && random() < 0.2) typeIdx = 3;

    const type = ENEMY_TYPES[types[typeIdx]];
    free.active = true;
    free.type = types[typeIdx];
    free.hp = type.hp * (1 + (state.wave - 1) * 0.1);
    free.maxHp = free.hp;
    free.radius = type.radius;
    free.speed = type.speed;
    free.damage = type.damage;
    free.score = type.score;
    free.color = type.color;
    free.sides = type.sides;
    free.vx = 0; free.vy = 0;

    // Spawn at edge
    const side = Math.floor(random() * 4);
    if (side === 0) { free.x = random() * FIELD.width; free.y = -50; }
    else if (side === 1) { free.x = random() * FIELD.width; free.y = FIELD.height + 50; }
    else if (side === 2) { free.x = -50; free.y = random() * FIELD.height; }
    else { free.x = FIELD.width + 50; free.y = random() * FIELD.height; }
  }

  function spawnBullet(x, y, angle, damage) {
    const free = bullets.find(b => !b.active);
    if (!free) return;
    free.active = true;
    free.x = x;
    free.y = y;
    free.vx = Math.cos(angle) * PLAYER.bulletSpeed;
    free.vy = Math.sin(angle) * PLAYER.bulletSpeed;
    free.damage = damage;
  }

  function spawnParticle(x, y, color, count = 1) {
    for (let i = 0; i < count; i++) {
      const p = particles.find(p => !p.active);
      if (!p) break;
      p.active = true;
      p.x = x;
      p.y = y;
      const angle = random() * Math.PI * 2;
      const speed = 50 + random() * 150;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 0.3 + random() * 0.4;
      p.maxLife = p.life;
      p.color = color;
      p.size = 2 + random() * 4;
    }
  }

  function spawnText(x, y, text, color) {
    const free = texts.find(t => !t.active);
    if (!free) return;
    free.active = true;
    free.x = x;
    free.y = y;
    free.vx = (random() - 0.5) * 40;
    free.vy = -60 - random() * 40;
    free.life = 1.0;
    free.text = text;
    free.color = color;
  }

  function applyUpgrade(upgrade) {
    if (upgrade.id === 'rapid') player.fireRateMult *= 1.35;
    else if (upgrade.id === 'damage') player.damageMult *= 1.4;
    else if (upgrade.id === 'multishot') player.multishot += 1;
    else if (upgrade.id === 'speed') player.speedMult *= 1.25;
    else if (upgrade.id === 'repair') {
      bloom.maxHp += 60;
      bloom.hp = Math.min(bloom.maxHp, bloom.hp + 60);
    } else if (upgrade.id === 'heal') {
      player.maxHp += 20;
      player.hp = player.maxHp;
    } else if (upgrade.id === 'magnet') {
      player.magnetRadius += 80;
    }
  }

  function step(dt, input) {
    let events = 0;
    state.shake = Math.max(0, state.shake - dt * 10);

    // Update Player
    const move = input.vector();
    player.vx = (player.vx + move.x * PLAYER.speed * player.speedMult) * 0.15;
    player.vy = (player.vy + move.y * PLAYER.speed * player.speedMult) * 0.15;
    player.x += player.vx;
    player.y += player.vy;
    player.x = Math.max(player.radius, Math.min(FIELD.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(FIELD.height - player.radius, player.y));

    if (player.invulnerable > 0) player.invulnerable -= dt;

    if (input.shooting && player.fireTimer <= 0) {
      const angle = Math.atan2(input.mouseY - player.y, input.mouseX - player.x);
      const damage = PLAYER.bulletDamage * player.damageMult;
      if (player.multishot === 1) {
        spawnBullet(player.x, player.y, angle, damage);
      } else {
        const spread = 0.2;
        const startAngle = angle - (spread * (player.multishot - 1)) / 2;
        for (let i = 0; i < player.multishot; i++) {
          spawnBullet(player.x, player.y, startAngle + i * spread, damage);
        }
      }
      player.fireTimer = PLAYER.fireInterval / player.fireRateMult;
      events |= EVENT_SHOOT;
    }
    if (player.fireTimer > 0) player.fireTimer -= dt;

    // Spawn Enemies
    if (state.enemiesToSpawn > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        spawnEnemy();
        state.enemiesToSpawn--;
        state.spawnTimer = Math.max(0.2, 1.5 - state.wave * 0.1);
      }
    }

    // Update Enemies
    let activeEnemies = 0;
    for (const e of enemies) {
      if (!e.active) continue;
      activeEnemies++;

      // Move toward Bloom or Player if blocked
      const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
      const distToBloom = Math.hypot(BLOOM.x - e.x, BLOOM.y - e.y);
      
      let tx = BLOOM.x, ty = BLOOM.y, tr = BLOOM.radius;
      if (distToPlayer < 120 && player.invulnerable <= 0) {
        tx = player.x; ty = player.y; tr = player.radius;
      }

      const angle = Math.atan2(ty - e.y, tx - e.x);
      e.vx = (e.vx + Math.cos(angle) * e.speed) * 0.1;
      e.vy = (e.vy + Math.sin(angle) * e.speed) * 0.1;
      e.x += e.vx;
      e.y += e.vy;

      // Collision with Bloom
      if (distToBloom < e.radius + BLOOM.radius) {
        bloom.hp -= e.damage * dt * 2;
        if (random() < 0.1) events |= EVENT_BLOOM_HIT;
        if (bloom.hp <= 0) {
          bloom.hp = 0;
          events |= EVENT_OVER;
        }
      }

      // Collision with Player
      if (distToPlayer < e.radius + player.radius && player.invulnerable <= 0) {
        player.hp -= e.damage;
        player.invulnerable = PLAYER.invulnerable;
        player.vx = (player.x - e.x) * 15;
        player.vy = (player.y - e.y) * 15;
        events |= EVENT_HIT;
        state.shake = 8;
        if (player.hp <= 0) {
          player.hp = 0;
          events |= EVENT_OVER;
        }
      }
    }

    // Update Bullets
    for (const b of bullets) {
      if (!b.active) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.x < -50 || b.x > FIELD.width + 50 || b.y < -50 || b.y > FIELD.height + 50) {
        b.active = false;
        continue;
      }

      for (const e of enemies) {
        if (!e.active) continue;
        const dist = Math.hypot(e.x - b.x, e.y - b.y);
        if (dist < e.radius + b.radius) {
          e.hp -= b.damage;
          b.active = false;
          spawnParticle(b.x, b.y, e.color, 3);
          if (e.hp <= 0) {
            e.active = false;
            state.score += e.score;
            spawnParticle(e.x, e.y, e.color, 12);
            spawnText(e.x, e.y, `+${e.score}`, '#fff');
            events |= EVENT_EXPLODE;
          }
          break;
        }
      }
    }

    // Update Particles
    for (const p of particles) {
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) p.active = false;
    }

    // Update Texts
    for (const t of texts) {
      if (!t.active) continue;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.life -= dt;
      if (t.life <= 0) t.active = false;
    }

    // Wave Completion
    if (state.enemiesToSpawn === 0 && activeEnemies === 0 && !state.victory) {
      if (state.wave === 10) {
        state.victory = true;
        events |= EVENT_VICTORY;
      } else {
        events |= EVENT_WAVE_COMPLETE;
      }
    }

    return events;
  }

  return { state, reset, step, applyUpgrade, startWave };
}
