// Boot and game loop for Bloom Bastion.
import { BEST_KEY, STEP, UPGRADES, FIELD } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_SHOOT, EVENT_HIT, EVENT_BLOOM_HIT, EVENT_EXPLODE, EVENT_WAVE_COMPLETE, EVENT_OVER, EVENT_VICTORY } from './world.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_MUTE } from './input.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_UPGRADE, SCREEN_PAUSED, SCREEN_OVER, SCREEN_VICTORY } from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const random = createRandom(seed);
const world = createWorld(random);
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
  }
}

function runShot(name) {
  const scene = stageShot(name, world, random);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, scene.time || 0, 0, 0);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let totalTime = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    totalTime = 0;
    screen = SCREEN_PLAY;
    announce('Game started. Defend the Bloom!');
  }

  function showUpgrades() {
    screen = SCREEN_UPGRADE;
    // Pick 3 random unique upgrades
    const choices = [];
    const pool = [...UPGRADES];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(random() * pool.length);
      choices.push(pool.splice(idx, 1)[0]);
    }
    world.state.upgradeChoices = choices;
    announce('Wave complete! Choose an upgrade.');
  }

  input.onClick((x, y) => {
    if (screen === SCREEN_UPGRADE) {
      const cardW = 260, cardH = 340, gap = 40;
      const startX = (FIELD.width - (cardW * 3 + gap * 2)) / 2;
      const startY = 220;
      world.state.upgradeChoices.forEach((u, i) => {
        const cx = startX + i * (cardW + gap);
        if (x >= cx && x <= cx + cardW && y >= startY && y <= startY + cardH) {
          world.applyUpgrade(u);
          sound.upgrade();
          world.startWave(world.state.wave + 1);
          screen = SCREEN_PLAY;
          announce(`Upgrade selected: ${u.title}. Wave ${world.state.wave} starts!`);
        }
      });
    } else if (screen === SCREEN_VICTORY) {
      screen = SCREEN_PLAY;
      world.startWave(world.state.wave + 1);
    }
  });

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) sound.toggleMute();
    
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
    
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  }

  function step() {
    if (screen !== SCREEN_PLAY && screen !== SCREEN_TITLE) return;
    
    const events = world.step(STEP, input);
    totalTime += STEP;

    if (events & EVENT_SHOOT) sound.shoot();
    if (events & EVENT_HIT) sound.hit();
    if (events & EVENT_BLOOM_HIT) sound.bloomHit();
    if (events & EVENT_EXPLODE) sound.explode();
    
    if (events & EVENT_OVER) {
      screen = SCREEN_OVER;
      sound.gameOver();
      if (world.state.score > best) {
        best = world.state.score;
        saveBest(best);
      }
      announce(`Game over. Final score: ${world.state.score}`);
    } else if (events & EVENT_VICTORY) {
      screen = SCREEN_VICTORY;
      sound.victory();
      announce('Victory! Wave 10 survived.');
    } else if (events & EVENT_WAVE_COMPLETE) {
      showUpgrades();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    accumulator += dt;
    last = now;

    handleActions();

    while (accumulator >= STEP) {
      step();
      accumulator -= STEP;
    }

    renderer.draw(world.state, screen, best, totalTime, input.mouseX, input.mouseY);
  }

  announce('Bloom Bastion. Defend the Great Bloom!');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
