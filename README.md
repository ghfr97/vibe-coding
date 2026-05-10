# Vibe-Coding API

Aplikasi ini adalah sebuah RESTful API untuk sistem autentikasi dan manajemen user (User Registration, Login, Get Current User, Logout). Aplikasi ini dibangun dengan performa tinggi menggunakan Bun, ElysiaJS, dan Drizzle ORM dengan database MySQL.

## 🏗️ Arsitektur & Struktur Folder

Proyek ini menggunakan struktur yang terorganisir untuk memisahkan antara routing, business logic, dan akses database.

```text
vibe-coding/
├── src/
│   ├── db/            # Konfigurasi database dan definisi schema Drizzle
│   │   └── schema.ts  # Definisi tabel (users, sessions)
│   ├── routes/        # Definisi API endpoints (Elysia routing)
│   │   └── users-route.ts
│   ├── services/      # Business logic (handling register, login, validasi)
│   │   └── users-service.ts
│   ├── index.ts / server.ts # Entry point aplikasi
├── tests/             # Unit testing (menggunakan Bun Test)
├── drizzle/           # Direktori hasil generate migration Drizzle
├── package.json       # Informasi project, scripts, dan dependencies
├── drizzle.config.ts  # Konfigurasi Drizzle ORM
└── tsconfig.json      # Konfigurasi TypeScript
```

## 🛠️ Technology Stack & Library

- **Runtime:** [Bun](https://bun.sh/) (Cepat dan sudah built-in test runner)
- **Framework:** [ElysiaJS](https://elysiajs.com/) (Web framework TypeScript yang sangat cepat)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) (Type-safe ORM)
- **Database:** MySQL
- **Dependencies Utama:** `drizzle-orm`, `elysia`, `mysql2`
- **Dev Dependencies Utama:** `bun`, `drizzle-kit`, `typescript`

## 🗄️ Schema Database

Aplikasi ini menggunakan dua tabel utama:

1. **`users`**
   - `id`: `serial` (Primary Key)
   - `name`: `varchar(255)` (Not Null)
   - `email`: `varchar(255)` (Not Null, Unique)
   - `password`: `varchar(255)` (Not Null - *Hashed*)
   - `createdAt`: `timestamp` (Default Current Time)

2. **`sessions`**
   - `id`: `serial` (Primary Key)
   - `token`: `varchar(255)` (Not Null - *Digunakan untuk bearer token*)
   - `userId`: `bigint` (References `users.id`, Unsigned)

## 🌐 API Endpoints Tersedia

Semua endpoint memiliki prefix `/api/users`.

### 1. Register User
- **URL:** `POST /api/users/register`
- **Body JSON:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123" // Min 6 chars
  }
  ```
- **Response Sukses (200):** `{ "data": "OK" }`

### 2. Login User
- **URL:** `POST /api/users/login`
- **Body JSON:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response Sukses (200):** `{ "data": { "token": "uuid-token-string" } }`

### 3. Get Current User
- **URL:** `GET /api/users/current`
- **Headers:** `Authorization: Bearer <token>`
- **Response Sukses (200):** `{ "data": { "name": "John Doe", "email": "john@example.com" } }`

### 4. Logout User
- **URL:** `DELETE /api/users/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Response Sukses (200):** `{ "data": "ok" }`

## 🚀 Cara Setup Project

1. **Clone repository ini**
2. **Install semua dependencies**
   ```bash
   bun install
   ```
3. **Konfigurasi Environment Variable**
   Buat file `.env` di root direktori dan sesuaikan dengan kredensial database MySQL Anda:
   ```env
   DATABASE_URL=mysql://root:password@localhost:3306/vibe_coding
   ```
4. **Generate & Push Database Schema**
   Jalankan perintah berikut agar Drizzle membuat tabel yang sesuai di database:
   ```bash
   bun run db:generate
   bun run db:push
   ```

## 🏃 Cara Run Aplikasi

Jalankan aplikasi di mode development (dengan auto-reload):

```bash
bun run dev
```

Aplikasi akan berjalan (secara default biasanya di port 3000, tergantung konfigurasi `src/server.ts`).

## 🧪 Cara Test Aplikasi

Proyek ini menggunakan `bun test` untuk automated unit testing.
Untuk menjalankan seluruh test suite:

```bash
bun test
```
Ini akan mengeksekusi semua file test yang ada di dalam folder `tests/`.
