# Achievements System & Dynamic Particle Color Engine

Swipe Slicer will be upgraded with a milestone tracking and unlock notification system, alongside an upgraded dynamic particle burst engine that matches particle sparks and explosion velocities to the sliced object's authentic color.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during the interactive planning session and will govern the implementation:

- **Confirmed Achievement Display**: Dedicated Achievements modal overlay accessible from the main menu and game-over/pause screens, coupled with non-intrusive live in-game unlock notification banners sliding in during gameplay.
- **Confirmed Milestone Scope**: A balanced mix of skill categories:
  1. *Bomb Disarm*: Slicing bombs (e.g. Disarm 1 bomb, 25 bombs, 100 bombs).
  2. *Combo Master*: Reaching high combo chains in a single swipe (e.g. 5x, 10x, 25x, 50x, 100x combos).
  3. *Streak Prodigy*: Maintaining unbroken cut streaks without drops (e.g. 20, 50, 100 streaks).
  4. *Score Milestones*: Reaching score plateaus (e.g. 1,000, 5,000, 10,000 points).
  5. *Blade Virtuoso*: Total shapes sliced across games.
- **Confirmed Particle Physics**: Explosion burst particles dynamically sample the exact hex/rgb color of the object being sliced, augmented with matching velocity-directed sparks and ambient radiant particles.

---

## 1. Overview & Core Concept

- **What It Does**:
  - Tracks persistent game milestones across sessions and runs (persisted in local storage and synced with cloud save).
  - Displays real-time unlock notifications at the top of the canvas during active play whenever a player achieves a milestone.
  - Adds an interactive Achievements view modal featuring progress bars, unlock timestamps, and milestone badges.
  - Refactors the particle emitter so that fruit, theme shapes, power-ups, and bombs produce particles and explosion debris tailored to their specific colors rather than a fixed red/yellow tint.
- **Target Audience**: Casual arcade players looking for progressive goals, mastery depth, and visual responsiveness.
- **Key Value**: Enhances long-term player retention through visual reward loops, satisfying slice physics, and clear goals.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **In-Game Milestone Notification**:
   - As a player slices an object triggering an achievement (e.g. reaching a 10x combo or disarming a bomb), a subtle unlock banner slides down from the top edge.
   - The banner features a gold trophy insignia, achievement title, and short description, auto-dismissing after 3 seconds with smooth opacity settling.
2. **Accessing the Achievements Modal**:
   - A trophy button on the Start Menu and Game Over screen opens the dedicated modal.
   - Players can view all achievements categorized into Unlocked (with date/stats) and In Progress (with progress percentage bars).
3. **Dynamic Slice Particle Burst**:
   - Slicing a neon cyan clock spawns cyan and bright turquoise sparks.
   - Slicing theme shapes spawns particles matching their exact palette color.
   - Bomb detonations spawn intense dark obsidian and blazing ember debris tailored to bomb visual components.

### Visual Identity & Theme Tokens
- **Design Constitution Compliance**: Strictly follows 60-30-10 color allocation with deep dark slate/zinc canvas (`#09090b`), structural surfaces (`#18181b` with hairline `#27272a` borders), and gold/accent highlights (`#f59e0b` and `#10b981`).
- **Typography**: Clean sans-serif with tabular figures (`font-mono tabular-nums`) for numeric counters and completion percentages.
- **Micro-Interactions**: Banner slide-down animation with spring curve (`cubic-bezier(0.16, 1, 0.3, 1)`), sound chime upon achievement unlock.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Persistent Achievement Storage vs Session-Only**:
  - *Chosen Approach*: Persist achievement progress (total bombs sliced, highest combo, lifetime slices) in `localStorage` and integrate with YouTube Playables cloud save payload.
  - *Why*: Allows players to build long-term progression across multiple play sessions.
  - *Alternatives Considered*: Session-only memory (rejected: players lose progress upon refresh).
- **Decision 2: Queue-Based In-Game Unlock Banners**:
  - *Chosen Approach*: Unlock banners use an event queue with debouncing so multiple rapid unlocks (e.g. combo 5x then combo 10x) do not overlap or jitter.
  - *Why*: Maintains high visual polish and prevents UI clutter during fast arcade action.
- **Decision 3: Particle Color Sampling**:
  - *Chosen Approach*: Pass `sourceColor` directly into `spawnSplatterSparks`, `triggerBombBlast`, and slice emitters, generating hue-matched particles alongside high-velocity directional sparks.
  - *Why*: Directly satisfies the user's explicit request while enhancing visual feedback.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                      App State                         │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │   Achievement Store   │   │  Leaderboard & Save  │  │
│  │ (Progress & Unlocked) │   │     (Local/Cloud)    │  │
│  └───────────┬───────────┘   └───────────┬──────────┘  │
└──────────────┼───────────────────────────┼─────────────┘
               │                           │
               ▼                           ▼
┌───────────────────────────┐   ┌────────────────────────┐
│  Game Engine Loop (tick)  │   │   In-Game HUD & Canvas │
│  - Slice detection        │   │   - Canvas Particles   │
│  - Dynamic particle burst │──▶│   - Unlock Notification│
│  - Achievement evaluation │   │     Banner Queue       │
└───────────────────────────┘   └────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────┐
│                  Achievements Modal                    │
│   - Category tabs (All, Unlocked, In Progress)         │
│   - Milestone cards with progress bars                 │
│   - Close / Return to game controls                    │
└────────────────────────────────────────────────────────┘
```

### Data Model & Entities
```typescript
export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'bomb' | 'combo' | 'streak' | 'score' | 'slices';
  targetValue: number;
  currentValue: number;
  unlocked: boolean;
  unlockedAt?: string;
  iconName: string;
}

export interface AchievementNotification {
  id: string;
  achievement: Achievement;
  timestamp: number;
}
```

### Implementation Sequence
1. Define Achievement types, milestone definitions, and progression handlers in `src/types.ts` and `src/achievements.ts`.
2. Update particle generation in `src/App.tsx` (`triggerBombBlast`, `spawnSplatterSparks`) to dynamically accept and distribute object colors and velocity variations.
3. Integrate real-time achievement milestone evaluation into slice logic, combo calculations, and game-over runs.
4. Build the non-intrusive in-game unlock notification banner overlay.
5. Create the dedicated `AchievementsModal` component with interactive filtering and progress bars.
6. Verify clean compilation and sound triggers.
