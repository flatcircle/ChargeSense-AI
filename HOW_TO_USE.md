# ChargeSense AI — How-To-Use Guide & Feature Walkthrough

Welcome to **ChargeSense AI**, a comprehensive, research-backed electric vehicle (EV) charging optimization and grid planning platform built for **MPPKVVCL** (Madhya Pradesh Paschim Kshetra Vidyut Vitaran Company, Indore). 

This guide walks you through the platform's **17 feature modules** across the Operations, Analytics, and Research layers. Each section contains detailed feature descriptions, technical background context, and step-by-step examples of how to interact with the platform.

---

## Table of Contents
1. [Operations Layer](#1-operations-layer)
   - [Dashboard](#11-dashboard)
   - [Forecast](#12-forecast)
   - [Plan Generator](#13-plan-generator)
   - [Proposals](#14-proposals)
   - [Approval Flow](#15-approval-flow)
   - [Map View](#16-map-view)
2. [Analytics Layer](#2-analytics-layer)
   - [Grid Analytics](#21-grid-analytics)
   - [ROI Benchmark](#22-roi-benchmark)
   - [Baseline Compare](#23-baseline-compare)
   - [Community Score](#24-community-score)
   - [Load Alerts](#25-load-alerts)
   - [Slot Booking](#26-slot-booking)
3. [Research Layer](#3-research-layer)
   - [RL Scheduling](#31-rl-scheduling)
   - [Solar Synergy](#32-solar-synergy)
   - [V2G Degradation](#33-v2g-degradation)
   - [GNN Placement](#34-gnn-placement)
   - [PINN Forecast](#35-pinn-forecast)
4. [AI Chat Integration (Gemini Chat)](#4-ai-chat-integration-gemini-chat)

---

## 1. Operations Layer

### 1.1 Dashboard
* **Description**: The primary control room interface presenting executive metrics for EV planning. Renders high-level KPIs aggregated across Indore districts and zones.
* **KPIs Displayed**:
  * **Pincodes Analyzed**: Number of local zones modeled.
  * **Active Chargers**: Count of existing public chargers.
  * **Proposals Staged**: Plans waiting in the queue.
  * **Projected Year 1 Revenue**: Estimated cash flow yield in Lakhs.
* **Example Usage**: Look at the district-wide overview cards to inspect the current state of MPPKVVCL’s charging footprint at a glance.

### 1.2 Forecast
* **Description**: A 24-hour time-series predictive demand module showing peak charging coincidences against grid capacity. 
* **Key Features**:
  * Visualizes the peak load hours (typically evening coincidences 18:00 - 22:00).
  * Outlines the Time-of-Use (TOU) tariff windows (solar, peak, and off-peak).
* **Example Usage**: Click a district in the sidebar filter to view its specific 24h demand load curve and identify when the grid is approaching headroom capacity.

### 1.3 Plan Generator
* **Description**: An interactive multi-objective optimization wizard to simulate and generate new EV charging hub proposals.
* **How to use**:
  1. Set your **Budget** limit (in Lakhs) using the input fields.
  2. Choose the **Desired Payback Period** constraint (e.g., maximum 24 months).
  3. Specify the **Target Hub Count** (number of sites to place).
  4. Select your **Primary Optimization Priority** (e.g., Maximize Utilization, Maximize Grid Safety, or Balanced).
  5. Click **Run Optimization**.
* **Result**: The system will dynamically generate a list of optimized site proposals, persist them to the shared in-memory database, and render a preview table on the same page. These proposals will immediately show up on your global Map View and Proposals List.

### 1.4 Proposals
* **Description**: A management table for all generated and staged EV charging proposals.
* **Key Details**: Renders composite location scores, available capacity, and payback timeframes.
* **Action Steps**: You can click **Approve** or **Reject** on any individual proposal to move it through the MPPKVVCL validation pipeline.

### 1.5 Approval Flow
* **Description**: A visual Kanban board representing the 4-stage deployment pipeline for all approved proposals.
* **Pipeline Stages**: `AI-Generated` → `Engineer Review` → `Supervisor Audit` → `Deployed`.
* **Example Usage**: Drag and drop proposals or click the transition buttons to progress a proposal toward physical installation.

### 1.6 Map View
* **Description**: An interactive, leaf-based spatial map plotting Indore’s charging network.
* **Key Features**:
  * **Toggleable Layers**: Turn on/off layers for existing chargers, newly proposed sites, and high-demand hotspots.
  * **Dynamic Reloading**: Automatically updates its pins and markers whenever you run a new optimizer in the **Plan Generator**.
  * **Safe ESM Overrides**: Safe default Leaflet asset rendering across all browsers.

---

## 2. Analytics Layer

### 2.1 Grid Analytics
* **Description**: A detailed dashboard focused on feeder health, transformer loading safety limits, and harmonics mitigation.
* **Key Features**:
  * **Feeder Stress Simulator**: Tweak the peak demand slider to see simulated load sags and read active engineering suggestions.
  * **Grid Advisory Terminal**: Details deep electrical concepts (e.g., Transformer Thermal Aging, Harmonics, Cascading Grid Faults).
* **Example Usage**: Tweak the simulated peak demand load. If demand exceeds 90% capacity, watch the feeder stress status change to "CRITICAL" and read the automated advisory recommendation.

### 2.2 ROI Benchmark
* **Description**: A financial analytics model comparing initial CapEx deployment costs against long-term operational yields.
* **Key Features**:
  * Projects 5-year cumulative cash flows.
  * Separates standard charging revenues from V2G (Vehicle-to-Grid) arbitrage savings.

### 2.3 Baseline Compare
* **Description**: A visual benchmark mapping the performance of ChargeSense AI against traditional naive placement strategies (Uniform Grid and Population-Proportional).
* **How to use**:
  * Drag the **Simulated EV Growth Rate Slider** (10% to 100% YoY).
  * Observe the three multi-year projection graphs update in real-time.
  * **Coverage Growth**: Watch how ChargeSense AI reaches 100% coverage faster than other models.
  * **Grid Overload Events**: Compare how uniform placement results in a spike in transformer failures as the EV fleet expands, while ChargeSense AI keeps incidents low.
  * **Revenue Projections**: Observe how ChargeSense AI’s focus on high-traffic corridors maximizes capital efficiency over a 5-year timeline.

### 2.4 Community Score
* **Description**: A civic readiness score (0–100) per pincode, showing how prepared different Indore neighborhoods are for the EV transition.
* **How to use**:
  * Locate the **CCS Weights Customization Sandbox**.
  * Adjust the sliders: *Charger Density*, *Grid Headroom*, *Transit Proximity*, and *Income & EV Adoption*.
  * Observe the **Live CCS Formula** update its coefficients in real-time.
  * Check the **Grade Distribution Bar Chart** and the **Zone Scores List** to see how neighborhood readiness classifications shift instantly based on your priorities.
  * Click **AI Advice** on any zone to generate custom MPPKVVCL recommendations.

### 2.5 Load Alerts
* **Description**: A tiered load-shedding warning system (Tier 1: 90% load, Tier 2: 95% load) that protects regional transformers.
* **How to use**:
  * Click the **Telemetry Logs** button on any warning.
  * View real-time simulated telemetry details (Line Current in Amps, Voltage Sags, Power Factor $\cos\phi$, Thermal Aging Multiplier, and Total Harmonic Distortion %).
  * Click **✨ AI Report** to generate a structured incident summary using Gemini.
  * Click **Acknowledge** to mark the warning resolved.

### 2.6 Slot Booking
* **Description**: A mock user booking interface that demonstrates grid demand response via dynamic pricing incentives.
* **How to use**:
  * Toggle between different booking slots (Solar Peak, Off-Peak, Evening Peak).
  * Notice the **Incentive Level** and **Charging Rates** change dynamically.
  * Change the vehicle type and battery capacity, then watch the **Dynamic Carbon Footprint Tracker** compute the exact CO₂ savings (kilograms) achieved by shifting your session out of the evening peak.

---

## 3. Research Layer

### 3.1 RL Scheduling
* **Description**: A Reinforcement Learning simulator showcasing a Q-learning agent training to schedule pricing structures dynamically.
* **Key Features**:
  * Visualizes the training convergence curve (Cumulative Reward vs. Episodes).
  * Displays the learned pricing policy across solar, peak, and night hours.
* **Example Usage**: Click **Retrain Agent** to simulate training updates, showing how the agent learns to penalize peak grid peaks.

### 3.2 Solar Synergy
* **Description**: An index modeling the integration of rooftop Solar PV and EV charging hubs, aligned with Madhya Pradesh's solar energy policies.
* **Key Features**: Maps regional solar irradiance indices against EV load peaks, ranking pincodes by self-sufficiency potential.

### 3.3 V2G Degradation
* **Description**: An advanced battery degradation model evaluating the net economic viability of Vehicle-to-Grid cycling.
* **Key Features**: Employs semi-empirical equations (Schenk et al. 2023) to compute the State of Health (SOH) loss of LFP/NMC batteries when discharging back into the grid, balancing arbitrage income against battery replacement costs.

### 3.4 GNN Placement
* **Description**: A Graph Neural Network simulator that treats regional power feeders as connected vertices to optimize charger locations.
* **How to use**:
  * Select the number of **Graph Convolutional Layers** (1, 2, or 3) in the simulator card.
  * Observe the **Active Message Passing Equation** change dynamically.
  * Notice how the **Node Scores table** and the **Multi-Dim Topology Radar Chart** smooth out as you increase layer depth, demonstrating how the GNN gains macro-grid visibility (multi-hop propagation).
  * Read the technical guide to understand GNN message aggregation.

### 3.5 PINN Forecast
* **Description**: A Physics-Informed Neural Network forecasting module that embeds Kirchhoff’s and Ohm’s laws directly into the loss function regularizer.
* **How to use**:
  * Choose a **Grid Weather Scenario** (Normal, Heatwave, or Monsoon) to simulate grid stress.
  * Drag the **Physics Loss Weight slider (λ)** from `0.0` (pure machine learning) to `1.0` (strict physical limits).
  * Observe the **PINN MAE** score and the **Error Comparison Chart** update in real-time.
  * Note how increasing the physics weight regularizes predictions during anomalous weather events (like heatwaves), bringing model predictions closer to the actual physical limits compared to standard ML networks.

---

## 4. AI Chat Integration (Gemini Chat)
* **Description**: A persistent intelligent assistant situated in the bottom right corner of the application interface.
* **How to use**:
  * Type questions regarding MPPKVVCL EV planning, grid limits, V2G policy, or the underlying mathematical formulas.
  * The assistant will reply instantly, utilizing the context of the platform's active mock database.
  * If a rate limit or quota occurs, the interface will automatically rotate through the backup API keys in the background, ensuring uninterrupted assistance.
