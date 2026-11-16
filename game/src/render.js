// Drawing for Bloom Bastion.
import { FIELD, BLOOM, PLAYER, PALETTE, FONT, UPGRADES } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_UPGRADE = 'upgrade';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const petals = Array.from({ length: 30 }, () => ({
    x: Math.random() * FIELD.width,
    y: Math.random() * FIELD.height,
    r: 2 + Math.random() * 4,
    s: 20 + Math.random() * 30,
    a: Math.random() * Math.PI * 2
  }));

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function drawText(val, x, y, size, color, align = 'center', baseline = 'middle') {
    ctx.font = `${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(val, x, y);
  }

  function drawBar(x, y, w, h, val, max, color, label) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, w, h);
    const fill = Math.max(0, Math.min(1, val / max));
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * fill, h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    if (label) {
      drawText(label, x + 5, y - 10, 14, '#fff', 'left', 'bottom');
    }
  }

  function drawShape(x, y, r, sides, color, angle = 0) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = angle + (i * Math.PI * 2) / sides;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawBloom(bloom, time) {
    const pulse = Math.sin(time * 3) * 5;
    const r = BLOOM.radius + pulse;
    
    // Soft radial glow behind
    const bgGrad = ctx.createRadialGradient(BLOOM.x, BLOOM.y, 0, BLOOM.x, BLOOM.y, r * 4.5);
    bgGrad.addColorStop(0, 'rgba(74, 222, 128, 0.25)');
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(BLOOM.x, BLOOM.y, r * 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Primary Glow
    const grad = ctx.createRadialGradient(BLOOM.x, BLOOM.y, 0, BLOOM.x, BLOOM.y, r * 2.5);
    grad.addColorStop(0, PALETTE.bloomGlow);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(BLOOM.x, BLOOM.y, r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Petals
    ctx.fillStyle = '#4ade80';
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8 + time * 0.5;
      const px = BLOOM.x + Math.cos(a) * r;
      const py = BLOOM.y + Math.sin(a) * r;
      ctx.beginPath();
      ctx.ellipse(px, py, r * 0.8, r * 0.4, a, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Core
    ctx.fillStyle = '#bbf7d0';
    ctx.beginPath();
    ctx.arc(BLOOM.x, BLOOM.y, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  function drawPlayer(player, time) {
    if (player.invulnerable > 0 && Math.floor(time * 15) % 2 === 0) return;

    // Glow
    const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.radius * 2);
    grad.addColorStop(0, PALETTE.playerGlow);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x - 5, player.y - 5, 3, 0, Math.PI * 2);
    ctx.arc(player.x + 5, player.y - 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawUpgradeCard(upgrade, x, y, w, h, hovered) {
    ctx.fillStyle = hovered ? PALETTE.cardHover : PALETTE.cardBg;
    ctx.strokeStyle = PALETTE.panelBorder;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();

    drawText(upgrade.title, x + w / 2, y + 40, 24, PALETTE.text);
    drawText(upgrade.desc, x + w / 2, y + 90, 18, PALETTE.muted);
    drawText('Select', x + w / 2, y + h - 30, 20, PALETTE.bloomCore);
  }

  function draw(state, screen, best, time, mouseX, mouseY) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);

    // Screen Shake
    if (state.shake > 0) {
      const sx = (Math.random() - 0.5) * state.shake;
      const sy = (Math.random() - 0.5) * state.shake;
      ctx.translate(sx, sy);
    }

    // Grid
    ctx.strokeStyle = PALETTE.groundGrid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= FIELD.width; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FIELD.height); ctx.stroke();
    }
    for (let y = 0; y <= FIELD.height; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FIELD.width, y); ctx.stroke();
    }

    // Petals
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (const p of petals) {
      p.y += p.s * 0.016;
      p.x += Math.sin(p.a + time) * 0.5;
      if (p.y > FIELD.height) p.y = -10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    drawBloom(state.bloom, time);

    for (const e of state.enemies) {
      if (!e.active) continue;
      drawShape(e.x, e.y, e.radius, e.sides, e.color, time * 2);
      // Health bar for enemies
      if (e.hp < e.maxHp) {
        const bw = e.radius * 2;
        drawBar(e.x - bw/2, e.y - e.radius - 10, bw, 4, e.hp, e.maxHp, '#ef4444');
      }
    }

    for (const b of state.bullets) {
      if (!b.active) continue;
      ctx.fillStyle = PALETTE.bullet;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    drawPlayer(state.player, time);

    for (const p of state.particles) {
      if (!p.active) continue;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const t of state.texts) {
      if (!t.active) continue;
      ctx.globalAlpha = t.life;
      drawText(t.text, t.x, t.y, 24, t.color);
    }
    ctx.globalAlpha = 1;

    // HUD
    const SAFE = 18;
    drawBar(SAFE, 48, 300, 24, state.player.hp, state.player.maxHp, '#38bdf8', 'Wisp Health');
    drawBar(FIELD.width - 300 - SAFE, 48, 300, 24, state.bloom.hp, state.bloom.maxHp, '#4ade80', 'Bloom Integrity');
    
    drawText(`Wave ${state.wave}`, FIELD.width / 2, 40, 32, '#fff');
    drawText(`Score: ${state.score}`, FIELD.width / 2, 80, 20, PALETTE.muted);

    // Overlays
    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(7, 9, 19, 0.8)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      drawText('BLOOM BASTION', FIELD.width / 2, FIELD.height / 2 - 80, 72, PALETTE.bloomCore);
      drawText('Defend the Great Bloom from the Blight', FIELD.width / 2, FIELD.height / 2 - 10, 24, PALETTE.muted);
      drawText('WASD to move, Mouse to aim & shoot', FIELD.width / 2, FIELD.height / 2 + 30, 18, PALETTE.muted);
      drawText(`Best Score: ${best}`, FIELD.width / 2, FIELD.height / 2 + 70, 24, PALETTE.bullet);
      drawText('Click or Press Space to Start', FIELD.width / 2, FIELD.height / 2 + 150, 28, '#fff');
    } else if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(7, 9, 19, 0.6)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      drawText('PAUSED', FIELD.width / 2, FIELD.height / 2, 64, '#fff');
      drawText('Press P to Resume', FIELD.width / 2, FIELD.height / 2 + 60, 24, PALETTE.muted);
    } else if (screen === SCREEN_UPGRADE) {
      ctx.fillStyle = 'rgba(7, 9, 19, 0.85)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      drawText('CHOOSE AN UPGRADE', FIELD.width / 2, 120, 48, PALETTE.bullet);
      
      const cardW = 260, cardH = 340, gap = 40;
      const startX = (FIELD.width - (cardW * 3 + gap * 2)) / 2;
      state.upgradeChoices.forEach((u, i) => {
        const x = startX + i * (cardW + gap);
        const y = 220;
        const hovered = mouseX >= x && mouseX <= x + cardW && mouseY >= y && mouseY <= y + cardH;
        drawUpgradeCard(u, x, y, cardW, cardH, hovered);
      });
    } else if (screen === SCREEN_OVER) {
      ctx.fillStyle = 'rgba(20, 10, 10, 0.9)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      drawText('THE BLOOM HAS FALLEN', FIELD.width / 2, FIELD.height / 2 - 80, 64, '#ef4444');
      drawText(`Score: ${state.score}  Wave: ${state.wave}`, FIELD.width / 2, FIELD.height / 2, 32, '#fff');
      drawText(`Best: ${best}`, FIELD.width / 2, FIELD.height / 2 + 50, 24, PALETTE.muted);
      drawText('Click or Press Space to Restart', FIELD.width / 2, FIELD.height / 2 + 150, 28, '#fff');
    } else if (screen === SCREEN_VICTORY) {
      ctx.fillStyle = 'rgba(10, 20, 10, 0.9)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      drawText('VICTORY!', FIELD.width / 2, FIELD.height / 2 - 100, 84, PALETTE.bloomCore);
      drawText('The Blight has been repelled!', FIELD.width / 2, FIELD.height / 2 - 10, 32, '#fff');
      drawText(`Final Score: ${state.score}`, FIELD.width / 2, FIELD.height / 2 + 50, 28, PALETTE.bullet);
      drawText('Click to continue in Endless Mode', FIELD.width / 2, FIELD.height / 2 + 150, 28, '#fff');
    }
  }

  resize();
  window.addEventListener('resize', resize);

  return { draw, view };
}
