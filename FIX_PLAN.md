# FIX_PLAN.md

## 1. Planning Summary

- Current readiness status: frontend builds successfully with `npm.cmd run build` from `drch`; production deployment is not ready because runtime integration still depends on localhost and a long-running FastAPI WebSocket server.
- Main deployment blockers: hardcoded `127.0.0.1:8000`, no env config, backend WebSocket not Vercel-compatible, open CORS, public `/rooms/debug`.
- Main UX/UI blockers: no mobile chat layout, no connection/error state, `alert()` errors, no input labels, hidden `/return` behavior.
- Main frontend blockers: URL config, frontend/backend timer mismatch, fragile string WebSocket protocol, local `ped_pong` state switch.
- Main backend blockers: in-memory state, no input limits, client-trusted capacity, public debug route, unsafe CORS.
- Recommended deployment architecture: Option B, Vercel frontend from `drch` + external long-running FastAPI backend, recommended default host: Render Web Service.
- Fix incrementally. Do not do a large rewrite until deployment blockers and core chat consistency are fixed.

### Phase 1 Implementation Status

Phase 1 has been implemented in this working tree:

- Frontend HTTP/WebSocket call sites now use `drch/app/lib/config.js`.
- Frontend env examples exist in `drch/.env.example`.
- Backend env examples exist in root `.env.example`.
- `main.py` reads `ALLOWED_ORIGINS` for CORS, falls back to local frontend origins, and rejects wildcard CORS when `ENVIRONMENT=production`.
- `/rooms/debug` returns 404 unless `ENVIRONMENT=development`.
- README/AGENT/DESIGN/REVIEW deployment notes were updated.

Remaining deployment work is external configuration: set Vercel env values, deploy the FastAPI WebSocket backend to a long-running ASGI host, set backend `ALLOWED_ORIGINS`, and set `ENVIRONMENT=production`.

## 2. Fixing Principles

- Do not rewrite the whole app.
- Do not change product scope or add new features.
- Preserve current flows: Driver creates room, Passenger joins random room, both chat via room.
- Fix deployment blockers before design polish.
- Keep frontend/backend contracts stable unless a phase explicitly changes the contract.
- Avoid visual redesign before build/deploy/integration works.
- Use environment variables instead of hardcoded URLs.
- Do not expose secrets or commit real `.env` values.
- Verify after each phase with build plus manual flow checks.
- Update `README.md`, `AGENT.md`, `DESIGN.md`, and `REVIEW.md` when architecture or commands change.

## 3. Issue Validation Table

| Issue | Source Section in REVIEW.md | Still Valid? | Priority | Blocks Deploy? | Needs Code Change? | Notes |
|---|---|---|---|---|---|---|
| Hardcoded API/WebSocket localhost URLs | Frontend, Integration, Vercel | Partially | Critical | Yes until env is configured | No further Phase 1 code change | Frontend call sites use `config.js`; local fallback remains for development. |
| Backend WebSocket not Vercel-compatible | Backend, Vercel | Yes | Critical | Yes | No repo code if hosted externally | Choose external backend; do not force Vercel Functions. |
| Vercel root must be `drch` | Vercel | Yes | Critical | Yes | Docs/config | Root has no `package.json`; `drch` has Next app. |
| Build unverified | Vercel checklist | No | Low | No | No | `npm.cmd run build` passed. |
| Lint unverified / interactive | Vercel checklist | Yes | Medium | No | Yes | `npm.cmd run lint` prompts ESLint setup. |
| No env docs | Integration, Vercel | No | Low | No | No | Root `.env.example` and `drch/.env.example` now exist. |
| Open CORS | Backend | Partially | High | Yes until backend env is configured | No further Phase 1 code change | `main.py` now uses `ALLOWED_ORIGINS`; production host must set it. |
| Public `/rooms/debug` | Backend | Partially | High | Yes until backend env is configured | No further Phase 1 code change | Route now returns 404 unless `ENVIRONMENT=development`; still no auth. |
| In-memory backend state | Backend | Yes | Critical | Partially | Risky | External single backend can deploy, but not scale safely. |
| Timer mismatch | Frontend, Integration | Yes | Critical | Yes for reliable chat | Yes | Frontend 120s, backend 180s. |
| Local `ped_pong` switch | Frontend | Yes | Critical | Yes for reliable chat | Yes | UI can switch without backend socket state. |
| Backend room-change socket ambiguity | Frontend | Yes | High | Yes for reliable chat | Yes | Needs careful protocol fix. |
| String WebSocket protocol | Frontend, Backend | Yes | High | No | Yes | Keep for Phase 1; replace in Phase 2. |
| Active users string parsing | Frontend | Yes | High | No | Yes | Backend appends timer to same string. |
| Raw URL interpolation | Frontend, Integration | Partially | High | No | Yes | Frontend now uses `URLSearchParams` and `encodeURIComponent`; backend validation remains. |
| Missing input validation/limits | Backend | Yes | High | No | Yes | Add Pydantic constraints/message checks. |
| Client-trusted capacity | Backend | Yes | High | No | Yes | Derive capacity server-side. |
| `alert()` error UX | UX/UI, Frontend | Yes | High | No | Yes | Replace with inline notices. |
| No socket connection state | UX/UI | Yes | High | No | Yes | Needed before real users. |
| Mobile layout missing | UX/UI | Yes | High | No | Yes | `ChatRoom` has no breakpoints. |
| Inputs lack labels | UX/UI | Yes | Medium | No | Yes | Accessibility fix. |
| Hidden `/return` command | UX/UI | Yes | Medium | No | Yes | Add visible button or postpone feature. |
| Unused imports/state | Frontend | Partially | Low | No | Yes | `useEffect` and `Image` imports removed; unused state/props still need review. |
| Invalid Tailwind class | Frontend | Yes | Low | No | Yes | `text-gray-00`. |
| Large media assets | Frontend | Needs Verification | Low | No | Maybe | Sizes verified; optimize only after core fixes. |
| `AGENT.md` ignore note incomplete | Existing docs | No | Low | No | No | Updated to mention both root and `drch/.gitignore`. |

## 4. Recommended Fix Order

1. Configure deployment architecture and env URLs.
   - Why this comes first: deployed browsers cannot call `localhost` or `127.0.0.1` on the developer machine.
   - Files likely involved: `drch/app/page.js`, `drch/app/components/JoinChat.js`, `.env.example`, `README.md`, `AGENT.md`, `REVIEW.md`, `DESIGN.md`.
   - Expected outcome: frontend can target local, preview, and production backend URLs.
2. Configure Vercel frontend root and external backend strategy.
   - Why this comes before backend refactors: it prevents trying to run the WebSocket backend as a Vercel Function.
   - Files likely involved: deployment docs, optional `vercel.json`.
   - Expected outcome: Vercel deploy path is unambiguous.
3. Harden backend deployment minimums.
   - Why this comes before real integration: CORS and debug behavior must not be open in production.
   - Files likely involved: `main.py`, backend env docs.
   - Expected outcome: production backend accepts only intended frontend origins and hides debug state.
4. Fix chat correctness: timer and room movement.
   - Why this comes before UX polish: current room state can diverge between frontend and backend.
   - Files likely involved: `main.py`, `drch/app/page.js`, `drch/app/components/ChatRoom.js`.
   - Expected outcome: backend is source of truth for room transition.
5. Improve request/error handling.
   - Why this comes after env and core protocol: errors need stable call sites and backend contracts.
   - Files likely involved: `JoinChat.js`, `page.js`, `main.py`.
   - Expected outcome: no generic alerts for normal failures.
6. Improve responsive/accessibility UX.
   - Why this comes after core behavior: it avoids polishing broken flows.
   - Files likely involved: `JoinChat.js`, `TransportButtons.js`, `ChatRoom.js`, `TypeUser.js`.
   - Expected outcome: usable mobile chat and labeled inputs.
7. Refactor UI primitives/design tokens.
   - Why this comes last: it is non-blocking cleanup.
   - Files likely involved: component files, `globals.css`, `tailwind.config.js`.
   - Expected outcome: easier future maintenance.

## 5. Phase 1: Deployment Blockers

This phase includes only fixes required before the first successful production-like deployment.

### Task 1.1: Add frontend API/WebSocket environment configuration

- Priority: Critical
- Problem: frontend hardcodes `http://127.0.0.1:8000` and `ws://127.0.0.1:8000`.
- Evidence: `drch/app/page.js`, `drch/app/components/JoinChat.js`.
- Files to inspect: `drch/app/page.js`, `drch/app/components/JoinChat.js`.
- Files likely to modify: same files plus `drch/app/lib/config.js` and `drch/.env.example`.
- Safe implementation approach: add small config helpers/constants for `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_BASE_URL`; keep default local fallback only for development.
- Risk level: Medium.
- Do not touch: WebSocket protocol shape, room transition logic.
- Verification commands: `cd drch && npm.cmd run build`.
- Expected result: build passes; frontend call sites no longer embed the backend host directly.
- Rollback plan: restore previous direct URLs if build/runtime breaks.

### Task 1.2: Add `.env.example` and deployment docs

- Priority: Critical
- Problem: env variables are not documented in the original repository state.
- Evidence: original review found no `.env.example`; Phase 1 should add `drch/.env.example` and root backend env docs.
- Files to inspect: `README.md`, `AGENT.md`, `REVIEW.md`, `DESIGN.md`.
- Files likely to modify: `drch/.env.example`, `.env.example`, `README.md`, `AGENT.md`, `REVIEW.md`, `DESIGN.md`.
- Safe implementation approach: use placeholders only; no secrets.
- Risk level: Low.
- Do not touch: real `.env.local`.
- Verification commands: `git status --short`; manually confirm no secret values.
- Expected result: future agents know required env vars.
- Rollback plan: remove docs/env example if incorrect.

### Task 1.3: Lock Vercel frontend deployment settings

- Priority: Critical
- Problem: Vercel must build from `drch`, not repo root.
- Evidence: root has no `package.json`; `drch/package.json` has Next scripts.
- Files to inspect: root files, `drch/package.json`.
- Files likely to modify: docs only, optionally `vercel.json` if team wants repo config.
- Safe implementation approach: document Vercel Root Directory = `drch`; no source behavior change.
- Risk level: Low.
- Do not touch: package scripts unless build fails later.
- Verification commands: `cd drch && npm.cmd run build`.
- Expected result: deploy instructions are explicit.
- Rollback plan: revert doc/config if Vercel project uses dashboard-only settings.

### Task 1.4: Choose and document external backend deployment target

- Priority: Critical
- Problem: Vercel Functions cannot act as the current WebSocket server.
- Evidence: `main.py` has `@app.websocket`.
- Files to inspect: `main.py`, `requirements.txt`.
- Files likely to modify: docs; possibly deployment config for chosen backend.
- Safe implementation approach: choose Option B, default to Render Web Service with start command `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Risk level: Medium.
- Do not touch: convert backend to Vercel Functions in Phase 1.
- Verification commands: local `uvicorn main:app --reload`; backend host smoke test after deployment.
- Expected result: frontend points to `https://...` and `wss://...` backend URLs.
- Rollback plan: switch docs/env to another long-running backend host.

### Task 1.5: Restrict CORS for production

- Priority: High
- Problem: backend originally allowed all origins.
- Evidence: `main.py` originally used `allow_origins=["*"]`.
- Files to inspect: `main.py`.
- Files likely to modify: `main.py`, backend env docs.
- Safe implementation approach: read comma-separated `ALLOWED_ORIGINS`; default to local origins in development.
- Risk level: Medium.
- Do not touch: auth/session design.
- Verification commands: run backend locally; test frontend from `localhost:3000`; test disallowed origin manually if practical.
- Expected result: production backend accepts only configured frontend origins.
- Rollback plan: temporarily restore permissive CORS for local debugging only.

### Task 1.6: Guard `/rooms/debug`

- Priority: High.
- Problem: public runtime state endpoint.
- Evidence: `@app.get("/rooms/debug")` had no auth/env guard.
- Files to inspect: `main.py`.
- Files likely to modify: `main.py`.
- Safe implementation approach: disable unless `ENVIRONMENT=development`; return 404 in production.
- Risk level: Low.
- Do not touch: room manager internals.
- Verification commands: call `/rooms/debug` locally with dev env and prod-like env.
- Expected result: debug route unavailable in production mode.
- Rollback plan: restore endpoint while keeping production warning docs.

## 6. Phase 2: Production Stability

### Task 2.1: Make backend the single source of truth for room transition

- Priority: Critical
- Problem: frontend switches to `ped_pong` at 120s; backend timer is 180s.
- Evidence: `ChatRoom.js` `useState(120)` and `setRoom('ped_pong')`; `main.py` sleeps 160 + 20.
- Files to inspect: `ChatRoom.js`, `page.js`, `main.py`.
- Files likely to modify: same files.
- Safe implementation approach: remove frontend authority to move rooms; frontend displays server-provided remaining time or status.
- Risk level: High.
- Do not touch: transport room creation flow.
- Verification commands: two-browser local test; confirm transition happens once from backend.
- Expected result: no UI/backend room divergence.
- Rollback plan: revert transition edits and disable local countdown display.

### Task 2.2: Stabilize room-change WebSocket protocol without full JSON rewrite yet

- Priority: Critical
- Problem: backend moves socket and frontend may close/reconnect, risking stale state.
- Evidence: `move_users_to_ped_pong` sends `System: ROOM_CHANGE:ped_pong`; `page.js` closes socket and calls `joinChat(newRoom)`.
- Files to inspect: `main.py`, `page.js`.
- Files likely to modify: same files.
- Safe implementation approach: choose one behavior: either backend moves existing socket and frontend does not reconnect, or frontend reconnects and backend does not retain old socket. For minimal risk, keep socket and update frontend room state only.
- Risk level: High.
- Do not touch: message UI redesign.
- Verification commands: create room, wait/force transition, send messages after transition.
- Expected result: one active socket per user; messages route to displayed room.
- Rollback plan: revert to old behavior and disable transition feature temporarily.

### Task 2.3: Add backend validation and limits

- Priority: High
- Problem: room/message input is weakly constrained; backend trusts client capacity.
- Evidence: `RoomCreate` has plain `str`/`int`; `create_room` stores client capacity.
- Files to inspect: `main.py`, `constants.js`, `JoinChat.js`.
- Files likely to modify: `main.py`, possibly `JoinChat.js`.
- Safe implementation approach: validate allowed `transport_type`; derive capacity server-side; add max lengths for `room_name`, `username`, and message text.
- Risk level: Medium.
- Do not touch: auth/session.
- Verification commands: API calls with invalid transport/capacity/long strings.
- Expected result: consistent 400 errors for invalid input.
- Rollback plan: relax validation while keeping allowed transport list.

### Task 2.4: Replace generic alerts with inline errors for API failures

- Priority: High
- Problem: `alert()` interrupts flow and hides persistent error state.
- Evidence: `JoinChat.js` and `page.js` use `alert(...)`.
- Files to inspect: `JoinChat.js`, `page.js`.
- Files likely to modify: same files.
- Safe implementation approach: add local `errorMessage` state and render existing yellow/red notice block style.
- Risk level: Medium.
- Do not touch: full design system.
- Verification commands: stop backend, attempt join/create; submit invalid form.
- Expected result: visible inline errors; no browser alert for expected failures.
- Rollback plan: restore alerts if UI state blocks submit.

### Task 2.5: Add socket connection states

- Priority: High
- Problem: user cannot tell connecting/disconnected/failed state.
- Evidence: `page.js` only toggles `isJoined` on open/close.
- Files to inspect: `page.js`, `ChatRoom.js`.
- Files likely to modify: same files.
- Safe implementation approach: add `connectionStatus` enum-like string and display compact status in chat header.
- Risk level: Medium.
- Do not touch: reconnect automation unless needed.
- Verification commands: backend down, room full/missing, normal connect.
- Expected result: UI shows connection state.
- Rollback plan: hide status UI while preserving internal state.

## 7. Phase 3: UX/UI Usability Improvements

### Task 3.1: Make chat and join screens responsive

- Priority: High
- Problem: desktop-only chat split and cramped controls.
- Evidence: `ChatRoom.js` horizontal flex without breakpoints; `TransportButtons.js` one-row flex.
- Files to inspect: `ChatRoom.js`, `JoinChat.js`, `TransportButtons.js`.
- Files likely to modify: same files.
- Safe implementation approach: Tailwind responsive classes only; stack on mobile, two-column on desktop.
- Risk level: Medium.
- Do not touch: room/chat logic.
- Verification commands: build; manual viewport checks at mobile/tablet/desktop.
- Expected result: no horizontal overflow; controls remain tappable.
- Rollback plan: revert layout classes.

### Task 3.2: Add labels and focus-visible states

- Priority: Medium.
- Problem: inputs rely on placeholders; custom buttons lack explicit focus style.
- Evidence: placeholder-only inputs in `JoinChat.js`, `ChatRoom.js`; role/transport buttons no focus-visible ring.
- Files to inspect: `JoinChat.js`, `ChatRoom.js`, `TypeUser.js`, `TransportButtons.js`.
- Files likely to modify: same files.
- Safe implementation approach: add visible labels or screen-reader labels and Tailwind `focus-visible` classes.
- Risk level: Low.
- Do not touch: validation logic except required attributes if harmless.
- Verification commands: keyboard tab through UI.
- Expected result: visible focus and understandable inputs.
- Rollback plan: remove added label/focus classes.

### Task 3.3: Add empty and no-room next-action states

- Priority: Medium.
- Problem: chat has no empty state; no-room state has limited guidance.
- Evidence: `messages.map` only; no `messages.length` branch.
- Files to inspect: `ChatRoom.js`, `JoinChat.js`.
- Files likely to modify: same files.
- Safe implementation approach: show concise empty chat copy and improve no-room text without adding new features.
- Risk level: Low.
- Do not touch: backend matching logic.
- Verification commands: enter empty room; passenger no-room flow.
- Expected result: users understand what to do next.
- Rollback plan: remove copy changes.

### Task 3.4: Expose or remove `/return` behavior

- Priority: Medium.
- Problem: backend supports `/return`, UI does not.
- Evidence: `main.py` checks `/return`; no UI control in `ChatRoom.js`.
- Files to inspect: `main.py`, `ChatRoom.js`, `page.js`.
- Files likely to modify: `ChatRoom.js`, maybe `page.js`.
- Safe implementation approach: if keeping feature, show a Return button only in `ped_pong` that sends `/return`.
- Risk level: Medium.
- Do not touch: large room transition refactor after Phase 2.
- Verification commands: transition to `ped_pong`, click Return, confirm room state.
- Expected result: feature is discoverable or intentionally removed.
- Rollback plan: hide button and document command.

## 8. Phase 4: Design System and Frontend Refactor

### Task 4.1: Move repeated colors to Tailwind tokens

- Priority: Medium.
- Problem: hardcoded colors are scattered.
- Evidence: `#6D81A9`, `#E4E9F3`, `#D9D9D9` in `ChatRoom.js`.
- Files to inspect: `tailwind.config.js`, `ChatRoom.js`, `globals.css`.
- Files likely to modify: same files.
- Safe implementation approach: add semantic tokens while preserving exact current colors.
- Risk level: Low.
- Do not touch: visual redesign.
- Verification commands: build; screenshot compare.
- Expected result: same visuals, centralized colors.
- Rollback plan: restore hardcoded classes.

### Task 4.2: Create small reusable UI primitives

- Priority: Medium.
- Problem: button/input/notice styles are duplicated.
- Evidence: repeated class strings in `JoinChat.js`, `ChatRoom.js`, `TypeUser.js`, `TransportButtons.js`.
- Files to inspect: component files, `globals.css`.
- Files likely to modify: new components under `drch/app/components`, existing component imports.
- Safe implementation approach: start with `Button`, `Input`, `Notice`; do not extract everything at once.
- Risk level: Medium.
- Do not touch: backend, API contract.
- Verification commands: build; manual create/join/send flow.
- Expected result: same behavior with less duplication.
- Rollback plan: inline classes again.

### Task 4.3: Cleanup low-risk code quality issues

- Priority: Low.
- Problem: unused imports/state, invalid class, console log.
- Evidence: `useEffect` unused in `page.js`; `Image` unused in `JoinChat.js`; `text-gray-00`; `console.log`.
- Files to inspect: `page.js`, `JoinChat.js`, `ChatRoom.js`.
- Files likely to modify: same files.
- Safe implementation approach: remove only proven-unused code after build passes.
- Risk level: Low.
- Do not touch: unclear state unless proven unused.
- Verification commands: build; lint after ESLint setup.
- Expected result: cleaner source.
- Rollback plan: restore removed code.

## 9. Deployment Architecture Recommendation

Choose: Option B, Vercel frontend + external backend.

- Why: frontend is a standard Next app under `drch`; backend uses FastAPI WebSockets, which should not be deployed as a Vercel Function.
- Frontend host: Vercel, project root `drch`.
- Backend host: Render Web Service by default, running `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Required environment variables:
  - Frontend: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WS_BASE_URL`.
  - Backend: `ALLOWED_ORIGINS`, `ENVIRONMENT`.
- Required Vercel settings:
  - Root Directory: `drch`
  - Framework Preset: Next.js
  - Build Command: `npm run build`
  - Output Directory: default
- Required backend settings:
  - Python 3.13 if host supports it; otherwise verify compatibility.
  - Install command: `pip install -r requirements.txt`
  - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Production API URL strategy:
  - HTTP: `https://<backend-host>`
  - WebSocket: `wss://<backend-host>`
- CORS strategy:
  - `ALLOWED_ORIGINS=http://localhost:3000,https://<vercel-project>.vercel.app,https://<custom-domain>`
- Risks:
  - In-memory state still resets on backend restart.
  - Multiple backend instances require shared state before scaling.
  - Preview URLs need CORS coverage.

## 10. Vercel Configuration Plan

| Setting | Recommended Value | Evidence | Notes |
|---|---|---|---|
| Root Directory | `drch` | Next `package.json` lives in `drch`; root has no `package.json` | Required. |
| Install Command | Default `npm install` | `drch/package-lock.json` exists | Do not install from repo root. |
| Build Command | `npm run build` | `drch/package.json` build exists and passed locally via `npm.cmd run build` | Build warning only: outdated browserslist data. |
| Output Directory | Default for Next.js | `next.config.mjs` has no custom output | Do not override. |
| Environment Variables | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WS_BASE_URL` | URLs originally hardcoded | Required after Phase 1. |
| Framework Preset | Next.js | `next` dependency in `drch/package.json` | Auto-detect when root is `drch`. |

## 11. Environment Variable Plan

| Variable | Used By | Local Value Example | Production Value Needed | Required? | Notes |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Frontend fetch calls | `http://127.0.0.1:8000` | `https://<backend-host>` | Yes | Public browser value, not secret. |
| `NEXT_PUBLIC_WS_BASE_URL` | Frontend WebSocket | `ws://127.0.0.1:8000` | `wss://<backend-host>` | Yes | Must be `wss` in production. |
| `ALLOWED_ORIGINS` | FastAPI CORS | `http://localhost:3000` | `https://<vercel-url>,https://<custom-domain>` | Yes | Backend host env. |
| `ENVIRONMENT` | Debug route/log behavior | `development` | `production` | Recommended | Use to guard `/rooms/debug`. |
| `PORT` | Backend host runtime | host-provided | host-provided | Host-dependent | Render-style start command uses `$PORT`. |

## 12. Verification Plan

### Local Verification

- Install:
  - Root Python: `pip install -r requirements.txt`
  - Frontend: `cd drch && npm.cmd install`
- Dev:
  - `cd drch && npm.cmd run dev:both`
- Build:
  - `cd drch && npm.cmd run build`
- Lint:
  - `cd drch && npm.cmd run lint`
  - Current expected result before setup: prompts for ESLint config; fix or document before enforcing.
- Test command:
  - No test script currently exists.
- Integration manual checks:
  - Driver creates room.
  - Passenger joins matching transport.
  - Chat messages send/receive.
  - Room full/missing errors are visible.
  - Leave chat closes/resets without reload after Phase 2.
  - Transition to `ped_pong` stays in sync.

### Production Preview Verification

- Vercel build succeeds from root `drch`.
- Frontend loads without console errors.
- Network tab shows no requests to `127.0.0.1` or `localhost`.
- `POST /rooms`, `GET /rooms/random`, and WebSocket connect to production backend.
- CORS accepts deployed frontend and rejects unknown origins.
- Core driver/passenger chat flow works.
- Mobile viewport has no horizontal overflow.
- Backend unavailable state is visible and recoverable.

## 13. Suggested Commit Plan

### Commit 1: Add environment-based backend URLs

Files:
- `drch/app/page.js`
- `drch/app/components/JoinChat.js`
- `drch/app/lib/config.js`
- `drch/.env.example`

Reason:
- Removes deployment-blocking localhost URLs from frontend call sites.

### Commit 2: Document deployment architecture

Files:
- `README.md`
- `AGENT.md`
- `DESIGN.md`
- `REVIEW.md`
- `FIX_PLAN.md`

Reason:
- Locks Vercel root and external backend strategy.

### Commit 3: Harden backend production settings

Files:
- `main.py`
- `.env.example`
- backend env docs

Reason:
- Restricts CORS and guards `/rooms/debug`.

### Commit 4: Fix room transition consistency

Files:
- `main.py`
- `drch/app/page.js`
- `drch/app/components/ChatRoom.js`

Reason:
- Prevents frontend/backend room divergence.

### Commit 5: Add validation and inline errors

Files:
- `main.py`
- `drch/app/components/JoinChat.js`
- `drch/app/page.js`

Reason:
- Makes API failures and invalid input production-safe.

### Commit 6: Improve responsive/accessibility basics

Files:
- `JoinChat.js`
- `TransportButtons.js`
- `ChatRoom.js`
- `TypeUser.js`

Reason:
- Makes current UI usable on mobile and keyboard.

### Commit 7: Low-risk cleanup

Files:
- `page.js`
- `JoinChat.js`
- `ChatRoom.js`

Reason:
- Removes unused imports/logs/invalid class after behavior is stable.

## 14. What Not To Fix Yet

- Full redesign
  - Reason: deployment and chat correctness are not stable.
  - Revisit after Phase 3.
- Authentication redesign
  - Reason: product scope does not define identity requirements.
  - Revisit before real public launch.
- Database migration/persistence
  - Reason: large architecture decision; external backend can launch preview without it.
  - Revisit when scaling or persistence is required.
- Replacing WebSocket with third-party realtime provider
  - Reason: larger refactor than needed for first external backend deployment.
  - Revisit if backend must be Vercel-only.
- TypeScript migration
  - Reason: non-blocking and broad.
  - Revisit after tests and deployment config.
- Asset deletion/compression
  - Reason: needs visual/product confirmation.
  - Revisit after core performance baseline.
- Animation/micro-interactions
  - Reason: polish only.
  - Revisit after responsive and error states.

## 15. Final Recommendation

- Recommended next action: configure real preview/production environment values, deploy the external FastAPI WebSocket backend, then implement Phase 2 room-transition consistency.
- First task future AI agent should implement next: verify Vercel uses root directory `drch`, set `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_BASE_URL`, and set backend `ALLOWED_ORIGINS` plus `ENVIRONMENT=production`.
- Must verify before continuing: `cd drch && npm.cmd run build` passes, deployed frontend makes no browser requests to localhost, and `/rooms/debug` returns 404 in production mode.

## Assumptions and Defaults

- Backend host default is Render Web Service because the current backend needs a long-running ASGI process with WebSocket support.
- First production-like deployment is a preview/staging deployment, not a full public launch.
- Existing user flows and visual direction should remain intact through Phase 3.
- No real secrets will be added to the repository.
