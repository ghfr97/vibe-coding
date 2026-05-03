import { describe, it, expect, beforeEach } from 'bun:test';
import { app } from '../src/index';
import { db } from '../src/db';
import { users, sessions } from '../src/db/schema';

// Helper untuk mempermudah request dalam test
const jsonRequest = (path: string, method: string, body?: any, token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
};

describe('Users API', () => {
  beforeEach(async () => {
    // Reset database sebelum setiap test agar state konsisten
    await db.delete(sessions);
    await db.delete(users);
  });

  describe('POST /api/users/register', () => {
    it('harus berhasil mendaftarkan user baru dengan data valid', async () => {
      const res = await app.handle(
        jsonRequest('/api/users/register', 'POST', {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBe('OK');
    });

    it('harus gagal jika email sudah terdaftar', async () => {
      // User pertama
      await app.handle(
        jsonRequest('/api/users/register', 'POST', {
          name: 'User 1',
          email: 'duplicate@example.com',
          password: 'password123'
        })
      );

      // User kedua dengan email sama
      const res = await app.handle(
        jsonRequest('/api/users/register', 'POST', {
          name: 'User 2',
          email: 'duplicate@example.com',
          password: 'password123'
        })
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Email sudah terdaftar');
    });

    it('harus gagal jika input melebihi 255 karakter (Validasi Skema)', async () => {
      const res = await app.handle(
        jsonRequest('/api/users/register', 'POST', {
          name: 'a'.repeat(256),
          email: 'test@example.com',
          password: 'password123'
        })
      );

      // Elysia mengembalikan 422 untuk error validasi skema
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await app.handle(
        jsonRequest('/api/users/register', 'POST', {
          name: 'Login User',
          email: 'login@example.com',
          password: 'password123'
        })
      );
    });

    it('harus mendapatkan token jika kredensial benar', async () => {
      const res = await app.handle(
        jsonRequest('/api/users/login', 'POST', {
          email: 'login@example.com',
          password: 'password123'
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.token).toBeDefined();
    });

    it('harus gagal jika password salah', async () => {
      const res = await app.handle(
        jsonRequest('/api/users/login', 'POST', {
          email: 'login@example.com',
          password: 'wrongpassword'
        })
      );

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Email atau password salah');
    });
  });

  describe('Fitur Terproteksi (Auth Required)', () => {
    let token: string;

    beforeEach(async () => {
      // Setup user dan dapatkan token
      await app.handle(
        jsonRequest('/api/users/register', 'POST', {
          name: 'Auth User',
          email: 'auth@example.com',
          password: 'password123'
        })
      );

      const loginRes = await app.handle(
        jsonRequest('/api/users/login', 'POST', {
          email: 'auth@example.com',
          password: 'password123'
        })
      );
      
      const body = await loginRes.json();
      token = body.data.token;
    });

    it('harus bisa mengambil profil user sendiri dengan token valid', async () => {
      const res = await app.handle(
        jsonRequest('/api/users/current', 'GET', undefined, token)
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.email).toBe('auth@example.com');
      expect(body.data.name).toBe('Auth User');
    });

    it('harus gagal mengakses profil jika tanpa token', async () => {
      const res = await app.handle(
        jsonRequest('/api/users/current', 'GET')
      );

      expect(res.status).toBe(401);
    });

    it('harus berhasil logout dan menghapus sesi', async () => {
      // Logout
      const logoutRes = await app.handle(
        jsonRequest('/api/users/logout', 'DELETE', undefined, token)
      );
      expect(logoutRes.status).toBe(200);

      // Pastikan token sudah tidak valid setelah logout
      const currentRes = await app.handle(
        jsonRequest('/api/users/current', 'GET', undefined, token)
      );
      expect(currentRes.status).toBe(401);
    });
  });
});
