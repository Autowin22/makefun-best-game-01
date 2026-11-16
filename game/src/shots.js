// Deterministic screenshot scenes for Bloom Bastion.
import { STEP, FIELD, BLOOM, PLAYER, ENEMY_TYPES, PALETTE } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';

export function stageShot(name, world, random) {
  world.reset();
  
  if (name === 'start') {
    return { screen: SCREEN_TITLE, best: 12500, time: 60 * STEP };
  }

  if (name === 'play') {
    world.state.wave = 3;
    world.state.score = 4250;
    world.state.bloom.hp = BLOOM.maxHp * 0.9;
    world.state.player.x = FIELD.width / 2 - 200;
    world.state.player.y = FIELD.height / 2 + 100;
    world.state.player.hp = PLAYER.maxHp * 0.85;
    
    // Spawn 7 mixed enemies at mid distance
    const enemyCount = 7;
    const types = Object.keys(ENEMY_TYPES);
    for (let i = 0; i < enemyCount; i++) {
      const e = world.state.enemies[i];
      e.active = true;
      const typeKey = types[i % 3];
      const type = ENEMY_TYPES[typeKey];
      e.type = typeKey;
      e.hp = type.hp;
      e.maxHp = type.hp;
      e.radius = type.radius;
      e.speed = type.speed;
      e.damage = type.damage;
      e.score = type.score;
      e.color = type.color;
      e.sides = type.sides;
      
      const angle = (i / enemyCount) * Math.PI * 2 + 0.5;
      const dist = 280 + (i % 3) * 40;
      e.x = BLOOM.x + Math.cos(angle) * dist;
      e.y = BLOOM.y + Math.sin(angle) * dist;
    }

    // Several bullets in flight
    for (let i = 0; i < 5; i++) {
      const b = world.state.bullets[i];
      b.active = true;
      const angle = -0.5 + i * 0.2;
      b.x = world.state.player.x + Math.cos(angle) * 120;
      b.y = world.state.player.y + Math.sin(angle) * 120;
      b.vx = Math.cos(angle) * PLAYER.bulletSpeed;
      b.vy = Math.sin(angle) * PLAYER.bulletSpeed;
      b.radius = 4;
      b.damage = PLAYER.bulletDamage;
    }

    // A few particles
    for (let i = 0; i < 12; i++) {
      const p = world.state.particles[i];
      p.active = true;
      const angle = random() * Math.PI * 2;
      const dist = random() * 200;
      p.x = BLOOM.x + Math.cos(angle) * dist;
      p.y = BLOOM.y + Math.sin(angle) * dist;
      p.color = i % 2 === 0 ? PALETTE.bloomCore : PALETTE.player;
      p.life = 0.5;
      p.maxLife = 1.0;
      p.size = 2 + (i % 3);
    }

    return { screen: SCREEN_PLAY, best: 15000, time: 2.0 };
  }

  if (name === 'end') {
    world.state.wave = 6;
    world.state.score = 15800;
    world.state.bloom.hp = 0;
    world.state.player.hp = 0;
    world.state.player.x = FIELD.width / 2 + 100;
    world.state.player.y = FIELD.height / 2 + 150;

    // Enemies swarming the fallen bloom
    for (let i = 0; i < 10; i++) {
      const e = world.state.enemies[i];
      e.active = true;
      const type = ENEMY_TYPES.triangle;
      e.type = 'triangle';
      e.hp = type.hp;
      e.maxHp = type.hp;
      e.radius = type.radius;
      e.color = type.color;
      e.sides = type.sides;
      const angle = (i / 10) * Math.PI * 2;
      e.x = BLOOM.x + Math.cos(angle) * (BLOOM.radius + 20);
      e.y = BLOOM.y + Math.sin(angle) * (BLOOM.radius + 20);
    }

    return { screen: SCREEN_OVER, best: 20000, time: 5.0 };
  }

  return { screen: SCREEN_PLAY, best: 0, time: 0 };
}
