// farmer.js — the farmer: he chases, searches and corners.
// His distance from the turkey is the pressure meter. He has three moods:
// CHASE (striding after the bird), SEARCH (lost the trail, looking around),
// LUNGE (he spotted the hiding turkey and dives at the bale).

import { GROUND_Y, clamp } from './config.js';

export const FARMER_W = 58;
export const FARMER_H = 96;

export const FarmerMood = {
  CHASE: 'chase',
  SEARCH: 'search',
  LUNGE: 'lunge',
};

export class Farmer {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = -30; // off the left edge; pressure pulls him on-screen
    this.mood = FarmerMood.CHASE;
    this.searchTimer = 0;
    this.suspicion = 0; // grows while the turkey hides in one spot
    this.walkCycle = 0;
    this.lookDir = 1; // which way he is peering while searching
    this.lookTimer = 0;
    this.armSwing = 0;
  }

  // pressure 0..100 maps to how close he is: 0 = off-screen left, 100 = on the bird.
  update(dt, pressure, turkeyHidden, turkeyX, stage) {
    const targetX = -40 + (pressure / 100) * (turkeyX - 10);
    const wasHidden = this.mood === FarmerMood.SEARCH;

    if (this.mood === FarmerMood.SEARCH) {
      this.searchTimer -= dt;
      this.lookTimer -= dt;
      if (this.lookTimer <= 0) {
        this.lookDir *= -1;
        this.lookTimer = 0.7 + Math.random() * 0.9;
      }
      // He creeps toward the bale while the turkey hides too long.
      if (turkeyHidden) {
        this.suspicion += dt;
        this.x = Math.min(this.x + 26 * dt, turkeyX - 130);
      } else {
        this.suspicion = Math.max(0, this.suspicion - dt * 2);
      }
      if (this.searchTimer <= 0) this.mood = FarmerMood.CHASE;
      if (this.suspicion > stage.farmerPatience) {
        this.mood = FarmerMood.LUNGE;
        this.suspicion = 0;
        return 'spotted';
      }
    } else if (this.mood === FarmerMood.LUNGE) {
      this.x += 520 * dt;
      this.armSwing += dt * 14;
      if (this.x > turkeyX - 30) {
        this.mood = FarmerMood.CHASE;
        return 'lunged';
      }
    } else {
      // CHASE: stride toward the pressure target, never quite teleporting.
      const diff = targetX - this.x;
      this.x += clamp(diff, -1, 1) * Math.min(Math.abs(diff), 150 * dt + Math.abs(diff) * 1.4 * dt);
      this.walkCycle += dt * (6 + pressure / 14);
      this.armSwing = Math.sin(this.walkCycle) * 0.5;
      if (turkeyHidden && !wasHidden) {
        this.mood = FarmerMood.SEARCH;
        this.searchTimer = 3.2;
        this.suspicion = 0;
        return 'lostTrail';
      }
    }
    return null;
  }

  get hitbox() {
    return { x: this.x + 8, y: GROUND_Y - FARMER_H, w: FARMER_W - 16, h: FARMER_H };
  }

  draw(ctx) {
    const x = this.x;
    const ground = GROUND_Y;
    const legSwing = this.mood === FarmerMood.SEARCH ? 0 : Math.sin(this.walkCycle) * 9;
    const lungeLean = this.mood === FarmerMood.LUNGE ? 0.35 : 0.06;

    ctx.save();
    ctx.translate(x + FARMER_W / 2, ground);
    ctx.rotate(lungeLean);
    ctx.translate(-FARMER_W / 2, -ground);

    // Legs: dark work boots and denim.
    ctx.strokeStyle = '#2E3A4A';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(24, ground - 34);
    ctx.lineTo(24 + legSwing, ground);
    ctx.moveTo(38, ground - 34);
    ctx.lineTo(38 - legSwing, ground);
    ctx.stroke();
    ctx.fillStyle = '#5B3A1E';
    ctx.fillRect(18 + legSwing, ground - 6, 12, 6);
    ctx.fillRect(32 - legSwing, ground - 6, 12, 6);

    // Overalls over a red flannel shirt.
    ctx.fillStyle = '#C0392B';
    ctx.fillRect(14, ground - 72, 36, 40);
    ctx.fillStyle = '#3B5B8C';
    ctx.fillRect(16, ground - 66, 32, 34);
    ctx.fillStyle = '#2F4A73';
    ctx.fillRect(20, ground - 72, 5, 14);
    ctx.fillRect(39, ground - 72, 5, 14);
    // Brass buttons.
    ctx.fillStyle = '#F2C14E';
    ctx.beginPath();
    ctx.arc(22, ground - 58, 2.4, 0, Math.PI * 2);
    ctx.arc(42, ground - 58, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Arms: one reaching forward when lunging, both swinging when chasing.
    ctx.strokeStyle = '#C0392B';
    ctx.lineWidth = 8;
    ctx.beginPath();
    if (this.mood === FarmerMood.LUNGE) {
      ctx.moveTo(46, ground - 62);
      ctx.lineTo(66, ground - 52);
    } else {
      ctx.moveTo(16, ground - 64);
      ctx.lineTo(8, ground - 40 + this.armSwing * 10);
      ctx.moveTo(48, ground - 64);
      ctx.lineTo(56, ground - 40 - this.armSwing * 10);
    }
    ctx.stroke();

    // Head with a big moustache and a straw hat.
    ctx.fillStyle = '#E8B88A';
    ctx.beginPath();
    ctx.arc(34, ground - 84, 12, 0, Math.PI * 2);
    ctx.fill();
    // Moustache.
    ctx.fillStyle = '#6B4A2E';
    ctx.beginPath();
    ctx.ellipse(38, ground - 80, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes: narrowed when searching, wide when lunging.
    ctx.fillStyle = '#2B2118';
    const eyeH = this.mood === FarmerMood.SEARCH ? 1.5 : 3;
    ctx.beginPath();
    ctx.ellipse(38, ground - 88, 2, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();
    // Straw hat.
    ctx.fillStyle = '#E8C86A';
    ctx.beginPath();
    ctx.ellipse(34, ground - 94, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(24, ground - 106, 20, 12);
    ctx.fillStyle = '#8C2F2F';
    ctx.fillRect(24, ground - 98, 20, 3);

    // A "?" bubble while he searches.
    if (this.mood === FarmerMood.SEARCH) {
      ctx.fillStyle = '#FFF3D6';
      ctx.strokeStyle = '#2B2118';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(58, ground - 116, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2B2118';
      ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 58, ground - 115);
    }
    ctx.restore();
  }
}
