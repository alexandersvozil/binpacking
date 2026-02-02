# CLAUDE.md

## Project Overview

This is a **3D Bin Packing Visualizer** - an interactive web application that demonstrates two packing strategies side-by-side:
- **Sequential (As Arrives)**: Greedy "lowest position" algorithm that places packages immediately
- **Optimized (Batch/10)**: First-Fit-Decreasing algorithm that collects 10 packages before optimizing placement

The visualization helps understand the difference between naive real-time packing versus batch optimization in warehouse/logistics operations.

## Tech Stack

- **Three.js (r128)** - 3D graphics via CDN
- **Vanilla JavaScript (ES6 modules)** - No framework
- **HTML5/CSS3** - No build tools required

## Directory Structure

```
binpacking/
├── index.html          # Main HTML file with UI controls
├── styles.css          # All styling
└── js/
    ├── config.js       # Constants: scale, cart dimensions, package types
    ├── main.js         # App logic, event handlers, animation loop
    └── PackingScene.js # 3D scene rendering and packing algorithms
```

## Running the Project

No build process needed. Serve with any HTTP server:

```bash
python -m http.server 8000
# or
npx http-server
```

Then open `http://localhost:8000`

## Key Configuration

In `js/config.js`:
- `SCALE`: 1 inch = 0.04 3D units
- Default cart: 24" W × 18" D × 24" H
- 8 package types with realistic USPS/UPS/FedEx dimensions

## Important Patterns

- All measurements are in **inches** (converted to 3D units via SCALE)
- Packages support 90° rotation for better fitting
- Dimension variations of ±10% add realism
- Two `PackingScene` instances manage left (sequential) and right (optimized) views

## Key Files

- `PackingScene.js:85` - Sequential packing algorithm (`findLowestPosition`)
- `PackingScene.js:200` - Optimized FFD algorithm (`optimizedPack`)
- `main.js:45` - Animation loop and package spawning logic
