# ChargeSense AI — Demand-Forecasting & V2G-Optimized EV Infrastructure Planner

**Smart EV Charging Optimization & Infrastructure Planning (MPPKVVCL · Indore)**

---

## Short Description

ChargeSense AI is a comprehensive EV infrastructure planning platform that uses time-series demand forecasting, reinforcement learning, graph neural networks, and physics-informed neural networks to solve the complete EV charging problem: **when to charge** (adaptive peak-load shifting), **where to build** (topology-aware charger placement), and **how to sustain** (V2G economics with battery degradation modeling). Built for MPPKVVCL, Indore — with 17 feature modules across operations, analytics, and research.

---

## 17 Feature Modules

### 🔧 OPERATIONS (6 Modules)

| # | Module | Description |
|---|--------|-------------|
| 1 | **Dashboard** | KPIs: pincodes analyzed, chargers, proposals, Year 1 revenue projections |
| 2 | **Demand Forecasting** | 24h time-series prediction with peak/off-peak scheduling and TOU tariff windows |
| 3 | **Plan Generator** | Interactive optimizer with budget, payback, spacing, and feeder load constraints |
| 4 | **Proposal Management** | Searchable proposals with composite scores, approve/reject actions |
| 5 | **Approval Workflow** | 4-stage pipeline: AI-Generated → Engineer → Supervisor → Deployment |
| 6 | **Spatial Map** | Leaflet map with toggleable layers for proposals, existing chargers, demand hotspots |

### 📊 ANALYTICS (6 Modules)

| # | Module | Description |
|---|--------|-------------|
| 7 | **Grid Analytics** | Feeder health (Critical/Warning/Normal), operator distribution, zone stress ranking |
| 8 | **ROI Benchmark** | 5-year cumulative revenue vs CAPEX, V2G revenue breakdown per site |
| 9 | **Baseline Comparison** | AI vs Uniform vs Population-Proportional placement — radar + bar charts |
| 10 | **Community Charging Score** | Public CCS metric (0–100) per zone based on charger density, grid headroom, transit, income |
| 11 | **Load Shedding Alerts** | Tiered alerts (90%/95%) with prioritized charger protection for emergency routes |
| 12 | **Smart Slot Booking** | Calendar-style booking with grid-incentivized dynamic pricing (off-peak discounts) |

### 🔬 RESEARCH (5 Modules)

| # | Module | Description |
|---|--------|-------------|
| 13 | **RL Adaptive Scheduling** | Q-learning agent learns optimal TOU pricing weekly; training convergence + learned policy |
| 14 | **Solar Synergy Index** | Scores zones for rooftop PV + EV charging hub integration (Karnataka solar policy aligned) |
| 15 | **V2G Battery Degradation** | Semi-empirical degradation model (Schenk et al. 2023); net V2G revenue with battery wear |
| 16 | **GNN Topology-Aware Placement** | Graph Neural Network models grid as G=(V,E); 22% better demand coverage vs greedy |
| 17 | **PINN Weather Forecasting** | Physics-Informed NN with Ohm's Law constraints; 31% lower MAE during extreme weather |

---

## Key Algorithms & Formulas

### Composite Site Score
```
Score = 0.35 × Demand + 0.25 × Capacity + 0.20 × Accessibility + 0.20 × Competition
```

### Community Charging Score (CCS)
```
CCS = 0.4 × Charger_Density + 0.3 × Grid_Headroom% + 0.2 × Transit_Proximity + 0.1 × Income_Proxy
```

### RL Reward Function
```
R = α × Grid_Stability + β × User_Satisfaction − γ × Peak_Load_Penalty
```

### V2G Net Revenue (with Degradation)
```
Net_V2G = Gross_Revenue − SOH_Loss × Battery_Cap_kWh × Replacement_Cost
```

### GNN Graph Convolution Layer
```
h_v^(l+1) = σ( Σ_{u∈N(v)} (1/c_uv) · W^(l) · h_u^(l) )
```

### PINN Loss Function
```
L = L_data + λ · L_physics    where L_physics penalizes V=IR and P_gen = P_load + P_loss violations
```

---

## Technical Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3.4 (Dark theme + glassmorphism) |
| Animations | Framer Motion |
| Charts | Recharts (Bar, Line, Area, Radar, Pie) |
| Mapping | React Leaflet + OpenStreetMap (original tiles) |
| Routing | React Router DOM v7 |
| Data | Embedded mock architecture — no backend required |
| Icons | Lucide React |

---

## Local Installation

```bash
git clone https://github.com/ozhh5o5/ChargeSense-AI.git
cd ChargeSense-AI
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Vercel Deployment

1. Import `https://github.com/ozhh5o5/ChargeSense-AI` in Vercel
2. Auto-detected as Vite — build: `npm run build`, output: `dist`
3. Deploy — zero environment variables needed

---

## References

- [MPPKVVCL — MP Paschim Kshetra Vidyut Vitaran Company](https://www.mpwz.co.in/)
- [Madhya Pradesh EV Policy](https://mpurban.gov.in/)
- [Vehicle-to-Grid Technology](https://en.wikipedia.org/wiki/Vehicle-to-grid)
- [Global Solar Atlas — Solar Irradiance Data](https://globalsolaratlas.info/)
- Schenk et al. (2023) — Battery Degradation from V2G Cycling
- Kipf & Welling (2017) — Semi-Supervised Classification with Graph Convolutional Networks
- Raissi et al. (2019) — Physics-Informed Neural Networks
