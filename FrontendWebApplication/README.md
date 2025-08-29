# LudoMaster Frontend (React SPA)

An accessible and responsive React single-page application for LudoMaster. It includes authentication, profile management, room management, gameplay (solo AI and multiplayer), chat, notifications, leaderboards, and match history.

## Features

- Authentication: Login/Register with email or mobile + password
- Profile: Edit display name, bio, and avatar
- Rooms: Create, list, join (public/private with password)
- Gameplay:
  - Solo vs AI mode
  - Multiplayer via WebSocket
  - Ludo board rendering, dice, and move actions
  - In-game chat and system notifications
- Stats: Leaderboard and match history
- Accessibility: WCAG-friendly (keyboard navigation, ARIA roles, live regions)
- Responsive design: Mobile-first CSS without heavy UI frameworks
- State management: Zustand
- Data fetching: Fetch/SWR-style wrappers
- WebSocket: Reconnecting with auth token

## Getting Started

1. Copy environment variables
   cp .env.example .env
   # Edit values as needed

2. Install and run
   npm install
   npm start

The app runs at http://localhost:3000

## Environment Variables

- REACT_APP_API_BASE: REST API base (e.g., /api or https://api.example.com)
- REACT_APP_WS_BASE: WebSocket base (e.g., wss://api.example.com/ws) — optional; derived from API_BASE otherwise
- REACT_APP_SITE_URL: Public site URL for auth email redirects (if needed)

See .env.example for details.

Database initialization (optional for local dev):
- Run the schema initializer from the database workspace:
  node ../ludomaster--online-multiplayer-ludo-game-96747-96817/Database_MongoDB/scripts/initSchema.js

## Project Structure

- src/api: REST and WebSocket helpers
- src/state: Zustand stores (auth, rooms, game)
- src/components: Reusable UI components (Board, Dice, Chat, Toast, etc.)
- src/pages: Screens (Home, Auth, Profile, Rooms, Game, Leaderboard, History)
- src/App.js: Routing and shell
- src/App.css: Theme and components styling

## Accessibility

- Buttons, forms, and menus with appropriate ARIA attributes
- Live regions for announcements (react-aria-live)
- Keyboard focus outlines maintained
- Clear error and status messages with role="alert" or role="status"

## Notes

- This frontend expects a backend implementing endpoints like:
  - POST /auth/login, /auth/register; GET /auth/me
  - GET/POST /rooms; GET /rooms/:id; POST /rooms/:id/join
  - WS /rooms/:id and /game/:id for chat and game events
  - GET /stats/leaderboard; GET /stats/history
- WebSocket messages follow a simple JSON convention in this template:
  { "type": "chat" | "system" | "dice" | "move", ... }

