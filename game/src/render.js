// render.js — everything drawn on top of the world: the HUD (score, distance,
// lives, farmer-pressure meter, dash stamina), the title screen, the pause
// card and both end screens (caught / escaped) with restart.

import { VIEW_W, VIEW_H, GROUND_Y, PALETTE, STAGES, ESCAPE_DISTANCE } from './config.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawButton(ctx, x, y, w, h, label, hover) {
  ctx.fillStyle = hover ? '#F2C14E' : PALETTE.pumpkin;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#2B2118';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#2B2118';
  ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  return { x, y, w, h };
}

export function drawHud(ctx, state) {
  // Top bar: score, distance, lives.
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, 14, 12, 300, 64, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.fillText('SCORE', 28, 32);
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  ctx.fillText(String(state.score).padStart(6, '0'), 28, 60);
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.fillText('DISTANCE', 168, 32);
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  ctx.fillText(`${Math.floor(state.distance)} m`, 168, 60);

  // Lives as hearts.
  for (let i = 0; i < state.maxLives; i++) {
    const hx = 330 + i * 34;
    const hy = 34;
    ctx.fillStyle = i < state.lives ? '#D93A2B' : 'rgba(255,243,214,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 8);
    ctx.bezierCurveTo(hx - 12, hy - 4, hx - 5, hy - 12, hx, hy - 5);
    ctx.bezierCurveTo(hx + 5, hy - 12, hx + 12, hy - 4, hx, hy + 8);
    ctx.fill();
  }

  // Stage + progress bar to the forest.
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, VIEW_W - 320, 12, 306, 64, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.fillText(STAGES[state.stageIndex].name, VIEW_W - 306, 34);
  ctx.font = '13px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#F2C14E';
  ctx.fillText(STAGES[state.stageIndex].sub, VIEW_W - 306, 52);
  ctx.fillStyle = 'rgba(255,243,214,0.25)';
  roundRect(ctx, VIEW_W - 306, 60, 278, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#7CB342';
  const progress = Math.min(1, state.distance / ESCAPE_DISTANCE);
  roundRect(ctx, VIEW_W - 306, 60, 278 * progress, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#3E6B3A';
  ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
  ctx.fillText('🌲', VIEW_W - 36, 68);

  // Farmer pressure meter, bottom left: how close the farmer is.
  const px = 14;
  const py = VIEW_H - 46;
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, px, py, 250, 32, 10);
  ctx.fill();
  ctx.fillStyle = '#F2C14E';
  ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FARMER', px + 12, py + 20);
  const mw = 150;
  ctx.fillStyle = 'rgba(255,243,214,0.25)';
  roundRect(ctx, px + 82, py + 10, mw, 12, 6);
  ctx.fill();
  const pressure = Math.min(1, state.pressure / 100);
  ctx.fillStyle = pressure > 0.75 ? '#D93A2B' : pressure > 0.45 ? '#E07830' : '#7CB342';
  roundRect(ctx, px + 82, py + 10, mw * pressure, 12, 6);
  ctx.fill();
  if (state.pressure > 75) {
    ctx.fillStyle = '#D93A2B';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText("HE'S RIGHT BEHIND YOU!", px + 270, py + 21);
  }

  // Dash stamina, bottom right.
  const sx = VIEW_W - 214;
  const sy = VIEW_H - 46;
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, sx, sy, 200, 32, 10);
  ctx.fill();
  ctx.fillStyle = '#F2C14E';
  ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
  ctx.fillText('DASH', sx + 12, sy + 20);
  ctx.fillStyle = 'rgba(255,243,214,0.25)';
  roundRect(ctx, sx + 62, sy + 10, 124, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#4FC3F7';
  roundRect(ctx, sx + 62, sy + 10, 124 * (state.stamina / 100), 12, 6);
  ctx.fill();

  // Floating feedback text ("SPOTTED!", "+50", ...).
  ctx.textAlign = 'center';
  for (const toast of state.toasts) {
    ctx.globalAlpha = Math.max(0, toast.life);
    ctx.font = `bold ${toast.big ? 30 : 20}px "Trebuchet MS", sans-serif`;
    ctx.fillStyle = toast.color;
    ctx.strokeStyle = 'rgba(43,33,24,0.85)';
    ctx.lineWidth = 5;
    ctx.strokeText(toast.text, toast.x, toast.y);
    ctx.fillText(toast.text, toast.x, toast.y);
  }
  ctx.globalAlpha = 1;
}

export function drawTitle(ctx, best, hoverStart, hoverHow) {
  ctx.fillStyle = 'rgba(43, 33, 24, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.hayGold;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('T H A N K S G I V I N G   I S   C O M I N G', VIEW_W / 2, 92);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('TURKEY RUN', VIEW_W / 2, 172);
  ctx.fillStyle = PALETTE.pumpkin;
  ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
  ctx.fillText('— Thanksgiving Escape —', VIEW_W / 2, 214);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '20px "Trebuchet MS", sans-serif';
  ctx.fillText('The farmer is sharpening the carving knife. The oven is preheating.', VIEW_W / 2, 258);
  ctx.fillText('Run 3,000 metres to the forest — jump the fences, dodge the knives,', VIEW_W / 2, 286);
  ctx.fillText('hide in the hay when the farmer closes in. Do not become dinner.', VIEW_W / 2, 314);

  const startBtn = drawButton(ctx, VIEW_W / 2 - 130, 348, 260, 56, '▶  START THE RUN', hoverStart);
  const howBtn = drawButton(ctx, VIEW_W / 2 - 130, 416, 260, 44, 'HOW TO PLAY', hoverHow);
  if (best > 0) {
    ctx.fillStyle = '#F2C14E';
    ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
    ctx.fillText(`Best escape score: ${best}`, VIEW_W / 2, 492);
  }
  return { startBtn, howBtn };
}

export function drawHowTo(ctx, hoverBack) {
  ctx.fillStyle = 'rgba(43, 33, 24, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PALETTE.cream;
  ctx.textAlign = 'center';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText('HOW TO PLAY', VIEW_W / 2, 84);
  const lines = [
    ['SPACE / ↑ / CLICK', 'Jump the fences, pumpkins and oven flames'],
    ['↓  near a hay bale', 'Hide! The farmer loses your trail and cools off'],
    ['↓  in the open', 'Duck under the high carving knives'],
    ['SHIFT', 'Dash — fast, but it burns stamina'],
    ['CORN', 'Eat it: +50 points and the farmer falls back a little'],
    ['THE FARMER', 'His meter fills as you dawdle or stumble. At full — caught!'],
    ['THE OVEN', 'Stage 3: flames erupt from the floor vents. Time your jump'],
  ];
  ctx.font = '18px "Trebuchet MS", sans-serif';
  lines.forEach(([key, text], i) => {
    const y = 140 + i * 44;
    ctx.fillStyle = '#F2C14E';
    ctx.textAlign = 'right';
    ctx.fillText(key, VIEW_W / 2 - 30, y);
    ctx.fillStyle = PALETTE.cream;
    ctx.textAlign = 'left';
    ctx.fillText(text, VIEW_W / 2 - 10, y);
  });
  const backBtn = drawButton(ctx, VIEW_W / 2 - 90, 452, 180, 48, '← BACK', hoverBack);
  return { backBtn };
}

export function drawPaused(ctx, hoverResume) {
  ctx.fillStyle = 'rgba(43, 33, 24, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PALETTE.cream;
  ctx.textAlign = 'center';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText('PAUSED', VIEW_W / 2, 220);
  ctx.font = '20px "Trebuchet MS", sans-serif';
  ctx.fillText('The turkey catches its breath. The farmer waits. He is patient.', VIEW_W / 2, 262);
  const resumeBtn = drawButton(ctx, VIEW_W / 2 - 110, 300, 220, 52, 'RESUME', hoverResume);
  return { resumeBtn };
}

export function drawEnd(ctx, state, hoverRestart, hoverMenu) {
  const escaped = state.outcome === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(62, 107, 58, 0.55)' : 'rgba(140, 47, 47, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', VIEW_W / 2, 150);
  ctx.font = '22px "Trebuchet MS", sans-serif';
  if (escaped) {
    ctx.fillText('You burst through the forest gate, feathers flying,', VIEW_W / 2, 196);
    ctx.fillText('and Thanksgiving dinner will have to be tofu this year.', VIEW_W / 2, 226);
  } else if (state.lives <= 0) {
    ctx.fillText('Three stumbles too many — the farmer scoops you up.', VIEW_W / 2, 196);
    ctx.fillText('The oven was already warm. Better luck next run.', VIEW_W / 2, 226);
  } else {
    ctx.fillText('The farmer finally caught up and grabbed you by the tail.', VIEW_W / 2, 196);
    ctx.fillText('The oven was already warm. Better luck next run.', VIEW_W / 2, 226);
  }
  ctx.fillStyle = '#F2C14E';
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  ctx.fillText(
    `Score ${state.score}   ·   ${Math.floor(state.distance)} m   ·   ${state.corn} corn`,
    VIEW_W / 2,
    286,
  );
  if (state.newBest) {
    ctx.fillStyle = '#7CB342';
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.fillText('★ NEW BEST SCORE ★', VIEW_W / 2, 322);
  }
  const restartBtn = drawButton(ctx, VIEW_W / 2 - 140, 352, 280, 56, '↻  RUN AGAIN', hoverRestart);
  const menuBtn = drawButton(ctx, VIEW_W / 2 - 140, 420, 280, 44, 'TITLE SCREEN', hoverMenu);
  return { restartBtn, menuBtn };
}

export function drawStageCard(ctx, stage, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.strokeStyle = 'rgba(43,33,24,0.8)';
  ctx.lineWidth = 8;
  ctx.strokeText(stage.name, VIEW_W / 2, 220);
  ctx.fillText(stage.name, VIEW_W / 2, 220);
  ctx.font = '22px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#F2C14E';
  ctx.fillText(stage.sub, VIEW_W / 2, 258);
  ctx.restore();
}
