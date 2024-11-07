# DRIVECHAT@kmitl

**REQUIREMENT**

  1. python 3.13.0 https://www.python.org/downloads/release/python-3130 แล้วเลือก Windows installer (64-bit)
  2. node.js 20.18.0 https://nodejs.org/en/download/prebuilt-installer แล้วเลือก v20.18.0(LTS), Windows, x64

# LOCALHOST

## CLONE GIT

**จะใช้ terminal หรือ Github Desktop ในการ Clone ก็ได้**

``` bash
  git clone https://github.com/ProJect3K/DEMO-DriveChat-kmitl.git
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
