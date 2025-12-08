# SLM Price Calculator

Express cost estimation tool for SLM/DMLS 3D-printed parts based on STL geometry.

## Features

### Phase 1 (Current) — Static HTML/JS Prototype
- **STL Upload**: Drag & drop, file picker, or demo cube
- **3D Viewer**: Interactive preview with orbit controls
- **Geometry Analysis**: Volume (cm³), surface area (cm²), bounding box (mm)
- **Cost Calculation**:
  - Material cost = mass × price/kg × scrap factor
  - Machine cost = time × hourly rate
  - Final price = (material + machine) × margin
- **Export**: Copy row or download CSV in format `№ - Part - Unit Price - Qty - Line Total`

### User Inputs
| Parameter | Default | Unit |
|-----------|---------|------|
| Material price | 3000 | RUB/kg |
| Density | 4.5 | g/cm³ |
| Scrap factor | 5 | % |
| Machine rate | 2500 | RUB/hour |
| Productivity | 20 | cm³/hour |
| Manual time | 0 | hours |
| Margin | 15 | % |
| Quantity | 1 | pcs |

## Quick Start

1. Open `index.html` in a browser (or run a local server)
2. Upload an STL file (binary or ASCII)
3. Adjust parameters
4. Click **Рассчитать** (Calculate)
5. Export the quote row

```bash
# Optional: run local server
python -m http.server 8000
# Open http://localhost:8000
```

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS
- **3D**: Three.js r128 (embedded STLLoader + OrbitControls)
- **UI**: Glassmorphism, dark theme, Inter font

## Roadmap — Phase 2

- [ ] Backend (FastAPI or Node)
- [ ] Material/process configs (JSON/YAML)
- [ ] Quote persistence (DB)
- [ ] Improved STL viewer (orientation, supports estimate)
- [ ] Auth & rate limiting
- [ ] Unit tests for formulas

## License

MIT
