// Keyboard and pointer input for Bloom Bastion.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const MUTE = new Set(['KeyM']);

export function createInput(canvas) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let shooting = false;
  let mouseX = FIELD.width / 2;
  let mouseY = FIELD.height / 2 - 100;
  let actions = 0;
  const clickListeners = [];

  function updateMouse(event) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const scaleX = FIELD.width / rect.width;
    const scaleY = FIELD.height / rect.height;
    mouseX = (event.clientX - rect.left) * scaleX;
    mouseY = (event.clientY - rect.top) * scaleY;
  }

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else return;
    event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
  });

  window.addEventListener('blur', () => {
    up = false;
    down = false;
    left = false;
    right = false;
    shooting = false;
  });

  canvas.addEventListener('mousemove', updateMouse);
  canvas.addEventListener('pointermove', updateMouse);

  canvas.addEventListener('pointerdown', (event) => {
    updateMouse(event);
    shooting = true;
    actions |= ACTION_CONFIRM;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const x = (event.clientX - rect.left) * (FIELD.width / rect.width);
      const y = (event.clientY - rect.top) * (FIELD.height / rect.height);
      for (const listener of clickListeners) listener(x, y);
    }
  });

  window.addEventListener('pointerup', () => {
    shooting = false;
  });

  return {
    get mouseX() { return mouseX; },
    get mouseY() { return mouseY; },
    get shooting() { return shooting; },
    vector() {
      const vx = (right ? 1 : 0) - (left ? 1 : 0);
      const vy = (down ? 1 : 0) - (up ? 1 : 0);
      const len = Math.hypot(vx, vy);
      if (len > 0) {
        return { x: vx / len, y: vy / len };
      }
      return { x: 0, y: 0 };
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    onClick(listener) {
      clickListeners.push(listener);
    },
    clearClicks() {
      clickListeners.length = 0;
    }
  };
}
