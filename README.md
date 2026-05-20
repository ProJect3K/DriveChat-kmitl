# DRIVECHAT@kmitl

**REQUIREMENT**

  1. python 3.13.0 https://www.python.org/downloads/release/python-3130 แล้วเลือก Windows installer (64-bit)
  2. node.js 20.18.0 https://nodejs.org/en/download/prebuilt-installer แล้วเลือก v20.18.0(LTS), Windows, x64

  # Link Website

  https://drivechat.it22.dev/

# LOCALHOST

## CLONE GIT

**จะใช้ terminal หรือ Github Desktop ในการ Clone ก็ได้**

``` bash
  git clone https://github.com/ProJect3K/DriveChat-kmitl.git
```

## CREATE .VENV

  - New Terminal

    ![](https://drive.google.com/uc?export=view&id=1gwGcJBp5f_Q9fQ0luyI69tcrecogdFR_)

  - กดลูกศรชี้ลง มุมขวาล่างของจอ

    ![](https://drive.google.com/uc?export=view&id=1B8eIcyHWJNJxQoNWKPMcW4pgO45LwGoE)

  - เลือก Command Prompt

    ![](https://drive.google.com/uc?export=view&id=1VflNrATWNsp8vaRnsAH2XxBQJqHTjuw1)

  - สร้าง .venv

    ``` bash
    py -m venv .venv
    ```

  - Activate .venv

    ``` bash
    .venv\Scripts\activate
    ```

## INSTALL

  - Install package

    ``` bash
    pip install -r requirements.txt && cd drch && npm install
    ```

## SELECT INTERPRETER

  - Ctrl + Shift + P

    ![](https://drive.google.com/uc?export=view&id=1uB3I4gi5m80Bfia36MAJUrMvB6AcxGHg)

  - พิมพ์ว่า python select interpreter แล้ว Enter

    ![](https://drive.google.com/uc?export=view&id=1ww6wB2unkBgW9OUZvmnFc8LgLmU8piaj)

  - เลือก Python 3.13.0 ('.venv':venv)

## RUN

  - เข้า folder drch

  ``` bash
  cd drch
  ```

  - run server & website

  ``` bash
  npm run dev:both
  ```

# CREDIT
  | **NAME**  |  **SURNAME**    | **ID**   |
  |-----------|-----------------|----------|
  | THANATPAT | PROMTHONG       | 67070069 |
  | WARAKON   | TANGCHAROENARRI | 67070157 |
  | VARAPORN  | SUKMUANG        | 67070159 |
  | WARITSARA | SENACHAIBAN     | 67070160 |
  | ATHIKARN  | CHINJIRATTIKAN  | 67070194 |

# DEPLOYMENT NOTES

This repository has a Next.js frontend in `drch/` and a FastAPI backend in `main.py`.

## Local environment examples

Frontend variables live in `drch/.env.local` and are documented in `drch/.env.example`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_WS_BASE_URL=ws://127.0.0.1:8000
```

Backend variables can be set in the shell or hosting dashboard and are documented in root `.env.example`:

```bash
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ENVIRONMENT=development
```

## Vercel frontend

- Root Directory: `drch`
- Framework Preset: Next.js
- Install Command: default `npm install`
- Build Command: `npm run build`
- Output Directory: default
- Required Vercel environment variables:
  - `NEXT_PUBLIC_API_BASE_URL=https://<backend-host>`
  - `NEXT_PUBLIC_WS_BASE_URL=wss://<backend-host>`

## Backend hosting

The current backend uses FastAPI WebSockets, so it should run on a long-running ASGI host instead of Vercel Functions.

Recommended default backend deployment:

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set backend production variables on that host:

```bash
ALLOWED_ORIGINS=https://<vercel-project>.vercel.app,https://<custom-domain>
ENVIRONMENT=production
```

Do not use `ALLOWED_ORIGINS=*` in production; `main.py` rejects wildcard CORS when `ENVIRONMENT=production`.
