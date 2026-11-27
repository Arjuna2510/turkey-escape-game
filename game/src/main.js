// main.js — bootstrap: wire the canvas, input and sound to the game, run the
// frame loop, and honour ?shot=<start|play|kitchen|end> for screenshots.
// A shot renders exactly one deterministic frame of the live game and stops,
// so a screenshot is a real render of the game's own code.

import { Game } from './game.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';

const canvas = document.getElementById('game');
const sound = new SoundBank();
const game = new Game(canvas, sound);
const input = new Input(canvas);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const SHOTS = ['start', 'play', 'kitchen', 'end'];

if (shot && SHOTS.includes(shot)) {
  document.getElementById('hint').style.display = 'none';
  game.setupShot(shot);
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.update(dt, input);
    game.render();
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Expose the game for play-testing from the console; harmless in the shipped game.
window.turkeyRun = game;
