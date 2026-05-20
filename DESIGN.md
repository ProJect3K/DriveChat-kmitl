# DESIGN.md

เอกสารนี้เขียนจาก UI และโค้ดที่มีอยู่จริงใน repository ปัจจุบันเท่านั้น ส่วนที่เป็นข้อเสนอจะระบุว่าเป็น “ข้อเสนอ” หรือ “ควร” โดยอิงจาก design debt ที่พบในไฟล์จริง

## 1. Product Design Overview

จากชื่อโปรเจกต์ `DRIVECHAT@kmitl`, metadata ใน `drch/app/layout.js`, UI label และ asset ที่ใช้ แอปนี้เป็น real-time chat ที่ผูกกับบริบทการเดินทางของ KMITL

- Target users ที่เห็นจาก UI โดยตรง: ผู้ใช้บทบาท `Passenger` และ `Driver`
- Main use case ที่ implement แล้ว: Driver สร้างห้องตามประเภทการเดินทาง และ Passenger join ห้องแบบสุ่มตามประเภทการเดินทาง
- Core user value ที่โค้ดรองรับจริง: ผู้ใช้เข้า chat room ได้เร็วโดยใช้ username, role และ transport type โดยไม่มีระบบ account
- Product personality ที่เห็นจาก asset/UI: ใช้ภาพ bus stop, background ต้นไม้, วิดีโอยานพาหนะ, สีครีม/น้ำตาล และปุ่มเลือกการเดินทางพร้อม icon

ข้อสังเกต: เอกสารนี้ไม่สรุปว่าเป็น production-ready product เพราะ repository ไม่มี auth, database, persistence, deployment config หรือ production environment config ให้ตรวจ

## 2. Current User Flow

### Passenger Random Room Flow

1. User enters the app
2. User sees หน้า join ที่มี `DriveChat@kmitl`, input `Enter your username`, ปุ่ม `Passenger`/`Driver`, transport buttons และภาพ `busstop.png`
3. User interacts with username input, เลือก `Passenger`, และเลือก transport type
4. System responds by enable ปุ่ม `Join Random Room` เมื่อมีข้อมูลที่ต้องใช้
5. User clicks `Join Random Room`
6. System responds by เรียก `GET {NEXT_PUBLIC_API_BASE_URL}/rooms/random?transport_type=...&user_type=passenger` ผ่าน helper `buildApiUrl`
7. ถ้า backend ส่ง `data.room` กลับมา ระบบจะเปิด WebSocket ไปที่ `{NEXT_PUBLIC_WS_BASE_URL}/ws/{room}/{username}` ผ่าน helper `buildWsUrl` และเปลี่ยนไปหน้า `ChatRoom`
8. ถ้า backend ไม่พบห้อง ระบบแสดงข้อความ `No available rooms for this transport type...`
9. User completes flow โดยเข้าห้องแชท หรืออยู่หน้า join พร้อม no-room state

### Driver Create Room Flow

1. User enters the app
2. User sees หน้า join เดียวกัน
3. User interacts with username input และเลือก `Driver`
4. System responds by แสดงปุ่ม `Create New Room`
5. User clicks `Create New Room`
6. System responds by แสดง room name input, transport buttons, `Create & Join Room`, และ `Cancel`
7. User enters room name และเลือก transport type
8. System responds by enable ปุ่ม create เมื่อข้อมูลครบ
9. User clicks `Create & Join Room`
10. System responds by เรียก `POST {NEXT_PUBLIC_API_BASE_URL}/rooms` ผ่าน helper `buildApiUrl`
11. ถ้า success ระบบ join ห้องที่สร้างผ่าน WebSocket และแสดง `ChatRoom`
12. ถ้า backend error ระบบแสดง browser `alert(error.detail)`

### Chat Room Flow

1. User enters chat room หลัง create หรือ random join
2. User sees status bar ที่มี `Next Station`, `Now`, และ `TIME REMAINING` สำหรับห้องปกติ
3. User sees วิดีโอฝั่งซ้าย และ chat panel ฝั่งขวา
4. User interacts with input `chat message` แล้วกด `send` หรือ Enter
5. System responds by ส่งข้อความ raw text ผ่าน WebSocket
6. Backend broadcasts ข้อความรูปแบบ `{username}: {message}`
7. UI แสดง system message ตรงกลาง, ข้อความตัวเองชิดขวา, ข้อความคนอื่นชิดซ้าย
8. User clicks `LEAVE CHAT`
9. System responds by reload หน้าเว็บด้วย `window.location.reload()`

## 3. Information Architecture

- Pages:
  - `/` จาก `drch/app/page.js` เป็น page เดียวที่ implement

- Sections:
  - page background ใช้ `/images/ต้นไม้มมม1.png`
  - join/chat container
  - join form จาก `JoinChat`
  - chat room จาก `ChatRoom`
  - bus stop image แสดงเฉพาะตอนยังไม่ joined

- Navigation:
  - ไม่มี navbar
  - ไม่มี route navigation
  - การเปลี่ยนหน้าจอใช้ state `isJoined`
  - leave chat ใช้ reload ไม่ใช่ route change

- Main interaction areas:
  - username input
  - role selector
  - transport selector
  - create room form
  - random room action
  - message list
  - chat input/send

- Chat/drive-related areas:
  - status bar
  - transport video
  - room name
  - seat count
  - timer
  - special room `ped_pong`

## 4. Current UI Audit

### Layout

สิ่งที่ทำอยู่แล้ว:

- join screen อยู่ใน container กลางหน้า
- chat screen แบ่งพื้นที่เป็น status bar, video area, chat area
- bus stop image อยู่ใต้ join form และซ่อนเมื่อเข้าห้องแล้ว

สิ่งที่ควรปรับ:

- `ChatRoom.js` ใช้ layout แนวนอนตายตัว (`flex gap-4`, video/chat แบ่ง basis) โดยไม่มี breakpoint
- transport buttons อยู่แถวเดียว อาจแน่นบนจอแคบ
- username input กับ role selector อยู่แถวเดียว
- `LEAVE CHAT` อยู่ใต้ content หลักและใช้ reload

### Visual Hierarchy

สิ่งที่ทำอยู่แล้ว:

- title `DriveChat@kmitl` อยู่ด้านบนของ join flow
- status bar อยู่ด้านบนของ chat room
- ปุ่ม action แยกสีตามงาน เช่น join สีฟ้า, create/send สี amber, leave สีแดง

สิ่งที่ควรปรับ:

- room name และ seat count อยู่ใน chat panel แต่ visual weight ยังน้อยกว่าวิดีโอมาก
- system message และ active user update ถูกปนใน message stream
- ไม่มี dedicated connection/status area สำหรับ WebSocket state

### Typography

สิ่งที่ทำอยู่แล้ว:

- `globals.css` โหลด `MyCustomFont` จาก `/fonts/MyFont.ttf`
- `layout.js` โหลด Geist Sans/Mono local fonts

สิ่งที่ควรปรับ:

- `* { font-family: 'MyCustomFont', sans-serif; }` override ทุก element ทำให้ Geist ที่โหลดใน `layout.js` แทบไม่ได้ควบคุม UI
- casing ของ label ไม่สม่ำเสมอ เช่น `TIME REMAINING`, `send`, `user seat`
- ยังไม่มี typography scale เป็น token

### Colors

สิ่งที่ทำอยู่แล้ว:

- Tailwind config มี `lightCream: #F2EDEA` และ `lightbrown: #87451A`
- มีสีแยก action/error/warning ผ่าน Tailwind class เช่น `blue-500`, `amber-400`, `red-500`, `yellow-50`
- chat room ใช้ hardcoded blue-gray เช่น `#6D81A9`, `#E4E9F3`, `#D9D9D9`

สิ่งที่ควรปรับ:

- สีจำนวนมากอยู่ใน JSX โดยตรง ไม่ได้รวมใน token
- selected state พึ่งสี border/background เป็นหลัก
- ยังไม่มี documented palette ใน code

### Spacing

สิ่งที่ทำอยู่แล้ว:

- ใช้ Tailwind spacing เช่น `p-6`, `mb-6`, `gap-2`, `gap-4`
- component transport มี class ผ่าน `transportselect.css`

สิ่งที่ควรปรับ:

- spacing ยัง manual ต่อ component
- ไม่มี spacing scale ที่ document หรือ enforce
- chat area ใช้ `h-[calc(100vh-200px)]` ซึ่งควรตรวจบนจอเล็ก

### Components

สิ่งที่ทำอยู่แล้ว:

- แยก component หลักเป็น `JoinChat`, `TypeUser`, `TransportButtons`, `ChatRoom`
- ใช้ native `<button>` และ `<input>`
- ใช้ `lucide-react` icons พร้อม visible text

สิ่งที่ควรปรับ:

- ปุ่ม/input style กระจายอยู่หลายไฟล์
- `globals.css` มี class component เช่น `.btn-primary` แต่ JSX ส่วนใหญ่ไม่ได้ใช้
- ไม่มี reusable `Button`, `Input`, `ChatBubble`, `Notice`
- protocol string ของ backend มีผลต่อ rendering ใน frontend

### Responsiveness

สิ่งที่ทำอยู่แล้ว:

- join container ใช้ max width
- bus stop image ใช้ style width 100% height auto

สิ่งที่ควรปรับ:

- ไม่พบ responsive class สำหรับ chat layout
- ไม่พบ mobile-specific layout สำหรับ transport buttons
- video/chat ควร stack บน mobile แต่ยังไม่ implement

### Accessibility

สิ่งที่ทำอยู่แล้ว:

- ใช้ button/input จริง
- icon มี text label ประกอบ
- disabled state มีในปุ่มหลายจุด

สิ่งที่ควรปรับ:

- input ใช้ placeholder แต่ไม่มี visible `<label>`
- chat feed ไม่มี `aria-live`
- video ไม่มี controls/fallback text/caption
- focus style ของ custom buttons ยังไม่ถูกออกแบบชัด
- error หลายจุดใช้ `alert()`

### Interaction Feedback

สิ่งที่ทำอยู่แล้ว:

- มี hover/disabled states บนปุ่มหลายปุ่ม
- loading text: `Creating...`, `Finding room...`
- no-room state สำหรับ passenger
- selected state สำหรับ role/transport

สิ่งที่ควรปรับ:

- ไม่มี WebSocket connecting/connected/disconnected indicator
- ไม่มี backend offline state ก่อน user กด action
- `/return` รองรับใน backend แต่ไม่มีปุ่มหรือคำอธิบายใน UI
- room transition ไป `ped_pong` ยังพึ่ง system message

### Empty / Loading / Error States

สิ่งที่ทำอยู่แล้ว:

- passenger no-room state มีใน `JoinChat.js`
- button loading text มีใน create/join
- room creation error แสดงผ่าน `alert(error.detail)`

สิ่งที่ควรปรับ:

- ไม่มี empty chat state
- ไม่มี WebSocket error state แบบ inline
- ไม่มี backend unavailable state
- error UI ยังไม่ consistent

## 5. Design System Foundation

ข้อเสนอนี้อิงจากสี/spacing/component ที่มีอยู่ใน code ปัจจุบัน

### Colors

- Primary: ใช้โทนฟ้าสำหรับ passenger/join action เช่น `blue-500`
- Secondary: ใช้โทน amber สำหรับ create/send เช่น `amber-400`
- Background: `#F2EDEA` จาก `lightCream`
- Surface: `#FFFFFF` สำหรับ join card, `#E4E9F3` สำหรับ chat panel
- Text: `#87451A` จาก `lightbrown` และ body color ปัจจุบัน
- Border: ใช้ neutral gray จาก Tailwind เช่น `gray-200`
- Success: ยังไม่มีใน UI ปัจจุบัน; ถ้าเพิ่มควรเป็น token ใหม่
- Warning: ใช้ pattern ปัจจุบัน `yellow-50`, `yellow-200`, `yellow-800`
- Error: ใช้ pattern ปัจจุบัน `red-500`, `red-600`

### Typography

- Display: สำหรับ `DriveChat@kmitl`
- Heading: สำหรับ `Room: ...` และ section title ใน form
- Body: สำหรับ input, message, label
- Caption: สำหรับ sender name, seat count, helper/error text
- Button: สำหรับ action labels เช่น `Join Random Room`, `Create & Join Room`, `send`

ควรเลือก font ownership ให้ชัด ระหว่าง `MyCustomFont` ใน `globals.css` กับ Geist ที่โหลดใน `layout.js`

### Spacing System

ข้อเสนอให้ใช้ scale ตาม Tailwind ที่มีใช้อยู่แล้ว:

- 4px: spacing เล็กมาก
- 8px: gap ระหว่าง control ใกล้กัน
- 12px: padding compact
- 16px: padding ปุ่ม/input/card ภายใน
- 24px: section spacing
- 32px: major spacing

### Border Radius

- Small: 4px สำหรับ element เล็ก
- Medium: 8px สำหรับ button/input/chat bubble
- Large: 12px สำหรับ panel หลัก

อ้างอิงจาก class ปัจจุบันที่ใช้ `rounded-lg`, `rounded-xl`

### Shadows / Elevation

- Card: ใช้ shadow เบาแบบที่ join container ใช้ `shadow-xl` แต่ควรลด/standardize
- Modal: ยังไม่มี modal ใน code ปัจจุบัน
- Floating element: ยังไม่มี floating element ใน code ปัจจุบัน

### Components

ควรมี reusable component เฉพาะสิ่งที่เกี่ยวกับระบบปัจจุบัน:

- Button
- Input
- Chat Bubble
- Message List
- Card/Panel
- Notice สำหรับ no-room/error
- Loading State สำหรับ create/join/socket
- Empty State สำหรับ no room/empty chat

รายการที่ยังไม่มี use case ใน repo ปัจจุบันและไม่ควรเพิ่มจนกว่าจะมี feature:

- File Item
- Upload Area
- Sidebar
- Navbar
- Modal
- Toast

## 6. Component Guidelines

### Button

- Purpose: join room, create room, cancel, send, leave
- Variants ที่มีจริงหรือควรรวมจาก UI ปัจจุบัน: primary blue, secondary gray, amber action, danger red, selected
- States: default, hover, disabled, loading, selected, focus
- Usage rules: ปุ่มหลักในแต่ละ section ควรเด่นที่สุดหนึ่งตัว
- Accessibility notes: ต้องมี visible text หรือ `aria-label` ถ้าอนาคตใช้ icon-only

### Input

- Purpose: username, room name, chat message
- Variants: form input, chat input
- States: default, focus, disabled, error
- Usage rules: เพิ่ม label แทนการพึ่ง placeholder อย่างเดียว
- Accessibility notes: error text ควรผูกกับ input ด้วย `aria-describedby` หาก implement

### Chat Bubble

- Purpose: แสดงข้อความ user และ system
- Variants: own, other, system
- States: normal; ยังไม่มี sending/failed ใน code ปัจจุบัน
- Usage rules: ไม่ควรแสดง protocol message เช่น `ROOM_CHANGE` เป็นข้อความปกติ
- Accessibility notes: ถ้าเพิ่ม `aria-live` ต้องไม่ announce ซ้ำมากเกินไป

### Message List

- Purpose: แสดง chat history
- Variants: active, empty, disconnected
- States ที่ควรเพิ่มจาก debt ปัจจุบัน: empty, reconnecting/disconnected
- Usage rules: แยก active user/status ออกจาก message list ถ้าเปลี่ยน protocol ได้
- Accessibility notes: ใช้ semantic region และ label ให้ชัด

### Card / Panel

- Purpose: join container, status bar, video panel, chat panel
- Variants: form panel, status panel, chat panel
- States: normal; selected ไม่ได้ใช้ใน card ปัจจุบัน
- Usage rules: ไม่ควรซ้อน card หลายชั้นเกินจำเป็น
- Accessibility notes: ถ้า panel เป็น interactive ต้องใช้ button/link semantics

### Notice

- Purpose: no-room, inline validation, connection error
- Variants: info, warning, error
- States: visible/hidden
- Usage rules: ใช้แทน `alert()` สำหรับ error ที่แก้ได้ในหน้าเดิม
- Accessibility notes: ใช้ text ชัดเจน และถ้าเป็น error สำคัญควรประกาศด้วย live region

### Loading State

- Purpose: create room, random join, WebSocket connection
- Variants: button label, inline status
- States: loading, success, failed
- Usage rules: มี text ประกอบเสมอ ไม่ใช้ animation อย่างเดียว
- Accessibility notes: loading text ต้องอ่านได้ด้วย screen reader

### Empty State

- Purpose: no available room, empty chat
- Variants: no-room, no-message
- States: actionable/passive
- Usage rules: ให้ next action เช่น เปลี่ยน transport หรือรอ driver สร้างห้อง
- Accessibility notes: หลีกเลี่ยงการสื่อสารด้วยสีอย่างเดียว

## 7. UX Improvement Plan

### High Priority

- ทำ frontend/backend timer ให้ตรงกัน
- เพิ่ม responsive layout สำหรับ join form, transport buttons, chat room
- เปลี่ยน `alert()` เป็น inline error/notice
- เพิ่ม WebSocket connection state
- เพิ่มปุ่มหรือ UI สำหรับ `/return` ถ้ายังใช้ feature นี้
- เปลี่ยน leave chat จาก reload เป็นปิด socket และ reset state

### Medium Priority

- สร้าง reusable Button/Input/Notice/ChatBubble
- ย้ายสี hardcoded ไป Tailwind theme
- standardize label casing เช่น `send`, `TIME REMAINING`, `user seat`
- เพิ่ม empty chat state
- แยก active users/timer/status ออกจาก message string
- เลือกวิดีโอจาก transport type แทน capacity ถ้าต้องรองรับ type เพิ่ม

### Low Priority

- เพิ่ม transition เล็กน้อยให้ selected state และ new message
- ปรับ copy ภาษาอังกฤษให้สม่ำเสมอ
- จัด asset ที่ไม่ถูกใช้ เช่น `lanprajom.png`
- เพิ่ม brand polish หลังจาก flow หลักนิ่งแล้ว

## 8. Visual Direction Recommendation

ข้อเสนอจาก UI ปัจจุบัน:

- รักษาแนว transport/KMITL ที่มีจากชื่อแอป metadata และ asset
- ใช้ครีม/น้ำตาลเป็นพื้นของหน้า join เพราะมี token อยู่แล้ว
- ใช้ฟ้า/เทาใน chat room ต่อได้ เพราะมี hardcoded UI อยู่แล้ว แต่ควรย้ายเป็น token
- ใช้ amber สำหรับ action ที่เกี่ยวกับ create/send ตามปัจจุบัน
- ลดการเพิ่ม visual effect ใหม่ เพราะ asset วิดีโอและภาพประกอบมีอยู่แล้ว
- ทำ hierarchy ให้ชัดขึ้นด้วย spacing, font size, และ component consistency มากกว่าการเพิ่มสีใหม่

ควรหลีกเลี่ยง:

- สีใหม่ที่ไม่ผูกกับ token
- gradient/effect ที่ไม่มีอยู่ในระบบ
- hierarchy ที่ทำให้ room status, seat count หรือ error ถูกกลบ
- component style หลายแบบสำหรับ action เดียวกัน

## 9. Responsive Design Rules

### Desktop

- รักษา chat layout แบบสองคอลัมน์ได้
- status bar อยู่ด้านบน
- video และ chat panel ควรมีความสูงที่ควบคุมได้
- transport buttons อยู่แถวเดียวได้ถ้าพื้นที่พอ

### Tablet

- ถ้าความกว้างไม่พอให้ลดความกว้าง video หรือ stack layout
- transport buttons ควร wrap เป็น 2 คอลัมน์
- username/role row ควรตรวจไม่ให้ input แคบเกินไป

### Mobile

- stack layout เป็นแนวตั้ง
- username input กับ role selector แยกบรรทัด
- transport buttons เป็น 2x2 grid หรือ list
- video ควรอยู่เหนือ chat หรือย่อเป็น status/media block
- chat input ควรอยู่ใกล้ท้ายจอและกดง่าย
- หลีกเลี่ยง `h-[calc(100vh-200px)]` ถ้าทำให้ scroll ยาก

## 10. Accessibility Checklist

- Text contrast: ตรวจสี brown on cream และ gray on blue-gray
- Keyboard navigation: button/input ทุกตัวต้อง tab ได้
- Focus states: เพิ่ม focus ring ชัดให้ role/transport/send/create/leave
- Input labels: เพิ่ม label สำหรับ username, room name, chat message
- Button labels: ปุ่มต้องมี text ชัดเจน ถ้าเป็น icon-only ต้องมี `aria-label`
- ARIA only where useful: ใช้ semantic HTML ก่อน แล้วค่อยเพิ่ม `aria-live` สำหรับ chat/connection status
- Error messages: แสดง inline ใกล้ field/action ที่ error
- Semantic HTML: ใช้ form/section/main ตามโครงสร้างจริง
- Video: เพิ่ม fallback text หรือ accessible label; ถ้า autoplay มีผลต่อผู้ใช้ควรพิจารณา controls/reduced-motion

## 11. Design Debt

รายการนี้อ้างอิงจากโค้ด/UI ที่พบจริง:

- chat layout ไม่มี responsive breakpoint
- frontend timer 120 วินาที ไม่ตรงกับ backend timer 180 วินาที
- สี hardcoded อยู่หลายจุดใน JSX
- typography ownership ไม่ชัด เพราะโหลด Geist แต่ override ด้วย `MyCustomFont`
- input ไม่มี label
- error ใช้ `alert()` หลายจุด
- empty state มีเฉพาะ no-room ของ passenger
- ไม่มี WebSocket connection state
- `ped_pong` และ `/return` ไม่ discoverable ใน UI
- ยังไม่มี reusable Button/Input/ChatBubble components
- มี unused imports/state/props บางส่วน
- active user data ใช้ string parsing

## 12. Recommended Design Roadmap

### Phase 1: Stabilize UI

- sync timer frontend/backend
- เพิ่ม inline error
- เพิ่ม socket connection state
- เปลี่ยน leave chat เป็น socket close + state reset
- เพิ่ม responsive rule ให้ chat room และ join form

### Phase 2: Create Design Tokens

- ย้าย `#6D81A9`, `#E4E9F3`, `#D9D9D9` เข้า Tailwind theme
- จัด token สำหรับ action colors ที่ใช้จริง
- กำหนด spacing/radius/shadow จาก class ที่ใช้ซ้ำ
- ตัดสินใจเรื่อง primary font

### Phase 3: Refactor Components

- สร้าง Button, Input, Notice, ChatBubble, MessageList
- ลด class ซ้ำใน `JoinChat.js`, `TransportButtons.js`, `TypeUser.js`, `ChatRoom.js`
- ลบ unused imports/props/state
- แยก protocol constants เช่น `ROOM_CHANGE`, `Active users`

### Phase 4: Improve User Flow

- เพิ่มปุ่ม return จาก `ped_pong` ถ้า backend feature นี้ยังต้องใช้
- เพิ่ม empty chat state
- เพิ่ม no-room next action ที่ชัดขึ้น
- แยก active user/seat/timer ออกจาก chat message stream

### Phase 5: Add Brand Polish

- standardize ชื่อ product ที่แสดงใน UI
- ตรวจ asset ที่ใช้/ไม่ใช้
- เพิ่ม micro-interaction เฉพาะจุดหลังจาก flow หลักเสถียร
- ปรับ copy ให้สอดคล้องกันทั้ง join/chat/error
