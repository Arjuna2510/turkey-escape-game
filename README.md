# turkey-escape-game

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/Arjuna2510/turkey-escape-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/Arjuna2510/turkey-escape-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Turkey Run: Thanksgiving Escape — a complete, original turkey escape game that plays offline in a desktop browser from its own static files. You are the turkey. The farmer is sharpening the carving knife, the oven is preheating, and Thanksgiving is coming. Run 3,000 metres from the farmyard, through the barn and past the kitchen oven, to the forest gate — jump the fences, dodge the flying carving knives, duck the high ones, hide in the hay bales when the farmer closes in, and eat corn to slow him down. Get caught and you are dinner.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 and play with keyboard and mouse: **Space / ↑ / click** jump, **↓** hide behind hay or duck, **Shift** dash, **P** pause, **M** sound on/off.

## How it plays

- **Three stages, one escape** — Farmyard (1,000 m), Barn (1,000 m), Kitchen (1,000 m). Each stage is faster, spawns hazards closer together, and makes the farmer less patient.
- **The farmer chases, searches and corners** — his pressure meter fills as you dawdle or stumble. Hide in a hay bale and he loses your trail; hide too long in one spot and he gets suspicious, walks over, and spots you.
- **Dangers** — fences and rolling pumpkins (jump), low carving knives (jump) and high ones (duck), kitchen oven flames that erupt from floor vents on a timer.
- **Score** — distance, corn (+50 each), stage bonuses, and a 1,000-point escape bonus. Three lives; a hit costs a life, a stumble, and a surge of farmer pressure.
- **Sound** — everything is synthesized with WebAudio: a folk jig, gobbles, jumps, alarms and fanfares. No audio files, no network requests.

## Layout

- `game/index.html` — the page; `game/src/` holds the game, one file per job: `config.js` (tuning + stages), `game.js` (state machine + loop), `turkey.js` (player physics + drawing), `farmer.js` (farmer AI + drawing), `hazards.js` (fences, knives, flames, corn, hay), `world.js` (stages, spawning, scenery), `render.js` (HUD, menus, end screens), `audio.js` (synthesized sound), `input.js` (keyboard + mouse), `main.js` (bootstrap + screenshot modes).
- `screenshots/` — real renders of the game running in a browser.
- `main.ts` — the make.fun entrypoint: copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
