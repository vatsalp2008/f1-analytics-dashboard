# F1 Analytics — Frontend

React + Vite single-page app for the F1 Analytics Dashboard: race predictions
and a telemetry replay engine for the 2025 season. It talks to the FastAPI
backend at `http://localhost:8000/api`.

## Stack

- **React 19** + **Vite**
- **axios** for API calls, **lucide-react** for icons
- **[ReactBits](https://reactbits.dev)** animated UI components (vendored under
  `src/reactbits/`), backed by **motion**, **gsap**, and **ogl**

## Views

- **Race Replay** — pick a season/round/session, then launch a canvas-based
  telemetry replay (track map, leaderboard, per-driver telemetry, playback controls).
- **Predictions** — per-race predicted finishing order with grid delta and form.

## ReactBits components in use

| Area | Component |
|------|-----------|
| Global | ClickSpark |
| Header | Particles, SplitText, ShinyText, GooeyNav |
| Panels | SpotlightCard |
| Launch CTA | StarBorder |
| Stats | CountUp |
| Replay backdrop | Aurora |

WebGL backgrounds (Particles, Aurora) are loaded with `React.lazy` to keep the
main bundle lean.

## Development

```bash
npm install
npm run dev      # start Vite dev server
npm run build    # production build
npm run lint     # eslint
```

The backend must be running for data to load — from the repo root:
`npm run dev` (starts both the FastAPI backend and this frontend).
