// hazards.js — everything the turkey must dodge, eat or hide behind:
// fences and pumpkins (jump), carving knives (jump low ones, duck high ones),
// oven flames (kitchen vents that erupt on a timer), corn (score + breathing
// room) and hay bales (the only place to hide from the farmer).

import { GROUND_Y, VIEW_W } from './config.js';

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class HazardField {
  constructor() {
    this.items = [];
  }

  reset() {
    this.items = [];
  }

  spawn(kind, x, rng) {
    const base = { kind, x, passed: false, seed: rng() };
    if (kind === 'fence') {
      this.items.push({ ...base, y: GROUND_Y - 46, w: 34, h: 46 });
    } else if (kind === 'pumpkin') {
      this.items.push({ ...base, y: GROUND_Y - 34, w: 36, h: 34, roll: 0 });
    } else if (kind === 'knifeLow') {
      this.items.push({ ...base, y: GROUND_Y - 34, w: 46, h: 12, speed: 150 });
    } else if (kind === 'knifeHigh') {
      this.items.push({ ...base, y: GROUND_Y - 92, w: 46, h: 12, speed: 190 });
    } else if (kind === 'flame') {
      this.items.push({ ...base, y: GROUND_Y - 10, w: 44, h: 10, timer: 0.4 + rng() * 0.8, erupting: 0 });
    } else if (kind === 'corn') {
      this.items.push({ ...base, y: GROUND_Y - 96, w: 22, h: 30, bob: rng() * 6 });
    } else if (kind === 'hay') {
      this.items.push({ ...base, y: GROUND_Y - 58, w: 74, h: 58 });
    }
  }

  spawnCornArc(x) {
    this.spawn('corn', x, () => 0.5);
    this.spawn('corn', x + 34, () => 0.2);
    this.spawn('corn', x + 68, () => 0.8);
  }

  // Move everything left with the world; knives fly faster, pumpkins roll.
  update(dt, speed) {
    for (const item of this.items) {
      item.x -= speed * dt;
      if (item.kind === 'knifeLow' || item.kind === 'knifeHigh') item.x -= item.speed * dt;
      if (item.kind === 'pumpkin') item.roll += dt * 9;
      if (item.kind === 'flame') {
        item.timer -= dt;
        if (item.timer <= 0) {
          if (item.erupting > 0) {
            item.erupting = 0;
            item.timer = 0.9 + item.seed * 0.9;
          } else {
            item.erupting = 0.85;
            item.timer = 0.85;
          }
        }
        if (item.erupting > 0) item.erupting -= dt;
      }
    }
    this.items = this.items.filter((item) => item.x + item.w > -80);
  }

  nearestHay(turkeyX) {
    return this.items.find(
      (item) => item.kind === 'hay' && Math.abs(item.x + item.w / 2 - (turkeyX + 31)) < 62,
    );
  }

  // Returns 'hit' | 'corn' | null and marks what was collected.
  collide(turkeyBox, turkeyHidden) {
    if (turkeyHidden) return null; // tucked behind the bale, nothing can touch you
    for (const item of this.items) {
      if (item.kind === 'corn') {
        if (overlaps(turkeyBox, item)) {
          item.eaten = true;
          return 'corn';
        }
        continue;
      }
      if (item.kind === 'hay') continue;
      const box = this.collisionBox(item);
      if (box && overlaps(turkeyBox, box)) {
        item.spent = true;
        return 'hit';
      }
    }
    this.items = this.items.filter((item) => !item.eaten && !item.spent);
    return null;
  }

  collisionBox(item) {
    if (item.kind === 'flame') {
      if (item.erupting <= 0) return null;
      return { x: item.x + 4, y: GROUND_Y - 78, w: item.w - 8, h: 78 };
    }
    if (item.kind === 'knifeLow') return { x: item.x + 6, y: item.y + 2, w: item.w - 12, h: 8 };
    if (item.kind === 'knifeHigh') return { x: item.x + 6, y: item.y + 2, w: item.w - 12, h: 8 };
    return { x: item.x + 4, y: item.y + 2, w: item.w - 8, h: item.h - 2 };
  }

  draw(ctx, time) {
    for (const item of this.items) {
      if (item.kind === 'fence') this.drawFence(ctx, item);
      else if (item.kind === 'pumpkin') this.drawPumpkin(ctx, item);
      else if (item.kind === 'knifeLow' || item.kind === 'knifeHigh') this.drawKnife(ctx, item, time);
      else if (item.kind === 'flame') this.drawFlame(ctx, item, time);
      else if (item.kind === 'corn') this.drawCorn(ctx, item, time);
      else if (item.kind === 'hay') this.drawHay(ctx, item);
    }
  }

  drawFence(ctx, item) {
    ctx.fillStyle = '#8A6A42';
    ctx.fillRect(item.x, item.y, 6, item.h);
    ctx.fillRect(item.x + item.w - 6, item.y, 6, item.h);
    ctx.fillStyle = '#A67C4E';
    ctx.fillRect(item.x - 4, item.y + 8, item.w + 8, 7);
    ctx.fillRect(item.x - 4, item.y + 26, item.w + 8, 7);
    ctx.fillStyle = '#6B4A2E';
    ctx.fillRect(item.x, item.y - 2, 6, 4);
    ctx.fillRect(item.x + item.w - 6, item.y - 2, 6, 4);
  }

  drawPumpkin(ctx, item) {
    ctx.save();
    ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
    ctx.rotate(item.roll * 0.12);
    ctx.fillStyle = '#E07830';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B85A1E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.quadraticCurveTo(-8, 0, -6, 14);
    ctx.moveTo(6, -14);
    ctx.quadraticCurveTo(8, 0, 6, 14);
    ctx.stroke();
    ctx.fillStyle = '#3E6B3A';
    ctx.fillRect(-2, -19, 4, 7);
    ctx.restore();
  }

  drawKnife(ctx, item, time) {
    const wobble = Math.sin(time * 9 + item.seed * 10) * 3;
    ctx.save();
    ctx.translate(item.x + item.w / 2, item.y + 6 + wobble);
    ctx.rotate(-0.12);
    // Blade.
    ctx.fillStyle = '#D8DDE3';
    ctx.beginPath();
    ctx.moveTo(-22, -4);
    ctx.lineTo(10, -5);
    ctx.lineTo(23, 0);
    ctx.lineTo(10, 5);
    ctx.lineTo(-22, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#9AA3AD';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Handle.
    ctx.fillStyle = '#2B2118';
    ctx.fillRect(-30, -4, 10, 8);
    ctx.fillStyle = '#D93A2B';
    ctx.fillRect(-22, -4, 3, 8);
    ctx.restore();
  }

  drawFlame(ctx, item, time) {
    // The oven vent: a cast-iron grate on the kitchen floor.
    ctx.fillStyle = '#3A3A3A';
    ctx.fillRect(item.x, GROUND_Y - 8, item.w, 8);
    ctx.fillStyle = '#6B6B6B';
    for (let i = 0; i < 4; i++) ctx.fillRect(item.x + 5 + i * 10, GROUND_Y - 8, 3, 8);
    if (item.erupting > 0) {
      const heat = Math.min(1, item.erupting * 2 + 0.4);
      const flicker = Math.sin(time * 22 + item.seed * 20) * 4;
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = '#E07830';
      ctx.beginPath();
      ctx.moveTo(item.x + 4, GROUND_Y - 8);
      ctx.quadraticCurveTo(item.x + 8 + flicker, GROUND_Y - 62 * heat, item.x + item.w / 2, GROUND_Y - 78 * heat);
      ctx.quadraticCurveTo(item.x + item.w - 8 - flicker, GROUND_Y - 62 * heat, item.x + item.w - 4, GROUND_Y - 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#F2C14E';
      ctx.beginPath();
      ctx.moveTo(item.x + 12, GROUND_Y - 8);
      ctx.quadraticCurveTo(item.x + 16, GROUND_Y - 34 * heat, item.x + item.w / 2, GROUND_Y - 46 * heat);
      ctx.quadraticCurveTo(item.x + item.w - 16, GROUND_Y - 34 * heat, item.x + item.w - 12, GROUND_Y - 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawCorn(ctx, item, time) {
    const bob = Math.sin(time * 4 + item.bob) * 3;
    ctx.save();
    ctx.translate(item.x + 11, item.y + 15 + bob);
    ctx.rotate(0.15);
    ctx.fillStyle = '#F2C14E';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D9A83B';
    ctx.lineWidth = 1;
    for (let r = -1; r <= 1; r++) {
      ctx.beginPath();
      ctx.moveTo(-6, r * 6);
      ctx.lineTo(6, r * 6);
      ctx.stroke();
    }
    ctx.fillStyle = '#3E6B3A';
    ctx.beginPath();
    ctx.moveTo(-7, 8);
    ctx.lineTo(0, 16);
    ctx.lineTo(7, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawHay(ctx, item) {
    ctx.fillStyle = '#D9A83B';
    ctx.beginPath();
    ctx.ellipse(item.x + item.w / 2, item.y + item.h / 2, item.w / 2, item.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B8862E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(item.x + item.w / 2, item.y + item.h / 2, item.w / 2 - 7, item.h / 2 - 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#F2C14E';
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(item.x + item.w / 2 + i * 10, item.y + 8);
      ctx.lineTo(item.x + item.w / 2 + i * 10 + 4, item.y + item.h - 10);
      ctx.stroke();
    }
  }
}
