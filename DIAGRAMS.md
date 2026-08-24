# ChargeSense AI — UML & Architecture Diagrams

These diagrams are styled to match the dark green presentation theme (Hex `#0B2215` / `#10B981`). You can use the Mermaid code in GitHub, Notion, or any Markdown viewer that supports Mermaid. I have also included PlantUML code if you prefer standard UML tools.

---

## 1. System Architecture Diagram (Mermaid)

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#0B2215',
    'primaryTextColor': '#FFFFFF',
    'primaryBorderColor': '#10B981',
    'lineColor': '#10B981',
    'fontFamily': 'sans-serif'
  }
}}%%
flowchart TD
    classDef layer fill:#0A1A12,stroke:#143D29,stroke-width:2px,color:#10B981;
    classDef module fill:#0B2215,stroke:#10B981,stroke-width:1px,color:#FFFFFF,rx:5,ry:5;
    classDef data fill:#143D29,stroke:#10B981,stroke-width:1px,color:#FFFFFF,rx:5,ry:5;

    subgraph UI["User Interface Layer (React 18 + Vite + Tailwind)"]
        direction LR
        Ops[Operations UI]:::module
        Ana[Analytics UI]:::module
        Res[Research UI]:::module
    end
    class UI layer

    subgraph Visual["Visualization Engine"]
        direction LR
        Maps[Leaflet Spatial Maps]:::module
        Charts[Recharts Dashboards]:::module
        Anim[Framer Motion]:::module
    end
    class Visual layer

    subgraph Logic["AI & Simulation Engines (Client-Side)"]
        direction LR
        Opt[Constrained Optimizer\n& GNN Simulator]:::module
        RL[RL Adaptive\nScheduler]:::module
        PINN[PINN Extreme\nWeather Forecaster]:::module
        V2G[V2G Degradation\nModel]:::module
    end
    class Logic layer

    subgraph Data["Mock Data Architecture"]
        direction LR
        Pincodes[(Pincode\nTopology)]:::data
        Stations[(Competitor\nChargers)]:::data
        Proposals[(AI Proposals\nState)]:::data
    end
    class Data layer

    UI ==> Visual
    Visual ==> Logic
    Logic ==> Data
```

---

## 2. Use Case Diagram (Mermaid)

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#0B2215',
    'primaryTextColor': '#FFFFFF',
    'primaryBorderColor': '#10B981',
    'lineColor': '#10B981',
    'fontFamily': 'sans-serif'
  }
}}%%
flowchart LR
    classDef actor fill:none,stroke:#10B981,stroke-width:2px,color:#10B981;
    classDef usecase fill:#0B2215,stroke:#10B981,stroke-width:1px,color:#FFFFFF,rx:20,ry:20;
    classDef boundary fill:none,stroke:#143D29,stroke-width:2px,stroke-dasharray: 5 5,color:#10B981;

    Planner((MPPKVVCL\nPlanner)):::actor
    Engineer((Field\nEngineer)):::actor
    Citizen((Citizen /\nRWA)):::actor
    AI((AI\nEngine)):::actor

    subgraph System["ChargeSense AI Platform"]
    direction TB
        UC1(Generate Placements\n[GNN/Greedy]):::usecase
        UC2(Forecast Demand\n[PINN]):::usecase
        UC3(Adaptive Scheduling\n[RL Q-Learning]):::usecase
        UC4(Monitor Feeder Health):::usecase
        UC5(Approval Workflow):::usecase
        UC6(View ROI / V2G Benchmarks):::usecase
        UC7(Community Charging Score):::usecase
        UC8(Smart Slot Booking):::usecase
    end
    class System boundary

    Planner --> UC1
    Planner --> UC5
    Planner --> UC6
    
    Engineer --> UC4
    Engineer --> UC5
    Engineer --> UC7
    
    Citizen --> UC7
    Citizen --> UC8

    AI -.-> UC1
    AI -.-> UC2
    AI -.-> UC3
    AI -.-> UC4
```

---

## 3. PlantUML Alternative (For standard UML tools)

If you are using tools like Draw.io or PlantUML Web, you can paste this:

### System Architecture
```plantuml
@startuml
skinparam backgroundColor #0A1A12
skinparam component {
  BackgroundColor #0B2215
  BorderColor #10B981
  FontColor #FFFFFF
}
skinparam database {
  BackgroundColor #143D29
  BorderColor #10B981
  FontColor #FFFFFF
}
skinparam package {
  BackgroundColor transparent
  BorderColor #143D29
  FontColor #10B981
}

package "User Interface Layer (React 18)" {
  [Operations UI]
  [Analytics UI]
  [Research UI]
}

package "Visualization Engine" {
  [Leaflet Spatial Maps]
  [Recharts Dashboards]
}

package "AI & Simulation Engines" {
  [GNN Simulator]
  [PINN Forecaster]
  [RL Scheduler]
  [V2G Degradation]
}

database "Mock Data Architecture" {
  [Pincode Topology]
  [Competitor Chargers]
}

[Operations UI] --> [Leaflet Spatial Maps]
[Analytics UI] --> [Recharts Dashboards]
[Leaflet Spatial Maps] --> [GNN Simulator]
[Recharts Dashboards] --> [PINN Forecaster]
[GNN Simulator] --> [Pincode Topology]
[PINN Forecaster] --> [Pincode Topology]

@enduml
```

### Use Case
```plantuml
@startuml
skinparam backgroundColor #0A1A12
skinparam usecase {
  BackgroundColor #0B2215
  BorderColor #10B981
  FontColor #FFFFFF
}
skinparam actor {
  BackgroundColor transparent
  BorderColor #10B981
  FontColor #10B981
}
skinparam rectangle {
  BackgroundColor transparent
  BorderColor #143D29
  FontColor #10B981
}

actor "MPPKVVCL Planner" as planner
actor "Field Engineer" as engineer
actor "Citizen / RWA" as citizen

rectangle "ChargeSense AI" {
  usecase "Generate Placements" as UC1
  usecase "Approval Workflow" as UC2
  usecase "Monitor Feeder Health" as UC3
  usecase "View ROI Benchmarks" as UC4
  usecase "Community Charging Score" as UC5
  usecase "Smart Slot Booking" as UC6
}

planner --> UC1
planner --> UC2
planner --> UC4

engineer --> UC2
engineer --> UC3

citizen --> UC5
citizen --> UC6
@enduml
```
