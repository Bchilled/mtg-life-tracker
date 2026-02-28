# Commander Life Tracker

A feature-rich 4-player **Magic: The Gathering Commander (EDH)** life tracker built with React Native / Expo.

## Features

### Core Tracking
- **Life totals** — 40 starting HP (configurable). Tap left half of a panel to −1, right half to +1. Long-press for ±5. Quick buttons for ±5, ±10.
- **Commander damage** — Track damage from each opponent's commander separately. Auto-warns at 21 (lethal threshold).
- **Poison counters** — Warns at 10 (lethal threshold).
- **Experience counters** — For commander abilities.
- **Energy counters** — For energy-based commanders.

### Turn Tracking (per player, resets on turn start)
- **Land drop** — Toggle whether a land was played this turn.
- **Cards drawn** — Count cards drawn this turn.

### Global Game State
- **Spell stack counter** — Track spells on the stack. Long-press to clear when resolved.
- **Turn order** — Track whose turn it is and the round number.
- **Day / Night cycle** — Toggle for day/night mechanics.
- **Monarch** — Cycle the monarch token through players.
- **Initiative** — Track who holds the initiative.

### Action Log
- **Full history** — Every action is timestamped and logged (up to 500 entries).
- **Undo** — Undo up to 50 recent actions, one at a time.
- **Filtering** — Filter log by category (life, commander, poison, land, draw, stack, turn, dice…).

### Utilities
- **Dice roller** — d4, d6, d8, d10, d12, d20, d100. Coin flip. All rolls logged.
- **Player customization** — Edit player names and colors in Settings.
- **Eliminated tracking** — Mark players as eliminated.

## Layout

```
┌──────────────────────────────────────┐
│  [P3 — rotated 180°] │ [P4 — 180°]  │  ← top players face up
├──────────────────────────────────────┤
│  Turn │ Stack │ Day │ 👑 │ ↩ │ 📋 🎲 ⚙  │  ← center strip
├──────────────────────────────────────┤
│  [P1 — normal]       │ [P2 — normal] │  ← bottom players
└──────────────────────────────────────┘
```

Works on phones (portrait) and tablets.

## Setup

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your device, or press `a` for Android emulator / `w` for web.

## Tech Stack

- **Expo** (React Native)
- **TypeScript**
- **Zustand** — state management
- **AsyncStorage** — persist player names & colors between sessions
- **expo-haptics** — tactile feedback on button presses

## Format Rules (Commander)

| Condition | Threshold |
|-----------|-----------|
| Starting life | 40 |
| Commander damage (single source) | 21 = eliminated |
| Poison counters | 10 = eliminated |
