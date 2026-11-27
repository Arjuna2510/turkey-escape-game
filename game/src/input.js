// input.js — keyboard + mouse + touch, reduced to one small state object.
// The game polls `pressed` edges each frame; menus read clicks through the same bus.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.justPressed = new Set();
    this.pointerDown = false;
    this.pointerJustDown = false;
    this.pointerX = 0;
    this.pointerY = 0;
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.justPressed.add(event.code);
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pointerDown = false;
    });

    const toLocal = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height,
      };
    };
    canvas.addEventListener('pointerdown', (event) => {
      const p = toLocal(event.clientX, event.clientY);
      this.pointerX = p.x;
      this.pointerY = p.y;
      this.pointerDown = true;
      this.pointerJustDown = true;
    });
    canvas.addEventListener('pointerup', () => {
      this.pointerDown = false;
    });
    canvas.addEventListener('pointermove', (event) => {
      const p = toLocal(event.clientX, event.clientY);
      this.pointerX = p.x;
      this.pointerY = p.y;
    });
  }

  down(...codes) {
    return codes.some((c) => this.keys.has(c));
  }

  pressed(...codes) {
    return codes.some((c) => this.justPressed.has(c));
  }

  get jumpPressed() {
    return this.pressed('Space', 'ArrowUp', 'KeyW') || this.pointerJustDown;
  }

  get hideHeld() {
    return this.down('ArrowDown', 'KeyS');
  }

  get dashHeld() {
    return this.down('ShiftLeft', 'ShiftRight');
  }

  get pausePressed() {
    return this.pressed('KeyP', 'Escape');
  }

  get mutePressed() {
    return this.pressed('KeyM');
  }

  get confirmPressed() {
    return this.pressed('Enter', 'Space') || this.pointerJustDown;
  }

  endFrame() {
    this.justPressed.clear();
    this.pointerJustDown = false;
  }
}
