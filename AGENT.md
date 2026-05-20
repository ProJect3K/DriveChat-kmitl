# AGENT.md

เอกสารนี้สรุปจากไฟล์ที่มีอยู่จริงใน repository นี้ ได้แก่ `README.md`, `requirements.txt`, `main.py`, `drch/package.json`, ไฟล์ใน `drch/app`, config ของ Next/Tailwind/PostCSS และ asset ใต้ `drch/public`

## 1. Project Overview

DRIVECHAT@kmitl เป็นแอปแชทแบบ real-time ที่ผูกกับแนวคิดเรื่องการเดินทาง/ยานพาหนะ จากโค้ดปัจจุบัน ผู้ใช้กรอก username เลือกบทบาท `Passenger` หรือ `Driver` เลือกประเภทการเดินทาง แล้วเข้าสู่ห้องแชท

พฤติกรรมที่โค้ดรองรับจริง:

- `Driver` สร้างห้องใหม่ผ่าน `POST /rooms`
- `Passenger` ขอเข้าห้องแบบสุ่มตาม `transport_type` ผ่าน `GET /rooms/random`
- หลังเข้าห้องแล้ว client เปิด WebSocket ไปที่ `/ws/{room_id}/{username}`
- backend เก็บห้อง ผู้ใช้ connection และ timer ทั้งหมดใน memory ของ process เดียวผ่าน `ConnectionManager` ใน `main.py`

ไม่มีฐานข้อมูล ไม่มีระบบ login/session และไม่มี persistence ใน repository ปัจจุบัน

## 2. Tech Stack

- Frontend: Next.js `14.2.15`, React `18`, App Router ใน `drch/app`
- Backend: FastAPI `0.115.2`, Starlette, Uvicorn `0.31.1`
- Real-time: FastAPI WebSocket endpoint และ dependency `websockets==13.1`
- Styling: Tailwind CSS `3.4.1`, PostCSS, Autoprefixer, และ CSS เพิ่มเติมที่ `drch/app/components/transportselect.css`
- Icons: `lucide-react`
- Package manager ฝั่ง frontend: npm โดยดูจาก `drch/package-lock.json`
- Python dependencies: อยู่ใน `requirements.txt`
- Node version ที่ระบุ: `20.18.0` ใน `drch/package.json` และ `README.md`
- Python version ที่ README ระบุ: `3.13.0`
- Dev runner: `concurrently` ใช้ใน script `npm run dev:both`

## 3. Repository Structure

```text
DriveChat-kmitl/
  .gitignore
  README.md
  requirements.txt
  package-lock.json
  main.py
  AGENT.md
  DESIGN.md
  drch/
    README.md
    package.json
    package-lock.json
    next.config.mjs
    postcss.config.mjs
    tailwind.config.js
    jsconfig.json
    app/
      layout.js
      page.js
      globals.css
      favicon.ico
      fonts/
        GeistVF.woff
        GeistMonoVF.woff
      lib/
        config.js
        constants.js
      components/
        ChatRoom.js
        JoinChat.js
        TransportButtons.js
        TypeUser.js
        transportselect.css
    public/
      fonts/
        MyFont.ttf
      images/
        busstop.png
        lanprajom.png
        ต้นไม้มมม1.png
      videos/
        bike.mp4
        car.mp4
        duck.mp4
        EvBus.mp4
        songthaew.mp4
```

หมายเหตุจากไฟล์จริง:

- `main.py` เป็น backend source หลักเพียงไฟล์เดียว
- `drch/app/page.js` เป็น client component หลักและเป็นจุดเปิด WebSocket
- `JoinChat.js` ดูแล flow ก่อนเข้าห้อง เช่น username, role, transport, create room, random join
- `ChatRoom.js` ดูแลหน้าห้องแชท วิดีโอ timer ข้อความ และปุ่ม leave
- `constants.js` มีค่า `ROOM_TYPES` ที่ frontend ใช้ส่ง `transport_type` ไป backend
- root `.gitignore` ignore `__pycache__/` และ `.venv/`; `drch/.gitignore` ignore `/node_modules` และ `/.next/` สำหรับ frontend artifacts

## 4. How to Run Locally

ขั้นตอนอ้างอิงจาก root `README.md` และ `drch/package.json`

1. Clone repository:

```bash
git clone https://github.com/ProJect3K/DriveChat-kmitl.git
```

2. สร้างและ activate Python virtual environment จาก root:

```bash
py -m venv .venv
.venv\Scripts\activate
```

3. ติดตั้ง dependency:

```bash
pip install -r requirements.txt
cd drch
npm install
```

4. Run frontend และ backend พร้อมกันจากโฟลเดอร์ `drch`:

```bash
npm run dev:both
```

`npm run dev:both` ใน `drch/package.json` คือ:

```bash
concurrently "cd .. && uvicorn main:app --reload" "npm run dev"
```

ดังนั้น backend เริ่มจาก root ด้วย `uvicorn main:app --reload` และ frontend เริ่มด้วย `next dev`

ข้อควรระวังจากโค้ดปัจจุบัน:

- frontend ใช้ `drch/app/lib/config.js` เพื่ออ่าน `NEXT_PUBLIC_API_BASE_URL` และ `NEXT_PUBLIC_WS_BASE_URL`; ถ้าไม่ตั้งค่า env จะ fallback เป็น local backend `127.0.0.1:8000`
- Next dev server ปกติอยู่ที่ `http://localhost:3000`
- ถ้า restart backend ห้องและรายชื่อผู้ใช้จะหาย เพราะเก็บใน memory
- `npm run lint` มีใน script แต่ repository ไม่มีไฟล์ config ESLint แยกให้เห็น
- ข้อความภาษาไทยบางส่วนใน README แสดงเป็น mojibake ใน checkout นี้

## 5. Important Commands

คำสั่งที่มีอยู่จริงใน `drch/package.json`:

```bash
npm run dev
npm run dev:both
npm run build
npm run start
npm run lint
```

คำสั่ง backend ที่ README/script ใช้:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

ไม่พบ test script ใน `drch/package.json` และไม่พบไฟล์ test Python/JavaScript ใน source tree ที่ inspect

## 6. Application Architecture

### Frontend

- `drch/app/layout.js` ตั้งค่า metadata, โหลด local Geist fonts และ import `globals.css`
- `drch/app/page.js` ใช้ `'use client'`, เก็บ state หลักด้วย `useState`, เก็บ WebSocket ด้วย `useRef`
- `page.js` สลับ render ระหว่าง `JoinChat` และ `ChatRoom` จากค่า `isJoined`

### Backend

- `main.py` สร้าง `app = FastAPI()`
- ตั้งค่า CORS ด้วย `allow_origins=get_allowed_origins()`, `allow_methods=["*"]`, `allow_headers=["*"]`; `get_allowed_origins()` อ่านจาก `ALLOWED_ORIGINS` และ fallback เป็น local frontend origins
- สร้าง Pydantic model `RoomCreate`
- สร้าง class `ConnectionManager` เพื่อเก็บและจัดการ:
  - `active_connections`
  - `active_users`
  - `available_rooms`
  - `room_cleanup_tasks`
  - `room_transition_tasks`
  - `original_rooms`
- สร้างห้องพิเศษตั้งต้น `duck_pond` และ `ped_pong`

### API/Data Flow

- Driver สร้างห้อง: `POST {NEXT_PUBLIC_API_BASE_URL}/rooms` ผ่าน `buildApiUrl`
- Passenger หาห้องสุ่ม: `GET {NEXT_PUBLIC_API_BASE_URL}/rooms/random?transport_type=...&user_type=...` ผ่าน `buildApiUrl`
- Chat: `{NEXT_PUBLIC_WS_BASE_URL}/ws/{room}/{username}` ผ่าน `buildWsUrl`; room และ username ถูก encode ด้วย `encodeURIComponent`
- ข้อความ WebSocket เป็น plain text ไม่ใช่ JSON
- frontend parse control message จาก string เช่น `Active users` และ `System: ROOM_CHANGE:`

## 7. Main Features

### Role Selection

- ไฟล์: `drch/app/components/TypeUser.js`
- role ที่มีจริง: `passenger`, `driver`
- UI แสดงปุ่ม `Passenger` และ `Driver` พร้อม icon จาก `lucide-react`

### Transport Selection

- ไฟล์: `drch/app/components/TransportButtons.js`
- constants อยู่ที่ `drch/app/lib/constants.js`
- ค่า transport ที่ส่งไป backend:
  - `motorcycle`
  - `taxi`
  - `location`
  - `evmini`
- label ใน UI:
  - `Bicycle`
  - `Taxi`
  - `Songthaew`
  - `EV / Minibus`

### Driver Create Room

- ไฟล์ frontend: `JoinChat.js`
- ไฟล์ backend: `main.py` endpoint `POST /rooms`
- frontend คำนวณ capacity จาก transport type:
  - `motorcycle`: 2
  - `taxi`: 4
  - `location`: 10
  - `evmini`: 15
- backend ตรวจว่า room ซ้ำหรือไม่ และ `creator_type` ต้องเท่ากับ `driver`
- frontend ส่ง field `display_name` ด้วย แต่ `RoomCreate` ใน backend ไม่มี field นี้

### Passenger Random Join

- ไฟล์ frontend: `JoinChat.js`
- ไฟล์ backend: `ConnectionManager.get_random_active_room`
- ใช้ได้เฉพาะเมื่อ `user_type == "passenger"`
- backend filter ห้องที่ไม่ใช่ `duck_pond` และ `ped_pong`, transport type ตรงกัน, และยังไม่เต็ม
- ถ้ามีหลายห้องใช้ `random.choice`

### Real-time Chat

- WebSocket เปิดใน `drch/app/page.js`
- endpoint อยู่ที่ `@app.websocket("/ws/{room_id}/{username}")`
- client ส่งข้อความ raw text
- backend broadcast เป็น string รูปแบบ `{username}: {data}`
- `ChatRoom.js` แยก system message ด้วย `msg.startsWith("System:")`

### Active Users

- backend ส่ง string เริ่มด้วย `Active users`
- frontend ใน `page.js` split string เพื่อสร้าง `activeUsers`
- `ChatRoom.js` แสดง `user seat: {activeUserCount}/{roomCapacity}`

### Room Transition

- backend ตั้ง timer 3 นาทีสำหรับห้องปกติ
- backend รอ 160 วินาทีแล้วส่ง warning ว่าเหลือ 20 วินาที
- backend ย้าย user ไป `ped_pong` ด้วยข้อความ `System: ROOM_CHANGE:ped_pong`
- frontend ใน `ChatRoom.js` มี countdown local เริ่มที่ 120 วินาที ซึ่งไม่ตรงกับ backend 180 วินาที

### Transport Video

- ไฟล์: `ChatRoom.js`
- เลือกวิดีโอจาก `roomCapacity`
- mapping ที่มีจริง:
  - 2: `/videos/bike.mp4`
  - 4: `/videos/car.mp4`
  - 10: `/videos/songthaew.mp4`
  - 15: `/videos/EvBus.mp4`
  - `ped_pong`: `/videos/duck.mp4`

### Leave Chat

- ไฟล์: `ChatRoom.js`
- ปุ่ม `LEAVE CHAT` เรียก `window.location.reload()`

## 8. API / Backend Notes

### `POST /rooms`

- Model: `RoomCreate`
- field ที่ backend รับ:
  - `room_name`
  - `capacity`
  - `creator_type`
  - `transport_type`
- error:
  - `Room already exists`
  - `Only drivers can create rooms`
- success response:

```json
{
  "status": "success",
  "room": "room name",
  "capacity": 4
}
```

### `GET /rooms/random`

- query:
  - `transport_type`
  - `user_type`
- return เมื่อเจอห้อง:
  - `room`
  - `capacity`
  - `current_users`
  - `time_remaining`
- return เมื่อไม่เจอ:

```json
{
  "room": null,
  "message": "No suitable rooms available"
}
```

### `GET /rooms/debug`

- แสดงข้อมูลทุกห้องจาก `manager.available_rooms`
- มี `capacity`, `current_users`, `time_remaining`, `is_special`, `transport_type`
- endpoint นี้ถูก guard ด้วย `ENVIRONMENT`; ถ้าไม่ใช่ `development` จะตอบ `404 Not found`

### `WebSocket /ws/{room_id}/{username}`

- เรียก `manager.connect`
- broadcast join message และ active user list
- รับข้อความใน loop ด้วย `websocket.receive_text()`
- ถ้าข้อความเป็น `/return` และมี `username` ใน `original_rooms` จะเรียก `move_back_to_original_room`
- เมื่อ disconnect จะเรียก `manager.disconnect`

### Backend Risks ที่เห็นจากโค้ด

- CORS ใช้ allowlist จาก `ALLOWED_ORIGINS` และ fallback เฉพาะ local frontend origins
- ไม่มี auth/session
- ไม่มี validation ความยาว username, room name, message
- state อยู่ใน memory process
- `/rooms/debug` ยังไม่มี auth แต่ถูกปิดใน production ผ่าน `ENVIRONMENT`
- ใช้ `print()` สำหรับ exception หลายจุด
- WebSocket protocol ใช้ string format ทำให้ frontend/backend ผูกกันแบบเปราะ

## 9. Frontend Notes

### Main Page

- `page.js` เก็บ state หลัก เช่น `messages`, `inputMessage`, `username`, `room`, `activeUsers`, `isJoined`, `selectedType`, `roomCapacity`
- `joinChat` เปิด WebSocket ผ่าน `buildWsUrl` และ `NEXT_PUBLIC_WS_BASE_URL`
- `sendMessage` ส่ง `inputMessage` ไป socket แล้ว clear input
- `handleRoomChange` มี logic พิเศษสำหรับ `duck_pond`

### Components

- `JoinChat.js`: form ก่อนเข้าห้อง, create room, random join, loading text, no-room notice
- `TypeUser.js`: role selector
- `TransportButtons.js`: transport selector
- `ChatRoom.js`: status bar, video, chat list, input, leave button
- `transportselect.css`: class สำหรับ transport/type button ผ่าน Tailwind `@apply`

### Styling

- ใช้ Tailwind utility เป็นหลัก
- custom Tailwind colors มี `lightCream` และ `lightbrown`
- `globals.css` โหลด `/fonts/MyFont.ttf` เป็น `MyCustomFont` แล้ว apply ให้ทุก element ด้วย `*`
- `layout.js` โหลด Geist fonts แต่ global CSS ทำให้ `MyCustomFont` override UI ส่วนใหญ่

### Routing

- มี route เดียวจาก `drch/app/page.js` คือ `/`
- ไม่มี route อื่นใน `drch/app`

## 10. Environment Variables

Phase 1 เพิ่ม environment variable usage แล้ว:

| Variable | Purpose | Used in | Required |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | HTTP backend base URL สำหรับ `POST /rooms` และ `GET /rooms/random` | `drch/app/lib/config.js`, `JoinChat.js` | Required for deployed frontend |
| `NEXT_PUBLIC_WS_BASE_URL` | WebSocket backend base URL สำหรับ `/ws/{room}/{username}` | `drch/app/lib/config.js`, `page.js` | Required for deployed frontend |
| `ALLOWED_ORIGINS` | comma-separated frontend origins ที่ backend อนุญาตผ่าน CORS; ห้ามใช้ `*` เมื่อ `ENVIRONMENT=production` | `main.py` | Required for production backend |
| `ENVIRONMENT` | ใช้แยก development/production และ guard `/rooms/debug` | `main.py` | Recommended |

ตัวอย่างอยู่ใน root `.env.example` และ `drch/.env.example` ห้าม commit secret หรือ real production-only values ลง repository

## 11. Code Quality Review

### Strengths

- โครงสร้างเล็กและ trace flow ได้จากไฟล์ไม่กี่ไฟล์
- แยก frontend/backend ชัดเจน: Next.js สำหรับ UI, FastAPI สำหรับ API/WebSocket
- มี constants สำหรับ transport type ที่ frontend ใช้ร่วมกัน
- มี disabled/loading state บางส่วนใน `JoinChat.js`
- backend มี endpoint ชัดเจนสำหรับ create room, random room, debug, และ WebSocket
- มี comment อธิบายหลายจุดใน source

### Issues

- frontend call sites ใช้ env-based URL ผ่าน `drch/app/lib/config.js`; local fallback ยังอยู่ใน config สำหรับ development
- frontend timer 120 วินาที ไม่ตรงกับ backend timer 180 วินาที
- protocol ระหว่าง WebSocket server/client เป็น string ไม่ใช่ structured data
- frontend ส่ง `display_name` แต่ backend model ไม่ใช้
- state/props บางตัวดูไม่ถูกใช้ใน flow ปัจจุบัน เช่น `customRoom`, `roomName`, `setCustomRoom`, `setRoomName`
- `room_cleanup_tasks` มีใน manager แต่ไม่พบ code ที่สร้าง cleanup task
- `Image` import ใน `JoinChat.js` แต่ไม่ถูกใช้
- `useEffect` import ใน `page.js` แต่ไม่ถูกใช้
- `ChatRoom.js` มี class `bg-[#E4E9F3]` ซ้ำใน element เดียว
- active user parser อาจ parse ผิดถ้า backend append `| Time remaining` ใน string เดียวกัน
- leave chat ใช้ reload ทั้งหน้า แทนที่จะปิด socket และ reset state โดยตรง

### Risks

- restart backend แล้ว state ห้องหายทั้งหมด
- username ไม่ unique และไม่มี auth
- room/message ไม่มี length limit
- `/rooms/debug` เปิดข้อมูล runtime เฉพาะเมื่อ `ENVIRONMENT=development`
- CORS ใช้ allowlist จาก `ALLOWED_ORIGINS` และ fallback local origins
- `original_rooms` key ด้วย username อย่างเดียว อาจสับสนถ้ามี username ซ้ำหลาย connection
- deploy จริงต้องตั้งค่า `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WS_BASE_URL`, `ALLOWED_ORIGINS`, และ `ENVIRONMENT`

### Recommended Refactors

ข้อเสนอต่อไปนี้มาจากปัญหาที่เห็นในโค้ด:

- Phase 1 ทำแล้ว: URL backend/WebSocket อยู่ใน `drch/app/lib/config.js` และอ่าน env `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WS_BASE_URL`
- เปลี่ยน WebSocket message เป็น JSON event เช่น `type: "active_users"` หรือ `type: "room_change"`
- ให้ backend เป็น source of truth ของ countdown/transition
- validate username, room name, capacity และ message length
- เพิ่ม explicit leave room flow ที่ปิด WebSocket
- แยก `main.py` เมื่อ backend โตขึ้นเป็น models/routes/manager/settings
- เพิ่ม test สำหรับ room creation, random join, WebSocket join/leave, และ transition timer

## 12. Safety Rules for Future AI Agents

- อ่านไฟล์จริงก่อนแก้เสมอ
- อย่า rewrite ทั้งแอปถ้า user ไม่ได้ขอ
- รักษา flow ปัจจุบันของ `Passenger` และ `Driver` เว้นแต่ได้รับคำสั่งให้เปลี่ยน
- ถ้าแก้ `ROOM_TYPES` ต้องแก้ frontend/backend ที่เกี่ยวข้องพร้อมกัน
- ถ้าแก้ WebSocket message format ต้องแก้ parser ใน `page.js` และ renderer ใน `ChatRoom.js`
- อย่าลบ media asset ใน `drch/public` โดยไม่ตรวจว่าถูกใช้อยู่หรือไม่
- อย่าใส่ secret ลง repository
- อย่า commit/generated folders เช่น `drch/node_modules/`, `drch/.next/`, `.venv/`, `__pycache__/`
- หลังแก้ API/WebSocket/timer ควรทดสอบ local flow create room, random join, send message, leave
- ถ้าเปลี่ยน architecture, command, route, หรือ UX flow ให้ update `AGENT.md` และ `DESIGN.md`

## 13. Suggested Next Improvements

### High Priority

- ตรวจ production env สำหรับ API/WebSocket URL ให้ครบใน Vercel/backend host
- ทำ countdown ให้ตรงกันระหว่าง frontend/backend
- เปลี่ยน WebSocket protocol จาก string เป็น structured JSON
- เพิ่ม ignore rule สำหรับ `drch/.next/`, `drch/node_modules/` และ build artifacts
- เพิ่ม validation และ length limit
- ตรวจว่า `/rooms/debug` ถูกปิดเมื่อ `ENVIRONMENT=production`

### Medium Priority

- เพิ่ม backend tests สำหรับ room lifecycle และ WebSocket
- เพิ่ม frontend tests สำหรับ role/transport selection, create room, random join, no-room state, chat rendering
- เปลี่ยน leave chat จาก reload เป็น state reset + socket close
- ลบ unused imports/state/props
- รวม URL และ protocol string ไว้ใน constants
- เปลี่ยน error จาก `alert()` เป็น inline UI

### Low Priority

- cleanup duplicate class names
- แก้ encoding/prose ใน README ถ้าต้องใช้เป็นเอกสารหลัก
- สร้าง component primitive สำหรับ Button/Input/Notice/ChatBubble เมื่อเริ่ม refactor UI
- เพิ่ม deployment docs เมื่อรู้ production backend URL และ hosting flow จริง
