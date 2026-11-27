// game.js — the state machine and the main loop.
// States: title → howto → playing ⇄ paused → caught | escaped.
// Scoring, pressure, lives and toasts are all settled here; drawing lives in
// turkey.js / farmer.js / hazards.js / world.js / render.js.

import {
  VIEW_W,
  VIEW_H,
  GROUND_Y,
  TUNING,
  ESCAPE_DISTANCE,
  STAGE_LENGTH,
  clamp,
} from './config.js';
import { Turkey } from './turkey.js';
import { Farmer, FarmerMood } from './farmer.js';
import { HazardField } from './hazards.js';
import { World } from './world.js';
import {
  drawHud,
  drawTitle,
  drawHowTo,
  drawPaused,
  drawEnd,
  drawStageCard,
} from './render.js';

export const GameState = {
  TITLE: 'title',
  HOWTO: 'howto',
  PLAYING: 'playing',
  PAUSED: 'paused',
  END: 'end',
};

const BEST_KEY = 'turkey-run-best-score';

function loadBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch (err) {
    return 0;
  }
}

function saveBest(score) {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch (err) {
    // Private mode / file:// without storage: the score just does not persist.
  }
}

function inside(point, rect) {
  return (
    rect &&
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
}

export class Game {
  constructor(canvas, sound) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sound = sound;
    this.state = GameState.TITLE;
    this.time = 0;
    this.turkey = new Turkey();
    this.farmer = new Farmer();
    this.hazards = new HazardField();
    this.world = new World();
    this.score = 0;
    this.distance = 0;
    this.pressure = 12;
    this.lives = TUNING.maxLives;
    this.corn = 0;
    this.toasts = [];
    this.outcome = null;
    this.newBest = false;
    this.best = loadBest();
    this.stageCard = 0; // seconds of stage title card left
    this.stageCardAlpha = 0;
    this.shake = 0;
    this.buttons = {};
    this.flash = 0; // red edge flash on hit
    this.runSeed = 20261127;
  }

  get stageIndex() {
    return this.world.stageIndex;
  }

  get stamina() {
    return this.turkey.stamina;
  }

  startRun() {
    this.runSeed = (Date.now() % 2147483647) || 7;
    this.turkey.reset();
    this.farmer.reset();
    this.hazards.reset();
    this.world.reset(this.runSeed);
    this.score = 0;
    this.distance = 0;
    this.pressure = 12;
    this.lives = TUNING.maxLives;
    this.corn = 0;
    this.toasts = [];
    this.outcome = null;
    this.newBest = false;
    this.stageCard = 2.2;
    this.flash = 0;
    this.state = GameState.PLAYING;
    this.sound.unlock();
    this.sound.startMusic();
    this.sound.gobble();
  }

  addToast(text, color, big = false) {
    this.toasts.push({ text, color, big, x: VIEW_W / 2, y: 150, life: 1 });
  }

  endRun(outcome) {
    this.outcome = outcome;
    this.state = GameState.END;
    this.sound.stopMusic();
    if (outcome === 'escaped') {
      this.score += TUNING.escapeBonus;
      this.sound.escapedFanfare();
    } else {
      this.sound.caughtSting();
    }
    if (this.score > this.best) {
      this.best = this.score;
      this.newBest = true;
      saveBest(this.score);
    }
  }

  update(dt, input) {
    this.time += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);
    for (const toast of this.toasts) {
      toast.life -= dt * 0.9;
      toast.y -= dt * 26;
    }
    this.toasts = this.toasts.filter((t) => t.life > 0);

    if (input.mutePressed) this.sound.toggleMute();

    if (this.state === GameState.TITLE) {
      const p = { x: input.pointerX, y: input.pointerY };
      if (input.pointerJustDown) {
        this.sound.unlock();
        if (inside(p, this.buttons.startBtn)) this.startRun();
        else if (inside(p, this.buttons.howBtn)) this.state = GameState.HOWTO;
      } else if (input.confirmPressed) {
        this.sound.unlock();
        this.startRun();
      }
      return;
    }

    if (this.state === GameState.HOWTO) {
      if (input.pointerJustDown && inside({ x: input.pointerX, y: input.pointerY }, this.buttons.backBtn)) {
        this.state = GameState.TITLE;
      } else if (input.pressed('Escape')) {
        this.state = GameState.TITLE;
      }
      return;
    }

    if (this.state === GameState.PAUSED) {
      if (
        input.pausePressed ||
        (input.pointerJustDown &&
          inside({ x: input.pointerX, y: input.pointerY }, this.buttons.resumeBtn))
      ) {
        this.state = GameState.PLAYING;
        this.sound.startMusic();
      }
      return;
    }

    if (this.state === GameState.END) {
      if (input.pointerJustDown) {
        const p = { x: input.pointerX, y: input.pointerY };
        if (inside(p, this.buttons.restartBtn)) this.startRun();
        else if (inside(p, this.buttons.menuBtn)) this.state = GameState.TITLE;
      } else if (input.confirmPressed) {
        this.startRun();
      }
      return;
    }

    // ---- PLAYING ----
    if (input.pausePressed) {
      this.state = GameState.PAUSED;
      this.sound.stopMusic();
      return;
    }

    if (this.stageCard > 0) {
      this.stageCard -= dt;
      this.stageCardAlpha = clamp(Math.min(2.2 - this.stageCard, this.stageCard), 0, 1);
    }

    const nearHay = this.hazards.nearestHay(this.turkey.x);
    const jumpEvent = this.turkey.update(dt, input, this.world.speed, nearHay);
    if (jumpEvent === 'jump') this.sound.jump();
    if (this.turkey.dashing && Math.random() < dt * 6) this.sound.dash();

    // Hiding cools the chase; the farmer eventually gets suspicious.
    if (this.turkey.hidden) {
      const before = this.pressure;
      this.pressure = Math.max(0, this.pressure - TUNING.hideCoolRate * dt);
      if (before > 30 && this.pressure <= 30) this.sound.hideSafe();
    } else {
      this.pressure += this.world.stage.pressureRate * dt;
    }

    const farmerEvent = this.farmer.update(
      dt,
      this.pressure,
      this.turkey.hidden,
      this.turkey.x,
      this.world.stage,
    );
    if (farmerEvent === 'lostTrail') {
      this.addToast('HE LOST YOU!', '#7CB342');
      this.sound.hideSafe();
    } else if (farmerEvent === 'spotted') {
      this.pressure = Math.min(100, this.pressure + TUNING.pressureSpotted);
      this.addToast('SPOTTED!', '#D93A2B', true);
      this.sound.spotted();
      this.turkey.hidden = false;
    } else if (farmerEvent === 'lunged') {
      this.pressure = Math.min(100, this.pressure + 12);
    }

    const worldEvent = this.world.update(dt, this.turkey.dashing, this.hazards);
    this.distance = this.world.distance;
    this.score = Math.floor(this.distance * 10) + this.corn * TUNING.cornScore +
      this.world.stageIndex * TUNING.stageBonus;
    if (worldEvent === 'stage') {
      this.stageCard = 2.2;
      this.addToast(`${this.world.stage.name}!`, '#F2C14E', true);
      this.sound.stageClear();
    }
    if (worldEvent === 'escaped') {
      this.endRun('escaped');
      return;
    }

    this.hazards.update(dt, this.world.speed + (this.turkey.dashing ? 180 : 0));

    // Collisions, unless briefly invulnerable after a hit.
    if (this.turkey.invulnerable <= 0) {
      const result = this.hazards.collide(this.turkey.hitbox, this.turkey.hidden);
      if (result === 'corn') {
        this.corn += 1;
        this.pressure = Math.max(0, this.pressure + TUNING.pressureCorn);
        this.sound.corn();
      } else if (result === 'hit') {
        this.lives -= 1;
        this.pressure = Math.min(100, this.pressure + TUNING.pressureHit);
        this.turkey.stumbleHit();
        this.flash = 1;
        this.shake = 14;
        this.sound.hit();
        this.addToast(this.lives > 0 ? 'OUCH!' : 'LAST FEATHER!', '#D93A2B', true);
        if (this.lives <= 0) {
          this.endRun('caught');
          return;
        }
      }
    }

    // The farmer's hand on the turkey is the end, whatever the lives say.
    if (this.pressure >= 100) {
      this.endRun('caught');
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }
    this.world.drawSky(ctx);
    this.world.drawScenery(ctx);
    this.world.drawGround(ctx);
    this.hazards.draw(ctx, this.time);
    if (this.state !== GameState.TITLE && this.state !== GameState.HOWTO) {
      this.farmer.draw(ctx);
    }
    if (this.state !== GameState.TITLE && this.state !== GameState.HOWTO) {
      this.turkey.draw(ctx, this.time);
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(217, 58, 43, ${this.flash * 0.25})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
      drawHud(ctx, {
        score: this.score,
        distance: this.distance,
        lives: this.lives,
        maxLives: TUNING.maxLives,
        stageIndex: this.world.stageIndex,
        pressure: this.pressure,
        stamina: this.turkey.stamina,
        toasts: this.toasts,
      });
      if (this.stageCard > 0 && this.state === GameState.PLAYING) {
        drawStageCard(ctx, this.world.stage, this.stageCardAlpha);
      }
      if (this.state === GameState.PAUSED) {
        const p = { x: 0, y: 0 };
        this.buttons = drawPaused(ctx, false);
      }
    } else if (this.state === GameState.TITLE) {
      this.buttons = drawTitle(ctx, this.best, false, false);
    } else if (this.state === GameState.HOWTO) {
      this.buttons = drawHowTo(ctx, false);
    } else if (this.state === GameState.END) {
      drawHud(ctx, {
        score: this.score,
        distance: this.distance,
        lives: this.lives,
        maxLives: TUNING.maxLives,
        stageIndex: this.world.stageIndex,
        pressure: this.pressure,
        stamina: this.turkey.stamina,
        toasts: [],
      });
      this.buttons = drawEnd(ctx, {
        outcome: this.outcome,
        score: this.score,
        distance: this.distance,
        corn: this.corn,
        lives: this.lives,
        newBest: this.newBest,
      }, false, false);
    }
    ctx.restore();
  }

  // Deterministic staged scenes for screenshots: the game renders one frame of
  // its own code, with the state set up exactly as described. No assets are
  // faked — these are the same draw calls the player sees.
  setupShot(mode) {
    this.world.reset(7);
    this.hazards.reset();
    this.turkey.reset();
    this.farmer.reset();
    this.toasts = [];
    if (mode === 'start') {
      this.state = GameState.TITLE;
      this.best = 1240;
    } else if (mode === 'play') {
      this.state = GameState.PLAYING;
      this.world.distance = 642;
      this.distance = 642;
      this.world.stageIndex = 0;
      this.world.scroll = 6420;
      this.score = 1240;
      this.corn = 9;
      this.lives = 3;
      this.pressure = 52;
      this.turkey.y = GROUND_Y - 54 - 66;
      this.turkey.vy = 120;
      this.turkey.onGround = false;
      this.hazards.spawn('fence', 430, () => 0.5);
      this.hazards.spawn('knifeLow', 700, () => 0.3);
      this.hazards.spawnCornArc(560);
      this.hazards.spawn('hay', 830, () => 0.7);
      this.farmer.x = 60;
      this.farmer.walkCycle = 1.2;
      this.addToast('STAGE 1 — THE FARMYARD', '#F2C14E', true);
      this.toasts[0].life = 1;
      this.toasts[0].y = 210;
    } else if (mode === 'kitchen') {
      this.state = GameState.PLAYING;
      this.world.distance = 2340;
      this.distance = 2340;
      this.world.stageIndex = 2;
      this.world.scroll = 23400;
      this.score = 4860;
      this.corn = 21;
      this.lives = 2;
      this.pressure = 78;
      this.turkey.y = GROUND_Y - 54;
      this.turkey.onGround = true;
      this.turkey.dashing = true;
      this.turkey.stamina = 42;
      const flame = { kind: 'flame', x: 480, y: GROUND_Y - 10, w: 44, h: 10, timer: 0.8, erupting: 0.8, seed: 0.4, passed: false };
      this.hazards.items.push(flame);
      this.hazards.spawn('knifeHigh', 720, () => 0.2);
      this.hazards.spawn('fence', 860, () => 0.6);
      this.hazards.spawnCornArc(600);
      this.farmer.x = 118;
      this.farmer.mood = FarmerMood.CHASE;
      this.farmer.walkCycle = 2.4;
      this.addToast('SPOTTED!', '#D93A2B', true);
      this.toasts[0].life = 1;
      this.toasts[0].y = 210;
    } else if (mode === 'end') {
      this.state = GameState.END;
      this.outcome = 'escaped';
      this.world.distance = 3000;
      this.distance = 3000;
      this.farmer.x = -90; // the farmer is left behind, off-screen, at the gate
      this.world.stageIndex = 2;
      this.score = 12480;
      this.corn = 24;
      this.lives = 2;
      this.pressure = 40;
      this.newBest = true;
      this.best = 12480;
    }
    this.time = 1.6;
    this.render();
  }
}
