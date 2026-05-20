# REVIEW.md

This review is based on the current repository files, especially `README.md`, `AGENT.md`, `DESIGN.md`, `requirements.txt`, `main.py`, `drch/package.json`, `drch/next.config.mjs`, `drch/tailwind.config.js`, `drch/jsconfig.json`, `drch/app/page.js`, `drch/app/components/*`, and assets under `drch/public`.

This file began as a documentation-only review. Phase 1 deployment work has since added environment-based URL configuration, backend CORS allowlist configuration, and a production guard for `/rooms/debug`; the remaining findings should be read with that update in mind.

## Review Scope

The project has two main parts:

- Frontend: a Next.js app inside `drch/`.
- Backend: a FastAPI server in root `main.py`.

The current local workflow is `cd drch && npm run dev:both`, which starts `uvicorn main:app --reload` from the parent directory and `next dev` from `drch/`.

Official Vercel docs checked for deployment constraints:

- Vercel builds/framework detection and root directory settings: <https://vercel.com/docs/builds/configure-a-build>
- Vercel build defaults: <https://vercel.com/docs/builds>
- Vercel Python runtime: <https://vercel.com/docs/functions/runtimes/python>
- Vercel WebSocket limitation: <https://vercel.com/docs/limits>

## Existing Documentation Review

| File | Finding | Evidence | Action |
|---|---|---|---|
| `AGENT.md` | Mostly aligned with current code. One note is incomplete: it says generated frontend folders are not ignored by the current file, referring to root `.gitignore`; however `drch/.gitignore` does ignore `/node_modules` and `/.next/`. | Root `.gitignore` only has `__pycache__/` and `.venv/`; `drch/.gitignore` includes `/node_modules` and `/.next/`. | Update `AGENT.md` later to mention both ignore files, not only root `.gitignore`. |
| `DESIGN.md` | Aligned with inspected UI and code after the Thai rewrite. It clearly separates current behavior from recommendations. | Current file references implemented components and known design debt. | No blocking correction needed. |

## Executive Summary

### Currently Working

- The Next.js frontend exists under `drch/` with a valid `build` script in `drch/package.json`.
- The app has one implemented page, `/`, in `drch/app/page.js`.
- The UI supports username entry, passenger/driver selection, transport selection, driver room creation, passenger random join, and a chat room screen.
- The FastAPI backend exposes `POST /rooms`, `GET /rooms/random`, `GET /rooms/debug`, and `WebSocket /ws/{room_id}/{username}`.
- Static assets are organized under `drch/public/images`, `drch/public/videos`, and `drch/public/fonts`.

### Broken Or Risky

- Frontend call sites now use `drch/app/lib/config.js`, `NEXT_PUBLIC_API_BASE_URL`, and `NEXT_PUBLIC_WS_BASE_URL`; production values still must be set in Vercel.
- The backend relies on long-lived WebSocket connections; Vercel Functions do not support acting as a WebSocket server.
- Backend state is in memory only, so rooms and users disappear on process restart and cannot scale across multiple instances.
- Frontend and backend room transition timers disagree: frontend uses 120 seconds; backend uses 180 seconds.
- Several UI states are missing: backend unavailable, WebSocket connecting/disconnected, empty chat, successful room creation feedback, recoverable errors.
- The chat room layout has no mobile-specific responsive behavior.

### Must Fix Before Deployment

1. Decide hosting architecture:
   - Deploy frontend on Vercel from root directory `drch`.
   - Deploy the current FastAPI/WebSocket backend on a platform that supports long-running WebSocket servers, or replace realtime with a Vercel-compatible realtime provider.
2. Set production API and WebSocket environment values in Vercel.
3. Set backend `ALLOWED_ORIGINS` and `ENVIRONMENT=production` on the external backend host.
4. Fix the room transition flow so frontend and backend use one source of truth.
5. Add basic validation and length limits for username, room name, capacity, transport type, and message text.
6. Add user-visible backend/WebSocket error states.

### Should Improve After Deployment

- Create reusable UI primitives for buttons, inputs, notices, chat bubbles, and panels.
- Replace WebSocket string protocol with structured JSON events.
- Add tests for room creation, random join, WebSocket join/leave, and UI flows.
- Improve mobile layout and accessibility labels.
- Add persistence if rooms must survive process restarts.

## 1. UX/UI Readiness

### UX/UI Issues

| Issue | Why It Matters | Evidence | File / Component | Priority | Recommended Fix |
|---|---|---|---|---|---|
| Chat layout is desktop-first and likely cramped on mobile. | A production chat app must remain usable on small screens. Current video/chat split can overflow or make chat hard to use. | `ChatRoom.js` uses `flex gap-4 h-[calc(100vh-200px)]`; video and chat panels use `w-1/2`, `basis-2/3`, and `basis-1/3` with no responsive classes. | `drch/app/components/ChatRoom.js` | High | Add responsive breakpoints: stack status, video, and chat vertically on mobile; use two columns only on wider screens. |
| Transport buttons are forced into one row. | Four text+icon buttons can become too narrow on small screens. | `TransportButtons.js` renders all four options in one `flex gap-2` row. | `drch/app/components/TransportButtons.js` | Medium | Use responsive grid: 2 columns on tablet/mobile, 4 columns on desktop. |
| Inputs have placeholders but no visible labels. | Placeholders are not a replacement for labels and disappear as users type. | Username input uses `placeholder="Enter your username"`; room input uses `placeholder="Enter room name"`; chat input uses `placeholder="chat message"`. | `JoinChat.js`, `ChatRoom.js` | High | Add visible labels or accessible labels for username, room name, and chat message. |
| Error handling relies on `alert()`. | Alerts interrupt the flow and are hard to style, test, or recover from. | `JoinChat.js` uses `alert(...)` for validation and API errors; `page.js` alerts `event.reason` on socket close. | `JoinChat.js`, `page.js` | High | Add inline error/notice components near the relevant form/action. |
| No WebSocket connection state is shown. | Users cannot tell whether the chat is connecting, disconnected, or failed. | `page.js` only sets `isJoined` on `socket.current.onopen`; no connecting/error UI is rendered. | `drch/app/page.js`, `ChatRoom.js` | High | Add states for connecting, connected, disconnected, reconnect failed; show them in the chat header. |
| Empty chat state is missing. | A blank message list gives no guidance after entering a room. | `ChatRoom.js` directly maps `messages.map(...)`; no branch for `messages.length === 0`. | `drch/app/components/ChatRoom.js` | Medium | Render a simple empty state before the first message. |
| `ped_pong` and `/return` are not discoverable. | Backend supports return behavior, but users have no visible control or instruction. | Backend checks `data.strip().lower() == "/return"`; UI has no return button or command hint. | `main.py`, `ChatRoom.js` | High | Add a visible return action when room is `ped_pong`, or remove unsupported hidden command behavior. |
| Visual system is inconsistent. | Production UI should feel intentional and maintainable. | Tailwind config defines only `lightCream` and `lightbrown`; many colors are hardcoded in JSX: `#6D81A9`, `#E4E9F3`, `#D9D9D9`, plus multiple Tailwind color families. | `tailwind.config.js`, `ChatRoom.js`, `JoinChat.js`, `TypeUser.js`, `TransportButtons.js` | Medium | Move repeated colors into Tailwind theme tokens and document action/status color usage. |
| Typography ownership is unclear. | Fonts can render inconsistently and make future changes harder. | `layout.js` loads Geist fonts; `globals.css` applies `MyCustomFont` globally with `* { font-family: 'MyCustomFont', sans-serif; }`. | `layout.js`, `globals.css` | Medium | Choose one primary UI font; remove or scope the global override. |
| No success feedback after room creation beyond entering chat. | Users do not get explicit confirmation of successful create/join; failures and success are treated inconsistently. | `createRoom` immediately calls `joinChat(roomDisplayName)` after `response.ok`; no success notice or room summary. | `JoinChat.js` | Low | Show room name/status in chat header or a brief non-blocking success notice. |
| Focus states are not consistently designed. | Keyboard users need visible focus. | Inputs use `focus:ring-2`; custom role/transport buttons rely on border/background but do not include explicit focus classes. | `TypeUser.js`, `TransportButtons.js` | Medium | Add `focus-visible:ring-*` to all interactive controls. |

## 2. Frontend Code Quality

### What Is Working

- The frontend source is easy to locate under `drch/app`.
- Component names are understandable: `JoinChat`, `ChatRoom`, `TransportButtons`, `TypeUser`.
- `ROOM_TYPES` are centralized in `drch/app/lib/constants.js`.
- Static assets are under Next's `public` directory.
- `drch/package.json` has standard Next scripts: `dev`, `build`, `start`, `lint`.

### Frontend Issues

| Issue | Affected File / Component | Why It Is A Problem | Priority | Suggested Fix | Blocks Deployment |
|---|---|---|---|---|---|
| API and WebSocket base URLs require production env values. | `drch/app/lib/config.js`, `page.js`, `JoinChat.js` | Vercel-hosted frontend must use deployed backend URLs, not the local fallback. | Critical | Set `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_BASE_URL` in Vercel; validate they are present in production. | Yes |
| WebSocket message protocol is fragile string parsing. | `page.js`, `ChatRoom.js` | Frontend parses `Active users` and `System: ROOM_CHANGE:` strings; backend formatting changes can break UI. | High | Use JSON messages with `type` fields such as `active_users`, `message`, `system`, `room_change`. | No, but high risk |
| Active user parser can misread timer text as part of username. | `page.js`, `main.py` | Backend appends `| Time remaining` to active user string; frontend splits only by `": "` and `", "`. | High | Send active users and timer as structured fields, not one text line. | No |
| Frontend timer conflicts with backend timer. | `ChatRoom.js`, `main.py` | UI can switch to `ped_pong` after 120 seconds even though backend transition is 180 seconds. | Critical | Remove local transition authority; use backend time remaining/status as source of truth. | Yes, for correct chat behavior |
| Local `ped_pong` switch does not reconnect backend. | `ChatRoom.js`, `page.js` | `ChatRoom` calls `setRoom('ped_pong')`; `handleRoomChange` only reconnects for `duck_pond`. UI can show `ped_pong` while socket still belongs to original backend room. | Critical | Let backend send room change event, or explicitly reconnect and update backend state in one consistent flow. | Yes |
| Backend-driven room change can leave stale WebSocket state. | `page.js`, `main.py` | Backend moves the same websocket into `ped_pong`, then frontend closes and opens another socket after `ROOM_CHANGE`. The old endpoint's `room_id` remains original room, creating risk of stale/duplicate server state. | High | Redesign room movement protocol; either keep socket and update room server-side, or close/reconnect cleanly with explicit server cleanup. | Yes for reliable realtime |
| Unused imports. | `page.js`, `JoinChat.js` | `page.js` imports `useEffect` but does not use it; `JoinChat.js` imports `Image` but does not use it. | Low | Remove unused imports. | No |
| Unused or confusing props/state. | `page.js`, `JoinChat.js` | `customRoom`, `roomName`, `setCustomRoom`, `setRoomName` are passed but not used in current UI flow. | Medium | Remove unused state/props or implement the intended feature. | No |
| Console log left in UI flow. | `JoinChat.js` | `console.log('Joining room:', data.room)` is not needed in production UI. | Low | Remove or guard behind development logging. | No |
| Random join does not check `response.ok`. | `JoinChat.js` | `joinRandomRoom` calls `response.json()` directly; HTTP errors and invalid JSON collapse into generic catch. | Medium | Check `response.ok`; show inline error with backend detail when available. | No |
| Query/path values are not encoded. | `JoinChat.js`, `page.js` | `selectedType`, `userType`, `roomToJoin`, and `username` are interpolated into URLs. Room/user names with spaces, slashes, or special characters can break routes. | High | Use `URLSearchParams` for HTTP query and `encodeURIComponent` for WebSocket path segments, plus backend validation. | No, but risky |
| Invalid Tailwind class. | `ChatRoom.js` | System bubble has `text-gray-00`, which is not a standard Tailwind color utility. | Low | Replace with a valid class such as `text-gray-700`. | No |
| Repeated style strings and unused global component classes. | `globals.css`, component files | `globals.css` defines `.btn-primary`, `.btn-secondary`, etc., but JSX mostly repeats inline Tailwind utilities. | Medium | Create shared UI primitives or consistently use component classes. | No |
| Large media assets can affect perceived performance. | `drch/public/videos/*`, `drch/public/images/*` | Videos are around 3.7-5.9 MB each; CSS background image is about 1 MB. `lanprajom.png` is present but not referenced in inspected source. | Medium | Compress media, lazy-load or defer video where possible, remove unused assets if confirmed unnecessary. | No |
| `onKeyPress` is used. | `ChatRoom.js` | `onKeyPress` is legacy in React patterns; `onKeyDown` is clearer for Enter handling. | Low | Use `onKeyDown`. | No |

## 3. Backend/API Readiness

### Current Backend Structure

- Framework: FastAPI.
- Entry point: root `main.py`.
- Data model: `RoomCreate`.
- Runtime state: `ConnectionManager` instance named `manager`.
- HTTP routes:
  - `POST /rooms`
  - `GET /rooms/random`
  - `GET /rooms/debug`
- WebSocket route:
  - `/ws/{room_id}/{username}`

### API Contract Summary

| Endpoint | Request | Current Response | Notes |
|---|---|---|---|
| `POST /rooms` | JSON body with `room_name`, `capacity`, `creator_type`, `transport_type` | `{ "status": "success", "room": ..., "capacity": ... }` | Rejects duplicate room and non-driver creator. |
| `GET /rooms/random` | Query `transport_type`, `user_type` | Matching room object or `{ "room": null, "message": "No suitable rooms available" }` | Only passengers can get a room. |
| `GET /rooms/debug` | None | All room state when `ENVIRONMENT=development`; 404 otherwise | No auth guard; relies on environment guard. |
| `WebSocket /ws/{room_id}/{username}` | Path params | Plain text messages | No JSON protocol. |

### Backend Issues

| Issue | Affected File / Function / Endpoint | Risk | Priority | Suggested Fix | Blocks Vercel Deployment |
|---|---|---|---|---|---|
| Current backend requires WebSocket server behavior. | `@app.websocket("/ws/{room_id}/{username}")` | Vercel Functions do not support acting as a WebSocket server, so this endpoint cannot run as-is on Vercel Functions. | Critical | Host backend on a long-running server platform, or replace realtime with a supported provider such as Ably/Pusher/Supabase/Convex/etc. | Yes |
| Backend state is in memory. | `ConnectionManager` dictionaries | State disappears on restart and cannot scale across multiple processes/instances. | Critical | Add a shared store or realtime service for rooms/users/messages, or constrain deployment to one long-running process with accepted limitations. | Yes for scalable production |
| CORS depends on correct backend env configuration. | `get_allowed_origins()` and `app.add_middleware(...)` in `main.py` | If `ALLOWED_ORIGINS` is missing in production, only local frontend origins are allowed; wildcard `*` is rejected when `ENVIRONMENT=production`. | High | Set exact local, preview, and production frontend URLs in `ALLOWED_ORIGINS`. | Yes |
| No authentication/session model. | All endpoints/WebSocket | Anyone can claim any username and create/join rooms. | High | Add at least lightweight session/identity strategy if user identity matters. | Not always, but risky |
| No semantic validation for room input. | `RoomCreate`, `create_room` | Backend trusts client-provided `capacity` and arbitrary `transport_type`. | High | Validate allowed transport types and derive capacity server-side. | No, but high risk |
| No length limits for username, room name, messages. | `RoomCreate`, `websocket_endpoint` | Very long values can degrade UI/server behavior; special characters can break string protocol. | High | Add Pydantic constraints and WebSocket message length checks. | No |
| `/rooms/debug` has no auth and relies on environment guard. | `debug_rooms` | Exposes runtime room names, capacities, counts, and transport types when `ENVIRONMENT=development`. | High | Set `ENVIRONMENT=production` on deployed backend; consider auth/removal later. | Yes for safe production |
| WebSocket errors are not returned as clear close codes. | `connect`, `websocket_endpoint` | `HTTPException` inside WebSocket connection setup is caught by generic exception handler; client may not receive actionable reason. | Medium | Use `websocket.close(code=..., reason=...)` for room missing/full cases. | No |
| Broadcast loop does not handle failed sends per connection. | `broadcast`, `broadcast_user_list` | One failed connection can interrupt broadcasts or leave stale sockets. | Medium | Catch send errors per connection and clean up dead sockets. | No |
| Room cleanup task field is unused. | `room_cleanup_tasks` | Indicates incomplete or dead code. | Low | Remove or implement cleanup behavior. | No |
| Server logs use `print()`. | exception handlers in `main.py` | Production observability is weak. | Low | Use structured logging. | No |

## 4. Full-stack Integration Review

### Integration Issues

| Issue | Files Involved | Actual Behavior | Expected Behavior | Priority | Recommended Fix |
|---|---|---|---|---|---|
| Production env values still required. | `drch/app/lib/config.js`, `drch/.env.example` | Browser uses local fallback when public env vars are not set. | Browser should call environment-specific backend URL. | Critical | Set `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_BASE_URL` for Vercel preview/production. |
| Environment separation has been introduced but must be configured per host. | `.env.example`, `drch/.env.example`, `main.py` | Local examples exist; production host values are still external deployment settings. | Local/preview/prod should each have explicit config. | Critical | Configure Vercel and backend host dashboards. |
| Frontend sends extra field not modeled by backend. | `JoinChat.js`, `RoomCreate` | Frontend sends `display_name`; backend model does not define/use it. Pydantic v2 default ignores extras unless configured otherwise. | Request body should match documented backend contract. | Low | Remove `display_name` or add it intentionally to backend model. |
| Active users response is not contract-safe. | `broadcast_user_list`, `page.js` | Backend sends one text string; frontend splits it. | Use structured response/event. | High | JSON WebSocket event for users/capacity/time. |
| Room transition source of truth is split. | `start_room_transition_timer`, `ChatRoom.js` | Backend timer is 180s; frontend local timer is 120s. | One source of truth for transition and remaining time. | Critical | Backend event drives UI; frontend only displays server state. |
| Network failures show generic alerts. | `JoinChat.js`, `page.js` | Catch blocks call `alert('Error ...')`; no persistent UI state. | UI should show recoverable inline errors. | Medium | Add error state per async action. |
| Room/user names can break URLs. | `page.js`, `JoinChat.js`, `main.py` | Raw user input is interpolated into HTTP query and WebSocket path. | Values should be encoded and validated. | High | Encode client values and validate server-side patterns. |
| Backend unavailable case is not handled before user action. | `JoinChat.js` | User only sees failure after fetch throws. | UI should show service unavailable/connection error. | Medium | Add health check or connection state once backend URL is configured. |

## 5. Vercel Deployment Readiness

### Frontend Deployment Assessment

The frontend can be deployed to Vercel only if the Vercel project root is set to `drch`.

Evidence:

- `drch/package.json` contains `next`, `react`, and `build: next build`.
- `drch/next.config.mjs` exists.
- Root directory has no `package.json`; it only has a minimal root `package-lock.json`, `requirements.txt`, and `main.py`.

If Vercel project root is the repository root, it will not see the Next.js `package.json` in the project root. Vercel root directory settings are therefore required unless a `vercel.json` or multi-service setup is introduced.

### Backend Deployment Assessment

The current backend is not ready to run as the realtime backend on Vercel.

Evidence:

- `main.py` defines a FastAPI ASGI app named `app`, which matches Vercel Python runtime detection for HTTP/ASGI apps.
- The app also defines `@app.websocket("/ws/{room_id}/{username}")`.
- Official Vercel limits state that Vercel Functions do not support acting as a WebSocket server.

Conclusion:

- HTTP endpoints could potentially be adapted to Vercel Python runtime.
- The current chat feature depends on WebSockets, so the backend should be deployed separately on a platform that supports long-running WebSocket servers, or realtime should be redesigned around a supported hosted realtime service.

### Required Environment Variables

The current code now uses environment variables. These variables must be configured before production deployment:

| Name | Purpose | Required | Local Value Source | Vercel Dashboard Setting Needed | Risk If Missing |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for HTTP calls such as `/rooms` and `/rooms/random`. | Required after refactor | `.env.local` in `drch/` | Set for Preview and Production. | Frontend will keep calling localhost or fail to call backend. |
| `NEXT_PUBLIC_WS_BASE_URL` | Base URL for WebSocket calls such as `/ws/{room}/{username}`. | Required after refactor | `.env.local` in `drch/` | Set for Preview and Production. | Chat cannot connect in deployed browser. |
| `ALLOWED_ORIGINS` | Restrict backend CORS to local, preview, production frontend URLs. | Required for backend production | root `.env.example` or hosting dashboard | Set on backend host, not Vercel if backend is separate. | API rejects deployed frontend or is configured too broadly. |
| `ENVIRONMENT` | Toggle debug endpoint behavior. | Recommended | root `.env.example` or hosting dashboard | Set on backend host. | `/rooms/debug` remains available if left as `development`. |

### Vercel Deployment Checklist

| Check | Status | Evidence | Required Action |
|---|---|---|---|
| Frontend framework detected | Pass if root directory is `drch`; Fail if root is repo root | `drch/package.json` has Next dependencies; repo root has no `package.json` | Configure Vercel Project Root Directory to `drch`. |
| Build command exists | Pass | `drch/package.json` has `"build": "next build"` | Use default Vercel Next build or `npm run build` from `drch`. |
| Install command can resolve deps | Pass for frontend root `drch` | `drch/package-lock.json` exists | Use npm install/default install in `drch`. |
| Output directory configured | Pass/Default | `next.config.mjs` is empty; Vercel auto-configures output for detected Next.js | Do not override output directory unless needed. |
| Static assets available | Pass | Assets under `drch/public` | Keep assets in `drch/public` for frontend deploy. |
| API URL production-ready | Pass pending deployment values | `drch/app/lib/config.js` reads `NEXT_PUBLIC_API_BASE_URL` | Set production value in Vercel. |
| WebSocket URL production-ready | Pass pending deployment values | `drch/app/lib/config.js` reads `NEXT_PUBLIC_WS_BASE_URL` | Set production `wss://` value in Vercel and deploy compatible backend. |
| Env variables documented | Pass | root `.env.example`, `drch/.env.example`, README/AGENT updates | Keep examples placeholder-only. |
| Backend Vercel-compatible | Fail for current realtime behavior | `main.py` uses FastAPI WebSocket endpoint; Vercel Functions do not act as WebSocket servers | Deploy backend separately or redesign realtime. |
| Python version configured | Unknown | README says Python 3.13; no `.python-version`, `pyproject.toml`, or `Pipfile.lock` found | If deploying Python on Vercel, add `.python-version` or `pyproject.toml` if a specific Python version is required. |
| CORS production-ready | Pass pending backend env | `main.py` uses `ALLOWED_ORIGINS` through `get_allowed_origins()` | Set exact deployed frontend origins. |
| Debug endpoint production-safe | Pass pending backend env | `debug_rooms` returns 404 unless `ENVIRONMENT=development` | Set `ENVIRONMENT=production`. |
| Build verified locally | Pass | `npm.cmd run build` from `drch` passed locally during fix planning/implementation | Re-run before deployment. |
| Lint verified locally | Unknown | `npm run lint` exists; ESLint config not found in inspected files | Run lint or remove/fix script if it is not supported. |
| `vercel.json` present | Not required for simple frontend; missing for custom setup | No `vercel.json` found | Optional for frontend-only; needed if configuring routes/builds/services explicitly. |
| Root directory documented | Pass | README and `drch/README.md` document Vercel Root Directory `drch` | Keep in sync with Vercel project settings. |

## Production-Ready Improvement Plan

### Phase 1: Deployment Architecture Decision (Blocks Vercel)

| Task | Files Involved | Priority | Suggested Solution |
|---|---|---|---|
| Choose backend hosting model. | `main.py`, deployment docs | Critical | Use Vercel for `drch` frontend and deploy FastAPI/WebSocket backend separately, or replace WebSocket with a hosted realtime provider. |
| Configure production URL values. | `drch/app/lib/config.js`, `drch/.env.example`, Vercel env settings | Critical | Set `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_BASE_URL` for preview/production. |
| Document Vercel root directory. | `README.md`, `REVIEW.md`, possibly `AGENT.md` | High | Document Vercel Project Root Directory as `drch`. |

### Phase 2: Integration Correctness (Blocks Reliable Chat)

| Task | Files Involved | Priority | Suggested Solution |
|---|---|---|---|
| Fix timer mismatch. | `ChatRoom.js`, `main.py` | Critical | Backend sends remaining time/status; frontend displays it only. |
| Fix room movement protocol. | `page.js`, `ChatRoom.js`, `main.py` | Critical | Use one clear approach: keep socket and update server room state, or close/reconnect with explicit cleanup. |
| Replace string protocol. | `main.py`, `page.js`, `ChatRoom.js` | High | Use JSON event messages. |
| Encode/validate route and query values. | `JoinChat.js`, `page.js`, `main.py` | High | `URLSearchParams`, `encodeURIComponent`, and backend constraints. |

### Phase 3: Backend Hardening

| Task | Files Involved | Priority | Suggested Solution |
|---|---|---|---|
| Restrict CORS. | `main.py` | High | Use env-configured origin allowlist. |
| Guard or remove debug route. | `main.py` | High | Disable `/rooms/debug` unless `ENVIRONMENT=development`. |
| Validate room payloads. | `RoomCreate`, `create_room` | High | Add allowed transport enum and capacity derivation server-side. |
| Add message/user limits. | `websocket_endpoint`, `RoomCreate` | High | Limit string length and reject invalid characters. |
| Improve cleanup and failed socket handling. | `broadcast`, `disconnect` | Medium | Catch send failures and remove dead sockets. |

### Phase 4: UX/UI Production Polish

| Task | Files Involved | Priority | Suggested Solution |
|---|---|---|---|
| Add mobile layout. | `ChatRoom.js`, `TransportButtons.js`, `JoinChat.js` | High | Responsive stack/grid classes. |
| Add connection and error states. | `page.js`, `JoinChat.js`, `ChatRoom.js` | High | Inline notices and chat header status. |
| Add labels/focus styles. | `JoinChat.js`, `ChatRoom.js`, `TypeUser.js`, `TransportButtons.js` | Medium | Visible labels and `focus-visible` styles. |
| Create reusable UI primitives. | new components under `drch/app/components` | Medium | Button, Input, Notice, ChatBubble, MessageList. |

### Phase 5: Verification Before Launch

| Task | Files Involved | Priority | Suggested Solution |
|---|---|---|---|
| Run frontend build. | `drch/package.json` | High | Run `npm run build` from `drch`. |
| Run lint or fix lint setup. | `drch/package.json` | Medium | Run `npm run lint`; add ESLint config if required. |
| Add tests for critical flows. | new test files | Medium | Cover create room, random join, WebSocket join/leave, room transition. |
| Test preview deployment. | Vercel project settings, backend host settings | High | Verify Vercel preview URL can reach preview/staging backend. |

## Recommended Deployment Shape

### Option A: Most Direct For Current Code

- Vercel project root: `drch`
- Framework preset: Next.js
- Build command: default or `npm run build`
- Frontend env:
  - `NEXT_PUBLIC_API_BASE_URL=https://<backend-host>`
  - `NEXT_PUBLIC_WS_BASE_URL=wss://<backend-host>`
- Backend: deploy `main.py` to a long-running ASGI host that supports WebSockets.

This option requires the fewest code changes while preserving FastAPI WebSocket behavior.

### Option B: Vercel-Centric Refactor

- Keep frontend on Vercel.
- Move HTTP APIs into Next.js route handlers or Vercel Python functions where appropriate.
- Replace WebSocket chat with a Vercel-compatible realtime provider.
- Move room state out of process memory into provider/database/shared store.

This option is more production-scalable but requires a larger refactor.

## Final Deployment Blockers

The project should not be considered Vercel-production-ready until these are fixed:

1. Production Vercel env values must point frontend to the deployed backend.
2. Current backend WebSocket server cannot run as a Vercel Function.
3. In-memory backend state with no persistence/shared store.
4. Timer and room-transition mismatch between frontend and backend.
5. Backend deployment must set `ALLOWED_ORIGINS` and `ENVIRONMENT=production`.
6. Environment variables are documented, but real preview/production values must be configured outside the repository.
7. Missing responsive chat layout and connection/error UX for deployed users.
