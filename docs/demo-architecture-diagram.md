# EcoSLO App Architecture Diagram

## 1) System Architecture (High Level)

```mermaid
flowchart LR
    U[Admin User] --> B[Next.js 14 App<br/>App Router UI]

    B -->|GET /api/public/trees| P[Public API Route Handlers]
    B -->|CRUD /api/admin/*| A[Admin API Route Handlers]

    subgraph Next.js Backend (BFF)
      P
      A
      C[supabase-client.ts]
      D[Error + Validation Utils]
    end

    P --> C
    A --> C
    A --> D
    P --> D

    C --> S[(Supabase Postgres)]

    S --> T[(trees)]
    S --> V[(volunteers)]
    S --> N[(notifications)]

    N -. sender/recipient FK .-> V
```

## 2) API Surface (Current)

```mermaid
flowchart TB
  API[/src/app/api/]

  API --> ADMIN[/admin/]
  API --> PUBLIC[/public/]

  ADMIN --> TREES[/trees/]
  ADMIN --> VOLS[/volunteers/]
  ADMIN --> NOTIFS[/notifications/]

  TREES --> TREES_C[GET, POST]
  TREES --> TREES_ID[GET, PUT, DELETE<br/>/trees/:id]

  VOLS --> VOLS_C[GET, POST]
  VOLS --> VOLS_ID[GET, PUT, DELETE<br/>/volunteers/:id]

  NOTIFS --> NOTIFS_C[GET, POST]
  NOTIFS --> NOTIFS_ID[GET, PUT, DELETE<br/>/notifications/:id]

  PUBLIC --> PUBLIC_TREES[GET /trees<br/>(map + CSV subset)]
```

## 3) Frontend Route Map

```mermaid
flowchart LR
  L[Root Layout + Navbar] --> D[/dashboard]
  L --> T[/trees]
  L --> V[/volunteers]
  L --> R[/reminders]
  L --> M[/map]
  L --> S[/settings]

  D --> N1[Notifications widgets]
  T --> C1[ControlPanel + tree table area]
  V --> P1[Placeholder page]
  R --> P2[Placeholder page]
  M --> P3[Placeholder page]
  S --> P4[Placeholder page]
```
