// turkey.js — the player: a plump Thanksgiving turkey with somewhere to be.
// Physics (jump, dash, stumble, hide) and all of its canvas drawing live here.

import { GROUND_Y, PLAYER_X, TUNING, clamp } from './config.js';

export const TURKEY_W = 62;
export const TURKEY_H = 54;

export class Turkey {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = PLAYER_X;
    this.y = GROUND_Y - TURKEY_H;
    this.vy = 0;
    this.onGround = true;
    this.hidden = false; // tucked behind a hay bale
    this.ducking = false; // crouched low, dodging high knives
    this.dashing = false;
    this.stamina = 100;
    this.stumble = 0; // seconds of stumble left
    this.invulnerable = 0;
    this.runCycle = 0;
    this.wingFlap = 0;
    this.squash = 0; // landing squash-and-stretch
  }

  get feetY() {
    return this.y + TURKEY_H;
  }

  get hitbox() {
    if (this.hidden) return { x: this.x + 8, y: this.y + 30, w: 46, h: 24 };
    if (this.ducking) return { x: this.x + 6, y: this.y + 26, w: 52, h: 28 };
    return { x: this.x + 6, y: this.y + 4, w: 50, h: TURKEY_H - 4 };
  }

  update(dt, input, speed, nearHay) {
    this.runCycle += dt * (this.onGround ? speed / 26 : 6);
    if (this.squash > 0) this.squash = Math.max(0, this.squash - dt * 4);
    if (this.stumble > 0) this.stumble -= dt;
    if (this.invulnerable > 0) this.invulnerable -= dt;

    // Hiding: only while standing still beside a hay bale.
    const wantHide = input.hideHeld && this.onGround && nearHay;
    if (wantHide && !this.hidden) this.hidden = true;
    if (!wantHide) this.hidden = false;
    this.ducking = input.hideHeld && this.onGround && !nearHay && !this.hidden;

    // Dash: a burst of speed that burns stamina.
    this.dashing = input.dashHeld && this.stamina > 5 && !this.hidden && this.stumble <= 0;
    if (this.dashing) {
      this.stamina = Math.max(0, this.stamina - TUNING.dashDrain * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + TUNING.dashRegen * dt);
    }

    // Jump: only from the ground, never while hidden or stumbling.
    if (input.jumpPressed && this.onGround && !this.hidden && this.stumble <= 0) {
      this.vy = -TUNING.jumpVelocity;
      this.onGround = false;
      this.wingFlap = 0.35;
      return 'jump';
    }
    if (this.wingFlap > 0) this.wingFlap -= dt;

    // Gravity.
    this.vy += TUNING.gravity * dt;
    this.y += this.vy * dt;
    if (this.y >= GROUND_Y - TURKEY_H) {
      if (!this.onGround && this.vy > 500) this.squash = 1;
      this.y = GROUND_Y - TURKEY_H;
      this.vy = 0;
      this.onGround = true;
    }
    return null;
  }

  stumbleHit() {
    this.stumble = TUNING.stumbleTime;
    this.invulnerable = TUNING.invulnerableTime;
    this.vy = -320;
    this.onGround = false;
  }

  draw(ctx, time) {
    const bob = this.onGround && !this.hidden ? Math.sin(this.runCycle) * 2.5 : 0;
    const squashY = 1 - this.squash * 0.18;
    const squashX = 1 + this.squash * 0.12;
    const blink = this.invulnerable > 0 && Math.floor(time * 14) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.35;

    ctx.save();
    ctx.translate(this.x + TURKEY_W / 2, this.y + TURKEY_H);
    ctx.scale(squashX, squashY);
    ctx.translate(-TURKEY_W / 2, -TURKEY_H);

    if (this.hidden) {
      // Just the tail fan and a nervous eye peeking over the bale.
      this.drawTailFan(ctx, 30, 46, 0.7);
      ctx.fillStyle = '#FFF3D6';
      ctx.beginPath();
      ctx.arc(44, 34, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2B2118';
      ctx.beginPath();
      ctx.arc(46, 34, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }

    const crouch = this.ducking ? 10 : 0;
    const legSwing = this.onGround ? Math.sin(this.runCycle) * 7 : 4;

    // Tail fan — five autumn feathers fanned behind.
    this.drawTailFan(ctx, 6, 34 - crouch, 1);

    // Legs.
    ctx.strokeStyle = '#E07830';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(30, 48 - crouch);
    ctx.lineTo(30 + legSwing, 54);
    ctx.moveTo(40, 48 - crouch);
    ctx.lineTo(40 - legSwing, 54);
    ctx.stroke();

    // Body: plump brown oval with a cream belly.
    ctx.fillStyle = '#8B5A2B';
    ctx.beginPath();
    ctx.ellipse(32, 32 - crouch, 24, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E8C88A';
    ctx.beginPath();
    ctx.ellipse(38, 38 - crouch, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing, flapping on jump.
    const flap = this.wingFlap > 0 ? -14 : Math.sin(this.runCycle) * 3;
    ctx.fillStyle = '#6B4423';
    ctx.beginPath();
    ctx.ellipse(26, 30 - crouch + flap * 0.4, 13, 8, -0.5 + flap * 0.02, 0, Math.PI * 2);
    ctx.fill();

    // Neck and head.
    ctx.fillStyle = '#8B5A2B';
    ctx.beginPath();
    ctx.ellipse(50, 16 - crouch, 7, 12, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#B06A3B';
    ctx.beginPath();
    ctx.arc(54, 4 - crouch, 8, 0, Math.PI * 2);
    ctx.fill();
    // Wattle and beak.
    ctx.fillStyle = '#D93A2B';
    ctx.beginPath();
    ctx.ellipse(58, 11 - crouch, 3, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E07830';
    ctx.beginPath();
    ctx.moveTo(60, 2 - crouch);
    ctx.lineTo(70, 5 - crouch);
    ctx.lineTo(60, 8 - crouch);
    ctx.closePath();
    ctx.fill();
    // Eye — wide with panic when dashing.
    ctx.fillStyle = '#FFF3D6';
    ctx.beginPath();
    ctx.arc(56, 1 - crouch, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2B2118';
    ctx.beginPath();
    ctx.arc(57, 1 - crouch, this.dashing ? 2 : 1.6, 0, Math.PI * 2);
    ctx.fill();
    // A jaunty little pilgrim-hat band? No — a red headband, this bird is running.
    ctx.strokeStyle = '#D93A2B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(54, 3 - crouch, 8, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawTailFan(ctx, x, y, scale) {
    const colors = ['#C96A2B', '#E07830', '#F2C14E', '#8C2F2F', '#3E6B3A'];
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    colors.forEach((color, i) => {
      const angle = -0.9 + i * 0.45;
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, -20, 6, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF3D6';
      ctx.beginPath();
      ctx.arc(0, -34, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }
}
