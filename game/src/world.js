// world.js — the road from farmyard to forest: stage progression, spawning,
// parallax scenery (trees, barn, kitchen windows) and the forest gate itself.
// The world scrolls; the turkey stays put and the farm runs past it.

import { VIEW_W, VIEW_H, GROUND_Y, STAGES, ESCAPE_DISTANCE, STAGE_LENGTH, mulberry32 } from './config.js';

export class World {
  constructor(seed = 20261127) {
    this.rng = mulberry32(seed);
    this.distance = 0; // metres
    this.scroll = 0; // pixels
    this.stageIndex = 0;
    this.spawnTimer = 1.2;
    this.hills = this.makeHills();
    this.trees = this.makeTrees();
  }

  get stage() {
    return STAGES[this.stageIndex];
  }

  get speed() {
    return this.stage.speed;
  }

  makeHills() {
    const hills = [];
    for (let i = 0; i < 14; i++) {
      hills.push({ x: i * 260 + this.rng() * 120, r: 120 + this.rng() * 120, c: i % 2 });
    }
    return hills;
  }

  makeTrees() {
    const trees = [];
    for (let i = 0; i < 12; i++) {
      trees.push({ x: i * 340 + this.rng() * 180, h: 60 + this.rng() * 60, kind: i % 3 });
    }
    return trees;
  }

  reset(seed) {
    this.rng = mulberry32(seed);
    this.distance = 0;
    this.scroll = 0;
    this.stageIndex = 0;
    this.spawnTimer = 1.2;
    this.hills = this.makeHills();
    this.trees = this.makeTrees();
  }

  // Advance the world one frame. Returns 'stage' when a stage changes,
  // 'escaped' when the turkey reaches the forest gate.
  update(dt, dashing, hazards) {
    const speed = this.speed + (dashing ? 180 : 0);
    this.scroll += speed * dt;
    this.distance += (speed * dt) / 10;
    const stageIndex = Math.min(2, Math.floor(this.distance / STAGE_LENGTH));
    let event = null;
    if (stageIndex !== this.stageIndex) {
      this.stageIndex = stageIndex;
      event = 'stage';
    }
    if (this.distance >= ESCAPE_DISTANCE) return 'escaped';

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnNext(hazards);
      const [min, max] = this.stage.spawnGap;
      this.spawnTimer = (min + this.rng() * (max - min)) / speed;
    }
    return event;
  }

  spawnNext(hazards) {
    const roll = this.rng();
    const kinds = this.stage.hazards;
    const kind = kinds[Math.floor(this.rng() * kinds.length)];
    const x = VIEW_W + 40;
    if (roll < 0.18) {
      hazards.spawnCornArc(x);
    } else if (kind === 'hay') {
      hazards.spawn('hay', x, this.rng);
      if (this.rng() < 0.5) hazards.spawn('corn', x + 96, this.rng);
    } else {
      hazards.spawn(kind, x, this.rng);
      if (kind === 'fence' && this.rng() < 0.45) hazards.spawn('corn', x + 60, this.rng);
    }
  }

  drawSky(ctx) {
    const stage = this.stage;
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, stage.skyTop);
    grad.addColorStop(1, stage.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
    // A low autumn sun.
    ctx.fillStyle = 'rgba(255, 243, 214, 0.9)';
    ctx.beginPath();
    ctx.arc(820, 84, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 243, 214, 0.35)';
    ctx.beginPath();
    ctx.arc(820, 84, 52, 0, Math.PI * 2);
    ctx.fill();
    // Drifting clouds.
    ctx.fillStyle = 'rgba(255, 243, 214, 0.75)';
    for (let i = 0; i < 3; i++) {
      const cx = ((i * 360 - this.scroll * 0.08) % (VIEW_W + 240) + VIEW_W + 240) % (VIEW_W + 240) - 120;
      const cy = 56 + i * 44;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 52, 15, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 34, cy + 5, 34, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawScenery(ctx) {
    const stage = this.stage;
    // Rolling hills, far layer.
    ctx.fillStyle = stageIndexColor(this.stageIndex, ['#C98A4B', '#5A3A26', '#D9B380']);
    for (const hill of this.hills) {
      const hx = (((hill.x - this.scroll * 0.25) % (VIEW_W + 400)) + VIEW_W + 400) % (VIEW_W + 400) - 200;
      ctx.beginPath();
      ctx.arc(hx, GROUND_Y + 10, hill.r, Math.PI, 0);
      ctx.fill();
    }
    // Mid layer: trees, fences and barns that change with the stage.
    for (const tree of this.trees) {
      const tx = (((tree.x - this.scroll * 0.5) % (VIEW_W + 500)) + VIEW_W + 500) % (VIEW_W + 500) - 250;
      if (this.stageIndex === 2) {
        this.drawKitchenWindow(ctx, tx, tree.h);
      } else if (tree.kind === 0) {
        this.drawTree(ctx, tx, tree.h);
      } else if (tree.kind === 1) {
        this.drawBarn(ctx, tx);
      } else {
        this.drawFenceRow(ctx, tx);
      }
    }
    // The forest gate appears in the last 120 metres.
    if (this.distance > ESCAPE_DISTANCE - 120) {
      const gateX = VIEW_W - (ESCAPE_DISTANCE - this.distance) * 10 - 110;
      this.drawForestGate(ctx, gateX);
    }
  }

  drawTree(ctx, x, h) {
    ctx.fillStyle = '#6B4A2E';
    ctx.fillRect(x - 5, GROUND_Y - h * 0.45, 10, h * 0.45);
    ctx.fillStyle = '#C96A2B';
    ctx.beginPath();
    ctx.arc(x, GROUND_Y - h * 0.6, h * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E07830';
    ctx.beginPath();
    ctx.arc(x - h * 0.25, GROUND_Y - h * 0.45, h * 0.25, 0, Math.PI * 2);
    ctx.arc(x + h * 0.25, GROUND_Y - h * 0.5, h * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBarn(ctx, x) {
    ctx.fillStyle = '#8C2F2F';
    ctx.fillRect(x, GROUND_Y - 120, 130, 120);
    ctx.fillStyle = '#6B2222';
    ctx.beginPath();
    ctx.moveTo(x - 8, GROUND_Y - 120);
    ctx.lineTo(x + 65, GROUND_Y - 158);
    ctx.lineTo(x + 138, GROUND_Y - 120);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFF3D6';
    ctx.fillRect(x + 48, GROUND_Y - 58, 34, 58);
    ctx.strokeStyle = '#FFF3D6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 48, GROUND_Y - 58);
    ctx.lineTo(x + 82, GROUND_Y);
    ctx.moveTo(x + 82, GROUND_Y - 58);
    ctx.lineTo(x + 48, GROUND_Y);
    ctx.stroke();
  }

  drawFenceRow(ctx, x) {
    ctx.fillStyle = '#8A6A42';
    for (let i = 0; i < 4; i++) ctx.fillRect(x + i * 26, GROUND_Y - 26, 5, 26);
    ctx.fillRect(x - 4, GROUND_Y - 22, 108, 4);
    ctx.fillRect(x - 4, GROUND_Y - 12, 108, 4);
  }

  drawKitchenWindow(ctx, x, h) {
    ctx.fillStyle = '#8C2F2F';
    ctx.fillRect(x, GROUND_Y - 150, 110, 150);
    ctx.fillStyle = '#F7E8C8';
    ctx.fillRect(x + 16, GROUND_Y - 128, 78, 60);
    ctx.strokeStyle = '#8C2F2F';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 55, GROUND_Y - 128);
    ctx.lineTo(x + 55, GROUND_Y - 68);
    ctx.moveTo(x + 16, GROUND_Y - 98);
    ctx.lineTo(x + 94, GROUND_Y - 98);
    ctx.stroke();
    // A pumpkin pie cooling on the sill, because of course.
    ctx.fillStyle = '#E07830';
    ctx.beginPath();
    ctx.ellipse(x + 55, GROUND_Y - 40, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawForestGate(ctx, x) {
    ctx.fillStyle = '#3E6B3A';
    ctx.fillRect(x, GROUND_Y - 150, 14, 150);
    ctx.fillRect(x + 66, GROUND_Y - 150, 14, 150);
    ctx.fillStyle = '#2F5230';
    ctx.fillRect(x - 6, GROUND_Y - 162, 92, 16);
    ctx.fillStyle = '#FFF3D6';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOREST', x + 40, GROUND_Y - 168);
    ctx.fillStyle = '#7CB342';
    ctx.beginPath();
    ctx.arc(x + 40, GROUND_Y - 190, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGround(ctx) {
    const stage = this.stage;
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
    ctx.fillStyle = stage.groundTop;
    ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
    // Scrolling ground texture: pebbles and tufts.
    ctx.fillStyle = 'rgba(43, 33, 24, 0.25)';
    for (let i = 0; i < 24; i++) {
      const gx = (((i * 97 - this.scroll) % (VIEW_W + 80)) + VIEW_W + 80) % (VIEW_W + 80) - 40;
      const gy = GROUND_Y + 22 + ((i * 53) % 46);
      ctx.beginPath();
      ctx.ellipse(gx, gy, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.stageIndex === 2) {
      // Kitchen tile lines.
      ctx.strokeStyle = 'rgba(43, 33, 24, 0.2)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const tx = (((i * 89 - this.scroll) % (VIEW_W + 90)) + VIEW_W + 90) % (VIEW_W + 90) - 45;
        ctx.beginPath();
        ctx.moveTo(tx, GROUND_Y + 10);
        ctx.lineTo(tx - 14, VIEW_H);
        ctx.stroke();
      }
    }
  }
}

function stageIndexColor(index, colors) {
  return colors[index] || colors[0];
}
